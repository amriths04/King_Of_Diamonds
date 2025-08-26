// in-memory game sessions (shared across all sockets)
const rooms = {}; 

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("[DEBUG] User connected:", socket.id);

    // Join a game room when host starts
socket.on("joinGameRoom", ({ roomId, userId, name, photoURL }) => {
  if (!rooms[roomId]) {
    rooms[roomId] = { 
      players: [], 
      currentRound: 1, 
      submissions: {}, 
      scores: {}, 
      status: "started",
      roundRunning: false
    };
  }

  if (!rooms[roomId].players.find(p => p.userId === userId)) {
    rooms[roomId].players.push({ 
      userId, 
      name, 
      photoURL, 
      socketId: socket.id, 
      eliminated: false 
    });
    rooms[roomId].scores[userId] = 0;
  }

  socket.join(roomId);
  io.to(roomId).emit("joinedRoom", rooms[roomId]);

  if (!rooms[roomId].roundRunning) {
    rooms[roomId].roundRunning = true;
    startRoundTimer(io, roomId);
  }
});


    // ✅ Player submits number (only final choice at timer end)
    socket.on("submitNumber", ({ roomId, userId, number }) => {
      const room = rooms[roomId];
      if (!room) {
        console.log(`[DEBUG] Room ${roomId} not found for submission from ${userId}`);
        return;
      }

      // Ignore eliminated players
      const player = room.players.find(p => p.userId === userId);
      if (player?.eliminated) {
        console.log(`[DEBUG] Ignoring submission from eliminated player ${userId}`);
        return;
      }

      // Record final submission
      room.submissions[userId] = number;
      console.log(`[DEBUG] ${userId} submitted FINAL number ${number} in room ${roomId}`);
      console.log(`[DEBUG] Current submissions in room ${roomId}:`, room.submissions);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("[DEBUG] User disconnected:", socket.id);
      for (const roomId in rooms) {
        rooms[roomId].players = rooms[roomId].players.filter(p => p.socketId !== socket.id);
        if (rooms[roomId].players.length === 0) {
          console.log(`[DEBUG] Room ${roomId} is now empty, deleting`);
          delete rooms[roomId];
        }
      }
    });
  });
}

// Function to handle each round automatically
function startRoundTimer(io, roomId) {
  const roundDuration = 20;      // Round countdown
  const interRoundDuration = 20; // Inter-round countdown

  const room = rooms[roomId];
  if (!room) return;

  let roundTime = roundDuration;
  console.log(`[DEBUG] Round ${room.currentRound} started in room ${roomId}`);

  const roundInterval = setInterval(() => {
    roundTime--;
    io.to(roomId).emit("roundTimer", roundTime);

    if (roundTime <= 0) {
      clearInterval(roundInterval);
      console.log(`[DEBUG] Round ${room.currentRound} ended in room ${roomId}`);
      console.log(`[DEBUG] Submissions:`, room.submissions);

      // ⏳ Wait 2 seconds before calculating results
      setTimeout(() => {
        // Auto-submit 0 for ACTIVE players who didn't submit
        room.players.forEach(p => {
          if (!p.eliminated && room.submissions[p.userId] === undefined) {
            room.submissions[p.userId] = 0;
            console.log(`[DEBUG] Auto-submitted 0 for ${p.userId}`);
          }
        });

        // Active players only
        const activePlayers = room.players.filter(p => !p.eliminated);
        const numbers = activePlayers.map(p => room.submissions[p.userId] ?? 0);

        const avg = numbers.length > 0 
          ? numbers.reduce((a, b) => a + b, 0) / numbers.length 
          : 0;
        const target = avg * 0.8;
        console.log(`[DEBUG] Avg: ${avg}, Target: ${target}`);

        // Determine winner among active players
        let winnerId = null, closest = Infinity;
        for (const p of activePlayers) {
          const val = room.submissions[p.userId] ?? 0;
          const diff = Math.abs(val - target);
          console.log(`[DEBUG] Player ${p.userId} chose ${val}, diff = ${diff}`);
          if (diff < closest) { closest = diff; winnerId = p.userId; }
        }
        console.log(`[DEBUG] Winner is ${winnerId} with diff ${closest}`);

        // Update scores and check elimination
        activePlayers.forEach(p => {
          if (p.userId !== winnerId) {
            room.scores[p.userId] -= 1;
            console.log(`[DEBUG] Deducted score from ${p.userId}, now = ${room.scores[p.userId]}`);
            if (room.scores[p.userId] <= -10 && !p.eliminated) {
              p.eliminated = true;
              io.to(roomId).emit("playerEliminated", { playerId: p.userId });
              console.log(`[DEBUG] Player ${p.userId} eliminated`);
            }
          }
        });

        // Survivors left
        const survivors = room.players.filter(p => !p.eliminated);

        // ✅ Always emit round results first
        io.to(roomId).emit("roundResult", {
          round: room.currentRound,
          submissions: room.submissions,
          target,
          winnerId,
          scores: room.scores
        });

        // ✅ If game ends, delay GAME CLEAR so UI shows results
        if (survivors.length === 1) {
          setTimeout(() => {
            io.to(roomId).emit("gameClear", { winner: survivors[0].userId });
            console.log(`[DEBUG] GAME CLEAR for ${survivors[0].userId}`);
          }, 3000); // wait 3s after showing roundResult
          return;
        }

        // Start inter-round countdown
        let interRoundTime = interRoundDuration;
        console.log(`[DEBUG] Starting inter-round for room ${roomId}`);
        const interRoundInterval = setInterval(() => {
          interRoundTime--;
          io.to(roomId).emit("interRoundTimer", interRoundTime);

          if (interRoundTime <= 0) {
            clearInterval(interRoundInterval);

            // Prepare next round
            room.submissions = {};
            room.currentRound++;
            console.log(`[DEBUG] Starting new round ${room.currentRound} in room ${roomId}`);
            io.to(roomId).emit("newRound", room.currentRound);

            startRoundTimer(io, roomId); 
          }
        }, 1000);
      }, 2000);
    }
  }, 1000);
}
