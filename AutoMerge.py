import json
from collections import defaultdict
import subprocess
import sys

# Check if the correct number of command-line arguments are provided
if len(sys.argv) != 3:
    print("Usage: python AutoMerge.py <image_path> <json_path>")
    sys.exit(1)

# Example usage
image_path = sys.argv[1]
json_path = sys.argv[2]

def create_label_lists(json_data):
    label_lists = defaultdict(list)

    for region in json_data['regions']:
        label = region['label']
        region_id = region['region_id']
        label_lists[label].append(region_id)

    return label_lists

# def get_connected_with(json_data, region_ids):
#     connected_regions = []

#     for region_id in region_ids:
#         region = json_data['regions'][region_id - 1]
#         connected_with = region.get('connected_with', [])

#         common_items = set(connected_with).intersection(region_ids)
#         if common_items:
#             connected_regions.extend(common_items)

#     return list(set(connected_regions))

def get_connected_with(json_data, region_ids):
    connected_regions = []

    # Create a set of all valid region IDs present in the JSON data
    valid_region_ids = {region_info['region_id'] for region_info in json_data['regions']}

    for region_id in region_ids:
        region = json_data['regions'][region_id - 1]
        connected_with = region.get('connected_with', [])

        # Filter out invalid region IDs from 'connected_with' list
        connected_with = [connected_id for connected_id in connected_with if connected_id in valid_region_ids]

        common_items = set(connected_with).intersection(region_ids)
        if common_items:
            connected_regions.extend(common_items)

    # return list(set(connected_regions))
    # Return the list of connected regions in descending order
    return sorted(list(set(connected_regions)), reverse=True)


with open(json_path, 'r') as file:
    json_data = json.load(file)

label_lists = create_label_lists(json_data)
all_items=[]
for label, region_ids in label_lists.items():
    common_items = get_connected_with(json_data, region_ids)
    if len(common_items) > 0:
     all_items.append(common_items)
    print(f"Connected regions for label '{label}': {common_items}")

# print(all_items)

for item_list in all_items:
    result = ','.join(str(item) for item in item_list)
    # print(result)
    subprocess.run(['python', 'Merge.py', image_path, json_path, result])

