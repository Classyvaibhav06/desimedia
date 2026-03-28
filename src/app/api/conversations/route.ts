import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

const createConversationSchema = z.object({
  type: z.enum(["DM", "GROUP"]),
  participantIds: z.array(z.string()).min(1),
  groupName: z.string().min(1).max(64).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true, senderId: true },
      },
    },
    take: 50,
  });

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createConversationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { type, participantIds, groupName } = parsed.data;
  const uniqueParticipants = Array.from(new Set([...participantIds, userId]));

  if (type === "DM" && uniqueParticipants.length !== 2) {
    return NextResponse.json(
      { error: "DM requires exactly 2 participants" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.create({
    data: {
      type,
      groupName: type === "GROUP" ? groupName ?? "New Group" : null,
      createdById: userId,
      participants: {
        create: uniqueParticipants.map((id) => ({
          userId: id,
          role: id === userId ? "OWNER" : "MEMBER",
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
