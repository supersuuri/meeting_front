import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        // replace this with your own user lookup
        if (creds?.username === "admin" && creds.password === "pass") {
          return { id: 1, name: "Admin" };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  // optionally set custom pages:
  // pages: { signIn: "/login" },
});

export { handler as GET, handler as POST };
