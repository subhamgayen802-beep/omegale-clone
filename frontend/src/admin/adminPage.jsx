import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../axios";
import React from "react";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user]);

  useEffect(() => {
    if (tab === "dashboard") loadStats();
    if (tab === "users") loadUsers();
  }, [tab, page]);

  const loadStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users?page=${page}`);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id, isBanned) => {
    try {
      const endpoint = isBanned
        ? `/admin/users/${id}/unban`
        : `/admin/users/${id}/ban`;
      await api.patch(endpoint);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={s.page}>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <h2 style={s.logo}> Admin</h2>
        <button
          onClick={() => setTab("dashboard")}
          style={{ ...s.navBtn, ...(tab === "dashboard" ? s.navActive : {}) }}
        >
           Dashboard
        </button>
        <button
          onClick={() => setTab("users")}
          style={{ ...s.navBtn, ...(tab === "users" ? s.navActive : {}) }}
        >
          👥 Users
        </button>
        <button
          onClick={() => navigate("/")}
          style={{ ...s.navBtn, marginTop: "auto" }}
        >
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <div style={s.main}>

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <div style={s.statsGrid}>
              <StatCard
                label="Total Users"
                value={stats?.totalUsers ?? "..."}
                color="#2563eb"
                icon="👥"
              />
              <StatCard
                label="Active Users"
                value={stats?.activeUsers ?? "..."}
                color="#22c55e"
                icon="✅"
              />
              <StatCard
                label="Banned Users"
                value={stats?.bannedUsers ?? "..."}
                color="#dc2626"
                icon="🚫"
              />
              <StatCard
                label="Today's New"
                value={stats?.todayUsers ?? "..."}
                color="#f59e0b"
                icon="🆕"
              />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div>
            <h1 style={s.title}>Users</h1>

            {loading ? (
              <p style={{ color: "#666" }}>Loading...</p>
            ) : (
              <>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Name", "Email", "Role", "Status", "Actions"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={s.tr}>
                        <td style={s.td}>{u.firstName}</td>
                        <td style={s.td}>{u.emailId}</td>
                        <td style={s.td}>{u.role}</td>
                        <td style={s.td}>
                          <span style={{
                            ...s.badge,
                            background: u.banned ? "#dc262622" : "#22c55e22",
                            color: u.banned ? "#dc2626" : "#22c55e"
                          }}>
                            {u.banned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td style={s.td}>
                          <button
                            onClick={() => handleBan(u._id, u.banned)}
                              style={{
                                   width: 80,         
                                   padding: "6px 0", 
                                   borderRadius: 8,
                                   border: "none",
                                   fontSize: 13,
                                   cursor: "pointer",
                                   fontWeight: 600,
                                   textAlign: "center",
                                   background: u.banned ? "#22c55e22" : "#f59e0b22",
                                   color: u.banned ? "#22c55e" : "#f59e0b",
                                 }}
                          >
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            style={{
                              ...s.actionBtn,
                              background: "#dc262622",
                              color: "#dc2626",
                              marginLeft: 8
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={s.pagination}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={s.pageBtn}
                  >
                    ← Prev
                  </button>
                  <span style={{ color: "#666" }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={s.pageBtn}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...s.card, borderTop: `3px solid ${color}` }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>
        {value}
      </div>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
    </div>
  );
}
// styles
const s = {
  page: {
    minHeight: "100vh",
    background: "#080808",
    display: "flex",
    fontFamily: "system-ui, sans-serif",
    color: "#fff",
  },
  sidebar: {
    width: 220,
    background: "#0d0d0d",
    borderRight: "1px solid #1a1a1a",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 24,
  },
  navBtn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#666",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  navActive: {
    background: "#1a1a1a",
    color: "#fff",
  },
  main: {
    flex: 1,
    padding: 32,
    overflowY: "auto",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    color: "#666",
    fontSize: 13,
    borderBottom: "1px solid #1a1a1a",
  },
  tr: {
    borderBottom: "1px solid #111",
  },
  td: {
    padding: "12px 16px",
    fontSize: 14,
    color: "#ccc",
  },
  badge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  actionBtn: { 
    padding: "5px 12px",
    borderRadius: 6,
    border: "none",               
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
  pageBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "transparent",
    color: "#ccc",
    cursor: "pointer",
  },
};