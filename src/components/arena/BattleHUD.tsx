"use client";

import { useEffect, useRef, useState } from "react";
import { RepoStats, BattleEvent } from "@/types/battle";

/* ═══════════════════════════════════════════════════════
   BattleHUD — Glassmorphism stat overlay
   ═══════════════════════════════════════════════════════ */

interface BattleHUDProps {
  fighter1: RepoStats;
  fighter2: RepoStats;
  winner: "fighter1" | "fighter2" | "draw";
  lastEvent: BattleEvent | null;
  eventLog: BattleEvent[];
  loading?: boolean;
}

function StatBar({
  label,
  value1,
  value2,
  format = "number",
}: {
  label: string;
  value1: number;
  value2: number;
  format?: "number" | "ratio" | "loc";
}) {
  const max = Math.max(value1, value2, 1);
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;

  const fmt = (v: number) => {
    if (format === "loc") return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString();
    if (format === "ratio") return v.toFixed(2);
    return v.toString();
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="hud-stat-value text-neon-orange">{fmt(value1)}</span>
        <span className="hud-stat-label">{label}</span>
        <span className="hud-stat-value text-neon-cyan">{fmt(value2)}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 rounded-full overflow-hidden bg-white/5 flex justify-end">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct1}%`,
              background: "linear-gradient(90deg, transparent, #ff6a00)",
              boxShadow: "0 0 8px rgba(255,106,0,0.4)",
            }}
          />
        </div>
        <div className="flex-1 rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct2}%`,
              background: "linear-gradient(90deg, #00e5ff, transparent)",
              boxShadow: "0 0 8px rgba(0,229,255,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EventFeed({ events }: { events: BattleEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (e: BattleEvent) => {
    switch (e.type) {
      case "star": return "⭐";
      case "pr_merged": return "🔀";
      case "power_surge": return "⚡";
      case "commit_burst": return "🔥";
    }
  };

  const getEventText = (e: BattleEvent) => {
    const side = e.fighter === "fighter1" ? "F1" : "F2";
    switch (e.type) {
      case "star": return `${side} gained a star! Firing!`;
      case "pr_merged": return `${side} merged a PR! Shield up!`;
      case "power_surge": return `${side} POWER SURGE +${"delta" in e ? e.delta : 0}!`;
      case "commit_burst": return `${side} commit burst x${"count" in e ? e.count : 0}!`;
    }
  };

  if (events.length === 0) return null;

  return (
    <div
      ref={feedRef}
      className="hud-event-feed"
    >
      {events.slice(-6).map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-xs py-0.5 animate-fadeIn"
          style={{
            color: e.fighter === "fighter1"
              ? "rgba(255,106,0,0.7)"
              : "rgba(0,229,255,0.7)",
          }}
        >
          <span>{getEventIcon(e)}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
            {getEventText(e)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BattleHUD({
  fighter1,
  fighter2,
  winner,
  lastEvent,
  eventLog,
  loading = false,
}: BattleHUDProps) {
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    // Show winner after a dramatic delay
    const timer = setTimeout(() => setShowWinner(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const winnerData = winner === "fighter1" ? fighter1 : fighter2;
  const winnerColor = winner === "fighter1" ? "#ff6a00" : "#00e5ff";

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar — Fighter names + power scores */}
      <div className="flex justify-between items-start p-4 md:p-6">
        {/* Fighter 1 info */}
        <div className="hud-card pointer-events-auto max-w-xs">
          <div className="flex items-center gap-3 mb-3">
            {fighter1.avatarUrl && (
              <img
                src={fighter1.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-lg border border-neon-orange/30"
              />
            )}
            <div>
              <div className="hud-fighter-name text-neon-orange">
                {fighter1.name}
              </div>
              <div className="hud-fighter-sub">{fighter1.language}</div>
            </div>
          </div>
          <div className="hud-power-score">
            <span className="hud-power-label">POWER</span>
            <span className="hud-power-value text-neon-orange">
              {fighter1.powerScore.toFixed(2)}
            </span>
          </div>
        </div>

        {/* VS badge */}
        <div className="flex flex-col items-center mt-2">
          <div className="hud-vs-badge">VS</div>
          <div className="hud-formula-tag">
            P = (S×0.2) + (Cv×0.5) + (Ir×0.3)
          </div>
        </div>

        {/* Fighter 2 info */}
        <div className="hud-card pointer-events-auto max-w-xs text-right">
          <div className="flex items-center gap-3 mb-3 justify-end">
            <div>
              <div className="hud-fighter-name text-neon-cyan">
                {fighter2.name}
              </div>
              <div className="hud-fighter-sub">{fighter2.language}</div>
            </div>
            {fighter2.avatarUrl && (
              <img
                src={fighter2.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-lg border border-neon-cyan/30"
              />
            )}
          </div>
          <div className="hud-power-score justify-end">
            <span className="hud-power-label">POWER</span>
            <span className="hud-power-value text-neon-cyan">
              {fighter2.powerScore.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Center stats panel */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-auto">
        <div className="hud-card">
          <StatBar label="★ Stars" value1={fighter1.stars} value2={fighter2.stars} />
          <StatBar
            label="⚡ Commit Vel."
            value1={fighter1.commitVelocity}
            value2={fighter2.commitVelocity}
          />
          <StatBar
            label="🛡 Issue Res."
            value1={fighter1.issueResolution}
            value2={fighter2.issueResolution}
            format="ratio"
          />
          <StatBar
            label="📝 LOC"
            value1={fighter1.totalLinesOfCode}
            value2={fighter2.totalLinesOfCode}
            format="loc"
          />
          <StatBar
            label="👥 Contributors"
            value1={fighter1.activeContributors}
            value2={fighter2.activeContributors}
          />
        </div>
      </div>

      {/* Event feed */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <EventFeed events={eventLog} />
      </div>

      {/* Winner announcement */}
      {showWinner && winner !== "draw" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="hud-winner-card" style={{ borderColor: winnerColor }}>
            <div
              className="hud-winner-label"
              style={{ color: winnerColor }}
            >
              ★ CHAMPION ★
            </div>
            <div className="hud-winner-name" style={{ color: winnerColor }}>
              {winnerData.fullName}
            </div>
            <div className="hud-winner-score">
              POWER SCORE: {winnerData.powerScore.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {showWinner && winner === "draw" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="hud-winner-card" style={{ borderColor: "#fff" }}>
            <div className="hud-winner-label" style={{ color: "#fff" }}>
              ⚔ DRAW ⚔
            </div>
            <div className="hud-winner-score">
              Both fighters are equally matched!
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <a
          href="/"
          className="hud-back-btn"
        >
          ← BACK TO BASE
        </a>
      </div>
    </div>
  );
}
