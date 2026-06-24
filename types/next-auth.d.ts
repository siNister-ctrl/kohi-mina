import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CASHIER" | "BARISTA";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "ADMIN" | "CASHIER" | "BARISTA";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "ADMIN" | "CASHIER" | "BARISTA";
  }
}
