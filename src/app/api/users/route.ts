import { NextResponse } from "next/server";

import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: q
        ? [
            { displayName: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      avatarUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const following = await prisma.userRelationship.findMany({
    where: {
      followerId: userId,
      status: "FOLLOWING",
      followingId: { in: users.map((u) => u.id) },
    },
    select: { followingId: true },
  });

  const followingSet = new Set(following.map((row) => row.followingId));

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      isFollowing: followingSet.has(user.id),
    })),
  });
}
