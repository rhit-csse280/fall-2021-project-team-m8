/**
 * This is not a permanent module, but a space for my code to go to
 * prevent merge conflicts while we are both working on the same files
 */


/**
 * Firebase Storage template methods
 */



// Set the configuration for your app
// TODO: Replace with your app's config object
var firebaseConfig = {
    apiKey: 'AIzaSyCV2-UBsLgkCvlDLFqY-3OsSnZF_a5rfGo',
    authDomain: 'pickens-thorp-squadm8-csse280.firebaseapp.com',
    databaseURL: 'gs://pickens-thorp-squadm8-csse280.appspot.com',
    storageBucket: 'pickens-thorp-squadm8-csse280.appspot.com'
  };
firebase.initializeApp(firebaseConfig);

  // Get a reference to the storage service, which is used to create references in your storage bucket
var storage = firebase.storage();