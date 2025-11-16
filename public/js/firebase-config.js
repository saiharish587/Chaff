// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFpSCsDT4fe2sQWUx5OL84rLFTkoT5HUo",
  authDomain: "stubble-management-b1b52.firebaseapp.com",
  databaseURL: "https://stubble-management-b1b52-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stubble-management-b1b52",
  storageBucket: "stubble-management-b1b52.firebasestorage.app",
  messagingSenderId: "344933519470",
  appId: "1:344933519470:web:59dbcf41a80ef4e5ea167f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };