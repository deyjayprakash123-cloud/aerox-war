"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BattleEvent } from "@/types/battle";

/* ═══════════════════════════════════════════════════════
   useWebSocket — Simulated real-time battle events
   
   Generates random "star", "pr_merged", "power_surge",
   "commit_burst", "new_commit", "new_issue", and "new_star"
   events at intervals to drive 3D battle animations.
   
   Real-Time JSON Triggers:
     NEW_COMMIT → Nitro Boost (engine trail flare)
     NEW_ISSUE  → Shield Flicker (taking damage)
     NEW_STAR   → Sonic Boom (ring expansion)
   
   Architecture supports swapping in real WebSocket later.
   ═══════════════════════════════════════════════════════ */

interface UseWebSocketOptions {
  enabled: boolean;
  minInterval?: number; // ms between events
  maxInterval?: number;
}

export function useWebSocket({
  enabled,
  minInterval = 3000,
  maxInterval = 8000,
}: UseWebSocketOptions) {
  const [lastEvent, setLastEvent] = useState<BattleEvent | null>(null);
  const [eventLog, setEventLog] = useState<BattleEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fighters: Array<"fighter1" | "fighter2"> = ["fighter1", "fighter2"];

  const generateEvent = useCallback((): BattleEvent => {
    const fighter = fighters[Math.floor(Math.random() * 2)];
    const roll = Math.random();

    // Original events (~60%)
    if (roll < 0.20) {
      return { type: "star", fighter };
    } else if (roll < 0.35) {
      return { type: "pr_merged", fighter };
    } else if (roll < 0.50) {
      return {
        type: "commit_burst",
        fighter,
        count: Math.floor(Math.random() * 8) + 2,
      };
    } else if (roll < 0.60) {
      return {
        type: "power_surge",
        fighter,
        delta: Math.round((Math.random() * 5 + 1) * 100) / 100,
      };
    }
    // ── Real-Time JSON Triggers (~40%) ──
    else if (roll < 0.75) {
      // NEW_COMMIT → Nitro Boost effect on Jet's engine trail
      return { type: "new_commit", fighter };
    } else if (roll < 0.88) {
      // NEW_ISSUE → Shield Flicker effect (taking damage)
      return { type: "new_issue", fighter };
    } else {
      // NEW_STAR → Sonic Boom ring expansion
      return { type: "new_star", fighter };
    }
  }, []);

  const scheduleNext = useCallback(() => {
    const delay =
      Math.random() * (maxInterval - minInterval) + minInterval;
    timerRef.current = setTimeout(() => {
      const event = generateEvent();
      setLastEvent(event);
      setEventLog((prev) => [...prev.slice(-20), event]); // Keep last 20
      scheduleNext();
    }, delay);
  }, [generateEvent, minInterval, maxInterval]);

  useEffect(() => {
    if (!enabled) return;

    // Start after initial delay
    const startDelay = setTimeout(() => {
      scheduleNext();
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, scheduleNext]);

  const clearEvents = useCallback(() => {
    setEventLog([]);
    setLastEvent(null);
  }, []);

  return { lastEvent, eventLog, clearEvents };
}
