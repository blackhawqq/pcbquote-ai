import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft, AlertTriangle, CheckCircle, Info,
  Layers, DollarSign, TrendingUp, Shield,
  Globe, BarChart2, Zap, Lightbulb, ExternalLink,
  Clock, RefreshCw, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DownloadPdfButton } from "@/components/quotes/download-pdf-button";
import type { AIResearchResult } from "@/lib/ai-research";
import type { ManufacturerPriceReport } from "@/lib/manufacturer-prices";

export const metadata: Metadata = { title: "Quote Details" };

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return null;

  const quote = await prisma.quote.findFirst({
    where: {
      OR: [{ id: params.id }, { referenceNo: params.id }],
      ...(session.user.role === "USER" ? { userId: session.user.id } : {}),
    },
    include: { user: { select: { name: true, email: true, companyName: true } } },
  });

  if (!quote) notFound();

  // ── Parse JSON fields ────────────────────────────────────────────────────
  type RiskAnalysisType = {
    overallRisk: string;
    risks: Array<{ category: string; level: string; description: string; recommendation: string }>;
  };

  let riskAnalysis: RiskAnalysisType | null = null;
  try { riskAnalysis = JSON.parse(quote.riskAnalysis as string); } catch { }

  const dfmWarnings: string[] = (() => {
    try { return JSON.parse(quote.dfmWarnings as string); } catch { return []; }
  })();

  const optimizationSuggestions: string[] = (() => {
    try { return JSON.parse(quote.optimizationSuggestions as string); } catch { return []; }
  })();

  let aiData: { ai?: AIResearchResult; manufacturers?: ManufacturerPriceReport } | null = null;
  try {
    const raw = JSON.parse((quote as Record<string, unknown>).aiAnalysis as string ?? "{}");
    if (raw?.manufacturers || raw?.ai) aiData = raw;
  } catch { }

  const mfgReport: ManufacturerPriceReport | null = aiData?.manufacturers ?? null;
  const aiAnalysis: AIResearchResult | null = aiData?.ai ?? null;

  const riskColor = (r: string) =>
    r === "LOW" ? "success" : r === "MEDIUM" ? "warning" : "destructive";

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/quotes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">#{quote.referenceNo.slice(-12).toUpperCase()}</h1>
            <p className="text-muted-foreground text-sm">{formatDate(quote.createdAt)}</p>
          </div>
          <Badge variant={quote.status === "COMPLETED" ? "success" : "warning"}>{quote.status}</Badge>
        </div>
        <DownloadPdfButton quoteId={quote.id} existingPdfUrl={quote.pdfUrl} />
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass glow-blue">
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(quote.totalCost ?? 0, quote.currency)}
            </div>
            <div className="text-xs text-muted-foreground">{quote.quantity} pcs</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground mb-1">Unit Cost</div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency((quote.totalCost ?? 0) / quote.quantity, quote.currency)}
            </div>
            <div className="text-xs text-muted-foreground">per board</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground mb-1">Lead Time</div>
            <div className="text-2xl font-bold">{quote.leadTimeDays} days</div>
            <div className="text-xs text-muted-foreground">estimated production</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground mb-1">Yield Estimate</div>
            <div className="text-2xl font-bold">{((quote.yieldEstimate ?? 0.95) * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">expected good boards</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Manufacturer Comparison ────────────────────────────────────────── */}
      {mfgReport && mfgReport.quotes.length > 0 ? (
        <Card className="glass border-sky-500/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-sky-400">
                <Globe className="h-5 w-5" />
                Manufacturer Comparison
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {mfgReport.marketData.copperPriceUsdPerKg && (
                  <span className="flex items-center gap-1">
                    <BarChart2 className="h-3 w-3" />
                    Cu: ${mfgReport.marketData.copperPriceUsdPerKg}/kg
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Updated: {new Date(mfgReport.generatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Prices calculated using live copper spot price and exchange rates.
              {mfgReport.marketData.copperPriceUsdPerKg
                ? ` Current copper: $${mfgReport.marketData.copperPriceUsdPerKg}/kg — price fluctuations are automatically reflected.`
                : " Market data temporarily unavailable, using calibrated estimates."}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {mfgReport.quotes.map((mfg, i) => (
              <div
                key={mfg.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  mfg.recommended
                    ? "border-sky-500/40 bg-sky-500/5"
                    : "border-border bg-card/50"
                }`}
              >
                {mfg.recommended && (
                  <div className="absolute -top-2.5 left-4">
                    <Badge className="bg-sky-500 text-white text-xs">Best Price</Badge>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Left: name + country */}
                  <div className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{mfg.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {mfg.tier}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{mfg.country}</div>
                  </div>

                  {/* Center: price */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${i === 0 ? "text-green-400" : ""}`}>
                      ${mfg.totalPriceUSD.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${mfg.unitPriceUSD.toFixed(4)}/unit
                    </div>
                  </div>

                  {/* Lead time */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {mfg.leadTime.min}–{mfg.leadTime.max} days
                    </div>
                    <div className="text-xs text-muted-foreground">lead time</div>
                  </div>

                  {/* Strengths */}
                  <div className="hidden md:flex flex-col gap-1 max-w-[220px]">
                    {mfg.strengths.slice(0, 2).map((s, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>

                  {/* Order button */}
                  <a
                    href={mfg.orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant={mfg.recommended ? "gradient" : "outline"}
                      size="sm"
                      className="gap-1.5 whitespace-nowrap"
                    >
                      Order Now
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>

                {mfg.priceNote && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" /> {mfg.priceNote}
                  </p>
                )}
              </div>
            ))}

            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              * Prices are estimates based on manufacturers&apos; published rate cards, adjusted by live copper market prices.
              Actual quotes may vary. Always verify on manufacturer websites before ordering.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-sky-500/20">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Manufacturer comparison not available for this quote.</p>
            <p className="text-xs mt-1">Create a new quote to see live manufacturer prices.</p>
          </CardContent>
        </Card>
      )}

      {/* ── AI Analysis (if available) ────────────────────────────────────── */}
      {aiAnalysis?.marketAnalysis && (
        <Card className="glass border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-400 text-base">
              <Cpu className="h-4 w-4" />
              AI Market Insights
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs font-normal">
                Claude AI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.marketAnalysis}</p>

            <div className="grid md:grid-cols-2 gap-4">
              {aiAnalysis.costDrivers && aiAnalysis.costDrivers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wider">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" /> Key Cost Drivers
                  </p>
                  <div className="space-y-1.5">
                    {aiAnalysis.costDrivers.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {aiAnalysis.savingsTips && aiAnalysis.savingsTips.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wider">
                    <Lightbulb className="h-3.5 w-3.5 text-green-400" /> Savings Tips
                  </p>
                  <div className="space-y-1.5">
                    {aiAnalysis.savingsTips.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DFM + Complexity ──────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" /> DFM Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <span className={`text-4xl font-bold ${(quote.dfmScore ?? 0) >= 80 ? "text-green-400" : (quote.dfmScore ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                {quote.dfmScore ?? 0}
              </span>
              <span className="text-muted-foreground text-sm mb-1">/100</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${(quote.dfmScore ?? 0) >= 80 ? "bg-green-500" : (quote.dfmScore ?? 0) >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${quote.dfmScore ?? 0}%` }}
              />
            </div>
            {dfmWarnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {dfmWarnings.slice(0, 4).map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" /> Complexity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold">{quote.complexityScore ?? 0}</span>
              <span className="text-muted-foreground text-sm mb-1">/100</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${quote.complexityScore ?? 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {(quote.complexityScore ?? 0) > 80 ? "High complexity — specialized manufacturing required" :
               (quote.complexityScore ?? 0) > 60 ? "Medium-high complexity — advanced capabilities needed" :
               (quote.complexityScore ?? 0) > 40 ? "Standard complexity — widely manufacturable" :
               "Low complexity — simple design, available everywhere"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── PCB Specifications ────────────────────────────────────────────── */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> PCB Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Dimensions",      `${quote.width}×${quote.height}mm`],
              ["Layers",          `${quote.layers} layers`],
              ["Thickness",       `${quote.thickness}mm`],
              ["Copper Weight",   `${quote.copperWeight}oz`],
              ["Surface Finish",  quote.surfaceFinish.replace(/_/g, " ")],
              ["Solder Mask",     quote.solderMaskColor.replace(/_/g, " ")],
              ["Silkscreen",      quote.silkscreenColor],
              ["Via Count",       quote.viaCount.toLocaleString()],
              ["Drill Count",     quote.drillCount.toLocaleString()],
              ["Min Trace Width", `${quote.minTraceWidth}mm`],
              ["Min Spacing",     `${quote.minSpacing}mm`],
              ["Quantity",        quote.quantity.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Cost Breakdown ────────────────────────────────────────────────── */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Material Cost",         value: quote.materialCost,      color: "bg-blue-500" },
              { label: "Manufacturing Cost",     value: quote.manufacturingCost, color: "bg-purple-500" },
              { label: "Assembly Cost",          value: quote.assemblyCost,      color: "bg-orange-500" },
              { label: "Testing & Inspection",   value: quote.testingCost,       color: "bg-yellow-500" },
              { label: "Packaging",              value: quote.packagingCost,     color: "bg-pink-500" },
              { label: "Shipping",               value: quote.shippingCost,      color: "bg-indigo-500" },
            ].filter(item => (item.value ?? 0) > 0).map((item) => {
              const pct = ((item.value ?? 0) / (quote.totalCost ?? 1)) * 100;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{formatCurrency(item.value ?? 0, quote.currency)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(quote.totalCost ?? 0, quote.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Risk Analysis ─────────────────────────────────────────────────── */}
      {riskAnalysis && riskAnalysis.risks.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" /> Risk Analysis
              <Badge variant={riskColor(riskAnalysis.overallRisk) as "success" | "warning" | "destructive"}>
                {riskAnalysis.overallRisk} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskAnalysis.risks.map((risk, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={riskColor(risk.level) as "success" | "warning" | "destructive"} className="text-xs">
                    {risk.level}
                  </Badge>
                  <span className="text-sm font-medium">{risk.category}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{risk.description}</p>
                <p className="text-xs text-primary flex items-start gap-1">
                  <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  {risk.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Optimization Suggestions ──────────────────────────────────────── */}
      {optimizationSuggestions.length > 0 && (
        <Card className="glass border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <TrendingUp className="h-5 w-5" /> Cost Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimizationSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
