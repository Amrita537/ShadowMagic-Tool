
import eel 
import os
from random import randint 

eel.init("web") 

# Exposing the random_python function to javascript 
@eel.expose	 
def random_python(): 
    python_file_path = "D:/Studies/Eel/EEL-DEMO/yoloresult.py"
    input_images_path = "D:/Studies/Eel/EEL-DEMO/InputImages"
    labels_path = "D:/Studies/Eel/EEL-DEMO/yolov5/runs/predict-seg/exp/labels"
    os.system(f'python "{python_file_path}" "{input_images_path}" "{labels_path}"')

# Start the index.html file 
eel.start("GUI2.html")
