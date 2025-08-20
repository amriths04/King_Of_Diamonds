import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import "../styles/Home.css";

export default function Home({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleGoogleLogin = async () => {
  try {
    setLoading(true);

    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Save to state and localStorage
    onLogin(user);
    localStorage.setItem(
      "user",
      JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
      })
    );

    navigate("/dashboard");
  } catch (error) {
    console.error("Error during login:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="Home">
      <h1 className="home-heading">King of Diamonds 👑</h1>
      <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
        <img
          src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
          alt="Google logo"
          className="google-icon"
          style={{ marginRight: "8px", width: "20px", height: "20px" }}
        />
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}
