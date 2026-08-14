"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Notebook } from "@/lib/types";
import { getNotebooksApi, createNotebookApi, deleteNotebookApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function NotebooksPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const loadNotebooks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getNotebooksApi();
      setNotebooks(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load notebooks.");
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
    loadNotebooks();
  }, [router]);

  const handleCreateNotebook = async () => {
    setIsCreating(true);
    try {
      const newNotebook = await createNotebookApi({
        title: "Untitled Notebook",
      });
      router.push(`/notebooks/${newNotebook.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create notebook.");
      }
      setIsCreating(false);
    }
  };

  const handleDeleteNotebook = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this notebook?")) return;

    try {
      await deleteNotebookApi(id);
      loadNotebooks();
    } catch {
      alert("Failed to delete notebook.");
    }
  };

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
                My Notebooks
              </h1>
              <p style={{ fontSize: "14px", color: "#94a3b8" }}>
                Create, organize, and execute query cells across multiple database engines.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCreateNotebook}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "+ New Notebook"}
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8" }}>
              <div className="spinner" /> Loading notebooks...
            </div>
          ) : notebooks.length === 0 ? (
            <div
              className="card-glass"
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📓</div>
              <h4 style={{ color: "#f1f5f9", marginBottom: "6px" }}>No Notebooks Created Yet</h4>
              <p style={{ fontSize: "14px", maxWidth: "380px", margin: "0 auto 20px" }}>
                Get started by creating your first interactive database query notebook.
              </p>
              <button className="btn btn-primary" onClick={handleCreateNotebook}>
                Create Notebook
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className="card"
                  onClick={() => router.push(`/notebooks/${nb.id}`)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="badge badge-indigo">📓 Notebook</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => handleDeleteNotebook(nb.id, e)}
                        style={{ color: "#ef4444", padding: "2px 6px" }}
                      >
                        🗑
                      </button>
                    </div>

                    <h3 style={{ fontSize: "16px", color: "#f1f5f9", marginBottom: "6px" }}>
                      {nb.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                      {nb.description || "No description provided."}
                    </p>
                  </div>

                  <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                    <span>{nb.cells ? nb.cells.length : 0} Cells</span>
                    <span>Updated {new Date(nb.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
