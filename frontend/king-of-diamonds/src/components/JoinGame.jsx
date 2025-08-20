import React, { useState } from "react";

const JoinGameDialog = ({ onClose, onJoin, availableRooms = [] }) => {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    if (!roomId) {
      setError("Enter a Room ID or select a room");
      return;
    }
    setError("");
    onJoin(roomId);
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
        <h2>Join Game</h2>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <ul>
          {availableRooms.map((room) => (
            <li key={room._id}>
              {room.name || room._id} ({room.players.length} players)
              <button onClick={() => onJoin(room._id)}>Join</button>
            </li>
          ))}
        </ul>
        {error && <p className="error">{error}</p>}
        <button onClick={handleJoin}>Join</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default JoinGameDialog;
