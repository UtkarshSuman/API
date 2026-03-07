import React from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";
export default function TopNav({ isLoggedIn, onLogin, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="top-nav">
      <div className="brand">
        <span className="brand-dot" />
        JokeBox
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