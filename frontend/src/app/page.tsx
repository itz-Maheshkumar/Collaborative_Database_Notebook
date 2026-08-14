"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function RootHomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/notebooks");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0d14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        gap: "10px",
      }}
    >
      <div className="spinner" />
      <span>Loading Collaborative Database Notebook...</span>
    </div>
  );
}
