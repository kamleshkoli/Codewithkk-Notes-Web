import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { getMe } from "./api/auth";
import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";

function getUserFromStorage() {
  return {
    email: localStorage.getItem("email") || null,
    token: localStorage.getItem("token") || null,
    role: localStorage.getItem("role") || null,
    userId: localStorage.getItem("userId") || null,
  };
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserFromStorage);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getMe()
      .then((res) => {
        const me = res.data;
        localStorage.setItem("userId", me.id);
        localStorage.setItem("email", me.email);
        localStorage.setItem("role", me.role);
        setUser({ token, email: me.email, role: me.role, userId: me.id });
      })
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setUser({ email: null, token: null, role: null, userId: null });
    navigate("/");
  }, [navigate]);

  const handleAdminLogin = useCallback((adminUser) => {
    setUser(adminUser);
    navigate("/admin/dashboard");
  }, [navigate]);

  const handleNavigate = useCallback((page) => {
    if (page === "dashboard") navigate("/dashboard");
    else if (page === "profile") navigate("/profile");
    else if (page === "admin") navigate("/admin");
    else if (page === "adminDashboard") navigate("/admin/dashboard");
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={
        <LandingPage user={user} setUser={setUser} onNavigate={handleNavigate} />
      } />
      <Route path="/dashboard" element={
        <UserDashboard user={user} onBack={() => navigate("/")} />
      } />
      <Route path="/profile" element={
        <UserProfile user={user} onBack={() => navigate("/")} />
      } />
      <Route path="/admin" element={
        <AdminLogin onLogin={handleAdminLogin} />
      } />
      <Route path="/admin/dashboard" element={
        user.role === "ROLE_ADMIN"
          ? <AdminDashboard user={user} onLogout={handleLogout} />
          : <AdminLogin onLogin={handleAdminLogin} />
      } />
    </Routes>
  );
}
