import { db } from "../firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";


export const createRoom = async ({ hostId, roomCode, hostName }) => {
  if (!hostId || !roomCode) throw new Error("hostId and roomCode required");

  const roomsRef = collection(db, "rooms");
  const q = query(roomsRef, where("roomCode", "==", roomCode));
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error("Room code already in use");

  const roomRef = doc(roomsRef);
  const roomData = {
    roomCode,
    hostId,
    status: "waiting",
    createdAt: new Date(),
    players: [{ userId: hostId, name: hostName || "Host", isAlive: true }],
  };

  await setDoc(roomRef, roomData);
  return { ...roomData, roomId: roomRef.id };
};

// Join an existing room
export const joinRoom = async ({ roomCode, userId }) => {
  if (!roomCode || !userId) throw new Error("roomCode and userId required");

  const roomsRef = collection(db, "rooms");
  const q = query(roomsRef, where("roomCode", "==", roomCode));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error("Room not found");

  const roomDoc = snap.docs[0];
  const roomRef = doc(db, "rooms", roomDoc.id);
  const roomData = roomDoc.data();

  // Fetch username from 'users' collection
  let userName = "Anonymous";
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      userName = userSnap.data().displayName || "Anonymous";
    }
  } catch (err) {
    console.warn("Could not fetch username:", err);
  }

  // Avoid duplicate entries
  if (!roomData.players.some(p => p.userId === userId)) {
    const updatedPlayers = [...roomData.players, { userId, name: userName, isAlive: true }];
    await updateDoc(roomRef, { players: updatedPlayers });
    roomData.players = updatedPlayers;
  }

  return { ...roomData, roomId: roomRef.id };
};

// Leave a room
export const leaveRoom = async ({ roomId, userId }) => {
  if (!roomId || !userId) throw new Error("roomId and userId required");

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) return { deleted: true };

  const roomData = roomSnap.data();

  if (roomData.hostId === userId) {
    // Host leaving → delete room
    await deleteDoc(roomRef);
    return { deleted: true };
  } else {
    const updatedPlayers = roomData.players.filter(p => p.userId !== userId);
    await updateDoc(roomRef, { players: updatedPlayers });
    return { deleted: false, players: updatedPlayers };
  }
};
