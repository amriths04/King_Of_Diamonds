import express from "express";
import { createRoom, joinRoom, leaveRoom, deleteRoom } from "../controllers/roomController.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { hostId, roomCode } = req.body;
    const room = await createRoom(hostId, roomCode);
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/join", async (req, res) => {

  try {
    const { roomCode, userId } = req.body;
    const room = await joinRoom(roomCode, userId);
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/leave", async (req, res) => {
  try {
    const { roomCode, userId } = req.body;
    const result = await leaveRoom(roomCode, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { roomCode } = req.body;
    const result = await deleteRoom(roomCode);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
