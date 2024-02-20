import json
import cv2
import os


def convert_coordinate_structure(json_file_path):
    # Load the JSON data
    with open(json_file_path, 'r') as json_file:
        json_data = json.load(json_file)

    # Check if the 'regions' key exists in the JSON data
    if 'regions' in json_data:
        regions = json_data['regions']

        # Iterate over each region
        for region in regions:
            # Check if the 'coordinates' key exists in the region
            if 'coordinates' in region:
                coordinates = region['coordinates']

                # Check if the coordinate structure needs conversion
                if isinstance(coordinates, list) and isinstance(coordinates[0], list) and isinstance(coordinates[0][0], list):
                    # Convert the coordinate structure
                    coordinates = [[coord[0],coord[1]] for sublist in coordinates for coord in sublist]
                    region['coordinates'] = coordinates

        # Save the updated JSON data to the file
        with open(json_file_path, 'w') as json_file:
            json.dump(json_data, json_file)

        print("Coordinate structure converted successfully.")
    else:
        print("No 'regions' key found in the JSON data.")


def convert_to_roboflow_format(json_file_path, image_path, txt_folder_path):
    # Define the label to class index mapping
    label_to_class_index = {
        "hair": 0,
        "face": 1,
        "cloth": 2,
        "arm": 3,
        "object": 4
    }

    convert_coordinate_structure(json_file_path)
    with open(json_file_path, "r") as file:
        data = json.load(file)

    annotations = []
    for region in data["regions"]:
        region_id = region["region_id"]
        label = region["label"]
        coordinates = region["coordinates"]

        if len(coordinates) < 3:
            print(f"Issue with region {region_id}: Insufficient coordinates for a polygon")
            continue

        # Normalize the polygon coordinates
        # Read the image using OpenCV
        img = cv2.imread(image_path)

        # Get the image width and height
        image_height, image_width, _ = img.shape
        normalized_coords = []
        for coord in coordinates:
            if len(coord) < 2:
                print(f"Issue with region {region_id}: Incomplete coordinate pair")
                continue
            normalized_x = coord[0] / image_width
            normalized_y = coord[1] / image_height
            normalized_coords.append([normalized_x, normalized_y])

        # Get the class index based on the label
        class_index = label_to_class_index.get(label, -1)
        if class_index == -1:
            print(f"Issue with region {region_id}: Unknown label {label}")
            continue

        # Create the annotation string in Roboflow format with class index
        annotation = f"{class_index} {' '.join(str(coord[0]) + ' ' + str(coord[1]) for coord in normalized_coords)}"

        # Append the annotation to the list
        annotations.append(annotation)

    # Extract the JSON file name without the extension
    json_file_name = os.path.splitext(os.path.basename(json_file_path))[0]
    folder_path = txt_folder_path
    # Save the annotations to a text file with the JSON file name
    output_file_path = os.path.join(folder_path, f"{json_file_name}.txt")
    # Save the annotations to a text file
    with open(output_file_path, "w") as file:
        for annotation in annotations:
            file.write(annotation + "\n")

    print(f"Annotations saved to {output_file_path}")


    

def process_folder(json_folder_path, img_folder_path, txt_folder_path):
    print("process_folder")
    json_files = [f for f in os.listdir(json_folder_path) if f.endswith('.json')]

    for json_file in json_files:
        json_file_path = os.path.join(json_folder_path, json_file)
        image_file_path = os.path.join(img_folder_path, json_file[:-5] + '.png')  # Assuming image files have the same name as JSON files with a different extension

        if os.path.isfile(image_file_path):
            convert_to_roboflow_format(json_file_path, image_file_path, txt_folder_path)
            print("process_folder1")
        else:
            print(f"Image file not found for JSON file: {json_file}")

import sys

def main(json_folder_path, img_folder_path, txt_folder_path):
    # Your code logic here
    print("JSON folder path:", json_folder_path)
    print("Image folder path:", img_folder_path)
    print("Text folder path:", txt_folder_path)

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python JsonToRoboflow.py <json_folder_path> <img_folder_path> <txt_folder_path>")
    else:
        json_folder_path = sys.argv[1]
        img_folder_path = sys.argv[2]
        txt_folder_path = sys.argv[3]
        main(json_folder_path, img_folder_path, txt_folder_path)

# Process the folder
process_folder(json_folder_path, img_folder_path, txt_folder_path)

