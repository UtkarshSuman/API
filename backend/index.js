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

// track unique users with connection count
let onlineUsers = new Map(); // userId se number of connections

io.on("connection", (socket) => {

  // user comes online
  socket.on("userOnline", (userId) => {
    socket.userId = userId;

    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);

    io.emit("onlineUsers", onlineUsers.size);
  });

  // join comment room
  socket.on("joinJokeRoom", (jokeId) => {
    socket.join(`joke_${jokeId}`);
  });

  // disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.userId) {
      const count = onlineUsers.get(socket.userId);

      if (count <= 1) {
        onlineUsers.delete(socket.userId);
      } else {
        onlineUsers.set(socket.userId, count - 1);
      }

      io.emit("onlineUsers", onlineUsers.size);
    }
  });
});

// BETTER TO COUNT DYNAMICALLY AS WHEN SERVER RESTARTS,THE COUNT RESETS

// io.on("connection", (socket) => {

//   const users = io.engine.clientsCount;

//   io.emit("onlineUsers", users);

//   socket.on("disconnect", () => {
//     io.emit("onlineUsers", io.engine.clientsCount);
//   });

// });


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