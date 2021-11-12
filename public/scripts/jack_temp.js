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


/**
 * ######################################################################################################################################
 * 
 * WORKSPACE MANAGER TEMP WORK
 * 
 * ######################################################################################################################################
 */

rhit.HTML_ELEMENTS = {
    TEXT_ID: '#textFile'
}

 rhit.WorkspaceManager = class {

	/**
	 *  
	 * @param {string} uid
	 * @param {string} wkspId
	 * @param {string[]} members
	 * @param {WorkspaceFile} fileNames
	 */
	constructor(uid, wkspId, members=[], fileNames=[]) {

		this._uid = uid;
		this._wkspId = wkspId;
		this._memberList = members;
		this._fileList = fileNames;
		this._workspacesRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP);
		
		/**@type {FileInfo} */
		this._fileInfo = null;
		this._unsubscribe;
		this._filesRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.FILES);
		this._wkspRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).doc(wkspId);
		this._storageRef = firebase.storage().ref().child(`${wkspId}`);
		console.log(`  WorkspaceManager: Constructed with id ${this._wkspId}`);
		
	}

	/**
	 * For creating plain text files
	 * 
	 * @param {string} content 
	 * @param {string} name 
	 * @returns {File}
	 */
	createFileObj(content, name){
		const file = new File(
		  [content],
		  `${name}.txt`,
		  { type: "text/plain" }
		);
		
		return file;
	}

	async loadFile(type, name) {

		// Get file from storage
		let fr = new FileReader();

		fr.onload = () => {
			let result = fr.result
			if (type == rhit.FILE_TYPES.TEXT) {

                document.querySelector(rhit.HTML_ELEMENTS.TEXT_ID).value = result;

			} else if (type == rhit.FILE_TYPES.CANVAS) {

                document.querySelector();

            }
		};

		let url = await this.getFileURL(name);
		let fileBlob = await fetch(url);

		switch (type) {
			case 'txt':
				fr.readAsText(fileBlob.text())
				break;
			case 'pdf':
				let buff = await fileBlob.arrayBuffer()
				fr.readAsArrayBuffer(buff);
				break;
			case 'cnv':
				// Draw old image on new canvas ( must be after setting canvas)
				fr;
				break;
		}


		
	}

	async createFile(type, name) {

		return new Promise((resolve, reject) => {
			let id;
			this._filesRef.add({
				[rhit.FB_FILES.FILES_NAME]: name,
				[rhit.FB_FILES.FILES_REF]: `${this._wkspId}/${name}`, // Ref will be created upon first save
				[rhit.FB_FILES.FILES_TYPE]: type,
				[rhit.FB_FILES.FILES_WKSP]: this._wkspId
			}).then(docRef => {
				id = docRef.id;
			});

			this._fileInfo = this._makeFileInfo(name, type, id, `${name}`);
			resolve();
		});
			
	}

	/**
	 * @typedef {Object} FileInfo
	 * @property {string} name
	 * @property {string} type
	 * @property {string} id
	 * @property {string} ref
	 * 
	 * @param {string} name
	 * @param {string} type
	 * @param {string} id
	 * @param {string} ref
	 * @returns {FileInfo}
	 */
	_makeFileInfo(name, type, id, ref) {
		return {name: name, type: type, id: id, ref: ref};
	}

	/**
	 * Saves a document
	 */
	async saveOldFile() {
		return new Promise((resolve, reject)=>{
			if (this._fileInfo == null) resolve(); // For loading first file

			let file;
			switch (this._fileInfo.type) {
				case ('txt'):
					let text = document.querySelector('#textFile').value;
					if (!text || text == '') {
						console.log('  SaveOldFile: There is no text to save');
						return;
					}
					file = this.createFileObj(text, this._fileInfo.name);
					break;
				case ('cnv'):
					break;
				case ('pdf'):

					break;
			}
	
			let path = this._fileInfo.ref;
			this._storageRef.child(path).put(file).then(snapshot => {
				console.log(`  SaveFile: File saved at ${path}`);
			});
			resolve();
		})
	}
  
	// Gets a new document
	async getFileURL(fileName) {
		let path = `${this.wkspId}/${fileName}`;
		let fileRef = await this._storageRef.child(path);
		let url = await fileRef.getDownloadURL();
		return url;
	}

	async changeFile(type, name) {
		await this.saveOldFile();
		await this.loadFile(type, name);

        if (type == rhit.FILE_TYPES.TEXT) {
            document.querySelector('#textFile').value
        }
	}

	beginListening(changeListener) {

		this._unsubscribe = this._ref.
			orderBy(''/**Order key */, 'desc')
			.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log('database update');
			changeListener();
		});
		
	}

	async addWorkspace(name, join) {
		let unique = await rhit.checkUniqueJoin(join)
		if (unique != false) {
			let wksp = `wksp-${name}`;
			this._workspacesRef.add({
				[rhit.FB_WORKSPACES.NAME]: name,
				[rhit.FB_WORKSPACES.JOIN_CODE]: join
			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
				let user = firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).doc(rhit.fbAuthManager.userId)
				user.update({
					[wksp]:docRef.id
				})
				window.location.href = `/workspace.html?id=${docRef.id}`
			})
			.catch(function (error) {
				console.log("Error adding document", error);
			})
		}
	}

	async joinWorkspace(joinCode) {
		let wkspId;
		let wkspName;
		await firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).where(`join`, `==`, `${joinCode}`).get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				wkspId = doc.id
				wkspName = doc.data().name;
			})
		})
		let wksp = `wksp-${wkspName}`
		let user = firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).doc(rhit.fbAuthManager.userId)
		await user.update({
			[wksp]:wkspId
		})
		window.location.href = `/workspace.html?id=${wkspId}`

	}

	async inviteUser(uid) {
		let wkspName = await firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).doc(this._wkspId).get()
		.then(doc => doc.get("name"));
		let wksp = `wksp-${wkspName}`
		let userId;
		await firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).where('uid', '==', uid).get()
		.then(querySnapshot => {
			querySnapshot.forEach(doc => {
				userId = doc.id
			})
		})
		if (userId) {
			firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).doc(userId).update({
				[wksp]:this._wkspId
			})
		} else alert("Invalid user")
	}

	// /**
	//  * 
	//  * @param {string} link 
	//  * @returns {PDFDocument}
	//  */
	// async loadPdf(link) {
	// 	let pdfDoc = await PDFDocument.load(link);
	// 	return pdfDoc;
	// }

	/**
	 * @typedef {Object} WorkspaceFile
	 * @property {string} name
	 * @property {string} ref
	 * @property {string} type
	 */
	/**
	 * 
	 * @param {string} name 
	 * @param {string} ref 
	 * @param {string} type 
	 * @returns {WorkspaceFile}
	 */
	static WorkspaceFile = (name, ref, type) => {
		return {name: name, ref: ref, type: type};
	}

}