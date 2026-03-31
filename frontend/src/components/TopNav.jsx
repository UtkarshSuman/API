import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
import socket from "../socket";

export default function TopNav({ isLoggedIn }) {
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState(0);

  // ✅ Connect socket once
  useEffect(() => {
    socket.connect();

    const handleOnlineUsers = (count) => {
      setOnlineUsers(count);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.disconnect(); // cleanup
    };
  }, []);

  // ✅ Send user online
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId && socket.connected) {
      socket.emit("userOnline", userId);
    }
  }, []);

  // ✅ Logout fix (VERY IMPORTANT)
  const handleLogout = () => {
    const userId = localStorage.getItem("userId");

    socket.emit("userOffline", userId); // 🔥 remove from backend
    socket.disconnect(); // 🔥 close connection

    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="top-nav">
      <div className="brand">
        <span className="brand-dot" />
        JokeBox
        <p>👥 Online Users: {onlineUsers}</p>
      </div>

      <div className="auth-group">
        <button
          className="btn-auth btn-login"
          onClick={() => navigate("/login")}
        >
          Login
        </button>

        <button
          className="btn-auth btn-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}