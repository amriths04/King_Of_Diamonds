import { db } from "../firebase.js";
import admin from "firebase-admin";

const { FieldValue } = admin.firestore;

export const createRoom = async (hostId, roomCode) => {
  if (!hostId || !roomCode) throw new Error("hostId and roomCode are required");

  const snap = await db.collection("rooms").where("roomCode", "==", roomCode).get();
  if (!snap.empty) throw new Error("Room code already used");

  const roomRef = db.collection("rooms").doc();

  const roomData = {
    roomCode,
    hostId,
    status: "waiting",
    createdAt: new Date(),
    ttl: Date.now() + 3600000,
    players: [
      {
        userId: hostId,
        name: "",
        score: 10,
        isAlive: true,
      },
    ],
  };
  await roomRef.set(roomData);
  return { ...roomData, roomId: roomRef.id };
};

export const joinRoom = async (roomCode, userId) => {
  const roomsRef = db.collection("rooms");
  const q = roomsRef.where("roomCode", "==", roomCode);
  const snap = await q.get();

  if (snap.empty) {
    throw new Error("Invalid room code");
  }

  // Get user data from Users collection
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("User does not exist");
  }

  const { displayName } = userSnap.data();

  const roomDoc = snap.docs[0];

  await roomDoc.ref.update({
  players: FieldValue.arrayUnion({
    userId,
    name: displayName,
    score: 10,
    isAlive: true,
  }),
});

  const updatedRoom = await roomDoc.ref.get();
  return updatedRoom.data();
};

// Leave a room
export const leaveRoom = async (roomId, userId) => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) throw new Error("Room does not exist");

  const roomData = roomSnap.data();
  const player = roomData.players.find((p) => p.userId === userId);
  if (!player) throw new Error("Player not in room");

  await updateDoc(roomRef, {
    players: arrayRemove(player),
  });

  // Delete room if host leaves or no players remain
  const remainingPlayers = roomData.players.filter((p) => p.userId !== userId);
  if (roomData.hostId === userId || remainingPlayers.length === 0) {
    await deleteDoc(roomRef);
  }

  return true;
};

// Start the game (host only)
export const startGame = async (roomId) => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Room does not exist");

  await updateDoc(roomRef, {
    status: "started",
  });

  return (await getDoc(roomRef)).data();
};

// Cancel countdown / reset to waiting
export const cancelCountdown = async (roomId) => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Room does not exist");

  await updateDoc(roomRef, {
    status: "waiting",
  });

  return (await getDoc(roomRef)).data();
};
