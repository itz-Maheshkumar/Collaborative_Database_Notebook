"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import TutorialViewer from "@/components/learn/TutorialViewer";
import { TutorialMeta, TutorialProgressItem } from "@/lib/types";
import { getTutorialProgressApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ── Tutorial catalogue ────────────────────────────────────────────
// These are the static tutorials. Content is fetched from /data/tutorials/*.md
const TUTORIALS: TutorialMeta[] = [
  {
    id: "postgresql",
    title: "PostgreSQL Fundamentals",
    description: "Learn to query relational data with PostgreSQL — from SELECT basics to JOINs and aggregations.",
    engine: "postgresql",
    difficulty: "beginner",
    estimatedMinutes: 20,
    sections: [
      { id: "intro", title: "Introduction" },
      { id: "select", title: "SELECT Queries" },
      { id: "filtering", title: "Filtering with WHERE" },
      { id: "aggregations", title: "Aggregations & GROUP BY" },
      { id: "joins", title: "Joining Tables" },
    ],
  },
  {
    id: "mysql",
    title: "MySQL Essentials",
    description: "Master MySQL queries — SELECT, filtering, aggregations, indexes, and SHOW commands.",
    engine: "mysql",
    difficulty: "beginner",
    estimatedMinutes: 20,
    sections: [
      { id: "intro", title: "Introduction" },
      { id: "select", title: "SELECT & SHOW" },
      { id: "filtering", title: "Filtering & Sorting" },
      { id: "aggregations", title: "Aggregations" },
      { id: "indexes", title: "Indexes & Performance" },
    ],
  },
  {
    id: "sqlite",
    title: "SQLite Quick Start",
    description: "Explore SQLite — lightweight, file-based SQL with PRAGMA inspection and CTEs.",
    engine: "sqlite",
    difficulty: "beginner",
    estimatedMinutes: 15,
    sections: [
      { id: "intro", title: "Introduction" },
      { id: "pragma", title: "PRAGMA Inspection" },
      { id: "queries", title: "Core SQL Queries" },
      { id: "cte", title: "Common Table Expressions" },
      { id: "tips", title: "SQLite-Specific Tips" },
    ],
  },
  {
    id: "mongodb",
    title: "MongoDB Query Guide",
    description: "Query MongoDB collections using JSON commands — find, insert, update, delete, and aggregate.",
    engine: "mongodb",
    difficulty: "beginner",
    estimatedMinutes: 25,
    sections: [
      { id: "intro", title: "Introduction" },
      { id: "syntax", title: "JSON Command Syntax" },
      { id: "find", title: "Querying with find" },
      { id: "insert", title: "Inserting Documents" },
      { id: "update", title: "Updating Documents" },
      { id: "delete", title: "Deleting Documents" },
      { id: "aggregate", title: "Aggregation Pipeline" },
    ],
  },
];

const ENGINE_COLORS: Record<string, string> = {
  postgresql: "#3b82f6",
  mysql:      "#f59e0b",
  sqlite:     "#10b981",
  mongodb:    "#22c55e",
};

const ENGINE_ICONS: Record<string, string> = {
  postgresql: "🐘",
  mysql:      "🐬",
  sqlite:     "💾",
  mongodb:    "🍃",
};

export default function LearnPage() {
  const router = useRouter();
  const [activeTutorial, setActiveTutorial] = useState<TutorialMeta | null>(null);
  const [tutorialContent, setTutorialContent] = useState<string>("");
  const [progress, setProgress] = useState<TutorialProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Load progress from API
  useEffect(() => {
    getTutorialProgressApi()
      .then(setProgress)
      .catch(() => setProgress([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch tutorial markdown content when selection changes
  const handleSelectTutorial = async (tutorial: TutorialMeta) => {
    setActiveTutorial(tutorial);
    setTutorialContent("");
    try {
      const res = await fetch(`/tutorials/${tutorial.id}.md`);
      if (res.ok) {
        const text = await res.text();
        setTutorialContent(text);
      } else {
        setTutorialContent(`# ${tutorial.title}\n\nContent coming soon.`);
      }
    } catch {
      setTutorialContent(`# ${tutorial.title}\n\nFailed to load content.`);
    }
  };

  // Completion counts per tutorial
  const completedCountFor = (tutorialId: string) =>
    progress.filter((p) => p.tutorial_id === tutorialId).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main style={{ flex: 1, overflow: "hidden" }}>
          {activeTutorial ? (
            /* ── Tutorial Viewer ─────────────────────────────────── */
            <div style={{ height: "calc(100vh - 60px)", display: "flex", flexDirection: "column" }}>
              {/* Back header */}
              <div
                style={{
                  padding: "12px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  background: "rgba(15,18,30,0.8)",
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveTutorial(null)}
                >
                  ← Back to Tutorials
                </button>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{ENGINE_ICONS[activeTutorial.engine] || "📖"}</span>
                  {activeTutorial.title}
                </span>
              </div>

              {/* Viewer content */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                {tutorialContent ? (
                  <TutorialViewer
                    tutorial={activeTutorial}
                    content={tutorialContent}
                    progress={progress}
                    onProgressUpdate={setProgress}
                  />
                ) : (
                  <div style={{ padding: "40px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="spinner" /> Loading tutorial…
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Tutorial Catalogue ──────────────────────────────── */
            <div style={{ padding: "40px 48px" }}>
              <div style={{ marginBottom: "36px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>
                  📚 Learn
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                  Step-by-step guides for every database engine supported by this notebook.
                </p>
              </div>

              {isLoading ? (
                <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="spinner" /> Loading your progress…
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {TUTORIALS.map((t) => {
                    const completed = completedCountFor(t.id);
                    const total = t.sections.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const color = ENGINE_COLORS[t.engine] || "#6366f1";

                    return (
                      <button
                        key={t.id}
                        className="card card-glass"
                        onClick={() => handleSelectTutorial(t)}
                        style={{
                          textAlign: "left",
                          padding: "22px 24px",
                          cursor: "pointer",
                          border: `1px solid ${color}20`,
                          background: `linear-gradient(135deg, rgba(15,18,30,0.9) 0%, ${color}08 100%)`,
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px ${color}20`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                        }}
                      >
                        {/* Engine icon bg */}
                        <div
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            fontSize: "72px",
                            opacity: 0.05,
                            lineHeight: 1,
                            pointerEvents: "none",
                          }}
                        >
                          {ENGINE_ICONS[t.engine]}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                          <span style={{ fontSize: "24px" }}>{ENGINE_ICONS[t.engine] || "📖"}</span>
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>{t.title}</div>
                            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                              <span
                                className="badge"
                                style={{ background: `${color}20`, color, border: `1px solid ${color}30`, fontSize: "9px" }}
                              >
                                {t.engine}
                              </span>
                              <span className="badge badge-indigo" style={{ fontSize: "9px" }}>
                                {t.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "14px", lineHeight: 1.5 }}>
                          {t.description}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            ⏱ ~{t.estimatedMinutes} min · {total} sections
                          </span>
                          {pct === 100 ? (
                            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>✅ Complete</span>
                          ) : pct > 0 ? (
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{pct}%</span>
                          ) : null}
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: pct === 100 ? "#10b981" : color,
                              borderRadius: "2px",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
