import React, { useState } from "react";

const CreateGameDialog = ({ onClose, onCreate }) => {
  const [hostName, setHostName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!hostName.trim()) {
      setError("Host name is required");
      return;
    }
    if (!roomId.trim()) {
      setError("Room ID is required");
      return;
    }
    setError("");
    onCreate({ hostName, roomId });
  };

  // Close if clicking on backdrop (outside dialog)
  const handleBackdropClick = (e) => {
    if (e.target.className === "dialog-backdrop") {
      onClose();
    }
  };

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div className="dialog">
        <h2>Create Game</h2>

        {/* Host Name Input */}
        <input
          type="text"
          placeholder="Enter Your Name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />

        {/* Room ID Input */}
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={handleCreate}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CreateGameDialog;
