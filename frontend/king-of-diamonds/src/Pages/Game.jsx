import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  initSocket,
  onEvent,
  offEvent,
  emitEvent,
  disconnectSocket,
} from "../socket";
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
            <li>Contestants chooses a number between 0 and 100.</li>
            <li>The result = average × 0.8</li>
            <li>
              The person whose number is the closest to that result is the
              winner.🏆
            </li>
            <li>Others lose a point</li>
            <li>GAME OVER for the player who reaches -10 points</li>
            <li>GAME CLEAR for the last remaining player</li>
          </ul>
          <p>Round 1 starts in: {roundTime}s</p>
        </div>
      ) : interRoundTime > 0 ? (
        /* ===== INTER-ROUND ===== */
        <div className="inter-round">
          <div className="round-header">
            <h2>Round {currentRound}</h2>
            {!gameClearWinner && (
              <div className="round-timer">{interRoundTime}s</div>
            )}
          </div>
          {gameClearWinner ? (
            <p>
              🎉 GAME CLEAR! Winner is <strong>{gameClearWinner}</strong>
            </p>
          ) : (
            <p></p>
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
          <div className="round-header">
            <h2>Round {currentRound}</h2>
            {!isEliminated && <div className="round-timer">{roundTime}s</div>}
          </div>

          {isEliminated && (
            <p style={{ color: "red" }}>
              ❌ You are eliminated. Spectating only.
            </p>
          )}

          <div className="chosen-panel">
            <div className="chosen-number">
              {chosenNumber !== null ? chosenNumber : ""}
            </div>
          </div>

          {!isEliminated && (
            <div className="number-selection">
              {/* First row: only 0 at rightmost */}
              <div className="row first-row">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="empty"></div>
                ))}
                <button
                  className={chosenNumber === 0 ? "selected" : ""}
                  onClick={() => handlePickNumber(0)}
                >
                  0
                </button>
              </div>

              {/* Remaining numbers 1–100 */}
              <div className="grid-numbers">
                {[...Array(100).keys()]
                  .map((n) => n + 1)
                  .map((num) => (
                    <button
                      key={num}
                      className={chosenNumber === num ? "selected" : ""}
                      onClick={() => handlePickNumber(num)}
                    >
                      {num}
                    </button>
                  ))}
              </div>
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
