"use client";

import { QueryResult } from "@/lib/types";

interface CellOutputProps {
  output: QueryResult;
}

const PAGE_SIZE = 50;

export default function CellOutput({ output }: CellOutputProps) {
  const { success, columns, rows, row_count, execution_time_ms, error_message, engine } = output;

  /* ── Error state ─────────────────────────────────────────────── */
  if (!success) {
    return (
      <div
        style={{
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "0 0 10px 10px",
          padding: "14px 18px",
          marginTop: "-2px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#ef4444" }}>✗ Query Error</span>
          {engine && (
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "#94a3b8",
                background: "rgba(255,255,255,0.05)",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              {engine}
            </span>
          )}
        </div>
        <pre
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12.5px",
            color: "#fca5a5",
            whiteSpace: "pre-wrap",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {error_message || "An unknown error occurred."}
        </pre>
      </div>
    );
  }

  /* ── Empty / DML result ──────────────────────────────────────── */
  if (columns.length === 0) {
    return (
      <div
        style={{
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: "0 0 10px 10px",
          padding: "12px 18px",
          marginTop: "-2px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ color: "#10b981", fontSize: "13px", fontWeight: 600 }}>✓ Query OK</span>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          {row_count} row{row_count !== 1 ? "s" : ""} affected
        </span>
        <span style={{ marginLeft: "auto", fontSize: "11px", fontFamily: "var(--font-mono)", color: "#64748b" }}>
          ⏱ {execution_time_ms} ms
          {engine && ` · ${engine}`}
        </span>
      </div>
    );
  }

  /* ── Results table ───────────────────────────────────────────── */
  const displayRows = rows.slice(0, PAGE_SIZE);
  const truncated = rows.length > PAGE_SIZE;

  return (
    <div
      style={{
        marginTop: "-2px",
        marginBottom: "20px",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: "none",
        borderRadius: "0 0 10px 10px",
        overflow: "hidden",
        background: "rgba(10,13,20,0.8)",
      }}
    >
      {/* Results meta bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 14px",
          background: "rgba(16,185,129,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>✓ Results</span>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          {row_count} row{row_count !== 1 ? "s" : ""}
          {truncated && ` (showing first ${PAGE_SIZE})`}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "11px", fontFamily: "var(--font-mono)", color: "#64748b" }}>
          ⏱ {execution_time_ms} ms
          {engine && ` · ${engine}`}
        </span>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: "auto", maxHeight: "340px", overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12.5px",
            fontFamily: "var(--font-mono)",
          }}
        >
          <thead>
            <tr>
              {/* Row number header */}
              <th
                style={{
                  padding: "6px 10px",
                  textAlign: "right",
                  background: "rgba(15,18,30,0.9)",
                  color: "#4b5563",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  userSelect: "none",
                  width: "40px",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "6px 14px",
                    textAlign: "left",
                    background: "rgba(15,18,30,0.9)",
                    color: "#94a3b8",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    borderRight: "1px solid rgba(255,255,255,0.04)",
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    whiteSpace: "nowrap",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  background: rowIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                }}
              >
                {/* Row number */}
                <td
                  style={{
                    padding: "5px 10px",
                    textAlign: "right",
                    color: "#374151",
                    borderRight: "1px solid rgba(255,255,255,0.05)",
                    userSelect: "none",
                    fontSize: "11px",
                  }}
                >
                  {rowIdx + 1}
                </td>

                {columns.map((col) => {
                  const raw = row[col];
                  const cellVal =
                    raw === null || raw === undefined
                      ? ""
                      : typeof raw === "object"
                      ? JSON.stringify(raw)
                      : String(raw);
                  const isNull = raw === null || raw === undefined;

                  return (
                    <td
                      key={col}
                      style={{
                        padding: "5px 14px",
                        borderRight: "1px solid rgba(255,255,255,0.04)",
                        color: isNull ? "#4b5563" : "#e2e8f0",
                        fontStyle: isNull ? "italic" : "normal",
                        maxWidth: "320px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={cellVal}
                    >
                      {isNull ? "NULL" : cellVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Truncation notice */}
      {truncated && (
        <div
          style={{
            padding: "7px 14px",
            fontSize: "11px",
            color: "#64748b",
            background: "rgba(15,18,30,0.6)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
          }}
        >
          Showing first {PAGE_SIZE} of {row_count} rows — add a LIMIT clause to refine results.
        </div>
      )}
    </div>
  );
}
