import cv2
import json
import sys
import numpy as np

def process_image_with_json(image_path, json_path, region_ids):
    # Read the image
    img = cv2.imread(image_path)

    # Convert the image to the correct depth
    img = cv2.convertScaleAbs(img)

    # Load the JSON data
    with open(json_path, 'r') as json_file:
        json_data = json.load(json_file)

    # Initialize empty lists for colors and points
    colors = []
    points = []

    # Process each region ID
    for region_id in region_ids:
        # Find the region with the provided region ID in the JSON data
        region_info = next((region for region in json_data['regions'] if region['region_id'] == region_id), None)

        if region_info is None:
            print(f"Region ID {region_id} not found in the JSON data.")
            continue

        # Retrieve the center and pixel value from the region info

        center_x, center_y = eval(region_info['center'])
        pixel_value_bgr = eval(region_info['pixel_val'])

        colors.append(tuple(pixel_value_bgr))
        points.append((center_x, center_y))

    # Create a mask to hold the merged contours
    merged_mask = np.zeros_like(img[:, :, 0])

    # Find contours for each color and point
    for color, point in zip(colors, points):
        # Create a mask for the color
        mask = cv2.inRange(img, color, color)

        # Find the contours in the mask
        contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

        # Iterate over the contours
        for i in range(len(contours)):
            # Check if the contour is a nested contour
            if hierarchy[0][i][3] != -1:
                continue

            # Check if the contour contains the point
            if cv2.pointPolygonTest(contours[i], point, False) == -1:
                continue

            # Draw the contour on the merged mask
            cv2.drawContours(merged_mask, contours, i, 255, cv2.FILLED)

        # Draw a point on the original image
        cv2.circle(img, point, 10, (255, 0, 0), -1)

    # Find the contours in the merged mask
    merged_contours, hierarchy = cv2.findContours(merged_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Draw the merged contour on the original image
    cv2.drawContours(img, merged_contours, -1, (0, 255, 0), 5)

    # # Update the JSON data with the merged contour coordinates
    # if len(merged_contours) > 0:
    #     merged_contour = merged_contours[0].tolist()
    #     region_id = region_ids[0]  # Get the region ID from the first index
    #     for region_info in json_data['regions']:
    #         if region_info['region_id'] == region_id:
    #             region_info['coordinates'] = merged_contour
    #             break

    # Update the JSON data with the merged contour coordinates
    if len(merged_contours) > 0:
          merged_contour = merged_contours[0]  # Get the first contour
          merged_contour_list = merged_contour.squeeze().tolist()  # Remove unnecessary dimensions and convert to a list
          region_id = region_ids[0]  # Get the region ID from the first index
          for region_info in json_data['regions']:
              if region_info['region_id'] == region_id:
                  region_info['coordinates'] = merged_contour_list
                  break


    # Remove the other region IDs from the JSON data
 # Remove the region IDs from index 1 to (len-1) from the JSON data
    json_data['regions'] = [region_info for region_info in json_data['regions'] if region_info['region_id'] not in region_ids[1:len(region_ids)]]

    # Save the image
    cv2.imwrite('merged_contour.png', img)
    print("image saved")
    # Save the updated JSON data to the file
    with open(json_path, 'w') as json_file:
        json.dump(json_data, json_file)

# Check if the correct number of command-line arguments are provided
if len(sys.argv) != 4:
    print("Usage: python image_processing.py <image_path> <json_path> <region_ids>")
    sys.exit(1)

# Extract the command-line arguments
image_path = sys.argv[1]
json_path = sys.argv[2]
region_ids = list(map(int, sys.argv[3].split(',')))  # Convert the comma-separated string to a list of integers

# Call the image processing function
process_image_with_json(image_path, json_path, region_ids)
