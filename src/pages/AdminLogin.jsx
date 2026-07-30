import { useState } from "react";
import { login } from "../api/auth";

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await login(form);
      const { token, email, role, userId } = res.data;
      if (role !== "ROLE_ADMIN") {
        setMsg("Access denied. Admin only.");
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
      onLogin({ email, token, role, userId });
    } catch (err) {
      setMsg(err.response?.data || "Login failed");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#16261F", color: "#F3F1E7", fontFamily: "Inter, sans-serif"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#1E332A", border: "1px solid #33513F", borderRadius: 20,
        padding: 40, width: "100%", maxWidth: 400
      }}>
        <h1 style={{ fontFamily: "'Kalam', cursive", fontSize: 28, marginBottom: 4 }}>Admin Login</h1>
        <p style={{ color: "#A9BBAF", fontSize: 14, marginBottom: 24 }}>codewith_kk notes panel</p>
        {msg && <div style={{ color: "#ff5f56", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(255,95,86,0.15)", borderRadius: 6 }}>{msg}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#A9BBAF", display: "block", marginBottom: 4 }}>EMAIL</label>
          <input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "#243D32", border: "1px solid #33513F", color: "#F3F1E7", fontSize: 14, outline: "none" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, color: "#A9BBAF", display: "block", marginBottom: 4 }}>PASSWORD</label>
          <input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "#243D32", border: "1px solid #33513F", color: "#F3F1E7", fontSize: 14, outline: "none" }} />
        </div>
        <button type="submit" style={{
          width: "100%", padding: 12, borderRadius: 8, background: "#E8C468", color: "#16261F",
          fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer"
        }}>Sign In</button>
      </form>
    </div>
  );
}
