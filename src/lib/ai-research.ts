import Anthropic from "@anthropic-ai/sdk";
import type { PCBSpecs, PCBEstimation } from "@/types/pcb";

export interface MarketData {
  copperPriceUsdPerKg: number | null;
  exchangeRates: Record<string, number>;
  source: string;
  fetchedAt: string;
}

export interface AIResearchResult {
  marketAnalysis: string;
  priceRange: { low: number; high: number; currency: string } | null;
  manufacturerComparison: string[];
  costDrivers: string[];
  savingsTips: string[];
  marketData: MarketData | null;
  aiUsed: boolean;
}

// Fetch free exchange rates — no API key required
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // cache 1 hour
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.rates ?? {};
  } catch {
    return {};
  }
}

// Fetch copper spot price from a free public source
async function fetchCopperPrice(): Promise<number | null> {
  try {
    // metals.live free endpoint (no key needed, open data)
    const res = await fetch("https://metals.live/api/spot/price/copper/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Response is price per troy oz — convert to USD/kg (1 troy oz = 0.0311035 kg)
    const pricePerOz = data?.price ?? data?.value ?? null;
    return pricePerOz ? Math.round((pricePerOz / 0.0311035) * 100) / 100 : null;
  } catch {
    return null;
  }
}

// Main AI research function
export async function runMarketResearch(
  specs: PCBSpecs,
  estimation: PCBEstimation,
  currency: string
): Promise<AIResearchResult> {
  // Always fetch free market data in parallel
  const [exchangeRates, copperPrice] = await Promise.all([
    fetchExchangeRates(),
    fetchCopperPrice(),
  ]);

  const marketData: MarketData = {
    copperPriceUsdPerKg: copperPrice,
    exchangeRates,
    source: "open.er-api.com + metals.live",
    fetchedAt: new Date().toISOString(),
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No AI key — return rule-based market data
    return buildRuleBasedResult(specs, estimation, currency, marketData);
  }

  try {
    const client = new Anthropic({ apiKey });

    const copperNote = copperPrice
      ? `Current copper spot price: $${copperPrice}/kg (live market data).`
      : "Copper price data unavailable.";

    const exchangeNote = exchangeRates[currency]
      ? `1 USD = ${exchangeRates[currency]} ${currency} (live exchange rate).`
      : "";

    const prompt = `You are a senior PCB manufacturing cost expert with knowledge of global PCB manufacturers (JLCPCB, PCBWay, Seeed Fusion, Advanced Circuits, Eurocircuits).

A customer wants a quote for the following PCB:
- Dimensions: ${specs.width}mm × ${specs.height}mm
- Layers: ${specs.layers}
- Thickness: ${specs.thickness}mm
- Copper weight: ${specs.copperWeight}oz
- Surface finish: ${specs.surfaceFinish}
- Via count: ${specs.viaCount}, Drill count: ${specs.drillCount}
- Min trace/space: ${specs.minTraceWidth}mm / ${specs.minSpacing}mm
- Quantity: ${specs.quantity} pcs
- SMT assembly: ${specs.smtAssembly ? `Yes (${specs.smtComponentCount} components)` : "No"}
- Through-hole assembly: ${specs.throughHoleAssembly ? `Yes (${specs.thComponentCount} components)` : "No"}
- Electrical test: ${specs.electricalTest ? "Yes" : "No"}
- Currency: ${currency}

Our internal cost estimate: $${estimation.totalCost.toFixed(2)} USD (${specs.quantity} pcs)
Unit cost: $${(estimation.totalCost / specs.quantity).toFixed(4)} USD each

Live market context:
${copperNote}
${exchangeNote}

Respond in JSON with this exact structure (no markdown, just JSON):
{
  "marketAnalysis": "2-3 sentence summary of market positioning and competitiveness",
  "priceRangeLow": <number, USD total for this order at cheapest Asian manufacturer>,
  "priceRangeHigh": <number, USD total for this order at premium Western manufacturer>,
  "manufacturerComparison": [
    "JLCPCB: ~$X.XX/unit for Qty ${specs.quantity}",
    "PCBWay: ~$X.XX/unit",
    "Eurocircuits: ~$X.XX/unit (EU)"
  ],
  "costDrivers": ["top 3 cost drivers as short phrases"],
  "savingsTips": ["3 actionable cost reduction tips specific to this board"]
}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    // Strip potential markdown code fences
    const jsonText = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
    const aiData = JSON.parse(jsonText);

    return {
      marketAnalysis: aiData.marketAnalysis ?? "",
      priceRange: {
        low: aiData.priceRangeLow ?? estimation.totalCost * 0.7,
        high: aiData.priceRangeHigh ?? estimation.totalCost * 1.4,
        currency: "USD",
      },
      manufacturerComparison: aiData.manufacturerComparison ?? [],
      costDrivers: aiData.costDrivers ?? [],
      savingsTips: aiData.savingsTips ?? [],
      marketData,
      aiUsed: true,
    };
  } catch (err) {
    console.error("[AI Research] Failed:", err);
    return buildRuleBasedResult(specs, estimation, currency, marketData);
  }
}

function buildRuleBasedResult(
  specs: PCBSpecs,
  estimation: PCBEstimation,
  _currency: string,
  marketData: MarketData
): AIResearchResult {
  const unitCost = estimation.totalCost / specs.quantity;
  const isMultilayer = specs.layers > 2;
  const isHighDensity = specs.minTraceWidth < 0.1;
  const hasAssembly = specs.smtAssembly || specs.throughHoleAssembly;

  // Rule-based market range estimate
  const asianMfgMultiplier = hasAssembly ? 0.65 : 0.55;
  const westernMfgMultiplier = hasAssembly ? 1.5 : 1.35;

  const drivers: string[] = [];
  if (isMultilayer) drivers.push(`${specs.layers}-layer stack (major cost driver)`);
  if (hasAssembly) drivers.push("Component assembly (SMT/TH placement + soldering)");
  if (specs.surfaceFinish === "ENIG") drivers.push("ENIG surface finish (adds ~15% vs HASL)");
  if (specs.electricalTest) drivers.push("Electrical flying-probe testing");
  if (specs.quantity < 10) drivers.push("Low quantity (setup costs dominate)");
  if (drivers.length === 0) drivers.push("Standard 2-layer fabrication", "Quantity bracket", "Surface finish selection");

  const tips: string[] = [];
  if (specs.quantity < 50) tips.push(`Ordering ${Math.min(specs.quantity * 2, 50)} pcs instead of ${specs.quantity} reduces unit cost by ~30%`);
  if (specs.surfaceFinish === "ENIG") tips.push("Switching from ENIG to Lead-Free HASL saves ~10–15% on finish cost");
  if (specs.electricalTest && specs.layers <= 2) tips.push("Electrical test is optional for 2-layer boards — removing it saves testing fees");
  if (specs.layers === 2 && specs.minTraceWidth >= 0.15) tips.push("Your design is well within standard DRC — no premium manufacturing required");
  if (tips.length < 3) tips.push("Order a panelized array to reduce per-unit setup cost");

  const comparison: string[] = [
    `JLCPCB: ~$${(unitCost * asianMfgMultiplier * 0.9).toFixed(2)}/unit (Qty ${String(specs.quantity)})`,
    `PCBWay: ~$${(unitCost * asianMfgMultiplier).toFixed(2)}/unit`,
    `Eurocircuits: ~$${(unitCost * westernMfgMultiplier * 0.85).toFixed(2)}/unit (EU lead times)`,
    `Advanced Circuits: ~$${(unitCost * westernMfgMultiplier).toFixed(2)}/unit (US)`,
  ];

  const copperNote = marketData.copperPriceUsdPerKg
    ? ` Live copper spot: $${marketData.copperPriceUsdPerKg}/kg.`
    : "";

  return {
    marketAnalysis: `This ${specs.layers}-layer, ${specs.width}×${specs.height}mm board at ${specs.quantity} pcs is priced competitively within standard market ranges.${copperNote} Asian manufacturers offer the lowest unit cost; Western fabs provide faster lead times and stricter quality standards.`,
    priceRange: {
      low: Math.round(estimation.totalCost * asianMfgMultiplier * 100) / 100,
      high: Math.round(estimation.totalCost * westernMfgMultiplier * 100) / 100,
      currency: "USD",
    },
    manufacturerComparison: comparison,
    costDrivers: drivers.slice(0, 3),
    savingsTips: tips.slice(0, 3),
    marketData,
    aiUsed: false,
  };
}
