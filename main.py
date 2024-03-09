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
from random import randint
from tools.files import open_psd, get_file_name
from yolov5.segment.predict import run as seg
from yoloresult import main as to_json
from PIL import Image
from tqdm import tqdm

# path that saves preprocessed files
PATH_TO_PREPROCESS = './preprocessed/'

# path to save files that under processing
PATH_TO_FLAT = './InputFlats/'
PATH_TO_LINE = './InputLines/'
PATH_TO_SHADOW = './web/Shadows'
PATH_TO_SHADOWS = './web/Shadows/sub_shadows'
DIRS = ['left', 'right', "top", "back"]


'''
exposed functions
'''
@eel.expose
def save_image_from_base64(base64_string, imageName):
    exp_path = "yolov5/runs/predict-seg/exp"
    Annot_path = "AnnotOutput"
    YoloOutput_path = "YoloOutput"
    Refined_path= "web/RefinedOutput"
    
    byte_data = base64.b64decode(base64_string.split(",")[1])
    image = Image.open(BytesIO(byte_data))

    # Define the directory to save images
    if "flat" in imageName:
        image_path = "InputImages/"+imageName;
        shutil.rmtree(exp_path, ignore_errors=True)
        shutil.rmtree(Annot_path, ignore_errors=True)
        shutil.rmtree(YoloOutput_path, ignore_errors=True)
        shutil.rmtree(Refined_path, ignore_errors=True)

        for file_name in os.listdir("InputImages"):
            if imageName not in file_name:
                os.remove(os.path.join("InputImages", file_name))
    else:
        image_path  = "InputLines/"+imageName;
        

    image.save(image_path, "PNG")

    return "Image saved successfully"

@eel.expose
def open_psd_py(path_to_psd, var = 4):
    # extract png images from psd files
    name = get_file_name(path_to_psd)
    if (os.path.exists(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png"))):
        try:
            preprocess_to_work(name)
        except Exception as e:
            print(str(e))
            preprocess(path_to_psd, name, var)
            preprocess_to_work(name)
    else:
        preprocess(path_to_psd, name, var)
        preprocess_to_work(name)
                
@eel.expose
def batch_process(path_to_psds = './batch_input', var = 20):
    for psd in tqdm(os.listdir(path_to_psds)):
        if ".psd" not in psd: continue
        print("log:\topen %s"%psd)
        # check if this file has been processed
        processed = True
        # check extracted files
        name = get_file_name(psd)
        if os.path.exists(os.path.join(PATH_TO_PREPROCESS, name+"_color.png")) == False: processed = False
        if os.path.exists(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png")) == False: processed = False
        if os.path.exists(os.path.join(PATH_TO_PREPROCESS, name+"_line.png")) == False: processed = False
        for direction in DIRS:
            if processed == False: break
            for i in range(var):
                # check shadows
                if os.path.exists(os.path.join(PATH_TO_SHADOW, 
                    +"_"+ direction + "_shadow_%d.png"%i)) == False: 
                    processed = False
                    break
                # check sub shadows
                pass    
        if processed:continue
        open_psd_py(os.path.join(path_to_psds, psd), var = var)

@eel.expose
def shadow_decrease():
    # todo
    pass

'''
Helper functions
'''
def preprocess(path_to_psd, name, var):
    # test if this image has been processed
    
    # open_psd(path_to_psd, PATH_TO_PREPROCESS)
    # # open extracted pngs
    # flat = np.array(Image.open(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png")))
    # # add white backgournd if flat has alpha channel
    # if flat.shape[-1] == 4:
    #     bg = np.ones((flat.shape[0], flat.shape[1], 3)) * 255
    #     alpha = flat[..., -1][..., np.newaxis] / 255
    #     rgb = flat[..., 0:3]
    #     flat = (rgb * alpha + bg * (1 - alpha)).astype(np.uint8)
    #     Image.fromarray(flat).save(os.path.join(PATH_TO_PREPROCESS, name+"_flat.png"))
    # line = np.array(Image.open(os.path.join(PATH_TO_PREPROCESS, name+"_line.png")))
    # if line.shape[-1] == 4:
    #     if len(np.unique(line[..., -1])) != 1:
    #         line = np.repeat((255 - line[..., -1])[..., np.newaxis], 3, axis = -1)
    #     else:
    #         line = line[..., 0:3]
    # color = flat * (line.mean(axis = -1) / 255)[..., np.newaxis]

    # # get shadows
    # for direction in DIRS:
    #     url = "http://164.90.158.133:8080/shadowsingle"
    #     data_send = {}
    #     data_send['user'] = 'userA'
    #     data_send['direction'] = direction
    #     data_send['name'] = name
    #     data_send['flat'] = array_to_base64(flat)
    #     data_send['line'] = array_to_base64(line)
    #     data_send['color'] = array_to_base64(color.astype(np.uint8))
        
    #     for i in range(var):
    #         resp = requests.post(url=url, data=json.dumps(data_send), timeout=5000)
    #         resp = resp.json()
    #         shadow = to_pil(resp['shadow_0'])
    #         shadow.save(os.path.join(PATH_TO_PREPROCESS, name + "_" + direction + "_shadow_%d.png"%i))

    # get the segmentation result
    segment_single(name)

def preprocess_to_work(fname):
    # clean up all files in the working folder
    for f in os.listdir(PATH_TO_FLAT):
        delete_item(os.path.join(PATH_TO_FLAT, f))
    for f in os.listdir(PATH_TO_LINE):
        delete_item(os.path.join(PATH_TO_FLAT, f))
    for f in os.listdir(PATH_TO_SHADOW):
        delete_item(os.path.join(PATH_TO_SHADOW, f))

    # copy the preprocessed result to 
    shutil.copy(os.path.join(PATH_TO_PREPROCESS, fname+"_flat.png"), os.path.join(PATH_TO_FLAT, fname+"_flat.png"))
    shutil.copy(os.path.join(PATH_TO_PREPROCESS, fname+"_line.png"), os.path.join(PATH_TO_LINE, fname+"_line.png"))
    # search all shadow files
    shadows_top = []
    shadows_back = []
    shadows_left = []
    shadows_right = []
    for s in os.listdir(PATH_TO_PREPROCESS):
        # DIRS = ['left', 'right', "top", "back"]
        if 'fname' in s and 'shadow' in s and DIRS[2] in s:
            shadows_top.append(s)
        if 'fname' in s and 'shadow' in s and DIRS[3] in s:
            shadows_back.append(s)
        if 'fname' in s and 'shadow' in s and DIRS[0] in s:
            shadows_left.append(s)
        if 'fname' in s and 'shadow' in s and DIRS[1] in s:
            shadows_right.append(s)
    assert len(shadows_top) >= 4
    assert len(shadows_back) >= 4
    assert len(shadows_left) >= 4
    assert len(shadows_right) >= 4
    random.shuffle(shadows_top)
    random.shuffle(shadows_back)
    random.shuffle(shadows_left)
    random.shuffle(shadows_right)
    for i in range(4): 
        shutil.copy(os.path.join(PATH_TO_PREPROCESS, shadows_top[i]), os.path.join(PATH_TO_SHADOW, fname+"_%s_shadow_%d"%(DIRS[2], i)))
        shutil.copy(os.path.join(PATH_TO_PREPROCESS, shadows_back[i]), os.path.join(PATH_TO_SHADOW, fname+"_%s_shadow_%d"%(DIRS[3], i)))
        shutil.copy(os.path.join(PATH_TO_PREPROCESS, shadows_left[i]), os.path.join(PATH_TO_SHADOW, fname+"_%s_shadow_%d"%(DIRS[0], i)))
        shutil.copy(os.path.join(PATH_TO_PREPROCESS, shadows_right[i]), os.path.join(PATH_TO_SHADOW, fname+"_%s_shadow_%d"%(DIRS[1], i)))

def delete_item(path_to_item):
    if os.path.isdir(path_to_item):
        shutil.rmtree(path_to_item)
    elif os.path.isfile(path_to_item):
        os.remove(path_to_item)
    else:
        raise ValueError("can't delete file %s"%path_to_item)

def segment_single(img_name): 
    # init parameters
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
    # but this function may not correct, need debug
    to_json(
        image_path = PATH_TO_PREPROCESS, 
        yolo_txt_path = path_to_label
        )

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
    return Image.open(io.BytesIO(byte))

if __name__ == "__main__":
    # for debug
    open_psd_py("./test/image59.psd")
    # batch_process()

    # start main GUI
    eel.init("web") 
    # let's run this code remotely for now
    # print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
    eel.start("GUI2.html", size = (1400, 800))

