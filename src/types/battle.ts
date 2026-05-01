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
}

export interface RumbleResult {
  fighter1: RepoStats;
  fighter2: RepoStats;
  winner: "fighter1" | "fighter2" | "draw";
}

export type BattleEvent =
  | { type: "star"; fighter: "fighter1" | "fighter2" }
  | { type: "pr_merged"; fighter: "fighter1" | "fighter2" }
  | { type: "power_surge"; fighter: "fighter1" | "fighter2"; delta: number }
  | { type: "commit_burst"; fighter: "fighter1" | "fighter2"; count: number };
