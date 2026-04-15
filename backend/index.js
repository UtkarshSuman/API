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
import notificationRoutes from "./routes/notificationRoutes.js";

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
const onlineUsers = new Map();

io.on("connection", (socket) => {

  // INIT USER (online + notifications)
  socket.on("initUser", (userId) => {
    if (!userId) return; // safety check

    socket.userId = userId;

    // multi-tab safe count
    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);

    // join personal notification room
    socket.join(`user_${userId}`);

    console.log(`User ${userId} connected (${count + 1})`);

    io.emit("onlineUsers", onlineUsers.size);
  });

  // JOIN JOKE ROOM
  socket.on("joinJokeRoom", (jokeId) => {
    if (!jokeId) return;

    socket.join(`joke_${jokeId}`);
  });

  socket.on("leaveJokeRoom", (jokeId) => {
  socket.leave(`joke_${jokeId}`);
});

  // DISCONNECT
  socket.on("disconnect", () => {
    if (!socket.userId) return;

    const count = onlineUsers.get(socket.userId) || 0;

    if (count <= 1) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} offline`);
    } else {
      onlineUsers.set(socket.userId, count - 1);
      console.log(`User ${socket.userId} still has ${count - 1} connections`);
    }

    io.emit("onlineUsers", onlineUsers.size);
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
app.use("/api/notifications", notificationRoutes);

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