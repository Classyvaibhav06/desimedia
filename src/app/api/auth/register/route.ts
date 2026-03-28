import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email, username, displayName, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
