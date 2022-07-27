import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyBLYgLHpGGz4sEr7YzycLc5FVFJib-TCao",
  authDomain: "rhythm-b3836.firebaseapp.com",
  databaseURL: "https://rhythm-b3836-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rhythm-b3836",
  storageBucket: "rhythm-b3836.appspot.com",
  messagingSenderId: "181354076292",
  appId: "1:181354076292:web:2c0feaef87c935edca8ad1",
  measurementId: "G-Q0ZMNJ7662"
};
const firebaseApp = initializeApp(firebaseConfig)
export const db = getDatabase(firebaseApp);
export const auth = getAuth(firebaseApp);