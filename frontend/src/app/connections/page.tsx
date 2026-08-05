"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ConnectionList from "@/components/connection/ConnectionList";
import ConnectionForm from "@/components/connection/ConnectionForm";
import { Connection } from "@/lib/types";
import { getConnectionsApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadConnections = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getConnectionsApi();
      setConnections(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load connections.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadConnections();
  }, [router]);

  const filteredConnections = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.engine.toLowerCase().includes(search.toLowerCase()) ||
      (c.database_name && c.database_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14" }}>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <main style={{ flex: 1, padding: "32px", maxWidth: "1200px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <div>
              <h1 style={{ fontSize: "24px", color: "#f1f5f9", marginBottom: "4px" }}>
                Database Connections
              </h1>
              <p style={{ fontSize: "14px", color: "#94a3b8" }}>
                Manage saved database credentials for PostgreSQL, MySQL, MongoDB &amp; SQLite.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Add Connection
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          {/* Add Connection Modal / Form Overlay */}
          {showForm && (
            <div style={{ marginBottom: "28px" }}>
              <ConnectionForm
                onSuccess={() => {
                  setShowForm(false);
                  loadConnections();
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Search bar */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search connections by name, engine, or database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
          </div>

          {/* List */}
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8" }}>
              <div className="spinner" /> Loading connections…
            </div>
          ) : (
            <ConnectionList
              connections={filteredConnections}
              onRefresh={loadConnections}
            />
          )}
        </main>
      </div>
    </div>
  );
}
