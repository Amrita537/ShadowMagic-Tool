# scripts for psd file openning and exporting
import os
import numpy as np
import cv2
import psd_tools
from psd_tools import PSDImage
from PIL import Image


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
    h, w = psd.size
    if h > 2000 or w > 2000:
        print("warning:\tinput resolution (%d, %d) greater than 2000, this may not get shadow prediction correctly"%(h, w))
    name = get_file_name(path_to_psd)
    
    w, h = psd.width, psd.height
    
    # extract each layer into png files 
    for i in range(len(psd)):    
        layer_to_png(psd[i], os.path.join(path_to_png, name), (h, w))

def add_alpha_all(flat, line):
    if len(flat.shape) == 1 or flat.shape[-1] == 3:
        flat = add_alpha_flat(flat)
    
    if len(line.shape) == 1 or line.shape[-1] == 3:
        line = add_alpha_line(line)
    return flat, line

def add_alpha_flat(flat):
    assert len(flat.shape) == 3 and flat.shape[-1] == 3
    # add alpha channel... 
    flat_alpha_mask = flat.mean(axis = -1) == 255
    flat_alpha = np.ones(flat_alpha_mask.shape) * 255
    flat_alpha[flat_alpha_mask] =  0
    return np.concatenate(flat, flat_alpha[..., np.newaxis]).astype(np.uint8)

def add_alpha_line(line):
    assert line.shape[-1] != 4
    # add alpha channel to the line drawing layer
    if len(line.shape) == 3:
        line = line.mean(axis = -1)
    line = np.concatenate((np.zeros((line.shape[0],line.shape[1],3)), (255 - line)[..., np.newaxis]), axis = -1)
    return line.astype(np.uint8)

def decrease_shadow_gaussian(shadow, line, bg_mask, iters = 3):
    # gaussian blur based shadow decreasing
    K = gkern()
    shadow_conv = shadow.astype(float)
    for _ in range(iters): 
        shadow_conv[line.astype(bool)] = 0.9 * iters
        shadow_conv = conv(shadow_conv, K, mode='same')
    shadow_conv[bg_mask] = 0
    shadow_conv[shadow_conv < 0.5] = 0
    
    # add this blur to make the shadow edge smooth
    return conv(shadow_conv, K, mode='same')

def gkern(l=5, sig=1.):
    """
    creates gaussian kernel with side length `l` and a sigma of `sig`
    """
    ax = np.linspace(-(l - 1) / 2., (l - 1) / 2., l)
    gauss = np.exp(-0.5 * np.square(ax) / np.square(sig))
    kernel = np.outer(gauss, gauss)
    return kernel / np.sum(kernel)