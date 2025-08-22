import { createRoom, joinRoom, leaveRoom, deleteRoom } from "./controllers/roomController.js";

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("createRoom", async ({ hostId, roomCode }) => {
      try {
        const room = await createRoom(hostId, roomCode);
        socket.join(roomCode);
        socket.userId = hostId;
        socket.roomCode = roomCode;

        socket.emit("roomCreated", room);
        io.to(roomCode).emit("updatePlayers", { players: room.players });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("joinRoom", async ({ roomCode, userId }) => {
      try {
        const room = await joinRoom(roomCode, userId);
        socket.join(roomCode);
        socket.userId = userId;
        socket.roomCode = roomCode;

        io.to(roomCode).emit("updatePlayers", { players: room.players });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("leaveRoom", async ({ roomCode, userId }) => {
  try {
    const result = await leaveRoom(roomCode, userId);
    io.to(roomCode).emit("updatePlayers", { players: result.players });
    socket.leave(roomCode);
    socket.userId = null;
    socket.roomCode = null;
  } catch (err) {
    socket.emit("error", { message: err.message });
  }
});


    socket.on("deleteRoom", async ({ roomCode }) => {
      try {
        const result = await deleteRoom(roomCode);
        io.to(roomCode).emit("roomDeleted", { roomCode });
        io.socketsLeave(roomCode);
        socket.emit("deleteSuccess", result);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("disconnect", async () => {
      const { userId, roomCode } = socket;
      if (userId && roomCode) {
        try {
          const result = await leaveRoom(roomCode, userId);
          if (result.message === "Room deleted") {
            io.to(roomCode).emit("roomDeleted", { roomCode });
            io.socketsLeave(roomCode);
          } else {
            io.to(roomCode).emit("updatePlayers", { players: result.players });
          }
          console.log(`User ${userId} disconnected from room ${roomCode}`);
        } catch (err) {
          console.error("Error removing disconnected player:", err);
        }
      }
    });
  });
}
