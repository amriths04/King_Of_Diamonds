import express from "express";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  cancelCountdown,
} from "../controllers/roomController.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { hostId, roomCode } = req.body;11
    const room = await createRoom(hostId, roomCode);
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/join", async (req, res) => {
  const { roomCode, userId } = req.body;

  try {
    const room = await joinRoom(roomCode, userId);
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Leave a room
router.post("/leave", async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    await leaveRoom(roomId, userId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start game (host only)
router.post("/start", async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await startGame(roomId);
    res.status(200).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel countdown
router.post("/cancel", async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await cancelCountdown(roomId);
    res.status(200).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
