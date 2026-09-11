import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { getClientIp } from "@/lib/utils";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isBanned: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isBanned?: boolean;
  }
}

// Simple in-memory rate limiter (per-process; use Upstash in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export const authConfig = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip = getClientIp(request.headers as Headers);
        if (isRateLimited(ip)) {
          throw new Error("RateLimitExceeded");
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("InvalidInput");
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          throw new Error("InvalidCredentials");
        }
        if (user.isBanned) {
          throw new Error("AccountBanned");
        }
        if (!user.isActive) {
          throw new Error("AccountInactive");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new Error("InvalidCredentials");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isBanned: user.isBanned,
        };
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role || "USER";
        token.isBanned = (user as { isBanned?: boolean }).isBanned || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as string) || "USER";
        session.user.isBanned = (token.isBanned as boolean) || false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      gender: true,
      dateOfBirth: true,
      city: true,
      province: true,
      clanId: true,
      subClanId: true,
      bio: true,
      bloodGroup: true,
      occupation: true,
      education: true,
      isVerified: true,
      role: true,
      isActive: true,
      isBanned: true,
      twoFactorEnabled: true,
      createdAt: true,
      clan: { select: { id: true, name: true, nameUrdu: true } },
      subClan: { select: { id: true, name: true, nameUrdu: true } },
    },
  });
  return user;
}
