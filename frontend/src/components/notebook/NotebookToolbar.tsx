"use client";

import { useState } from "react";
import { Connection } from "@/lib/types";

interface NotebookToolbarProps {
  title: string;
  connections: Connection[];
  selectedConnectionId?: number;
  onUpdateTitle: (title: string) => void;
  onSelectConnection: (connectionId?: number) => void;
  onAddCell: (cellType: "sql" | "code" | "markdown") => void;
  onRunAll: () => void;
  onToggleHistory?: () => void;
}

export default function NotebookToolbar({
  title,
  connections,
  selectedConnectionId,
  onUpdateTitle,
  onSelectConnection,
  onAddCell,
  onRunAll,
  onToggleHistory,
}: NotebookToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (currentTitle.trim() && currentTitle !== title) {
      onUpdateTitle(currentTitle.trim());
    }
  };

  return (
    <div
      className="card-glass"
      style={{
        padding: "16px 24px",
        marginBottom: "24px",
        display: "flex",
        justify-content: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "20px" }}>📓</span>
        {isEditingTitle ? (
          <input
            type="text"
            className="input"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
            autoFocus
            style={{ fontSize: "18px", fontWeight: 600, padding: "4px 8px" }}
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            style={{ fontSize: "20px", color: "#f1f5f9", cursor: "pointer" }}
            title="Click to edit title"
          >
            {title} ✏️
          </h2>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Connection Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>Connection:</span>
          <select
            className="input"
            value={selectedConnectionId || ""}
            onChange={(e) =>
              onSelectConnection(e.target.value ? parseInt(e.target.value) : undefined)
            }
            style={{ width: "200px", padding: "6px 12px", fontSize: "13px" }}
          >
            <option value="">-- No Connection --</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.engine})
              </option>
            ))}
          </select>
        </div>

        {/* Add Cell Buttons */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onAddCell("sql")}
        >
          + SQL Cell
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onAddCell("markdown")}
        >
          + Markdown Cell
        </button>

        {/* History button */}
        {onToggleHistory && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onToggleHistory}
            title="View query execution history"
          >
            📜 History
          </button>
        )}

        {/* Run All */}
        <button className="btn btn-primary btn-sm" onClick={onRunAll}>
          ▶▶ Run All
        </button>
      </div>
    </div>
  );
}
