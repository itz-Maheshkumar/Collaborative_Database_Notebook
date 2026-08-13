"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import UserManagementTable from "@/components/admin/UserManagementTable";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AuditLogs from "@/components/admin/AuditLogs";
import { AdminUser, AnalyticsData, AuditLogListResponse } from "@/lib/types";
import {
  adminListUsersApi,
  adminUpdateUserApi,
  adminGetAnalyticsApi,
  adminGetAuditLogsApi,
} from "@/lib/api";
import { isAuthenticated, getUser } from "@/lib/auth";

type ActiveTab = "analytics" | "users" | "audit";

const PAGE_SIZE = 100;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("analytics");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [auditData, setAuditData] = useState<AuditLogListResponse>({ items: [], total: 0 });
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditStatus, setAuditStatus] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth + admin guard
  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    const user = getUser();
    if (user?.role !== "admin") { router.push("/notebooks"); }
  }, [router]);

  // Load analytics + users on mount
  useEffect(() => {
    Promise.all([
      adminGetAnalyticsApi(),
      adminListUsersApi(),
    ])
      .then(([analyticsRes, usersRes]) => {
        setAnalytics(analyticsRes);
        setUsers(usersRes);
      })
      .catch(() => setError("Failed to load admin data"))
      .finally(() => setIsLoading(false));
  }, []);

  // Load audit logs
  const loadAuditLogs = useCallback(async (offset: number, status?: string) => {
    setAuditLoading(true);
    try {
      const data = await adminGetAuditLogsApi(PAGE_SIZE, offset, status);
      setAuditData(data);
    } catch {
      setAuditData({ items: [], total: 0 });
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs(auditOffset, auditStatus);
    }
  }, [activeTab, auditOffset, auditStatus, loadAuditLogs]);

  const handleUpdateUser = async (userId: number, role?: string, is_active?: boolean) => {
    const updated = await adminUpdateUserApi(userId, { role, is_active });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
  };

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "users",     label: "Users",     icon: "👥" },
    { id: "audit",     label: "Audit Log", icon: "📋" },
  ];

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d14" }}>
        <Navbar />
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "40px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="spinner" /> Loading admin dashboard…
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d14" }}>
        <Navbar />
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "40px" }}>
            <div className="alert alert-error">{error}</div>
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

        <main style={{ flex: 1, padding: "32px 40px" }}>
          {/* Page Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "28px" }}>🛡️</span>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f1f5f9" }}>Admin Dashboard</h1>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Platform overview, user management, and full query audit log.
            </p>
          </div>

          {/* Tab Nav */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "28px",
              background: "rgba(255,255,255,0.03)",
              padding: "4px",
              borderRadius: "10px",
              width: "fit-content",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                style={{ fontSize: "13px", padding: "7px 18px", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "analytics" && analytics && (
            <AnalyticsOverview analytics={analytics} />
          )}

          {activeTab === "users" && (
            <UserManagementTable
              users={users}
              onUpdate={handleUpdateUser}
            />
          )}

          {activeTab === "audit" && (
            <AuditLogs
              items={auditData.items}
              total={auditData.total}
              onFilterChange={(status) => {
                setAuditStatus(status);
                setAuditOffset(0);
              }}
              onPageChange={(offset) => setAuditOffset(offset)}
              currentOffset={auditOffset}
              pageSize={PAGE_SIZE}
              isLoading={auditLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
