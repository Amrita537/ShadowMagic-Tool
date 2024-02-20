import os
import cv2
import json
import sys
import numpy as np

def get_coordinates(json_data, region_ids):
    coordinates = [region['coordinates'] for region in json_data['regions'] if region['region_id'] in region_ids]
    return coordinates

def create_mask(image, coordinates):
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    for coordinate in coordinates:
        if len(coordinate) > 0:
            points = np.array(coordinate, dtype=np.int32).reshape(-1, 2)
            cv2.drawContours(mask, [points], -1, 255, cv2.FILLED)
    return mask

def dilate_mask(mask):
    kernel = np.ones((2,2), np.uint8)
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)
    return dilated_mask

def check_mask_intersection(mask1, mask2):
    intersection = cv2.bitwise_and(mask1, mask2)
    return cv2.countNonZero(intersection) > 0 or np.array_equal(intersection, mask2)

def get_region_ids(json_data):
    region_ids = [region['region_id'] for region in json_data['regions']]
    return region_ids

# Check if the correct number of command-line arguments are provided
if len(sys.argv) != 3:
    print("Usage: python RegionConnection <image_folder> <json_folder>")
    sys.exit(1)

# Input image folder and JSON folder
image_folder = sys.argv[1]
json_folder = sys.argv[2]

# Iterate over the image files in the folder
for image_file in os.listdir(image_folder):
    if image_file.endswith('.png'):
        # Construct the paths for the current image and JSON file
        image_path = os.path.join(image_folder, image_file)
        json_file = os.path.join(json_folder, image_file.replace('.png', '.json'))

        # Read the image
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        contours, hierarchy = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Read the JSON file once and store the data in memory
        with open(json_file, 'r') as file:
            json_data = json.load(file)
            total_regions = len(json_data['regions'])
        connect_to = get_region_ids(json_data)

        region_ids = list(range(1, total_regions + 1))

        # Iterate over each value in connect_to list
        for connect_to_value in connect_to:
            # Calculate the mask for the current connect_to value
            connect_to_coordinates = get_coordinates(json_data, [connect_to_value])
            connect_to_contour = np.array(connect_to_coordinates[0], dtype=np.int32).reshape(-1, 2)
            connect_to_mask = np.zeros(image.shape[:2], dtype=np.uint8)
            cv2.drawContours(connect_to_mask, [connect_to_contour], -1, 255, cv2.FILLED)
            dilated_connect_to_mask = dilate_mask(connect_to_mask)

            connected_rid = []
            # Iterate over each region ID
            for region_id in region_ids:
                if region_id == connect_to_value:
                    continue  # Skip the connect_to region

                coordinates = get_coordinates(json_data, [region_id])
                contour = np.array(coordinates[0], dtype=np.int32).reshape(-1, 2)
                mask = np.zeros(image.shape[:2], dtype=np.uint8)
                cv2.drawContours(mask, [contour], -1, 255, cv2.FILLED)
                dilated_mask = dilate_mask(mask)

                # Check if the masks have intersection
                has_intersection = check_mask_intersection(dilated_connect_to_mask, dilated_mask)

                if has_intersection:
                    connected_rid.append(region_id)

            # Add the connected_with list to the JSON data
            for region in json_data['regions']:
                if region['region_id'] == connect_to_value:
                    region['connected_with'] = connected_rid
                    break

        # Save the modified JSON data to the same file
        with open(json_file, 'w') as file:
            json.dump(json_data, file, indent=4)

        print(f"Modified JSON file saved for {image_file}: {json_file}")
