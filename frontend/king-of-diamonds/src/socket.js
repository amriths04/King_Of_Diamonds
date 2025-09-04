import { io } from "socket.io-client";

let socket;

export const initSocket = (serverUrl, { roomId, userId, name, photoURL }) => {
  socket = io(serverUrl);

  socket.emit("joinGameRoom", { roomId, userId, name, photoURL });

  return socket;
};

export const onEvent = (event, callback) => {
  if (!socket) return;
  socket.on(event, callback);
};

export const offEvent = (event) => {
  if (!socket) return;
  socket.off(event);
};

export const emitEvent = (event, data) => {
  if (!socket) return;
  socket.emit(event, data);
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
