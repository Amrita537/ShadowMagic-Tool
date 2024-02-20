import cv2
import json
import os
import sys
import numpy as np


def create_json(image_folder, text_folder, output_folder):
    # Get the list of image files in the folder
    image_files = os.listdir(image_folder)
    
    # Process each image file
    for image_filename in image_files:
        # Construct the file paths
        image_filepath = os.path.join(image_folder, image_filename)
        text_filepath = os.path.join(text_folder, os.path.splitext(image_filename)[0] + '.txt')
        output_filepath = os.path.join(output_folder, os.path.splitext(image_filename)[0] + '.json')
        
        # Load the image
        img = cv2.imread(image_filepath)
        
        # Read the text file and parse the data
        with open(text_filepath, 'r') as file:
            lines = file.readlines()
        
        # Define the label names based on class index
        label_names = {
            0: 'hair',
            1: 'face',
            2: 'cloth',
            3: 'arm',
            4: 'object'
        }
        
        # Create the JSON data structure
        json_data = {
            "image_file": image_filename,
            "regions": []
        }
        # Process each line in the text file
        for region_id, line in enumerate(lines, start=1):
            # Split the line into class index and coordinates
            data = line.strip().split()
            class_index = int(data[0])
            coordinates = []
            
            # Determine the coordinate format based on the number of values
            if len(data) % 2 == 0:  # (x, y) format
                for i in range(1, len(data), 2):
                    x, y = float(data[i]), float(data[i+1])
                    coordinates.append([x, y])
            else:  # pixel format
                width, height = img.shape[1], img.shape[0]
                for i in range(1, len(data), 2):
                    x, y = int(float(data[i]) * width), int(float(data[i+1]) * height)
                    coordinates.append([x, y])
            
            # Create a region dictionary
            region = {
                "region_id": region_id,
                "label": label_names[class_index],
                "coordinates": coordinates
            }
            
            # Add the region to the JSON data
            json_data["regions"].append(region)
        
        # Save the JSON data to a file
        with open(output_filepath, 'w') as file:
            json.dump(json_data, file, indent=4)
        
        print(f"JSON file created successfully for {image_filename}.")

def main(image_folder, text_folder, output_folder):
    # Your code logic here
    print("Image folder:", image_folder)
    print("Text folder:", text_folder)
    print("Output folder:", output_folder)

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python polyToJson.py <image_folder> <text_folder> <output_folder>")
    else:
        image_folder = sys.argv[1]
        text_folder = sys.argv[2]
        output_folder = sys.argv[3]
        main(image_folder, text_folder, output_folder)

# Create the JSON files
create_json(image_folder, text_folder, output_folder)
