// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZzMmW2XpB2nnjgMGkzboIXlXAgBES21A",
  authDomain: "react-native-crud-d7da6.firebaseapp.com",
  projectId: "react-native-crud-d7da6",
  storageBucket: "react-native-crud-d7da6.firebasestorage.app",
  messagingSenderId: "372097480948",
  appId: "1:372097480948:web:69f3358c6a4146fc28c6a1",
  measurementId: "G-R9PH0R89GE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);