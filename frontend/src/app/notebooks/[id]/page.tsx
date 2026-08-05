"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import NotebookToolbar from "@/components/notebook/NotebookToolbar";
import CellEditor from "@/components/notebook/CellEditor";
import { Notebook, Connection, NotebookCell } from "@/lib/types";
import {
  getNotebookApi,
  updateNotebookApi,
  addCellApi,
  updateCellApi,
  deleteCellApi,
  getConnectionsApi,
} from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function NotebookWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = parseInt(params.id as string);

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [nbData, connData] = await Promise.all([
        getNotebookApi(notebookId),
        getConnectionsApi(),
      ]);
      setNotebook(nbData);
      setConnections(connData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load notebook workspace.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (notebookId) {
      loadData();
    }
  }, [notebookId, router, loadData]);

  const handleUpdateTitle = async (newTitle: string) => {
    if (!notebook) return;
    try {
      const updated = await updateNotebookApi(notebook.id, { title: newTitle });
      setNotebook((prev) => (prev ? { ...prev, title: updated.title } : null));
    } catch {
      alert("Failed to update notebook title.");
    }
  };

  const handleSelectConnection = async (connId?: number) => {
    if (!notebook) return;
    try {
      const updated = await updateNotebookApi(notebook.id, { connection_id: connId });
      setNotebook((prev) => (prev ? { ...prev, connection_id: updated.connection_id } : null));
    } catch {
      alert("Failed to switch connection.");
    }
  };

  const handleAddCell = async (cellType: "sql" | "code" | "markdown") => {
    if (!notebook) return;
    const nextPos = notebook.cells ? notebook.cells.length : 0;
    try {
      const newCell = await addCellApi(notebook.id, {
        position: nextPos,
        cell_type: cellType,
        content: cellType === "sql" ? "SELECT 1;" : "# Markdown Header",
      });
      setNotebook((prev) =>
        prev ? { ...prev, cells: [...prev.cells, newCell] } : null
      );
    } catch {
      alert("Failed to add cell.");
    }
  };

  const handleUpdateCellContent = async (cellId: number, content: string) => {
    if (!notebook) return;
    // Local state update immediately
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            cells: prev.cells.map((c) => (c.id === cellId ? { ...c, content } : c)),
          }
        : null
    );

    // Debounced or direct API update
    try {
      await updateCellApi(notebook.id, cellId, { content });
    } catch {
      // Silently catch or handle offline save state
    }
  };

  const handleDeleteCell = async (cellId: number) => {
    if (!notebook) return;
    try {
      await deleteCellApi(notebook.id, cellId);
      setNotebook((prev) =>
        prev
          ? {
              ...prev,
              cells: prev.cells.filter((c) => c.id !== cellId),
            }
          : null
      );
    } catch {
      alert("Failed to delete cell.");
    }
  };

  const handleRunCell = async (cell: NotebookCell) => {
    if (!notebook) return;
    // Set cell status to running
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            cells: prev.cells.map((c) =>
              c.id === cell.id ? { ...c, status: "running" } : c
            ),
          }
        : null
    );

    // Placeholder run (Will be wired to Query Engine in Module 5)
    setTimeout(() => {
      setNotebook((prev) =>
        prev
          ? {
              ...prev,
              cells: prev.cells.map((c) =>
                c.id === cell.id
                  ? {
                      ...c,
                      status: "success",
                      execution_time_ms: 12,
                      last_output: JSON.stringify(
                        [{ message: "Query Engine will execute live queries in Module 5!" }],
                        null,
                        2
                      ),
                    }
                  : c
              ),
            }
          : null
      );
    }, 600);
  };

  const handleRunAll = () => {
    if (!notebook || !notebook.cells) return;
    notebook.cells.forEach((cell) => handleRunCell(cell));
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d14" }}>
        <Navbar />
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "32px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="spinner" /> Loading notebook workspace…
          </main>
        </div>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d14" }}>
        <Navbar />
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "32px" }}>
            <div className="alert alert-error">{error || "Notebook not found."}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14" }}>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <main style={{ flex: 1, padding: "24px 32px", maxWidth: "1200px" }}>
          {/* Toolbar Header */}
          <NotebookToolbar
            title={notebook.title}
            connections={connections}
            selectedConnectionId={notebook.connection_id}
            onUpdateTitle={handleUpdateTitle}
            onSelectConnection={handleSelectConnection}
            onAddCell={handleAddCell}
            onRunAll={handleRunAll}
          />

          {/* Cells List */}
          {notebook.cells.map((cell, idx) => (
            <div key={cell.id}>
              <CellEditor
                cell={cell}
                index={idx}
                onUpdateContent={handleUpdateCellContent}
                onDelete={handleDeleteCell}
                onRun={handleRunCell}
              />

              {/* Inline Output Box */}
              {cell.last_output && (
                <div
                  className="code-block"
                  style={{
                    marginTop: "-8px",
                    marginBottom: "20px",
                    background: "rgba(15,18,30,0.9)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>OUTPUT</div>
                  <pre>{cell.last_output}</pre>
                </div>
              )}
            </div>
          ))}

          {/* Bottom Add Cell Bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleAddCell("sql")}>
              + Add SQL Cell
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleAddCell("markdown")}>
              + Add Markdown Cell
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
