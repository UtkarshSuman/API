import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import pool from "./config/db.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import jokeRoutes from "./routes/jokeRoutes.js";

const app = express();


// Create HTTP server for socket
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      /\.vercel\.app$/,
    ],
    methods: ["GET", "POST"],
  },
});

// store io globally
app.set("io", io);

// online users counter
let onlineUsers = 0;

io.on("connection", (socket) => {

  console.log("User connected");

  onlineUsers++;
  io.emit("onlineUsers", onlineUsers);

  socket.on("disconnect", () => {
    console.log("User disconnected");

    onlineUsers--;
    io.emit("onlineUsers", onlineUsers);
  });

});

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      /\.vercel\.app$/
    ],
    credentials: true,
  })
);
// JSON Middleware
app.use(express.json());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

app.use(apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jokes", jokeRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

// Start server after DB connection
pool.query("SELECT NOW()")
  .then(() => {
    console.log("Database connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB ERROR:", err);
  });