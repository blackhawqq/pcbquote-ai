// Helpers to serialize/deserialize JSON strings stored in SQLite

export function serializeArrays(obj: Record<string, unknown>) {
  const result = { ...obj };
  for (const [k, v] of Object.entries(result)) {
    if (Array.isArray(v)) {
      (result as Record<string, unknown>)[k] = JSON.stringify(v);
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      (result as Record<string, unknown>)[k] = JSON.stringify(v);
    }
  }
  return result;
}

export function parseQuote(quote: Record<string, unknown>) {
  return {
    ...quote,
    dfmWarnings: parseJsonField(quote.dfmWarnings, []),
    manufacturingNotes: parseJsonField(quote.manufacturingNotes, []),
    optimizationSuggestions: parseJsonField(quote.optimizationSuggestions, []),
    riskAnalysis: parseJsonField(quote.riskAnalysis, {}),
  };
}

function parseJsonField(val: unknown, fallback: unknown) {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val ?? fallback;
}
