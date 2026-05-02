/* ═══════════════════════════════════════════════════════
   AEROX-WAR — Fair Comparison Engine
   
   A weighted scoring algorithm that balances popularity
   with actual maintenance quality, security posture,
   and community momentum.
   
   Weights:
     Maintainability Index  — 60%
     Community Momentum     — 30%
     Security Armor         — 10%
   ═══════════════════════════════════════════════════════ */

import type { RepoStats, FairnessScore } from "@/types/battle";

/**
 * Maintainability Index (60% weight)
 * Formula: (MergedPRs / TotalPRs) * 0.4 + (ClosedBugs / OpenBugs) * 0.6
 * 
 * Measures how well the team maintains the codebase:
 * - PR merge rate shows review discipline
 * - Bug close rate shows responsiveness
 */
export function calculateMaintainabilityIndex(stats: RepoStats): number {
  // PR merge ratio (0 to 1)
  const prRatio =
    stats.totalPRs > 0
      ? Math.min(stats.mergedPRs / stats.totalPRs, 1.0)
      : 0.5; // neutral if no PRs exist

  // Bug resolution ratio (0 to 1, capped)
  let bugRatio: number;
  if (stats.openBugs === 0 && stats.closedBugs === 0) {
    bugRatio = 0.5; // neutral — no bugs tracked
  } else if (stats.openBugs === 0) {
    bugRatio = 1.0; // perfect — all bugs resolved
  } else {
    bugRatio = Math.min(stats.closedBugs / stats.openBugs, 1.0);
  }

  return prRatio * 0.4 + bugRatio * 0.6;
}

/**
 * Stale Penalty
 * Subtracts 0.1 for every 7 days since the last commit.
 * Returns a negative number (penalty) or 0.
 */
export function calculateStalePenalty(pushedAt: string): {
  penalty: number;
  daysSinceLastCommit: number;
} {
  if (!pushedAt) return { penalty: 0, daysSinceLastCommit: 0 };

  const lastPush = new Date(pushedAt).getTime();
  const now = Date.now();
  const daysSinceLastCommit = Math.floor((now - lastPush) / (1000 * 60 * 60 * 24));
  const weeksSinceLastCommit = Math.floor(daysSinceLastCommit / 7);

  // Each 7-day period costs 0.1
  const penalty = -(weeksSinceLastCommit * 0.1);

  return { penalty, daysSinceLastCommit };
}

/**
 * Community Momentum (30% weight)
 * Percentage growth of Stars/Forks in the last 24 hours.
 * Normalized to a 0-1 scale with logarithmic dampening.
 */
export function calculateCommunityMomentum(stats: RepoStats): number {
  // Star growth rate
  const starGrowth =
    stats.stars > 0
      ? stats.starsToday / stats.stars
      : stats.starsToday > 0
      ? 0.5
      : 0;

  // Fork growth rate
  const forkGrowth =
    stats.forks > 0
      ? stats.forksToday / stats.forks
      : stats.forksToday > 0
      ? 0.5
      : 0;

  // Combined momentum (weighted: stars 70%, forks 30%)
  const rawMomentum = starGrowth * 0.7 + forkGrowth * 0.3;

  // Logarithmic dampening to prevent viral spikes from dominating
  // Map to 0-1 scale: log(1 + momentum * 1000) / log(1001)
  const dampened = Math.log(1 + rawMomentum * 1000) / Math.log(1001);

  return Math.min(dampened, 1.0);
}

/**
 * Security Armor (10% weight)
 * Baseline: 1.0
 * Subtracts 0.2 for every critical vulnerability alert.
 * Floored at 0.
 */
export function calculateSecurityArmor(vulnerabilityAlerts: number): number {
  const armor = 1.0 - vulnerabilityAlerts * 0.2;
  return Math.max(armor, 0);
}

/**
 * Compute the complete Fairness Score for a repository.
 * Combines all sub-metrics with the specified weights.
 */
export function computeFairnessScore(stats: RepoStats): FairnessScore {
  const penalties: string[] = [];

  // 1. Maintainability Index (60%)
  const rawMaintainability = calculateMaintainabilityIndex(stats);
  const { penalty: stalePenalty, daysSinceLastCommit } = calculateStalePenalty(
    stats.pushedAt
  );

  const maintainabilityIndex = Math.max(rawMaintainability + stalePenalty, 0);

  if (stalePenalty < 0) {
    penalties.push(
      `Stale penalty: ${stalePenalty.toFixed(1)} (${daysSinceLastCommit} days since last commit)`
    );
  }

  // 2. Community Momentum (30%)
  const communityMomentum = calculateCommunityMomentum(stats);

  // 3. Security Armor (10%)
  const securityArmor = calculateSecurityArmor(stats.vulnerabilityAlerts);

  if (stats.vulnerabilityAlerts > 0) {
    penalties.push(
      `Security deduction: -${(stats.vulnerabilityAlerts * 0.2).toFixed(1)} (${stats.vulnerabilityAlerts} vulnerability alerts)`
    );
  }

  // Weighted composite
  const totalFairScore =
    maintainabilityIndex * 0.6 +
    communityMomentum * 0.3 +
    securityArmor * 0.1;

  return {
    maintainabilityIndex: Math.round(maintainabilityIndex * 1000) / 1000,
    communityMomentum: Math.round(communityMomentum * 1000) / 1000,
    securityArmor: Math.round(securityArmor * 1000) / 1000,
    totalFairScore: Math.round(totalFairScore * 1000) / 1000,
    penalties,
  };
}

/**
 * Compare two fighters using the fairness algorithm.
 * Returns the fair winner based on totalFairScore.
 */
export function compareFairly(
  fighter1: RepoStats,
  fighter2: RepoStats
): "fighter1" | "fighter2" | "draw" {
  const score1 = fighter1.fairnessScore?.totalFairScore ?? 0;
  const score2 = fighter2.fairnessScore?.totalFairScore ?? 0;

  // Allow a small tolerance for "draw" (within 1%)
  const tolerance = 0.01;
  const diff = Math.abs(score1 - score2);

  if (diff < tolerance) return "draw";
  return score1 > score2 ? "fighter1" : "fighter2";
}
