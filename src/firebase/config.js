import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2-1wzAbQK9J-TuK_QPKuvrR1smH9GYig",
  authDomain: "expenses-584e7.firebaseapp.com",
  projectId: "expenses-584e7",
  storageBucket: "expenses-584e7.firebasestorage.app",
  messagingSenderId: "514015416469",
  appId: "1:514015416469:web:020e64907a09f199d28b9c",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
