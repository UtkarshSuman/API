import axios from "axios";
import socket from "../socket";

// ================= BASE URL =================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ================= AXIOS   =================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================
// Automatically attach token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
// Auto logout on 401/403, but ignore login/register failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes("/api/auth");

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !isAuthRoute //  Prevents an infinite loop if the user enters a wrong password
    ) {
      logoutUser(); 
    }

    // Better fallback for Network Errors (when the server is totally unreachable)
    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);


// NORMALIZATION CODE
export const normalizeJoke = (j) => ({
  id: j.id,
  content: j.content,
  likes: Number(j.likes) || 0,
  comments_count: Number.isFinite(Number(j.comments_count))
    ? Number(j.comments_count)
    : 0,
  author_name: j.author_name ?? "Anonymous",
  author_email: j.author_email ?? "",
  created_at: j.created_at ?? new Date().toISOString(),
});


// ================= AUTH SERVICES =================

export const loginUser = async (email, password) => {
  const { data } = await api.post("/api/auth/login", { email, password });

  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.email);
  localStorage.setItem("name", data.name);   
  localStorage.setItem("role", data.role);
  localStorage.setItem("userId", data.id);

  return data;
};

export const registerUser = async (userData) => {
  const { data } = await api.post("/api/auth/register", userData);
  return data;
};
 

export const logoutUser = () => {
  socket.disconnect();

  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  
};


export const deleteJoke = async (id) => {
  const { data } = await api.delete(`/api/jokes/${id}`);
  return normalizeJoke(data);
};

// ================= JOKE SERVICES =================

export const getAllJokes = async (cursor = null, limit = 10) => {
  let url = `/api/jokes?limit=${limit}`;

  if (cursor && cursor.created_at && cursor.id) {
    url += `&cursorCreatedAt=${cursor.created_at}&cursorId=${cursor.id}`;
  }

  const { data } = await api.get(url);

  return {
    ...data,
    jokes: data.jokes.map(normalizeJoke),
  };
};


export const getRandomJoke = async () => {
  const { data } = await api.get("/api/jokes/random");
  return normalizeJoke(data);
};

export const getJokeById = async (id) => {
  const { data } = await api.get(`/api/jokes/${id}`);
  return normalizeJoke(data);
};

export const addJoke = async (content) => {
  const { data } = await api.post("/api/jokes", { content });
  return normalizeJoke(data);
};

// ================= UPDATE JOKE =================

export const updateJoke = async (id, content) => {
  console.log("Updating joke:", id, content);
  const { data } = await api.put(`/api/jokes/${id}`, { content });
  return normalizeJoke(data);
};

// ================= LIKE JOKE =================
// backend me abhi nhi dala hai like ka
export const likeJoke = async (id) => {
  const { data } = await api.post(`/api/jokes/${id}/like`);
  return normalizeJoke(data);
};


export const getCommentsByJoke = async (jokeId) => {
  const { data } = await api.get(`/api/jokes/${jokeId}/comments`);

  return data.map((c) => ({
    id: c.id,
    comment: c.comment,
    username: c.username ?? "Anonymous",
    created_at: c.created_at,
  }));
};

export const addComment = async (jokeId, comment) => {
  const { data } = await api.post(`/api/jokes/${jokeId}/comments`, {
    comment,
  });

  return {
    id: data.id,
    comment: data.comment,
    username: data.username ?? "Anonymous",
    created_at: data.created_at,
  };
};

export const getTrendingJokes = async () => {
  const { data } = await api.get("/api/jokes/trending");

  return Array.isArray(data)
    ? data.map(normalizeJoke)
    : [];
};

export default api;