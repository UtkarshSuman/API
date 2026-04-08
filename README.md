# 😂 JokeBox – Full Stack Real-Time Joke Sharing App

![React](https://img.shields.io/badge/Frontend-React-blue)
![Vite](https://img.shields.io/badge/Bundler-Vite-purple)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![Express](https://img.shields.io/badge/Framework-Express-black)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-orange)
![JWT](https://img.shields.io/badge/Auth-JWT-red)

A **full-stack real-time web application** where users can **register, login, create jokes, edit them, like/unlike jokes, and see live updates instantly**.

# 📌 Features

## 🔐 Authentication
- User registration & login
- JWT-based authentication
- Secure password hashing with **bcrypt**
- Role-based authorization (admin / user)
- API rate limiting

---

## 🤣 Joke Management
- View all jokes
- Cursor-based pagination (infinite scroll)
- Fetch random joke
- Fetch joke by ID
- Add, edit, delete jokes

---

## 💬 Comment System (NEW)
- Add comments on jokes
- Real-time comment updates
- Live comment count sync
- Efficient backend handling (non-blocking)

---

## ❤️ Like / Unlike System
- Toggle like/unlike
- Prevent duplicate likes
- Real-time like updates using Socket.IO

---

## ⚡ Real-Time Features (Socket.IO)
- ❤️ Live like updates
- 💬 Live comments
- 🔔 Comment count updates
- 👥 Online users counter

---

## 👥 Online Users Counter
Displays how many users are currently online: 5 Online

---

## 📧 Email Notifications 
- Email sent when someone comments on your joke
- Powered by **Resend API (production-ready)**
- Runs in background (non-blocking, no API delay)

---

## 📦 Performance Optimizations
- 🚀 Cursor-based pagination (no offset issues)
- ⚡ Debounced infinite scroll
- 🔄 Optimistic UI updates
- 🧵 Non-blocking async tasks (email + sockets)
- 📉 Reduced API latency

---

## 🏗 Architecture

Frontend (React + Vite)
        │
        │ HTTP / WebSocket
        ▼
Backend (Node.js + Express + Socket.IO)
        │
        │ SQL Queries
        ▼
PostgreSQL Database



# 🚀 Live Demo

### 🌐 Frontend
https://jokesapp26.vercel.app

### ⚡ Backend API
https://jokesapi-24iv.onrender.com

---


# 🖼 Screenshots

### 🏠 Home & Feed
<p align="center">
  <img src="screenshots/jokeall.png" width="60%" />
</p>

### ❤️ Like System
<p align="center">
  <img src="screenshots/jokelike.png" width="60%" />
</p>

### ✏️ Edit Joke
<p align="center">
  <img src="screenshots/jokeedit.png" width="60%" />
</p>

### ➕ Add Joke
<p align="center">
  <img src="screenshots/jokeadd.png" width="60%" />
</p>

---


# 🗄 Likes Table (Prevents Duplicate Likes)

```sql
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joke_id INTEGER REFERENCES jokes(id) ON DELETE CASCADE,
  UNIQUE(user_id, joke_id)
);
```

This ensures a user can **like a joke only once**.

---

# ⚡ Real-Time Updates (WebSockets)

The application uses **Socket.IO** to update like counts in real time.

When a user likes a joke:

1. Backend updates database
2. Socket.IO emits event
3. All connected clients receive the update instantly

Example:

```javascript
const io = req.app.get("io");

io.emit("likeUpdated", {
  jokeId,
  likes: updated.rows[0].likes
});
```

---

# 👥 Online Users Counter

The app shows **how many users are currently online**.

Example display:

```
👥 Online Users: 5
```

Backend socket logic:

```javascript
let onlineUsers = 0;

io.on("connection", (socket) => {

  onlineUsers++;

  io.emit("onlineUsers", onlineUsers);

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("onlineUsers", onlineUsers);
  });

});
```

---

# 🏗 Architecture

```
Frontend (React + Vite)
        │
        │ HTTP / WebSocket
        ▼
Backend (Node.js + Express + Socket.IO)
        │
        │ SQL Queries
        ▼
PostgreSQL Database
```

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- Axios
- React Router
- Socket.IO Client

## Backend

- Node.js
- Express.js
- JWT
- bcrypt
- Socket.IO
- express-rate-limit

## Database

- PostgreSQL

## Email Service 

- Resend API


---

# 🌐 Deployment

| Service | Platform |
|-------|------|
| Frontend | Vercel |
| Backend | Render |
| Database | Render PostgreSQL |

---

# 🗄 Database Schema

## Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Jokes Table

```sql
CREATE TABLE jokes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Comments Table 

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  joke_id INTEGER REFERENCES jokes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# ⚙️ Installation (Local Setup)

## 1️⃣ Clone Repository

```bash
git clone https://github.com/UtkarshSuman/API.git
cd API
```

---

## 2️⃣ Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

# 3️⃣ Environment Variables

Create `.env` inside **backend**.

```
PORT=5000

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173

DATABASE_URL=your_postgresql_connection_string
```

---

# 4️⃣ Run Backend

```bash
cd backend
npm run dev
```

---

# 5️⃣ Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

Backend runs on:

```
http://localhost:5000
```

---

# 📡 API Endpoints

## Authentication

### Register

```
POST /api/auth/register
```

### Login

```
POST /api/auth/login
```

---

# Jokes API

### Get all jokes

```
GET /api/jokes
```

### Get random joke

```
GET /api/jokes/random
```

### Get joke by ID

```
GET /api/jokes/:id
```

### Add joke

```
POST /api/jokes
```

### Edit joke

```
PUT /api/jokes/:id
```

### Delete joke

```
DELETE /api/jokes/:id
```

### Like / Unlike joke

```
POST /api/jokes/:id/like
```

---

# 📂 Folder Structure

```
API
│
├── backend
│   ├── config
│   │   └── db.js                  
│   │
│   ├── routes                   
│   │   ├── authRoutes.js
│   │   └── jokeRoutes.js
│   │
│   ├── middleware                
│   │   └── authMiddleware.js  
│   │
│   ├── utils                                 
│   │   └── mailer.js 
│   │
│   ├── .env
│   ├── package.json
│   └── index.js                 
│
├── frontend
│   ├── components               
│   │   ├── TopNav.jsx
│   │   ├── CommentSection.jsx
│   │   └── Jokes.jsx
│   │
│   ├── pages                     
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   │
│   ├── services                  
│   │   └── api.js
│   │
│   ├── socket.js            
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                    
│       
│
├── screenshots
│
├── README.md
└── .gitignore
```

---

# 🧠 What I Learned

Through this project I learned:

- Building REST APIs using Express
- Implementing JWT authentication
- Cursor-based pagination (industry-level)
- Async background processing (non-blocking APIs)
- Email service integration (Resend)
- PostgreSQL schema design
- Real-time communication using WebSockets
- Preventing duplicate likes using database constraints
- Rate limiting APIs
- Full stack deployment using Render & Vercel

---

# 📌 Future Improvements

- 🔔 In-app notifications
- 🧵 Threaded comments (replies)
- 🔍 Search & filters
- 👤 User profiles

---

# 👨‍💻 Author

**Utkarsh Suman**

GitHub  
https://github.com/UtkarshSuman

---

⭐ If you like this project, feel free to **star the repository**.