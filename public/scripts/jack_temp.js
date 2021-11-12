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
 const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
 const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
 const pdfDoc4 = await PDFDocument.load(arrayBuffer)


/**
 * ######################################################################################################################################
 * 
 * CANVAS
 * 
 * ######################################################################################################################################
 */
 let imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));


/**
 * ######################################################################################################################################
 * 
 * FILE UPLOAD/DOWNLOAD
 * 
 * ######################################################################################################################################
 */
