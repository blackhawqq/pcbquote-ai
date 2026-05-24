// Agent 2: PDF Quote Generator using pdf-lib

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QuoteForPdf {
  referenceNo: string;
  createdAt: Date;
  width: number;
  height: number;
  layers: number;
  quantity: number;
  surfaceFinish: string;
  solderMaskColor: string;
  thickness: number;
  copperWeight: number;
  currency: string;
  totalCost: number | null;
  materialCost: number | null;
  manufacturingCost: number | null;
  assemblyCost: number | null;
  testingCost: number | null;
  shippingCost: number | null;
  suggestedPrice: number | null;
  profitMargin: number | null;
  leadTimeDays: number | null;
  complexityScore: number | null;
  dfmScore: number | null;
  dfmWarnings: string[];
  optimizationSuggestions: string[];
  customerNotes: string | null;
  user: { name: string | null; email: string; companyName: string | null };
}

const BRAND_BLUE = rgb(0.055, 0.647, 0.914);
const BRAND_GREEN = rgb(0, 0.784, 0.325);
const DARK = rgb(0.05, 0.05, 0.15);
const GRAY = rgb(0.5, 0.5, 0.5);
const LIGHT_GRAY = rgb(0.95, 0.95, 0.97);
const WHITE = rgb(1, 1, 1);
const RED = rgb(0.9, 0.2, 0.2);

export async function generateQuotePdf(quote: QuoteForPdf, watermark = false): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // ── Header Bar ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: DARK });

  page.drawText("PCBQuote AI", {
    x: 30, y: height - 48,
    size: 22, font: boldFont, color: WHITE,
  });

  page.drawText("Intelligent PCB Manufacturing Quote", {
    x: 30, y: height - 66,
    size: 10, font: regularFont, color: rgb(0.7, 0.85, 1),
  });

  page.drawText(`REF: #${quote.referenceNo}`, {
    x: width - 200, y: height - 45,
    size: 11, font: boldFont, color: BRAND_BLUE,
  });

  page.drawText(formatDate(quote.createdAt), {
    x: width - 200, y: height - 63,
    size: 9, font: regularFont, color: rgb(0.7, 0.7, 0.8),
  });

  // ── Company Info ──────────────────────────────────────────────────────────
  let y = height - 100;
  page.drawText("Prepared For:", { x: 30, y, size: 9, font: boldFont, color: GRAY });
  page.drawText(quote.user.companyName ?? quote.user.name ?? "Customer", {
    x: 30, y: y - 14, size: 12, font: boldFont, color: DARK,
  });
  page.drawText(quote.user.email, { x: 30, y: y - 28, size: 9, font: regularFont, color: GRAY });

  // ── Total Cost Box ─────────────────────────────────────────────────────────
  y = height - 160;
  page.drawRectangle({ x: 350, y: y - 5, width: 215, height: 75, color: BRAND_BLUE });
  page.drawText("TOTAL ESTIMATED COST", {
    x: 360, y: y + 50, size: 8, font: boldFont, color: WHITE,
  });
  page.drawText(formatCurrency(quote.totalCost ?? 0, quote.currency), {
    x: 360, y: y + 22, size: 22, font: boldFont, color: WHITE,
  });
  page.drawText(`Qty: ${quote.quantity} | Lead Time: ${quote.leadTimeDays ?? "—"} days`, {
    x: 360, y: y + 6, size: 8, font: regularFont, color: rgb(0.85, 0.95, 1),
  });

  // ── PCB Specifications Table ───────────────────────────────────────────────
  y = height - 200;
  drawSectionHeader(page, boldFont, "PCB SPECIFICATIONS", 30, y);
  y -= 20;

  const specs = [
    ["Board Dimensions", `${quote.width} × ${quote.height} mm`],
    ["Layer Count", `${quote.layers} layers`],
    ["Board Thickness", `${quote.thickness} mm`],
    ["Copper Weight", `${quote.copperWeight} oz`],
    ["Surface Finish", quote.surfaceFinish.replace(/_/g, " ")],
    ["Solder Mask Color", quote.solderMaskColor],
    ["Quantity", `${quote.quantity} pcs`],
  ];

  specs.forEach(([label, value], i) => {
    const rowY = y - i * 18;
    if (i % 2 === 0) {
      page.drawRectangle({ x: 30, y: rowY - 4, width: 535, height: 18, color: LIGHT_GRAY });
    }
    page.drawText(label, { x: 35, y: rowY, size: 9, font: regularFont, color: GRAY });
    page.drawText(value, { x: 220, y: rowY, size: 9, font: boldFont, color: DARK });
  });

  // ── Cost Breakdown ─────────────────────────────────────────────────────────
  y -= specs.length * 18 + 25;
  drawSectionHeader(page, boldFont, "COST BREAKDOWN", 30, y);
  y -= 20;

  const costs = [
    ["Material Cost", quote.materialCost],
    ["Manufacturing Cost", quote.manufacturingCost],
    ["Assembly Cost", quote.assemblyCost],
    ["Testing & Inspection", quote.testingCost],
    ["Shipping Estimate", quote.shippingCost],
  ];

  costs.forEach(([label, value], i) => {
    if (value === null || value === 0) return;
    const rowY = y - i * 18;
    page.drawText(label as string, { x: 35, y: rowY, size: 9, font: regularFont, color: GRAY });
    page.drawText(formatCurrency(value as number, quote.currency), {
      x: 420, y: rowY, size: 9, font: boldFont, color: DARK,
    });
  });

  // Subtotal line
  y -= costs.length * 18 + 5;
  page.drawLine({ start: { x: 30, y }, end: { x: 565, y }, thickness: 1, color: BRAND_BLUE });
  y -= 14;
  page.drawText("TOTAL", { x: 35, y, size: 10, font: boldFont, color: DARK });
  page.drawText(formatCurrency(quote.totalCost ?? 0, quote.currency), {
    x: 420, y, size: 11, font: boldFont, color: BRAND_BLUE,
  });

  if (quote.suggestedPrice && quote.profitMargin) {
    y -= 14;
    page.drawText(`Suggested Selling Price: ${formatCurrency(quote.suggestedPrice, quote.currency)} (${quote.profitMargin.toFixed(1)}% margin)`, {
      x: 35, y, size: 8, font: oblique, color: BRAND_GREEN,
    });
  }

  // ── DFM Score ─────────────────────────────────────────────────────────────
  if (quote.dfmScore !== null) {
    y -= 30;
    drawSectionHeader(page, boldFont, "DFM ANALYSIS", 30, y);
    y -= 18;

    const scoreColor = quote.dfmScore >= 80 ? BRAND_GREEN : quote.dfmScore >= 60 ? rgb(1, 0.7, 0) : RED;
    page.drawText(`DFM Score: ${quote.dfmScore}/100`, {
      x: 35, y, size: 11, font: boldFont, color: scoreColor,
    });
    page.drawText(`Complexity Score: ${quote.complexityScore}/100`, {
      x: 200, y, size: 11, font: boldFont, color: DARK,
    });

    if (quote.dfmWarnings.length > 0) {
      y -= 18;
      page.drawText("Warnings:", { x: 35, y, size: 9, font: boldFont, color: RED });
      quote.dfmWarnings.slice(0, 5).forEach((w, i) => {
        y -= 14;
        page.drawText(`• ${w.slice(0, 90)}`, { x: 42, y, size: 8, font: regularFont, color: DARK });
      });
    }
  }

  // ── Optimization Suggestions ───────────────────────────────────────────────
  if (quote.optimizationSuggestions.length > 0) {
    y -= 25;
    drawSectionHeader(page, boldFont, "OPTIMIZATION SUGGESTIONS", 30, y);
    y -= 16;
    quote.optimizationSuggestions.slice(0, 4).forEach((s) => {
      page.drawText(`• ${s.slice(0, 90)}`, { x: 42, y, size: 8, font: regularFont, color: DARK });
      y -= 13;
    });
  }

  // ── Watermark ─────────────────────────────────────────────────────────────
  if (watermark) {
    page.drawText("FREE PLAN — UPGRADE FOR UNWATERMARKED QUOTES", {
      x: 60, y: height / 2,
      size: 28, font: boldFont,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.3,
      rotate: { angle: 45, type: "degrees" as never },
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 30, y: 40 }, end: { x: 565, y: 40 }, thickness: 0.5, color: LIGHT_GRAY });
  page.drawText("Generated by PCBQuote AI — pcbquote.ai", {
    x: 30, y: 25, size: 8, font: regularFont, color: GRAY,
  });
  page.drawText("This quote is valid for 30 days from generation date.", {
    x: 300, y: 25, size: 8, font: regularFont, color: GRAY,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function drawSectionHeader(page: PDFPage, font: PDFFont, text: string, x: number, y: number) {
  page.drawRectangle({ x, y: y - 4, width: 535, height: 18, color: rgb(0.05, 0.05, 0.15) });
  page.drawText(text, { x: x + 8, y, size: 9, font, color: rgb(0.6, 0.85, 1) });
}
