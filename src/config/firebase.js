import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyA2iR45KCut_-XQ0jmc5TcX7EGYntJqEMw",
  authDomain: "my-mf-app.firebaseapp.com",
  projectId: "my-mf-app",
  storageBucket: "my-mf-app.firebasestorage.app",
  messagingSenderId: "369699879780",
  appId: "1:369699879780:web:155bb2916c3a5db0fa9871",
  measurementId: "G-V27HKYY36P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Database Reference
export const db = getFirestore(app);
