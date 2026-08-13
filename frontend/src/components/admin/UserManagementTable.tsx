"use client";

import { useState } from "react";

interface AdminUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  notebook_count: number;
  connection_count: number;
  query_count: number;
}

interface UserManagementTableProps {
  users: AdminUser[];
  onUpdate: (userId: number, role?: string, is_active?: boolean) => Promise<void>;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#ef4444",
  user:  "#6366f1",
};

export default function UserManagementTable({ users, onUpdate }: UserManagementTableProps) {
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingId(userId);
    try {
      await onUpdate(userId, newRole);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (userId: number, current: boolean) => {
    setUpdatingId(userId);
    try {
      await onUpdate(userId, undefined, !current);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          className="input"
          placeholder="Search users by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "340px" }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "rgba(15,18,30,0.9)" }}>
              {["User", "Role", "Status", "Notebooks", "Connections", "Queries", "Joined", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "28px", textAlign: "center", color: "#64748b" }}>
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* User info */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 500, color: "#f1f5f9" }}>
                      {user.full_name || user.email.split("@")[0]}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                      {user.email}
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      className="input"
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "12px",
                        width: "90px",
                        color: ROLE_COLORS[user.role] || "#94a3b8",
                        background: `${ROLE_COLORS[user.role] || "#6366f1"}10`,
                        border: `1px solid ${ROLE_COLORS[user.role] || "#6366f1"}30`,
                      }}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>

                  {/* Active status */}
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      className={`badge ${user.is_active ? "badge-emerald" : "badge-red"}`}
                      style={{ fontSize: "10px" }}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Stats */}
                  <td style={{ padding: "12px 16px", color: "#94a3b8", textAlign: "center" }}>{user.notebook_count}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", textAlign: "center" }}>{user.connection_count}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", textAlign: "center" }}>{user.query_count}</td>

                  {/* Joined date */}
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      className={`btn btn-sm ${user.is_active ? "btn-secondary" : "btn-primary"}`}
                      style={{ fontSize: "11px", padding: "3px 10px" }}
                      disabled={updatingId === user.id}
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    >
                      {updatingId === user.id ? "…" : user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "10px" }}>
        {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
