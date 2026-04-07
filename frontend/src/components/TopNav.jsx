import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
import socket from "../socket";

export default function TopNav({ isLoggedIn }) {
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState(0);

  // socket listning not connecting or disconnecting
  useEffect(() => {
    const handleOnlineUsers = (count) => {
      setOnlineUsers(count);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  // Logout
  const handleLogout = () => {
    const userId = localStorage.getItem("userId");

    socket.disconnect();

    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="top-nav">
      <div className="brand">
        <span className="brand-dot" />
        JokeBox
      </div>

      {/* RIGHT SIDE */}
      <div className="nav-right">
        <div className="online-badge">{onlineUsers} Online</div>

        <div className="auth-group">
          <button
            className="btn-auth btn-login"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button className="btn-auth btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
