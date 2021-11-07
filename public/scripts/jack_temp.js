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