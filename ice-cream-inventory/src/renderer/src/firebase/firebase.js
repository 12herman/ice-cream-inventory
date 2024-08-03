// Import the functions you need from the SDKs you need
import {  initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import {getFirestore} from 'firebase/firestore'
import {getAuth,signInAnonymously} from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4421fNIdnBVrRKoZUKMeToywNCR5eL5I",
  authDomain: "ice-cream-inventory-abfbe.firebaseapp.com",
  projectId: "ice-cream-inventory-abfbe",
  storageBucket: "ice-cream-inventory-abfbe.appspot.com",
  messagingSenderId: "835430835315",
  appId: "1:835430835315:web:06390a92b61d75df907606",
  measurementId: "G-F9FT6DV4X7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const auth = getAuth();
signInAnonymously(auth).catch((error) => {
    console.error('Authentication error:', error);
  });
// const analytics = getAnalytics(app);
export const db = getFirestore(app);