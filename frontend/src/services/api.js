import axios from "axios";

// ================= BASE URL =================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ================= AXIOS INSTANCE =================
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
      !isAuthRoute // ✅ Prevents an infinite loop if the user enters a wrong password
    ) {
      logoutUser(); 
    }

    // ✅ Better fallback for Network Errors (when the server is totally unreachable)
    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);

// ================= AUTH SERVICES =================

export const loginUser = async (email, password) => {
  const { data } = await api.post("/api/auth/login", { email, password });

  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  localStorage.setItem("role", data.role);

  return data;
};

export const registerUser = async (userData) => {
  const { data } = await api.post("/api/auth/register", userData);
  return data;
};

// ✅ Centralized logout function
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.href = "/"; // Send them to home/modal instead of a hardcoded /login route
};

// ================= JOKE SERVICES =================

export const getAllJokes = async () => {
  const { data } = await api.get("/api/jokes");
  return data;
};

export const getRandomJoke = async () => {
  const { data } = await api.get("/api/jokes/random");
  return data;
};

export const getJokeById = async (id) => {
  const { data } = await api.get(`/api/jokes/${id}`);
  return data;
};

export const addJoke = async (content) => {
  const { data } = await api.post("/api/jokes", { content });
  return data;
};

export default api;