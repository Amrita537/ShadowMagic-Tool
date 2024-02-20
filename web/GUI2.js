 document.addEventListener("DOMContentLoaded", function () {
      console.log("hello from web");
    // ====================canvas functions====================
      const canvas = new fabric.Canvas('canvas', {
         // backgroundColor: 'white',
         selection: false // Disable Fabric.js default selection behavior
      });

      fabric.Object.prototype.set({
        // borderColor: 'black',
        // cornerColor: 'black',
        cornerSize: 6,
        transparentCorners: false
      });


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

    // ====================Tab bar functions================

      $(".nav-tabs li").each(function(){
        $(this).append('<span class="close-tab" aria-hidden="true">&times;</span>');
      });

      $(".nav-tabs .close-tab").on("click", function(){
        var tabId = $(this).closest('li').find('a[data-toggle="tab"]').attr('href');
        console.log(tabId);
        $(tabId).remove();
        $(this).closest('li').remove();
        tabCounter--;
      });


      var tabCounter = 3; 

      $("#new_doc_id").on("click", function(){
        var tabId = "Editor_id" + tabCounter;
        var newTabContent = $("#" + "Editor_id2").clone().attr("id", tabId).removeClass("in active");

        // Update IDs of child elements in the cloned content
        newTabContent.find("[id]").each(function () {
          var oldId = $(this).attr("id");
          var newId = oldId + tabCounter;
          $(this).attr("id", newId);
        });

        $(".nav-tabs").append('<li><a data-toggle="tab" href="#' + tabId + '">' + 'document ' + tabCounter + '</a><span class="close-tab" aria-hidden="true">&times;</span></li>');
        $(".tab-content").append(newTabContent);



        // Activate the new tab
        $("#" + tabId).tab('show');

        tabCounter++;

        // Rebind the close icon click event
        $(".nav-tabs .close-tab").off("click").on("click", function(){
          var tabId = $(this).closest('li').find('a[data-toggle="tab"]').attr('href');
          $(tabId).remove();
          $(this).closest('li').remove();
          tabCounter--;
        });
      });



// ====================Open image functions================

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", handleFileSelect);

const images = [];
const initialSizes = [];

function handleFileSelect(event) {
  console.log("clicked");
  const files = event.target.files;

  if (files && files.length > 0) {
    for (let i = 0; i <files.length; i++) 
    {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = function (e) {
        fabric.Image.fromURL(e.target.result, function (img) {
          const scaleFactor = calculateScaleFactor(img.width, img.height, canvas.width, canvas.height);
          img.scale(scaleFactor);
          img.customSelected = false; // Custom property to indicate selected state
          img.customImageName = file.name;
          img.customBase64 = e.target.result;
          img.selectable = false;
          console.log("adding", img.customImageName)
          images.push(img);
          initialSizes.push({ width: img.width, height: img.height });
          canvas.add(img);
          updateLayerList(images);
          displayImages();
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

// ====================Layer functions================

const layerList = document.getElementById("layerList");

function updateLayerList(images) {
  console.log("img_length", images.length);
  layerList.innerHTML = "";

  // console.log(images[0].customBase64);
  for (let i = 0; i < images.length; i++) {
    let layerButton = document.createElement("button");
    layerButton.id = `layerButton_${i}`;
    layerButton.className = "btn btn-secondary btn-block";

    const imageSource = images[i].customImageName;

    // Create an image element for the icon
    const eyeIcon = document.createElement("i");

    eyeIcon.className = images[i].visible ? "fa fa-eye" : "fa fa-eye-slash";
    eyeIcon.style.fontSize="10px";
    eyeIcon.style.marginRight = "8px"; // Adjust the margin as needed

    // Create an image element for the icon
    const iconImage = document.createElement("img");
    iconImage.src = imageSource; // Set the image source
    iconImage.className = "icon-image"; // Add a class for styling if needed
    iconImage.style.marginRight = "2px";
    iconImage.style.width = "30px"; // Adjust the width of the icon
    iconImage.style.height = "auto";
    iconImage.style.border ="1px solid black";
    iconImage.style.backgroundColor="white";

    // Create a span for the image name
    const imageNameSpan = document.createElement("span");
    imageNameSpan.innerText = imageSource;

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
const shadow_segment_images = [];

  const panelBody = document.getElementById('collapse2').getElementsByClassName('panel-body')[0];
  const elementsToDisable = panelBody.querySelectorAll('button, input[type="range"]');
  
  for (const element of elementsToDisable) {
    element.disabled = true;
  }

document.getElementById('btn_shadow').addEventListener('change', function () {

  const isChecked = this.checked;
  // Enable/disable panel body based on checkbox state
  const panelBody = document.getElementById('collapse2').getElementsByClassName('panel-body')[0];
  const elementsToDisable = panelBody.querySelectorAll('button, input[type="range"]');
  
  for (const element of elementsToDisable) {
    element.disabled = !isChecked;
  }

    // Enable/disable collapse1 based on checkbox state
  const collapse1 = document.getElementById('collapse1');
  const formCheckboxes = collapse1.querySelectorAll('input[type="checkbox"]');
  
  for (const checkbox of formCheckboxes) {
    checkbox.disabled = !isChecked;
  }

  if (isChecked && names_shadow_segment.length === 0) {
        firstImage=images[0];
        if (firstImage) {
            const imageName = images[0].customImageName;
            console.log('Image file name:', imageName || 'Unknown');

            const shadow_image = firstImage.customImageName.replace('flat', 'shadow');
            const directions = ['back', 'top', 'left', 'right'];
            const segments = ['hair', 'face', 'cloth', 'arm', 'object'];

            const shadow_images = directions.flatMap(direction => {
              const baseName = shadow_image.replace(/_(.*?)_/, `_${direction}_`).replace('.png', '');
              const newNames = segments.map(segment => {
                const newName = baseName + `_${segment}.png`;
                names_shadow_segment.push(newName);
                return newName;
              });
              return newNames;
            });

            console.log('Shadow image file names:', shadow_images);
            fetch_Shadow_files(names_shadow_segment);
          } else {
            console.log('No image on the canvas or the first image is not loaded.');
          }
  }

  else {
    console.log('Shadows already loaded.');
  }


});



  function fetch_Shadow_files(names_shadow_segment){
      const relativePath = 'Shadows/sub_shadows/'; // Adjust this relative path based on your directory structure

      names_shadow_segment.forEach(name => {
        const fullPath = relativePath + name;
        fabric.Image.fromURL(fullPath, function (img) {
              const scaleFactor = calculateScaleFactor(img.width, img.height, canvas.width, canvas.height);
              img.scale(scaleFactor);
              img.customImageName=name;
              img.selectable = false;
              img.visible=false;
              canvas.add(img);
              shadow_segment_images.push(img);
        }); 

      });
  }

          // Add event listener for mouse click on the canvas
    canvas.on('mouse:up', function (event) {
        const target = event.target;
        
        if (target && target.type === 'image') {
            // If the clicked object is an image, you can alert its name
            // alert('Clicked on image: ' + target.customImageName);
        }
    });


// Your checkbox IDs
const checkboxIds = ['hairCheckbox', 'faceCheckbox', 'clothCheckbox', 'armCheckbox', 'objectCheckbox', 'allCheckbox'];
// Your button IDs
const buttonIds = ['btnTop', 'btnLeft', 'btnRight', 'btnBack'];

let selectedDirection = null; // Variable to store the selected direction
let direction = null; // Variable to store the global direction

// Attach event listeners to buttons
buttonIds.forEach(buttonId => {

      const button = document.getElementById(buttonId);
     
      button.addEventListener('click', function () {

              const directionName = directions[buttonId]; // Get direction name from directions object
              addShadowButton(directionName); // Call function to add shadow button for this direction
              // Remove active class from all buttons
              buttonIds.forEach(id => {
                const btn = document.getElementById(id);
                btn.classList.remove('active-button');
              });

              // Add active class to the clicked button
              button.classList.add('active-button');

              // Hide items related to the previous direction
              if (selectedDirection) {
                checkboxIds.forEach(checkboxId => {
                  const segment = checkboxId.replace('Checkbox', '');
                  toggleVisibilityByDirectionAndSegment(selectedDirection, segment, false);
                  const checkbox = document.getElementById(checkboxId);
                  checkbox.checked = false;
                });
              }

              selectedDirection = buttonId.replace('btn', '').toLowerCase(); // Store the selected direction
              direction = selectedDirection; // Set the global direction
              console.log('Selected Direction:', selectedDirection);

              // Toggle visibility for the new direction
              checkboxIds.forEach(checkboxId => {
                const segment = checkboxId.replace('Checkbox', '');
                toggleVisibilityByDirectionAndSegment(selectedDirection, segment, true);
                const checkbox = document.getElementById(checkboxId);
                checkbox.disabled = false;
                checkbox.checked = true;
              });
      });
});

// Attach event listeners to checkboxes
checkboxIds.forEach(checkboxId => {
  const checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener('change', function () {
    if (selectedDirection) {
      const segment = checkboxId.replace('Checkbox', '');
      toggleVisibilityByDirectionAndSegment(selectedDirection, segment, this.checked);
    } else {
      alert('Select a direction first');
    }
  });
  checkbox.disabled = true;
});

function toggleVisibilityByDirectionAndSegment(direction, segment, isVisible) {
  // Iterate through shadow image names
  names_shadow_segment.forEach(name => {
    const isDirectionMatch = name.includes(`_${direction}_`);
    const isSegmentMatch = name.endsWith(`_${segment}.png`);
    
    if (isDirectionMatch && isSegmentMatch) {
      const image = canvas.getObjects().find(obj => obj.customImageName === name);
      
      if (image) {
        image.visible = isVisible;
        canvas.renderAll();
      }
    }
  });
}

// Example: Toggle visibility of all images when 'All' checkbox is clicked
const allCheckbox = document.getElementById('allCheckbox');
allCheckbox.addEventListener('change', function () {
  checkboxIds.forEach(checkboxId => {
    const checkbox = document.getElementById(checkboxId);
    checkbox.checked = this.checked;

    if (selectedDirection || checkboxId === 'allCheckbox') {
      const segment = checkboxId.replace('Checkbox', '');
      toggleVisibilityByDirectionAndSegment(selectedDirection, segment, this.checked);
    }
  });

  canvas.renderAll();
});

//===================adding shadow layers====================
const directions = {
    "btnLeft": "Left",
    "btnRight": "Right",
    "btnTop": "Top",
    "btnBack": "Back"
};


// Function to add shadow button for a given direction
function addShadowButton(directionName) {
    const buttonName = `${directionName} Shadow`;
    
    // Check if button for this direction already exists
    if (!document.getElementById(`${directionName}ShadowButton`)) {
        const shadowButton = document.createElement("button");
        // shadowButton.textContent = buttonName;
        shadowButton.id = `${directionName}ShadowButton`;

        shadowButton.className = "btn btn-block";
        shadowButton.style.textAlign = "left";
        shadowButton.style.backgroundColor = "#6c757d";
        shadowButton.style.color = "#ffffff";

        // Create an image element for the icon
        const ShadEyeIcon = document.createElement("i");
        ShadEyeIcon.className = "fa fa-eye";
        ShadEyeIcon.style.fontSize = "10px";
        ShadEyeIcon.style.marginRight = "8px";


        // Create a span for the direction name
        const directionNameSpan = document.createElement("span");
        directionNameSpan.innerText = buttonName;


        // Create a cross icon
        const crossIcon = document.createElement("i");
        crossIcon.className = "fa fa-times cross-icon";
        crossIcon.style.float = "right";
        crossIcon.style.marginTop = "5px";
        crossIcon.style.marginRight = "5px";

        const tickIcon= document.createElement("i");
        tickIcon.className="fa fa-check";
        tickIcon.style.float= "right";
        tickIcon.style.marginTop = "5px";

        // Append the components to the shadowButton
        shadowButton.appendChild(ShadEyeIcon);
        shadowButton.appendChild(directionNameSpan);
        shadowButton.appendChild(tickIcon);
        shadowButton.appendChild(crossIcon);


        crossIcon.addEventListener("click", function (event) {
          // Your shadow button removal logic here
          console.log("Removing shadow button for", directionName);
          shadowButton.remove();
        });
        
        shadowList.appendChild(shadowButton); // Append shadow button to shadowList
    }
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

  //==============Drawing on canvas==================//

//    document.getElementById("paintBrushBtn").addEventListener("click", function() {
  
//   // Clear the existing content of cursorInfoPanel div
//   cursorInfoPanel.innerHTML = "";

//   // Create the drawingContent div
//   const drawingContent = document.createElement('div');
//   drawingContent.id = 'drawingContent';
//   drawingContent.className = 'bg-dark mb-4';
//   drawingContent.innerHTML = `
//     <div id="drawing-mode-options">
//       <label for="drawing-mode-selector">Mode:</label>
//       <select id="drawing-mode-selector">
//         <option>Pencil</option>
//         <option>Circle</option>
//         <option>Spray</option>
//       </select><br>
//       <label for="drawing-line-width">Line width:</label>
//       <span class="info">1</span><input type="range" value="1" min="0" max="150" id="drawing-line-width">
//       <br>
//       <label for="drawing-color">Line color:</label>
//       <input type="color" value="#000000" id="drawing-color"><br>
//     </div>
//     <button id="clear-drawings" class="btn">Clear</button><br>
//   `;

//   // Append the drawingContent div to the cursorInfoPanel
//   cursorInfoPanel.appendChild(drawingContent);
// });


//========================draw segments=========================//


let isDataFetched = false;
let polygonVisible = false;  // Add a flag to track the visibility of the polygon

document.getElementById('btn_segment').addEventListener('change', function () {
    const isChecked = this.checked;

    if (isChecked) {
        if (!isDataFetched) {
            fetch('http://localhost:8000/0004_back_flat.json')
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
                        drawPolygon(scaledCoordinates, color);
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
});


        function drawPolygon(points, color) {
            const rgbColor = `rgb(${color.red}, ${color.green}, ${color.blue})`;
            const polygon = new fabric.Polygon(points, {
                fill: 'transparent',
                stroke: rgbColor, // Assign color to stroke
                strokeWidth: 2,
                selectable: false,
                isPolygon: true,
                smooth: true,
                strokeUniform: true
            });

            canvas.add(polygon);
            canvas.renderAll();
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

//=========================Editor functions===========================//
   // const btnGroup = document.querySelector('.editorbtns1');
   // const btnGroup = document.querySelector('.editorbtns2');
   //  // Add event listener to the parent container
   //  btnGroup.addEventListener('click', function(event) {
   //      // Check if the clicked element is a radio button
   //        alert("here");
   //      if (event.target.matches('input[type="radio"]')) {
   //          // Print the ID of the clicked radio button
   //          console.log(event.target.id);
   //      }
   //  });

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

let isErasing = false;
const eraserBtn = document.getElementById("eraserBtn");

// Add event listener to the eraser button
eraserBtn.addEventListener("click", toggleErasing);

function toggleErasing() {
    isErasing = !isErasing;
    if (isErasing)
     {
        eraserBtn.style.backgroundColor = "black";
        eraserBtn.style.color = "white";
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.isDrawingMode = true;
      
        // canvas.freeDrawingBrush.width = 10;
        canvas.forEachObject(function(obj) {
            if (obj.type === 'image' && obj.customImageName && obj.customImageName.includes('flat')) {
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
// Get a reference to the Save button
const saveBtn = document.getElementById("save_id");
// Add an event listener to the Save button
saveBtn.addEventListener('click', saveCanvasImage);

// Function to save the canvas content as an image without the background
function saveCanvasImage() {
    // Store the current background image
    const backgroundImage = canvas.backgroundImage;

    // Temporarily remove the background image
    canvas.backgroundImage = null;
    canvas.renderAll();

    // Convert the canvas content to a data URL with PNG format and maximum quality
    const dataURL = canvas.toDataURL('image/png', 1.0);

    // Restore the background image
    canvas.backgroundImage = backgroundImage;
    canvas.renderAll();

    // Create a temporary link element
    const link = document.createElement('a');
    link.download = 'canvas-image.png'; // Set the download attribute
    link.href = dataURL; // Set the href attribute to the data URL
    // Simulate a click on the link to trigger the download
    link.click();
}


//========================paint brush functions==========================//

    var isDrawingMode = false;

    document.getElementById('paintBrushBtn').addEventListener('click', function() {
        if (isErasing) {
          toggleErasing();
          // $(eraserBtn.querySelector('i')).popover('hide');
        }

        isDrawingMode = !isDrawingMode;

        if (isDrawingMode) {
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
            });
        } else {
            canvas.isDrawingMode = false;
            this.style.backgroundColor = '';
            this.style.color = '';
        }
    });


    
});
    