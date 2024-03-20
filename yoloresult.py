import os
import sys
import shutil

def auto_merge(image_folder, json_folder):
    image_files = [f for f in os.listdir(image_folder) if f.lower().endswith('.png') or f.lower().endswith('.jpg')]
    json_files = [f for f in os.listdir(json_folder) if f.lower().endswith('.json')]
    
    for image_file in image_files:
        image_path = os.path.join(image_folder, image_file)
        json_file = os.path.splitext(image_file)[0] + ".json"
        json_path = os.path.join(json_folder, json_file)
        
        if json_file in json_files:
            command = f"python AutoMerge.py {image_path} {json_path}"
            os.system(command)


def create_directories_if_not_exist(image_path):
    # Get the parent directory of the image path
    parent_directory = os.path.dirname(image_path)
    
    # Create the yolo_json_path directory if it doesn't exist
    yolo_json_path = os.path.join(parent_directory, "YoloOutput", "json")
    if not os.path.exists(yolo_json_path):
        os.makedirs(yolo_json_path)
    
    # Create the yolo_output_img directory if it doesn't exist
    yolo_output_img = os.path.join(parent_directory, "YoloOutput", "images")
    if not os.path.exists(yolo_output_img):
        os.makedirs(yolo_output_img)

    # Create the annot_output_img directory if it doesn't exist
    annot_output_img = os.path.join(parent_directory, "AnnotOutput", "images")
    if not os.path.exists(annot_output_img):
        os.makedirs(annot_output_img)
    
    # Create the annot_json_path directory if it doesn't exist
    annot_json_path = os.path.join(parent_directory, "AnnotOutput", "json")
    if not os.path.exists(annot_json_path):
        os.makedirs(annot_json_path)
    
    # Create the annot_txt_path directory if it doesn't exist
    annot_txt_path = os.path.join(parent_directory, "AnnotOutput", "labels")
    if not os.path.exists(annot_txt_path):
        os.makedirs(annot_txt_path)

    # Create the annot_txt_path directory if it doesn't exist
    ref_txt_path = os.path.join(parent_directory, "RefinedOutput", "labels")
    if not os.path.exists(ref_txt_path):
        os.makedirs(ref_txt_path)

    # Create the annot_txt_path directory if it doesn't exist
    ref_json_path = os.path.join(parent_directory, "RefinedOutput", "json")
    if not os.path.exists(ref_json_path):
        os.makedirs(ref_json_path)

    # Create the annot_txt_path directory if it doesn't exist
    unmerged_json_path = os.path.join(parent_directory, "RefinedOutput", "Unmerged_json")
    if not os.path.exists(unmerged_json_path):
        os.makedirs(unmerged_json_path)

    # Create the annot_txt_path directory if it doesn't exist
    ref_output_img = os.path.join(parent_directory, "RefinedOutput", "images")
    if not os.path.exists(ref_output_img):
        os.makedirs(ref_output_img)

    ref_raw_img = os.path.join(parent_directory, "RefinedOutput", "Rawimages")
    if not os.path.exists(ref_raw_img):
        os.makedirs(ref_raw_img)

def main(image_path, yolo_txt_path):
    # Create the necessary directories
    create_directories_if_not_exist(image_path)
    
    # set all paths
    parent_directory = os.path.dirname(image_path)

    # to hold converted text label files from exp. And mapped outline on the image.
    yolo_json_path = os.path.join(parent_directory, "YoloOutput", "json")
    yolo_output_img = os.path.join(parent_directory, "YoloOutput", "images")


    # to hold randomly annotated image and its json file and text label file.
    annot_output_img = os.path.join(parent_directory, "AnnotOutput", "images")
    annot_json_path = os.path.join(parent_directory, "AnnotOutput", "json")
    annot_txt_path = os.path.join(parent_directory, "AnnotOutput", "labels")

    # to hold refined annotated image, merged images and json file of merged images and text label file.
    ref_output_img=os.path.join(parent_directory, "RefinedOutput", "images")
    ref_raw_img=os.path.join(parent_directory, "RefinedOutput", "Rawimages")
    ref_json_path=os.path.join(parent_directory, "RefinedOutput", "json")
    ref_txt_path=os.path.join(parent_directory, "RefinedOutput", "labels")
    unmerged_json_path=os.path.join(parent_directory, "RefinedOutput", "Unmerged_json")
    
    # Convert raw yolo txt label file to json file and map json annotation on the image
    poly_to_json_command = f"python polyTojson.py {image_path} {yolo_txt_path} {yolo_json_path}"
    os.system(poly_to_json_command)
    
    modify_annots_command = f"python ModifyAnnots.py {image_path} {yolo_json_path} {yolo_output_img}"
    os.system(modify_annots_command)

    # Generate random annotation, map json annotation on the image, generate yolo style txt label files.
    annot_xypix_command = f"python AnnotXYPix.py {image_path} {annot_output_img} {annot_json_path}"
    os.system(annot_xypix_command)

    # annotxypix_json_command = f"python AnnotXYPix_json.py {image_path} {annot_json_path}"
    # os.system(annotxypix_json_command)

    RegionConnection_command = f"python RegionConnection.py {image_path} {annot_json_path}"
    os.system(RegionConnection_command)
    
    json_to_roboflow_command = f"python JsonToRoboflow.py {annot_json_path} {image_path} {annot_txt_path}"
    os.system(json_to_roboflow_command)

    # check coordinate overlap between yolo txt and random txt file and get refined txt file.
    overlap_command = f"python overlap.py {yolo_txt_path} {annot_txt_path} {ref_txt_path}"
    os.system(overlap_command)

    # convert refined txt file to json format file.
    polyTojson_command = f"python polyTojson.py {image_path} {ref_txt_path} {ref_json_path}"
    os.system(polyTojson_command)

    # convert refined txt file to json format file, map json annotation on the image.
    updatejson_command = f"python updatejson.py {annot_json_path} {ref_json_path}"
    os.system(updatejson_command)

    ModifyAnnots_command1 = f"python ModifyAnnots.py {image_path} {ref_json_path} {ref_raw_img}"
    os.system(ModifyAnnots_command1)

    # Copy the json files to unmerged_ref_json_path
    for filename in os.listdir(ref_json_path):
      if filename.endswith(".json"):
        src_file = os.path.join(ref_json_path, filename)
        dst_file = os.path.join(unmerged_json_path, filename)
        shutil.copyfile(src_file, dst_file)

    # Call the auto_merge function
    auto_merge(image_path, ref_json_path)
    
    ModifyAnnots_command = f"python ModifyAnnots.py {image_path} {ref_json_path} {ref_output_img}"
    os.system(ModifyAnnots_command)

    json_to_roboflow_command2 = f"python JsonToRoboflow.py {ref_json_path} {image_path} {ref_txt_path}"
    os.system(json_to_roboflow_command2)


# Check if the script is being run directly
if __name__ == "__main__":
    # Check if the correct number of command-line arguments is provided
    if len(sys.argv) != 3:
        print("Usage: python yoloresult.py <image_path> <yolo_txt_path>")
    else:
        # Extract the image_path and yolo_txt_path from command-line arguments
        image_path = sys.argv[1]
        yolo_txt_path = sys.argv[2]
        
        # Call the main function
        main(image_path, yolo_txt_path)
