import express from "express";
import pool from "../config/db.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


// ================= GET ALL JOKES =================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jokes.id,
              jokes.content,
              jokes.created_at,
              users.name AS author_name,
              users.email AS author_email
       FROM jokes
       JOIN users ON jokes.author_id = users.id
       ORDER BY jokes.created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET RANDOM JOKE =================
router.get("/random", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jokes.id,
              jokes.content,
              jokes.created_at,
              users.name AS author_name
       FROM jokes
       JOIN users ON jokes.author_id = users.id
       ORDER BY RANDOM()
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No jokes found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET JOKE BY ID =================
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

if (isNaN(id)) {
  return res.status(400).json({ message: "Invalid joke id" });
}

  try {
    const result = await pool.query(
      `SELECT jokes.id,
              jokes.content,
              jokes.created_at,
              users.name AS author_name,
              users.email AS author_email
       FROM jokes
       JOIN users ON jokes.author_id = users.id
       WHERE jokes.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Joke not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




// ================= CREATE JOKE =================
router.post("/", protect, async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Joke content is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO jokes (content, author_id) VALUES ($1, $2) RETURNING *",
      [content, req.user.id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
// ================= DELETE JOKE =================
router.delete("/:id", protect, async (req, res) => {
  const id = parseInt(req.params.id);

if (isNaN(id)) {
  return res.status(400).json({ message: "Invalid joke id" });
}

  try {
    const result = await pool.query(
      "SELECT author_id FROM jokes WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Joke not found" });
    }

    const joke = result.rows[0];

    if (joke.author_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete" });
    }

    await pool.query("DELETE FROM jokes WHERE id = $1", [id]);

    res.json({ message: "Joke deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;