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
    apiKey: '<your-api-key>',
    authDomain: '<your-auth-domain>',
    databaseURL: 'gs://pickens-thorp-squadm8-csse280.appspot.com',
    storageBucket: 'gs://pickens-thorp-squadm8-csse280.appspot.com'
  };
  firebase.initializeApp(firebaseConfig);
  
  // Get a reference to the storage service, which is used to create references in your storage bucket
  var storage = firebase.storage();