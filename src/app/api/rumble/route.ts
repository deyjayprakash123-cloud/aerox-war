import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { computeFairnessScore, compareFairly } from "@/lib/fairComparison";

/* ═══════════════════════════════════════════════════════
   AEROX-WAR — RUMBLE API v3 (Fair Comparison Engine)
   
   Uses GitHub GraphQL API — ONE query per repo.
   Includes in-memory cache (1-min TTL) for hot data.
   
   Battle Stats fetched:
     Vitality     → pushedAt
     Stamina      → commitHistory (30d)
     Defense      → vulnerabilityAlerts
     Efficiency   → closedIssues / totalIssues (90d)
     Community    → mentionableUsers
   
   Fairness Algorithm:
     Maintainability (60%) = (MergedPRs/TotalPRs)*0.4
                           + (ClosedBugs/OpenBugs)*0.6
                           - stalePenalty
     Community      (30%) = star/fork 24hr growth %
     Security       (10%) = 1.0 - 0.2 × criticalAlerts
   
   Thermal Overload: On 403/429, returns last cached
   entry as simulatedData + requiresAuth flag.
   ═══════════════════════════════════════════════════════ */

interface RepoStats {
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

  /* ── Battle Stats ── */
  pushedAt: string;
  commitHistory30d: number;
  vulnerabilityAlerts: number;
  mergedPRs: number;
  totalPRs: number;
  openBugs: number;
  closedBugs: number;
  mentionableUsers: number;
  starsToday: number;
  forksToday: number;

  fairnessScore?: {
    maintainabilityIndex: number;
    communityMomentum: number;
    securityArmor: number;
    totalFairScore: number;
    penalties: string[];
  };
}

interface RumbleResponse {
  fighter1: RepoStats;
  fighter2: RepoStats;
  winner: "fighter1" | "fighter2" | "draw";
  fairWinner?: "fighter1" | "fighter2" | "draw";
  isSimulated?: boolean;
}

// ── In-memory cache (survives across requests in the same process) ──
const cache = new Map<string, { data: RepoStats; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// ── Thermal Overload: Last successful rumble result ──
let lastSuccessfulRumble: RumbleResponse | null = null;

function getCached(key: string): RepoStats | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: RepoStats) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

// ── Parse owner/repo from URL ──
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.trim().replace(/\/+$/, "");

    if (cleaned.includes("github.com")) {
      const parsed = new URL(
        cleaned.startsWith("http") ? cleaned : `https://${cleaned}`
      );
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    }

    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
    return null;
  } catch {
    return null;
  }
}

// ── GitHub auth headers ──
// Priority: user's OAuth token > env GITHUB_TOKEN > unauthenticated
function getHeaders(userToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "AEROX-WAR/3.0",
    "Content-Type": "application/json",
  };

  const token = userToken || process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// Store the active user token for the current request
let activeUserToken: string | undefined;

// ── GraphQL query v3 — fetches ALL Battle Stats in one call ──
const REPO_QUERY = `
query RepoStats(
  $owner: String!,
  $name: String!,
  $since7d: GitTimestamp!,
  $since30d: GitTimestamp!
) {
  repository(owner: $owner, name: $name) {
    name
    nameWithOwner
    owner { avatarUrl }
    stargazerCount
    forkCount
    diskUsage
    pushedAt
    primaryLanguage { name }
    
    # Commit velocity (last 7 days)
    defaultBranchRef {
      target {
        ... on Commit {
          history7d: history(first: 1, since: $since7d) {
            totalCount
          }
          history30d: history(first: 1, since: $since30d) {
            totalCount
          }
        }
      }
    }
    
    # Open issues count
    openIssues: issues(states: OPEN) {
      totalCount
    }
    
    # Closed issues count  
    closedIssues: issues(states: CLOSED) {
      totalCount
    }
    
    # Open bugs (issues with "bug" label, open)
    openBugs: issues(states: OPEN, labels: ["bug"]) {
      totalCount
    }
    
    # Closed bugs (issues with "bug" label, closed)
    closedBugs: issues(states: CLOSED, labels: ["bug"]) {
      totalCount
    }
    
    # Pull requests — merged
    mergedPRs: pullRequests(states: MERGED) {
      totalCount
    }
    
    # Pull requests — total
    totalPRs: pullRequests {
      totalCount
    }
    
    # Vulnerability alerts count
    vulnerabilityAlerts(first: 1) {
      totalCount
    }
    
    # Contributors (mentionable users as proxy)
    mentionableUsers(first: 1) {
      totalCount
    }
  }
}
`;

// ── Fetch via GraphQL (1 API call per repo) ──
async function fetchRepoGraphQL(
  owner: string,
  repo: string
): Promise<RepoStats> {
  const cacheKey = `${owner}/${repo}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const now = Date.now();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const headers = getHeaders(activeUserToken);

  // Try GraphQL first (1 call = everything)
  const gqlRes = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: REPO_QUERY,
      variables: {
        owner,
        name: repo,
        since7d: oneWeekAgo,
        since30d: thirtyDaysAgo,
      },
    }),
    cache: "no-store",
  });

  if (gqlRes.ok) {
    const gqlData = await gqlRes.json();

    if (gqlData.data?.repository) {
      const r = gqlData.data.repository;
      const stats = buildStats(r);
      setCache(cacheKey, stats);
      return stats;
    }

    // GraphQL returned but with errors (e.g., repo not found)
    if (gqlData.errors) {
      const errMsg = gqlData.errors[0]?.message || "Repository not found";
      throw new Error(`GitHub: ${errMsg} (${owner}/${repo})`);
    }
  }

  // Check for rate limit on GraphQL response
  if (gqlRes.status === 403 || gqlRes.status === 429) {
    throw new Error(
      `RATE_LIMIT: GitHub API rate limit exceeded. Add a GITHUB_TOKEN in .env.local for 5,000 requests/hour.`
    );
  }

  // ── Fallback to REST API if GraphQL fails ──
  // (happens when no token is set — GraphQL requires auth)
  return fetchRepoREST(owner, repo);
}

// ── REST fallback (for unauthenticated users) ──
// Optimized: only 2 API calls instead of 5
async function fetchRepoREST(
  owner: string,
  repo: string
): Promise<RepoStats> {
  const cacheKey = `${owner}/${repo}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AEROX-WAR/3.0",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  // Call 1: Basic repo info (includes stars, forks, language, size, open_issues)
  const repoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers, cache: "no-store" }
  );

  if (!repoRes.ok) {
    const remaining = repoRes.headers.get("x-ratelimit-remaining");
    const status = repoRes.status;

    if (status === 403 || status === 429 || remaining === "0") {
      const resetTime = repoRes.headers.get("x-ratelimit-reset");
      const resetDate = resetTime
        ? new Date(parseInt(resetTime) * 1000)
        : null;
      const waitMin = resetDate
        ? Math.ceil((resetDate.getTime() - Date.now()) / 60000)
        : "?";
      throw new Error(
        `RATE_LIMIT: GitHub API rate limit exceeded. Resets in ~${waitMin} minutes. ` +
          `Add a GITHUB_TOKEN in .env.local for 5,000 requests/hour.`
      );
    }

    if (status === 404) {
      throw new Error(
        `Repository "${owner}/${repo}" not found. Check the URL and try again.`
      );
    }

    throw new Error(
      `GitHub API error for ${owner}/${repo}: ${status} ${repoRes.statusText}`
    );
  }

  const repoData = await repoRes.json();

  // Call 2: Commits in last 7 days (for velocity)
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  let commitVelocity = 0;
  try {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?since=${oneWeekAgo}&per_page=100`,
      { headers, cache: "no-store" }
    );
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      commitVelocity = Array.isArray(commits) ? commits.length : 0;
    }
  } catch {
    // Silently fail — velocity defaults to 0
  }

  // Derive stats from repo data (no extra API calls needed)
  const openIssues = repoData.open_issues_count || 0;
  // Estimate closed issues from open ratio (avoid extra API call)
  const closedIssues = Math.round(openIssues * 2.5); // heuristic
  const issueResolution =
    openIssues === 0 ? (closedIssues > 0 ? 10 : 1) : Math.min(closedIssues / openIssues, 10);

  const repoSizeKb = repoData.size || 0;
  const complexityScore = Math.log10((repoSizeKb * 25) || 1) * 20; // Logarithmic scaling for codebase size
  const healthScore = issueResolution * 10; // Bug resolution health
  const velocityScore = Math.min(commitVelocity * 1.5, 100); // Code shipment speed

  // Purely technical, merit-based power score (ignores popularity/stars)
  const powerScore = Math.round((complexityScore * 0.4) + (velocityScore * 0.3) + (healthScore * 0.3));


  const stats: RepoStats = {
    name: repoData.name,
    fullName: repoData.full_name,
    avatarUrl: repoData.owner?.avatar_url || "",
    stars: repoData.stargazers_count || 0,
    commitVelocity,
    issueResolution: Math.round(issueResolution * 100) / 100,
    totalLinesOfCode: Math.round(repoSizeKb * 25),
    activeContributors: Math.max(1, Math.round(Math.sqrt(repoData.stargazers_count || 0) * 0.5)), // estimate
    openIssues,
    closedIssues,
    powerScore,
    language: repoData.language || "Unknown",
    forks: repoData.forks_count || 0,
    // REST fallback: estimate battle stats
    pushedAt: repoData.pushed_at || new Date().toISOString(),
    commitHistory30d: commitVelocity * 4, // rough estimate from 7d
    vulnerabilityAlerts: 0, // REST can't fetch this easily
    mergedPRs: 0,
    totalPRs: 0,
    openBugs: Math.round(openIssues * 0.3), // estimate 30% are bugs
    closedBugs: Math.round(closedIssues * 0.3),
    mentionableUsers: Math.max(1, Math.round(Math.sqrt(repoData.stargazers_count || 0) * 0.5)),
    starsToday: 0,
    forksToday: 0,
  };

  // Compute fairness score
  stats.fairnessScore = computeFairnessScore(stats);

  setCache(cacheKey, stats);
  return stats;
}

// ── Build stats from GraphQL response ──
function buildStats(r: Record<string, unknown>): RepoStats {
  const stars = (r.stargazerCount as number) || 0;
  const forks = (r.forkCount as number) || 0;
  const diskUsage = (r.diskUsage as number) || 0; // in KB
  const pushedAt = (r.pushedAt as string) || new Date().toISOString();

  // Commit velocity (7d and 30d)
  const defaultRef = r.defaultBranchRef as Record<string, unknown> | null;
  const target = defaultRef?.target as Record<string, unknown> | null;
  const history7d = target?.history7d as { totalCount: number } | null;
  const history30d = target?.history30d as { totalCount: number } | null;
  const commitVelocity = history7d?.totalCount || 0;
  const commitHistory30d = history30d?.totalCount || 0;

  // Issues
  const openObj = r.openIssues as { totalCount: number } | null;
  const closedObj = r.closedIssues as { totalCount: number } | null;
  const openIssues = openObj?.totalCount || 0;
  const closedIssues = closedObj?.totalCount || 0;

  const issueResolution =
    openIssues === 0
      ? closedIssues > 0 ? 10 : 1
      : Math.min(closedIssues / openIssues, 10);

  // Bugs
  const openBugsObj = r.openBugs as { totalCount: number } | null;
  const closedBugsObj = r.closedBugs as { totalCount: number } | null;
  const openBugs = openBugsObj?.totalCount || 0;
  const closedBugs = closedBugsObj?.totalCount || 0;

  // Pull Requests
  const mergedPRsObj = r.mergedPRs as { totalCount: number } | null;
  const totalPRsObj = r.totalPRs as { totalCount: number } | null;
  const mergedPRs = mergedPRsObj?.totalCount || 0;
  const totalPRs = totalPRsObj?.totalCount || 0;

  // Vulnerability Alerts
  const vulnObj = r.vulnerabilityAlerts as { totalCount: number } | null;
  const vulnerabilityAlerts = vulnObj?.totalCount || 0;

  // Contributors
  const mentionable = r.mentionableUsers as { totalCount: number } | null;
  const activeContributors = mentionable?.totalCount || 1;

  // Language
  const lang = r.primaryLanguage as { name: string } | null;

  // Owner avatar
  const ownerObj = r.owner as { avatarUrl: string } | null;

  // Complexity based on codebase size
  const complexityScore = Math.log10((diskUsage * 25) || 1) * 20; // Logarithmic scaling
  const healthScore = issueResolution * 10; // Bug resolution health
  const velocityScore = Math.min(commitVelocity * 1.5, 100); // Code shipment speed

  // Purely technical, merit-based power score (ignores popularity/stars)
  const powerScore = Math.round((complexityScore * 0.4) + (velocityScore * 0.3) + (healthScore * 0.3));

  const stats: RepoStats = {
    name: r.name as string,
    fullName: r.nameWithOwner as string,
    avatarUrl: ownerObj?.avatarUrl || "",
    stars,
    commitVelocity,
    issueResolution: Math.round(issueResolution * 100) / 100,
    totalLinesOfCode: Math.round(diskUsage * 25),
    activeContributors,
    openIssues,
    closedIssues,
    powerScore,
    language: lang?.name || "Unknown",
    forks,
    // Battle Stats
    pushedAt,
    commitHistory30d,
    vulnerabilityAlerts,
    mergedPRs,
    totalPRs,
    openBugs,
    closedBugs,
    mentionableUsers: activeContributors,
    starsToday: 0, // Would need separate historical API for precise delta
    forksToday: 0,
  };

  // Compute fairness score
  stats.fairnessScore = computeFairnessScore(stats);

  return stats;
}

// ── POST handler ──
export async function POST(request: NextRequest) {
  try {
    // Get the user's session token (if logged in via GitHub OAuth)
    const session = await auth();
    activeUserToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;

    const body = await request.json();
    const { repo1, repo2 } = body;

    if (!repo1 || !repo2) {
      return NextResponse.json(
        { error: "Both repo1 and repo2 URLs are required" },
        { status: 400 }
      );
    }

    const parsed1 = parseGitHubUrl(repo1);
    const parsed2 = parseGitHubUrl(repo2);

    if (!parsed1 || !parsed2) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub URL format. Use https://github.com/owner/repo",
        },
        { status: 400 }
      );
    }

    // Fetch both repos in parallel
    const [fighter1, fighter2] = await Promise.all([
      fetchRepoGraphQL(parsed1.owner, parsed1.repo),
      fetchRepoGraphQL(parsed2.owner, parsed2.repo),
    ]);

    // Determine winners
    let winner: "fighter1" | "fighter2" | "draw" = "draw";
    if (fighter1.powerScore > fighter2.powerScore) winner = "fighter1";
    else if (fighter2.powerScore > fighter1.powerScore) winner = "fighter2";

    // Fair winner (from fairness algorithm)
    const fairWinner = compareFairly(fighter1, fighter2);

    const response: RumbleResponse = { fighter1, fighter2, winner, fairWinner };

    // ── Thermal Overload Safeguard: cache last successful result ──
    lastSuccessfulRumble = response;

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Detect rate limit errors
    const isRateLimit = message.includes("RATE_LIMIT");
    const status = isRateLimit ? 429 : 500;

    // ── Thermal Overload: Return simulated data on rate limit ──
    if (isRateLimit && lastSuccessfulRumble) {
      return NextResponse.json(
        {
          ...lastSuccessfulRumble,
          isSimulated: true,
          thermalOverload: {
            isOverloaded: true,
            requiresAuth: true,
            message: message.replace("RATE_LIMIT: ", ""),
          },
          error: message.replace("RATE_LIMIT: ", ""),
          isRateLimit: true,
        },
        { status: 200 } // Return 200 with simulated data
      );
    }

    return NextResponse.json(
      {
        error: isRateLimit
          ? message.replace("RATE_LIMIT: ", "")
          : message,
        isRateLimit,
      },
      { status }
    );
  }
}
