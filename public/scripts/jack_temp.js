/**
 * This is not a permanent module, but a space for my code to go to
 * prevent merge conflicts while we are both working on the same files
 */


/**
 * ######################################################################################################################################
 * 
 * Divider
 * 
 * ######################################################################################################################################
 */


/**
 * ######################################################################################################################################
 * 
 * CANVAS STUFF
 * 
 * ######################################################################################################################################
 */

/**
 * When creating canvas element
 */
 document.querySelector("#wkspCanvas").addEventListener('click', ()=> {
  document.querySelector(".wksp-blank-page").innerHTML = `${rhit.wkspConstants.CANVAS_HTML}`;
  /**@type {HTMLCanvasElement} */
  let canvas = document.querySelector('#testCanvas');
  // Resize canvas to fit
  fitToContainer(canvas);
  canvas.addEventListener('mousedown', (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.drawCircle(x, y);
  });
});

/**
 * Plan for RE fetching canvas: 
 * 
 * Make invisible image element -> download old canvas image
 * 
 * Draw old image onto new canvas https://www.w3schools.com/tags/canvas_drawimage.asp
 * 
 */


/**
 * Add this as a method to WorkspacePageController (called in canvas click listener)
 */
/**
	 * Draws where the mouse is on the canvas
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 * @returns 
	 */
function drawCircle(x, y) {
  /**
   * Fetching Canvas element and making
   * context
   * @type {HTMLCanvasElement} 
  */
  let canvas = document.querySelector('#testCanvas');
  if (!canvas.getContext) {
    console.log('Canvas not supported');
    return;
  }
  let context = canvas.getContext('2d');
  context.fillStyle = 'rgb(0, 0, 0)';

  console.log('Canvas and context made');

  context.beginPath();
  context.arc(x, y, 5, 0, Math.PI * 2, true);
  context.fill();
}

/**
 * ######################################################################################################################################
 * 
 * TEXT FILES
 * 
 * ######################################################################################################################################
 */

/**
 * For creating plain text files
 * 
 * @param {string} content 
 * @param {string} name 
 * @returns {File}
 */
 function createFileObj(content, name){
  const file = new File(
    [content],
    `${name}.txt`,
    { type: "text/plain" }
  );
  
  return file;
}

// ADD THIS CSS RULE FOR TEXTAREA
// #workspacePage #textFile {
//   width: 100%;
//   height: 100%; 
//   box-sizing: border-box;
// }

/**
 * ######################################################################################################################################
 * 
 * FILE UPLOAD/DOWNLOAD
 * 
 * ######################################################################################################################################
 */

// Saves the current file to storage
async saveFile() {
  let path = `${this.wkspId}/${this._currentFileName}`;
  let fileRef = this._storageRef.child(path);
  fileRef.put(this._file).then(snapshot => {
    console.log(`  SaveFile: File saved at ${path}`);
  });
}

// Gets a new document
async getFile(fileName) {
  let path = `${this.wkspId}/${fileName}`;
  let fileRef = this._storageRef.child(path);
  let url = fileRef.getDownloadURL();
}