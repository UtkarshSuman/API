import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;


// CREATE TABLE users (
//   id SERIAL PRIMARY KEY,
//   name TEXT NOT NULL,
//   email TEXT UNIQUE NOT NULL,
//   password TEXT NOT NULL,
//   role TEXT DEFAULT 'user',
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
// CREATE TABLE jokes (
//   id SERIAL PRIMARY KEY,
//   content TEXT NOT NULL,
//   author_id INT REFERENCES users(id) ON DELETE CASCADE,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   likes INT DEFAULT 0
// );
// CREATE TABLE comments (
//   id SERIAL PRIMARY KEY,
//   joke_id INT REFERENCES jokes(id) ON DELETE CASCADE,
//   user_id INT REFERENCES users(id) ON DELETE CASCADE,
//   comment TEXT NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
// CREATE TABLE likes (
//   id SERIAL PRIMARY KEY,
//   user_id INT REFERENCES users(id) ON DELETE CASCADE,
//   joke_id INT REFERENCES jokes(id) ON DELETE CASCADE,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   UNIQUE(user_id, joke_id) -- prevents duplicate likes
// );