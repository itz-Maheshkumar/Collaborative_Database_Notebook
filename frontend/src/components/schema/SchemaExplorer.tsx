"use client";

import { useEffect, useState, useCallback } from "react";
import { SchemaTreeResponse, TableInfo } from "@/lib/types";
import { getSchemaApi } from "@/lib/api";

interface SchemaExplorerProps {
  connectionId?: number;
}

export default function SchemaExplorer({ connectionId }: SchemaExplorerProps) {
  const [schema, setSchema] = useState<SchemaTreeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!connectionId) {
      setSchema(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getSchemaApi(connectionId);
      setSchema(data);
    } catch {
      setSchema({
        engine: "",
        database_name: "",
        tables: [],
        error_message: "Failed to fetch schema",
      });
    } finally {
      setIsLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  if (!connectionId) {
    return (
      <div style={{ padding: "20px 14px", color: "#64748b", fontSize: "13px", textAlign: "center" }}>
        Select a connection to explore schema tables &amp; columns.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: "20px 14px", color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div className="spinner" /> Introspecting database schema...
      </div>
    );
  }

  if (!schema || schema.error_message) {
    return (
      <div style={{ padding: "16px 14px" }}>
        <div className="alert alert-error" style={{ fontSize: "12px", padding: "8px 12px" }}>
          {schema?.error_message || "Unable to load schema"}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: "8px", width: "100%" }} onClick={fetchSchema}>
          🔄 Retry
        </button>
      </div>
    );
  }

  const filteredTables = schema.tables.filter(
    (t) =>
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.columns.some((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "rgba(10,13,20,0.4)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>🗄️</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
            {schema.database_name || "Schema"}
          </span>
          <span className="badge badge-indigo" style={{ fontSize: "9px", padding: "1px 5px" }}>
            {schema.engine}
          </span>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: "2px 6px", fontSize: "12px" }}
          onClick={fetchSchema}
          title="Refresh schema"
        >
          🔄
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <input
          type="text"
          className="input"
          placeholder="Filter tables & columns..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "5px 10px", fontSize: "12px" }}
        />
      </div>

      {/* Copy notification */}
      {copiedText && (
        <div
          style={{
            background: "rgba(16,185,129,0.2)",
            color: "#6ee7b7",
            fontSize: "11px",
            padding: "4px 12px",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
          }}
        >
          {`Copied "${copiedText}"`}
        </div>
      )}

      {/* Table Tree List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {filteredTables.length === 0 ? (
          <div style={{ padding: "16px 14px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>
            No tables or collections found.
          </div>
        ) : (
          filteredTables.map((table: TableInfo) => {
            const isExpanded = expandedTables[table.name] || Boolean(filter);

            return (
              <div key={table.name} style={{ marginBottom: "2px" }}>
                {/* Table row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    color: "#cbd5e1",
                    background: isExpanded ? "rgba(255,255,255,0.03)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                  onClick={() => toggleTable(table.name)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>{isExpanded ? "▼" : "▶"}</span>
                    <span style={{ fontSize: "13px" }}>
                      {table.type === "collection" ? "🍃" : table.type === "view" ? "👁️" : "📋"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                      title="Click to expand/collapse"
                    >
                      {table.name}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                      {table.columns.length}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "0 4px", fontSize: "10px", height: "18px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(table.name);
                      }}
                      title="Copy table name"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Column details */}
                {isExpanded && (
                  <div style={{ paddingLeft: "26px", paddingRight: "14px", background: "rgba(0,0,0,0.2)" }}>
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "3px 0",
                          fontSize: "11.5px",
                          fontFamily: "var(--font-mono)",
                          borderBottom: "1px solid rgba(255,255,255,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {col.is_primary_key && <span title="Primary Key">🔑</span>}
                          <span
                            style={{ color: "#e2e8f0", cursor: "pointer" }}
                            onClick={() => copyToClipboard(col.name)}
                            title="Click to copy column name"
                          >
                            {col.name}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: "10px",
                            color: "#64748b",
                            background: "rgba(255,255,255,0.04)",
                            padding: "0 4px",
                            borderRadius: "3px",
                          }}
                        >
                          {col.data_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
