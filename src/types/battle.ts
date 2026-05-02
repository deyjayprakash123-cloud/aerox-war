/* ═══════════════════════════════════════════════════════
   AEROX-WAR — Shared Types
   ═══════════════════════════════════════════════════════ */

export interface RepoStats {
  name: string;
  fullName: string;
  avatarUrl: string;
  stars: number;
  commitVelocity: number;
  issueResolution: number;
  totalLinesOfCode: number;
  activeContributors: number;
  openIssues: number;
  closedIssues: number;
  powerScore: number;
  language: string;
  forks: number;

  /* ── Battle Stats (Fair Comparison Engine) ── */
  pushedAt: string;              // Vitality — timestamp of last heartbeat
  commitHistory30d: number;      // Stamina — commit count in last 30 days
  vulnerabilityAlerts: number;   // Defense — security health
  mergedPRs: number;             // Maintainability — merged PR count
  totalPRs: number;              // Maintainability — total PR count
  openBugs: number;              // Bug ratio — open labeled "bug"
  closedBugs: number;            // Bug ratio — closed labeled "bug"
  mentionableUsers: number;      // Community — unique active people
  starsToday: number;            // Community momentum — 24hr star delta
  forksToday: number;            // Community momentum — 24hr fork delta

  /* ── Fairness Score ── */
  fairnessScore?: FairnessScore;
}

export interface FairnessScore {
  maintainabilityIndex: number;  // 60% weight
  communityMomentum: number;     // 30% weight
  securityArmor: number;         // 10% weight
  totalFairScore: number;        // Weighted composite
  penalties: string[];           // Human-readable penalty log
}

export interface RumbleResult {
  fighter1: RepoStats;
  fighter2: RepoStats;
  winner: "fighter1" | "fighter2" | "draw";
  fairWinner?: "fighter1" | "fighter2" | "draw";
}

export type BattleEvent =
  | { type: "star"; fighter: "fighter1" | "fighter2" }
  | { type: "pr_merged"; fighter: "fighter1" | "fighter2" }
  | { type: "power_surge"; fighter: "fighter1" | "fighter2"; delta: number }
  | { type: "commit_burst"; fighter: "fighter1" | "fighter2"; count: number }
  /* ── Real-Time JSON Triggers ── */
  | { type: "new_commit"; fighter: "fighter1" | "fighter2" }    // Nitro Boost
  | { type: "new_issue"; fighter: "fighter1" | "fighter2" }     // Shield Flicker
  | { type: "new_star"; fighter: "fighter1" | "fighter2" }      // Sonic Boom

export interface ThermalOverloadState {
  isOverloaded: boolean;
  simulatedData: RumbleResult | null;
  requiresAuth: boolean;
  message: string;
}
