import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import "../styles/Lobby.css";

export default function Lobby({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode: stateRoomCode, roomId: stateRoomId, userId } = location.state || {};
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);
  const [status, setStatus] = useState("waiting");

  // Redirect if missing roomId or userId
  useEffect(() => {
    if (!stateRoomCode || !stateRoomId || !userId) {
      navigate("/");
      return;
    }

    const roomRef = doc(db, "rooms", stateRoomId);

    const unsub = onSnapshot(roomRef, async (snapshot) => {
      if (!snapshot.exists()) {
        alert("Room was deleted.");
        navigate("/");
        return;
      }

      const data = snapshot.data();

      const updatedPlayers = await Promise.all(
        (data.players || []).map(async (p) => {
          if (!p.name) {
            try {
              const userSnap = await getDoc(doc(db, "users", p.userId));
              return { ...p, name: userSnap.exists() ? userSnap.data().displayName : "Unknown" };
            } catch {
              return { ...p, name: "Unknown" };
            }
          }
          return p;
        })
      );

      setPlayers(updatedPlayers);
      setHostId(data.hostId);
      setStatus(data.status || "waiting");

      // Navigate all players when host starts the game
      if (data.status === "started") {
        navigate("/game", { state: { roomId: stateRoomId, userId } });
      }
    });

    return () => unsub();
  }, [stateRoomCode, stateRoomId, userId, navigate]);

  // Handle leaving the room
  const handleLeave = async () => {
    if (!stateRoomId || !userId) return;

    try {
      const roomRef = doc(db, "rooms", stateRoomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;

      const roomData = roomSnap.data();
      if (roomData.hostId === userId) await deleteDoc(roomRef);
      else {
        const updatedPlayers = (roomData.players || []).filter(p => p.userId !== userId);
        await updateDoc(roomRef, { players: updatedPlayers });
      }
    } catch (err) {
      console.error(err);
    } finally {
      navigate("/");
    }
  };

  // Handle starting the game (only host)
  const handleStartGame = async () => {
    try {
      const roomRef = doc(db, "rooms", stateRoomId);
      await updateDoc(roomRef, { status: "started" });

      // Backend socket will create a game room when host emits joinGameRoom
      // All clients navigate automatically via Firestore listener above
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h2>Lobby</h2>
        <div className="room-code-wrapper">
          <span className="room-label">Room Code:</span>
          <span className="room-code">{stateRoomCode}</span>
        </div>
      </div>

      <p><strong>Host ID:</strong> {hostId}</p>
      <p><strong>Status:</strong> {status}</p>

      <div>
        <button className="leave-btn" onClick={handleLeave}>Leave Lobby</button>
        {userId === hostId && status === "waiting" && (
          <button className="start-btn" onClick={handleStartGame}>Start Game</button>
        )}
      </div>

      <div className="players-list">
        <h3>Players</h3>
        {players.length ? (
          <ul>
            {players.map(p => (
              <li key={p.userId}>
                <div className="player-avatar">
                  {p.name ? p.name.charAt(0).toUpperCase() : "?"}
                </div>
                <span>{p.name}</span>
                {p.userId === hostId && <span className="host-badge">(Host)</span>}
              </li>
            ))}
          </ul>
        ) : <p>No players yet...</p>}
      </div>
    </div>
  );
}
