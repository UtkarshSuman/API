import express from "express";
import pool from "../config/db.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


// ================= GET ALL JOKES =================

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT jokes.id,
              jokes.content,
              jokes.created_at,
              jokes.likes,
              users.name AS author_name,
              users.email AS author_email
       FROM jokes
       JOIN users ON jokes.author_id = users.id
       ORDER BY jokes.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      page,
      limit,
      jokes: result.rows,
      hasMore: result.rows.length === limit  //  important
    });

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
              jokes.likes,
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

router.get("/trending", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        j.id,
        j.content,
        j.created_at,
        j.likes,
        u.name AS author_name,
        u.email AS author_email,
        (j.likes * 2 + COUNT(c.id) * 3) /
        (EXTRACT(EPOCH FROM (NOW() - j.created_at)) / 3600 + 2)
        AS score
      FROM jokes j
      JOIN users u ON j.author_id = u.id   
      LEFT JOIN comments c ON j.id = c.joke_id
      GROUP BY j.id, u.name, u.email      
      ORDER BY score DESC
      LIMIT 20;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Trending error:", err);
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
              jokes.like,
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
   
    const fullJoke = await pool.query(
   `SELECT j.id,
          j.content,
          j.created_at,
          j.likes,
          u.name AS author_name,
          u.email AS author_email
    FROM jokes j
    JOIN users u ON j.author_id = u.id
    WHERE j.id = $1`,
  [result.rows[0].id]
  );

    res.status(201).json(fullJoke.rows[0]);

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


router.put("/:id", protect, async (req, res) => {
  const jokeId = req.params.id;
  const { content } = req.body;
  try {

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = parseInt(req.user.id);

    // Validate input
    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Joke content cannot be empty"
      });
    }

    const joke = await pool.query(
      "SELECT * FROM jokes WHERE id = $1",
      [jokeId]
    );

    if (joke.rows.length === 0) {
      return res.status(404).json({ message: "Joke not found" });
    }

    // Convert to number to avoid type mismatch
    if (Number(joke.rows[0].author_id) !== Number(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedJoke = await pool.query(
      "UPDATE jokes SET content = $1 WHERE id = $2 RETURNING *",
      [content.trim(), jokeId]
    );

    res.json(updatedJoke.rows[0]);

  } catch (err) {

    console.error("Edit joke error:", err);

    res.status(500).json({ message: err.message });

  }
});

router.post("/:id/like", protect, async (req, res) => {
  const jokeId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const existing = await pool.query(
      "SELECT * FROM likes WHERE user_id=$1 AND joke_id=$2",
      [userId, jokeId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM likes WHERE user_id=$1 AND joke_id=$2",
        [userId, jokeId]
      );

      await pool.query(
        "UPDATE jokes SET likes = likes - 1 WHERE id=$1",
        [jokeId]
      );
    } else {
      await pool.query(
        "INSERT INTO likes(user_id, joke_id) VALUES($1,$2)",
        [userId, jokeId]
      );
      
      await pool.query(
        "UPDATE jokes SET likes = likes + 1 WHERE id=$1",
        [jokeId]
      );
    }

    //Fetch full updated joke
    const fullJoke = await pool.query(
      `SELECT j.id,
              j.content,
              j.created_at,
              j.likes,
              u.name AS author_name,
              u.email AS author_email
       FROM jokes j
       JOIN users u ON j.author_id = u.id
       WHERE j.id = $1`,
      [jokeId]
    );
    
    // socket emits here
    const io = req.app.get("io");

    io.emit("likeUpdated", {
      jokeId,
      likes: fullJoke.rows[0].likes
    });

    res.json(fullJoke.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// database scema to load joke faster ->>>>>>>>>>>>>>>>>>>>    CREATE INDEX idx_comments_joke_id ON comments(joke_id);
router.get("/:id/comments", async (req, res) => {
  try {
    const jokeId = req.params.id;

    const comments = await pool.query(
      `SELECT comments.*, users.name AS username
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE joke_id=$1
       ORDER BY created_at ASC`,
      [jokeId]
    );

    res.json(comments.rows);

  } catch (err) {
    console.error("Comments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/comments", protect, async (req, res) => {
  try {
    const jokeId = req.params.id;
    const userId = req.user.id;
    const { comment } = req.body;

    const newComment = await pool.query(
      `INSERT INTO comments (joke_id, user_id, comment)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [jokeId, userId, comment]
    );

    const fullComment = await pool.query(
      `SELECT comments.*, users.name AS username
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.id = $1`,
      [newComment.rows[0].id]
    );

    const io = req.app.get("io");

    io.to(`joke_${jokeId}`).emit("newComment", {
      jokeId,
      comment: fullComment.rows[0]
    });

    res.json(fullComment.rows[0]);

  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;