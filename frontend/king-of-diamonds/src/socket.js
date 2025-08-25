import { io } from "socket.io-client";

let socket;

export const initiateSocket = (serverUrl, roomId, userId) => {
  socket = io(serverUrl);

  socket.emit("joinGameRoom", { roomId, userId });

  socket.on("joinedRoom", (roomData) => {
    console.log("Joined room:", roomData);
  });
};

export const subscribeToRoundResult = (callback) => {
  if (!socket) return;
  socket.on("roundResult", callback);
};

export const submitNumber = (roomId, userId, number) => {
  if (!socket) return;
  socket.emit("submitNumber", { roomId, userId, number });
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
