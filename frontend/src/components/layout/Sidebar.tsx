"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const user = getUser();

  const navItems = [
    { label: "Notebooks", href: "/notebooks", icon: "📓" },
    { label: "Connections", href: "/connections", icon: "🔌" },
    { label: "Learn", href: "/learn", icon: "📚" },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Admin Dashboard", href: "/admin", icon: "🛡️" });
  }

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "calc(100vh - 60px)",
        background: "rgba(15,18,30,0.6)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div style={{ padding: "0 12px 12px", fontSize: "11px", fontWeight: 600, color: "#64748b", letterSpacing: "0.5px" }}>
        MAIN MENU
      </div>

      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#f1f5f9" : "#94a3b8",
              background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
