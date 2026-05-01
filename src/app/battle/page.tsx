"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RumbleResult } from "@/types/battle";
import { useWebSocket } from "@/hooks/useWebSocket";

// Dynamic imports — avoid SSR for Three.js
const BattleArena = dynamic(
  () => import("@/components/arena/BattleArena"),
  { ssr: false }
);
const BattleHUD = dynamic(
  () => import("@/components/arena/BattleHUD"),
  { ssr: false }
);
const TownScene = dynamic(
  () => import("@/components/town/TownScene"),
  { ssr: false }
);
const TownHUD = dynamic(
  () => import("@/components/town/TownHUD"),
  { ssr: false }
);

type ViewMode = "arena" | "town1" | "town2";

/* ═══════════════════════════════════════════════════════
   Loading Screen
   ═══════════════════════════════════════════════════════ */
function LoadingScreen({ status }: { status: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#0a0a0f" }}
    >
      <div className="mb-8 relative">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,106,0,0.15), rgba(0,229,255,0.15))",
            border: "1px solid rgba(255,106,0,0.3)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff6a00"
            strokeWidth="1.5"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div
          className="absolute inset-[-8px] rounded-3xl border-2 border-transparent"
          style={{
            borderTopColor: "#ff6a00",
            borderRightColor: "#00e5ff",
            animation: "spin 1.5s linear infinite",
          }}
        />
      </div>

      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.4rem",
          fontWeight: 800,
          letterSpacing: "0.08em",
          background: "linear-gradient(135deg, #ff6a00, #00e5ff)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "12px",
        }}
      >
        INITIALIZING BATTLE
      </h2>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        {status}
      </p>

      <div
        className="mt-6 w-48 h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #ff6a00, #00e5ff)",
            animation: "loading-bar 2s ease-in-out infinite",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0;
          }
          50% {
            width: 100%;
            margin-left: 0;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Error Screen — with Thermal Overload detection
   ═══════════════════════════════════════════════════════ */
function ErrorScreen({
  message,
  isRateLimit = false,
}: {
  message: string;
  isRateLimit?: boolean;
}) {
  if (isRateLimit) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
        style={{ background: "#0a0a0f" }}
      >
        {/* Pulsing warning icon */}
        <div
          className="mb-6 relative"
          style={{ animation: "thermal-pulse 2s ease-in-out infinite" }}
        >
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,77,0,0.2), rgba(255,77,0,0.05))",
              border: "2px solid rgba(255,77,0,0.4)",
              boxShadow: "0 0 40px rgba(255,77,0,0.2)",
            }}
          >
            <span className="text-5xl">🔥</span>
          </div>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.6rem",
            fontWeight: 900,
            letterSpacing: "0.1em",
            color: "#FF4D00",
            marginBottom: "8px",
            textShadow: "0 0 20px rgba(255,77,0,0.3)",
          }}
        >
          THERMAL OVERLOAD
        </h2>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "24px",
          }}
        >
          GitHub API rate limit exceeded
        </p>

        <div
          className="hud-card text-center max-w-md"
          style={{ borderColor: "rgba(255,77,0,0.15)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.5)",
              lineHeight: "1.8",
              marginBottom: "16px",
            }}
          >
            {message}
          </p>

          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.3)",
              lineHeight: "1.8",
              textAlign: "left",
              background: "rgba(0,0,0,0.3)",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <div style={{ color: "#FF4D00", marginBottom: "4px" }}>
              ⚡ Fix: Create a .env.local file:
            </div>
            <code style={{ color: "rgba(255,255,255,0.5)" }}>
              GITHUB_TOKEN=ghp_your_personal_access_token
            </code>
            <div
              style={{ marginTop: "8px", color: "rgba(255,255,255,0.25)" }}
            >
              Get one at github.com/settings/tokens (no scopes needed)
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            // Use window.location for safer redirect (avoids crash if OAuth not configured)
            window.location.href = "/api/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href);
          }}
          className="mt-6"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 28px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          LOGIN WITH GITHUB
        </button>

        <a
          href="/"
          className="mt-3"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.25)",
            textDecoration: "none",
          }}
        >
          ← or return to base
        </a>

        <style jsx>{`
          @keyframes thermal-pulse {
            0%,
            100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.85;
            }
          }
        `}</style>
      </div>
    );
  }

  // Standard error screen
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ background: "#0a0a0f" }}
    >
      <div
        className="text-5xl mb-6"
        style={{ filter: "drop-shadow(0 0 20px rgba(255,106,0,0.5))" }}
      >
        💥
      </div>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.4rem",
          fontWeight: 800,
          color: "#ff6a00",
          marginBottom: "12px",
        }}
      >
        BATTLE ABORTED
      </h2>
      <p
        className="text-center max-w-md mb-8"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.5)",
          lineHeight: "1.6",
        }}
      >
        {message}
      </p>
      <a
        href="/"
        className="btn-rumble"
        style={{ fontSize: "0.85rem", padding: "12px 32px" }}
      >
        ← RETURN TO BASE
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   View Mode Toggle (floating pill)
   ═══════════════════════════════════════════════════════ */
function ViewToggle({
  currentView,
  onChangeView,
  f1Name,
  f2Name,
}: {
  currentView: ViewMode;
  onChangeView: (v: ViewMode) => void;
  f1Name: string;
  f2Name: string;
}) {
  const options: { key: ViewMode; label: string; icon: string }[] = [
    { key: "arena", label: "ARENA", icon: "⚔️" },
    { key: "town1", label: f1Name, icon: "🏙️" },
    { key: "town2", label: f2Name, icon: "🏙️" },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="view-toggle-container">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChangeView(opt.key)}
            className={`view-toggle-btn ${
              currentView === opt.key ? "active" : ""
            }`}
          >
            <span className="view-toggle-icon">{opt.icon}</span>
            <span className="view-toggle-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Battle Page Content
   ═══════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BattleContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<RumbleResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [town1Data, setTown1Data] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [town2Data, setTown2Data] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [loadStatus, setLoadStatus] = useState("Parsing coordinates...");
  const [viewMode, setViewMode] = useState<ViewMode>("arena");

  const repo1 = searchParams.get("repo1") || "";
  const repo2 = searchParams.get("repo2") || "";

  // WebSocket simulation
  const { lastEvent, eventLog } = useWebSocket({
    enabled: !!result && viewMode === "arena",
  });

  useEffect(() => {
    if (!repo1 || !repo2) {
      setError(
        "Missing repository URLs. Return to the landing page and enter both fighters."
      );
      setLoading(false);
      return;
    }

    async function fetchBattle() {
      try {
        setLoadStatus("Scanning repositories...");
        await new Promise((r) => setTimeout(r, 600));

        setLoadStatus("Fetching GitHub intelligence...");
        const res = await fetch("/api/rumble", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo1, repo2 }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.isRateLimit) {
            setIsRateLimit(true);
          }
          throw new Error(data.error || `API error: ${res.status}`);
        }

        setLoadStatus("Computing AEROX-POWER-SCORE...");
        const data: RumbleResult = await res.json();
        await new Promise((r) => setTimeout(r, 400));

        // Fetch town data for both repos in parallel
        setLoadStatus("Surveying town blueprints...");
        const [t1Res, t2Res] = await Promise.all([
          fetch("/api/town", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo: repo1 }),
          }),
          fetch("/api/town", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo: repo2 }),
          }),
        ]);

        if (t1Res.ok) setTown1Data(await t1Res.json());
        if (t2Res.ok) setTown2Data(await t2Res.json());

        setLoadStatus("Deploying to arena...");
        await new Promise((r) => setTimeout(r, 300));

        setResult(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }

    fetchBattle();
  }, [repo1, repo2]);

  const handleViewChange = useCallback((v: ViewMode) => {
    setViewMode(v);
  }, []);

  const handleBackToArena = useCallback(() => {
    setViewMode("arena");
  }, []);

  if (loading) return <LoadingScreen status={loadStatus} />;
  if (error) return <ErrorScreen message={error} isRateLimit={isRateLimit} />;
  if (!result) return <ErrorScreen message="No battle data received." />;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* View Mode Toggle */}
      <ViewToggle
        currentView={viewMode}
        onChangeView={handleViewChange}
        f1Name={result.fighter1.name}
        f2Name={result.fighter2.name}
      />

      {/* Arena View */}
      {viewMode === "arena" && (
        <>
          <BattleArena
            fighter1={result.fighter1}
            fighter2={result.fighter2}
            lastEvent={lastEvent}
          />
          <BattleHUD
            fighter1={result.fighter1}
            fighter2={result.fighter2}
            winner={result.winner}
            lastEvent={lastEvent}
            eventLog={eventLog}
          />
        </>
      )}

      {/* Town View — Fighter 1 */}
      {viewMode === "town1" && town1Data && (
        <>
          <TownScene townData={town1Data} fighterColor="#ff6a00" />
          <TownHUD
            townData={town1Data}
            fighterLabel={result.fighter1.name}
            fighterColor="#ff6a00"
            onBack={handleBackToArena}
          />
        </>
      )}

      {/* Town View — Fighter 2 */}
      {viewMode === "town2" && town2Data && (
        <>
          <TownScene townData={town2Data} fighterColor="#00e5ff" />
          <TownHUD
            townData={town2Data}
            fighterLabel={result.fighter2.name}
            fighterColor="#00e5ff"
            onBack={handleBackToArena}
          />
        </>
      )}

      {/* Fallback if town data failed */}
      {(viewMode === "town1" && !town1Data) ||
      (viewMode === "town2" && !town2Data) ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "#0a0a0f" }}
        >
          <div className="hud-card text-center">
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "12px",
              }}
            >
              Town data unavailable for this repo
            </p>
            <button onClick={handleBackToArena} className="hud-back-btn">
              ← BACK TO ARENA
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Battle Page
   ═══════════════════════════════════════════════════════ */
export default function BattlePage() {
  return (
    <Suspense fallback={<LoadingScreen status="Initializing systems..." />}>
      <BattleContent />
    </Suspense>
  );
}
