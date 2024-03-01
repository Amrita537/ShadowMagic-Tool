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

PATH_TO_INPUT = './InputImages/'
PATH_TO_SHADOW = './web/Shadows'
PATH_TO_SHADOWS = './web/Shadows/sub_shadows'

@eel.expose	 
def random_python(): 
    python_file_path = "D:/Studies/Eel/EEL-DEMO/yoloresult.py"
    input_images_path = "D:/Studies/Eel/EEL-DEMO/InputImages"
    labels_path = "D:/Studies/Eel/EEL-DEMO/yolov5/runs/predict-seg/exp/labels"
    os.system(f'python "{python_file_path}" "{input_images_path}" "{labels_path}"')

@eel.expose
def open_psd_py(path_to_psd):
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

    # send image to backend and get the shadows back
    dirs = ['left', 'right', "top", "back"]

    for direction in dirs:
        url = "http://164.90.158.133:8080/shadowsingle"
        direction = 'right'
        data_send = {}
        data_send['user'] = 'userA'
        data_send['direction'] = direction
        data_send['name'] = name
        data_send['flat'] = array_to_base64(flat)
        data_send['line'] = array_to_base64(line)
        data_send['color'] = array_to_base64(color.astype(np.uint8))
        
        for i in range(4):
            resp = requests.post(url=url, data=json.dumps(data_send), timeout=5000)
            resp = resp.json()
            shadow = to_pil(resp['shadow_0'])
            shadow.save(os.path.join(PATH_TO_SHADOW, name + "_" + direction + "_shadow_%d.png"%i))

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
    # start main GUI
    eel.init("web") 
    # let's run this code remotely for now
    # print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
    eel.start("GUI2.html")
