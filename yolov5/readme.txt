    
1.We have yolo txt files from yolo model. We want to see them on the image. So we convert them to json first.
It has region region_id,label,coordinates,color.
2. We run modify annots to map yolo json to images. and get the yolo output images.
3. Now we run annotxypix to get random annotation. json file, resulted images. 
the json has region_id,label,coordinates,color,center, pixel_val.
4.We run RegionConnection.py to add a new variable connected_with. and finalize our annot json files.
Now, the json has region_id,label,coordinates,color,center, pixel_val, connected_with.
5. We convert annot json to yolov5 text label format.
6. We check overlap between annot text and yolo text labels. and generate new text label files.
7. Now, if we want to see refined text mapping on image, we convert it to json. 
8.

    poly_to_json_command = f"python polyTojson.py {image_path} {yolo_txt_path} {yolo_json_path}"
    os.system(poly_to_json_command)
    
    modify_annots_command = f"python ModifyAnnots.py {image_path} {yolo_json_path} {yolo_output_img}"
    os.system(modify_annots_command)

    # Generate random annotation, map json annotation on the image, generate yolo style txt label files.
    annot_xypix_command = f"python AnnotXYPix.py {image_path} {annot_output_img} {annot_json_path}"
    os.system(annot_xypix_command)

    RegionConnection_command = f"python /content/drive/MyDrive/GMU/RA/AnnotationTool/RegionConnection.py {image_path} {annot_json_path}"
    os.system(RegionConnection_command)
    
    json_to_roboflow_command = f"python JsonToRoboflow.py {annot_json_path} {image_path} {annot_txt_path}"
    os.system(json_to_roboflow_command)

    # check coordinate overlap between yolo txt and random txt file and get refined txt file.
    overlap_command = f"python overlap.py {yolo_txt_path} {annot_txt_path} {ref_txt_path}"
    os.system(overlap_command)

    # convert refined txt file to json format file, map json annotation on the image.
    polyTojson_command = f"python polyTojson.py {image_path} {ref_txt_path} {ref_json_path}"
    os.system(polyTojson_command)

    # convert refined txt file to json format file, map json annotation on the image.
    updatejson_command = f"python updatejson.py {annot_json_path} {ref_json_path}"
    os.system(updatejson_command)

    # Call the auto_merge function
    auto_merge(image_path, ref_json_path)
    
    ModifyAnnots_command = f"python ModifyAnnots.py {image_path} {ref_json_path} {ref_output_img}"
    os.system(ModifyAnnots_command)
