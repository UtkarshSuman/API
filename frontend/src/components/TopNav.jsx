import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
import "./CommentSection.css";
import socket from "../socket";

export default function TopNav({ isLoggedIn }) {
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleBellClick = () => {
    setOpen(!open);
    setUnreadCount(0);
  };


  useEffect(() => {
  socket.off("notification"); // prevent duplicate listeners

  socket.on("notification", (data) => {
    setNotifications((prev) => [data, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  return () => socket.off("notification");
  }, []);


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

          <div className="notification-wrapper">
            <div className="bell" onClick={handleBellClick}>
              🔔
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </div>

            {open && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <p>No notifications</p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="notification-item"
                    onClick={() => navigate(`/joke/${n.jokeId}`)}
                    >
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
