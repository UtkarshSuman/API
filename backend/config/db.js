import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;