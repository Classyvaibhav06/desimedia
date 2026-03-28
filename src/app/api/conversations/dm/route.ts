import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

const createDmSchema = z.object({
  targetUserId: z.string().min(1),
});

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createDmSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { targetUserId } = parsed.data;
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DM",
      participants: {
        some: { userId },
      },
      AND: [
        { participants: { some: { userId: targetUserId } } },
        { NOT: { participants: { some: { userId: { notIn: [userId, targetUserId] } } } } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "DM",
      createdById: userId,
      participants: {
        create: [
          { userId, role: "OWNER" },
          { userId: targetUserId, role: "MEMBER" },
        ],
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}
