import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Error from "../components/Error";

const JoinGame = ({ onClose, onJoin }) => {
  const [roomCode, setRoomCode] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Listen to rooms where status === 'waiting'
    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map((doc) => ({
        roomId: doc.id,
        ...doc.data(),
      }));
      setAvailableRooms(rooms);
    });

    return () => unsubscribe();
  }, []);

const handleJoin = async (code) => {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    setError("Enter a Room Code or select a room");
    return;
  }

  const res = await onJoin(trimmedCode);

  if (res?.error) {
    setError(res.error);
  } else {
    setError("");
    // proceed if success
  }
};


  const handleBackdropClick = (e) => {
    if (e.target.className === "dialog-backdrop") onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div className="dialog">
        <h2>Join Game</h2>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <ul>
          {availableRooms.map((room) => (
            <li key={room.roomId}>
              {room.roomCode} ({room.players?.length || 0}/7)
              <button onClick={() => handleJoin(room.roomCode)}>Join</button>
            </li>
          ))}
        </ul>
        {error && <p className="error">{error}</p>}

        <button onClick={() => handleJoin(roomCode)}>Join</button>
        <button onClick={onClose}>Cancel</button>
      </div>
      {error && <Error message={error} onClose={() => setError("")} />}
    </div>
  );
};

export default JoinGame;
