import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30";
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalQuotes,
    newQuotes,
    proUsers,
    enterpriseUsers,
    recentAuditLogs,
    topUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.quote.count(),
    prisma.quote.count({ where: { createdAt: { gte: since } } }),
    prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    prisma.subscription.count({ where: { plan: "ENTERPRISE", status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { quotesThisMonth: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        quotesThisMonth: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      newUsers,
      totalQuotes,
      newQuotes,
      proUsers,
      enterpriseUsers,
      freeUsers: totalUsers - proUsers - enterpriseUsers,
    },
    recentAuditLogs,
    topUsers,
  });
}
