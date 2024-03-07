# main function entrance
import eel 
import os
from random import randint
from tools.files import open_psd

import base64
from PIL import Image
from io import BytesIO
import shutil


# need to consider multi-user case? no, let just consider single user case for now
# I think in the future, we should run the front end locally and backend on cluster
# but now it is fine to just run everything on the cluster
# start main GUI
eel.init("web") 

@eel.expose	 
def random_python(imageName): 

    img_size = 320
    weights_path = "yolov5/runs/train-seg/exp10/weights/best.pt"
    source_path = "InputImages/"+imageName
    save_txt = True
    save_conf = True
    
    python_file_path = "yolov5/segment/predict.py"
    Infer_command = f"python {python_file_path} --img {img_size} --weights {weights_path} --source {source_path}"
    if save_txt:
        Infer_command  += " --save-txt"
    if save_conf:
        Infer_command  += " --save-conf"
    
    # Execute the command
    os.system(Infer_command)


    python_file_path = "yoloresult.py"
    input_images_path = "InputImages"
    labels_path = "yolov5/runs/predict-seg/exp/labels"
    os.system(f'python "{python_file_path}" "{input_images_path}" "{labels_path}"')


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


# helper function for openning psd files
@eel.expose
def open_psd_py(path_to_psd):
    # open_psd(path_to_psd)
    open_psd(path_to_psd, "./web/PsdToPng")
    

'''
for debug
'''
# open_psd("./web/D4_01_L_M.psd", "./web/psdoutput")


# let's run this code remotely for now
# print("log:\tOpen a web browser to: http://localhost:8000/GUI2.html")
# eel.start("GUI2.html", mode=False, all_interfaces=True)
eel.start("GUI2.html")
