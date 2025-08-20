import React from "react";
import "../styles/Dashboard.css";

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard">
      {/* Main content */}
      <div className="main-content">
        <h1>Dashboard</h1>
        <div className="actions">
          <button className="action-btn">Create Room</button>
          <button className="action-btn">Join Room</button>
        </div>
      </div>

      {/* Side panel */}
      <div className="side-panel">
        <img src={user.photoURL} alt="Profile" />
        <h3>{user.displayName}</h3>
        <p>Score: {user.score}</p>
        <p>Games Played: {user.gamesPlayed}</p>
        <p>Last Login: {user.lastLogin || "N/A"}</p>
         <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
