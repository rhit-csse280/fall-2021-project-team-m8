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
 * PDF
 * 
 * ######################################################################################################################################
 */

// Fetch PDF as blodk from URL:
 const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
 const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
 const pdfDoc4 = await PDFDocument.load(arrayBuffer)

// PDF Library: https://pdf-lib.js.org/docs/api/classes/pdfdocument#static-load


/**
 * ######################################################################################################################################
 * 
 * CANVAS
 * 
 * ######################################################################################################################################
 */

// Canvas = HTML element -> Resolves canvas element to PNG blob
 let imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

/**
 * For redrawing image onto canvas: https://www.w3schools.com/tags/canvas_drawimage.asp
 */