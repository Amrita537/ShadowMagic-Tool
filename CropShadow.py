import json
import os
from PIL import Image, ImageDraw
import numpy as np
import sys

def flatten_coordinates(coordinates):
    flattened_coords = []
    for coord_pair in coordinates:
        flattened_coords.extend(coord_pair)
    return flattened_coords

def mask_and_save_regions(image_path, json_path, output_folder, filename):
    # Load JSON data
    with open(json_path, 'r') as json_file:
        data = json.load(json_file)
    # Open the image
    img = Image.open(image_path)
    # Get the image mode (like 'RGB', 'RGBA')
    image_mode = img.mode

    # Group regions by label
    regions_by_label = {}
    for region in data['regions']:
        label = region['label']
        if label in regions_by_label:
            regions_by_label[label].append(region)
        else:
            regions_by_label[label] = [region]

    # Loop through each label and its regions
    for label, regions in regions_by_label.items():
        # Create a list to store masked regions
        masked_regions = []

        # Loop through each region in the label group
        for region in regions:
            # Get region coordinates and flatten them
            coordinates = flatten_coordinates(region['coordinates'])

            # Create a binary mask based on the coordinates
            mask = Image.new('L', img.size, 0)
            draw = ImageDraw.Draw(mask)
            draw.polygon(coordinates, outline=1, fill=1)

            # Convert the mask to a NumPy array
            mask_array = np.array(mask)

            # Apply the mask to the original image
            masked_region = Image.fromarray(np.asarray(img) * mask_array[:, :, None], image_mode)
            masked_regions.append(masked_region)

        # Merge all masked regions belonging to the same label into one image
        if len(masked_regions) > 0:
            merged_image = masked_regions[0]
            for i in range(1, len(masked_regions)):
                merged_image = Image.alpha_composite(merged_image.convert('RGBA'), masked_regions[i].convert('RGBA'))

            # Generate a unique output file name based on the label
            file_name = os.path.basename(image_path)
            output_name = f"{os.path.splitext(file_name)[0]}_{label}.png"
            output_path = os.path.join(output_folder, output_name)

            # Save the merged image as a separate image with the same format as the input image
            merged_image.save(output_path, format=img.format)

# if __name__ == "__main__":
#     # Get the input parameters from the cell input
#     args = sys.argv[1:]
#     if len(args) != 3:
#         print("Usage: python process_images.py input_folder_path json_file_path output_folder_path")
#         sys.exit(1)

#     input_folder_path, json_folder_path, output_folder_path = args

#     # List all files in the input folder
#     files = os.listdir(input_folder_path)

#     # Iterate over each file in the input folder
#     for file_name in files:
#         if file_name.endswith('.png'):
#             # Construct the full file paths
#             image_file_path = os.path.join(input_folder_path, file_name)
#             json_file_path = os.path.join(json_folder_path)

#             # Call the function for each image
#             mask_and_save_regions(image_file_path, json_file_path, output_folder_path)

if __name__ == "__main__":
    # Get the input parameters from the cell input
    args = sys.argv[1:]
    if len(args) != 4:
        print("Usage: python process_images.py input_folder_path json_file_path output_folder_path filename")
        sys.exit(1)

    input_folder_path, json_folder_path, output_folder_path, filename = args

    # List all files in the input folder
    files = os.listdir(input_folder_path)

    # Iterate over each file in the input folder
    for file_name in files:
        if file_name.endswith('.png') and filename in file_name:
            # Construct the full file paths
            image_file_path = os.path.join(input_folder_path, file_name)
            json_file_path = os.path.join(json_folder_path)

            # Call the function for each image
            mask_and_save_regions(image_file_path, json_file_path, output_folder_path, filename)
