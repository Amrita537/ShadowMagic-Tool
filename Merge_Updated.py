import os
import cv2
import numpy as np
import json
import sys

def create_masks(json_folder_path, image_folder_path, output_folder_path):
    # List all JSON files in the JSON folder
    json_files = os.listdir(json_folder_path)
    color_dict = {
        (0, 0, 255): 'hair',
        (0, 255, 0): 'face',
        (255, 0, 0): 'cloth',
        (255, 255, 0): 'arm',
        (0, 255, 255): 'object'
    }

    for json_file in json_files:
        json_file_path = os.path.join(json_folder_path, json_file)
        image_file_name = os.path.splitext(json_file)[0] + '.png'
        image_file_path = os.path.join(image_folder_path, image_file_name)
        output_image_path = os.path.join(output_folder_path, image_file_name)

        # Load the image
        image = cv2.imread(image_file_path)
        # Load the image
        image = cv2.imread(image_file_path)
        if image is None:
            print(f"Error loading image: {image_file_path}")
            continue  # Skip processing for this file

        height, width, _ = image.shape

        # Load the JSON file
        with open(json_file_path, 'r') as file:
            data = json.load(file)

        # Create a blank image to store the masks
        output_image = np.zeros((height, width, 3), np.uint8)

        # Iterate over regions and create masks
        for region in data['regions']:
            mask = np.zeros((height, width), np.uint8)
            pts = np.array(region['coordinates'], np.int32)
            cv2.fillPoly(mask, [pts], (255, 255, 255))

            # Fill the mask with the specified color
            color = (region['color']['blue'], region['color']['green'], region['color']['red'])
            output_image[mask == 255] = color

        # Find unique colors in the image
        unique_colors = np.unique(output_image.reshape(-1, output_image.shape[2]), axis=0)
        contour_image = np.zeros_like(output_image)

        # Iterate over unique colors and draw contours
        i=0;
        contour_data = []
        regions = []


        # Append the region to the JSON data
        json_data = {
           "image_file": image_file_name,
           "regions": []
        }

        for color in unique_colors:
              # Skip black color
            if np.all(color == 0):
                continue
            mask = cv2.inRange(output_image, color, color)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(contour_image, contours, -1, color.tolist(), 2)
            # Print contours

            for contour in contours:
                contour = np.squeeze(contour) 
                M = cv2.moments(contour)
                if M["m00"] != 0:
                    cX = int(M["m10"] / M["m00"])
                    cY = int(M["m01"] / M["m00"])
                    label = color_dict.get(tuple(color), 'unknown')
                    cv2.putText(contour_image, f"{i}: {label}", (cX, cY), cv2.FONT_HERSHEY_SIMPLEX, 3, (255, 255, 255), 2)
                    
                        # Convert color to the desired format
                print("contour number:", i )
                label = color_dict.get(tuple(color), 'unknown')
                # Get the color components of the boundary color
                color_format = {
                      "red": int(color[2]),
                      "green": int(color[1]),
                      "blue": int(color[0])
                  }
                # contour_data.append({
                #     "region_id": i,
                #     "color": color_format,
                #     "label": label,
                #     "coordinates": contour.tolist()
                # })

                # Append region information to the list
                region_info = {
                   "region_id": i,
                    "color": color_format,
                    "label": label,
                    "coordinates": contour.tolist()
                }
                json_data["regions"].append(region_info)
                i += 1
              # Create the final JSON structure

        # Save contour data as a JSON file
        json_output_path = os.path.join(output_folder_path, os.path.splitext(json_file)[0] + '.json')
        with open(json_output_path, 'w') as json_file:
            json.dump(json_data, json_file)
        # Save the output image
        # cv2.imwrite(output_image_path, contour_image)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_masks.py <json_folder_path> <image_folder_path> <output_folder_path>")
        sys.exit(1)

    json_folder_path = sys.argv[1]
    image_folder_path = sys.argv[2]
    output_folder_path = sys.argv[3]
    create_masks(json_folder_path, image_folder_path, output_folder_path)


