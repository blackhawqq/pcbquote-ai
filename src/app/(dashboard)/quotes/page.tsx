import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, Clock, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Quote History" };

export default async function QuotesPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await getSession();
  if (!session) return null;

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.quote.count({ where: { userId: session.user.id } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quote History</h1>
          <p className="text-muted-foreground mt-1">{total} total quotes</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/upload"><Plus className="h-4 w-4" /> New Quote</Link>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-20 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground mb-6">Create your first PCB quote to see it here</p>
            <Button asChild variant="gradient">
              <Link href="/upload"><Plus className="h-4 w-4" /> Create First Quote</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {quotes.map((quote) => (
              <Link key={quote.id} href={`/quotes/${quote.referenceNo}`}>
                <Card className="glass hover:border-primary/30 transition-all cursor-pointer hover:-translate-y-0.5">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium">#{quote.referenceNo.slice(-12).toUpperCase()}</span>
                          <Badge variant={quote.status === "COMPLETED" ? "success" : "warning"}>
                            {quote.status}
                          </Badge>
                          {quote.dfmScore !== null && (
                            <Badge variant={quote.dfmScore >= 80 ? "success" : quote.dfmScore >= 60 ? "warning" : "destructive"}>
                              DFM {quote.dfmScore}/100
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {quote.width}×{quote.height}mm · {quote.layers} layers ·
                          {quote.surfaceFinish.replace(/_/g, " ")} ·
                          Qty {quote.quantity} ·
                          {quote.smtAssembly ? " SMT" : ""}
                          {quote.throughHoleAssembly ? " TH Assembly" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-8 md:text-right">
                        <div>
                          <div className="font-bold">{formatCurrency(quote.totalCost ?? 0, quote.currency)}</div>
                          <div className="text-xs text-muted-foreground">Total Cost</div>
                        </div>
                        <div className="hidden md:block">
                          <div className="text-sm font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {quote.leadTimeDays} days
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/quotes?page=${p}`}>
                  <Button variant={p === page ? "default" : "outline"} size="sm">
                    {p}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
