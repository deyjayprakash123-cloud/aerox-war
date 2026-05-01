import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/* ═══════════════════════════════════════════════════════
   AEROX-WAR — TOWN API v2
   Fetches repo file tree to generate procedural town.
   Includes in-memory cache + rate limit handling.
   ═══════════════════════════════════════════════════════ */

export interface RepoFile {
  path: string;
  name: string;
  type: "file" | "dir";
  size: number;
  extension: string;
}

export interface TownData {
  repoName: string;
  repoFullName: string;
  language: string;
  stars: number;
  files: RepoFile[];
  totalFiles: number;
  totalSize: number;
  directories: number;
}

// ── In-memory cache ──
const cache = new Map<string, { data: TownData; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

function getHeaders(userToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AEROX-WAR/2.0",
  };
  const token = userToken || process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Check rate limit from response
function checkRateLimit(res: Response, context: string) {
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (
    res.status === 403 ||
    res.status === 429 ||
    remaining === "0"
  ) {
    const resetTime = res.headers.get("x-ratelimit-reset");
    const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
    const waitMin = resetDate
      ? Math.ceil((resetDate.getTime() - Date.now()) / 60000)
      : "?";
    throw new Error(
      `RATE_LIMIT: GitHub API rate limit hit during ${context}. Resets in ~${waitMin} min. ` +
      `Add GITHUB_TOKEN in .env.local for 5,000 req/hr.`
    );
  }
}

const EXCLUDED_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp",
  ".mp4", ".mp3", ".wav", ".ogg", ".webm",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz", ".rar",
  ".wasm", ".lock", ".min.js", ".min.css",
  ".pdf", ".doc", ".docx",
]);

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo } = body;

    if (!repo) {
      return NextResponse.json(
        { error: "repo URL is required" },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(repo);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL format" },
        { status: 400 }
      );
    }

    const { owner, repo: repoName } = parsed;
    const cacheKey = `town:${owner}/${repoName}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json(cached.data);
    }

    // Get user's OAuth token if logged in
    const session = await auth();
    const userToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
    const headers = getHeaders(userToken);

    // Fetch repo info
    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      { headers }
    );

    if (!repoRes.ok) {
      checkRateLimit(repoRes, "repo info");

      if (repoRes.status === 404) {
        throw new Error(`Repository "${owner}/${repoName}" not found.`);
      }
      throw new Error(`GitHub API error: ${repoRes.status}`);
    }

    const repoData = await repoRes.json();

    // Fetch file tree (recursive)
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${repoData.default_branch}?recursive=1`,
      { headers }
    );

    if (!treeRes.ok) {
      checkRateLimit(treeRes, "file tree");
      throw new Error(`Failed to fetch file tree: ${treeRes.status}`);
    }

    const treeData = await treeRes.json();

    const files: RepoFile[] = [];
    let totalSize = 0;
    let directories = 0;

    if (Array.isArray(treeData.tree)) {
      for (const item of treeData.tree) {
        if (item.path.includes("node_modules/")) continue;
        if (item.path.includes(".git/")) continue;
        if (item.path.startsWith(".")) continue;

        const ext = getExtension(item.path);
        if (EXCLUDED_EXT.has(ext)) continue;

        const name = item.path.split("/").pop() || item.path;

        if (item.type === "blob") {
          const size = item.size || 0;
          files.push({ path: item.path, name, type: "file", size, extension: ext });
          totalSize += size;
        } else if (item.type === "tree") {
          directories++;
          files.push({ path: item.path, name, type: "dir", size: 0, extension: "" });
        }
      }
    }

    const codeFiles = files
      .filter((f) => f.type === "file")
      .sort((a, b) => b.size - a.size)
      .slice(0, 200);

    const dirFiles = files.filter((f) => f.type === "dir").slice(0, 30);

    const townData: TownData = {
      repoName: repoData.name,
      repoFullName: repoData.full_name,
      language: repoData.language || "Unknown",
      stars: repoData.stargazers_count || 0,
      files: [...dirFiles, ...codeFiles],
      totalFiles: codeFiles.length,
      totalSize,
      directories,
    };

    // Cache it
    cache.set(cacheKey, { data: townData, expires: Date.now() + CACHE_TTL });

    return NextResponse.json(townData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    const isRateLimit = message.includes("RATE_LIMIT");

    return NextResponse.json(
      {
        error: isRateLimit ? message.replace("RATE_LIMIT: ", "") : message,
        isRateLimit,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
