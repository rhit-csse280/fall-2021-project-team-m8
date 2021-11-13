// import {PDFDocument} from '../pdf-lib';

/** namespace. */
var rhit = rhit || {};

/**
 * Constants used for the Workspace Page
 */
rhit.wkspConstants = {

	PDF_HTML: '<embed id="pdfEmbed" type="application/pdf" src="" height="100%" width="100%">',
	PDF_HTML_START: `<embed type="application/pdf" src="`,
	PDF_HTML_END: `" height="100%" width="100%">`,
	PDF_URL: `https://firebasestorage.googleapis.com/v0/b/pickens-thorp-squadm8-csse280.appspot.com/o/sat_score.pdf?alt=media&token=8eeb6335-d37c-431e-a57b-11cc8646386d`,
	CANVAS_HTML: `<canvas id="myCanvas" height="100%" width="100%"><div>This browser does not support our canvas feature :( Most modern browsers (Chrome, Edge, Firefox) do support this.</div></canvas>`,
	TEXTAREA_HTML: "<textarea id=\"textFile\"></textarea>"

}

rhit.FB_COLLECTIONS = {
	FILES: 'FileRefs',
	USERS: 'Users',
	WKSP: 'Workspaces'
}

rhit.FB_WORKSPACES = {
	NAME: 'name',
	JOIN_CODE: 'join'
}

rhit.FB_FILES = {
	FILES_COLLECTION: 'Files',
	FILES_NAME: 'name', 
	FILES_TYPE: 'type',
	FILES_REF: 'ref',
	FILES_WKSP: 'workspace'
}

rhit.FILE_TYPES = {
	TEXT: 'txt',
	PDF:'pdf',
	CANVAS:'cnv'
}

rhit.HTML_ELEMENTS = {
    TEXT_ID: '#textFile',
	CANVAS_ID: '#myCanvas',
	PDF_ID: '#pdfEmbed',
	PDF_UPLOAD_ID: '#pdfFile',
	BLANK_WORKSPACE_PAGE: '.wksp-blank-page'
}

rhit.homePageManager;


/**
 * Declaring it for typing purposes
 * @type {rhit.FbAuthManager}
 */
rhit.fbAuthManager;

// From stackoverflow
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

// From https://stackoverflow.com/a/68497562
// Slightly modified to use URL source instead of blob
function renderImage(canvas, url) {
    const ctx = canvas.getContext('2d')
    var img = new Image()
	img.crossOrigin="anonymous";
    img.onload = (event) => {
      URL.revokeObjectURL(event.target.src) // 👈 This is important. If you are not using the blob, you should release it if you don't want to reuse it. It's good for memory.
      ctx.drawImage(event.target, 0, 0)
    }
    img.src = url;
}

/**
 * From https://stackoverflow.com/a/10215724
 * @param {HTMLCanvasElement} canvas 
 */
function fitToContainer(canvas){
	// Make it visually fill the positioned parent
	canvas.style.width ='100%';
	canvas.style.height='100%';
	// ...then set the internal size to match
	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
  }



/**
 * ###################################################################################################################
 * 
 * Landing Page Code
 * 
 * ###################################################################################################################
 */
 rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		}
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		this.userId = null;
	}

	async beginListening(changeListener) {
		console.log("hi");
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this._user = user;
				firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).where(`uid`, `==`, `${user.uid}`).get()
				.then((querySnapshot) => {
					if (querySnapshot.docs.length == 0) {
						rhit.newUser(user.uid);
					}
					querySnapshot.forEach((doc) => {
						this.userId = doc.id;
					})
				});
			}
			changeListener();
		})
	}

	signIn() {
		Rosefire.signIn("2b6351f3-9842-4276-83f2-e65d1e2fb7cc", (err, rfUser) => {
			if (err) {
			  console.log("Rosefire error!", err);
			  return;
			}
			console.log("Rosefire success!", rfUser);
		  
			// Next use the Rosefire token with Firebase auth.
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
			  if (error.code === 'auth/invalid-custom-token') {
				console.log("The token you provided is not valid.");
			  } else {
				console.log("signInWithCustomToken error", error.message);
			  }
			}); // Note: Success should be handled by an onAuthStateChanged listener.
		  });
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		})
		window.location.href = "/"
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		if (!this._user) return false;
		return this._user.uid;
	}
}

rhit.checkForRedirects = function() {
	if (document.querySelector("#landingPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/home.html";
	}
	if (!document.querySelector("#landingPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
}
/**
 * @typedef {Object} InitOptions
 * @property {string|undefined} uid
 * 
 * @param {InitOptions} options 
 * @returns 
 */
rhit.initializePage = async function(options) {
	if (document.querySelector("#homePage")) {
		if (!options.uid) return;
		// This is bad, find a way to handle it
		let wksps = await rhit.buildHomePage(options.uid)
		rhit.homePageManager = new rhit.HomePageManager();
		new rhit.HomePageController(wksps, options.uid);
	}

	if (document.querySelector("#workspacePage")) {
		if (!options.uid) return;
		// This is bad, find a way to handle it
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const wkspId = urlParams.get("id");
		let wkspMembers = await rhit.getWkspMembers(wkspId);
		let wkspFiles = await rhit.getWkspFiles(wkspId);
		new rhit.WorkspacePageController(options.uid, wkspId, wkspMembers, wkspFiles);
	}

	if (document.querySelector("#landingPage")) {
		new rhit.LoginPageController();
	}
}
/**
 * ###################################################################################################################
 * 
 * Home Page Code
 * 
 * ###################################################################################################################
 */

rhit.HomePageController = class {
	constructor(wksps, uid) {
		let workspaces = "";
		for (let workspace of wksps) {
			workspaces += `<a class='workspace-link' href=/workspace.html?id=${workspace.id}>${workspace.name}</a><hr>`
		}
		document.querySelector("#workspacesBox").innerHTML = workspaces;
		document.querySelector("#navMessage").innerHTML = `Hey, ${rhit.fbAuthManager.uid}`;
		document.querySelector("#navLogOutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
		document.querySelector("#welcomeText").innerHTML = `Welcome back, ${uid}! Enjoy an efficient session on SquadM8's Workspace`
		document.querySelector("#createButton").addEventListener("click", () => {
			let wkspName = document.querySelector("#wkspName").value;
			let wkspJoin = document.querySelector("#wkspJoin").value;
			rhit.homePageManager.addWorkspace(wkspName, wkspJoin)
			.then();
		})
		document.querySelector("#submitCreateWksp").addEventListener("click", () => {
			let wkspName = document.querySelector("#inputWkspName").value;
			let wkspJoin = document.querySelector("#inputJoinCode").value;
			rhit.homePageManager.addWorkspace(wkspName, wkspJoin);
		})
		document.querySelector("#joinButton").addEventListener("click", () => {
			let joinCode = document.querySelector("#wkspJoinCode").value;
			rhit.homePageManager.joinWorkspace(joinCode);
		} )
		document.querySelector("#submitJoinWksp").addEventListener("click", () => {
			let joinCode = document.querySelector("#inputJoinCode2").value;
			rhit.homePageManager.joinWorkspace(joinCode);
		})
	}
}

rhit.HomePageManager = class {
	constructor() {
		this._workspacesRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP);
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
				let user = firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).doc(rhit.fbAuthManager.userId)
				user.update({
					[wksp]:docRef.id
				})
				window.location.href = `/workspace.html?id=${docRef.id}`
			})
			.catch(function (error) {
				console.log(error);
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
}

/**
 * Call and await this function before making the homepage.
 * This function queries the database to get the workspace
 * information needed to construct the home page.
 * 
 * @param {string} uid
 */
 rhit.buildHomePage = async function(uid) {
	// Get a user reference to loop through for workspaces then get list of workspaces & convert to display names
	let userData = [];
	await firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).where(`uid`, `==`, `${uid}`).get()
	.then((querySnapshot) => {
		if (querySnapshot.docs.length == 0) {
		}
		querySnapshot.forEach((doc) => {
			rhit.userId = doc.id;
			for (const [key, value] of Object.entries(doc.data())) {
				if (key != "uid") {
					let name = key.split('-')[1];
					userData.push({name:name, id:value})
				}
			}
		})
	});
	
	return userData;

}

/**
 * Creates a new user and a default workspace the first time
 * they go to the home page
 * 
 * 1. Creates user and workspace named {userID}s workspace
 * 
 * 2. Creates workspace and updates user's workspace ID with the
 *    new space's ID
 * 
 * @param {string} uid 
 */
 rhit.newUser = async function(uid) {
	let userRef = await firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS);	
	userRef.add({
		uid: `${uid}`,
	}).then(doc => {
		rhit.userId = doc.id;
	});
}

/**
 * ###################################################################################################################
 * 
 * Workspace Page Code
 * 
 * ###################################################################################################################
 */

rhit.WorkspacePageController = class {
	
	/**
	 * @param {string} uid
	 * @param {string} wkspId
	 */
	constructor(uid, wkspId, members, files) {
		/*
		  Adding listeners to Workspace Page Buttons
		*/
		this._filesRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.FILES);
		this._wkspId = wkspId;
		this._color = document.querySelector("#inputColor").value;
		this._brushSize = 5;		
		this.updateView();
		this.manager = new rhit.WorkspaceManager(uid, wkspId, members, files);
		this.createListeners();
		this.drawing = false;
		this.beginListening(this.updateView);

	}

	async createListeners() {
		/**
		 * Top menu
		 */
		document.querySelector("#wkspDrawerHomeButton").onclick = (event) => {
			window.location.href = "/home.html";
		}
		document.querySelector("#navMessage").innerHTML = `Hey, ${rhit.fbAuthManager.uid}`;
		document.querySelector("#navHomeButton").onclick = (event) => {
			window.location.href = "/home.html";
		}
		document.querySelector("#navLogOutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}

		/**
		 * ###############################
		 * New File Buttons
		 * ###############################
		 */

		// Create new text
		document.querySelector("#submitCreateTxt").addEventListener('click', ()=> {
			if (this.manager._fileInfo == null) {
				document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE).innerHTML = rhit.wkspConstants.TEXTAREA_HTML;
				let name = document.querySelector('#inputTxtName').value;
				// Create a new text file
				this.manager.createFile(rhit.FILE_TYPES.TEXT, name);
				this.updateView();
				return;
			}

			this.manager.saveOldFile().then(() => {
				document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE).innerHTML = rhit.wkspConstants.TEXTAREA_HTML;
				let name = document.querySelector('#inputTxtName').value;
				// Create a new text file
				this.manager.createFile(rhit.FILE_TYPES.TEXT, name);
				this.updateView();
			});
			
		});

		// Create new canvas
		document.querySelector('#submitCreateCanvas').addEventListener('click', ()=> {

			if (this.manager._fileInfo == null) {
				this.setCanvasHTML();
				let name = document.querySelector('#inputCanvasName').value;
				// Create a new canvas file
				this.manager.createFile(rhit.FILE_TYPES.CANVAS, name).then(() => {
					this.updateView();
				});
				return;
			}
			// Save old file to database and storage
			this.manager.saveOldFile().then(() => {
				this.setCanvasHTML();
				let name = document.querySelector('#inputCanvasName').value;
				// Create a new canvas file
				this.manager.createFile(rhit.FILE_TYPES.CANVAS, name).then(() => {
					this.updateView();
				});
			});
			
		});

		// Upload new PDF
		document.querySelector("#submitCreatePDF").addEventListener('click', ()=> {

			if (this.manager._fileInfo == null) {

				let newFile = document.querySelector(rhit.HTML_ELEMENTS.PDF_UPLOAD_ID).files[0];
				let newName = document.querySelector('#inputPdfName').value;
				if (!newFile || !newName) {
					alert('Please give me a pdf and name');
				}
				this.manager.uploadPDF(newFile, newName).then(() => {
					document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE).innerHTML = `${rhit.wkspConstants.PDF_HTML}`;
					this.manager.loadFile('pdf', newName);
					this.manager.createFile('pdf', newName);
					this.updateView();
				});
				
				return;

			}
			this.manager.saveOldFile().then(() => {
				let newFile = document.querySelector(rhit.HTML_ELEMENTS.PDF_UPLOAD_ID).files[0];
				let newName = document.querySelector('#inputPdfName').value;
				if (!newFile || !newName) {
					alert('Give me a pdf and name');
				}
				this.manager.uploadPDF(newFile, newName).then(() => {
					document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE).innerHTML = `${rhit.wkspConstants.PDF_HTML}`;
					this.manager.loadFile('pdf', newName);
					this.manager.createFile('pdf', newName);
					this.updateView();
				});
			});
			
		});

		/**
		 * ###############################
		 * Menu Buttons
		 * ###############################
		 */

		// Create new Workspace
		document.querySelector("#submitCreateWksp").addEventListener('click', () => {
			let wkspName = document.querySelector("#inputWkspName").value;
			let wkspJoin = document.querySelector("#inputJoinCode").value;
			this.manager.addWorkspace(wkspName, wkspJoin);
		})

		// Join a workspace
		document.querySelector("#submitJoinWksp").addEventListener('click', () => {
			let joinCode = document.querySelector("#inputJoinCode2").value;
			this.manager.joinWorkspace(joinCode);
		})

		// Invite to workspace
		document.querySelector("#submitInviteToWksp").addEventListener('click', () => {
			let uid = document.querySelector("#inputUid").value;
			this.manager.inviteUser(uid);
			this.updateView();
		})

		/**
		 * ###############################
		 * Canvas Setting Buttons
		 * ###############################
		 */

		// Change canvas color
		document.querySelector("#submitColor").addEventListener('click', () => {
			this._color = document.querySelector("#inputColor").value;
			for (let button of document.querySelectorAll(".brush")) {
				button.style.color = this._color;
			}
			document.querySelector("#color").style.color = this._color;
			if ((document.querySelector("#colorMobile"))) document.querySelector("#colorMobile").style.color = this._color;
		})

		document.querySelector("#brushSmall").addEventListener('click', () => {
			this._brushSize = 5;
			for (let button of document.querySelectorAll(".brush")) {
				button.classList.remove("brush-selected")
			}
			document.querySelector("#brushSmall").classList.add("brush-selected");
			if (document.querySelector("#brushSmallMobile")) document.querySelector("#brushSmallMobile").classList.add("brush-selected");
		});

		document.querySelector("#brushMedium").addEventListener('click', () => {
			this._brushSize = 10;
			for (let button of document.querySelectorAll(".brush")) {
				button.classList.remove("brush-selected")
			}
			document.querySelector("#brushMedium").classList.add("brush-selected");
			if (document.querySelector("#brushMediumMobile")) document.querySelector("#brushMediumMobile").classList.add("brush-selected");
		});

		document.querySelector("#brushLarge").addEventListener('click', () => {
			this._brushSize = 15;
			for (let button of document.querySelectorAll(".brush")) {
				button.classList.remove("brush-selected")
			}
			document.querySelector("#brushLarge").classList.add("brush-selected");
			if (document.querySelector("#brushMediumMobile")) document.querySelector("#brushLargeMobile").classList.add("brush-selected");
		});

		document.querySelector("#erase").addEventListener('click', () => {
			this._color = '#FFFFFF';
			for (let button of document.querySelectorAll(".brush")) {
				button.style.color = this._color;
			}
			document.querySelector("#color").style.color = this._color;
			if (document.querySelector("#colorMobile")) document.querySelector("#colorMobile").style.color = this._color;
		})

		/**
		 * ###############################
		 * Mobile Buttons
		 * ###############################
		 */

		document.querySelector("#brushSmallMobile").addEventListener('click', () => {
			this._brushSize = 5;
			for (let button of document.querySelectorAll(".brush")) {
				button.classList.remove("brush-selected")
			}
			document.querySelector("#brushSmallMobile").classList.add("brush-selected");
			document.querySelector("#brushSmall").classList.add("brush-selected");
		});

		document.querySelector("#brushMediumMobile").addEventListener('click', () => {
			this._brushSize = 10;
			for (let button of document.querySelectorAll(".brush")) {
				button.classList.remove("brush-selected")
			}
			document.querySelector("#brushMediumMobile").classList.add("brush-selected");
			document.querySelector("#brushMedium").classList.add("brush-selected");
		});

		document.querySelector("#brushLargeMobile").addEventListener('click', () => {
			this._brushSize = 15;
			for (let button of document.querySelectorAll(".brush")) {
				button.classList.remove("brush-selected")
			}
			document.querySelector("#brushLargeMobile").classList.add("brush-selected");
			document.querySelector("#brushLarge").classList.add("brush-selected");
		});

		document.querySelector("#eraseMobile").addEventListener('click', () => {
			this._color = '#FFFFFF';
			for (let button of document.querySelectorAll(".brush")) {
				button.style.color = this._color;
			}
			document.querySelector("#color").style.color = this._color;
			document.querySelector("#colorMobile").style.color = this._color;
		})
	}

	setCanvasHTML() {
		document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE).innerHTML = `${rhit.wkspConstants.CANVAS_HTML}`;
		/**@type {HTMLCanvasElement} */
		let canvas = document.querySelector(rhit.HTML_ELEMENTS.CANVAS_ID);
		// Resize canvas to fit
		fitToContainer(canvas);
		canvas.addEventListener('mousedown', (event) => {
			this.drawing = true;
		});
		canvas.addEventListener('mouseup', (event) => {
			this.drawing = false;
		});
		canvas.addEventListener('mousemove', (event) => {
			if (!this.drawing) return;

			const rect = event.target.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
		
			this.drawCircle(x, y);
		});
	}

	/**
	 * Note HTML changes needed in workspace.html before
	 * finishing
	 */
	setFileList(files) {
		const newList = htmlToElement('<div id="filesList"></div>');
		for (let i=0; i<files.length; i++) {
			const listItem = htmlToElement(`<div class="wksp-list-item"></div>`);
			const element = htmlToElement(`<span>${files[i].name}.${files[i].type}</span>`)
			const deleteButton = htmlToElement(`<span class="wksp-list-item">&nbsp;&nbsp;X</span>`);
			element.addEventListener('click', () => {
				this.switchFiles(files[i].type, files[i].name)
			})
			deleteButton.addEventListener('click', () => {
				this.manager.deleteFile(files[i].name);
			})
			listItem.appendChild(element)
			listItem.appendChild(deleteButton)
			newList.appendChild(listItem)
		}

		const oldList = document.querySelector("#filesList");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}

	// Tells the manager to save/load files and sets workspace HTML
	switchFiles(type, name) {
		if (this.manager._fileInfo != null) {
			this.manager.saveOldFile().then(() => {
				let wkspPage = document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE);
				switch (type) {
					case 'txt':
						wkspPage.innerHTML = rhit.wkspConstants.TEXTAREA_HTML;
						break;
					case 'cnv':
						this.setCanvasHTML();
						break;
					case 'pdf':
						wkspPage.innerHTML = rhit.wkspConstants.PDF_HTML;
						break
				}
				this.manager.loadFile(type, name);
				return;
			});
		}

		let wkspPage = document.querySelector(rhit.HTML_ELEMENTS.BLANK_WORKSPACE_PAGE);
		switch (type) {
			case 'txt':
				wkspPage.innerHTML = rhit.wkspConstants.TEXTAREA_HTML;
				break;
			case 'cnv':
				this.setCanvasHTML();
				break;
			case 'pdf':
				wkspPage.innerHTML = rhit.wkspConstants.PDF_HTML;
				break
		}
		this.manager.loadFile(type, name);
	}

	setMobileFileList(files) {
		const newList = htmlToElement('<div id="mobileFilesList"></div>');
		for (let i=0; i<files.length; i++) {
			const element = htmlToElement(`<div class="wksp-list-item">${files[i].name}.${files[i].type}</div>`);
			element.addEventListener('click', () => {
				this.switchFiles(files[i].type, files[i].name);
			})
			newList.appendChild(element)
		}

		const oldList = document.querySelector("#mobileFilesList");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}

	async setMemberList(members, wkspId) {
		let wkspName;
		await firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).doc(wkspId).get()
		.then(doc => {
			wkspName = doc.get("name")
		})
		document.querySelector("#wkspHeader").innerHTML = wkspName
		if (document.querySelectorAll("#wkspMobileHeader")) document.querySelector("#wkspMobileHeader").innerHTML = wkspName
		let memberString = "";
		for (let i=0; i<members.length; i++) {
			memberString += `<div class="wksp-list-item">${members[i]}</div>`
		}

		document.querySelector("#membersList").innerHTML = memberString;
		document.querySelector("#mobileMembersList").innerHTML = memberString;
	}

	/**
	 * Draws where the mouse is on the canvas
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 * @returns 
	 */
 	drawCircle(x, y) {
		/**
		 * Fetching Canvas element and making
		 * context
		 * @type {HTMLCanvasElement} 
		*/
		let canvas = document.querySelector(rhit.HTML_ELEMENTS.CANVAS_ID);
		if (!canvas.getContext) {
		return;
		}
		let context = canvas.getContext('2d');
		context.fillStyle = this._color;
	
		context.beginPath();
		context.arc(x, y, this._brushSize, 0, Math.PI * 2, true);
		context.fill();
	}

	async beginListening() {
		this._filesRef.onSnapshot(querySnapshot => {
			// Update file/member list
			// Update view
			this.updateView();

		});
	}

	async updateView() {
		this.setMemberList(await rhit.getWkspMembers(this._wkspId), this._wkspId);
		let files = await rhit.getWkspFiles(this._wkspId);
		this.setFileList(files);
		this.setMobileFileList(files);
	}
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

	async uploadPDF(file, name) {
		await this._storageRef.child(name).put(file);
	}

	async loadFile(type, name) {

		let url = await this.getFileURL(name);
		/**@type {Blob} */
		let fileBlob = await fetch(url);

		switch (type) {
			case 'txt':
				let textOne = await fileBlob.text();
				document.querySelector(rhit.HTML_ELEMENTS.TEXT_ID).value = textOne;
				break;
			case 'pdf':
				document.querySelector(rhit.HTML_ELEMENTS.PDF_ID).setAttribute('src', url)
				break;
			case 'cnv':
				/** @type {HTMLCanvasElement} */
                let canvas = document.querySelector(rhit.HTML_ELEMENTS.CANVAS_ID);
				renderImage(canvas, url);
				break;
		}
		this._fileInfo = this._makeFileInfo(name, type, )	
	}

	async createFile(type, name) {

		return new Promise((resolve, reject) => {
			let id;
			this._filesRef.add({
				[rhit.FB_FILES.FILES_NAME]: name,
				[rhit.FB_FILES.FILES_REF]: name, // Ref will be created upon first save
				[rhit.FB_FILES.FILES_TYPE]: type,
				[rhit.FB_FILES.FILES_WKSP]: this._wkspId
			}).then(docRef => {
				id = docRef.id;
			});

			this._fileInfo = this._makeFileInfo(name, type);
			resolve();
		});
			
	}	

	/**
	 * Saves a document
	 */
	async saveOldFile() {
		return new Promise((resolve, reject)=>{
			if (this._fileInfo == null) {
				resolve(); // For loading first file
			}
			let path = this._fileInfo.name;
			switch (this._fileInfo.type) {
				case ('txt'):
					let text = document.querySelector('#textFile').value;
					if (!text || text == '') {
						return;
					}
					let saveFile = this.createFileObj(text, this._fileInfo.name);
					this._storageRef.child(path).delete().then(() => {
						this._storageRef.child(path).put(saveFile).then(snapshot => {

						}).catch(err => {
							console.log(err);
						});
					}).catch(err => {
						this._storageRef.child(path).put(saveFile).then(snapshot => {
							console.log(` This is either a new file or a delete error ${path}`);
						}).catch(err => {
							console.log(err);
						});
					})
					break;
				case ('cnv'):
					/** @type {HTMLCanvasElement} */
					let canvas = document.querySelector(rhit.HTML_ELEMENTS.CANVAS_ID);
					if (!(canvas instanceof HTMLCanvasElement)) {
						return;
					}
					canvas.toBlob(blob => {

						if (!blob) {
							reject(new Error('Invalid Canvas Blob'));
						}
						this._storageRef.child(path).delete().then(() => {
							this._storageRef.child(path).put(blob).then(snapshot => {
							}).catch(err => {
								console.log(err);
							});
						})
						.catch(() => {
							this._storageRef.child(path).put(blob).then(snapshot => {
							}).catch(err => {
								console.log(err);
							});
						})
						
					});
					break;
				case ('pdf'):
					// Nothing... URL is already saved in file ref
					break;
			}
			resolve();
		});
	}

	async deleteFile(filename) {
		await this._storageRef.child(filename).delete()
		.then()
		.catch(err => {
			console.log(err);
		})
		let id;
		await firebase.firestore().collection(rhit.FB_COLLECTIONS.FILES).where('name', '==', filename).get()
		.then(querySnapshot => {
			querySnapshot.forEach(doc => {
				id = doc.id
			})
		})

		let file = firebase.firestore().collection(rhit.FB_COLLECTIONS.FILES).doc(id);
		file.delete();
	}
 
	// Gets a new document
	async getFileURL(fileName) {
		let path = `${fileName}`;
		let fileRef = await this._storageRef.child(path);
		let url = await fileRef.getDownloadURL();
		return url;
	}

	beginListening(changeListener) {

		this._unsubscribe = this._ref.
			orderBy(''/**Order key */, 'desc')
			.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
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

	/**
	 * @typedef {Object} FileInfo
	 * @property {string} name
	 * @property {string} type
	 * 
	 * @param {string} name
	 * @param {string} type
	 * @returns {FileInfo}
	 */
	_makeFileInfo(name, type) {
		return {name: name, type: type};
	}


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

/**
 * Gets necessary info for WorkspaceManager constructor
 * 
 */
 rhit.getWkspMembers = async function(wkspId) {
	let wkspName;
	await firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).doc(wkspId).get()
	.then((doc) => {	
		wkspName = doc.get("name");
	});

	let members = [];
	await firebase.firestore().collection(rhit.FB_COLLECTIONS.USERS).where(`wksp-${wkspName}`, `==`, `${wkspId}`).get()
		.then(querySnapshot => {
			querySnapshot.docs.forEach(doc => {
				members.push(doc.get('uid'));
			});
		});
	return members;

}

rhit.getWkspFiles = async function(wkspId) {
	
	/**@type {WorkspaceFile[]} */
	let files = [];
	await firebase.firestore().collection(rhit.FB_COLLECTIONS.FILES).where("workspace", "==", `${wkspId}`).get()
		.then(querySnapshot => {
			querySnapshot.docs.forEach(doc => {
				let file = rhit.WorkspaceManager.WorkspaceFile(doc.get("name"), doc.get("ref"), doc.get("type"));
				files.push(file); /* {name: doc.get('name'), ref: doc.get('ref'), type: doc.get('type')} */
			});
		});
	return files;
	
}

rhit.checkUniqueJoin = async function(joinCode) {
	let unique = false;
	await firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).where(rhit.FB_WORKSPACES.JOIN_CODE, "==", joinCode).get()
	.then(querySnapshot => {
		if (querySnapshot.docs.length == 0) {
			unique = true;
		} else {
			alert("A workspace already exists with this join code");
			unique = false;
		}
	})
	return unique;
}


/* Main */
/** function and class syntax examples */
rhit.main = async function () {

	/**
	 * Initialize firebase
	 */
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(async function() {
		rhit.checkForRedirects();
		let options = {};
		if (rhit.fbAuthManager.uid) {
			options.uid = rhit.fbAuthManager.uid;
		}		
		await rhit.initializePage(options);	
	});
};

rhit.main();
