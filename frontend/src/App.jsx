import { useEffect } from "react";
import socket from "./socket";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/home";
import Login from "./pages/AuthModal";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthModal from "./pages/AuthModal";

function App() {

  useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  if (!socket.connected) {
    socket.connect();
  }

  const handleConnect = () => {
    socket.emit("initUser", userId);
  };

  socket.on("connect", handleConnect);

  if (socket.connected) {
    socket.emit("initUser", userId);
  }

  return () => socket.off("connect", handleConnect);
}, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={<AuthModal onClose={() => navigate("/", { replace: true })} />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        
        {/* <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        /> */}

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
