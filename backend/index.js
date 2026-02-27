import dotenv from "dotenv";
dotenv.config();
import express from "express";
import pool from "./config/db.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import jokeRoutes from "./routes/jokeRoutes.js";


const app = express();

// ✅ CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ✅ JSON Middleware
app.use(express.json());

// ✅ Rate Limiter (Global)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

app.use(apiLimiter);

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/jokes", jokeRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});