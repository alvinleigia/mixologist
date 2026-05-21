import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: "MIXOLOGIST";
    };
  }

  interface User {
    role: "MIXOLOGIST";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "MIXOLOGIST";
  }
}
