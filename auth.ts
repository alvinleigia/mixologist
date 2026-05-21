import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

type MixologistRole = "MIXOLOGIST";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/mixologist/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const configuredUsername = process.env.MIXOLOGIST_USERNAME;
        const configuredPassword = process.env.MIXOLOGIST_PASSWORD;

        if (!configuredUsername || !configuredPassword) {
          throw new Error(
            "MIXOLOGIST_USERNAME and MIXOLOGIST_PASSWORD must be set in .env.local.",
          );
        }

        if (
          credentials?.username !== configuredUsername ||
          credentials?.password !== configuredPassword
        ) {
          return null;
        }

        return {
          id: "mixologist",
          name: configuredUsername,
          role: "MIXOLOGIST" satisfies MixologistRole,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: MixologistRole }).role ?? "MIXOLOGIST";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role =
          (typeof token.role === "string" ? token.role : "MIXOLOGIST") as MixologistRole;
      }

      return session;
    },
  },
});
