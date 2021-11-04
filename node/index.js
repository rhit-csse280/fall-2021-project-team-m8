const { PDFDocument } = require("pdf-lib");
const express = require('express');

const ERROR_CODES = {
    MISSING_ARGS: 0
}

const app = express();
app.use('./static', express.static('public'));

// Makes a new workspace and responds with references to them
app.get('/wkspcreate', async function(req, res) {

    let wksp = req.query.wksp;
    let uid = req.query.uid;

    if (!wksp || !uid) {
        // Triggers if the request is missing arguments vital to operation
        console.log('  Bad request:\n   /wkspcreate missing either "wksp" or "uid"');
        res.json({error: ERROR_CODES.MISSING_ARGS})
    }

    // Handle making the workspace now

});

app.get('/fetchfile', async function(req, res) {

});

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

/**
 * #########################################################################################
 * 
 * FIREBASE STUFF
 * 
 * #########################################################################################
 */

/**
 * DELETE FIREBASE COLLECTION
 */
async function deleteCollection(db, collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);
  
    return new Promise((resolve, reject) => {
      deleteQueryBatch(db, query, resolve).catch(reject);
    });
}
  
async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();
  
    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }
  
    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  
    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve);
    });
}