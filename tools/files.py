# scripts for psd file openning and exporting
import os
import numpy as np
import cv2
from PIL import Image
from psd_tools import PSDImage

# we probably don't need most of these logics
def layer_to_png(layer, path_to_png, export_size):
    h, w = export_size
    layer_name = layer.name.lower()
    # normalize the layer name
    if 'flat' in layer_name:
        layer_name = 'flat'
    elif 'line' in layer_name:
        layer_name = 'line'
    img = layer.numpy()
    # get offset of current layer
    offset = layer.offset
    if len(offset) == 2:
        l, t = offset
        b = h
        r = w
    else:
        l, t, r, b = offset
    # pad each layer before saving
    res = np.ones((h, w, 4)) * 255
    res[:, :, 3] = 0 # set alpha channel to transparent by default
    if (w - l) < img.shape[1] or (h - t) < img.shape[0]: 
        img = img[0:h-t, 0:w-l, :] # sometimes the layer could even larger than the artboard! then we need to crop from the bottom right
    if t < 0: # t or l could also be negative number, so in that case we need to crop from the top left, too
        img = img[-t:, :, :]
    if l < 0:  
        img = img[:, -l:, :]
    top = t if t > 0 else 0
    left = l if l > 0 else 0
    res[top:img.shape[0]+top, left:img.shape[1]+left, :] = img * 255
    # save extracted layer to png file
    res = res.astype(np.uint8)
    Image.fromarray(res).save(path_to_png+'_'+layer_name+'.png' )
    return res

def get_file_name(file_path):
    _, file_full_name = os.path.split(file_path)
    name, _ = os.path.splitext(file_full_name)
    return name 

def open_psd(path_to_psd, path_to_png):
    assert os.path.exists(path_to_png)

    # read psd file
    psd = PSDImage.open(path_to_psd)
    name = get_file_name(path_to_psd)
    
    w, h = psd.width, psd.height
    # extract each layer into png files 
    for i in range(len(psd)):    
        layer_to_png(psd[i], os.path.join(path_to_png, name), (h, w))

