document.addEventListener("DOMContentLoaded", function () {
      console.log("hello from web");
    // ====================canvas functions====================
      const canvas = new fabric.Canvas('canvas', {
         // backgroundColor: '#6B6B6B',
         backgroundImageStretch: 'none',
         selection: false // Disable Fabric.js default selection behavior

      });

      fabric.Object.prototype.set({
        cornerSize: 6,
        transparentCorners: false
      });

    canvas.setDimensions({ width: 750, height: 650});
    // fabric.Image.fromURL('background.png', function (img) {
    //     canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
    //         scaleX: canvas.width / img.width,
    //         scaleY: canvas.height / img.height
    //     });
    // });


    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover' // Show tooltip on hover only
    }); 
    // $('[data-toggle="popover"]').popover();
    $('[data-toggle="popover"]').popover({
        html: true
    });

    let isErasing = false;
    let global_opacity = 0.6;
    let Shadow_change = 0;
    let global_number=0;
    let global_filename=null;
    let global_scaleFactor=null;
    let global_pos_left=null;
    let global_pos_top=null;
    let global_img_h=null;
    let global_img_w=null;


    const canvasElement= document.getElementById('canvas_div')
    const canvasElement2= document.getElementById('Tempcanvas_div')

    const paginationItems = document.querySelectorAll('.pagination-item');

    let isPanning=false;
    let isZooming = false;
    var toolSize = document.getElementById('ToolSize');

    // let left0_arr=[], left1_arr=[], left2_arr=[]

    //  // Function to be executed after arrays are initialized
    // let left_arr = [];

    // for (let i = 0; i < 4; i++) {
    //     window[`left${i}_arr`] = [];
    // }

    // // Testing the arrays
    // console.log(left0_arr); // []
    // console.log(left1_arr); // []
    // console.log(left2_arr); // []
    // console.log(left3_arr); // []


    //======================Temporary Canvas ==========================

    const canvas2 = new fabric.Canvas('canvas2', {
         backgroundImageStretch: 'none',
         selection: false // Disable Fabric.js default selection behavior
      });

      fabric.Object.prototype.set({
        cornerSize: 6,
        transparentCorners: false,
        selectable: false
      });

    canvas2.setDimensions({ width: 750, height: 650});

    fabric.Image.fromURL('background.png', function (img) {
        canvas2.setBackgroundImage(img, canvas2.renderAll.bind(canvas2), {
            scaleX: canvas2.width / img.width,
            scaleY: canvas2.height / img.height
        });
    });

//========================== Keyboard shortcuts ===========================

let isOverImage = false; // Flag to track if mouse is over an image

canvas.on('mouse:over', function(e) {
    isOverImage = true;
});

canvas.on('mouse:out', function(e) {
    isOverImage = false;
});


document.addEventListener("keydown", function(event) {
    if (event.key === 'b') {
        event.preventDefault(); // Prevent the default behavior
        var paintBrushBtn = document.getElementById('paintBrushBtn');
        paintBrushBtn.click();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === 'e') {
        event.preventDefault(); // Prevent the default behavior
        var paintBrushBtn = document.getElementById('paintBrushBtn');
        eraserBtn.click();
    }
});


document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key ==="+") 
    {
        event.preventDefault(); 
        if(!isZooming)
        {
            turn_on_zoom();
            zoomIn();
        }
        if(isZooming)
        {
            zoomIn();
        }

    }


    if (event.ctrlKey && event.key ==="-") 
    {
        event.preventDefault(); 
        if(!isZooming)
        {
            turn_on_zoom();
            zoomOut();
        }
        if(isZooming)
        {
            zoomOut();
        }

    }

});


    var undoQueue = [];
    var redoStack = [];
    let eraserPaths = [];

document.addEventListener("keydown", function(event) {
    if (event.altKey) {
        UpdateRasterLayer();
    }

});

function UpdateRasterLayer(){
        const objects = canvas.getObjects().filter(obj => obj.type == 'path' || (obj.type=='group' && obj.layerName == 'vectorLayer'));
        
        eraserPaths.forEach(path => {
            path.set('stroke', 'rgba(0,0,0,1)');
            vectorLayer.addWithUpdate(path);
        });

        objects.forEach(obj=>{
            if (obj.type == 'path'){
              console.log(obj);
              obj.set('opacity', global_opacity);
              obj.set('erasable', true);
              vectorLayer.addWithUpdate(obj);
            }
          });

        console.log("Removing", objects);
        canvas.remove(...objects);
        eraserPaths=[];

        console.log("vectorLayer", vectorLayer);
        console.log("rasterOld", rasterOld);
        console.log("firstRasterize", firstRasterize);

        let rasterNew = rasterizeLayer(vectorLayer)
        rasterOld=mergeBinaryMaps(rasterNew, rasterNew);
        addMergedImageToCanvas(rasterOld);
        canvas.renderAll();
}


// helper functions added by Chuan
function rasterizeLayer(layerOfPaths){
    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width; // Set to your Fabric.js canvas width
    tempCanvas.height = canvas.height; // Set to your Fabric.js canvas height

    const ctx = tempCanvas.getContext('2d');
    layerOfPaths.render(ctx);
    var imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    // base64ToPNG(tempCanvas.toDataURL());
    return imageData;
};

function mergeBinaryMaps(imageData1, imageData2) {
    const width = imageData1.width;
    const height = imageData1.height;

    // Create a new ImageData object to store the result
    let mergedData = new ImageData(width, height);

    for (let i = 0; i < imageData1.data.length; i += 4) {
        // Assuming black pixels are strictly RGBA(0, 0, 0, 255)
        if (imageData1.data[i+3] != 0 || imageData2.data[i+3] != 0) {
            // If either of the pixels is black, set the result pixel to black
            mergedData.data[i] = 0; // R
            mergedData.data[i + 1] = 0; // G
            mergedData.data[i + 2] = 0; // B
            mergedData.data[i + 3] = 255; // A
        } else {
            // Else, set the pixel to white
            mergedData.data[i] = 0; // R
            mergedData.data[i + 1] = 0; // G
            mergedData.data[i + 2] = 0; // B
            mergedData.data[i + 3] = 0; // A
        }
    }

    return mergedData;  
}


// just for debug
function base64ToPNG(base64URL){
    // Convert the base64 URL to a blob
    let blob = base64ToBlob(base64URL, 'image/png');

    // Create a blob URL from the blob
    let blobUrl = URL.createObjectURL(blob);

    // Create an anchor element and trigger a download
    let downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = 'downloadedImage.png'; // Name the file

    // Append the anchor to the body (required for Firefox)
    document.body.appendChild(downloadLink);

    // Trigger the download
    downloadLink.click();

    // Clean up by removing the link and revoking the blob URL
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(blobUrl);
};

function base64ToBlob(base64, mimeType) {
    let byteCharacters = atob(base64.split(',')[1]);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        let slice = byteCharacters.slice(offset, offset + 512);
        let byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        let byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    let blob = new Blob(byteArrays, {type: mimeType});
    return blob;
}

function addMergedImageToCanvas(imageData) {
    const objects = canvas.getObjects().filter(obj => obj.layerName == 'rasterLayer');
    canvas.remove(...objects);
    var c = document.createElement('canvas');

    c.setAttribute('id', '_temp_canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    c.imageSmoothingEnabled = true; // Enable image smoothing
    c.getContext('2d').putImageData(imageData, 0, 0);

    // base64ToPNG(c.toDataURL());
    fabric.Image.fromURL(c.toDataURL(), function(img) {
        img.left = 0;
        img.top = 0;
        img.layerName = 'rasterLayer';
        img.opacity=global_opacity;
        img.customImageName=direction+global_number;
        img.erasable = true;
        // img.selectable=true;
        canvas.add(img);
        // img.bringToFront();
        // undoQueue.push(img);
        c = null;
        canvas.renderAll();
    });
}

// ====================Open image functions================

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", handleFileSelect);

const images = [];
const initialSizes = [];
let actual_h=0;
let actual_w=0;
let loadedFlag = false;
let fileOpened = false;
let shadowChanged = false; 

function handleFileSelect(event) {
    console.log("clicked");
    const files = event.target.files;

    const fileName = files[0].name;
    const extension = fileName.split('.').pop().toLowerCase(); // Get the file extension

    if (extension === 'psd'){
        console.log(fileName + ' is a PSD file');
        handlePSDSelect(event);
        if (!fileOpened) {
            fileOpened = true;
            const openPsdLink = event.target.parentNode;
            openPsdLink.setAttribute('data-toggle', 'modal');
            openPsdLink.setAttribute('data-target', '#myModal');
            document.querySelector('.footer p').textContent = fileName;
        }

    } 
    else{
        console.log(fileName + ' has an unknown extension');
    }
    
}


function calculateScaleFactor(originalWidth, originalHeight, targetWidth, targetHeight) {
  const widthRatio = targetWidth / originalWidth;
  const heightRatio = targetHeight / originalHeight;
  const Decimal = Math.min(widthRatio, heightRatio);
  return Math.round(Decimal * 100) / 100; // Round to 2 decimal places
}

function displayImages() {
  canvas.renderAll();
}
//======================load from psd=======================//

psd_layer_names=[];
function handlePSDSelect(event) {
    
    const files = event.target.files;
    console.log("Selected files:");    
    console.log(files[0].name);

    const reader = new FileReader();
    reader.onload = async function() {
        await eel.open_psd_as_binary(reader.result, files[0].name);    
    };
    reader.readAsDataURL(files[0]); // Read the file as binary data
    loader.style.display = 'block';
}


eel.expose(updatePSDSelect);
function updatePSDSelect(fileName){
    if (loadedFlag){
        return 0;
    }
    // prepare the full fileName
    let baseName = fileName.replace(/\.[^.]*$/, ""); // Remove the extension
    global_filename=baseName;
    baseName = baseName.replace("flat", "");
    const flatName = baseName + "_flat.png";
    const lineName = baseName + "_line.png";
    psd_layer_names.push(flatName);
    psd_layer_names.push(lineName);
    console.log("Flat name:", flatName);
    console.log("Line name:", lineName);

    const rel_path = "InputFlats/";         
    psd_layer_names.forEach(psdlayername => {
    folderPath = rel_path+psdlayername;
    fetch(folderPath)
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onload = function (e) {
                loader.style.display = 'none';
                const imgData = e.target.result;
                fabric.Image.fromURL(imgData, function (img) {
                    global_scaleFactor = calculateScaleFactor(img.width, img.height, canvas.width, canvas.height);
                    
                    img.scale(global_scaleFactor);
                    img.customSelected = false; // Custom property to indicate selected state
                    img.customImageName = psdlayername;
                    img.customBase64 = imgData; // Set custom base64 data
                    img.selectable = false;

                    global_pos_top=(canvas.height - img.height * global_scaleFactor) / 2;
                    global_pos_left=(canvas.width - img.width * global_scaleFactor) / 2;
                    img.top = global_pos_top;
                    img.left = global_pos_left;

                    global_img_h=img.height*global_scaleFactor;
                    global_img_w=img.width*global_scaleFactor;

                    canvas.setBackgroundImage(null);
                    let backimg_name = 'backgroundVer.png';
                    if (img.width < 400) {
                        backimg_name = 'backgroundVer.png';
                    } else if (img.width > 400 && img.width < 600) {
                        backimg_name = 'backgroundVer2.png';
                    } else {
                        backimg_name = 'background.png';
                    }


                    fabric.Image.fromURL(backimg_name, function (backimg) {
                        backimg.width=img.width*global_scaleFactor;
                        backimg.height=img.height*global_scaleFactor;
                        backimg.top = global_pos_top;
                        backimg.left = global_pos_left;
                        backimg.customImageName="backgroundImage";
                        canvas.add(backimg);
                        canvas.sendToBack(backimg);
                    });


                    images.push(img);
                    initialSizes.push({ width: img.width, height: img.height });
                    canvas.add(img);
                    updateLayerList(images);
                    displayImages();
                    GenerateShadow();

                });
            };
            reader.readAsDataURL(blob);
        })
        .catch(error => console.error('Error fetching image:', error));
      });
    loadedFlag = true
}


function Save_Image_backend(base64String, imageName){
    eel.save_image_from_base64(base64String, imageName)((response) => {
    console.log(response); // Log the response from the Python function
  });
}

//====================base 64 to image =======================
function base64ToImage(base64String) {
  const byteCharacters = atob(base64String.replace(/^data:image\/(png|jpeg);base64,/, ''));
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: 'image/png' }); // Change the content type based on your image format
  const file = new File([blob], 'image.png', { type: 'image/png' }); // Change the file name and type as needed
  return file;
}

//====================== Reset image position ==========================

function resetPosition() {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // Reset the viewport transform to identity matrix (no zoom or panning)
    canvas.absolutePan(new fabric.Point(0, 0)); // Pan the canvas to the top-left corner
    canvas.setZoom(1); // Reset the zoom level to 1 (no zoom)
    canvas.renderAll(); // Render the canvas to apply the changes
}


// ====================Base Layer functions================

const layerList = document.getElementById("layerList");

function updateLayerList(images) {

  console.log("img_length", images.length);
  layerList.innerHTML = "";

  for (let i = 0; i < images.length; i++) {
    let layerButton = document.createElement("button");
    layerButton.id = `layerButton_${i}`;
    layerButton.className = "btn btn-secondary btn-block";

    const eyeIcon = document.createElement("i");

    eyeIcon.className = images[i].visible ? "fa fa-eye" : "fa fa-eye-slash";
    eyeIcon.style.fontSize="10px";
    eyeIcon.style.marginRight ="5px"; // Adjust the margin as needed

    // Create an image element for the icon
    const iconImage = document.createElement("img");
    iconImage.className = "icon-image"; // Add a class for styling if needed
    iconImage.style.marginRight = "2px";
    iconImage.style.width = "30px"; // Adjust the width of the icon
    iconImage.style.height = "30px";
    iconImage.style.border ="1px solid black";
    iconImage.style.backgroundColor="white";
    iconImage.style.objectFit = "cover";
    const imageFile = base64ToImage(images[i].customBase64);
    iconImage.src = URL.createObjectURL(imageFile);


    const imageNameSpan = document.createElement("span");
    imageNameSpan.innerText = images[i].customImageName;

    const crossIcon = document.createElement("i");
    crossIcon.className = "fa fa-times cross-icon";
    crossIcon.style.float = "right";
    crossIcon.style.marginTop="6px";
    crossIcon.style.marginRight="2px";

    layerButton.appendChild(eyeIcon);
    layerButton.appendChild(iconImage);
    layerButton.appendChild(imageNameSpan);
    layerButton.appendChild(crossIcon);

    layerButton.style.textAlign = "left";
    layerButton.style.backgroundColor = "#6c757d";
    layerButton.style.color = "#ffffff";
    layerButton.style.padding= "4px";

    const iconElement = layerButton.querySelector("i");

    iconElement.addEventListener("click", function (event) {
      event.stopPropagation(); // Stop event propagation
      toggleLayerVisibility(i);
      updateLayerList(images); // Update the button with the new visibility state
      displayImages();
    });


    crossIcon.addEventListener("click", function (event) {
        const removedImage = images.splice(i, 1)[0];
        if (removedImage.customImageName.includes('flat')) {
            const openPsdLink = event.target.parentNode;
            openPsdLink.setAttribute('data-toggle', 'modal');
            openPsdLink.setAttribute('data-target', '#myModal');
        } else {
            canvas.remove(removedImage);
            layerButton.remove();
            console.log("Removing image at index:", i);
            canvas.renderAll();
            updateLayerList(images);
            displayImages();
        }
    });

    layerList.appendChild(layerButton);
  }


}


function toggleLayerVisibility(index) {
  images[index].visible = !images[index].visible;
}

      
// ====================Cursor Information functions================
           // Get the panel body element
        const cursorInfoPanel = document.getElementById('cursorInfo');



//====================Fetching Shadow functions================


const names_shadow_segment = [];
const names_shadow=[];
const shadow_segment_images = [];
const base_shadow_images=[];
const directions = ['back', 'top', 'left', 'right'];
const segments = ['hair', 'face', 'cloth', 'arm', 'object'];

function GenerateShadow() {
    if (names_shadow_segment.length === 0) 
    {
        const firstImage = images.find(image => image.customImageName.includes('flat'))
        if (firstImage) 
        {
            const imageName = firstImage.customImageName;
            // const shadow_image = imageName.replace('flat', 'color');
            const shadow_image = imageName.replace('_flat', '');

            directions.flatMap(direction => {
               
                const baseName = shadow_image.replace('.png', `_${direction}_shadow_`).replace('color_', 'color_');
                
                for (let i = 0; i <= 3; i++) 
                  {
                    const base_shadow= baseName + `${i}.png`;
                    names_shadow.push(base_shadow);
                  }

                segments.flatMap(segment => {
                    const segmentNames = [];
                    for (let i = 0; i <= 3; i++) 
                    {
                        const base_shadow_segment = baseName + `${i}_${segment}.png`;
                        names_shadow_segment.push(base_shadow_segment);
                    }
                });

            });

            // console.log('Base shadow names', names_shadow);
            // console.log('Shadow segment names', names_shadow_segment);

            fetch_Shadow_files(names_shadow);
            fetch_Shadow_files(names_shadow_segment);
            // setShadowOpacity();
        } 
        else {
            console.log('No image on the canvas or the first image is not loaded.');
        }
    } 
    else {
        console.log('Shadows already loaded.');
    }

}

// function fetch_Shadow_files(shadow_arr) {
//     if (shadow_arr == names_shadow_segment) {
//         let relativePath = 'Shadows/sub_shadows/'; // Adjust this relative path based on your directory structure
//         names_shadow_segment.forEach(name => {
//             let fullPath = relativePath + name;
//             fetch(fullPath)
//                 .then(response => {
//                     if (response.ok) {
//                         fabric.Image.fromURL(fullPath, function (img) {
//                             // why scale?
//                             img.customBase64 = img.toDataURL({ format: 'png' });
//                             img.scale(global_scaleFactor);
//                             img.customImageName = name;
//                             img.selectable = false;
//                             img.visible = false;
//                             img.opacity = global_opacity; 
//                             img.top=global_pos_top;
//                             img.left=global_pos_left;
//                             // img.customBase64 = img.toDataURL({ format: 'png' });
//                             canvas.add(img);
//                             shadow_segment_images.push(img);
//                         });
//                     } else {
//                         console.log(`Image ${fullPath} does not exist`);
//                     }
//                 });
//         });
//          // console.log("Loaded shadow_segment_images", shadow_segment_images);
//     } 
//     else {
//         let relativePath = 'Shadows/'; // Adjust this relative path based on your directory structure
//         names_shadow.forEach(name => {
//             let fullPath = relativePath + name;
//             fetch(fullPath)
//                 .then(response => {
//                     if (response.ok) {
//                         fabric.Image.fromURL(fullPath, function (img) {
//                             img.scale(global_scaleFactor);
//                             img.customImageName = name;
//                             img.selectable = false;
//                             img.visible = false;
//                             base_shadow_images.push(img);
//                         });
//                     } else {
//                         console.log(`Image ${fullPath} does not exist`);
//                     }

//                 });
//         });
//         // console.log("Loaded base_shadow_images", base_shadow_images);
//     }
// }

function fetch_Shadow_files(shadow_arr) {
    if (shadow_arr == names_shadow_segment) {
        let relativePath = 'Shadows/sub_shadows/'; // Adjust this relative path based on your directory structure
        names_shadow_segment.forEach(name => {
            let fullPath = relativePath + name;
            fetch(fullPath)
                .then(response => {
                    if (response.ok) {
                        fabric.Image.fromURL(fullPath, function (img) {
                            img.customBase64 = img.toDataURL({ format: 'png' });
                            img.scale(global_scaleFactor);
                            img.customImageName = name;
                            img.selectable = false;
                            img.visible = false;
                            img.opacity = global_opacity; 
                            img.top=global_pos_top;
                            img.left=global_pos_left;
                            canvas.add(img);
                            shadow_segment_images.push(img);
                        });
                    } else {
                        console.log(`Image ${fullPath} does not exist`);
                    }
                })
                .catch(error => {
                    console.error(`Error fetching ${fullPath}:`, error);
                });
        });
    } 
    else {
        let relativePath = 'Shadows/'; // Adjust this relative path based on your directory structure
        names_shadow.forEach(name => {
            let fullPath = relativePath + name;
            fetch(fullPath)
                .then(response => {
                    if (response.ok) {
                        fabric.Image.fromURL(fullPath, function (img) {
                            img.scale(global_scaleFactor);
                            img.customImageName = name;
                            img.selectable = false;
                            img.visible = false;
                            base_shadow_images.push(img);
                        });
                    } else {
                        console.log(`Image ${fullPath} does not exist`);
                    }
                })
                .catch(error => {
                    console.error(`Error fetching ${fullPath}:`, error);
                });
        });
    }
}



const checkboxIds = ['hairCheckbox', 'faceCheckbox', 'clothCheckbox', 'armCheckbox', 'objectCheckbox', 'allCheckbox'];
const buttonIds = ['btnTop', 'btnLeft', 'btnRight', 'btnBack'];
// const left0_arr=[];
let direction = null; 


buttonIds.forEach(buttonId => {
      
      const current_button = document.getElementById(buttonId);
      const carousel = document.getElementById('Carousel_id');

      current_button.addEventListener('click', function () 
      {
            addShadowButton();
            canvasElement2.style.display = 'none';
            canvasElement.style.display = 'block';
            updateBookmarkedShadows();

            if (current_button.classList.contains('active-button')) 
            {
                current_button.classList.remove('active-button');
                Hide_allshadows();
                segments.forEach(seg => {
                    toggleVisibilityByDirectionAndSegment(direction, seg, 0, false);
                });

                carousel.style.display = 'none';


                let opacityDiv = document.getElementById('opacitydiv_id');
                let partDiv = document.getElementById('partdiv_id');              

                opacityDiv.style.display = 'none';
                partDiv.style.display = 'none';
            } 
            else 
            {
              carousel.style.display = 'block';

              buttonIds.forEach(id => 
              {
                 const btn = document.getElementById(id);
                  btn.classList.remove('active-button');
                  Hide_allshadows();
              });
              current_button.classList.add('active-button');

              direction = buttonId.replace('btn', '').toLowerCase(); // Store the selected direction
              console.log('Selected Direction:', direction);

              segments.forEach(seg => {
                    toggleVisibilityByDirectionAndSegment(direction, seg, 0, true);
              });

              setCardBackgroundImages(direction)
              global_number=0;
              updateCheckboxes();
            }
            // Example usage
      });
});


function toggleVisibilityByDirectionAndSegment(direction, segment, index, isVisible) {

  console.log(direction, segment, index, isVisible);
  if (isErasing) {
          const eraserBtn_1 = document.getElementById("eraserBtn");
          eraserBtn_1.click();
  }
  
  names_shadow_segment.forEach(name => {
    const isDirectionMatch = name.includes(`_${direction}_`);
    const isSegmentMatch = name.endsWith(`_${segment}.png`);
    const isIndexMatch = name.includes(`shadow_${index}`);

    if (isDirectionMatch && isSegmentMatch && isIndexMatch) 
          {
                const image = canvas.getObjects().find(obj => obj.customImageName === name);
                if (image) {
                  image.erasable = true;
                  image.visible = isVisible;
                  canvas.renderAll();
                }
                else{
                  canvas.renderAll();
                }
          }

  });

}

//============================= Part selector checkboxes ========================

function getSegmentNames() {
    const segments_exist= {};
    shadow_segment_images.forEach(img => {
        const imageName = img.customImageName;
        const segment = imageName.substring(imageName.lastIndexOf('_') + 1, imageName.lastIndexOf('.'));
        segments_exist[segment] = true;
    });
    return Object.keys(segments_exist);
}


function updateCheckboxes() {
    const segments_exist = getSegmentNames();
    const checkboxes = document.querySelectorAll('[id$="Checkbox"]');
    checkboxes.forEach(checkbox => {
        const idSegments = checkbox.id.split('Checkbox')[0];
        const isDisabled = !segments_exist.some(segment => idSegments.includes(segment));
        checkbox.checked = !isDisabled && segments_exist.includes(idSegments);
        checkbox.disabled = isDisabled;
    });
}

// Function to toggle the visibility of canvas objects based on checkbox state
function toggleVisibilityByCheckbox(label) {
    let number=global_number;
    let checkbox = document.getElementById(`${label}Checkbox`);
    toggleVisibilityByDirectionAndSegment(direction, label, number, checkbox.checked);
    canvas.renderAll();
}


// Add click event listeners to each checkbox
document.getElementById('hairCheckbox').addEventListener('click', function() {
    toggleVisibilityByCheckbox('hair');
});

document.getElementById('faceCheckbox').addEventListener('click', function() {
    toggleVisibilityByCheckbox('face');
});

document.getElementById('clothCheckbox').addEventListener('click', function() {
    toggleVisibilityByCheckbox('cloth');
});

document.getElementById('armCheckbox').addEventListener('click', function() {
    toggleVisibilityByCheckbox('arm');
});

document.getElementById('objectCheckbox').addEventListener('click', function() {
    toggleVisibilityByCheckbox('object');
});


const cursorInfo = document.getElementById('cursorInfo');
const allCheckbox = document.getElementById('allswitch');
allCheckbox.addEventListener('change', function () {
    if (this.checked) {
        cursorInfo.style.display = 'block';
        getOutline(this.checked);
        document.getElementById('collapse4').style.maxHeight = '200px';
        document.getElementById('collapse4').style.overflowY = 'auto';
        document.getElementById('collapse2').style.maxHeight = '420px';
        document.getElementById('collapse2').style.overflowY = 'auto';
    } else {
        cursorInfo.style.display = 'none';
        getOutline(this.checked);
        document.getElementById('collapse4').style.maxHeight = '250px'; // Reset to the default max-height
        document.getElementById('collapse4').style.overflowY = 'auto';
    }
});

//===================adding shadow layers====================

let savedCounter=1;
let savedLayers = [];
let savedShadowsOnly = [];
let CRshadow_eye = null;
function addShadowButton() {
    if (document.getElementById("currentLayer")) {
        return; 
    }

    const shadowButton = document.createElement("button");
    shadowButton.id = "currentLayer"; 

    shadowButton.className = "btn btn-block";
    shadowButton.style.textAlign = "left";
    shadowButton.style.backgroundColor = "#6c757d";
    shadowButton.style.color = "#ffffff";
    shadowButton.style.padding="4px"

    const SHEyeIcon = document.createElement("i");
    SHEyeIcon.id="CurrentEye";
    SHEyeIcon.className = canvasElement2.style.display == 'none' ? "fa fa-eye" : "fa fa-eye-slash";
    SHEyeIcon.style.fontSize = "10px";
    SHEyeIcon.style.marginRight = "5px";

    const iconImageS = document.createElement("img");
    iconImageS.className = "icon-image"; 
    iconImageS.style.marginRight = "2px";
    iconImageS.style.width = "30px"; 
    iconImageS.style.height = "30px";
    iconImageS.style.border ="1px solid black";
    iconImageS.style.backgroundColor="white";
    iconImageS.style.objectFit = "cover";

    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas.getElement(), 0, 0, canvas.width, canvas.height);
    iconImageS.src = tempCanvas.toDataURL();

    const tickIcon = document.createElement("i");
    tickIcon.className = "fa fa-bookmark-o";
    tickIcon.style.float = "right";
    tickIcon.style.marginTop = "5px";


    const downloadIcon = document.createElement("i");
    downloadIcon.className = "fa fa-bookmark";
    downloadIcon.style.float = "right";
    downloadIcon.style.marginTop = "5px";

    let NameSpan = document.createElement("span");
    NameSpan.innerText = 'Shadow Layer';  

    shadowButton.appendChild(SHEyeIcon);
    shadowButton.appendChild(iconImageS);
    shadowButton.appendChild(NameSpan);
    shadowButton.appendChild(tickIcon);
    CRshadow_eye = SHEyeIcon;

    shadowList.appendChild(shadowButton);

    tickIcon.addEventListener("click", function (event) {

        togglePolygonVisibility(false) 

        //saving the current canvas status
        const canvasStatus = JSON.stringify(canvas.toJSON());

        savedLayers.push(canvasStatus);

        const filteredObjects = canvas.getObjects().filter(obj => !obj.customImageName || (!obj.customImageName.includes('flat') && !obj.customImageName.includes('line') && !obj.customImageName.includes('backgroundImage')));
        console.log(filteredObjects);

        const tempCanvas = new fabric.Canvas(null, { width: canvas.getWidth(), height: canvas.getHeight() });
        filteredObjects.forEach(obj => tempCanvas.add(obj));
        

        const canvasStatus1 = JSON.stringify(tempCanvas.toJSON());

        savedShadowsOnly.push(canvasStatus1);

        updateBookmarkedShadows();
    });


    shadowButton.addEventListener("mouseenter", function() {
        shadowButton.style.backgroundColor = "#494949"; // Change to the desired color
    });

    shadowButton.addEventListener("mouseleave", function() {
        shadowButton.style.backgroundColor = "#6c757d"; // Change back to the original color
    });

    shadowButton.addEventListener("click", function (event) {
            canvasElement2.style.display = 'none';
            canvasElement.style.display = 'block';
            updateBookmarkedShadows();
    });

}


const BmShadow_div = document.getElementById("BM_shadowList");
let BM_canvas_visible= false;
let visibility_arr=[];

function updateBookmarkedShadows(){
    BmShadow_div.innerHTML = "";

    for (let i = 0; i < savedLayers.length; i++) 
    {
        let BMshadow_btn = document.createElement("button");
        
        CRshadow_eye.className = canvasElement2.style.display == 'none' ? "fa fa-eye" : "fa fa-eye-slash";

        BMshadow_btn.id = `BMshadowbtn_${i}`;

        BMshadow_btn.className = "btn btn-block";
        BMshadow_btn.style.textAlign = "left";
        BMshadow_btn.style.backgroundColor = "#6c757d";
        BMshadow_btn.style.color = "#ffffff";
        let NameSpan = document.createElement("span");
        NameSpan.innerText = 'Saved Shadow '+ (i+1);


        const BMEyeIcon = document.createElement("i");
        // BMEyeIcon.className = visibility_arr[i] ? "fa fa-eye" : "fa fa-eye-slash";
        BMEyeIcon.className = visibility_arr[i] && canvasElement.style.display == 'none' ? "fa fa-eye" : "fa fa-eye-slash";
        BMEyeIcon.style.fontSize = "10px";
        BMEyeIcon.style.marginRight = "8px";

        const BmIconImg = document.createElement("img");
        BmIconImg.className = "icon-image"; 
        BmIconImg.style.marginRight = "2px";
        BmIconImg.style.width = "30px"; 
        BmIconImg.style.height = "30px";
        BmIconImg.style.border ="1px solid black";
        BmIconImg.style.backgroundColor="white";
        BmIconImg.style.objectFit = "cover";

        let iconCanvas = document.createElement('canvas');
        let iconCanvasCtx = iconCanvas.getContext('2d');
        iconCanvas.width = canvas.width;
        iconCanvas.height = canvas.height;
        iconCanvasCtx.drawImage(canvas.getElement(), 0, 0, canvas.width, canvas.height);
        BmIconImg.src = iconCanvas.toDataURL();


        BMshadow_btn.appendChild(BMEyeIcon);
        BMshadow_btn.appendChild(NameSpan);


        const BMiconElement = BMshadow_btn.querySelector("i");
        BMiconElement.addEventListener("click", function (event) {
          event.stopPropagation(); // Stop event propagation
          toggleBMCanvas(BMshadow_btn.id, i);
          updateBookmarkedShadows(); // Update the button with the new visibility state
        });

        BMshadow_btn.addEventListener("mouseenter", function() {
            BMshadow_btn.style.backgroundColor = "#494949"; // Change to the desired color
        });

        BMshadow_btn.addEventListener("mouseleave", function() {
            BMshadow_btn.style.backgroundColor = "#6c757d"; // Change back to the original color
        });


        BmShadow_div.appendChild(BMshadow_btn);
    }

}

let activeBMButtonId = null;

function toggleBMCanvas(BM_button_id, val) {
    visibility_arr = new Array(visibility_arr.length).fill(false);
    if (activeBMButtonId === BM_button_id ) {
            console.log(`Button ${BM_button_id} is already active`);
            if (canvasElement2.style.display === 'none') 
            {
                visibility_arr[val]=true;
                canvasElement2.style.display = 'block';
                canvasElement.style.display = 'none';
            } 
            else 
            {
                visibility_arr[val]=false;
                canvasElement2.style.display = 'none';
                canvasElement.style.display = 'block';
            }
    } 
    else 
    {
        console.log(`Button ${BM_button_id} is clicked`);
        canvasElement2.style.display = 'block';
        canvasElement.style.display = 'none';
        const savedCanvasData = JSON.parse(savedLayers[val]);

        canvas2.loadFromJSON(savedCanvasData, function() {
            canvas2.renderAll();
        });
        activeBMButtonId = BM_button_id;
        visibility_arr[val]=true;
    }
}


function Download_Bookmarked() {
    for (let i= 0; i < savedShadowsOnly.length; i++) {
            const savedCanvasData = JSON.parse(savedShadowsOnly[i]);

            const tempCanvas3 = new fabric.Canvas(null, { width: canvas.getWidth(), height: canvas.getHeight() });
            const originalWidth = tempCanvas3.getWidth();
            const originalHeight = tempCanvas3.getHeight();

            tempCanvas3.loadFromJSON(savedCanvasData, function() {
                const scaleFactor = global_scaleFactor*10;

                tempCanvas3.setWidth(originalWidth * scaleFactor);
                tempCanvas3.setHeight(originalHeight * scaleFactor);
                tempCanvas3.setZoom(scaleFactor);

                tempCanvas3.renderAll();

                const dataURL = tempCanvas3.toDataURL('image/png', 1.0);

                const link = document.createElement('a');
                link.download = global_filename+`_bookmarked.png`;
                link.href = dataURL;
                link.click();
            });
    }
}


//===================save image=====================//

const saveBtn = document.getElementById("save_id");
saveBtn.addEventListener('click', saveCanvasImage);


function saveCanvasImage() {

    Download_Bookmarked();
    const filteredObjects = canvas.getObjects().filter(obj => !obj.customImageName || (!obj.customImageName.includes('flat') && !obj.customImageName.includes('line') && !obj.customImageName.includes('backgroundImage')));

    // Create a new canvas with the filtered objects
    const tempCanvas2 = new fabric.Canvas(null, { width: canvas.getWidth(), height: canvas.getHeight() });
    filteredObjects.forEach(obj => tempCanvas2.add(obj));

    // Download the canvas image
    const scaleFactor = global_scaleFactor*10;
    const backgroundImage = tempCanvas2.backgroundImage;
    tempCanvas2.backgroundImage = null;

    // Scale up the canvas
    const originalWidth = tempCanvas2.getWidth();
    const originalHeight = tempCanvas2.getHeight();
    tempCanvas2.setWidth(originalWidth * scaleFactor);
    tempCanvas2.setHeight(originalHeight * scaleFactor);
    tempCanvas2.setZoom(scaleFactor);

    tempCanvas2.renderAll();

    const dataURL = tempCanvas2.toDataURL('image/png', 1.0);

    tempCanvas2.backgroundImage = backgroundImage;
    tempCanvas2.setWidth(originalWidth);
    tempCanvas2.setHeight(originalHeight);
    tempCanvas2.setZoom(1);

    const link = document.createElement('a');
    link.download = global_filename+`_current.png`;
    link.href = dataURL;
    link.click();
}



//===================shadow opacity function====================//


const opacityRange = document.getElementById('opacityRange');
opacityRange.value = global_opacity;
document.getElementById('opacityValue').textContent = global_opacity.toFixed(1);

      function updateOpacity(value) {
          global_opacity = parseFloat(value);
          document.getElementById('opacityValue').textContent = global_opacity.toFixed(1);
          
          shadow_segment_images.forEach((shadow) => {
              shadow.set('opacity', global_opacity);
          });

          canvas.getObjects().forEach(obj => {
                canvas.getObjects().forEach(obj => {
                    if (obj.type === 'path' || obj.layerName==='rasterLayer' || obj.layerName ==='vectorLayer') {
                        // obj.set('stroke', 'black');
                        obj.set('opacity', value);
                    }
                });
            });
           canvas.freeDrawingBrush.color = 'rgba(0,0,0,'+global_opacity+')';

          displayImages();
      }

      document.getElementById('opacityRange').addEventListener('input', function() {
          updateOpacity(this.value);
      });


//========================draw segments=========================//


        let isDataFetched = false;
        let polygonVisible = false;  // Add a flag to track the visibility of the polygon


        function getOutline(checkval){
            // let port = eel.get_port();

            const isChecked = checkval;

            if (isChecked) {
                const FlatImage = images.find(image => image.customImageName.includes('flat'))
                if (!isDataFetched||FlatImage.customImageName !== jsonFileName) {
                    jsonFileName = FlatImage.customImageName.replace('.png', '.json');
                    // console.log(jsonFileName);
                    fetch(`RefinedOutput/json/${jsonFileName}`)
                        .then(response => response.json())
                        .then(data => {
                            isDataFetched = true;

                            data.regions.forEach(region => {
                                const originalCoordinates = region.coordinates;
                                const color = region.color; // Get color from JSON
                                // console.log("ScaleFactor from getOutline", global_scaleFactor)
                                const scaledCoordinates = originalCoordinates.map(point => ({
                                    x: point[0] * global_scaleFactor + global_pos_left,
                                    y: point[1] * global_scaleFactor + global_pos_top
                                }));

                                // Draw the polygon on the canvas and set its initial visibility
                                drawPolygon(scaledCoordinates, region.label);
                            });
                        })
                        .catch(error => console.error('Error fetching JSON file:', error));

                } else {
                    // Data has already been fetched, toggle visibility based on the button state
                    polygonVisible = isChecked;
                    // console.log(polygonVisible);
                    togglePolygonVisibility(polygonVisible);
                }
            }
            else{
                    polygonVisible = false;
                    togglePolygonVisibility(polygonVisible);
            }
          }


        const colors = {
            hair: '#66c2a5',
            face: '#8da0cb',
            cloth: '#fc8d62',
            arm: '#e78ac3',
            object: '#a6d854'
        };

        function drawPolygon(points, label) {
            const color = colors[label] || 'black'; // Default to black if label not found in colors array
            const rgbColor = hexToRgb(color);

            const polygon = new fabric.Polygon(points, {
                fill: 'transparent',
                stroke: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`, // Assign color to stroke
                strokeWidth: 2,
                selectable: false,
                isPolygon: true,
                smooth: true,
                erasable: false,
                strokeUniform: true
            });
            canvas.add(polygon);
            canvas.renderAll();
        }


        function hexToRgb(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function togglePolygonVisibility(isVisible) {
            canvas.forEachObject(function (obj) {
                if (obj.isPolygon) {
                    obj.set('visible', isVisible);
                }
            });
            canvas.renderAll();
        }


//======================zooming functionality=======================//
//======================zooming functionality=======================//
//Zooming variables///
      const zoomInButton = document.getElementById("zoomInButton");
      const zoomOutButton = document.getElementById("zoomOutButton");
      const zoomPercentageElement = document.getElementById("zoomPercentage");

        zoomInButton.addEventListener("click", zoomIn);
        zoomOutButton.addEventListener("click", zoomOut);
        
        
        function zoomIn() {
            const zoom = canvas.getZoom();
            const center = { x: canvas.width / 2, y: canvas.height / 2 };
            canvas.zoomToPoint(center, zoom * 1.1);
            updateZoomPercentage();
        }

        function zoomOut() {
            const zoom = canvas.getZoom();
            const center = { x: canvas.width / 2, y: canvas.height / 2 };
            if (zoom <= 1) {
                resetPosition(); // Reset the image position to its initial position
            }

            canvas.zoomToPoint(center, zoom / 1.1);
            updateZoomPercentage();
        }


        function updateZoomPercentage() {
          const zoomPercentage = (canvas.getZoom() * 100).toFixed(0);
          zoomPercentageElement.innerText = `${zoomPercentage}%`;

        }

          const zoomButton = document.getElementById("searchButton");
          const zoomControls = document.getElementById("zoomControls");

          // Initially hide the zoom controls
          zoomControls.style.display = "none";

          // // Add click event listener to the search button
          // zoomButton.addEventListener("click", function() {
          //   isZooming=!isZooming;
          //   if(isZooming)
          //   {
          //       zoomButton.style.backgroundColor = "black";
          //       zoomButton.style.color = "white";
          //       deactivatePanning();
          //       deactivatePainting();
          //       deactivateEraser();
          //       deactivateUndoEraser();

          //       canvasElement2.style.display = 'none';
          //       canvasElement.style.display = 'block';

          //       updateBookmarkedShadows();
          //       // Toggle visibility of the zoom controls
          //       if (zoomButton.classList.toggle("checked")) {
          //         zoomControls.style.display = "block";
          //       } else {
          //         zoomControls.style.display = "none";
          //       }
          //   }
          //   else{
          //         zoomButton.style.backgroundColor = "";
          //         zoomButton.style.color = "";
          //   }

          // });

           zoomButton.addEventListener("click", function() 
          {
                isZooming=!isZooming;
                updateBookmarkedShadows();
                console.log("zooming is ", isZooming);
                if(isZooming){
                    console.log("zoom is on")
                    turn_on_zoom();
                }
                else{
                    console.log("zoom is off")
                    deactivateZooming();
                }

          });

function turn_on_zoom(){
    zoomButton.style.backgroundColor = "#B5B5B5";
    // zoomButton.style.color = "white";
    deactivatePanning();
    deactivatePainting();
    deactivateEraser();
    deactivateUndoEraser();
    zoomControls.style.display = "block";
    isZooming=true;
}


function deactivateZooming() {
  isZooming = false;
  zoomButton.style.backgroundColor='';
  zoomButton.style.color='';
  zoomControls.style.display = "none";
}

//======================panning===============================//
const panBtn = document.getElementById("panBtn");

// Add event listener to the pan button
panBtn.addEventListener("click", togglePanning);

function togglePanning() {
  canvasElement2.style.display = 'none';
  canvasElement.style.display = 'block';
  updateBookmarkedShadows();
  isPanning = !isPanning;

  // Change the cursor style of the canvas based on the panning mode
  if (isPanning) {
    deactivateEraser();
    deactivatePainting();
    deactivateZooming();
    canvas.hoverCursor = 'pointer';
    panBtn.style.backgroundColor = "#B5B5B5";
    // panBtn.style.color = "";
  } else {
    canvas.hoverCursor = 'default';
    panBtn.style.backgroundColor = "";
    panBtn.style.color = "";
  }
}

// Add event listener to the canvas to handle panning
canvas.on("mouse:down", function (event) {
  if (isPanning) {
    canvas.set("isGrabMode", true); // Enable fabric.js grab mode for panning
    canvas.selection = false; // Disable object selection while panning
    canvas.lastPosX = event.e.clientX;
    canvas.lastPosY = event.e.clientY;
  }
});


canvas.on("mouse:move", function (event) {
  if (isPanning && canvas.isGrabMode) {
    const deltaX = event.e.clientX - canvas.lastPosX;
    const deltaY = event.e.clientY - canvas.lastPosY;
    const zoom = canvas.getZoom();
    const imgWidth = global_img_w * zoom;
    const imgHeight = global_img_h * zoom;

    // if (imgWidth > canvas.width) {
    //   let maxLeft = Math.min(0, (canvas.width - imgWidth)/2);
    //   const newLeft = Math.max(maxLeft, Math.min(0, canvas.viewportTransform[4] + deltaX));
    //   const actualDeltaX = newLeft - canvas.viewportTransform[4];
    //   canvas.relativePan(new fabric.Point(actualDeltaX, 0));
    //   canvas.lastPosX = event.e.clientX;
    // }

    if (imgWidth > canvas.width) {
        const delta = new fabric.Point(event.e.clientX - canvas.lastPosX, event.e.clientY - canvas.lastPosY);
        canvas.relativePan(delta);
        canvas.lastPosX = event.e.clientX;
    }
    
    if (imgHeight > canvas.height) {
      const maxTop = Math.min(0, canvas.height - imgHeight);
      const newTop = Math.max(maxTop, Math.min(0, canvas.viewportTransform[5] + deltaY));
      const actualDeltaY = newTop - canvas.viewportTransform[5];
      canvas.relativePan(new fabric.Point(0, actualDeltaY));
      canvas.lastPosY = event.e.clientY;
    }
  }
});


canvas.on("mouse:up", function () {
  if (isPanning) {
    canvas.set("isGrabMode", false); // Disable fabric.js grab mode
    canvas.selection = true; // Re-enable object selection
  }
});


function deactivatePanning() {
  isPanning = false;
  panBtn.style.backgroundColor='';
  panBtn.style.color='';
  canvas.hoverCursor = 'default';
}


function handlePanning() {
  if (isSpacePressed) { // Check if spacebar is pressed
    togglePanning();
  }
}


let isSpacePressed = false;
let hasReturnedTrue = false;

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        isSpacePressed = true;
        if (!hasReturnedTrue) {
            hasReturnedTrue = true;
            console.log('Spacebar pressed continuously');
            togglePanning();
        }
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        isSpacePressed = false;
        hasReturnedTrue = false;
        deactivatePanning();
    }
});

//===============eraser code========================//
var isPainting = false;
let undoErasing = false;

const eraserBtn = document.getElementById("eraserBtn");

eraserBtn.addEventListener("click", toggleErasing);

let global_brush_width=10;

function toggleErasing() {
    isErasing = !isErasing;
    isPainting=false;

    deactivatePainting();
    deactivateUndoEraser();
    deactivatePanning();
    deactivateZooming();

    if (isErasing) {   
        toolSize.style.display = 'flex'
        canvas.isDrawingMode = true;
        eraserBtn.style.backgroundColor = "#B5B5B5";

        // Set the eraser brush and its width
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = global_brush_width;

        // Listen for the path:created event to get the eraser path
        canvas.on('path:created', function(e) {
            var path = e.path;
            console.log('Eraser Path:', path);
            eraserPaths.push(path);
        });

        // Set objects to be erasable
        canvas.forEachObject(function(obj) {
            if (obj.type === 'image') {
                for (let i = 0; i < images.length; i++) {
                    if (images[i].customImageName === obj.customImageName) {
                        obj.erasable = false;
                        break;
                    }
                }
            }
            if (!obj.visible || obj.customImageName === 'backgroundImage') {
                obj.erasable = false;
            }
        });

    } else {
        isErasing = false;
        toolSize.style.display = 'none'
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.isDrawingMode = false;
        eraserBtn.style.backgroundColor = "";
        eraserBtn.style.color = "";

        canvas.off('path:created');
    }
}

const undoEraser = document.getElementById("magicBtn");
undoEraser.addEventListener("click", UndoErase);

function UndoErase() {
    deactivatePainting();
    deactivateEraser();
    deactivateZooming();
    undoErasing = !undoErasing;
    // console.log("undoErasing clicked", undoErasing);
    if(undoErasing)
    {
    // console.log("undoErasing", undoErasing);
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.freeDrawingBrush.width = global_brush_width;
    canvas.freeDrawingBrush.inverted = true;
    undoEraser.style.backgroundColor = "#B5B5B5";
    // undoEraser.style.color = "white";
    }
    else
    {
    console.log("undoErasing", undoErasing);
    canvas.freeDrawingBrush.width = 0;
    undoEraser.style.backgroundColor = "";
    undoEraser.style.color = "";
    }

}

//============================run eel===============================//
    // document.getElementById('backendButton').addEventListener('click', function() {
    //     // Call the run_python_file() function exposed by Eel
    //     eel.run_python_file();
    // });




//========================paint brush functions==========================//


    const cursorUrl = 'circle_icon.png';
    var mousecursor; 
    // var undoStack = [];
    // var redoStack = [];

    let vectorLayer = new fabric.Group([], 
          {
            subTargetCheck: true,
            layerName: "vectorLayer"
          }
      );
    let rasterOld = new ImageData(canvas.width, canvas.height);
    let firstRasterize = true;

    document.getElementById('paintBrushBtn').addEventListener('click', function() {
        var toolSize = document.getElementById('ToolSize');
        isPainting= !isPainting;
        isErasing=false;
        deactivateEraser();
        deactivateUndoEraser(); 
        deactivateZooming();
        deactivatePanning();

        if (isPainting) {
            canvas.isDrawingMode = true;
            toolSize.style.display = 'flex';
            canvas.freeDrawingBrush.width = global_brush_width;
            canvas.freeDrawingBrush.color = 'rgba(0,0,0,'+global_opacity+')';

            this.style.backgroundColor = '#B5B5B5';
        } 
        else {
            toolSize.style.display = 'none'
            canvas.isDrawingMode = false;
            this.style.backgroundColor = '';
            this.style.color = '';
        }
    });

    let selectedCircleId = null;

    document.querySelectorAll('#drawSizeCircle span').forEach(function(circle_id) {
        circle_id.style.color = 'black';

        circle_id.addEventListener('click', function(event) {
            if (selectedCircleId === circle_id.id) {
                canvas.freeDrawingBrush.width = 1;
                canvas.freeDrawingBrush.color = 'rgba(0,0,0,'+global_opacity+')';
                selectedCircleId = null;
                this.style.color = 'black';
                this.style.backgroundColor= '';
                document.getElementById('BrushRange').value = 1;
                Drawing_Cursor(10);
            } 
            else {
                console.log('Circle span clicked: ', circle_id.id);
                canvas.freeDrawingBrush.width = parseInt(circle_id.id);
                canvas.freeDrawingBrush.color = 'rgba(0,0,0,'+global_opacity+')';
                selectedCircleId = circle_id.id;
                global_brush_width= parseInt(circle_id.id);

                document.querySelectorAll('#drawSizeCircle span').forEach(function(span) {
                span.style.color = 'black';
                span.style.backgroundColor= '';
            });

            this.style.color = 'white';
            this.style.backgroundColor= 'black';

            document.getElementById('BrushRange').value = circle_id.id;
            Drawing_Cursor(circle_id.id);
            }
        });
    });

    document.getElementById('BrushRange').addEventListener('input', function () {
        document.querySelectorAll('#drawSizeCircle span').forEach(function(span) {
            span.style.color = 'black';
            span.style.backgroundColor= '';
        });
        var rangeValue = parseFloat(this.value);
        console.log(rangeValue);
        canvas.freeDrawingBrush.width = parseInt(rangeValue);
        global_brush_width=parseInt(rangeValue);
        Drawing_Cursor(rangeValue);
    });
            
    function Drawing_Cursor(cursor_Size){
        canvas.freeDrawingBrush.color = 'rgba(0,0,0,'+global_opacity+')';
        canvas.isDrawingMode = true;

        var cursorCanvas = document.createElement('canvas');
        var cursorCtx = cursorCanvas.getContext('2d');
        var cursorSize = cursor_Size; // Set the size of the cursor circle
        cursorCanvas.width = cursorSize;
        cursorCanvas.height = cursorSize;

        cursorCtx.beginPath();
        cursorCtx.arc(cursorSize / 2, cursorSize / 2, cursorSize / 2, 0, 2 * Math.PI);
        cursorCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        cursorCtx.fill();

        canvas.freeDrawingCursor = 'url(' + cursorCanvas.toDataURL() + ') ' + cursorSize / 2 + ' ' + cursorSize / 2 + ', auto';
    }


//=================================Deactivate drawing tools ============================//
function deactivateEraser() {
    isErasing = false;
    var eraserBtn = document.getElementById('eraserBtn');
    eraserBtn.style.backgroundColor = '';
    eraserBtn.style.color = '';
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.isDrawingMode = false;
    canvas.off('path:created');
    toolSize.style.display = 'none'
}

function deactivatePainting() {
    isPainting = false;
    var paintBrushBtn = document.getElementById('paintBrushBtn');
    paintBrushBtn.style.backgroundColor = '';
    paintBrushBtn.style.color = '';
    canvas.isDrawingMode = false;
    toolSize.style.display = 'none'
}

function deactivateUndoEraser() {
    undoErasing = false;
    var UndoEraseBtn = document.getElementById("magicBtn");
    UndoEraseBtn.style.backgroundColor = '';
    UndoEraseBtn.style.color = '';
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.isDrawingMode = false;
    toolSize.style.display = 'none'
}


//============================== undo redo===============================

// Event listeners for undo and redo buttons
document.getElementById('UndoBtn').addEventListener('click', undo);
document.getElementById('RedoBtn').addEventListener('click', redo);

function undo() {
    deactivatePainting();
    deactivateZooming();
    deactivateEraser();
    deactivateUndoEraser();
    deactivatePanning();

    const vectorPaths = vectorLayer.getObjects();

    if (vectorPaths.length > 0) {
        const lastPath = vectorPaths[vectorPaths.length - 1];
        redoStack.push(lastPath)
        vectorLayer.removeWithUpdate(lastPath);
    }
    console.log("clickedUndo vector", vectorPaths.length);
    UpdateRasterLayer();
}


function redo() {
    deactivatePainting();
    deactivateZooming();
    deactivateEraser();
    deactivateUndoEraser();
    deactivatePanning();

    console.log(redoStack);
    if (redoStack.length > 0) {
        var last_redo_object = redoStack.pop();
        vectorLayer.addWithUpdate(last_redo_object);
    }
    console.log("clicked Redo vector", vectorLayer);
    UpdateRasterLayer();
}

//=============================== vectorLayer operation====================================//

// function SaveVectorLayer(vect_arr){
//        const vectorPaths = vectorLayer.getObjects();
        
//         vectorPaths.forEach((index) => {
//             vect_arr.push( vectorPaths[index]);
//         });
//         return vect_arr;

// }

function SaveVectorLayer(vect_arr) {
    const vectorPaths = vectorLayer.getObjects();

    vectorPaths.forEach(path => {
        vect_arr.push(path);
        vectorLayer.removeWithUpdate(path);
    });

    return vect_arr;
}

function GetVectorLayers(vect_arr)
{
        vect_arr.forEach(item => {
            vectorLayer.addWithUpdate(item);
        });
        UpdateRasterLayer();
}

//============================ Drawing Layer dictionary================================//
let objectsDictionary = {};

function addObjectToDictionary(id) {
    let drawn_images = canvas.getObjects().filter(obj => obj.type === 'image' && obj.layerName === 'rasterLayer');

    if (objectsDictionary[id]) {
        objectsDictionary[id].images = images;
        console.log("Images updated in dictionary for ID", id);
        console.log("Object added to dictionary:", objectsDictionary);
    } else {
        objectsDictionary[id] = { id: id, direction: direction, global_number: global_number, images: drawn_images};
        console.log("Object added to dictionary:", objectsDictionary);
    }
}
function removeAllPaths() {
    let drawn_images= canvas.getObjects().filter(obj => obj.type === 'image' && obj.layerName === 'rasterLayer');
    canvas.remove(...drawn_images);
}

//==========================carousel functions=====================================//

const prev = document.querySelector(".prev");
const next = document.querySelector(".next");
const carousel = document.querySelector(".carousel-container");
const track = document.querySelector(".track");

let width = 300; // Assuming each card-container has a width of 120px and padding-right of 10px
let index = 0;

window.addEventListener("resize", function () {
  width = carousel.offsetWidth;
});


next.addEventListener("click", function (e) {
            goTo(3); 
});

prev.addEventListener("click", function (e) {
            goTo(0); 
});



function Hide_allshadows(){
    canvas.getObjects().forEach(obj => {
                  if (obj.customImageName && obj.customImageName.includes('shadow')) {
                      obj.visible = false;
                  }
    });
}

function goTo(index) {
  let translateX = -index * width;
  if (translateX < -250) {
    translateX = -250;
  }
  track.style.transform = "translateX(" + translateX + "px)";

  // Update index and manage next/prev button visibility
  if (index === 0) {
    prev.classList.remove("show");
  } else {
    prev.classList.add("show");
  }

  if (index === track.children.length - 2) {
    next.classList.add("hide");
  } else {
    next.classList.remove("hide");
  }
}

// Initial setup
goTo(0);


let clicked_index= null;

function setCardBackgroundImages(direction) {
    
    goTo(0);
    
    let opacityDiv = document.getElementById('opacitydiv_id');
    let partDiv = document.getElementById('partdiv_id');
    let carnav = document.querySelector('#Carousel_id .nav');
    let changeSizeDiv = document.getElementById('ChangeSize');
    let paginationDiv= document.getElementById('pagination');

    paginationItems.forEach(item => item.classList.remove('active'));
    paginationItems[0].classList.add('active');
   
    carnav.style.display = 'block';
    opacityDiv.style.display = 'block';
    partDiv.style.display = 'block';
    changeSizeDiv.style.display = 'block';
    paginationDiv.style.display = 'flex'

    let card_images = base_shadow_images.filter(img => img.customImageName.includes(direction));
    let card_images_sorted = card_images.sort((a, b) => {
            let numA = parseInt(a.customImageName.match(/_([0-9]+)\.png/)[1]);
            let numB = parseInt(b.customImageName.match(/_([0-9]+)\.png/)[1]);
            return numA - numB;
        });

    let cardImagePaths = card_images_sorted.map(img => `Shadows/${img.customImageName}`);

    // console.log("Filtered card_images", card_images);

    let cards = document.querySelectorAll('.card-container');
    let imagePath = null;
    let index=0;

    cards.forEach((card,index) => {
          
          clicked_index = null;
          
          imagePath = `Shadows/${card_images[index].customImageName}`;

          // console.log("for index", index, "image fetched", imagePath);

          card.querySelector('.card').style.background = `#e6e6e6 url(${imagePath}) no-repeat center center`;
          card.querySelector('.card').style.backgroundSize = 'cover';
          card.querySelector('.card').style.border = '1px solid #4d4d4d';

          if (index === 0) {
              card.querySelector('.card').style.border = '3px solid black';
              card.querySelector('.card').style.background = `white url(${imagePath}) no-repeat center center`;
              card.querySelector('.card').style.backgroundSize = 'cover';
          }

          card.addEventListener("click", function () {
              
              Hide_allshadows();
              addShadowButton();
              updateCheckboxes();

              deactivatePainting();
              
              // let arr_name = `${direction}${global_number}_arr`;
              // let vect_arr = window[arr_name];
              // console.log("layers saved for ",SaveVectorLayer(vect_arr));
              // GetVectorLayers(vect_arr)

              paginationItems.forEach(item => item.classList.remove('active'));
              paginationItems[index].classList.add('active');

              canvasElement2.style.display = 'none';
              canvasElement.style.display = 'block';
              updateBookmarkedShadows();
              
              clicked_index = index;
              console.log("clicked_index", clicked_index);
              global_number = clicked_index;
              segments.forEach(seg => {
                  toggleVisibilityByDirectionAndSegment(direction, seg, clicked_index, true);
              });

              canvas.getObjects().forEach(obj => {
                  if (obj.customImageName && obj.customImageName.includes('shadow')) {
                      if(obj.visible)
                        {console.log(obj.customImageName, obj.visible);}
                  }
              });

              cards.forEach(card => {
                  card.querySelector('.card').style.border = '1px solid #4d4d4d';
                  card.querySelector('.card').style.backgroundColor = '#e6e6e6';
              });

              card.querySelector('.card').style.border = '3px solid black';
              card.querySelector('.card').style.backgroundColor = 'white';
              clicked_index = null;
          });

    });

}


let cards = document.querySelectorAll('.card-container');

paginationItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        paginationItems.forEach(paginationItem => paginationItem.classList.remove('active'));
        item.classList.add('active');
    
        if (index === 2 || index === 3) {
            goTo(3); 
        } else if (index === 0 || index === 1) {
            goTo(0); 
        }

        cards[index].querySelector('.card').click();
    });
});


//===================== Pointer Click=========================//
document.getElementById("pointerBtn").addEventListener("click", function(event) {
    resetPosition();
    canvasElement2.style.display = 'none';
    canvasElement.style.display = 'block';
    updateBookmarkedShadows();

    document.body.style.cursor = "pointer"; // Change cursor style to pointer
    deactivateEraser();
    deactivatePainting();
    deactivateUndoEraser(); 
    deactivateZooming();
    deactivatePanning();
    toolSize.style.display = 'none';
});

//======================= Change Shadow Size =====================================//

       const incrementButton = document.querySelector('.increment');
    const decrementButton = document.querySelector('.decrement');

    incrementButton.addEventListener('click', function(labels = []) {
        let res = {};
        if (!labels.length){
            labels = [];
        }
        let shadowRegExp = constructRegExp(labels, global_number);
        const objs = canvas.getObjects().forEach(obj => {
            if (obj.customImageName && obj.customImageName.match(shadowRegExp) && obj.visible) {
                res[obj.customImageName] = obj.customBase64;
                return true;
            }
            else{
                return false;
            }
        });
        eel.shadow_increase(res)
        loader.style.display = 'block';
        shadowChanged = true;
    });

    decrementButton.addEventListener('click', function(labels = []) {
        // lables
        console.log('decrement button clicked');
        if (!labels.length){
            labels = [];
        }
        let shadowRegExp = constructRegExp(labels, global_number);
        let res = {};
        const lineRegExp = new RegExp(`line`);    
        // super weird logic...
        const objs = canvas.getObjects().forEach(obj => {
            if (obj.customImageName.match(lineRegExp)){
                res['line'] = obj.customBase64;
            }
            if (obj.customImageName && obj.customImageName.match(shadowRegExp) && obj.visible) {
                res[obj.customImageName] = obj.customBase64;
                return true;
            }
            else{
                return false;
            }
        });

        // pass them into shadow_decrease
        eel.shadow_decrease(res);
        loader.style.display = 'block';
        shadowChanged = true;
    });

    // call back function for layer update
    eel.expose(UpdataShadow);
    function UpdataShadow(imgDict){
        if (shadowChanged){
            for (let label in imgDict){
                UpdateLayerByName(imgDict[label], label);
            }
            canvas.renderAll();
            loader.style.display = 'none';
            console.log("decreased shadow updated");    
            shadowChanged = false;
        }
        
    }

    function constructRegExp(labels, global_number){
        let label = "";
        if (!labels.length){
            label = "*";
        }
        else{
            label = "("+labels.join("|")+")";
        }
        // collect all shown shadow layers by label 
        const NumberRegExp = new RegExp(`shadow_${global_number}_${label}`);    
        return NumberRegExp;
    }

    function UpdateLayerByName(newImageUrl, label){
        const layerImageObject = canvas.getObjects().find(obj => obj.customImageName === label);
        if (!layerImageObject || layerImageObject.visible == false) {
            console.error("Invalide image layer.");
            return;
        }
        fabric.Image.fromURL(newImageUrl, function(newImage) {
            newImage.customBase64 = newImageUrl
            newImage.scale(global_scaleFactor);
            newImage.customImageName = label;
            newImage.selectable = false;
            newImage.visible = true;
            newImage.opacity = global_opacity; 
            newImage.left=global_pos_left;
            // Remove the old background image
            // this logic is also ugly...
            // for (let i = 0; i < shadow_segment_images.length; i++){
            //     if (shadow_segment_images[i].customImageName == label){
            //         shadow_segment_images[i] = newImage;        
            //     }
            // }
            canvas.remove(layerImageObject);
            canvas.add(newImage);
            // canvas.moveTo(newImage, 0); // Move to background if necessary    
        });    
    }


//====================================Modal events====================================================//
    document.getElementById("yes_btn").addEventListener("click", function() {
        console.log("Yes button clicked");
        location.reload();
    });

    // Get the "Continue Working" button by ID and attach a click event handler
    document.getElementById("continue_btn").addEventListener("click", function() {
        console.log("Continue Working...");
    });

//================================= GetBinaryBitmap ==============================================//


function GetBinaryBitMap(imageObj)
{
        let BitCanvas = document.createElement('canvas');
        let BitCtx = BitCanvas.getContext('2d');

        BitCanvas.width = imageObj.width;
        BitCanvas.height = imageObj.height;
        BitCtx.drawImage(imageObj, 0, 0);

        let imageData = BitCtx.getImageData(0, 0, BitCanvas.width, BitCanvas.height);
        let data = imageData.data;

        let binaryBitmap = [];
        for (let i = 0; i < data.length; i += 4) {
            let isBlack = (data[i] + data[i + 1] + data[i + 2]) / 3 >= 128 ? 1 : 0;
            binaryBitmap.push(isBlack);
        }
        console.log(binaryBitmap);
        return binaryBitmap;
}



});
