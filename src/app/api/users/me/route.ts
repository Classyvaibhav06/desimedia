import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

const updateMeSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          followers: {
            where: { status: "FOLLOWING" },
          },
          following: {
            where: { status: "FOLLOWING" },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updateMeSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const update = parsed.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: update.displayName,
      bio: update.bio,
      avatarUrl: update.avatarUrl === "" ? null : update.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}
