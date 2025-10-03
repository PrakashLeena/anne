// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCK6iyUd3vpxbFE96CH7exL0JxtbnDM6vw",
  authDomain: "anne-9782a.firebaseapp.com",
  projectId: "anne-9782a",
  storageBucket: "anne-9782a.firebasestorage.app",
  messagingSenderId: "299436937995",
  appId: "1:299436937995:web:8299e587d5790250fc880e",
  measurementId: "G-76KK78QL6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

export { auth, storage };
export default auth;
