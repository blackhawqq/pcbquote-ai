import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { pcbCalculator } from "@/engine/pcb-calculator";
import { runMarketResearch } from "@/lib/ai-research";
import { getManufacturerPrices } from "@/lib/manufacturer-prices";
import { sendQuoteReadyEmail } from "@/lib/email";
import { PLANS } from "@/lib/stripe";

const quoteSchema = z.object({
  width: z.number().min(5).max(500),
  height: z.number().min(5).max(500),
  layers: z.number().int().min(1).max(32),
  thickness: z.number().min(0.4).max(3.2),
  copperWeight: z.number().min(0.5).max(4),
  surfaceFinish: z.string(),
  solderMaskColor: z.string(),
  silkscreenColor: z.string(),
  viaCount: z.number().int().min(0),
  drillCount: z.number().int().min(0),
  minTraceWidth: z.number().min(0.05).max(5),
  minSpacing: z.number().min(0.05).max(5),
  quantity: z.number().int().min(1).max(10000),
  panelization: z.boolean().default(false),
  panelRows: z.number().int().optional(),
  panelCols: z.number().int().optional(),
  smtAssembly: z.boolean().default(false),
  throughHoleAssembly: z.boolean().default(false),
  componentCount: z.number().int().min(0).default(0),
  smtComponentCount: z.number().int().min(0).default(0),
  thComponentCount: z.number().int().min(0).default(0),
  electricalTest: z.boolean().default(false),
  aoiInspection: z.boolean().default(false),
  xrayInspection: z.boolean().default(false),
  currency: z.string().default("USD"),
  customerNotes: z.string().max(1000).optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20"), 100);
  const skip = (page - 1) * pageSize;

  try {
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.quote.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      items: quotes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("[GET /api/quotes]", err);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    const { success: rateLimitOk } = await rateLimit(`quotes:${session.user.id}`, 30, 60000);
    if (!rateLimitOk) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plan = (user.subscription?.plan ?? "FREE") as keyof typeof PLANS;
    const planLimits = PLANS[plan];
    const now = new Date();

    if (user.quotesResetAt < new Date(now.getFullYear(), now.getMonth(), 1)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { quotesThisMonth: 0, quotesResetAt: now },
      });
      user.quotesThisMonth = 0;
    }

    if (planLimits.quotesPerMonth !== -1 && user.quotesThisMonth >= planLimits.quotesPerMonth) {
      return NextResponse.json(
        { error: "Monthly quote limit reached. Please upgrade your plan.", code: "LIMIT_REACHED" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // ── Local cost calculation ──────────────────────────────────────────────
    const estimation = pcbCalculator.calculate(
      parsed.data as Parameters<typeof pcbCalculator.calculate>[0]
    );

    // Destructure breakdown — it is NOT a DB column, keep the rest
    const { breakdown, ...estimationForDb } = estimation;
    void breakdown; // intentionally not stored; individual costs are in breakdown but totals are in estimationForDb

    // ── Market research: AI analysis + manufacturer prices (parallel) ──────
    const specsForResearch = parsed.data as Parameters<typeof pcbCalculator.calculate>[0];

    const [aiResearchPromise, mfgPricesPromise] = [
      runMarketResearch(specsForResearch, estimation, parsed.data.currency).catch((err) => {
        console.error("[AI Research] non-fatal:", err);
        return null;
      }),
      getManufacturerPrices(specsForResearch).catch((err) => {
        console.error("[Manufacturer Prices] non-fatal:", err);
        return null;
      }),
    ];

    // ── Save quote to database ──────────────────────────────────────────────
    const quote = await prisma.quote.create({
      data: {
        userId: session.user.id,
        status: "COMPLETED",
        // PCB specs
        width: parsed.data.width,
        height: parsed.data.height,
        layers: parsed.data.layers,
        thickness: parsed.data.thickness,
        copperWeight: parsed.data.copperWeight,
        surfaceFinish: parsed.data.surfaceFinish,
        solderMaskColor: parsed.data.solderMaskColor,
        silkscreenColor: parsed.data.silkscreenColor,
        viaCount: parsed.data.viaCount,
        drillCount: parsed.data.drillCount,
        minTraceWidth: parsed.data.minTraceWidth,
        minSpacing: parsed.data.minSpacing,
        quantity: parsed.data.quantity,
        panelization: parsed.data.panelization,
        panelRows: parsed.data.panelRows,
        panelCols: parsed.data.panelCols,
        smtAssembly: parsed.data.smtAssembly,
        throughHoleAssembly: parsed.data.throughHoleAssembly,
        componentCount: parsed.data.componentCount,
        smtComponentCount: parsed.data.smtComponentCount,
        thComponentCount: parsed.data.thComponentCount,
        electricalTest: parsed.data.electricalTest,
        aoiInspection: parsed.data.aoiInspection,
        xrayInspection: parsed.data.xrayInspection,
        currency: parsed.data.currency,
        customerNotes: parsed.data.customerNotes,
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        fileSize: parsed.data.fileSize,
        // Calculated cost fields
        materialCost: estimationForDb.materialCost,
        manufacturingCost: estimationForDb.manufacturingCost,
        assemblyCost: estimationForDb.assemblyCost,
        testingCost: estimationForDb.testingCost,
        packagingCost: estimationForDb.packagingCost,
        shippingCost: estimationForDb.shippingCost,
        totalCost: estimationForDb.totalCost,
        suggestedPrice: estimationForDb.suggestedPrice,
        profitMargin: estimationForDb.profitMargin,
        leadTimeDays: estimationForDb.leadTimeDays,
        yieldEstimate: estimationForDb.yieldEstimate,
        complexityScore: estimationForDb.complexityScore,
        dfmScore: estimationForDb.dfmScore,
        // JSON-serialized fields
        dfmWarnings: JSON.stringify(estimation.dfmWarnings),
        manufacturingNotes: JSON.stringify(estimation.manufacturingNotes),
        optimizationSuggestions: JSON.stringify(estimation.optimizationSuggestions),
        riskAnalysis: JSON.stringify(estimation.riskAnalysis),
        aiAnalysis: JSON.stringify({}), // will be updated after AI research completes
      },
    });

    // ── Wait for market research and update quote ───────────────────────────
    const [aiResult, mfgPrices] = await Promise.all([aiResearchPromise, mfgPricesPromise]);

    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        aiAnalysis: JSON.stringify({ ai: aiResult, manufacturers: mfgPrices }),
      },
    }).catch(() => {});

    // ── Side effects ────────────────────────────────────────────────────────
    await prisma.user.update({
      where: { id: session.user.id },
      data: { quotesThisMonth: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        quoteId: quote.id,
        action: "QUOTE_CREATED",
        ipAddress: ip,
        metadata: JSON.stringify({ referenceNo: quote.referenceNo, totalCost: quote.totalCost }),
      },
    });

    sendQuoteReadyEmail(
      user.email,
      user.name ?? "there",
      quote.referenceNo,
      quote.totalCost ?? 0,
      quote.currency
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        dfmWarnings: estimation.dfmWarnings,
        manufacturingNotes: estimation.manufacturingNotes,
        optimizationSuggestions: estimation.optimizationSuggestions,
        riskAnalysis: estimation.riskAnalysis,
        aiAnalysis: { ai: aiResult, manufacturers: mfgPrices },
        breakdown,
      },
    }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/quotes]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
