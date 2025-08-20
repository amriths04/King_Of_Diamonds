// Import only what you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5NRA9npkrer3eVaaZtb2gRywzg9suWRY",
  authDomain: "king-of-diamonds-1d414.firebaseapp.com",
  projectId: "king-of-diamonds-1d414",
  storageBucket: "king-of-diamonds-1d414.firebasestorage.app",
  messagingSenderId: "1058771918122",
  appId: "1:1058771918122:web:8a1b7b007f8a43168e9253",
  measurementId: "G-1N83X7P357"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Export for use in frontend
export { auth, provider, db };
