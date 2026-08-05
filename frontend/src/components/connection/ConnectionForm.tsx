"use client";

import { useState } from "react";
import { DatabaseEngine, ConnectionCreate, ConnectionTestResult } from "@/lib/types";
import { createConnectionApi, testConnectionApi } from "@/lib/api";

interface ConnectionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ConnectionForm({ onSuccess, onCancel }: ConnectionFormProps) {
  const [name, setName] = useState("");
  const [engine, setEngine] = useState<DatabaseEngine>("postgresql");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState<number | "">(5432);
  const [databaseName, setDatabaseName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [extraParams, setExtraParams] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [error, setError] = useState("");

  const handleEngineChange = (selectedEngine: DatabaseEngine) => {
    setEngine(selectedEngine);
    setTestResult(null);
    if (selectedEngine === "postgresql") {
      setPort(5432);
    } else if (selectedEngine === "mysql") {
      setPort(3306);
    } else if (selectedEngine === "mongodb") {
      setPort(27017);
    } else if (selectedEngine === "sqlite") {
      setPort("");
    }
  };

  const handleTest = async () => {
    setError("");
    setTestResult(null);
    setIsTesting(true);

    try {
      const result = await testConnectionApi({
        engine,
        host: engine !== "sqlite" ? host : undefined,
        port: typeof port === "number" ? port : undefined,
        database_name: databaseName,
        username: engine !== "sqlite" ? username : undefined,
        password: engine !== "sqlite" ? password : undefined,
        extra_params: extraParams,
      });
      setTestResult(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestResult({ success: false, message: err.message });
      } else {
        setTestResult({ success: false, message: "Test failed" });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a connection name.");
      return;
    }

    if (engine !== "sqlite" && !host.trim()) {
      setError("Host is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ConnectionCreate = {
        name: name.trim(),
        engine,
        host: engine !== "sqlite" ? host.trim() : undefined,
        port: typeof port === "number" ? port : undefined,
        database_name: databaseName.trim() || undefined,
        username: engine !== "sqlite" && username.trim() ? username.trim() : undefined,
        password: engine !== "sqlite" && password ? password : undefined,
        extra_params: extraParams.trim() || undefined,
      };

      await createConnectionApi(payload);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-glass" style={{ padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "18px", color: "#f1f5f9" }}>Add Database Connection</h3>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Engine selector */}
        <div style={{ marginBottom: "16px" }}>
          <label className="label">Database Engine</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { id: "postgresql", label: "PostgreSQL", icon: "🐘" },
              { id: "mysql", label: "MySQL", icon: "🐬" },
              { id: "mongodb", label: "MongoDB", icon: "🍃" },
              { id: "sqlite", label: "SQLite", icon: "📦" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`btn ${engine === item.id ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "10px 4px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}
                onClick={() => handleEngineChange(item.id as DatabaseEngine)}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Connection Name */}
        <div style={{ marginBottom: "16px" }}>
          <label className="label">Connection Name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Production Analytics DB"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Host & Port (non-sqlite) */}
        {engine !== "sqlite" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label className="label">Host</label>
              <input
                type="text"
                className="input"
                placeholder="localhost or db.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Port</label>
              <input
                type="number"
                className="input"
                placeholder="5432"
                value={port}
                onChange={(e) => setPort(e.target.value ? parseInt(e.target.value) : "")}
              />
            </div>
          </div>
        )}

        {/* Database Name */}
        <div style={{ marginBottom: "16px" }}>
          <label className="label">
            {engine === "sqlite" ? "Database File Path" : "Database Name"}
          </label>
          <input
            type="text"
            className="input"
            placeholder={engine === "sqlite" ? "./data/local.db" : "my_database"}
            value={databaseName}
            onChange={(e) => setDatabaseName(e.target.value)}
          />
        </div>

        {/* Username & Password (non-sqlite) */}
        {engine !== "sqlite" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="postgres"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`alert ${testResult.success ? "alert-success" : "alert-error"}`}
            style={{ marginBottom: "16px" }}
          >
            <span>{testResult.message}</span>
            {testResult.latency_ms !== undefined && (
              <span className="badge badge-emerald" style={{ marginLeft: "auto" }}>
                {testResult.latency_ms} ms
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTest}
            disabled={isTesting || isSubmitting}
          >
            {isTesting ? <><div className="spinner" /> Testing…</> : "Test Connection"}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isTesting}
          >
            {isSubmitting ? <><div className="spinner" /> Saving…</> : "Save Connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
