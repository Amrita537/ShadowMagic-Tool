# main function entrance
import eel 
import os
from random import randint
from tools.files import open_psd

@eel.expose	 
def random_python(): 
    # Todo: 
    python_file_path = "D:/Studies/Eel/EEL-DEMO/yoloresult.py"
    input_images_path = "D:/Studies/Eel/EEL-DEMO/InputImages"
    labels_path = "D:/Studies/Eel/EEL-DEMO/yolov5/runs/predict-seg/exp/labels"
    os.system(f'python "{python_file_path}" "{input_images_path}" "{labels_path}"')

# helper function for openning psd files
@eel.expose
def open_psd_py(path_to_psd):
    return True if open_psd(path_to_psd) else False

# for debug
open_psd("./test/image59.psd", "./InputImages/")

# start main GUI
eel.init("web") 
# we will need to run this code on cluster, so eventually it should be something running remotely
print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
eel.start("GUI2.html", mode=False, all_interfaces=True)
