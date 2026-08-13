"use client";

interface Analytics {
  total_users: number;
  active_users: number;
  total_notebooks: number;
  total_connections: number;
  total_queries_executed: number;
  successful_queries: number;
  failed_queries: number;
  avg_query_time_ms: number;
  new_users_last_7d: number;
  queries_last_7d: number;
}

interface AnalyticsOverviewProps {
  analytics: Analytics;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: string;
}

function StatCard({ label, value, sub, color = "#6366f1", icon }: StatCardProps) {
  return (
    <div
      className="card-glass"
      style={{
        padding: "20px 22px",
        borderLeft: `3px solid ${color}`,
        background: `linear-gradient(135deg, rgba(15,18,30,0.9) 0%, ${color}08 100%)`,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "12px", color: "#64748b" }}>{sub}</div>
      )}
    </div>
  );
}

export default function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  const successRate =
    analytics.total_queries_executed > 0
      ? Math.round((analytics.successful_queries / analytics.total_queries_executed) * 100)
      : 0;

  const activeRate =
    analytics.total_users > 0
      ? Math.round((analytics.active_users / analytics.total_users) * 100)
      : 0;

  return (
    <div>
      {/* KPI cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <StatCard icon="👥" label="Total Users" value={analytics.total_users} sub={`${activeRate}% active`} color="#6366f1" />
        <StatCard icon="✨" label="New Users (7d)" value={`+${analytics.new_users_last_7d}`} sub="last 7 days" color="#8b5cf6" />
        <StatCard icon="📓" label="Total Notebooks" value={analytics.total_notebooks} color="#3b82f6" />
        <StatCard icon="🔌" label="Connections" value={analytics.total_connections} color="#06b6d4" />
        <StatCard icon="⚡" label="Queries Run" value={analytics.total_queries_executed} sub={`${analytics.queries_last_7d} last 7d`} color="#f59e0b" />
        <StatCard icon="✅" label="Success Rate" value={`${successRate}%`} sub={`${analytics.failed_queries} failed`} color="#10b981" />
        <StatCard icon="⏱️" label="Avg Query Time" value={`${analytics.avg_query_time_ms} ms`} color="#ec4899" />
        <StatCard icon="🔴" label="Failed Queries" value={analytics.failed_queries} sub="total errors" color="#ef4444" />
      </div>

      {/* Success vs Failure bar */}
      <div
        className="card-glass"
        style={{ padding: "20px 24px" }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "14px" }}>
          Query Success vs Failure
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: `${successRate}%`,
                background: "linear-gradient(90deg, #10b981, #6ee7b7)",
                borderRadius: "6px 0 0 6px",
                transition: "width 0.6s ease",
              }}
            />
            <div
              style={{
                width: `${100 - successRate}%`,
                background: "rgba(239,68,68,0.5)",
                borderRadius: "0 6px 6px 0",
              }}
            />
          </div>
          <span style={{ fontSize: "13px", color: "#10b981", fontWeight: 600, minWidth: "40px" }}>{successRate}%</span>
        </div>
        <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Success: {analytics.successful_queries}
          </span>
          <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            Failed: {analytics.failed_queries}
          </span>
        </div>
      </div>
    </div>
  );
}
