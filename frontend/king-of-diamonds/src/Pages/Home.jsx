import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import "../styles/Home.css";

export default function Home({ user, onLogin }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      provider.setCustomParameters({ prompt: "select_account" }); // always ask for account
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Reference to the user document in Firestore
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      let userData;

      if (userSnap.exists()) {
        // Format lastLogin timestamp
        const lastLoginTimestamp = userSnap.data().lastLogin;
        const formattedLastLogin = lastLoginTimestamp instanceof Timestamp
          ? lastLoginTimestamp.toDate().toLocaleString()
          : new Date().toLocaleString();

        // User exists, fetch data
        userData = {
          displayName: userSnap.data().displayName,
          email: userSnap.data().email,
          photoURL: userSnap.data().photoURL,
          uid: firebaseUser.uid,
          score: userSnap.data().score,
          gamesPlayed: userSnap.data().gamesPlayed,
          lastLogin: formattedLastLogin,
        };

        // Update last login timestamp
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      } else {
        const now = new Date().toLocaleString();
        userData = {
          displayName: firebaseUser.displayName || "New Player",
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || "https://via.placeholder.com/80",
          uid: firebaseUser.uid,
          score: 0,
          gamesPlayed: 0,
          lastLogin: now,
        };

        await setDoc(userRef, userData);
      }

      // Save to state and localStorage
      onLogin(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/dashboard");
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="Home">
      <h1 className="home-heading">King of Diamonds 👑</h1>
      <button
        className="google-btn"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <img
          src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
          alt="Google logo"
          style={{ marginRight: "8px", width: "20px", height: "20px" }}
        />
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}
