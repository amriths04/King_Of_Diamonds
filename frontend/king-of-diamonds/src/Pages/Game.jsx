import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {initSocket,onEvent,offEvent,emitEvent,disconnectSocket} from "../socket";
import "../styles/Game.css";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export default function Game({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId, userId } = location.state || {};

  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [currentRound, setCurrentRound] = useState(0);
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

    const socket = initSocket(SOCKET_URL, {
      roomId,
      userId,
      name: user?.displayName,
      photoURL: user?.photoURL,
    });

    onEvent("infoRoundTimer", setRoundTime);

    onEvent("joinedRoom", (room) => {
      setPlayers(room.players);
      setScores(room.scores);
      setCurrentRound(room.currentRound);
    });

    onEvent("roundResult", ({ submissions, target, winners, scores }) => {
      setSubmissions(submissions);
      setTarget(target);
      setWinners(winners);
      setScores(scores);
      setInterRoundTime(20);
    });

    onEvent("interRoundTimer", setInterRoundTime);

    onEvent("newRound", (roundNum) => {
      setCurrentRound(roundNum);
      setChosenNumber(null);
      setSubmissions({});
      setTarget(0);
      setWinners([]);
      setRoundTime(20);
    });

    onEvent("playerEliminated", ({ playerId }) => {
      setEliminatedPlayers((prev) => [...prev, playerId]);
    });

    onEvent("gameClear", ({ winner }) => {
      setGameClearWinner(winner);
      setInterRoundTime(9999);
    });

    return () => {
      offEvent("infoRoundTimer");
      disconnectSocket();
    };
  }, [roomId, userId, navigate, user]);

  // Round timer + auto-submit
  useEffect(() => {
    onEvent("roundTimer", (time) => {
      setRoundTime(time);

      if (time === 0) {
        const finalChoice = chosenNumber ?? 0;
        emitEvent("submitNumber", { roomId, userId, number: finalChoice });
      }
    });

    return () => offEvent("roundTimer");
  }, [chosenNumber, roomId, userId]);

  const handlePickNumber = (num) => setChosenNumber(num);

  const isEliminated = eliminatedPlayers.includes(userId);

  return (
    <div className="game-container">
      {/* ===== ROUND 0 → RULES SCREEN ===== */}
      {currentRound === 0 ? (
        <div className="rules-screen">
          <h2>📜 Game Rules</h2>
          <ul>
            <li>Each player picks a number between 0–100.</li>
            <li>The target = average × 0.8</li>
            <li>Closest player(s) win 🏆</li>
            <li>Others lose -1 point</li>
            <li>At -10 points → ❌ eliminated</li>
            <li>If all submit 0 → everyone gets -1</li>
          </ul>
          <p>Round 1 starts in: {roundTime}s</p>
        </div>
      ) : interRoundTime > 0 ? (
        /* ===== INTER-ROUND ===== */
        <div className="inter-round">
          <h2>Round {currentRound}</h2>
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
                    <div
                      className={`avatar-circle ${isSelf ? "self" : "other"}`}
                    >
                      👤
                    </div>
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
        /* ===== ACTIVE ROUND ===== */
        <div className="round">
          <h2>Round {currentRound}</h2>
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

      {/* ===== LIVE SCORES ===== */}
      <div className="scores">
        <h4>Live Scores</h4>
        <ul>
          {players.map((p) => {
            const isSelf = p.userId === userId;
            return (
              <li key={p.userId} className="player-item">
                <div className={`avatar-circle ${isSelf ? "self" : "other"}`}>
                  👤
                </div>
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
