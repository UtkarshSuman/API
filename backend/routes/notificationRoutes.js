import express from "express";
import pool from "../config/db.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications
router.get("/", protect, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
});

// Get unread count
router.get("/count", protect, async (req, res) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE user_id=$1 AND is_read=false`,
    [req.user.id]
  );

  res.json({ count: Number(result.rows[0].count) });
});


// Mark ALL as read
router.put("/read-all", protect, async (req, res) => {
  await pool.query(
    `UPDATE notifications
     SET is_read=true
     WHERE user_id=$1`,
    [req.user.id]
  );

  res.json({ success: true });
});

// ================= MARK ONE AS READ =================
router.put("/:id/read", protect, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark one read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE ONE 
router.delete("/:id", protect, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;