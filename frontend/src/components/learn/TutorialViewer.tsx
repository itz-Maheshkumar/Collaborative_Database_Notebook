"use client";

import { useState } from "react";
import { TutorialMeta, TutorialProgressItem } from "@/lib/types";
import { markSectionCompleteApi, resetTutorialProgressApi } from "@/lib/api";

interface TutorialViewerProps {
  tutorial: TutorialMeta;
  content: string; // Raw markdown string
  progress: TutorialProgressItem[];
  onProgressUpdate: (updated: TutorialProgressItem[]) => void;
}

const ENGINE_COLORS: Record<string, string> = {
  postgresql: "#3b82f6",
  mysql:      "#f59e0b",
  sqlite:     "#10b981",
  mongodb:    "#22c55e",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     "#10b981",
  intermediate: "#f59e0b",
  advanced:     "#ef4444",
};

function renderMarkdown(content: string): string {
  // Strip frontmatter
  const stripped = content.replace(/^---[\s\S]*?---\n/, "");

  return stripped
    // Headings
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;color:#f1f5f9;margin:28px 0 12px;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;color:#e2e8f0;margin:20px 0 8px;font-weight:600;">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;color:#cbd5e1;margin:16px 0 6px;font-weight:600;">$1</h4>')
    // Bold + Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f8fafc;font-weight:700;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#cbd5e1;">$1</em>')
    // Inline code
    .replace(/`([^`\n]+)`/g, '<code style="background:rgba(99,102,241,0.15);color:#a5b4fc;padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12.5px;">$1</code>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<div style="position:relative;margin:14px 0;">
        ${lang ? `<div style="position:absolute;top:8px;right:12px;font-size:10px;color:#64748b;font-family:var(--font-mono);text-transform:uppercase;">${lang}</div>` : ''}
        <pre style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:16px;overflow-x:auto;font-family:var(--font-mono);font-size:12.5px;color:#e2e8f0;line-height:1.7;margin:0;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>`
    )
    // Blockquotes
    .replace(/^> \*\*(.+?)\*\*: (.+)$/gm, '<div style="background:rgba(245,158,11,0.07);border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 6px 6px 0;margin:12px 0;font-size:13px;color:#fcd34d;"><strong>$1:</strong> <span style="color:#e2e8f0;">$2</span></div>')
    .replace(/^> \*\*(.+?)\*\*\n(.+)/gm, '<div style="background:rgba(245,158,11,0.07);border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 6px 6px 0;margin:12px 0;font-size:13px;color:#fcd34d;"><strong>$1</strong><p style="color:#e2e8f0;margin:4px 0 0;">$2</p></div>')
    .replace(/^> (.+)$/gm, '<blockquote style="background:rgba(99,102,241,0.06);border-left:3px solid #6366f1;padding:10px 14px;border-radius:0 6px 6px 0;margin:12px 0;font-size:13px;color:#cbd5e1;font-style:italic;">$1</blockquote>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_, header, body) => {
      const ths = header.split('|').filter(Boolean).map((h: string) =>
        `<th style="padding:8px 14px;text-align:left;background:rgba(15,18,30,0.9);color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid rgba(255,255,255,0.07);">${h.trim()}</th>`
      ).join('');
      const trs = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((d: string) =>
          `<td style="padding:7px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid rgba(255,255,255,0.04);">${d.trim()}</td>`
        ).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<div style="overflow-x:auto;margin:14px 0;"><table style="width:100%;border-collapse:collapse;border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
    })
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;" />')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li style="color:#cbd5e1;margin:4px 0;font-size:13.5px;line-height:1.6;">$1</li>')
    .replace(/(<li.+<\/li>\n?)+/g, (match) => `<ul style="padding-left:20px;margin:10px 0;">${match}</ul>`)
    // Paragraphs
    .replace(/^(?!<[hupbdtc])(.+)$/gm, '<p style="color:#94a3b8;font-size:13.5px;line-height:1.7;margin:8px 0;">$1</p>');
}

export default function TutorialViewer({
  tutorial,
  content,
  progress,
  onProgressUpdate,
}: TutorialViewerProps) {
  const [activeSection, setActiveSection] = useState<string>(tutorial.sections[0]?.id || "");

  const completedSections = new Set(
    progress
      .filter((p) => p.tutorial_id === tutorial.id)
      .map((p) => p.section_id)
  );

  const completionPercent =
    tutorial.sections.length > 0
      ? Math.round((completedSections.size / tutorial.sections.length) * 100)
      : 0;

  const handleMarkComplete = async (sectionId: string) => {
    if (completedSections.has(sectionId)) return;
    try {
      const newItem = await markSectionCompleteApi(tutorial.id, sectionId);
      onProgressUpdate([...progress, newItem]);
    } catch {
      // silently fail
    }
  };

  const handleReset = async () => {
    if (!confirm(`Reset all progress for "${tutorial.title}"?`)) return;
    try {
      await resetTutorialProgressApi(tutorial.id);
      onProgressUpdate(progress.filter((p) => p.tutorial_id !== tutorial.id));
    } catch {
      alert("Failed to reset progress.");
    }
  };

  const engineColor = ENGINE_COLORS[tutorial.engine] || "#6366f1";

  return (
    <div style={{ display: "flex", height: "100%", gap: "0" }}>
      {/* ── Left nav ──────────────────────────────────────────────── */}
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          padding: "20px 0",
          overflowY: "auto",
          background: "rgba(10,13,20,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Meta */}
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span
              className="badge"
              style={{ background: `${engineColor}20`, color: engineColor, border: `1px solid ${engineColor}40`, fontSize: "10px" }}
            >
              {tutorial.engine}
            </span>
            <span
              className="badge"
              style={{
                background: `${DIFFICULTY_COLORS[tutorial.difficulty] || "#6366f1"}20`,
                color: DIFFICULTY_COLORS[tutorial.difficulty] || "#6366f1",
                fontSize: "10px",
              }}
            >
              {tutorial.difficulty}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>⏱ ~{tutorial.estimatedMinutes} min</div>

          {/* Progress bar */}
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
              <span>Progress</span>
              <span style={{ color: completionPercent === 100 ? "#10b981" : "#64748b" }}>{completionPercent}%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${completionPercent}%`,
                  background: completionPercent === 100 ? "#10b981" : "#6366f1",
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Section list */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {tutorial.sections.map((section) => {
            const isDone = completedSections.has(section.id);
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: isActive ? "#a5b4fc" : isDone ? "#94a3b8" : "#64748b",
                  transition: "all 0.15s ease",
                  border: "none",
                  borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: "11px", flexShrink: 0 }}>
                  {isDone ? "✅" : isActive ? "▶" : "○"}
                </span>
                <span style={{ lineHeight: 1.4 }}>{section.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Reset button */}
        {completedSections.size > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", fontSize: "11px", color: "#64748b" }}
              onClick={handleReset}
            >
              ↺ Reset Progress
            </button>
          </div>
        )}
      </aside>

      {/* ── Content area ──────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          style={{ maxWidth: "760px", lineHeight: 1.7 }}
        />

        {/* Mark section complete */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {completedSections.has(activeSection) ? (
            <span style={{ color: "#10b981", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              ✅ Section completed
            </span>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleMarkComplete(activeSection)}
            >
              ✓ Mark as Complete
            </button>
          )}

          {/* Navigate to next section */}
          {(() => {
            const idx = tutorial.sections.findIndex((s) => s.id === activeSection);
            const next = tutorial.sections[idx + 1];
            return next ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveSection(next.id)}
              >
                Next: {next.title} →
              </button>
            ) : completionPercent === 100 ? (
              <span style={{ color: "#10b981", fontSize: "13px", fontWeight: 600 }}>
                🎉 Tutorial Complete!
              </span>
            ) : null;
          })()}
        </div>
      </main>
    </div>
  );
}
