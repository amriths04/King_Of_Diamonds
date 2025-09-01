import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import * as roomService from "../services/roomService";
import CreateGameDialog from "../components/CreateGame";
import JoinGameDialog from "../components/JoinGame";

export default function Dashboard({ user, onLogout }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const navigate = useNavigate();

  // ✅ Create Room Handler
  const handleCreate = async (roomCode) => {
    try {
      const response = await roomService.createRoom({
  hostId: user?.uid,
  hostName: user?.displayName,
  roomCode,
});


      console.log("✅ Room created:", response);
      setShowCreateDialog(false);

      navigate("/lobby", { state: { roomCode: response.roomCode, roomId: response.roomId, userId: user.uid } });
    } catch (err) {
      console.error("❌ Error creating room:", err.message);
      alert(err.message);
    }
  };

  // ✅ Join Room Handler
const handleJoin = async (roomCode) => {
  const response = await roomService.joinRoom({
    roomCode,
    userId: user?.uid,
    userName: user?.displayName,
  });

  if (response?.error) {
    return response;  
  }

  console.log("✅ Joined room:", response);
  setShowJoinDialog(false);

  navigate("/lobby", {
    state: {
      roomCode: response.roomCode,
      roomId: response.roomId,
      userId: user.uid,
    },
  });

  return response;
};

  return (
    <div className="dashboard">
      {/* Main content */}
      <div className="main-content">
        <h1>Dashboard</h1>
        <div className="actions">
          <button className="action-btn" onClick={() => setShowCreateDialog(true)}>
            Create Room
          </button>
          <button className="action-btn" onClick={() => setShowJoinDialog(true)}>
            Join Room
          </button>
        </div>
      </div>

      {/* Side panel */}
      <div className="side-panel">
        <img src={user?.photoURL} alt="Profile" />
        <h3>{user?.displayName}</h3>
        <p>Score: {user?.score ?? 0}</p>
        <p>Games Played: {user?.gamesPlayed ?? 0}</p>
        <p>Last Login: {user?.lastLogin || "N/A"}</p>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
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
          availableRooms={[]} // TODO: later fetch from backend
        />
      )}
    </div>
  );
}
