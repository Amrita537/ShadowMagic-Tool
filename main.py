# main function entrance
import eel 
import os
import aiohttp
import base64
import numpy as np
import io
import asyncio
import requests
import json
import shutil
import random
import subprocess
import re
import argparse
import time
from skimage.morphology import skeletonize
from random import randint
from tools.files import open_psd, get_file_name, add_alpha_all, add_alpha_flat, add_alpha_line, decrease_shadow_gaussian
from yolov5.segment.predict import run as seg
from yoloresult import main as to_json
from PIL import Image
from CropShadow import get_sub_shadow
from tqdm import tqdm
from zipfile import ZipFile


# path that saves preprocessed files
PATH_TO_PREPROCESS = './preprocessed/'
PATH_TO_PSD = './batch_input/'

# path to save files that under processing
PATH_TO_FLAT = './InputFlats'
PATH_TO_LINE = './InputLines'
PATH_TO_SHADOW = './web/Shadows'
PATH_TO_SHADOWS = './web/Shadows/sub_shadows'
# PATH_TO_REFINEDJSON= "./web/RefinedOutput/json"
PATH_TO_REFINEDJSON= "./web/RefinedOutput/Unmerged_json"
PATH_TO_SEGS = []
PATH_TO_JSON = False
PATH_TO_TEMP = "./temp"
DIRS = ['left', 'right', "top", "back"]
PATH_TO_LAYERS = './web/InputFlats'
ARGS = None
# intermediate shadows
SHADOWS = {}

'''
exposed functions
'''
@eel.expose
def get_port():
    assert ARGS is not None
    return ARGS.port_to_backend

@eel.expose
def open_psd_as_binary(psd_data, psd_name):
    SHADOWS = {}
    if os.path.exists(PATH_TO_TEMP) == False:
        os.makedirs(PATH_TO_TEMP)
    psd_dict = re.match("data:(?P<type>.*?);(?P<encoding>.*?),(?P<data>.*)", psd_data).groupdict()
    psd_data_binary = base64.b64decode(psd_dict['data'])
    with open(os.path.join(PATH_TO_TEMP, psd_name), 'wb') as f:
        f.write(psd_data_binary)
    open_psd_single(os.path.join(PATH_TO_TEMP, psd_name))
    eel.updatePSDSelect(psd_name)

@eel.expose
def batch_process(path_to_psds = PATH_TO_PSD, var = 20):
    for psd in tqdm(os.listdir(path_to_psds)):
        if ".psd" not in psd: continue
        print("log:\topen %s"%psd)
        # check extracted files
        name = get_file_name(psd)
        open_psd_single(os.path.join(path_to_psds, psd), var = var, seg_only = True)

@eel.expose
def shadow_decrease(res_dict, reset = False):
    res = {}
    shadow_masks = {}
    shadow_merged = None
    skip = False
    # convert shadow into shadow map and merge all shadows into one image
    for label in res_dict:
        if 'line' in label: continue
        # this is a really bad logic...
        if label in SHADOWS:
            if (SHADOWS[label][1]+1) < len(SHADOWS[label][0]):
                skip = True
        if 'line' in label: continue
        shadow = base64_to_np(res_dict[label])
        h, w = shadow.shape[0], shadow.shape[1]
        if shadow_merged is None:
            shadow_merged = np.zeros((h, w)).astype(bool)
        if len(shadow.shape) == 3 and shadow.shape[-1] == 3:
            shadow = shadow.mean(axis = -1)
        elif len(shadow.shape) == 3 and shadow.shape[-1] == 4:
            shadow = 255 - shadow[..., -1]
        assert len(shadow.shape) == 2
        # convert to binary map
        shadow_mask = (shadow == 0)
        shadow_masks[label] = shadow_mask
        shadow_merged[shadow_mask] = True

    if skip:
        for label in res_dict:
            if 'line' in label:continue
            res[label] = SHADOWS[label][0][SHADOWS[label][1]]
            SHADOWS[label][1] += 1
    else:
        # convert line to line map
        line_base64 = res_dict["line"]
        line = base64_to_np(line_base64)
        if len(line.shape) == 3 and line.shape[-1] == 3:
            line = line.mean(axis = -1)
        if len(line.shape) == 3 and line.shape[-1] == 4:
            line = 255 - line[..., -1]
        line = line == 0
        # line = line & shadow_merged
        # line_skel = skeletonize(line)
        line[0,:] = True
        line[-1,:] = True
        line[:, 0] = True
        line[:, -1] = True

        shadow_conv = shadow_decrease_single(shadow_merged, line)
        
        # split the result based on each label
        for label in shadow_masks:
            shadow_conv_ = shadow_conv.copy()
            shadow_conv_[~shadow_masks[label]] = 0
            shadow_res = to_shadow_img(shadow_conv_)
            res[label] = shadow_res
            if label in SHADOWS:
                SHADOWS[label][0].append(shadow_res)
                SHADOWS[label][1] += 1
            else:
                SHADOWS[label] = [[shadow_res], 0]
        # end = time.time()
        # print("log:\tdecrease shadow operation finished with %.2f seconds"%(end - start))
        # call back function for updating shadow result
    eel.UpdataShadow(res)

@eel.expose
def shadow_increase(res_dict):
    res = {}
    for region_label in res_dict:
        # open shadow
        shadow_np = base64_to_np(res_dict[region_label])
        if region_label in SHADOWS:
            if SHADOWS[region_label][1] > 0:
                SHADOWS[region_label][1] -= 1
                res[region_label] = SHADOWS[region_label][0][SHADOWS[region_label][1]]
            else:
                res[region_label] = res_dict[region_label]
    eel.UpdataShadow(res)

@eel.expose
def get_subshadow_by_label(img, label, name):
    '''
    Given, 
        img, a image in base64 coding format
        lable, a string indicates the region label
        name, a string of the openned image name (without extensions) 
    Return,
        res, subshadow in base64 coding format.
    '''
    # Load JSON data
    path_to_json = os.path.join(PATH_TO_REFINEDJSON, name+'_flat.json')
    with open(path_to_json, 'r') as json_file:
        data = json.load(json_file)

    # load image
    img_binary = base64.b64decode(img)
    img = Image.open(io.BytesIO(img_binary))
    regions_by_label = group_regions_by_label(data)
    return array_to_base64(get_sub_shadow(img, label, regions_by_label, to_png = False))

'''
Helper functions
''' 
def preprocess(path_to_psd, name, var, seg_only = False):
    # print("log:\tpredicting shadowing and segmentation result for %s"%path_to_psd)
    # test if this image has been processed
    global PATH_TO_JSON
    PATH_TO_JSON = None
    open_psd(path_to_psd, PATH_TO_PREPROCESS)
    
    if seg_only == False:
        # open extracted pngs
        flat = np.array(Image.open(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png")))
        # add white backgournd if flat has alpha channel
        if flat.shape[-1] == 4:
            bg = np.ones((flat.shape[0], flat.shape[1], 3)) * 255
            alpha = flat[..., -1][..., np.newaxis] / 255
            rgb = flat[..., 0:3]
            flat = (rgb * alpha + bg * (1 - alpha)).astype(np.uint8)
        else:
            Image.fromarray(add_alpha_flat(flat)).save(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png"))

        line = np.array(Image.open(os.path.join(PATH_TO_PREPROCESS, name+"_line.png")))
        line_to_save = line.copy()
        need_add_alpha = False
        if line.shape[-1] == 4:
            if len(np.unique(line[..., -1])) != 1:
                line = np.repeat((255 - line[..., -1])[..., np.newaxis], 3, axis = -1)
            else:
                line = line[..., 0:3]
                line_to_save = line.copy()
                need_add_alpha = True
        else:
            need_add_alpha = True
        
        if need_add_alpha:
            Image.fromarray(add_alpha_line(line_to_save)).save(os.path.join(PATH_TO_PREPROCESS, name+"_line.png"))

        color = flat * (line.mean(axis = -1) / 255)[..., np.newaxis]
        # for output testing examples for comparison experiment
        # Image.fromarray(color.astype(np.uint8)).save(os.path.join("./experiments/test_input", name+"_color.png"))
        # Image.fromarray(line.astype(np.uint8)).save(os.path.join("./experiments/test_input", name+"_line.png"))
        # Image.fromarray(flat.astype(np.uint8)).save(os.path.join("./experiments/test_input", name+"_flat.png"))
        # return None

        # get shadows
        pbar = tqdm(total=len(DIRS) * var)
        for direction in DIRS:
            pbar.set_description("Predicting shadow for %s" %name)
            url = "http://127.0.0.1:%d/shadowsingle"%int(ARGS.port_to_backend)
            data_send = {}
            data_send['user'] = 'userA'
            data_send['direction'] = direction
            data_send['name'] = name
            data_send['flat'] = array_to_base64(flat)
            data_send['line'] = array_to_base64(line)
            data_send['color'] = array_to_base64(color.astype(np.uint8))
            
            for i in range(var):
                # print("log:\tpredicting #%d shadow from direction %s"%(i, direction))
                resp = requests.post(url=url, data=json.dumps(data_send), timeout=5000)
                resp = resp.json()
                shadow = np.array(to_pil(resp['shadow_0']))
                # add alpha channel to shadow output
                alpha = np.zeros((shadow.shape[0], shadow.shape[1]))
                alpha[shadow[..., 0] == 0] = 255
                shadow = np.concatenate((shadow, alpha[..., np.newaxis]), axis = -1)
                Image.fromarray(shadow.astype(np.uint8)).save(os.path.join(PATH_TO_PREPROCESS, name + "_" + direction + "_shadow_%d.png"%i))
                pbar.update(1)
        pbar.close()

    # get the segmentation result
    # a dirty fix for the path issue...
    for f in os.listdir(PATH_TO_FLAT):
        delete_item(os.path.join(PATH_TO_FLAT, f))
    shutil.copy(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png"), os.path.join(PATH_TO_FLAT, name+"_flat.png"))
    
    # a dirty fix for clean all existing prediction results
    for f in os.listdir(PATH_TO_SHADOW):
        delete_item(os.path.join(PATH_TO_SHADOW, f))
    seg_path_cleanup()

    if seg_only == False:
        # find all shadowing results
        shadows = []
        for img in os.listdir(PATH_TO_PREPROCESS):
            if name not in img or 'shadow' not in img or 'png' not in img: continue
            shadows.append(img)
            shutil.copy(os.path.join(PATH_TO_PREPROCESS, img), os.path.join(PATH_TO_SHADOW, img))
        shutil.make_archive(os.path.join(PATH_TO_PREPROCESS, name+"_shadows"),
            'zip',
            PATH_TO_SHADOW)
        for img in shadows:
            os.remove(os.path.join(PATH_TO_PREPROCESS, img))
        assert len(shadows) == len(DIRS) * var
    
    segment_single(name)

    # copy segmentation result to preprocess folder
    shutil.make_archive(os.path.join(PATH_TO_PREPROCESS, name+"_AnnotOutput"), 
        'zip', 
        './AnnotOutput')
    shutil.make_archive(os.path.join(PATH_TO_PREPROCESS, name+"_YoloOutput"), 
        'zip', 
        './YoloOutput')
    shutil.make_archive(os.path.join(PATH_TO_PREPROCESS, name+"_RefinedOutput"), 
        'zip', 
        './web/RefinedOutput')
    shutil.make_archive(os.path.join(PATH_TO_PREPROCESS, name+"_sub_shadows"), 
        'zip', 
        PATH_TO_SHADOWS)

def preprocess_to_work(fname):
    print("log:\tpreparing shadowing result for %s"%fname)
    # clean up all files in the working folder
    for f in os.listdir(PATH_TO_LAYERS):
        delete_item(os.path.join(PATH_TO_LAYERS, f))
    # for f in os.listdir(PATH_TO_LINE):
    #     delete_item(os.path.join(PATH_TO_LINE, f))
    for f in os.listdir(PATH_TO_SHADOW):
        delete_item(os.path.join(PATH_TO_SHADOW, f))
    
    # unzip the segementation result to working folder
    seg_path_cleanup()
    shutil.unpack_archive(os.path.join(PATH_TO_PREPROCESS, fname+"_AnnotOutput.zip"), "./AnnotOutput")
    shutil.unpack_archive(os.path.join(PATH_TO_PREPROCESS, fname+"_YoloOutput.zip"), "./YoloOutput")
    shutil.unpack_archive(os.path.join(PATH_TO_PREPROCESS, fname+"_RefinedOutput.zip"), "./web/RefinedOutput")
    shutil.unpack_archive(os.path.join(PATH_TO_PREPROCESS, fname+"_sub_shadows.zip"), "./web/Shadows/sub_shadows")
    shutil.unpack_archive(os.path.join(PATH_TO_PREPROCESS, fname+"_shadows.zip"), "./web/Shadows")

    # copy the preprocessed result to
    if os.path.exists(PATH_TO_LAYERS) == False:
        os.makedirs(PATH_TO_LAYERS)
    shutil.copy(os.path.join(PATH_TO_PREPROCESS, fname+"_flat.png"), os.path.join(PATH_TO_LAYERS, fname+"_flat.png"))
    shutil.copy(os.path.join(PATH_TO_PREPROCESS, fname+"_line.png"), os.path.join(PATH_TO_LAYERS, fname+"_line.png"))

def delete_item(path_to_item):
    try:
        if os.path.isdir(path_to_item):
            shutil.rmtree(path_to_item)
        elif os.path.isfile(path_to_item):
            os.remove(path_to_item)
        else:
            print("warning:\tcan't delete %s"%path_to_item)
    except:
        pass

def seg_path_cleanup():
    predict_path = "./yolov5/runs/predict-seg"
    delete_item(predict_path)
    delete_item("./YoloOutput")
    delete_item("./AnnotOutput")
    delete_item("./web/RefinedOutput")
    delete_item(PATH_TO_SHADOWS)

def segment_single(img_name, sub_shadow = True):
    # init parameters
    global PATH_TO_JSON
    infere_size = 320
    weights_path = "./yolov5/runs/train-seg/exp10/weights/best.pt"
    source_path = os.path.join(PATH_TO_PREPROCESS, img_name+"_flat.png")
    assert os.path.exists(source_path)

    # segment flat layer
    path_to_label = seg(
        weights=weights_path,  # model.pt path(s)
        source=source_path,  # file/dir/URL/glob/screen/0(webcam)
        imgsz=(infere_size, infere_size),  # inference size (height, width)
        save_txt=True,  # save results to *.txt
        save_conf=True,  # save confidences in --save-txt labels
        )

    # predict label to json file
    to_json(
        image_path = PATH_TO_FLAT, 
        yolo_txt_path = path_to_label
        )

    # generate sub-shadows
    if sub_shadow:
        CallCropShadow_py(img_name)

def array_to_base64(array):
    '''
    A helper function to convert numpy array to png in base64 format
    '''
    with io.BytesIO() as output:
        if type(array) == np.ndarray:
            Image.fromarray(array).save(output, format='png')
        else:
            array.save(output, format='png')
        img = output.getvalue()
    img = base64.encodebytes(img).decode("utf-8")
    return img

def to_pil(byte):
    '''
    A helper function to convert byte png to PIL.Image
    '''
    byte = base64.b64decode(byte)
    return Image.open(io.BytesIO(byte)).convert("RGB")

def CallCropShadow_py(filename):
    JSON_FILE_PATH= PATH_TO_REFINEDJSON+"/"+filename+'_flat.json'
    command = f"python CropShadow.py {PATH_TO_SHADOW} {JSON_FILE_PATH} {PATH_TO_SHADOWS} {filename}"
    print('%s'%command)
    subprocess.run(command, shell=True)

def to_shadow_img(shadow):
    shadow = (~(shadow >= 0.9)).astype(int) * 255
    shadow = add_alpha_line(shadow)
    shadow = Image.fromarray(shadow)
    b = io.BytesIO()
    shadow.save(b, 'png')
    return to_base64url(base64.encodebytes(b.getvalue()).decode("utf-8"))
    
def open_psd_single(path_to_psd, var = 4, seg_only = False):
    # extract png images from psd files
    name = get_file_name(path_to_psd)
    if (os.path.exists(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png")) and seg_only == False):
        try:
            preprocess_to_work(name)
        except Exception as e:
            print(str(e))
            preprocess(path_to_psd, name, var)
            preprocess_to_work(name)
    else:
        preprocess(path_to_psd, name, var, seg_only)
        preprocess_to_work(name)
    # preprocess(path_to_psd, name, var, seg_only)

def base64_to_np(img_base64):
    try:
        img_dict = re.match("data:(?P<type>.*?);(?P<encoding>.*?),(?P<data>.*)", img_base64).groupdict()
        img_binary = base64.b64decode(img_dict['data'])
        img = np.array(Image.open(io.BytesIO(img_binary)))
    except:
        _, img_binary = img_base64.split(',', 1)
        img_binary = base64.b64decode(img_binary)
        img = np.array(Image.open(io.BytesIO(img_binary)))
    return img

def to_base64url(img_base64):
    return f'data:image/png;base64,{img_base64}'

def shadow_decrease_single(shadow, line):
    bg_mask = ~shadow
    # decrease line
    shadow_conv = decrease_shadow_gaussian(shadow.astype(float), line, bg_mask)
    return shadow_conv

if __name__ == "__main__":
    # for debug
    # open_psd("./test/image7.psd")
    # batch_process()
    # import pdb
    # pdb.set_trace()
    
    # for png in os.listdir(PATH_TO_PREPROCESS):
    #     if "flat" not in png: continue
    #     flat = np.array(Image.open(os.path.join(PATH_TO_PREPROCESS, png)))
    #     line = np.array(Image.open(os.path.join(PATH_TO_PREPROCESS, png.replace("flat", "line"))))
    #     flat, line = add_alpha_all(flat, line)
    #     Image.fromarray(flat).save(os.path.join(PATH_TO_PREPROCESS, png))
    #     Image.fromarray(line).save(os.path.join(PATH_TO_PREPROCESS, png.replace("flat", "line")))
    
    # init
    parser = argparse.ArgumentParser(description='ShadowMagic Ver 0.1')
    parser.add_argument('--port_to_user', type = int, default = 7001)    
    parser.add_argument('--port_to_backend', type = int, default = 8000)
    args = parser.parse_args()
    ARGS = args

    for p in [PATH_TO_PSD, PATH_TO_FLAT, PATH_TO_SHADOW, PATH_TO_SHADOWS, PATH_TO_REFINEDJSON, PATH_TO_TEMP, PATH_TO_LAYERS]:
        if os.path.exists(p) == False:
            os.makedirs(p)

    # start main GUI
    eel.init("web")
    # let's run this code remotely for now
    print("log:\tconnecting backend with port:%d"%int(args.port_to_backend))
    print("log:\tfor remote user: open a web browser to: http://164.90.158.133:%d/GUI2.html"%(8081+int(args.port_to_user)-7001))
    print("log:\tfor local user: open a web browser to: http://127.0.0.1:%d/GUI2.html"%(7001+int(args.port_to_user)-7001))
    # let's make the shotdown delay to 3 days
    eel.start("GUI2.html", mode=False, all_interfaces=True, size = (1400, 800), port = int(args.port_to_user), shutdown_delay = 259200)
