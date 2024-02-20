import cv2
import numpy as np
import os
from PIL import Image, ImageDraw, ImageColor, ImageFont
import json
import random
import sys

def main(input_folder, output_folder, output_json_folder):
    # Your code logic here
    print("Input folder:", input_folder)
    print("Output folder:", output_folder)
    print("Output JSON folder:", output_json_folder)

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python AnnotXYPix.py <input_folder> <output_folder> <output_json_folder>")
    else:
        input_folder = sys.argv[1]
        output_folder = sys.argv[2]
        output_json_folder = sys.argv[3]
        main(input_folder, output_folder, output_json_folder)

def getRGBColorPalette(file_path):
    img=Image.open(file_path)
    colors = img.convert('RGB').getcolors()
    colorlist=[]

    for i in range(len(colors)):
        colorlist.append(colors[i][1])
        
    # print("length:",len(colorlist))
    print(colorlist)
    return colorlist


def get_hsv_palette(file_path2):
  rgb_colors = getRGBColorPalette(file_path2)
  hsv_colors = []

  for color in rgb_colors:
      rgb_color = np.array(color, dtype=np.uint8)
      rgb_color = np.reshape(rgb_color, (1,1,3))
      hsv_color = cv2.cvtColor(rgb_color, cv2.COLOR_RGB2HSV)
      hsv_color = tuple(hsv_color[0][0])
      hsv_colors.append(hsv_color)
  return hsv_colors

def Get_annotation_info(input_filepath, output_filepath):
    
    img = cv2.imread(input_filepath)
    img_real=cv2.imread(input_filepath)
    colors = get_hsv_palette(input_filepath)

    # Convert the image to the HSV color space
    hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    color_dict = {'hair': (0, 0, 255), 'face': (0, 255, 0), 'cloth': (255, 0, 0), 'arm': (255, 255, 0), 'object': (0, 255, 255)}
    labels = ['hair', 'face', 'cloth', 'arm', 'object']

    # Initialize an empty list to store contours and their colors
    contours_with_color = []
    counter = 0

    # Load the alpha channel of the PNG image
    foreground_mask = cv2.imread(input_filepath, cv2.IMREAD_UNCHANGED)[:, :, 3]
    # foreground_mask = cv2.imread(input_filepath, cv2.IMREAD_GRAYSCALE)
    # foreground_mask = cv2.imread(input_filepath)

    for color in colors:
        # Define the lower and upper bounds of the color
        lower = np.array([color[0]-1, color[1]-1, color[2]-1])
        upper = np.array([color[0]+1, color[1]+1, color[2]+1])

        # Create a mask for the color
        mask = cv2.inRange(hsv_img, lower, upper)

        # Resize the foreground mask to match the size of the color mask
        foreground_mask_resized = cv2.resize(foreground_mask, (mask.shape[1], mask.shape[0]))

        # Apply the foreground mask to exclude the background
        mask = cv2.bitwise_and(mask, foreground_mask_resized)

        # Find the contours in the mask
        contours, hierarchy = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Loop through each contour and add it to the list with its boundary color and label
        for contour in contours:
            label = labels[counter % len(labels)]
            boundary_color = color_dict[label]
            contours_with_color.append((counter+1, contour, boundary_color, f"{label}"))
            counter += 1

    # Print the total number of contours
    print(f"Total number of contours: {len(contours_with_color)}")

    for counter, contour, boundary_color, label in contours_with_color:
       
        epsilon = 0.005 * cv2.arcLength(contour, True)
        image_width = img.shape[1]
        image_height = img.shape[0]

        # Calculate the minimum bounding rectangle (MBR) of the contour
        x, y, w, h = cv2.boundingRect(contour)

        # Generate random points within the MBR
        while True:
            random_point = np.random.randint(x, x+w), np.random.randint(y, y+h)
            dist = cv2.pointPolygonTest(contour, random_point, True)
            if dist >= 0:
                break

        cX=random_point[0] 
        cY=random_point[1]
        # Get the pixel value at the center point
        pixel_value_bgr = img_real[cY, cX]

        # Draw the contour on the image
        cv2.drawContours(img, [contour], -1, boundary_color, 2)

        # Set the font properties
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 2
        font_thickness = 3

        # Calculate the text position based on the centroid
        text_size, _ = cv2.getTextSize(label + str(counter), font, font_scale, font_thickness)
        text_x = cX
        text_y = cY
        cv2.putText(img, str(counter), (text_x, text_y), font, font_scale, boundary_color, font_thickness)

    # Initialize the JSON data dictionary
    json_data = {
            "image_file": os.path.basename(input_filepath),
            "regions": []
    }

    # Iterate over the contours and store the region information
    for counter, contour, boundary_color, label in contours_with_color:
        # Get the contour coordinates
        coordinates = contour.reshape(-1, 2).tolist()

        # Get the color components of the boundary color
        color = {
            "red": int(boundary_color[0]),
            "green": int(boundary_color[1]),
            "blue": int(boundary_color[2])
        }

        epsilon = 0.005 * cv2.arcLength(contour, True)
        image_width = img.shape[1]
        image_height = img.shape[0]

        # Calculate the minimum bounding rectangle (MBR) of the contour
        x, y, w, h = cv2.boundingRect(contour)

        # Generate random points within the MBR
        while True:
            random_point = np.random.randint(x, x+w), np.random.randint(y, y+h)
            dist = cv2.pointPolygonTest(contour, random_point, True)
            if dist >= 0:
                break

        cX=random_point[0] 
        cY=random_point[1]
        # Get the pixel value at the center point
        pixel_value_bgr = img_real[cY, cX]

        # Convert the pixel value ndarray to a list
        pixel_value_bgr = pixel_value_bgr.tolist()

        # print("region_id:", counter);
        # print("center:", f"({cX},{cY})");
        # print("pix_val:", f"({pixel_value_bgr[0]},{pixel_value_bgr[1]},{pixel_value_bgr[2]})" );
        
        region_info = {
            "region_id": counter,
            "label": label,
            "coordinates": coordinates,
            "color": color,
            "center": f"({cX},{cY})",
            "pixel_val": f"({pixel_value_bgr[0]},{pixel_value_bgr[1]},{pixel_value_bgr[2]})"
        }

        # Append the region to the JSON data
        json_data["regions"].append(region_info)

        # Save the JSON data to a file
    json_filename = os.path.basename(input_filepath)[:-4] + ".json"
    json_filepath = os.path.join(output_json_folder, json_filename)
    with open(json_filepath, 'w') as json_file:
            json.dump(json_data, json_file, indent=4)

    # Save the image
    cv2.imwrite(output_filepath,img)
    return output_filepath


for filename in os.listdir(input_folder):
    if filename.endswith('.png') or filename.endswith('.jpg'):
        input_filepath = os.path.join(input_folder, filename)
        output_filepath = os.path.join(output_folder, filename[:-4] + '.png')
        output_filepath = Get_annotation_info(input_filepath, output_filepath)
        print(f"Processed image: {output_filepath}")
