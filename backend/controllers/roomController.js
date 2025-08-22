import { db } from "../firebase.js";
import admin from "firebase-admin";

const { FieldValue } = admin.firestore;

export const createRoom = async (hostId, roomCode) => {
  if (!hostId || !roomCode) throw new Error("hostId and roomCode are required");

  const snap = await db.collection("rooms").where("roomCode", "==", roomCode).get();
  if (!snap.empty) throw new Error("Room code already used");
  const userRef = db.collection("users").doc(hostId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) 
    throw new Error("Host user does not exist");
  const { displayName } = userSnap.data();

  const roomRef = db.collection("rooms").doc();

  const roomData = {
    roomCode,
    hostId,
    status: "waiting",
    createdAt: new Date(),
    ttl: Date.now() + 3600000,
    players: [
      { userId: hostId, name: displayName || "Host", score: 10, isAlive: true }
    ],
  };
  await roomRef.set(roomData);
  return { ...roomData, roomId: roomRef.id };
};

export const joinRoom = async (roomCode, userId) => {
  const roomsRef = db.collection("rooms");
  const snap = await roomsRef.where("roomCode", "==", roomCode).get();
  if (snap.empty) throw new Error("Invalid room code");

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error("User does not exist");

  const { displayName } = userSnap.data();

  const roomDoc = snap.docs[0];

  await roomDoc.ref.update({
    players: FieldValue.arrayUnion({ userId, name: displayName, score: 10, isAlive: true })
  });

  const updatedRoom = await roomDoc.ref.get();
  return { ...updatedRoom.data(), roomId: roomDoc.id };
};

export const leaveRoom = async (roomCode, userId) => {
  if (!roomCode || !userId) throw new Error("roomCode and userId required");

  const roomsRef = db.collection("rooms");
  const snap = await roomsRef.where("roomCode", "==", roomCode).get();
  if (snap.empty) throw new Error("Room not found");

  const roomDoc = snap.docs[0];
  const roomData = roomDoc.data();

  // Find the player in the room
  const playerIndex = roomData.players.findIndex(p => p.userId === userId);
  if (playerIndex === -1) {
    return { message: "User was not in the room", players: roomData.players };
  }

  // Remove the player
  const updatedPlayers = [...roomData.players];
  updatedPlayers.splice(playerIndex, 1);
  await roomDoc.ref.update({ players: updatedPlayers });

  // Delete room if host left and no players remain
  if (roomData.hostId === userId && updatedPlayers.length === 0) {
    await roomDoc.ref.delete();
    return { message: "Room deleted", players: [] };
  }

  return { message: "User left the room", players: updatedPlayers };
};



export const deleteRoom = async (roomCode) => {
  if (!roomCode) throw new Error("roomCode required");

  const roomsRef = db.collection("rooms");
  const snap = await roomsRef.where("roomCode", "==", roomCode).get();
  if (snap.empty) throw new Error("Room not found");

  const roomDoc = snap.docs[0];
  await roomDoc.ref.delete();

  return { message: `Room ${roomCode} deleted` };
};
