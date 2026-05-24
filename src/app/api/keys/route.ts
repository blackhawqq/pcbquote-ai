import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      permissions: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check Pro/Enterprise subscription
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  const plan = user?.subscription?.plan;
  if (plan !== "PRO" && plan !== "ENTERPRISE") {
    return NextResponse.json({ error: "API access requires Pro or Enterprise plan" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const rawKey = generateApiKey();
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = await bcrypt.hash(rawKey, 10);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      keyHash,
      keyPrefix,
      permissions: JSON.stringify(["quotes:read", "quotes:create"]),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "API_KEY_CREATED",
      metadata: JSON.stringify({ keyId: apiKey.id, name }),
    },
  });

  // Return raw key ONCE â€” never stored in plaintext
  return NextResponse.json({ id: apiKey.id, key: rawKey, prefix: keyPrefix }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  await prisma.apiKey.updateMany({
    where: { id, userId: session.user.id },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "API_KEY_REVOKED",
      metadata: JSON.stringify({ keyId: id }),
    },
  });

  return NextResponse.json({ success: true });
}

