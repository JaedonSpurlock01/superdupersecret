import fs from "node:fs/promises";
import path from "node:path";

/**
 * Where admin edits are persisted.
 *
 * - `github`: every save is a commit to the repo via the GitHub API. The host
 *   (e.g. Vercel) redeploys on push, so edits go live after the rebuild.
 * - `local`: reads/writes files in the working tree. Used in `next dev` when no
 *   GitHub token is configured; commit + push the changes yourself.
 * - `none`: production without GitHub config. The serverless filesystem is
 *   read-only/ephemeral, so editing is disabled rather than silently lost.
 */
export type StoreMode = "github" | "local" | "none";

export type FileChange =
  | { path: string; content: string; encoding?: "utf8" }
  | { path: string; content: string; encoding: "base64" }
  | { path: string; delete: true };

type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

function githubConfig(): GithubConfig | null {
  const token = process.env.ADMIN_GITHUB_TOKEN?.trim();
  const repoSlug = process.env.ADMIN_GITHUB_REPO?.trim();
  if (!token || !repoSlug) return null;
  const [owner, repo] = repoSlug.split("/");
  if (!owner || !repo) return null;
  return {
    token,
    owner,
    repo,
    branch: process.env.ADMIN_GITHUB_BRANCH?.trim() || "master",
  };
}

export function getStoreMode(): StoreMode {
  if (githubConfig()) return "github";
  if (process.env.NODE_ENV !== "production") return "local";
  return "none";
}

export class StoreError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
  }
}

/** Repo-relative paths only; blocks traversal and absolute paths. */
function assertSafePath(repoPath: string): string {
  const normalized = path.posix.normalize(repoPath);
  if (
    normalized.startsWith("..") ||
    path.posix.isAbsolute(normalized) ||
    normalized.includes("\0")
  ) {
    throw new StoreError(`Unsafe path: ${repoPath}`, 400);
  }
  return normalized;
}

// ---------------------------------------------------------------------------
// GitHub backend
// ---------------------------------------------------------------------------

async function gh<T>(
  cfg: GithubConfig,
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}${endpoint}`,
    {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${cfg.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...init.headers,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new StoreError(
      `GitHub API ${init.method ?? "GET"} ${endpoint} failed (${res.status}): ${body.slice(0, 300)}`,
      res.status === 404 ? 404 : 502,
    );
  }
  return (await res.json()) as T;
}

async function githubRead(
  cfg: GithubConfig,
  repoPath: string,
): Promise<string | null> {
  try {
    const data = await gh<{ content?: string; encoding?: string }>(
      cfg,
      `/contents/${encodeURI(repoPath)}?ref=${encodeURIComponent(cfg.branch)}`,
    );
    if (data.content == null) return null;
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch (err) {
    if (err instanceof StoreError && err.status === 404) return null;
    throw err;
  }
}

async function githubList(cfg: GithubConfig, dir: string): Promise<string[]> {
  try {
    const entries = await gh<{ name: string; type: string }[]>(
      cfg,
      `/contents/${encodeURI(dir)}?ref=${encodeURIComponent(cfg.branch)}`,
    );
    return entries.filter((e) => e.type === "file").map((e) => e.name);
  } catch (err) {
    if (err instanceof StoreError && err.status === 404) return [];
    throw err;
  }
}

/** Writes all changes as one atomic commit using the Git Data API. */
async function githubCommit(
  cfg: GithubConfig,
  changes: FileChange[],
  message: string,
): Promise<string> {
  const refPath = `/git/refs/heads/${encodeURIComponent(cfg.branch)}`;

  // Retry once if the branch moved between reading HEAD and updating the ref.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await gh<{ object: { sha: string } }>(cfg, refPath);
    const headSha = ref.object.sha;
    const head = await gh<{ tree: { sha: string } }>(
      cfg,
      `/git/commits/${headSha}`,
    );

    const tree = await Promise.all(
      changes.map(async (change) => {
        if ("delete" in change) {
          return { path: change.path, mode: "100644", type: "blob", sha: null };
        }
        const blob = await gh<{ sha: string }>(cfg, "/git/blobs", {
          method: "POST",
          body: JSON.stringify({
            content: change.content,
            encoding: change.encoding === "base64" ? "base64" : "utf-8",
          }),
        });
        return {
          path: change.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      }),
    );

    const newTree = await gh<{ sha: string }>(cfg, "/git/trees", {
      method: "POST",
      body: JSON.stringify({ base_tree: head.tree.sha, tree }),
    });
    const commit = await gh<{ sha: string }>(cfg, "/git/commits", {
      method: "POST",
      body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
    });

    try {
      await gh(cfg, refPath, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      return commit.sha;
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  throw new StoreError("Failed to update branch");
}

// ---------------------------------------------------------------------------
// Local filesystem backend (dev)
// ---------------------------------------------------------------------------

function localPath(repoPath: string): string {
  return path.join(process.cwd(), repoPath);
}

async function localRead(repoPath: string): Promise<string | null> {
  try {
    return await fs.readFile(localPath(repoPath), "utf8");
  } catch {
    return null;
  }
}

async function localList(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(localPath(dir), { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function localCommit(changes: FileChange[]): Promise<void> {
  for (const change of changes) {
    const target = localPath(change.path);
    if ("delete" in change) {
      await fs.rm(target, { force: true });
      continue;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(
      target,
      change.encoding === "base64"
        ? Buffer.from(change.content, "base64")
        : change.content,
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function readRepoFile(repoPath: string): Promise<string | null> {
  const safe = assertSafePath(repoPath);
  const cfg = githubConfig();
  return cfg ? githubRead(cfg, safe) : localRead(safe);
}

export async function listRepoDir(dir: string): Promise<string[]> {
  const safe = assertSafePath(dir);
  const cfg = githubConfig();
  return cfg ? githubList(cfg, safe) : localList(safe);
}

export type CommitResult = { mode: StoreMode; commitSha?: string };

export async function commitRepoFiles(
  changes: FileChange[],
  message: string,
): Promise<CommitResult> {
  const mode = getStoreMode();
  if (mode === "none") {
    throw new StoreError(
      "Editing is disabled: set ADMIN_GITHUB_TOKEN and ADMIN_GITHUB_REPO so edits can be committed.",
      503,
    );
  }
  const safeChanges = changes.map((c) => ({
    ...c,
    path: assertSafePath(c.path),
  }));
  const cfg = githubConfig();
  if (cfg) {
    const commitSha = await githubCommit(cfg, safeChanges, message);
    return { mode, commitSha };
  }
  await localCommit(safeChanges);
  return { mode };
}
