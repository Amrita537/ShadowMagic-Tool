# main function entrance
import eel 
import os
from random import randint
from tools.files import open_psd

# need to consider multi-user case? no, let just consider single user case for now
# I think in the future, we should run the front end locally and backend on cluster
# but now it is fine to just run everything on the cluster

@eel.expose	 
def random_python(): 
    python_file_path = "D:/Studies/Eel/EEL-DEMO/yoloresult.py"
    input_images_path = "D:/Studies/Eel/EEL-DEMO/InputImages"
    labels_path = "D:/Studies/Eel/EEL-DEMO/yolov5/runs/predict-seg/exp/labels"
    os.system(f'python "{python_file_path}" "{input_images_path}" "{labels_path}"')

# helper function for openning psd files
@eel.expose
def open_psd_py(path_to_psd):
    open_psd(path_to_psd)
    

'''
for debug
'''
# open_psd("./test/image59.psd", "./InputImages/")

# start main GUI
eel.init("web") 
# let's run this code remotely for now
print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
eel.start("GUI2.html", mode=False, all_interfaces=True)
