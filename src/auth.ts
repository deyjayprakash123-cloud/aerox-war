import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/* ═══════════════════════════════════════════════════════
   AEROX-WAR — Auth Configuration
   
   GitHub OAuth so each user gets their own 5,000 req/hr.
   The user's accessToken is stored in the JWT and exposed
   to API routes via the session.
   ═══════════════════════════════════════════════════════ */

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      // Request minimal scope — just need the token for API calls
      authorization: {
        params: { scope: "read:user" },
      },
    }),
  ],
  callbacks: {
    // Persist the OAuth accessToken into the JWT
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // Expose accessToken to client via session
    async session({ session, token }) {
      (session as unknown as Record<string, unknown>).accessToken = token.accessToken;
      return session;
    },
  },
});
