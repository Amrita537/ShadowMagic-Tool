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

    canvas.setDimensions({ width: 750, height: 600});

    // canvas.setDimensions({ width: 500, height: 500 });
    fabric.Image.fromURL('background.png', function (img) {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: canvas.width / img.width,
            scaleY: canvas.height / img.height
        });
    });


    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover' // Show tooltip on hover only
    }); 
    // $('[data-toggle="popover"]').popover();
    $('[data-toggle="popover"]').popover({
        html: true
    });

    //Variables//
    let isErasing = false;




    //======================Run python function=================== 
    // document.querySelector("#mybutton").onclick = function () {

    //   eel.random_python()(function(number){                       
    //     console.log("files loaded")
    //   }) 
      
    // }

    function Semantic_segmentation(imageName){

      eel.random_python(imageName)(function(number){                       
        console.log("files loaded")
      }) 
      
    }


// ====================Open image functions================

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", handleFileSelect);

const images = [];
const initialSizes = [];
let actual_h=0;
let actual_w=0;

function handleFileSelect(event) {
    console.log("clicked");
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i].name;
        const extension = fileName.split('.').pop().toLowerCase(); // Get the file extension

        if (extension === 'png') {
            console.log(fileName + ' is a PNG file');
            handleImageSelect(event);

        } else if (extension === 'psd') {
            console.log(fileName + ' is a PSD file');
            handlePSDSelect(event);

        } else {
            console.log(fileName + ' has an unknown extension');
        }
    }
}

function handleImageSelect(event) {
  console.log("clicked");
  const files = event.target.files;

  if (files && files.length > 0) {
    for (let i = 0; i <files.length; i++) 
    {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = function (e) {
        fabric.Image.fromURL(e.target.result, function (img) {

          actual_h=img.height;
          actual_w=img.width;
          const scaleFactor = calculateScaleFactor(img.width, img.height, 700, 600);
          
          img.scale(scaleFactor);
          img.customSelected = false; // Custom property to indicate selected state
          img.customImageName = file.name;
          img.customBase64 = e.target.result;
          img.selectable = false;
          console.log("adding", img.customImageName)

          images.push(img);
          initialSizes.push({ width: img.width, height: img.height });
          canvas.add(img);

          sc_imgwidth = actual_w * scaleFactor;
          sc_imgheight = actual_h * scaleFactor;
          const canvasWidth = Math.min(sc_imgwidth);
          const canvasHeight = Math.min(sc_imgheight);
          canvas.setDimensions({ width: canvasWidth, height: canvasHeight });

          let backimg_name='';
          if (sc_imgwidth < 400){
                backimg_name='backgroundVer.png';
          }
          else if(sc_imgwidth>400 && sc_imgwidth <600)
          {
                backimg_name='backgroundVer2.png';
          }
          else{
                backimg_name='background.png';
          }
          console.log(backimg_name)
          fabric.Image.fromURL(backimg_name, function (backimg) {
                  canvas.setBackgroundImage(backimg, canvas.renderAll.bind(canvas), {
                      scaleX: canvas.width / backimg.width,
                      scaleY: canvas.height / backimg.height

                  });
          });
          
          updateLayerList(images);
          displayImages();
          Save_Image_backend(img.customBase64, img.customImageName);
          Semantic_segmentation(img.customImageName);
          GenerateShadow();

        });
      };
      reader.readAsDataURL(file);
    }
    fileInput.value = "";
  }
}

function calculateScaleFactor(originalWidth, originalHeight, targetWidth, targetHeight) {
  const widthRatio = targetWidth / originalWidth;
  const heightRatio = targetHeight / originalHeight;
  return Math.min(widthRatio, heightRatio);
}

function displayImages() {
  canvas.renderAll();
}
//======================load from psd=======================//

psd_layer_names=[];
function handlePSDSelect(event) {
    const files = event.target.files;
    console.log("Selected files:");
    eel.open_psd_py("./web/D4_01_L_M.psd");

    loader.style.display = 'block';

    for (let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const baseName = fileName.replace(/\.[^.]*$/, ""); // Remove the extension

            // Add _flat.png and _line.png to the base name
            const flatName = baseName + "_flat.png";
            const lineName = baseName + "_line.png";

            psd_layer_names.push(flatName);
            psd_layer_names.push(lineName);

            console.log("Flat name:", flatName);
            console.log("Line name:", lineName);
        }

      const rel_path = "PsdToPng/"; 
        
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
                        canvas.width= 750;
                        canvas.height= 600;

                        actual_h = img.height;
                        actual_w = img.width;
                        const scaleFactor = calculateScaleFactor(img.width, img.height, canvas.width, canvas.height);
                        
                        img.scale(scaleFactor);
                        img.customSelected = false; // Custom property to indicate selected state
                        img.customImageName = "D4_01_L_M_flat.png";
                        img.customBase64 = imgData; // Set custom base64 data
                        img.selectable = false;
                        console.log("adding", img.customImageName);

                        images.push(img);
                        initialSizes.push({ width: img.width, height: img.height });
                        canvas.add(img);

                        updateLayerList(images);
                        
                        sc_imgwidth = actual_w * scaleFactor;
                        sc_imgheight = actual_h * scaleFactor;
                        const canvasWidth = Math.min(sc_imgwidth, img.width);
                        const canvasHeight = Math.min(sc_imgheight, img.height);
                        canvas.setDimensions({ width: canvasWidth, height: canvasHeight });

                        console.log(canvas.width, canvas.height);

                           let backimg_name='';
                            if (sc_imgwidth < 400){
                              backimg_name='backgroundVer.png';
                            }
                            else if(sc_imgwidth>400 && sc_imgwidth <600)
                            {
                              backimg_name='backgroundVer2.png';
                            }
                            else{
                              backimg_name='background.png';
                            }
                            console.log(backimg_name)
                            fabric.Image.fromURL(backimg_name, function (backimg) {
                                      canvas.setBackgroundImage(backimg, canvas.renderAll.bind(canvas), {
                                          scaleX: canvas.width / backimg.width,
                                          scaleY: canvas.height / backimg.height

                                      });
                            });

                        displayImages();
                    });
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => console.error('Error fetching image:', error));
          });
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


// ====================Base Layer functions================

const layerList = document.getElementById("layerList");

function updateLayerList(images) {

  console.log("img_length", images.length);
  layerList.innerHTML = "";

  // console.log(images[0].customBase64);
  for (let i = 0; i < images.length; i++) {
    let layerButton = document.createElement("button");
    layerButton.id = `layerButton_${i}`;
    layerButton.className = "btn btn-secondary btn-block";

    // Create an image element for the icon
    const eyeIcon = document.createElement("i");

    eyeIcon.className = images[i].visible ? "fa fa-eye" : "fa fa-eye-slash";
    eyeIcon.style.fontSize="10px";
    eyeIcon.style.marginRight = "8px"; // Adjust the margin as needed

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


    // Create a span for the image name
    const imageNameSpan = document.createElement("span");
    imageNameSpan.innerText = images[i].customImageName;

    // Create a cross icon
    const crossIcon = document.createElement("i");
    crossIcon.className = "fa fa-times cross-icon";
    crossIcon.style.float = "right";
    crossIcon.style.marginTop="5px";

    // Append the components to the layerButton
    layerButton.appendChild(eyeIcon);
    layerButton.appendChild(iconImage);
    layerButton.appendChild(imageNameSpan);
    layerButton.appendChild(crossIcon);

    layerButton.style.textAlign = "left";
    layerButton.style.backgroundColor = "#6c757d";
    layerButton.style.color = "#ffffff";

    const iconElement = layerButton.querySelector("i");

    iconElement.addEventListener("click", function (event) {
      event.stopPropagation(); // Stop event propagation
      toggleLayerVisibility(i);
      updateLayerList(images); // Update the button with the new visibility state
      displayImages();
    });

    crossIcon.addEventListener("click", function (event) {
      console.log("val of i", i);
      const removedImage = images.splice(i, 1)[0];
      canvas.remove(removedImage);
      layerButton.remove();
      console.log("Removing image at index:", i);

      canvas.getObjects().forEach(function(object) {
              canvas.remove(object);
      });

      canvas.renderAll();
      updateLayerList(images);
      displayImages();
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
        const firstImage = images[0];
        if (firstImage) 
        {
            const imageName = firstImage.customImageName;
            const shadow_image = imageName.replace('flat', 'color');
            
            directions.flatMap(direction => {
               
                const baseName = shadow_image.replace('.png', `_${direction}_shadow`).replace('color_', 'color_');
                
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

            console.log('Base shadow names', names_shadow);
            console.log('Shadow segment names', names_shadow_segment);

            fetch_Shadow_files(names_shadow);
            fetch_Shadow_files(names_shadow_segment);
        } 
        else {
            console.log('No image on the canvas or the first image is not loaded.');
        }
    } 
    else {
        console.log('Shadows already loaded.');
    }

}


  function fetch_Shadow_files(shadow_arr){
      if(shadow_arr == names_shadow_segment)
      {
        let relativePath = 'Shadows/sub_shadows/'; // Adjust this relative path based on your directory structure
        names_shadow_segment.forEach(name => {
          let fullPath = relativePath + name;
          fabric.Image.fromURL(fullPath, function (img) {
                const scaleFactor = calculateScaleFactor(img.width, img.height, canvas.width, canvas.height);
                img.scale(scaleFactor);
                img.customImageName=name;
                img.selectable = false;
                img.visible = false;
                canvas.add(img);
                shadow_segment_images.push(img);
          }); 
        });

      console.log("Loaded shadow_segment_images", shadow_segment_images);
      }

      else
      { 
        let relativePath = 'Shadows/'; // Adjust this relative path based on your directory structure
        names_shadow.forEach(name => {
          let fullPath = relativePath + name;
          fabric.Image.fromURL(fullPath, function (img) {
                const scaleFactor = calculateScaleFactor(img.width, img.height, canvas.width, canvas.height);
                img.scale(scaleFactor);
                img.customImageName=name;
                img.selectable = false;
                img.visible = false;
                base_shadow_images.push(img);
          }); 
        });
      console.log("Loaded base_shadow_images", base_shadow_images);
      }

  }


const checkboxIds = ['hairCheckbox', 'faceCheckbox', 'clothCheckbox', 'armCheckbox', 'objectCheckbox', 'allCheckbox'];
const buttonIds = ['btnTop', 'btnLeft', 'btnRight', 'btnBack'];

let direction = null; 


buttonIds.forEach(buttonId => {
      
      const current_button = document.getElementById(buttonId);
      const carousel = document.getElementById('Carousel_id');

      current_button.addEventListener('click', function () 
      {
            addShadowButton();
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
              checkVisibleObjects();
            } 
              
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
    const isIndexMatch = name.includes(`shadow${index}`);

    if (isDirectionMatch && isSegmentMatch && isIndexMatch) 
          {
                console.log("match");
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


function checkVisibleObjects() {
  canvas.getObjects().forEach(obj => {
    if (obj.visible) {
      const lowercaseImageName = obj.customImageName;
      if (lowercaseImageName.includes('hair')) {
        document.getElementById('hairCheckbox').checked = true;
      }
      if (lowercaseImageName.includes('face')) {
        document.getElementById('faceCheckbox').checked = true;
      }
      if (lowercaseImageName.includes('cloth')) {
        document.getElementById('clothCheckbox').checked = true;
      }
      if (lowercaseImageName.includes('arm')) {
        document.getElementById('armCheckbox').checked = true;
      }
      if (lowercaseImageName.includes('object')) {
        document.getElementById('objectCheckbox').checked = true;
      }
    }
  });
}



// Function to toggle the visibility of canvas objects based on checkbox state
function toggleVisibilityByCheckbox(label) {
    let number=0;

    canvas.getObjects().forEach(obj => {
            if (obj.visible){
                let imageName = obj.customImageName;
                let match = imageName.match(/shadow(\d+)/);
                if (match) {
                  number = match[1];
                } 
            }
            let checkbox = document.getElementById(`${label}Checkbox`);
            toggleVisibilityByDirectionAndSegment(direction, label, number, checkbox.checked);
    });
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
const allCheckbox = document.getElementById('allCheckbox');

allCheckbox.addEventListener('change', function () {
      if (this.checked) 
      {
        cursorInfo.style.display = 'block';
        getOutline(this.checked);
      } 
      else {
        cursorInfo.style.display = 'none';
        getOutline(this.checked);
      }

  });


//===================adding shadow layers====================
// const directions = {
//     "btnLeft": "Left",
//     "btnRight": "Right",
//     "btnTop": "Top",
//     "btnBack": "Back"
// };



let savedCounter=1;
let savedLayers = [];
function addShadowButton() {
    // Check if shadowList already has a button with id "unsaved"
    if (document.getElementById("unsaved")) {
        return; // Exit the function if "unsaved" button already exists
    }

    const shadowButton = document.createElement("button");
    shadowButton.id = "unsaved"; // Set id to "unsaved"
    console.log(shadowButton.id);

    shadowButton.className = "btn btn-block";
    shadowButton.style.textAlign = "left";
    shadowButton.style.backgroundColor = "#6c757d";
    shadowButton.style.color = "#ffffff";

    // Create an image element for the icon
    const ShadEyeIcon = document.createElement("i");
    ShadEyeIcon.className = "fa fa-eye";
    ShadEyeIcon.style.fontSize = "10px";
    ShadEyeIcon.style.marginRight = "8px";

    const tickIcon = document.createElement("i");
    tickIcon.className = "fa fa-bookmark-o";
    tickIcon.style.float = "right";
    tickIcon.style.marginTop = "5px";


    const downloadIcon = document.createElement("i");
    downloadIcon.className = "fa fa-bookmark";
    downloadIcon.style.float = "right";
    downloadIcon.style.marginTop = "5px";

    // Create a span for the direction name
    const NameSpan = document.createElement("span");
    NameSpan.innerText = 'Shadow Layer';  

    // shadowButton.appendChild(ShadEyeIcon);
    shadowButton.appendChild(NameSpan);
    shadowButton.appendChild(tickIcon);

    shadowList.appendChild(shadowButton);

    ShadEyeIcon.addEventListener("click", function (event) {

        if (ShadEyeIcon.classList.contains('fa-eye')) {
            ShadEyeIcon.classList.remove('fa-eye');
            ShadEyeIcon.classList.add('fa-eye-slash');
        } else {
            ShadEyeIcon.classList.remove('fa-eye-slash');
            ShadEyeIcon.classList.add('fa-eye');
            }

            const allCheckbox = document.getElementById('allCheckbox');
            allCheckbox.checked = !allCheckbox.checked;

            const event1 = new Event('change');
            allCheckbox.dispatchEvent(event1);

  });
    
    const BMshadowList = document.getElementById('BM_shadowList');
    tickIcon.addEventListener("click", function (event) {

        const canvasStatus = JSON.stringify(canvas.toJSON());
        savedLayers.push(canvasStatus);
        console.log(canvasStatus);


        shadowButton.id = `saved_${savedCounter}`; // Change the button id
        console.log(shadowButton.id);

        shadowButton.style.backgroundColor = "#494949"; // Change the background color
        savedCounter++; // Increment the counter for the next button

        tickIcon.remove();
        ShadEyeIcon.remove();
        shadowButton.appendChild(downloadIcon);
        NameSpan.innerText = 'Saved Shadow';
        tempbtn=shadowButton;
        shadowButton.remove();
        BMshadowList.appendChild(tempbtn);
    });


// Add click event listener to the download icon
downloadIcon.addEventListener("click", function (event) {

    const savedCanvasData = JSON.parse(savedLayers[0]);
    const tempCanvas = new fabric.Canvas(null, { width: canvas.getWidth(), height: canvas.getHeight()});
   

    tempCanvas.loadFromJSON(savedCanvasData, function() {
        
        const scaleFactor = calculateScaleFactor(actual_w, actual_h, canvas.width, canvas.height) * 10;
        const backgroundImage = tempCanvas.backgroundImage;
        tempCanvas.backgroundImage = null;

        // Scale up the canvas
        const originalWidth = tempCanvas.getWidth();
        const originalHeight = tempCanvas.getHeight();
        tempCanvas.setWidth(originalWidth * scaleFactor);
        tempCanvas.setHeight(originalHeight * scaleFactor);
        tempCanvas.setZoom(scaleFactor);

        tempCanvas.renderAll();

        const dataUrl = tempCanvas.toDataURL({
            format: 'png',
            multiplier: 1 // Use a multiplier to ensure the quality of the downloaded image
        });


        tempCanvas.backgroundImage = backgroundImage;
        tempCanvas.setWidth(originalWidth);
        tempCanvas.setHeight(originalHeight);
        tempCanvas.setZoom(1);

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'canvas.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    });


});

    //   // Add click event listener to the shadow button to fetch and render the saved canvas state
    // shadowButton.addEventListener("click", function (event) {
    //   const buttonId = shadowButton.id;
    //   const buttonIndex = parseInt(buttonId.split('_')[1]) - 1; // Get the index of the saved canvas state in the array
    //   if (buttonIndex >= 0 && buttonIndex < savedLayers.length) {
    //     const canvasStatus = JSON.parse(savedLayers[buttonIndex]);
    //     canvas.loadFromJSON(canvasStatus, canvas.renderAll.bind(canvas));
    //   }
    // });


}



//===================shadow opacity function====================//
      document.getElementById('opacityRange').addEventListener('input', function () {
          const opacityValue = parseFloat(this.value);
          console.log("opacityValue", opacityValue);
          document.getElementById('opacityValue').textContent = opacityValue;
          setShadowOpacity(opacityValue);
      });
            

      function setShadowOpacity(opacity) {
          shadow_segment_images.forEach((shadow) => {
              shadow.set('opacity', opacity);
          });
          displayImages();
      }


//========================draw segments=========================//


        let isDataFetched = false;
        let polygonVisible = false;  // Add a flag to track the visibility of the polygon


          function getOutline(checkval){

            const isChecked = checkval;

            if (isChecked) {
                if (!isDataFetched||images[0].customImageName !== jsonFileName) {
                    jsonFileName = images[0].customImageName.replace('.png', '.json');
                    console.log(jsonFileName);
                    fetch(`http://localhost:8000/RefinedOutput/json/${jsonFileName}`)
                        .then(response => response.json())
                        .then(data => {
                            isDataFetched = true;

                            data.regions.forEach(region => {
                                const originalCoordinates = region.coordinates;
                                const color = region.color; // Get color from JSON
                                const scaleFactor = calculateScaleFactor(images[0].width, images[0].height, canvas.width, canvas.height);
                                const scaledCoordinates = originalCoordinates.map(point => ({
                                    x: point[0] * scaleFactor,
                                    y: point[1] * scaleFactor
                                }));

                                // Draw the polygon on the canvas and set its initial visibility
                                drawPolygon(scaledCoordinates, region.label);
                            });
                        })
                        .catch(error => console.error('Error fetching JSON file:', error));

                } else {
                    // Data has already been fetched, toggle visibility based on the button state
                    polygonVisible = isChecked;
                    console.log(polygonVisible);
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
            console.log("here", isVisible);
            canvas.forEachObject(function (obj) {
                if (obj.isPolygon) {
                    obj.set('visible', isVisible);
                }
            });
            canvas.renderAll();
        }


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

          // Add click event listener to the search button
          zoomButton.addEventListener("click", function() {
            // Toggle visibility of the zoom controls
            if (zoomButton.classList.toggle("checked")) {
              zoomControls.style.display = "block";
              zoomButton.style.backgroundColor = "black";
              zoomButton.style.color = "white";
            } else {
              zoomControls.style.display = "none";
              zoomButton.style.backgroundColor = "";
              zoomButton.style.color = "";
            }
          });

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey) {
        if (event.key === "+" || event.key === "=") {
            zoomIn();
            event.preventDefault();
        } else if (event.key === "-") {
            zoomOut();
            event.preventDefault();
        }
    }

});

//======================panning===============================//
const panBtn = document.getElementById("panBtn");
let isPanning = false;

// Add event listener to the pan button
panBtn.addEventListener("click", togglePanning);

function togglePanning() {
  // Toggle the panning mode
  isPanning = !isPanning;

  // Change the cursor style of the canvas based on the panning mode
  if (isPanning) {

    canvas.hoverCursor = 'pointer';
    panBtn.style.backgroundColor = "black";
    panBtn.style.color = "white";
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
    const delta = new fabric.Point(event.e.clientX - canvas.lastPosX, event.e.clientY - canvas.lastPosY);
    canvas.relativePan(delta);
    canvas.lastPosX = event.e.clientX;
    canvas.lastPosY = event.e.clientY;
  }
});

canvas.on("mouse:up", function () {
  if (isPanning) {
    canvas.set("isGrabMode", false); // Disable fabric.js grab mode
    canvas.selection = true; // Re-enable object selection
  }
});


//===============eraser code========================//

const eraserBtn = document.getElementById("eraserBtn");

eraserBtn.addEventListener("click", toggleErasing);

function toggleErasing() {
    isErasing = !isErasing;
    if (isErasing)
     {
        eraserBtn.style.backgroundColor = "black";
        eraserBtn.style.color = "white";
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.isDrawingMode = true;
      
        canvas.forEachObject(function(obj) {
                    if (obj.type === 'image') 
                    {
                        for (let i = 0; i < images.length; i++) {
                            if (images[i].customImageName === obj.customImageName) {
                                obj.erasable = false;
                                break;
                            }
                        }
                    } 
                    if (!obj.visible) {
                        obj.erasable = false;
                    }
                });


        document.querySelectorAll('#eraseSize span').forEach(function(circle_id) {
                circle_id.style.color = 'black';
                circle_id.addEventListener('click', function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    var eraser_size = this.getAttribute('id');
                    canvas.freeDrawingBrush.width = parseInt(eraser_size);
                    document.querySelectorAll('#eraseSize span').forEach(function(span) {
                              span.style.color = 'black';
                              span.style.backgroundColor= 'white';
                    });
                    this.style.color = 'white';
                    this.style.backgroundColor= 'black';
                });
        });

        canvas.backgroundImage.erasable = false;
    } 
    else {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.isDrawingMode = false;
      eraserBtn.style.backgroundColor = "";
      eraserBtn.style.color = "";
    }

}


let undoErasing = false;
const undoEraser = document.getElementById("magicBtn");
undoEraser.addEventListener("click", UndoErase);

function UndoErase() {
  console.log("undo");
    undoErasing = !undoErasing;
  if (undoErasing) {
    canvas.isDrawingMode = true;
    undoEraser.style.backgroundColor = "black";
    undoEraser.style.color = "white";
  } else {
    canvas.isDrawingMode = false;
    undoEraser.style.backgroundColor = "";
    undoEraser.style.color = "";
  }

    canvas.freeDrawingBrush.width = 20;
    canvas.freeDrawingBrush.inverted = true;
}



//============================run eel===============================//
    // document.getElementById('backendButton').addEventListener('click', function() {
    //     // Call the run_python_file() function exposed by Eel
    //     eel.run_python_file();
    // });


//===================save image=====================//

const saveBtn = document.getElementById("save_id");
saveBtn.addEventListener('click', saveCanvasImage);

function saveCanvasImage() {
    const scaleFactor = calculateScaleFactor(actual_w, actual_h, canvas.width, canvas.height) * 10;
    const backgroundImage = canvas.backgroundImage;
    canvas.backgroundImage = null;

    // Scale up the canvas
    const originalWidth = canvas.getWidth();
    const originalHeight = canvas.getHeight();
    canvas.setWidth(originalWidth * scaleFactor);
    canvas.setHeight(originalHeight * scaleFactor);
    canvas.setZoom(scaleFactor);

    canvas.renderAll();

    const dataURL = canvas.toDataURL('image/png', 1.0);

    canvas.backgroundImage = backgroundImage;
    canvas.setWidth(originalWidth);
    canvas.setHeight(originalHeight);
    canvas.setZoom(1);

    const link = document.createElement('a');
    link.download = 'canvas-image.png';
    link.href = dataURL;

    link.click();
}



//========================paint brush functions==========================//

    var isDrawingMode = false;
    const cursorUrl = 'circle_icon.png';
    var mousecursor; 
    var undoStack = [];
    var redoStack = [];

    document.getElementById('paintBrushBtn').addEventListener('click', function() {

        if (isErasing) {
          const eraserBtn_1 = document.getElementById("eraserBtn");
          eraserBtn_1.click();
        }

        isDrawingMode = !isDrawingMode;

        if (isDrawingMode) {
           if (isPanning) {
              togglePanning();
           }
            
            // canvas.defaultCursor = `url("${cursorUrl}"), auto`;
            // canvas.hoverCursor = `url("${cursorUrl}"), auto`;
            // canvas.moveCursor = `url("${cursorUrl}"), auto`;

            canvas.freeDrawingBrush.color = 'rgba(0,0,0,0.5)';
            canvas.isDrawingMode = true;

            this.style.backgroundColor = 'black';
            this.style.color = 'white';

            document.querySelectorAll('#brushSize span').forEach(function(circle_id) {
                circle_id.style.color = 'black';
                circle_id.addEventListener('click', function(event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var paint_brush_size = this.getAttribute('id');
                    canvas.freeDrawingBrush.width = parseInt(paint_brush_size);

                    document.querySelectorAll('#brushSize span').forEach(function(span) {
                              span.style.color = 'black';
                              span.style.backgroundColor= 'white';
                    });
                    this.style.color = 'white';
                    this.style.backgroundColor= 'black';
                });
            });

        canvas.on('object:added', function(e) {
            e.target.selectable = false;
            undoStack.push(e.target);
            redoStack = [];
        });


        } else {
            canvas.isDrawingMode = false;
            this.style.backgroundColor = '';
            this.style.color = '';
        }


    });

    // var isDrawingMode = false;
    // document.getElementById('paintBrushBtn').addEventListener('click', function() {
    // isDrawingMode = !isDrawingMode;
    // canvas.defaultCursor = "url(circle_icon.png), auto";
    // canvas.hoverCursor = "url(circle_icon.png), auto";
    // canvas.isDrawingMode = true;
    // });

// Function to undo the last action
function undo() {
    if (undoStack.length > 0) {
        var obj = undoStack.pop();
        canvas.remove(obj);
        redoStack.push(obj);
        canvas.renderAll();
    }
}

// Function to redo the last undone action
function redo() {
    if (redoStack.length > 0) {
        var obj = redoStack.pop();
        canvas.add(obj);
        undoStack.push(obj);
        canvas.renderAll();
    }
}

// Event listeners for undo and redo buttons
document.getElementById('UndoBtn').addEventListener('click', undo);
document.getElementById('RedoBtn').addEventListener('click', redo);


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
  e.preventDefault();
  if (index < track.children.length - 2 && -index * width > -250) { // Adjusted to ensure there are always two cards visible and limit translateX to -250
    index = index + 1;
    prev.classList.add("show");
    // Limit the translateX value to -250
    let translateX = -index * width;
    if (translateX < -250) {
      translateX = -250;
    }
    track.style.transform = "translateX(" + translateX + "px)";
    if (index === track.children.length - 2) {
      next.classList.add("hide");
    }
  }
});

prev.addEventListener("click", function () {
  if (index > 0) {
    index = index - 1;
    next.classList.remove("hide");
    if (index === 0) {
      prev.classList.remove("show");
    }
    track.style.transform = "translateX(" + -index * width + "px)";
  }
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



let clicked_index= null;
function setCardBackgroundImages(direction) {
    
    goTo(0);
    
    let opacityDiv = document.getElementById('opacitydiv_id');
    let partDiv = document.getElementById('partdiv_id');
    let carnav = document.querySelector('#Carousel_id .nav');
   
    carnav.style.display = 'block';
    opacityDiv.style.display = 'block';
    partDiv.style.display = 'block';

    let card_images = base_shadow_images.filter(img => img.customImageName.includes(direction));
    console.log("Filtered base_shadow_images", card_images);

    let cards = document.querySelectorAll('.card-container');
    let imagePath = null;

    cards.forEach((card, index) => {
          
          clicked_index = null;
          
          imagePath = `Shadows/${card_images[index].customImageName}`;

          card.querySelector('.card').style.background = `#e6e6e6 url(${imagePath}) no-repeat center center`;
          card.querySelector('.card').style.backgroundSize = 'cover';
          card.querySelector('.card').style.border = '1px solid #4d4d4d';


                  // Highlight the first card
          if (index === 0) {
              card.querySelector('.card').style.border = '3px solid black';
              card.querySelector('.card').style.background = `white url(${imagePath}) no-repeat center center`;
              card.querySelector('.card').style.backgroundSize = 'cover';
          }

          card.addEventListener("click", function () {
              
              Hide_allshadows();
              addShadowButton();
              
              clicked_index = index;
              console.log("clicked_index", clicked_index);
              
              segments.forEach(seg => {
                  toggleVisibilityByDirectionAndSegment(direction, seg, clicked_index, true);
              });

              canvas.getObjects().forEach(obj => {
                  if (obj.customImageName && obj.customImageName.includes('shadow')) {
                      console.log(obj.customImageName, obj.visible);
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



});
