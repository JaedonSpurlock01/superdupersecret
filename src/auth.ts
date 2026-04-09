import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isCommentAdmin } from "@/lib/comments/admin";

function resolveAuthSecret(): string | undefined {
  const fromEnv = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (fromEnv?.trim()) return fromEnv.trim();
  if (process.env.NODE_ENV !== "production") {
    return "development-only-auth-secret-not-for-production";
  }
  return undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: [GitHub],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account && profile && "id" in profile && profile.id != null) {
        token.id = String(profile.id);
      } else if (account?.providerAccountId) {
        token.id = account.providerAccountId;
      } else if (!token.id && typeof token.sub === "string") {
        token.id = token.sub;
      }
      return token;
    },
    session({ session, token }) {
      const id = typeof token.id === "string" ? token.id : undefined;
      if (session.user && id) {
        session.user.id = id;
        session.user.isCommentAdmin = isCommentAdmin(id);
      }
      return session;
    },
  },
});
