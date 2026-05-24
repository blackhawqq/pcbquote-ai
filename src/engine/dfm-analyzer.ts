// Agent 2: DFM (Design for Manufacturability) Analyzer
// IPC-2221 + IPC-6012 based rules engine

import type { PCBSpecs, DFMResult, DFMWarning, DFMCheck } from "@/types/pcb";

class DFMAnalyzer {
  analyze(specs: PCBSpecs): DFMResult {
    const warnings: DFMWarning[] = [];
    const passed: DFMCheck[] = [];

    // ── Trace Width Rules (IPC-2221 Class 2) ─────────────────────────────────
    if (specs.minTraceWidth < 0.05) {
      warnings.push({
        code: "DFM-001",
        severity: "CRITICAL",
        field: "minTraceWidth",
        message: `Trace width ${specs.minTraceWidth}mm is below 50μm — exceeds standard manufacturing limits.`,
        recommendation: "Increase minimum trace width to 0.1mm for Class 2, 0.075mm for Class 3.",
      });
    } else if (specs.minTraceWidth < 0.075) {
      warnings.push({
        code: "DFM-002",
        severity: "WARNING",
        field: "minTraceWidth",
        message: `Trace width ${specs.minTraceWidth}mm requires Class 3 (mil-spec) manufacturing.`,
        recommendation: "Confirm your manufacturer supports <75μm traces. Expect 20% cost premium.",
      });
    } else if (specs.minTraceWidth < 0.1) {
      warnings.push({
        code: "DFM-003",
        severity: "INFO",
        field: "minTraceWidth",
        message: `Trace width ${specs.minTraceWidth}mm requires advanced Class 2+ manufacturing.`,
        recommendation: "Verify DRC clearance with your manufacturer.",
      });
    } else {
      passed.push({ code: "DFM-001", message: "Trace width within standard manufacturing limits." });
    }

    // ── Spacing Rules ─────────────────────────────────────────────────────────
    if (specs.minSpacing < 0.05) {
      warnings.push({
        code: "DFM-010",
        severity: "CRITICAL",
        field: "minSpacing",
        message: `Spacing ${specs.minSpacing}mm is below safe manufacturing limits.`,
        recommendation: "Minimum spacing should be ≥0.1mm for standard, ≥0.075mm for advanced.",
      });
    } else if (specs.minSpacing < 0.1) {
      warnings.push({
        code: "DFM-011",
        severity: "WARNING",
        field: "minSpacing",
        message: `Tight spacing ${specs.minSpacing}mm — risk of solder bridging.`,
        recommendation: "Increase spacing or specify fine-pitch solder paste stencil.",
      });
    } else {
      passed.push({ code: "DFM-010", message: "Spacing within standard manufacturing limits." });
    }

    // ── Board Size Rules ──────────────────────────────────────────────────────
    if (specs.width < 5 || specs.height < 5) {
      warnings.push({
        code: "DFM-020",
        severity: "WARNING",
        field: "width",
        message: "Board smaller than 5×5mm — handling issues in pick-and-place.",
        recommendation: "Panelize small boards (min 2×2 array) for automated assembly.",
      });
    } else if (specs.width > 400 || specs.height > 400) {
      warnings.push({
        code: "DFM-021",
        severity: "WARNING",
        field: "width",
        message: "Board exceeds 400mm — requires special handling fixtures.",
        recommendation: "Confirm oversized board capability with manufacturer.",
      });
    } else {
      passed.push({ code: "DFM-020", message: "Board dimensions within standard range." });
    }

    // ── Layer Count vs Thickness ───────────────────────────────────────────────
    const minThicknessForLayers: Record<number, number> = {
      1: 0.4, 2: 0.6, 4: 0.8, 6: 1.0, 8: 1.2, 10: 1.6, 12: 1.6, 16: 2.0,
    };
    const minThickness = Object.entries(minThicknessForLayers)
      .filter(([l]) => parseInt(l) <= specs.layers)
      .reduce((max, [, t]) => Math.max(max, t), 0);

    if (specs.thickness < minThickness) {
      warnings.push({
        code: "DFM-030",
        severity: "ERROR",
        field: "thickness",
        message: `Board thickness ${specs.thickness}mm is too thin for ${specs.layers} layers (min: ${minThickness}mm).`,
        recommendation: `Increase thickness to at least ${minThickness}mm or reduce layer count.`,
      });
    } else {
      passed.push({ code: "DFM-030", message: "Board thickness appropriate for layer count." });
    }

    // ── Via Density ───────────────────────────────────────────────────────────
    const area = specs.width * specs.height;
    const viaDensity = specs.viaCount / area;
    if (viaDensity > 5) {
      warnings.push({
        code: "DFM-040",
        severity: "WARNING",
        field: "viaCount",
        message: `High via density: ${viaDensity.toFixed(2)} vias/mm². Increases drill time and cost.`,
        recommendation: "Consider via-in-pad or blind/buried vias for dense designs.",
      });
    } else {
      passed.push({ code: "DFM-040", message: "Via density within normal range." });
    }

    // ── Assembly Check ────────────────────────────────────────────────────────
    if (specs.smtAssembly && specs.smtComponentCount === 0) {
      warnings.push({
        code: "DFM-050",
        severity: "WARNING",
        field: "smtComponentCount",
        message: "SMT assembly enabled but component count is 0.",
        recommendation: "Enter actual SMT component count for accurate assembly pricing.",
      });
    }

    if (specs.throughHoleAssembly && specs.thComponentCount === 0) {
      warnings.push({
        code: "DFM-051",
        severity: "INFO",
        field: "thComponentCount",
        message: "Through-hole assembly enabled but component count is 0.",
        recommendation: "Enter through-hole component count for accurate pricing.",
      });
    }

    // ── Testing Recommendation ────────────────────────────────────────────────
    if (specs.layers >= 4 && !specs.electricalTest) {
      warnings.push({
        code: "DFM-060",
        severity: "WARNING",
        field: "electricalTest",
        message: "Electrical testing not enabled for multilayer board.",
        recommendation: "Flying probe or bed-of-nails test is strongly recommended for 4+ layers.",
      });
    } else if (specs.electricalTest) {
      passed.push({ code: "DFM-060", message: "Electrical testing enabled." });
    }

    // ── Panelization Check ────────────────────────────────────────────────────
    if (specs.panelization && (!specs.panelRows || !specs.panelCols)) {
      warnings.push({
        code: "DFM-070",
        severity: "INFO",
        field: "panelRows",
        message: "Panelization enabled but panel dimensions not specified.",
        recommendation: "Specify panel rows and columns for accurate panelization cost.",
      });
    }

    // ── Aspect Ratio ──────────────────────────────────────────────────────────
    if (specs.drillCount > 0 && specs.thickness > 0) {
      const minDrillDia = 0.2; // assumed minimum
      const aspectRatio = specs.thickness / minDrillDia;
      if (aspectRatio > 10) {
        warnings.push({
          code: "DFM-080",
          severity: "WARNING",
          message: `Drill aspect ratio >10:1 detected. Via reliability may be compromised.`,
          recommendation: "Increase drill diameter or reduce board thickness.",
        });
      } else {
        passed.push({ code: "DFM-080", message: "Drill aspect ratio within acceptable limits." });
      }
    }

    // ── Calculate DFM Score ────────────────────────────────────────────────────
    const criticalCount = warnings.filter((w) => w.severity === "CRITICAL").length;
    const errorCount = warnings.filter((w) => w.severity === "ERROR").length;
    const warningCount = warnings.filter((w) => w.severity === "WARNING").length;
    const infoCount = warnings.filter((w) => w.severity === "INFO").length;

    const score = Math.max(
      0,
      100 - criticalCount * 25 - errorCount * 15 - warningCount * 7 - infoCount * 2
    );

    const grade =
      score >= 90 ? "A" :
      score >= 75 ? "B" :
      score >= 60 ? "C" :
      score >= 45 ? "D" : "F";

    return { score, grade, warnings, passed };
  }
}

export const dfmAnalyzer = new DFMAnalyzer();
