"use client";

import { useEffect, useState, useCallback } from "react";
import { QueryHistoryItem } from "@/lib/types";
import { getQueryHistoryApi, clearQueryHistoryApi } from "@/lib/api";

interface QueryHistoryProps {
  notebookId?: number;
  onClose: () => void;
  onInsertQuery?: (queryText: string) => void;
}

export default function QueryHistory({
  notebookId,
  onClose,
  onInsertQuery,
}: QueryHistoryProps) {
  const [historyItems, setHistoryItems] = useState<QueryHistoryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getQueryHistoryApi(
        notebookId,
        statusFilter === "all" ? undefined : statusFilter
      );
      setHistoryItems(data);
    } catch {
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [notebookId, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    if (!confirm("Clear query execution history logs?")) return;
    try {
      await clearQueryHistoryApi(notebookId);
      setHistoryItems([]);
    } catch {
      alert("Failed to clear history.");
    }
  };

  const copyQuery = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "420px",
        height: "100vh",
        background: "rgba(15,18,30,0.95)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justify-content: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>📜</span>
          <h3 style={{ fontSize: "16px", color: "#f1f5f9" }}>Query Execution History</h3>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Filter & Clear Bar */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justify-content: "space-between",
          gap: "8px",
        }}
      >
        {/* Status filter pills */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "success", "error"].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter(st)}
              style={{ fontSize: "11px", textTransform: "capitalize", padding: "3px 8px" }}
            >
              {st}
            </button>
          ))}
        </div>

        {historyItems.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClearHistory}
            style={{ fontSize: "11px", color: "#ef4444" }}
          >
            Clear History
          </button>
        )}
      </div>

      {/* History Items List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {isLoading ? (
          <div style={{ color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="spinner" /> Loading history…
          </div>
        ) : historyItems.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", fontSize: "13px", padding: "40px 0" }}>
            No query execution logs found.
          </div>
        ) : (
          historyItems.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                marginBottom: "12px",
                padding: "12px 14px",
                borderLeft: item.status === "success" ? "3px solid #10b981" : "3px solid #ef4444",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {/* Card Meta Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justify-content: "space-between",
                  marginBottom: "8px",
                  fontSize: "11px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    className={`badge ${item.status === "success" ? "badge-emerald" : "badge-red"}`}
                    style={{ fontSize: "9px", padding: "1px 5px" }}
                  >
                    {item.status}
                  </span>
                  <span style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                    {item.engine}
                  </span>
                </div>

                <span style={{ color: "#64748b" }}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>

              {/* Query Text Code Block */}
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "#e2e8f0",
                  background: "rgba(0,0,0,0.3)",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "100px",
                  overflowY: "auto",
                  margin: "0 0 8px 0",
                }}
              >
                {item.query_text}
              </pre>

              {/* Error snippet if failed */}
              {item.error_message && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#fca5a5",
                    background: "rgba(239,68,68,0.1)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    marginBottom: "8px",
                    wordBreak: "break-word",
                  }}
                >
                  {item.error_message}
                </div>
              )}

              {/* Bottom Actions Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justify-content: "space-between",
                  fontSize: "11px",
                  color: "#64748b",
                }}
              >
                <span>
                  ⏱ {item.execution_time_ms} ms · {item.row_count} rows
                </span>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "11px", padding: "2px 6px" }}
                    onClick={() => copyQuery(item.id, item.query_text)}
                  >
                    {copiedId === item.id ? "✓ Copied" : "📋 Copy"}
                  </button>

                  {onInsertQuery && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "11px", padding: "2px 6px" }}
                      onClick={() => onInsertQuery(item.query_text)}
                    >
                      📥 Insert
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
