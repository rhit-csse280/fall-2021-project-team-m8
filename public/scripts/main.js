

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

rhit.WKSP_KEY_NAME = "name"
rhit.WKSP_KEY_JOINCODE = "join";
rhit.FB_WORKSPACE_COLLECTION = "Workspaces"
rhit.FB_USERS_COLLECTION = "Users"
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
		console.log("You are on the workspace page");
		await rhit.buildWorkspacePage(options.uid);
		new rhit.WorkspacePageController();
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
	// Get a user reference to loop through for workspaces
	let userData = [];
	await firebase.firestore().collection(this.wkspConstants.USERS_REF_KEY).where(`uid`, `==`, `${uid}`).get()
	.then((querySnapshot) => {
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
	// if (userRef.empty) {
	// 	console.log(`  BuildHomePage: No user found. Creating user`)
	// 	await rhit.newUser(user);
	// 	userRef = await firebase.firestore().collection(this.wkspConstants.USERS_REF_KEY).where(`uid`, `==`, `${uid}`);
	// }

	// Get list of workspaces & convert to display names
	
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
	
	let wkspName = `${uid}s-workspace`;
	let wkspId;
	let wkspRef = await firebase.firestore().collection(rhit.wkspConstants.WORKSPACES_REF_KEY);
	wkspRef.add({
		name: wkspName
	}).then(doc => {
		console.log(`  NewUser: Workspace created for ${uid}`)
		wkspId = doc.id;

	});

	let userRef = await firebase.firestore().collection(rhit.wkspConstants.USERS_REF_KEY);	
	userRef.add({
		uid: `${uid}`,
		[`wksp-${uid}s-workspace`]: wkspId
	}).then(doc => {
		console.log(`  NewUser: User doc created for ${uid}`);
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
	 * @param {boolean} newSpace
	 * @param {string} uid
	 * @param {string} wksp
	 */
	constructor(newSpace, uid, wksp) {
		/*
		  Adding listeners to Workspace Page Buttons
		*/
		this.createListeners();
		this.manager = new rhit.WorkspaceManager(newSpace, uid, wksp);

	}

	createListeners() {
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
		document.querySelector("#wkspText").addEventListener('click', ()=> {
			document.querySelector(".wksp-blank-page").innerHTML = rhit.wkspConstants.TEXTAREA_HTML;
		});
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
		document.querySelector("#wkspPDF").addEventListener('click', ()=> {
			document.querySelector(".wksp-blank-page").innerHTML = `${rhit.wkspConstants.PDF_HTML_START}
																	${rhit.wkspConstants.PDF_URL}
																	${rhit.wkspConstants.PDF_HTML_END}`;
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
	
		console.log('Canvas and context made');
	
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
	 * @param {boolean} newSpace 
	 * @param {string} uid
	 */
	constructor(newSpace, uid) {

		this._uid = uid;
		this._unsubscribe;
		this._fileDocumentSnapshots;
		this._memberList;
		this._filesRef = firebase.firestore().collection('Files');
		this._wksp = firebase.firestore().collection('Workspaces').doc()
		if (newSpace) {
			this._createNewWorkspace(this._ref, this.uid).then(refs => {

				let files = [];
				let members = [this.uid];


			});
			// Still need to assign stuff
		} else {
			
			
			
		}
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

	// Saves the current file to storage
	async saveFile(type, fileData) {
		let path = `${this.wkspId}/${this._currentFileName}`;
		let fileRef = await this._storageRef.child(path);
		if (type == 'text') {
			this._file = await this.createFileObj(fileData.content, fileData.name);
		}
		fileRef.put(this._file).then(snapshot => {
		console.log(`  SaveFile: File saved at ${path}`);
		});
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
 * @param {string} uid
 * @param {string} wkspName
 */
 rhit.buildWorkspacePage = async function(uid, wkspName) {

	
	let userDocSnapshot = await firebase.firestore().collection(rhit.wkspConstants.USERS_REF_KEY).where("uid", "==", `${uid}`).get()
	if (userDocSnapshot.empty) {
		console.log(`  BuildWorkspacePage: User query returned empty -> Make document for user ${uid}`);
		return;
	}

	// if (!userDocSnapshot.get(`wksp-${wkspName}`)) {
	// 	console.log(`  BuildWorkspacePage: Workspace 'wksp-${wkspName}' does not exist`);
	// 	return;
	// }

}


/* Main */
/** function and class syntax examples */
rhit.main = function () {
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
