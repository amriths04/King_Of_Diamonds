import React, { useState } from "react";

const CreateGameDialog = ({ onClose, onCreate }) => {
  const [roomCode, setRoomCode] = useState(""); 
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!roomCode.trim()) {
      setError("Room Code is required");
      return;
    }
    setError("");

    // Pass roomCode, Lobby will handle Firestore ID
    onCreate(roomCode.trim());
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === "dialog-backdrop") onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div className="dialog">
        <h2>Create Game</h2>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        {error && <p className="error">{error}</p>}

        <button onClick={handleCreate}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CreateGameDialog;
