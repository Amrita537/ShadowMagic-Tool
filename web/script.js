// Onclick of the button 
document.querySelector("#mybutton").onclick = function () {   
  // Call python's random_python function 
  eel.random_python()(function(number){                       
    // Update the div with a random number returned by python 
    console.log("files loaded")
  }) 
}