# main function entrance
import eel 
import os
import requests
from random import randint
from tools.files import open_psd

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
    open_psd(path_to_psd, PATH_TO_INPUT)
    # 

'''
for debug
'''

# start main GUI
eel.init("web") 
# let's run this code remotely for now
print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
eel.start("GUI2.html", mode=False, all_interfaces=True)
