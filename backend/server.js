import express from "express";
import roomRoutes from "./routes/roomRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/rooms", roomRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
