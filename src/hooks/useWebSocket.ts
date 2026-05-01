"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BattleEvent } from "@/types/battle";

/* ═══════════════════════════════════════════════════════
   useWebSocket — Simulated real-time battle events
   
   Generates random "star", "pr_merged", "power_surge",
   and "commit_burst" events at intervals to drive
   3D battle animations (firing, shield, shake).
   
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

    if (roll < 0.35) {
      return { type: "star", fighter };
    } else if (roll < 0.6) {
      return { type: "pr_merged", fighter };
    } else if (roll < 0.85) {
      return {
        type: "commit_burst",
        fighter,
        count: Math.floor(Math.random() * 8) + 2,
      };
    } else {
      return {
        type: "power_surge",
        fighter,
        delta: Math.round((Math.random() * 5 + 1) * 100) / 100,
      };
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
