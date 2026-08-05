"use client";

import { useState } from "react";
import { Connection, ConnectionTestResult } from "@/lib/types";
import { deleteConnectionApi, testConnectionApi } from "@/lib/api";

interface ConnectionListProps {
  connections: Connection[];
  onRefresh: () => void;
}

const ENGINE_CONFIG: Record<string, { label: string; icon: string; colorClass: string }> = {
  postgresql: { label: "PostgreSQL", icon: "🐘", colorClass: "badge-indigo" },
  mysql: { label: "MySQL", icon: "🐬", colorClass: "badge-indigo" },
  mongodb: { label: "MongoDB", icon: "🍃", colorClass: "badge-emerald" },
  sqlite: { label: "SQLite", icon: "📦", colorClass: "badge-amber" },
};

export default function ConnectionList({ connections, onRefresh }: ConnectionListProps) {
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, ConnectionTestResult>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleTest = async (conn: Connection) => {
    setTestingId(conn.id);
    try {
      const res = await testConnectionApi({
        engine: conn.engine,
        host: conn.host,
        port: conn.port,
        database_name: conn.database_name,
        username: conn.username,
      });
      setTestResults((prev) => ({ ...prev, [conn.id]: res }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test failed";
      setTestResults((prev) => ({ ...prev, [conn.id]: { success: false, message: msg } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this database connection?")) return;
    setDeletingId(id);
    try {
      await deleteConnectionApi(id);
      onRefresh();
    } catch {
      alert("Failed to delete connection.");
    } finally {
      setDeletingId(null);
    }
  };

  if (connections.length === 0) {
    return (
      <div
        className="card-glass"
        style={{
          padding: "48px 24px",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔌</div>
        <h4 style={{ color: "#f1f5f9", marginBottom: "6px" }}>No Saved Connections</h4>
        <p style={{ fontSize: "14px", maxWidth: "380px", margin: "0 auto" }}>
          Add your first database connection to start writing and running query notebooks.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
      {connections.map((conn) => {
        const config = ENGINE_CONFIG[conn.engine] || {
          label: conn.engine,
          icon: "🗄️",
          colorClass: "badge-indigo",
        };
        const testRes = testResults[conn.id];

        return (
          <div key={conn.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span className={`badge ${config.colorClass}`}>
                  {config.icon} {config.label}
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  ID: #{conn.id}
                </span>
              </div>

              <h3 style={{ fontSize: "16px", color: "#f1f5f9", marginBottom: "6px" }}>
                {conn.name}
              </h3>

              <p style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                {conn.engine === "sqlite"
                  ? conn.database_name || ":memory:"
                  : `${conn.username || "user"}@${conn.host}:${conn.port || ""}/${conn.database_name || ""}`}
              </p>
            </div>

            <div style={{ marginTop: "16px" }}>
              {testRes && (
                <div
                  className={`alert ${testRes.success ? "alert-success" : "alert-error"}`}
                  style={{ padding: "6px 10px", fontSize: "12px", marginBottom: "12px" }}
                >
                  {testRes.message}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTest(conn)}
                  disabled={testingId === conn.id}
                >
                  {testingId === conn.id ? <><div className="spinner" /> Testing…</> : "Test"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(conn.id)}
                  disabled={deletingId === conn.id}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
