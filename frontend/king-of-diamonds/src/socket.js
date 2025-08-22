import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5000", { transports: ["websocket"] });

    socket.on("connect", () => console.log("⚡ Socket connected:", socket.id));
    socket.on("disconnect", (reason) => console.log("❌ Socket disconnected:", reason));
    socket.on("connect_error", (err) => console.error("Socket connection error:", err.message));
  }
  return socket;
};

export const getSocket = () => socket;

// Create room
export const createRoom = (roomCode, userId) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error("Socket not initialized"));

    const onCreated = (room) => {
      cleanup();
      console.log("✅ Room created:", room.roomCode);
      // ensure players array exists
      resolve({ ...room, players: room.players || [] });
    };

    const onError = ({ message }) => {
      cleanup();
      console.error("❌ Create room error:", message);
      reject(new Error(message));
    };

    const cleanup = () => {
      socket.off("roomCreated", onCreated);
      socket.off("error", onError);
    };

    socket.once("roomCreated", onCreated);
    socket.once("error", onError);

    console.log("🟢 Emitting createRoom:", roomCode, userId);
    socket.emit("createRoom", { hostId: userId, roomCode });
  });
};

// Join room
export const joinRoom = (roomCode, userId) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error("Socket not initialized"));

    const onUpdate = (data) => {
      cleanup();
      console.log("✅ Joined room update:", data);
      // make sure players array exists
      resolve({ ...data, players: data.players || [] });
    };

    const onError = ({ message }) => {
      cleanup();
      console.error("❌ Join room error:", message);
      reject(new Error(message));
    };

    const cleanup = () => {
      socket.off("updatePlayers", onUpdate);
      socket.off("error", onError);
    };

    socket.once("updatePlayers", onUpdate);
    socket.once("error", onError);

    console.log("🟢 Emitting joinRoom:", roomCode, userId);
    socket.emit("joinRoom", { roomCode, userId });
  });
};
export const leaveRoom = (roomCode, userId) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error("Socket not initialized"));

    const onUpdate = (data) => {
      cleanup();
      resolve({ ...data, players: data.players || [] });
    };

    const onError = ({ message }) => {
      cleanup();
      reject(new Error(message));
    };

    const cleanup = () => {
      socket.off("updatePlayers", onUpdate);
      socket.off("error", onError);
    };

    socket.once("updatePlayers", onUpdate);
    socket.once("error", onError);

    socket.emit("leaveRoom", { roomCode, userId });
  });
};
