

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
	USERS_REF_KEY: "Users"

}

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
		await rhit.buildHomePage(options.uid)
		new rhit.HomePageController();
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

/**
 * Process for loading Home:
 * 
 * 1. Fetch User info from firebase
 * 
 * 2. Build HTML list items for user's workspaces
 *    (MAKE SURE TO INCLUDE IDENTIFIER & LISTENER)
 *    (This will be done in buildHomePage)
 * 
 * 3. Add listeners to create/join/menu buttons
 *    (This can be done in page controller)
 */
rhit.HomePageController = class {
	constructor(uid) {
		document.querySelector("#navMessage").innerHTML = `Hey, ${rhit.fbAuthManager.uid}`;
		document.querySelector("#navLogOutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
		document.querySelector("#workspaceName").onclick = (event) => {
			window.location.href = "/workspace.html";
		}
	}
}

rhit.HomePageManager = class {

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
	let userRef = await firebase.firestore().collection(this.wkspConstants.USERS_REF_KEY).where(`uid`, `==`, `${uid}`);
	if (userRef.empty) {
		console.log(`  BuildHomePage: No user found. Creating user`)
		await rhit.newUser(user);
		userRef = await firebase.firestore().collection(this.wkspConstants.USERS_REF_KEY).where(`uid`, `==`, `${uid}`);
	}

	// Get list of workspaces & convert to display names
	let userEntries = userRef.docs;
	let userData;

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

/**
 * Process for loading workspace:
 * 
 * ASYNC STUFF:
 * 1. Fetch workspace files/members
 * 
 * 2. Build lists for files/members
 * 
 * 3. Fetch and load top file
 * 
 * NON ASYNC:
 * 1. Add menu/new file listeners
 * 
 * 2. Store firebase & storage root refs
 * 
 * 3.
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
			document.querySelector(".wksp-blank-page").innerHTML = `${rhit.wkspConstants.TEXT_HTML_START}
																	${rhit.wkspConstants.TEXT_URL}
																	${rhit.wkspConstants.TEXT_HTML_END}`;
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

// From stackoverflow ->
function fitToContainer(canvas){
	// Make it visually fill the positioned parent
	canvas.style.width ='100%';
	canvas.style.height='100%';
	// ...then set the internal size to match
	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
}

rhit.WorkspaceManager = class {


	/**
	 *  
	 * @param {string} uid
	 */
	constructor(uid) {

		this._uid = uid;
		
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

	
	let userDocSnapshot = await firebase.firestore().collection(rhit.wkspConstants.USERS_REF_KEY).where("uid", "==", `${uid}`).get();
	if (userDocSnapshot.empty) {
		console.log(`  BuildWorkspacePage: User query returned empty -> Make document for user ${uid}`);
		return;
	}

	if (!userDocSnapshot.data().get(`wksp-${wkspName}`)) {
		console.log(`  BuildWorkspacePage: Workspace 'wksp-${wkspName}' does not exist`);
		return;
	}

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
