"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NotebookCell } from "@/lib/types";

// Dynamic import for Monaco Editor to avoid SSR window issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CellEditorProps {
  cell: NotebookCell;
  index: number;
  onUpdateContent: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onRun: (cell: NotebookCell) => void;
}

export default function CellEditor({
  cell,
  index,
  onUpdateContent,
  onDelete,
  onRun,
}: CellEditorProps) {
  const [content, setContent] = useState(cell.content);

  const handleEditorChange = (value?: string) => {
    const val = value || "";
    setContent(val);
    onUpdateContent(cell.id, val);
  };

  const getLanguage = () => {
    if (cell.cell_type === "sql") return "sql";
    if (cell.cell_type === "markdown") return "markdown";
    return "javascript";
  };

  return (
    <div
      className="card-glass"
      style={{
        marginBottom: "16px",
        overflow: "hidden",
        borderLeft:
          cell.status === "running"
            ? "3px solid #6366f1"
            : cell.status === "success"
            ? "3px solid #10b981"
            : cell.status === "error"
            ? "3px solid #ef4444"
            : "3px solid transparent",
      }}
    >
      {/* Cell Header / Action Bar */}
      <div
        style={{
          display: "flex",
          justify-content: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "#64748b" }}>
            [{index + 1}]
          </span>
          <span className="badge badge-indigo" style={{ textTransform: "uppercase" }}>
            {cell.cell_type}
          </span>
          {cell.execution_time_ms !== undefined && cell.execution_time_ms !== null && (
            <span style={{ fontSize: "11px", color: "#10b981", fontFamily: "var(--font-mono)" }}>
              ⏱ {cell.execution_time_ms}ms
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onRun({ ...cell, content })}
            disabled={cell.status === "running"}
            title="Run Query (Ctrl + Enter)"
          >
            {cell.status === "running" ? (
              <><div className="spinner" /> Running…</>
            ) : (
              <>▶ Run</>
            )}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onDelete(cell.id)}
            title="Delete Cell"
            style={{ color: "#ef4444" }}
          >
            🗑
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ padding: "8px 0" }}>
        <Editor
          height="140px"
          language={getLanguage()}
          theme="vs-dark"
          value={content}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
