window.MONARCH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAz84Y195geEpIEpW5rBKVoNsxUw6Lkz1M",
  authDomain: "carbonmonarch1.firebaseapp.com",
  projectId: "carbonmonarch1",
  storageBucket: "carbonmonarch1.firebasestorage.app",
  messagingSenderId: "310372940660",
  appId: "1:310372940660:web:978098b69c9a4d96ab4a21"
};

(function () {
  if (!window.firebase || !window.MONARCH_FIREBASE_CONFIG) return;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.MONARCH_FIREBASE_CONFIG);
  }
  window.MONARCH_FIREBASE = {
    app: firebase.app(),
    auth: firebase.auth(),
    db: firebase.firestore(),
    googleProvider: new firebase.auth.GoogleAuthProvider()
  };
})();
