import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";
import { loginUser, registerUser } from "../services/api"; 

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("user");
  const [name, setName] = useState(""); // ✅ Added state for the Name
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        // ✅ Login logic
        await loginUser(username, password); // Note: Role isn't needed for login, the DB already knows it
        navigate("/");
      } else {
        // ✅ Registration logic
        await registerUser({ name, email: username, password, role }); 
        
        // After successful registration, you can either auto-login the user or switch back to the login tab:
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuestMode = () => {
    navigate("/");
  };

  return (
    <div className="modal-overlay">
      <div className="auth-container">
        <button className="close-btn" onClick={() => navigate("/", { replace: true })}> 
          ×
        </button>
        <h2>{isLogin ? "Login" : "Register"}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} // ✅ Bind to state
              onChange={(e) => setName(e.target.value)} // ✅ Capture input
              required 
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-dropdown"
          >
            <option value="user">
              {isLogin ? "Login as User" : "Register as User"}
            </option>
            <option value="admin">
              {isLogin ? "Login as Admin" : "Register as Admin"}
            </option>
          </select>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="switch-text">
          {isLogin ? "Not registered?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer", color: "blue" }}>
            {isLogin ? " Register" : " Login"}
          </span>
        </p>

        <button className="guest-btn" onClick={handleGuestMode}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}