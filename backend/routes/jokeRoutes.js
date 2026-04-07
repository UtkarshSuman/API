import express from "express";
import pool from "../config/db.js";
import protect from "../middleware/authMiddleware.js";
import { transporter } from "../utils/mailer.js";

const router = express.Router();


// ================= GET ALL JOKES =================

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const cursorCreatedAt = req.query.cursorCreatedAt;
    const cursorId = req.query.cursorId;

    let query = `
  SELECT 
    jokes.id,
    jokes.content,
    jokes.created_at,
    jokes.likes,
    users.name AS author_name,
    users.email AS author_email,
    (
      SELECT COUNT(*) 
      FROM comments c 
      WHERE c.joke_id = jokes.id
    )::int AS comments_count
  FROM jokes
  JOIN users ON jokes.author_id = users.id
`;

    const values = [];
    let whereClause = "";

    // cursor condition
    if (
      cursorCreatedAt &&
      cursorId &&
      !isNaN(new Date(cursorCreatedAt).getTime()) &&
      !isNaN(parseInt(cursorId))
    ) {
      values.push(cursorCreatedAt, cursorId);

      whereClause = `
        WHERE (jokes.created_at, jokes.id) < ($1, $2)
      `;
    }

    query += `
      ${whereClause}
      GROUP BY jokes.id, users.name, users.email
      ORDER BY jokes.created_at DESC, jokes.id DESC
      LIMIT $${values.length + 1}
    `;

    values.push(limit + 1); // fetch extra

    const result = await pool.query(query, values);

    let jokes = result.rows;
    const hasMore = jokes.length > limit;

    if (hasMore) {
      jokes = jokes.slice(0, limit);
    }

    // next cursor
    const nextCursor =
      jokes.length > 0
        ? {
          created_at: jokes[jokes.length - 1].created_at,
          id: jokes[jokes.length - 1].id,
        }
        : null;

    res.json({
      jokes,
      hasMore,
      nextCursor,
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
              users.name AS author_name,
              COUNT(c.id)::int AS comments_count
       FROM jokes
       JOIN users ON jokes.author_id = users.id
       LEFT JOIN comments c ON jokes.id = c.joke_id
       GROUP BY jokes.id, jokes.content, jokes.created_at, jokes.likes, users.name
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
        COUNT(c.id)::int AS comments_count,
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
              jokes.likes,
              users.name AS author_name,
              users.email AS author_email,
              COUNT(c.id)::int AS comments_count
       FROM jokes
       JOIN users ON jokes.author_id = users.id
       LEFT JOIN comments c ON jokes.id = c.joke_id
       WHERE jokes.id = $1
       GROUP BY jokes.id, users.name, users.email;`,
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
        "UPDATE jokes SET likes = GREATEST(likes - 1,0) WHERE id=$1",
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

router.post("/:id/comments",protect, async (req, res) => {
  try {
    const jokeId = req.params.id;
    const userId = req.user.id;

    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

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

    // get joke author
    const jokeOwner = await pool.query(
      `SELECT u.email, u.name, j.content
       FROM jokes j
       JOIN users u ON j.author_id = u.id
       WHERE j.id = $1`,
      [jokeId]
    );


    // avoid sending email to self
    if (jokeOwner.rows.length === 0) {
      return res.status(404).json({ message: "Joke not found" });
    }

    const author = jokeOwner.rows[0];

    console.log("Author:", author);
    console.log("User:", req.user);

    if (author.email !== req.user.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: author.email,
          subject: "New Comment on Your Joke 😂",
          html: `
        <h3>Hey ${author.name}!</h3>
        <p>Someone commented on your joke:</p>
        <blockquote>${author.content}</blockquote>
        <p><b>Comment:</b> ${comment}</p>
      `,
        });

        console.log("Email sent successfully");
      } catch (err) {
        console.error("Email error:", err);
      }
    }
    const io = req.app.get("io");

    // get updated count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM comments WHERE joke_id = $1",
      [jokeId]
    );

    const commentsCount = parseInt(countResult.rows[0].count);

    // emit update
    io.emit("commentCountUpdated", {
      jokeId,
      commentsCount,
    });

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