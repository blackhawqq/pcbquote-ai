import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PLANS } from "@/lib/stripe";
import {
  FileText, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle,
  BarChart3, Zap, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [user, recentQuotes, totalQuotes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    }),
    prisma.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, referenceNo: true, status: true,
        width: true, height: true, layers: true,
        quantity: true, totalCost: true, currency: true,
        leadTimeDays: true, complexityScore: true,
        dfmScore: true, createdAt: true,
      },
    }),
    prisma.quote.count({ where: { userId: session.user.id } }),
  ]);

  const plan = (user?.subscription?.plan ?? "FREE") as keyof typeof PLANS;
  const planLimits = PLANS[plan];
  const quotesUsed = user?.quotesThisMonth ?? 0;
  const quotesLimit = planLimits.quotesPerMonth;
  const quotesRemaining = quotesLimit === -1 ? null : Math.max(0, quotesLimit - quotesUsed);
  const limitReached = quotesLimit !== -1 && quotesUsed >= quotesLimit;

  const avgCost = recentQuotes.reduce((sum, q) => sum + (q.totalCost ?? 0), 0) / (recentQuotes.length || 1);
  const avgComplexity = recentQuotes.reduce((sum, q) => sum + (q.complexityScore ?? 0), 0) / (recentQuotes.length || 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0] ?? "Engineer"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your PCB quoting overview
          </p>
        </div>
        <Button asChild variant="gradient" size="lg">
          <Link href="/upload">
            <Plus className="h-5 w-5" /> New Quote
          </Link>
        </Button>
      </div>

      {/* Plan limit warning */}
      {limitReached && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Monthly quote limit reached</p>
            <p className="text-xs text-muted-foreground">Upgrade to Pro for unlimited quotes</p>
          </div>
          <Button asChild size="sm" variant="gradient">
            <Link href="/subscription">Upgrade</Link>
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass glow-blue">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">Total Quotes</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{totalQuotes}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">This Month</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-3xl font-bold">{quotesUsed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {quotesRemaining !== null ? `${quotesRemaining} remaining` : "Unlimited"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">Avg. Quote Value</span>
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{formatCurrency(avgCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 5 quotes</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">Avg. Complexity</span>
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold">{Math.round(avgComplexity)}/100</div>
            <p className="text-xs text-muted-foreground mt-1">PCB complexity score</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Status */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{planLimits.name} Plan</span>
                  <Badge variant={plan === "PRO" ? "pro" : plan === "ENTERPRISE" ? "enterprise" : "secondary"}>
                    {plan}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {quotesLimit === -1 ? "Unlimited quotes" : `${quotesUsed}/${quotesLimit} quotes used this month`}
                </p>
              </div>
            </div>
            {plan === "FREE" && (
              <Button asChild variant="gradient" size="sm">
                <Link href="/subscription">Upgrade to Pro <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            )}
          </div>

          {quotesLimit !== -1 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Monthly Usage</span>
                <span>{quotesUsed}/{quotesLimit}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (quotesUsed / quotesLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Quotes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/quotes">View All <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {recentQuotes.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No quotes yet</h3>
              <p className="text-muted-foreground mb-6">Create your first PCB quote to get started</p>
              <Button asChild variant="gradient">
                <Link href="/upload"><Plus className="h-4 w-4" /> Create Quote</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentQuotes.map((quote) => (
              <Link key={quote.id} href={`/quotes/${quote.referenceNo}`}>
                <Card className="glass hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">#{quote.referenceNo.slice(-8)}</span>
                            <Badge variant={quote.status === "COMPLETED" ? "success" : "warning"} className="text-xs">
                              {quote.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {quote.width}×{quote.height}mm · {quote.layers}L · Qty {quote.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-sm font-semibold">{formatCurrency(quote.totalCost ?? 0, quote.currency)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {quote.leadTimeDays}d lead
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className={`text-sm font-semibold ${(quote.dfmScore ?? 0) >= 80 ? "text-green-400" : (quote.dfmScore ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                            DFM {quote.dfmScore}/100
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
