import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../api/user";

const styles = {
  root: {
    minHeight: "100vh", background: "#16261F", color: "#F3F1E7",
    fontFamily: "Inter, sans-serif", padding: "0 24px 48px"
  },
  wrap: { maxWidth: 600, margin: "0 auto" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 0", borderBottom: "1px solid #33513F", marginBottom: 32
  },
  card: {
    background: "#1E332A", border: "1px solid #33513F", borderRadius: 20, padding: 32
  },
  field: { marginBottom: 20 },
  label: { fontSize: 11, color: "#A9BBAF", display: "block", marginBottom: 4 },
  value: { fontSize: 15, fontWeight: 600 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "#243D32", border: "1px solid #33513F",
    color: "#F3F1E7", fontSize: 14, outline: "none"
  },
  btn: {
    padding: "10px 24px", borderRadius: 8, background: "#E8C468",
    color: "#16261F", fontWeight: 700, fontSize: 14, border: "none",
    cursor: "pointer", marginRight: 12
  },
  backBtn: {
    background: "transparent", border: "1px solid #33513F",
    color: "#A9BBAF", padding: "8px 16px", borderRadius: 8,
    cursor: "pointer", fontSize: 13
  },
  badge: (yes) => ({
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600,
    background: yes ? "rgba(39,201,63,0.15)" : "rgba(255,95,86,0.15)",
    color: yes ? "#27c93f" : "#ff5f56"
  })
};

export default function UserProfile({ user, onBack }) {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.userId) {
      getUserProfile(user.userId)
        .then((r) => { setProfile(r.data); setForm({ name: r.data.name, email: r.data.email }); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const r = await updateUserProfile(user.userId, { name: form.name, email: form.email });
      setProfile({ ...profile, name: form.name, email: form.email });
      setEditMode(false);
      setMsg("Profile updated");
    } catch { setMsg("Update failed"); }
  };

  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.wrap}><div style={{ color: "#A9BBAF", padding: 40 }}>Loading...</div></div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={{ fontFamily: "'Kalam', cursive", fontSize: 22 }}>My Profile</div>
          <button style={styles.backBtn} onClick={onBack}>Back</button>
        </div>

        <div style={styles.card}>
          {msg && (
            <div style={{
              fontSize: 13, padding: "8px 12px", borderRadius: 6, marginBottom: 16,
              background: msg.includes("updated") ? "rgba(39,201,63,0.15)" : "rgba(255,95,86,0.15)",
              color: msg.includes("updated") ? "#27c93f" : "#ff5f56"
            }}>{msg}</div>
          )}

          {!editMode ? (
            <>
              <div style={styles.field}>
                <span style={styles.label}>NAME</span>
                <span style={styles.value}>{profile?.name}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>EMAIL</span>
                <span style={styles.value}>{profile?.email}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>ROLE</span>
                <span style={styles.value}>{profile?.role}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>MEMBER SINCE</span>
                <span style={styles.value}>
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>ACCESS STATUS</span>
                <div style={{ marginTop: 4 }}>
                  <span style={styles.badge(profile?.hasPurchased)}>
                    {profile?.hasPurchased ? "Premium Access" : "Free Access"}
                  </span>
                </div>
              </div>
              <button style={styles.btn} onClick={() => setEditMode(true)}>Edit Profile</button>
            </>
          ) : (
            <>
              <div style={styles.field}>
                <span style={styles.label}>NAME</span>
                <input style={styles.input} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={styles.field}>
                <span style={styles.label}>EMAIL</span>
                <input style={styles.input} value={form.email} type="email"
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button style={styles.btn} onClick={handleSave}>Save</button>
                <button style={styles.backBtn} onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
