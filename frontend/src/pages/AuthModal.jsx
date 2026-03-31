import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";
import { loginUser, registerUser } from "../services/api"; 
import { getAllJokes } from "../services/api";
import socket from "../socket";

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("user");
  const [name, setName] = useState(""); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    if (isLogin) {

      const data = await loginUser(username, password);

      // ensure userId exists
      const userId = data.id || localStorage.getItem("userId");

      if (userId) {
        socket.emit("userOnline", userId);
      }

      navigate("/");

    } else {

      await registerUser({ name, email: username, password, role });

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
 
      {/* ── LEFT: Comedy Stage Illustration ── */}
      <div className="auth-left">
 
        {/* Floating joke bubbles */}
        <div className="joke-bubble bubble-1">"Why so serious? 😂"</div>
        <div className="joke-bubble bubble-2">"Atoms make up everything"</div>
        <div className="joke-bubble bubble-3">"404: sleep not found"</div>
        <div className="joke-bubble bubble-4">"I told a UDP joke..."</div>
 
        {/* Comedy stage SVG illustration */}
        <svg className="stage-svg" viewBox="0 0 380 520" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          {/* Stage curtains */}
          <path d="M0 0 Q60 260 30 520 L0 520 Z" fill="#1e0a04" opacity="0.9"/>
          <path d="M380 0 Q320 260 350 520 L380 520 Z" fill="#1e0a04" opacity="0.9"/>
          {/* Curtain folds left */}
          <path d="M30 0 Q50 130 40 260 Q50 390 30 520" stroke="rgba(180,60,20,0.25)" strokeWidth="1.5" fill="none"/>
          <path d="M20 0 Q35 130 28 260 Q35 390 20 520" stroke="rgba(180,60,20,0.15)" strokeWidth="1" fill="none"/>
          {/* Curtain folds right */}
          <path d="M350 0 Q330 130 340 260 Q330 390 350 520" stroke="rgba(180,60,20,0.25)" strokeWidth="1.5" fill="none"/>
          <path d="M360 0 Q345 130 352 260 Q345 390 360 520" stroke="rgba(180,60,20,0.15)" strokeWidth="1" fill="none"/>
 
          {/* Spotlight cone */}
          <defs>
            <radialGradient id="spotlight" cx="50%" cy="0%" r="75%" fx="50%" fy="0%">
              <stop offset="0%"   stopColor="#ffe050" stopOpacity="0.22"/>
              <stop offset="60%"  stopColor="#ffb020" stopOpacity="0.07"/>
              <stop offset="100%" stopColor="#ff8000" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="floorGlow" cx="50%" cy="100%" r="50%">
              <stop offset="0%"   stopColor="#ffc040" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#ff8000" stopOpacity="0"/>
            </radialGradient>
          </defs>
 
          {/* Spotlight lamp at top */}
          <ellipse cx="190" cy="10" rx="22" ry="8" fill="#2a2010" stroke="#5a4020" strokeWidth="1"/>
          <rect x="183" y="4" width="14" height="10" rx="3" fill="#3a3018" stroke="#6a5028" strokeWidth="0.8"/>
          {/* Spotlight beam */}
          <polygon points="145,18 245,18 280,380 100,380" fill="url(#spotlight)"/>
 
          {/* Floor glow */}
          <ellipse cx="190" cy="400" rx="120" ry="30" fill="url(#floorGlow)"/>
 
          {/* Stage floor */}
          <rect x="50" y="390" width="280" height="12" rx="3" fill="#1c1005" stroke="rgba(255,180,40,0.12)" strokeWidth="1"/>
          {/* Floor planks */}
          <line x1="80"  y1="390" x2="80"  y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
          <line x1="120" y1="390" x2="120" y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
          <line x1="160" y1="390" x2="160" y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
          <line x1="200" y1="390" x2="200" y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
          <line x1="240" y1="390" x2="240" y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
          <line x1="280" y1="390" x2="280" y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
          <line x1="310" y1="390" x2="310" y2="402" stroke="rgba(255,180,40,0.07)" strokeWidth="1"/>
 
          {/* Microphone stand */}
          <line x1="190" y1="295" x2="190" y2="390" stroke="#4a3820" strokeWidth="3" strokeLinecap="round"/>
          <line x1="165" y1="385" x2="215" y2="385" stroke="#4a3820" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="165" y1="385" x2="155" y2="395" stroke="#4a3820" strokeWidth="3" strokeLinecap="round"/>
          <line x1="215" y1="385" x2="225" y2="395" stroke="#4a3820" strokeWidth="3" strokeLinecap="round"/>
 
          {/* Mic head */}
          <ellipse cx="190" cy="278" rx="14" ry="20" fill="#2e2416" stroke="#7a6040" strokeWidth="1.5"/>
          <ellipse cx="190" cy="278" rx="10" ry="15" fill="none" stroke="rgba(255,200,80,0.2)" strokeWidth="0.8"/>
          {/* Mic grille lines */}
          <line x1="176" y1="272" x2="204" y2="272" stroke="rgba(255,200,80,0.18)" strokeWidth="0.8"/>
          <line x1="176" y1="278" x2="204" y2="278" stroke="rgba(255,200,80,0.18)" strokeWidth="0.8"/>
          <line x1="176" y1="284" x2="204" y2="284" stroke="rgba(255,200,80,0.18)" strokeWidth="0.8"/>
          {/* Mic shine */}
          <ellipse cx="185" cy="272" rx="3" ry="5" fill="rgba(255,240,180,0.12)"/>
 
          {/* Comedian figure — stick figure stylized */}
          {/* Body */}
          <line x1="190" y1="320" x2="190" y2="360" stroke="#c8a060" strokeWidth="4" strokeLinecap="round"/>
          {/* Head */}
          <circle cx="190" cy="308" r="13" fill="#c8a060"/>
          {/* Face — happy */}
          <circle cx="185" cy="306" r="2" fill="#0f0d0a"/>
          <circle cx="195" cy="306" r="2" fill="#0f0d0a"/>
          <path d="M184 313 Q190 318 196 313" stroke="#0f0d0a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          {/* Arms */}
          <line x1="190" y1="328" x2="168" y2="342" stroke="#c8a060" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="190" y1="328" x2="212" y2="318" stroke="#c8a060" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Legs */}
          <line x1="190" y1="360" x2="176" y2="388" stroke="#c8a060" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="190" y1="360" x2="204" y2="388" stroke="#c8a060" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Hat */}
          <ellipse cx="190" cy="296" rx="16" ry="4" fill="#2a1a08"/>
          <rect x="181" y="278" width="18" height="18" rx="2" fill="#2a1a08"/>
 
          {/* "Ha ha ha" laugh text floating */}
          <text x="220" y="300" fontFamily="Georgia, serif" fontSize="11" fill="rgba(255,200,80,0.5)" fontStyle="italic">ha!</text>
          <text x="228" y="287" fontFamily="Georgia, serif" fontSize="9"  fill="rgba(255,200,80,0.35)" fontStyle="italic">ha ha</text>
          <text x="140" y="292" fontFamily="Georgia, serif" fontSize="10" fill="rgba(255,200,80,0.4)"  fontStyle="italic">lol</text>
          <text x="132" y="308" fontFamily="Georgia, serif" fontSize="8"  fill="rgba(255,200,80,0.25)" fontStyle="italic">😂</text>
        </svg>
 
        {/* Brand at bottom */}
        <div className="auth-brand">
          <div className="auth-brand-name">
            <span className="auth-brand-dot" />
            JokeBox
          </div>
          <p className="auth-brand-tagline">where punchlines live</p>
        </div>
      </div>
 
      {/* ── RIGHT: Auth Form ── */}
      <div className="auth-right">
        <button className="close-btn" onClick={() => navigate("/", { replace: true })}>×</button>
 
        <h2>{isLogin ? "Welcome back" : "Join the fun"}</h2>
        <p className="auth-subtitle">
          {isLogin ? "Sign in to your account" : "Create your JokeBox account"}
        </p>
 
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>
 
        <p className="switch-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register" : " Login"}
          </span>
        </p>
 
        <div className="auth-divider">or</div>
 
        <button className="guest-btn" onClick={handleGuestMode}>
          Continue as Guest
        </button>
      </div>
 
    </div>
  </div>
);
}