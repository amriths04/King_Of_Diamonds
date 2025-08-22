import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import roomRoutes from "./routes/roomRoutes.js";
import initSocket from "./socket.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL_LOCAL;

const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ["GET","POST","PUT","DELETE"], credentials: true }
});

app.use(cors({ origin: FRONTEND_URL, methods: ["GET","POST","PUT","DELETE"], allowedHeaders: ["Content-Type"] }));
app.use(express.json());
app.use("/api/rooms", roomRoutes);

initSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
