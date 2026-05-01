"use client";

import { useMemo } from "react";

/* ═══════════════════════════════════════════════════════
   TownHUD — Overlay showing repo town stats
   ═══════════════════════════════════════════════════════ */

interface TownData {
  repoName: string;
  repoFullName: string;
  language: string;
  stars: number;
  totalFiles: number;
  totalSize: number;
  directories: number;
  files: Array<{
    extension: string;
    size: number;
    type: string;
  }>;
}

interface TownHUDProps {
  townData: TownData;
  fighterLabel: string;
  fighterColor: string;
  onBack: () => void;
}

// Group files by extension and count
function useFileBreakdown(files: TownData["files"]) {
  return useMemo(() => {
    const map = new Map<string, { count: number; size: number }>();
    for (const f of files) {
      if (f.type !== "file") continue;
      const ext = f.extension || "other";
      const existing = map.get(ext) || { count: 0, size: 0 };
      existing.count++;
      existing.size += f.size;
      map.set(ext, existing);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8);
  }, [files]);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Extension → emoji
function extEmoji(ext: string): string {
  if ([".ts", ".tsx"].includes(ext)) return "🔷";
  if ([".js", ".jsx", ".mjs"].includes(ext)) return "🟡";
  if ([".css", ".scss"].includes(ext)) return "🎨";
  if ([".json", ".yaml", ".yml"].includes(ext)) return "📦";
  if ([".md", ".txt"].includes(ext)) return "📝";
  if ([".py"].includes(ext)) return "🐍";
  if ([".go"].includes(ext)) return "🔵";
  if ([".rs"].includes(ext)) return "🦀";
  if ([".html", ".htm"].includes(ext)) return "🌐";
  return "📄";
}

export default function TownHUD({
  townData,
  fighterLabel,
  fighterColor,
  onBack,
}: TownHUDProps) {
  const breakdown = useFileBreakdown(townData.files);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top-left: Repo info */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="hud-card">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: fighterColor,
                boxShadow: `0 0 8px ${fighterColor}`,
              }}
            />
            <span className="hud-fighter-name" style={{ color: fighterColor }}>
              {townData.repoFullName}
            </span>
          </div>

          <div
            className="flex items-center gap-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <span>⭐ {townData.stars}</span>
            <span>📁 {townData.totalFiles} files</span>
            <span>📂 {townData.directories} dirs</span>
            <span>💾 {formatSize(townData.totalSize)}</span>
          </div>
        </div>
      </div>

      {/* Top-center: View label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div
          className="section-tag"
          style={{
            borderColor: `${fighterColor}33`,
            background: `${fighterColor}0a`,
            color: fighterColor,
          }}
        >
          🏙️ TOWN VIEW — {fighterLabel}
        </div>
      </div>

      {/* Right panel: File type breakdown */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="hud-card" style={{ minWidth: "180px" }}>
          <div
            className="mb-3"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.55rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Building Types
          </div>

          <div className="space-y-1.5">
            {breakdown.map(([ext, data]) => {
              const maxCount = breakdown[0]?.[1]?.count || 1;
              const pct = (data.count / maxCount) * 100;

              return (
                <div key={ext}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {extEmoji(ext)} {ext || "other"}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {data.count}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: fighterColor,
                        opacity: 0.5,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom-left: Legend */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="hud-card" style={{ maxWidth: "220px" }}>
          <div
            className="mb-2"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Legend
          </div>
          <div
            className="space-y-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <div>📐 Building height = file size</div>
            <div>🎨 Color = file type</div>
            <div>✨ Particles = star activity</div>
            <div>🛣️ Roads = file proximity</div>
          </div>
        </div>
      </div>

      {/* Bottom-right: Back button */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <button onClick={onBack} className="hud-back-btn">
          ← BACK TO ARENA
        </button>
      </div>
    </div>
  );
}
