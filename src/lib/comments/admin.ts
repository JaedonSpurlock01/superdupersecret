export function getCommentAdminGithubIds(): Set<string> {
  const raw = process.env.COMMENT_ADMIN_GITHUB_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isCommentAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  return getCommentAdminGithubIds().has(userId);
}
