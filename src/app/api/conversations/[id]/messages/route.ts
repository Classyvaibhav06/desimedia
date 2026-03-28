import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  messageType: z.enum(["TEXT", "IMAGE", "VIDEO", "MEME", "SYSTEM"]).default("TEXT"),
  mediaUrl: z.string().url().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    include: {
      sender: {
        select: { id: true, displayName: true, username: true, avatarUrl: true },
      },
    },
  });

  const nextCursor = messages.length === limit ? messages[messages.length - 1]?.id : null;

  return NextResponse.json({
    messages: messages.reverse(),
    nextCursor,
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = createMessageSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: parsed.data.content,
      messageType: parsed.data.messageType,
      mediaUrl: parsed.data.mediaUrl,
    },
    include: {
      sender: {
        select: { id: true, displayName: true, username: true, avatarUrl: true },
      },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ message }, { status: 201 });
}
