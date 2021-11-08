

/** namespace. */
var rhit = rhit || {};

/**
 * Constants used for the Workspace Page
 */
rhit.wkspConstants = {

	PDF_HTML_START: `<embed type="application/pdf" src="`,
	PDF_HTML_END: `" height="100%" width="100%">`,
	PDF_URL: `https://firebasestorage.googleapis.com/v0/b/pickens-thorp-squadm8-csse280.appspot.com/o/sat_score.pdf?alt=media&token=8eeb6335-d37c-431e-a57b-11cc8646386d`,
	TEXT_HTML_START: `<embed type="application/pdf" src="`,
	TEXT_HTML_END: `" height="100%" width="100%">`,
	TEXT_URL: `https://firebasestorage.googleapis.com/v0/b/pickens-thorp-squadm8-csse280.appspot.com/o/text.txt?alt=media&token=5242db20-af80-47e7-9e73-5a6a28693b24`,
	CANVAS_HTML: `<canvas id="testCanvas" height="100%" width="100%"><div>This browser does not support our canvas feature :( Most modern browsers (Chrome, Edge, Firefox) do support this.</div></canvas>`,
	WORKSPACES_REF_KEY: "Workspaces",
	FILES_REF_KEY: "Files",
	USERS_REF_KEY: "Users",
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
	TEXT: 'text',
	PDF:'pdf',
	CANVAS:'canvas'
}

rhit.WKSP_KEY_NAME = "name"
rhit.WKSP_KEY_JOINCODE = "join";
rhit.FB_WORKSPACE_COLLECTION = "Workspaces"
rhit.FB_USERS_COLLECTION = "Users"
rhit.FB_FILES_COLLECTION = "Files"
rhit.homePageManager;
rhit.userID;


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
	}

	async beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
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
		console.log("ope");
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
		console.log("You are on the home page");
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
		console.log(`  InitializePage: Loading workspace ${wkspId}`);
		let wkspData = await rhit.buildWorkspacePage(wkspId);
		console.log(`  InitialisePage: wkspData =\n  `, wkspData);
		new rhit.WorkspacePageController(options.uid, wkspId, wkspData);
	}

	if (document.querySelector("#landingPage")) {
		console.log("You are on the landing page");
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
			workspaces += `<a class='workspace-link' href=/workspace.html?id=${workspace.id}'>${workspace.name}</a><hr>`
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
			rhit.homePageManager.addWorkspace(wkspName, wkspJoin);
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
		this._workspacesRef = firebase.firestore().collection(rhit.FB_WORKSPACE_COLLECTION);
	}

	addWorkspace(name, join) {
		let wksp = `wksp-${name}`;
		this._workspacesRef.add({
			[rhit.WKSP_KEY_NAME]: name,
			[rhit.WKSP_KEY_JOINCODE]: join
		})
		.then(function (docRef) {
			console.log("Document written with ID: ", docRef.id);
			let user = firebase.firestore().collection(rhit.FB_USERS_COLLECTION).doc(rhit.userID)
			user.update({
				[wksp]:docRef.id
			})
			window.location.href = `/workspace.html?id=${docRef.id}`
		})
		.catch(function (error) {
			console.log("Error adding document", error);
		})
	}

	joinWorkspace(joinCode) {
		let wkspId;
		let wkspName;
		firebase.firestore().collection(rhit.FB_WORKSPACE_COLLECTION).where(`join`, `==`, `${joinCode}`).get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				wkspId = doc.id
				wkspName = doc.data().name;
			})
		})
		.then(() => {
			let wksp = `wksp-${wkspName}`
			let user = firebase.firestore().collection(rhit.FB_USERS_COLLECTION).doc(rhit.userID)
			user.update({
				[wksp]:wkspId
			})
		})
		.then(() => {
			window.location.href = `/workspace.html?id=${wkspId}`
		})
		.catch(function (error) {
			console.log("Error adding document", error);
		});

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
	await firebase.firestore().collection(this.wkspConstants.USERS_REF_KEY).where(`uid`, `==`, `${uid}`).get()
	.then((querySnapshot) => {
		if (querySnapshot.docs.length == 0) {
			rhit.newUser(uid);
		}
		querySnapshot.forEach((doc) => {
			rhit.userID = doc.id;
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
	let userRef = await firebase.firestore().collection(rhit.wkspConstants.USERS_REF_KEY);	
	userRef.add({
		uid: `${uid}`,
	}).then(doc => {
		console.log(`  NewUser: User doc created for ${uid}`);
		rhit.userID = doc.id;
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
	constructor(uid, wkspId, wkspData) {
		/*
		  Adding listeners to Workspace Page Buttons
		*/
		this.createListeners();
		this.manager = new rhit.WorkspaceManager(uid, wkspId, wkspData.members, wkspData.files);
		this.drawing = false;

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
			this.manager.saveOldFile().then(() => {
				document.querySelector(".wksp-blank-page").innerHTML = rhit.wkspConstants.TEXTAREA_HTML;
				let name = document.querySelector('#inputTxtName').value;
				// Create a new text file
				this.manager.createFile(rhit.FILE_TYPES.TEXT, name);
			});
			
		});

		// Create new canvas
		document.querySelector('#submitCreateCanvas').addEventListener('click', ()=> {
			// Save old file to database and storage
			this.manager.saveOldFile().then(() => {
				this.setCanvasHTML();
				let name = document.querySelector('#inputCanvasName').value;
				// Create a new canvas file
				this.manager.createFile(rhit.FILE_TYPES.CANVAS, name).then(() => {

				});
			});
		});
		document.querySelector("#wkspPDF").addEventListener('click', ()=> {
			this.manager.saveOldFile().then(() => {

			});
			document.querySelector(".wksp-blank-page").innerHTML = `${rhit.wkspConstants.PDF_HTML_START}
																	${rhit.wkspConstants.PDF_URL}
																	${rhit.wkspConstants.PDF_HTML_END}`;
		});
		document.querySelector("#submitCreateWksp").addEventListener('click', () => {
			let wkspName = document.querySelector("#inputWkspName").value;
			let wkspJoin = document.querySelector("#inputJoinCode").value;
			rhit.homePageManager.addWorkspace(wkspName, wkspJoin);
		})
		document.querySelector("#submitJoinWksp").addEventListener('click', () => {
			let joinCode = document.querySelector("#inputJoinCode2").value;
			rhit.homePageManager.joinWorkspace(joinCode);
		})
	}

	setCanvasHTML() {
		document.querySelector(".wksp-blank-page").innerHTML = `${rhit.wkspConstants.CANVAS_HTML}`;
		/**@type {HTMLCanvasElement} */
		let canvas = document.querySelector('#testCanvas');
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
		let canvas = document.querySelector('#testCanvas');
		if (!canvas.getContext) {
		console.log('Canvas not supported');
		return;
		}
		let context = canvas.getContext('2d');
		context.fillStyle = 'rgb(0, 0, 0)';
	
		context.beginPath();
		context.arc(x, y, 5, 0, Math.PI * 2, true);
		context.fill();
	}

	updateView() {

	}
}

rhit.WorkspaceManager = class {

	/**
	 *  
	 * @param {string} uid
	 * @param {string} wkspId
	 */
	constructor(uid, wkspId, members=[], fileNames=[]) {

		this._uid = uid;
		this._wkspId = wkspId;
		this._memberList = members;
		this._fileList = fileNames;
		
		/**@type {FileInfo} */
		this._fileInfo = null;
		this._unsubscribe;
		this._filesRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.FILES);
		this._wkspRef = firebase.firestore().collection(rhit.FB_COLLECTIONS.WKSP).doc(wkspId);
		this._storageRef = firebase.storage().ref();
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

			this._fileInfo = this._makeFileInfo(name, type, id, `${this._wkspId}/${name}`);
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
				case ('text'):
					let text = document.querySelector('#textFile').value;
					if (!text || text == '') {
						console.log('  SaveOldFile: There is no text to save');
						return;
					}
					file = this.createFileObj(text, this._fileInfo.name);
					break;
				case ('canvas'):
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

	beginListening(changeListener) {

		this._unsubscribe = this._ref.
			orderBy(''/**Order key */, 'desc')
			.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log('database update');
			changeListener();
		});
		
	}

}

/**
 * Gets necessary info for WorkspaceManager constructor
 * 
 */
 rhit.buildWorkspacePage = async function(wkspId) {
	 console.log('  BuildWorkspacePage: wkspid =', wkspId);
	 let wkspName
	firebase.firestore().collection(rhit.FB_WORKSPACE_COLLECTION).doc(wkspId).get()
	.then((doc) => {	
		console.log("  BuildWorkspacePage: doc.data() =", doc.data())
	});
	console.log("  BuildWorkspacePage: wkspName =", wkspName);
	// Next, use wkspId to query files to find which ones belong to wksp
	let files = [];
	firebase.firestore().collection(rhit.wkspConstants.FILES_REF_KEY).where("workspace", "==", `${wkspId}`).get()
		.then(querySnapshot => {
			querySnapshot.docs.forEach(doc => {
				files.push({name: doc.get('name'), ref: doc.get('ref'), type: doc.get('type')});
			});
		});

	// Rinse & repeat with users
	let members = [];
	firebase.firestore().collection(rhit.wkspConstants.USERS_REF_KEY).where(`wksp-${wkspName}`, `==`, `${wkspId}`).get()
		.then(querySnapshot => {
			querySnapshot.docs.forEach(doc => {
				members.push(doc.get('uid'));
			});
		});
	
	return {files: files, members: members}

}


/* Main */
/** function and class syntax examples */
rhit.main = async function () {
	console.log("Ready");

	/**
	 * Initialize firebase
	 */
	// var firebaseConfig = {
	// 	apiKey: 'AIzaSyCV2-UBsLgkCvlDLFqY-3OsSnZF_a5rfGo',
	// 	authDomain: 'pickens-thorp-squadm8-csse280.firebaseapp.com',
	// 	storageBucket: 'pickens-thorp-squadm8-csse280.appspot.com'
	// };
	// firebase.initializeApp(firebaseConfig);

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(async function() {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		let options = {};
		if (rhit.fbAuthManager.uid) {
			options.uid = rhit.fbAuthManager.uid;
		}		
		await rhit.initializePage(options);	
	});
};

rhit.main();
