import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  companyName: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  currency: z.string().length(3).optional(),
  language: z.string().max(10).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, name: true, email: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SETTINGS_UPDATED",
      metadata: JSON.stringify({ fields: Object.keys(parsed.data) }),
    },
  });

  return NextResponse.json({ user });
}

