import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { StaffRole } from "@/lib/types";
import { resolveStaffForLogin } from "@/lib/directory";
import { loginSchema } from "@/lib/schemas/intake";
import {
  STAFF_SESSION_MAX_AGE_S,
  STAFF_SESSION_UPDATE_AGE_S,
} from "@/lib/session-security";

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.VERCEL === "1";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: StaffRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: StaffRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: StaffRole;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  useSecureCookies,
  session: {
    strategy: "jwt",
    maxAge: STAFF_SESSION_MAX_AGE_S,
    updateAge: STAFF_SESSION_UPDATE_AGE_S,
  },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const staff = await resolveStaffForLogin(parsed.data.email);
          if (!staff) return null;

          const valid = await compare(parsed.data.password, staff.passwordHash);
          if (!valid) return null;

          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role,
          };
        } catch (err) {
          console.error("[BLACKGATE] sign-in directory error", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      const email =
        typeof token.email === "string" ? token.email.toLowerCase() : null;
      if (email) {
        try {
          const staff = await resolveStaffForLogin(email);
          if (staff) {
            token.id = staff.id;
            token.role = staff.role;
          }
        } catch {
          // keep existing token if DB is briefly unavailable
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as StaffRole;
      }
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function canTriage(role: StaffRole): boolean {
  return role === "ADMIN" || role === "GATEKEEPER";
}

export function canEditIntake(role: StaffRole): boolean {
  return role === "ADMIN" || role === "GATEKEEPER" || role === "INTAKE_STAFF";
}

export function canPromote(role: StaffRole): boolean {
  return role === "ADMIN" || role === "GATEKEEPER";
}

export function canManageSettings(role: StaffRole): boolean {
  return role === "ADMIN";
}
