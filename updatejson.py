import json
import os
import sys

def merge_json(json1, json2):
    # Load the JSON files
    with open(json1, 'r') as f:
        data1 = json.load(f)
    
    with open(json2, 'r') as f:
        data2 = json.load(f)
    
    # Iterate over regions in json2
    for region2 in data2['regions']:
        region_id2 = region2['region_id']
        
        # Find matching region in json1
        for region1 in data1['regions']:
            region_id1 = region1['region_id']
            
            if region_id1 == region_id2:
                # Fetch required variables from json1
                center = region1['center']
                pixel_val = region1['pixel_val']
                connected_with = region1['connected_with']
                
                # Append the variables to the specific region in json2
                region2['center'] = center
                region2['pixel_val'] = pixel_val
                region2['connected_with'] = connected_with
                break
    
    # Write the updated data to json2
    with open(json2, 'w') as f:
        json.dump(data2, f, indent=4)

def get_json_files(folder):
    json_files = []
    for file in os.listdir(folder):
        if file.endswith('.json'):
            json_files.append(os.path.join(folder, file))
    return json_files

# Check if the correct number of command-line arguments is provided
if len(sys.argv) != 3:
    print("Usage: python updatejson.py <folder1> <folder2>")
else:
    # Extract the folder paths from command-line arguments
    folder1 = sys.argv[1]
    folder2 = sys.argv[2]

    # Get the JSON files in the folders
    json_files1 = get_json_files(folder1)
    json_files2 = get_json_files(folder2)

    # Iterate over the JSON files
    for json_file1 in json_files1:
        file_name = os.path.basename(json_file1)
        json_file2 = os.path.join(folder2, file_name)

        if json_file2 in json_files2:
            merge_json(json_file1, json_file2)
