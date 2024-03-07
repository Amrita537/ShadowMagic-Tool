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
from random import randint
from tools.files import open_psd, get_file_name
from PIL import Image
from tqdm import tqdm


PATH_TO_INPUT = './InputImages/'
PATH_TO_SHADOW = './web/Shadows'
# why need to do so?
PATH_TO_SHADOWS = './web/Shadows/sub_shadows'
DIRS = ['left', 'right', "top", "back"]

@eel.expose	 
def random_python(): 
    python_file_path = "./yoloresult.py"
    input_images_path = "./InputImages"
    labels_path = "./yolov5/runs/predict-seg/exp/labels"
    os.system(f'python "{python_file_path}" "{input_images_path}" "{labels_path}"')

@eel.expose
def open_psd_py(path_to_psd, var = 4):
    # extract png images from psd files
    name = get_file_name(path_to_psd)
    open_psd(path_to_psd, PATH_TO_INPUT)
    # open extracted pngs
    flat = np.array(Image.open(os.path.join(PATH_TO_INPUT, name+"_flat.png")))
    # add white backgournd if flat has alpha channel
    if flat.shape[-1] == 4:
        bg = np.ones((flat.shape[0], flat.shape[1], 3)) * 255
        alpha = flat[..., -1][..., np.newaxis] / 255
        rgb = flat[..., 0:3]
        flat = (rgb * alpha + bg * (1 - alpha)).astype(np.uint8)
    line = np.array(Image.open(os.path.join(PATH_TO_INPUT, name+"_line.png")))
    color = flat * (line.mean(axis = -1) / 255)[..., np.newaxis]
    # save color to file
    Image.fromarray(color.astype(np.uint8)).save(os.path.join(PATH_TO_INPUT, name+"_color.png"))

    # get shadows
    for direction in DIRS:
        url = "http://164.90.158.133:8080/shadowsingle"
        direction = 'right'
        data_send = {}
        data_send['user'] = 'userA'
        data_send['direction'] = direction
        data_send['name'] = name
        data_send['flat'] = array_to_base64(flat)
        data_send['line'] = array_to_base64(line)
        data_send['color'] = array_to_base64(color.astype(np.uint8))
        
        for i in range(var):
            resp = requests.post(url=url, data=json.dumps(data_send), timeout=5000)
            resp = resp.json()
            shadow = to_pil(resp['shadow_0'])
            shadow.save(os.path.join(PATH_TO_SHADOW, name + "_" + direction + "_shadow_%d.png"%i))

    # get the segmentation result
    pass

@eel.expose
def batch_process(path_to_psds = './batch_input', var = 20):
    for psd in tqdm(os.listdir(path_to_psds)):
        if ".psd" not in psd: continue
        # check if this file has been processed
        processed = True
        # check extracted files
        name = get_file_name(psd)
        if os.path.exists(os.path.join(PATH_TO_INPUT, name+"_color.png")) == False: processed = False
        if os.path.exists(os.path.join(PATH_TO_INPUT, name+"_flat.png")) == False: processed = False
        if os.path.exists(os.path.join(PATH_TO_INPUT, name+"_lilne.png")) == False: processed = False

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
        open_psd_py(os.path.join(path_to_psds, psd))

@eel.expose
def shadow_decrease():
    # todo
    pass

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
    # open_psd_py("./test/image59.psd")
    batch_process()

    # start main GUI
    eel.init("web") 
    # let's run this code remotely for now
    # print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
    eel.start("GUI2.html")
