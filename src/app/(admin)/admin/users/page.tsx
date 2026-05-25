import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDatetime } from "@/lib/utils";
import { Users, Crown, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Users — Admin" };

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  PRO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ENTERPRISE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  ADMIN: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  SUPER_ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      _count: { select: { quotes: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">{users.length} registered accounts</p>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" /> All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quotes</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">This Month</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const plan = user.subscription?.plan ?? "FREE";
                  const subStatus = user.subscription?.status ?? "—";
                  return (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.name ?? "—"}</div>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                        {user.companyName && (
                          <div className="text-muted-foreground text-xs">{user.companyName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[user.role] ?? ROLE_COLORS.USER}`}>
                          {user.role === "SUPER_ADMIN" && <Crown className="h-3 w-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${PLAN_COLORS[plan] ?? PLAN_COLORS.FREE}`}>
                            {plan}
                          </span>
                          {user.subscription && (
                            <div className="text-xs text-muted-foreground">{subStatus}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{user._count.quotes}</td>
                      <td className="px-4 py-3">{user.quotesThisMonth}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDatetime(user.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No users yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
