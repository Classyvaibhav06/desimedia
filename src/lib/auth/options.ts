import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

import { prisma } from "@/lib/db/prisma";

function normalizeHandle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "")
    .slice(0, 20);
}

async function getUniqueUsername(seed: string) {
  const base = normalizeHandle(seed) || "user";
  let candidate = base;

  for (let i = 0; i < 8; i += 1) {
    const exists = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }

    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return `${base}${Date.now().toString().slice(-5)}`;
}

async function ensureGoogleUser(email: string, name?: string | null) {
  const lowerEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: lowerEmail },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const usernameSeed = lowerEmail.split("@")[0] ?? "user";
  const username = await getUniqueUsername(usernameSeed);
  const passwordHash = await hash(randomBytes(24).toString("hex"), 10);

  const created = await prisma.user.create({
    data: {
      email: lowerEmail,
      username,
      displayName: name?.trim() || username,
      passwordHash,
    },
    select: { id: true },
  });

  return created.id;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return true;
      }

      const dbUserId = await ensureGoogleUser(user.email, user.name);
      user.id = dbUserId;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }

      if (!token.sub && token.email) {
        const existing = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true },
        });
        if (existing) {
          token.sub = existing.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
