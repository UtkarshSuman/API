import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
import "./CommentSection.css";
import socket from "../socket";
import {
  getNotifications,
  getNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/api";

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

  const handleBellClick = async () => {
    setOpen(!open);

    if (!open && unreadCount > 0) {
      await markAllNotificationsRead();
      setUnreadCount(0);
    }
  };

  // initial fetch
  useEffect(() => {
    const init = async () => {
      const data = await getNotifications();
      const count = await getNotificationCount();

      setNotifications(data);
      setUnreadCount(count);
    };

    init();
  }, []);

  useEffect(() => {
    socket.off("notification"); // prevent duplicate listeners
    socket.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    socket.on("notificationCount", (data) => {
      setUnreadCount(data.count);
    });

    return () => {
      socket.off("notification");
      socket.off("notificationCount");
    };
  }, []);

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: true } : item,
        ),
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }

    navigate(`/joke/${n.joke_id}`);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
                  notifications.map((n) => (
                    <div key={n.id} className="notification-item">
                      <div
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          cursor: "pointer",
                          opacity: n.is_read ? 0.6 : 1,
                        }}
                      >
                        {n.message}
                      </div>

                      <button onClick={() => handleDelete(n.id)}>❌</button>
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
