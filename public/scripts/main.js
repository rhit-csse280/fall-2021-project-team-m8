/** namespace. */
var rhit = rhit || {};

rhit.fbAuthManager = null;

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.wkspConstants = {

	PDF_HTML_START: `<embed type="application/pdf" src="`,
	PDF_HTML_END: `" height="100%" width="100%">`,
	PDF_URL: `https://firebasestorage.googleapis.com/v0/b/pickens-thorp-squadm8-csse280.appspot.com/o/sat_score.pdf?alt=media&token=8eeb6335-d37c-431e-a57b-11cc8646386d`,
	TEXT_HTML_START: `<embed type="application/pdf" src="`,
	TEXT_HTML_END: `" height="100%" width="100%">`,
	TEXT_URL: `https://firebasestorage.googleapis.com/v0/b/pickens-thorp-squadm8-csse280.appspot.com/o/text.txt?alt=media&token=5242db20-af80-47e7-9e73-5a6a28693b24`,
	CANVAS_HTML: `<canvas id="testCanvas" height="100%" width="100%"><div>This browser does not support our canvas feature :( Most modern browsers (Chrome, Edge, Firefox) do support this.</div></canvas>`

}

// From stackoverflow
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.HomePageController = class {
	constructor() {
		document.querySelector("#navMessage").innerHTML = `Hey, ${rhit.fbAuthManager.uid}`;
		document.querySelector("#navLogOutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
		document.querySelector("#workspaceName").onclick = (event) => {
			window.location.href = "/workspace.html";
		}
	}
}

rhit.WorkspacePageController = class {
	constructor() {
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
			this.draw();

		});
		document.querySelector("#wkspPDF").addEventListener('click', ()=> {

			document.querySelector(".wksp-blank-page").innerHTML = `${rhit.wkspConstants.PDF_HTML_START}
																	${rhit.wkspConstants.PDF_URL}
																	${rhit.wkspConstants.PDF_HTML_END}`;

		});

		

	}

	draw() {

		/**
		 * This method will update the canvas if one exists.
		 * 
		 * Not all steps will necessarily occur in this method, but this
		 * is what must happen to let th euser draw:
		 * 
		 *  1. Make a canvas context object and set its color for drawing
		 * 
		 * 	2. Get cursor location (either directly from canvas or by
		 *     getting absolute position and calculating where that would
		 *     be on the canvas)
		 * 
		 *  3. Use context.arc(x, y, radius, startAngle, endAngle, counterclockwise (boolean))
		 *     to draw circle at cursor location
		 *     ex: context.arc(5, 5, 2, 0, Math.PI * 2, true);
		 * 
		 *  NOTE: This is just a very basic drawing function. Later versions will implement
		 *  options such as pen size, erasing (probably a context.clearRect()), and other color
		 *  options
		 * 
		 */

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
		context.fillStyle = 'rgb(128, 0, 0)';

		console.log('Canvas and context made');


		// Draw a ">" shape to demonstrate canvas
		// This will be removed once free drawing is implemented
		context.beginPath();
		for (let i = 0; i <= 30; i++) {			
				context.arc(i + 20, i + 20, 6, 0, Math.PI * 2, true);
		}
		console.log('First line finished');
		for (let i = 0; i < 30; i++) {			
			context.arc(50 - i, 50 + i, 6, 0, Math.PI * 2, true);
		}
		context.fill();

		console.log('Finished Drawing');

	}
}

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

	beginListening(changeListener) {
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

rhit.initializePage = function() {
	if (document.querySelector("#homePage")) {
		console.log("You are on the home page");
		new rhit.HomePageController();
	}

	if (document.querySelector("#workspacePage")) {
		console.log("You are on the workspace page");
		new rhit.WorkspacePageController();
	}

	if (document.querySelector("#landingPage")) {
		console.log("You are on the landing page");
		new rhit.LoginPageController();
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	})
};

rhit.main();
