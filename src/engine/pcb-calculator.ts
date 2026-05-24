// Agent 2: PCB Engineering Engine
// Production-grade PCB cost estimation with real manufacturing formulas

import type { PCBSpecs, PCBEstimation, CostBreakdown, RiskAnalysis } from "@/types/pcb";
import { dfmAnalyzer } from "./dfm-analyzer";

// ── Material Cost Constants ────────────────────────────────────────────────────
const FR4_COST_PER_CM2 = 0.0045;        // USD per cm²
const LAYER_MULTIPLIER_BASE = 1.8;       // Each 2 layers adds ~80% to material cost
const COPPER_WEIGHT_MULTIPLIER: Record<number, number> = {
  0.5: 0.9, 1: 1.0, 2: 1.35, 3: 1.6, 4: 1.85,
};

// ── Surface Finish Cost Adders (per board in USD) ─────────────────────────────
const SURFACE_FINISH_COST: Record<string, number> = {
  HASL: 0.0,
  LEAD_FREE_HASL: 0.8,
  ENIG: 2.5,
  OSP: 1.2,
  HARD_GOLD: 12.0,
  IMMERSION_SILVER: 1.8,
  IMMERSION_TIN: 1.5,
};

// ── Solder Mask Color Adder ────────────────────────────────────────────────────
const SOLDER_MASK_COST: Record<string, number> = {
  GREEN: 0, RED: 1.5, BLUE: 1.5, BLACK: 2.0, WHITE: 2.5,
  YELLOW: 2.0, PURPLE: 2.5, MATTE_BLACK: 3.5, MATTE_GREEN: 2.0,
};

// ── Quantity Discount Tiers ────────────────────────────────────────────────────
function getQuantityDiscount(qty: number): number {
  if (qty >= 5000) return 0.45;
  if (qty >= 1000) return 0.35;
  if (qty >= 500)  return 0.28;
  if (qty >= 100)  return 0.20;
  if (qty >= 50)   return 0.12;
  if (qty >= 10)   return 0.05;
  return 0;
}

// ── Layer Count Pricing ────────────────────────────────────────────────────────
function getLayerMultiplier(layers: number): number {
  const multipliers: Record<number, number> = {
    1: 0.7, 2: 1.0, 4: 1.9, 6: 2.8, 8: 3.8,
    10: 5.0, 12: 6.5, 16: 9.0, 20: 13.0, 24: 18.0, 32: 25.0,
  };
  // Find closest
  const keys = Object.keys(multipliers).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - layers) < Math.abs(prev - layers) ? curr : prev
  );
  return multipliers[closest] ?? layers * 0.8;
}

// ── Complexity Score ───────────────────────────────────────────────────────────
function calculateComplexityScore(specs: PCBSpecs): number {
  let score = 50; // baseline

  // Layer complexity
  if (specs.layers > 8) score += 25;
  else if (specs.layers > 4) score += 15;
  else if (specs.layers > 2) score += 8;

  // Trace width/spacing (IPC-2221 classes)
  if (specs.minTraceWidth < 0.075) score += 20;
  else if (specs.minTraceWidth < 0.1) score += 12;
  else if (specs.minTraceWidth < 0.15) score += 6;

  if (specs.minSpacing < 0.075) score += 15;
  else if (specs.minSpacing < 0.1) score += 8;

  // Via density
  const area = specs.width * specs.height;
  const viaDensity = specs.viaCount / area;
  if (viaDensity > 2) score += 10;
  else if (viaDensity > 1) score += 5;

  // Assembly
  if (specs.smtAssembly) score += 10;
  if (specs.throughHoleAssembly) score += 8;
  if (specs.smtComponentCount > 500) score += 15;
  else if (specs.smtComponentCount > 200) score += 8;

  // Surface finish complexity
  if (specs.surfaceFinish === "HARD_GOLD") score += 15;
  else if (specs.surfaceFinish === "ENIG") score += 8;

  // Testing
  if (specs.electricalTest) score += 3;
  if (specs.aoiInspection) score += 3;
  if (specs.xrayInspection) score += 5;

  return Math.min(100, Math.round(score));
}

// ── Lead Time Calculation ──────────────────────────────────────────────────────
function calculateLeadTime(specs: PCBSpecs, complexityScore: number): number {
  let days = 3; // standard

  if (complexityScore > 80) days += 7;
  else if (complexityScore > 60) days += 4;
  else if (complexityScore > 40) days += 2;

  if (specs.layers > 8) days += 3;
  if (specs.layers > 16) days += 5;
  if (specs.surfaceFinish === "HARD_GOLD") days += 2;
  if (specs.surfaceFinish === "ENIG") days += 1;

  if (specs.smtAssembly || specs.throughHoleAssembly) {
    const totalComponents = specs.smtComponentCount + specs.thComponentCount;
    if (totalComponents > 500) days += 5;
    else if (totalComponents > 100) days += 3;
    else days += 2;
  }

  if (specs.xrayInspection) days += 2;
  if (specs.aoiInspection) days += 1;
  if (specs.electricalTest) days += 1;

  return days;
}

// ── Yield Estimation ──────────────────────────────────────────────────────────
function calculateYield(specs: PCBSpecs, complexityScore: number): number {
  let baseYield = 0.98;

  if (complexityScore > 80) baseYield -= 0.08;
  else if (complexityScore > 60) baseYield -= 0.04;
  else if (complexityScore > 40) baseYield -= 0.02;

  if (specs.layers > 12) baseYield -= 0.03;
  if (specs.minTraceWidth < 0.075) baseYield -= 0.02;
  if (specs.viaCount > 1000) baseYield -= 0.01;

  return Math.max(0.85, Math.round(baseYield * 1000) / 1000);
}

// ── Main Calculator ────────────────────────────────────────────────────────────
class PCBCalculator {
  calculate(specs: PCBSpecs): PCBEstimation {
    const area = specs.width * specs.height / 100; // cm²
    const complexityScore = calculateComplexityScore(specs);
    const layerMult = getLayerMultiplier(specs.layers);
    const copperMult = COPPER_WEIGHT_MULTIPLIER[specs.copperWeight] ?? 1.0;
    const qtyDiscount = getQuantityDiscount(specs.quantity);
    const yieldEstimate = calculateYield(specs, complexityScore);
    const leadTimeDays = calculateLeadTime(specs, complexityScore);

    // ── Raw Material ────────────────────────────────────────────────────────────
    const rawMaterial = area * FR4_COST_PER_CM2 * layerMult * copperMult * specs.quantity;

    // ── Board Fabrication ───────────────────────────────────────────────────────
    const setupCost = 15 + (specs.layers > 4 ? specs.layers * 3 : 0);
    const boardFabrication = (setupCost + area * 0.08 * layerMult) * (1 - qtyDiscount) * specs.quantity / specs.quantity
      * specs.quantity;

    // ── Drilling ────────────────────────────────────────────────────────────────
    const drillingCostPerHole = specs.minTraceWidth < 0.1 ? 0.003 : 0.002;
    const drilling = specs.drillCount * drillingCostPerHole * specs.quantity * (1 - qtyDiscount * 0.5);

    // ── Surface Finish ──────────────────────────────────────────────────────────
    const surfaceFinishTotal = (SURFACE_FINISH_COST[specs.surfaceFinish] ?? 0) * specs.quantity;

    // ── Solder Mask + Silkscreen ────────────────────────────────────────────────
    const solderMask = (0.5 + (SOLDER_MASK_COST[specs.solderMaskColor] ?? 0)) * specs.quantity * (1 - qtyDiscount * 0.3);
    const silkscreen = 0.3 * specs.quantity;

    // ── Machine Setup ───────────────────────────────────────────────────────────
    const machineSetup = 25 + specs.layers * 2;

    // ── SMT Assembly ────────────────────────────────────────────────────────────
    let smtPlacement = 0;
    let smtSoldering = 0;
    if (specs.smtAssembly && specs.smtComponentCount > 0) {
      const costPerComponent = specs.smtComponentCount > 200 ? 0.015 : 0.02;
      smtPlacement = specs.smtComponentCount * costPerComponent * specs.quantity * (1 - qtyDiscount * 0.4);
      smtSoldering = specs.smtComponentCount * 0.005 * specs.quantity;
    }

    // ── Through-Hole Assembly ───────────────────────────────────────────────────
    let throughHolePlacement = 0;
    let thSoldering = 0;
    if (specs.throughHoleAssembly && specs.thComponentCount > 0) {
      throughHolePlacement = specs.thComponentCount * 0.05 * specs.quantity * (1 - qtyDiscount * 0.3);
      thSoldering = specs.thComponentCount * 0.02 * specs.quantity;
    }

    // ── Testing ────────────────────────────────────────────────────────────────
    const electricalTest = specs.electricalTest ? 0.8 * specs.quantity + 50 : 0;
    const aoiInspection = specs.aoiInspection ? 0.5 * specs.quantity + 30 : 0;
    const xrayInspection = specs.xrayInspection ? 1.2 * specs.quantity + 80 : 0;

    // ── Scrap Allowance ────────────────────────────────────────────────────────
    const subTotal = rawMaterial + boardFabrication + drilling + surfaceFinishTotal + solderMask + silkscreen + machineSetup + smtPlacement + smtSoldering + throughHolePlacement + thSoldering;
    const scrapAllowance = subTotal * (1 - yieldEstimate);

    // ── Packaging ─────────────────────────────────────────────────────────────
    const packaging = 0.15 * specs.quantity + 2;

    // ── Shipping Estimation ───────────────────────────────────────────────────
    const weightKg = area * specs.quantity * specs.thickness * 0.0018; // rough estimate
    const shipping = Math.max(8, weightKg * 3.5);

    // ── Totals ────────────────────────────────────────────────────────────────
    const materialCost = rawMaterial + surfaceFinishTotal + solderMask + silkscreen;
    const manufacturingCost = boardFabrication + drilling + machineSetup + scrapAllowance;
    const assemblyCost = smtPlacement + smtSoldering + throughHolePlacement + thSoldering;
    const testingCost = electricalTest + aoiInspection + xrayInspection;
    const packagingCost = packaging;
    const shippingCost = shipping;

    const totalCost = materialCost + manufacturingCost + assemblyCost + testingCost + packagingCost + shippingCost;

    // ── Suggested Selling Price & Margin ──────────────────────────────────────
    const marginMultiplier = complexityScore > 70 ? 1.45 : complexityScore > 40 ? 1.35 : 1.25;
    const suggestedPrice = totalCost * marginMultiplier;
    const profitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;

    // ── DFM Analysis ──────────────────────────────────────────────────────────
    const dfmResult = dfmAnalyzer.analyze(specs);

    const breakdown: CostBreakdown = {
      rawMaterial: round(rawMaterial),
      boardFabrication: round(boardFabrication),
      drilling: round(drilling),
      surfaceFinish: round(surfaceFinishTotal),
      solderMask: round(solderMask),
      silkscreen: round(silkscreen),
      smtPlacement: round(smtPlacement),
      throughHolePlacement: round(throughHolePlacement),
      soldering: round(smtSoldering + thSoldering),
      electricalTest: round(electricalTest),
      aoiInspection: round(aoiInspection),
      xrayInspection: round(xrayInspection),
      scrapAllowance: round(scrapAllowance),
      packaging: round(packagingCost),
      shipping: round(shippingCost),
      machineSetup: round(machineSetup),
    };

    const riskAnalysis = this.buildRiskAnalysis(specs, complexityScore, dfmResult.score);

    return {
      materialCost: round(materialCost),
      manufacturingCost: round(manufacturingCost),
      assemblyCost: round(assemblyCost),
      testingCost: round(testingCost),
      packagingCost: round(packagingCost),
      shippingCost: round(shippingCost),
      totalCost: round(totalCost),
      suggestedPrice: round(suggestedPrice),
      profitMargin: round(profitMargin),
      leadTimeDays,
      yieldEstimate,
      complexityScore,
      dfmScore: dfmResult.score,
      dfmWarnings: dfmResult.warnings.map((w) => w.message),
      manufacturingNotes: this.buildManufacturingNotes(specs, complexityScore),
      optimizationSuggestions: this.buildOptimizationSuggestions(specs, breakdown),
      riskAnalysis,
      breakdown,
    };
  }

  private buildManufacturingNotes(specs: PCBSpecs, complexity: number): string[] {
    const notes: string[] = [];
    if (specs.layers > 8) notes.push(`${specs.layers}-layer board requires advanced lamination press cycle.`);
    if (specs.surfaceFinish === "ENIG") notes.push("ENIG finish requires electroless nickel immersion gold process.");
    if (specs.surfaceFinish === "HARD_GOLD") notes.push("Hard gold plating requires dedicated electrolytic plating line.");
    if (specs.minTraceWidth < 0.1) notes.push("Sub-100μm traces require Class 3 manufacturing equipment.");
    if (specs.quantity < 10) notes.push("Low quantity — setup costs dominate. Consider ordering 10+ for better per-unit pricing.");
    if (complexity > 80) notes.push("High complexity board — dedicated engineering review recommended before production.");
    if (specs.panelization && specs.panelRows && specs.panelCols) {
      notes.push(`Panelization: ${specs.panelRows}×${specs.panelCols} array. V-score or tab-rout breakout required.`);
    }
    return notes;
  }

  private buildOptimizationSuggestions(specs: PCBSpecs, breakdown: CostBreakdown): string[] {
    const suggestions: string[] = [];
    if (breakdown.shipping > breakdown.rawMaterial * 0.3) {
      suggestions.push("Shipping cost is high relative to material cost. Consider ordering in larger batches.");
    }
    if (specs.quantity < 50 && !specs.panelization) {
      suggestions.push("Enable panelization to reduce per-unit fabrication cost by 15–30%.");
    }
    if (specs.surfaceFinish === "ENIG" && specs.layers <= 2) {
      suggestions.push("ENIG on a simple 2-layer board is over-specified. HASL or OSP would reduce cost significantly.");
    }
    if (specs.smtComponentCount > 100 && specs.quantity < 20) {
      suggestions.push("High component count on low quantities: consider stencil reuse for prototype batches.");
    }
    if (specs.layers > 4 && !specs.electricalTest) {
      suggestions.push("Electrical testing strongly recommended for multilayer boards to avoid late-stage failures.");
    }
    const mfgCost = breakdown.boardFabrication + breakdown.drilling + breakdown.machineSetup + breakdown.scrapAllowance;
    if (breakdown.scrapAllowance > mfgCost * 0.15) {
      suggestions.push("High scrap allowance detected. Relaxing tight tolerances could improve yield.");
    }
    return suggestions;
  }

  private buildRiskAnalysis(specs: PCBSpecs, complexityScore: number, dfmScore: number): RiskAnalysis {
    const risks = [];

    if (specs.minTraceWidth < 0.1) {
      risks.push({
        category: "Manufacturing Capability",
        level: "HIGH" as const,
        description: "Sub-100μm trace width is at the limit of standard manufacturing.",
        recommendation: "Verify manufacturer capability. Request design rule check (DRC) report.",
      });
    }

    if (specs.layers > 12) {
      risks.push({
        category: "Layer Stackup",
        level: "MEDIUM" as const,
        description: `${specs.layers} layers increases risk of delamination and via reliability issues.`,
        recommendation: "Specify impedance control and controlled collapse chip connection (C4) requirements.",
      });
    }

    if (!specs.electricalTest && specs.layers > 4) {
      risks.push({
        category: "Quality Assurance",
        level: "HIGH" as const,
        description: "No electrical testing on a multilayer board risks undetected open/short circuits.",
        recommendation: "Enable flying probe or bed-of-nails electrical testing.",
      });
    }

    if (specs.quantity < 5) {
      risks.push({
        category: "Commercial",
        level: "LOW" as const,
        description: "Very low quantity increases per-unit cost significantly.",
        recommendation: "Consider ordering 10+ units for significantly better economics.",
      });
    }

    if (dfmScore < 60) {
      risks.push({
        category: "Design for Manufacturability",
        level: "HIGH" as const,
        description: "DFM score below 60 indicates multiple manufacturing issues.",
        recommendation: "Review DFM warnings and consult with your PCB manufacturer before production.",
      });
    }

    const overallRisk =
      risks.some((r) => r.level === "HIGH") && complexityScore > 70
        ? "CRITICAL"
        : risks.some((r) => r.level === "HIGH")
        ? "HIGH"
        : risks.some((r) => r.level === "MEDIUM")
        ? "MEDIUM"
        : "LOW";

    return { overallRisk, risks };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const pcbCalculator = new PCBCalculator();
