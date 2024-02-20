import numpy as np
from shapely.geometry import Polygon,MultiPolygon
import os
import shapely.errors


# Define the folder paths
# file1_folder = "/content/drive/MyDrive/GMU/RA/YoloAll/RefineYolo/YoloAnnots"
# file2_folder = "/content/drive/MyDrive/GMU/RA/YoloAll/RefineYolo/ToolAnnots"
# output_folder = "/content/drive/MyDrive/GMU/RA/YoloAll/RefineYolo/RefinedAnnots"


import sys

# Function to simplify the coordinates of a polygon
def simplify_polygon_coords(coordinates, tolerance=0.01):
    polygon = Polygon(coordinates)
    simplified_polygon = polygon.simplify(tolerance, preserve_topology=False)

    if isinstance(simplified_polygon, Polygon):
        # Simplified geometry is a single Polygon
        return simplified_polygon.exterior.coords[:]
    elif isinstance(simplified_polygon, MultiPolygon):
        # Simplified geometry is a MultiPolygon, take the convex hull
        convex_hull = simplified_polygon.convex_hull
        return convex_hull.exterior.coords[:]
    else:
        raise ValueError("Unexpected simplified geometry type.")


def main(file1_folder, file2_folder, output_folder):
    # Your code logic here
    print("File 1 folder:", file1_folder)
    print("File 2 folder:", file2_folder)
    print("Output folder:", output_folder)

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python overlap.py <file1_folder> <file2_folder> <output_folder>")
    else:
        file1_folder = sys.argv[1]
        file2_folder = sys.argv[2]
        output_folder = sys.argv[3]
        main(file1_folder, file2_folder, output_folder)

# Get the list of file names in file2_folder
file2_filenames = os.listdir(file2_folder)


# Iterate through the file names
for filename in file2_filenames:
    # Construct the file paths for file1 and file2
    file1_filepath = os.path.join(file1_folder, filename)
    file2_filepath = os.path.join(file2_folder, filename)

    # Read the content of file1
    with open(file1_filepath, 'r') as f1:
        lines_file1 = f1.readlines()

    # Read the content of file2
    with open(file2_filepath, 'r') as f2:
        lines_file2 = f2.readlines()

    # Create a list to store the updated lines
    updated_lines_file2 = []

    # Iterate through the lines of file2
    for line2 in lines_file2:
        values2 = line2.split()
        class_index2 = int(values2[0])
        coordinates2 = np.array([float(coord) for coord in values2[1:]]).reshape(-1, 2)
        # Flag to check if there is an overlap
        overlap_flag = False

        # Iterate through the lines of file1
        for line1 in lines_file1:
            values1 = line1.split()
            class_index1 = int(values1[0])
            coordinates1 = np.array([float(coord) for coord in values1[1:]]).reshape(-1, 2)

            simplified_coords1 = simplify_polygon_coords(coordinates1)
            # Create Polygon objects for file2 and file1 contours
            polygon2 = Polygon(coordinates2 )
            polygon1 = Polygon(simplified_coords1)

            

            # Check if polygon2 has a non-zero area
            if polygon2.is_empty or polygon2.area == 0.0:
                continue
            # Check if polygon2 has a non-zero area
            if polygon1.is_empty or polygon1.area == 0.0:
                continue


            intersection_area = polygon2.intersection(polygon1).area

            # Calculate the percentage of overlap based on the area of file2 contour
            overlap_percentage = (intersection_area / polygon2.area) * 100

            # Check if there is an overlap between contours and overlap percentage is more than 60%
            if overlap_percentage > 0 and overlap_percentage > 20:
                class_index2 = class_index1
                overlap_flag = True
                break

        # Check if the class index has been updated
        if overlap_flag:
            # Create the updated line for file2
            updated_line = f'{class_index2} {" ".join(str(coord) for coord in coordinates2.flatten())}\n'
            updated_lines_file2.append(updated_line)
        else:
            # Print a message for lines that were not updated
            updated_lines_file2.append(line2)
            # print(f"No overlap found for {filename}. Discarding the line: {line2}")

    # Construct the output file path
    output_filepath = os.path.join(output_folder, filename)

    # Write the updated lines to the output file
    with open(output_filepath, 'w') as f2_updated:
        f2_updated.writelines(updated_lines_file2)

    print(f"Updated file created for {filename}.")

print("All files processed successfully.")
