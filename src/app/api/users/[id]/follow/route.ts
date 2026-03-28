import { NextResponse } from "next/server";

import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: targetUserId } = await params;
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const relation = await prisma.userRelationship.upsert({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUserId,
      },
    },
    create: {
      followerId: userId,
      followingId: targetUserId,
      status: "FOLLOWING",
    },
    update: {
      status: "FOLLOWING",
    },
  });

  return NextResponse.json({ relation }, { status: 201 });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: targetUserId } = await params;

  await prisma.userRelationship.deleteMany({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  return NextResponse.json({ success: true });
}
