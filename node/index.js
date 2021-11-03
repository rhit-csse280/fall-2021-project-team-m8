const { PDFDocument } = require("pdf-lib");

/**
 * 
 * @returns {rhit.PDFDocHandler}
 */
 PDFHandlerHelper = async function(url) {
	let pdfDoc = await PDFDocument.load(url);

	

}

PDFDocHandler = class {
	/**
	 *
	 * @param {PDFDocHandlerOptions} options 
	 */
	constructor(pdfDoc) {

		this.pdfDoc = pdfDoc;
		
	}
}