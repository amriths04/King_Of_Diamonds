// Import only what you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAazlO07kJzNmAP55lqWwGCR5YC7u3DWb4",
  authDomain: "king-of-diamonds-1d414.firebaseapp.com",
  projectId: "king-of-diamonds-1d414",
  storageBucket: "king-of-diamonds-1d414.firebasestorage.app",
  messagingSenderId: "1058771918122",
  appId: "1:1058771918122:web:1c0706e0e24bfaf68e9253",
  measurementId: "G-ZZBBSD5PJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Export for use in frontend
export { auth, provider, db };
