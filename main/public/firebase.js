// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNknE77_Jr5SYciJ-lHDZ3gEpl_ORWtDI",
  authDomain: "chat-app-a52d5.firebaseapp.com",
  projectId: "chat-app-a52d5",
  storageBucket: "chat-app-a52d5.appspot.com",
  messagingSenderId: "646452076642",
  appId: "1:646452076642:web:d3e6ac86762583157bf13b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);