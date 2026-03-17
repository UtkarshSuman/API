import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
import socket from "../socket";


export default function TopNav({ isLoggedIn, onLogin, onLogout }) {
  
  const navigate = useNavigate();

  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
   
  socket.connect();
  
  socket.on("onlineUsers", (count) => {
    setOnlineUsers(count);
  });

  return () => socket.off("onlineUsers");

  }, []);

  const handleLogout = () => {
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