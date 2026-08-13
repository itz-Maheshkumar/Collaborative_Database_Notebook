"use client";

import { useState } from "react";

interface AuditLogEntry {
  id: number;
  user_id: number;
  user_email: string;
  engine: string;
  query_text: string;
  status: string;
  row_count: number;
  execution_time_ms: number;
  error_message?: string;
  created_at: string;
}

interface AuditLogsProps {
  items: AuditLogEntry[];
  total: number;
  onFilterChange: (status?: string) => void;
  onPageChange: (offset: number) => void;
  currentOffset: number;
  pageSize: number;
  isLoading?: boolean;
}

const ENGINE_COLORS: Record<string, string> = {
  postgresql: "#3b82f6",
  mysql:      "#f59e0b",
  sqlite:     "#10b981",
  mongodb:    "#22c55e",
};

export default function AuditLogs({
  items,
  total,
  onFilterChange,
  onPageChange,
  currentOffset,
  pageSize,
  isLoading,
}: AuditLogsProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    onFilterChange(s === "all" ? undefined : s);
    onPageChange(0);
  };

  const currentPage = Math.floor(currentOffset / pageSize) + 1;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "success", "error"].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
              onClick={() => handleStatusFilter(st)}
              style={{ fontSize: "11px", textTransform: "capitalize", padding: "4px 10px" }}
            >
              {st}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          {total} total log{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Log table */}
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "rgba(15,18,30,0.9)" }}>
              {["Time", "User", "Engine", "Status", "Duration", "Rows", "Query"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    color: "#64748b",
                    fontSize: "10px",
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
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: "28px", textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <div className="spinner" /> Loading logs…
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "28px", textAlign: "center", color: "#64748b" }}>
                  No audit logs found
                </td>
              </tr>
            ) : (
              items.map((entry, idx) => (
                <>
                  <tr
                    key={entry.id}
                    style={{
                      background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      cursor: "pointer",
                      borderLeft: entry.status === "error" ? "2px solid #ef444440" : "2px solid transparent",
                    }}
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    {/* Time */}
                    <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {new Date(entry.created_at).toLocaleString([], {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    {/* User */}
                    <td style={{ padding: "10px 14px", color: "#94a3b8", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.user_email}
                    </td>

                    {/* Engine */}
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        className="badge"
                        style={{
                          background: `${ENGINE_COLORS[entry.engine] || "#6366f1"}20`,
                          color: ENGINE_COLORS[entry.engine] || "#6366f1",
                          fontSize: "9px",
                        }}
                      >
                        {entry.engine}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 14px" }}>
                      <span className={`badge ${entry.status === "success" ? "badge-emerald" : "badge-red"}`} style={{ fontSize: "9px" }}>
                        {entry.status}
                      </span>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      {entry.execution_time_ms} ms
                    </td>

                    {/* Rows */}
                    <td style={{ padding: "10px 14px", color: "#94a3b8", textAlign: "center" }}>
                      {entry.row_count}
                    </td>

                    {/* Query snippet */}
                    <td style={{ padding: "10px 14px", color: "#cbd5e1", fontFamily: "var(--font-mono)", fontSize: "11px", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.query_text}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === entry.id && (
                    <tr key={`${entry.id}-detail`} style={{ background: "rgba(0,0,0,0.3)" }}>
                      <td colSpan={7} style={{ padding: "12px 14px 16px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                          Full query — user #{entry.user_id}
                        </div>
                        <pre
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "#e2e8f0",
                            background: "rgba(0,0,0,0.4)",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            margin: 0,
                          }}
                        >
                          {entry.query_text}
                        </pre>
                        {entry.error_message && (
                          <div style={{ marginTop: "8px", fontSize: "12px", color: "#fca5a5", background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: "6px" }}>
                            {entry.error_message}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentOffset === 0}
            onClick={() => onPageChange(Math.max(0, currentOffset - pageSize))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentOffset + pageSize >= total}
            onClick={() => onPageChange(currentOffset + pageSize)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
