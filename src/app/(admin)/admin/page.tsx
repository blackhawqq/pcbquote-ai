import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDatetime } from "@/lib/utils";
import { Users, FileText, TrendingUp, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  await requireAdmin();

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsers, totalQuotes, newQuotes, proSubs, enterpriseSubs, recentLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      prisma.quote.count(),
      prisma.quote.count({ where: { createdAt: { gte: since30 } } }),
      prisma.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
      prisma.subscription.count({ where: { plan: "ENTERPRISE", status: "ACTIVE" } }),
      prisma.auditLog.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  const mrr = proSubs * 49 + enterpriseSubs * 199;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Activity className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Platform overview and analytics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, sub: `+${newUsers} this month`, icon: Users, color: "text-blue-400" },
          { label: "Total Quotes", value: totalQuotes, sub: `+${newQuotes} this month`, icon: FileText, color: "text-green-400" },
          { label: "Active Subscriptions", value: proSubs + enterpriseSubs, sub: `${proSubs} Pro · ${enterpriseSubs} Enterprise`, icon: TrendingUp, color: "text-purple-400" },
          { label: "Estimated MRR", value: `$${mrr.toLocaleString()}`, sub: "Monthly recurring revenue", icon: DollarSign, color: "text-yellow-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-xs">{s.label}</span>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Audit Log */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <Badge variant="outline" className="text-xs shrink-0">{log.action}</Badge>
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {log.user?.name ?? log.user?.email ?? "System"}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{formatDatetime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
