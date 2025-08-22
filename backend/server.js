import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import roomRoutes from "./routes/roomRoutes.js";
import initSocket from "./socket.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", methods: ["GET","POST","PUT","DELETE"], credentials: true }
});

app.use(cors({ origin: "http://localhost:5173", methods: ["GET","POST","PUT","DELETE"], allowedHeaders: ["Content-Type"] }));
app.use(express.json());
app.use("/api/rooms", roomRoutes);

initSocket(io);

httpServer.listen(5000, () => console.log("Server running on port 5000"));
