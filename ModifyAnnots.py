import cv2
import os
import json
import numpy as np
import sys

# image_folder = '/content/drive/MyDrive/GMU/RA/YoloAll/RefineYolo/Image'
# json_folder = '/content/drive/MyDrive/GMU/RA/YoloAll/RefineYolo/YoloAnnots'
# output_folder = '/content/drive/MyDrive/GMU/RA/YoloAll/RefineYolo'

def main(image_folder, json_folder, output_folder):
    # Your code logic here
    print("Image folder:", image_folder)
    print("JSON folder:", json_folder)
    print("Output folder:", output_folder)

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python ModifyAnnots.py <image_folder> <json_folder> <output_folder>")
    else:
        image_folder = sys.argv[1]
        json_folder = sys.argv[2]
        output_folder = sys.argv[3]
        main(image_folder, json_folder, output_folder)


def draw_contours_from_json(image_filepath, json_filepath, output_filepath):
    # Load the image
    img = cv2.imread(image_filepath)

    # Load the JSON data
    with open(json_filepath, 'r') as json_file:
        json_data = json.load(json_file)

    # Define a dictionary to store unique colors for each label
    label_colors = {
        'hair': (0, 0, 255),  # Red
        'face': (0, 255, 0),  # Green
        'cloth': (255, 0, 0),  # Blue
        'arm': (255, 255, 0),  # Cyan
        'object': (0, 255, 255)  # Yellow
    }

    # Iterate over the regions in the JSON data
    for region in json_data['regions']:
        region_id = region['region_id']
        label = region['label']
        coordinates = region['coordinates']

        # Check if the label already has a color assigned
        if label in label_colors:
            boundary_color = label_colors[label]  # Use the assigned color
        else:
            # If the label doesn't have a color assigned, generate a random color
            boundary_color = (np.random.randint(0, 256), np.random.randint(0, 256), np.random.randint(0, 256))
            label_colors[label] = boundary_color  # Store the color for future regions with the same label

        # Convert the coordinates to NumPy array format
        contour = np.array(coordinates, dtype=np.int32)

        epsilon = 0.005 * cv2.arcLength(contour, True)
        image_width = img.shape[1]
        image_height = img.shape[0]

        # Calculate the minimum bounding rectangle (MBR) of the contour
        x, y, w, h = cv2.boundingRect(contour)

        # Generate random points within the MBR
        # while True:
        #     random_point = np.random.randint(x, x+w), np.random.randint(y, y+h)
        #     dist = cv2.pointPolygonTest(contour, random_point, True)
        #     if dist >= 0:
        #         break

        # centroid_x=random_point[0] 
        # centroid_y=random_point[1]

        centroid_x, centroid_y = eval(region['center']);

        # Update the color value in the JSON data
        region['color'] = {
            'red': int(boundary_color[2]),
            'green': int(boundary_color[1]),
            'blue': int(boundary_color[0])
        }

        # Draw the contour on the image
        cv2.drawContours(img, [contour], -1, boundary_color,5)

        # Set the font properties for the label
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 1
        font_thickness = 1

        # Calculate the text position based on the contour centroid
        label_size, _ = cv2.getTextSize(str(region_id), font, font_scale, font_thickness)
        text_x = centroid_x - label_size[0] // 2
        text_y = centroid_y + label_size[1] // 2

        # Put the label text on the image
        cv2.putText(img, str(region_id), (text_x, text_y), font, font_scale, boundary_color, font_thickness, cv2.LINE_AA)
        # cv2.putText(img, label, (text_x, text_y), font, font_scale, boundary_color, font_thickness, cv2.LINE_AA)

    # Save the updated JSON data
    with open(json_filepath, 'w') as json_file:
        json.dump(json_data, json_file, indent=4)

    # Save the image with contours
    cv2.imwrite(output_filepath, img)

# Create the output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Iterate over the image files in the folder
for filename in os.listdir(image_folder):
    if filename.endswith('.png') or filename.endswith('.jpg'):
        image_filepath = os.path.join(image_folder, filename)
        json_filename = os.path.splitext(filename)[0] + '.json'
        json_filepath = os.path.join(json_folder, json_filename)
        output_filepath = os.path.join(output_folder, filename)

        if os.path.isfile(json_filepath):
            draw_contours_from_json(image_filepath, json_filepath, output_filepath)
            print(f"Processed image: {output_filepath}")
        else:
            print(f"No JSON file found for image: {filename}")
