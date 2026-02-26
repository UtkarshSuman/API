import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from PostgreSQL
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = result.rows[0]; // attach full user object
    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;