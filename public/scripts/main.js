/** namespace. */
var rhit = rhit || {};

rhit.fbAuthManager = null;

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

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
