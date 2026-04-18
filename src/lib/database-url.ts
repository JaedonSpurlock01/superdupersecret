/**
 * Returns true when DATABASE_URL is set and is not a known Prisma placeholder.
 */
export function isDatabaseUrlConfigured(): boolean {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return false;
  if (
    /\/\/johndoe:/i.test(connectionString) ||
    /:randompassword@/i.test(connectionString)
  ) {
    return false;
  }
  return true;
}
