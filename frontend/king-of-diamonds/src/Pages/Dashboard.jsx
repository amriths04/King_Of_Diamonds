import React, { useState } from "react";
import "../styles/Dashboard.css";
import CreateGameDialog from "../components/CreateGame";
import JoinGameDialog from "../components/JoinGame";

export default function Dashboard({ user, onLogout }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const handleCreate = (data) => {
    console.log("Creating game with:", data);
    setShowCreateDialog(false);
    // Call backend API here
  };

  const handleJoin = (roomId) => {
    console.log("Joining room:", roomId);
    setShowJoinDialog(false);
    // Call backend API here
  };

  return (
    <div className="dashboard">
      {/* Main content */}
      <div className="main-content">
        <h1>Dashboard</h1>
        <div className="actions">
          <button
            className="action-btn"
            onClick={() => setShowCreateDialog(true)}
          >
            Create Room
          </button>
          <button
            className="action-btn"
            onClick={() => setShowJoinDialog(true)}
          >
            Join Room
          </button>
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

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateGameDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreate}
        />
      )}
      {showJoinDialog && (
        <JoinGameDialog
          onClose={() => setShowJoinDialog(false)}
          onJoin={handleJoin}
          availableRooms={[]} // pass real rooms if available
        />
      )}
    </div>
  );
}
