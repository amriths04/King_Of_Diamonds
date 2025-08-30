import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../styles/Game.css";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export default function Game({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId, userId } = location.state || {};

  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [chosenNumber, setChosenNumber] = useState(null);
  const [roundTime, setRoundTime] = useState(30);
  const [interRoundTime, setInterRoundTime] = useState(0);
  const [submissions, setSubmissions] = useState({});
  const [target, setTarget] = useState(0);
  const [winners, setWinners] = useState([]);

  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [gameClearWinner, setGameClearWinner] = useState(null);

  useEffect(() => {
    if (!roomId || !userId) navigate("/");

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit("joinGameRoom", {
      roomId,
      userId,
      name: user?.displayName,
      photoURL: user?.photoURL,
    });

    newSocket.on("joinedRoom", (room) => {
      setPlayers(room.players);
      setScores(room.scores);
      setCurrentRound(room.currentRound);
    });

    // Round ends → inter-round
    newSocket.on("roundResult", ({ submissions, target, winners, scores }) => {
   setSubmissions(submissions);
   setTarget(target);
   setWinners(winners);   // now an array
   setScores(scores);
   setInterRoundTime(30); // start inter-round timer
 });

    // Inter-round countdown
    newSocket.on("interRoundTimer", (time) => setInterRoundTime(time));

    // New round starts
    newSocket.on("newRound", (roundNum) => {
      setCurrentRound(roundNum);
      setChosenNumber(null);
      setSubmissions({});
      setTarget(0);
      setWinners([]);
      setRoundTime(30);
    });

    // 🚨 Player eliminated
    newSocket.on("playerEliminated", ({ playerId }) => {
      setEliminatedPlayers((prev) => [...prev, playerId]);
    });

    // 🏆 Game clear
    newSocket.on("gameClear", ({ winner }) => {
      setGameClearWinner(winner);
      setInterRoundTime(9999); // freeze inter-round
    });

    return () => newSocket.disconnect();
  }, [roomId, userId, navigate]);

  // Countdown for active round
  useEffect(() => {
    if (!socket) return;

    socket.on("roundTimer", (time) => {
      setRoundTime(time);

      if (time === 0) {
        const finalChoice = chosenNumber ?? 0;
        console.log("⏰ Server says round ended, submitting:", finalChoice);

        socket.emit("submitNumber", { roomId, userId, number: finalChoice });
      }
    });

    return () => socket.off("roundTimer");
  }, [socket, chosenNumber, roomId, userId]);

  const handlePickNumber = (num) => setChosenNumber(num);

  const isEliminated = eliminatedPlayers.includes(userId);

  return (
    <div className="game-container">
      <h2>Round {currentRound}</h2>

      {interRoundTime > 0 ? (
        <div className="inter-round">
          <h3>Inter-round</h3>
          {gameClearWinner ? (
            <p>
              🎉 GAME CLEAR! Winner is <strong>{gameClearWinner}</strong>
            </p>
          ) : (
            <p>Next round starts in: {interRoundTime}s</p>
          )}

          <div className="results">
            <h4>Submissions</h4>
            <ul>
              {players.map((p) => {
                const isSelf = p.userId === userId;

                return (
                  <li key={p.userId} className="player-item">
                    {/* Avatar Circle */}
                    <div
                      className={`avatar-circle ${isSelf ? "self" : "other"}`}
                    >
                      👤
                    </div>

                    {/* Name + Score/Submission */}
                    <div className="player-info">
                      <span className={isSelf ? "self-name" : ""}>
                        {p.name ?? p.userId}
                      </span>
                      : {submissions[p.userId] ?? 0}
                      {winners?.includes(p.userId) && <span> 🏆</span>}
                      {eliminatedPlayers.includes(p.userId) && (
                        <span style={{ color: "red" }}> ❌ Eliminated</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p>Target (avg * 0.8): {target.toFixed(2)}</p>
          </div>
        </div>
      ) : (
        <div className="round">
          {isEliminated ? (
            <p style={{ color: "red" }}>
              ❌ You are eliminated. Spectating only.
            </p>
          ) : (
            <p>Time remaining: {roundTime}s</p>
          )}

          <div className="chosen-panel">
            {chosenNumber !== null ? (
              <p>
                <strong>Chosen Number:</strong> {chosenNumber}
              </p>
            ) : (
              <p>No number chosen yet</p>
            )}
          </div>

          {/* ✅ Number selection disabled if eliminated */}
          {!isEliminated && (
            <div className="number-selection">
              {[...Array(101).keys()].map((n) => (
                <button
                  key={n}
                  className={chosenNumber === n ? "selected" : ""}
                  onClick={() => handlePickNumber(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="scores">
        <h4>Live Scores</h4>
        <ul>
          {players.map((p) => {
            const isSelf = p.userId === userId;

            return (
              <li key={p.userId} className="player-item">
                {/* Avatar Circle */}
                <div className={`avatar-circle ${isSelf ? "self" : "other"}`}>
                  👤
                </div>

                {/* Name + Score/Submission */}
                <div className="player-info">
                  <span className={isSelf ? "self-name" : ""}>
                    {p.name ?? p.userId}
                  </span>
                  : {scores[p.userId] ?? 0}
                  {winners?.includes(p.userId) && <span> 🏆</span>}
                  {eliminatedPlayers.includes(p.userId) && (
                    <span style={{ color: "red" }}> ❌ Eliminated</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
