"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, clearAuth } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <header
      style={{
        height: "60px",
        background: "rgba(15,18,30,0.8)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justify-content: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #6366f1, #10b981)",
            display: "flex",
            alignItems: "center",
            justify-content: "center",
            boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v6c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
            <path d="M3 11v6c0 1.657 4.03 3 9 3s9-1.343 9-3v-6" />
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }}>
          Collaborative DB Notebook
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge badge-emerald">{user.role}</span>
              <span style={{ fontSize: "13px", color: "#cbd5e1" }}>{user.username}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
