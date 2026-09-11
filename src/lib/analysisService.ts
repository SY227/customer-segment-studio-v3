import { analyzeOrdersDeterministically } from "./deterministicSegmentAnalysis";
import { normalizeTable, validateMapping, tableFromCsv, type ParsedTable } from "./orderImport";
import { SAMPLE_ORDERS_CSV } from "../data/sampleOrders";
import { InputError, type Currency, type DateFormat, type StudioAnalysis } from "./analysisTypes";

export function analyzeTable(table: ParsedTable, options: { mapping?: unknown; dateFormat?: DateFormat; sourceLabel: string; sourceKind: "sample" | "upload"; currency?: Currency }): StudioAnalysis {
  const mapping = validateMapping(options.mapping, table);
  const { rows, quality } = normalizeTable(table, mapping, options.dateFormat ?? "iso");
  if (!rows.length) throw new InputError(`No valid transactions remained (${quality.rejectedRows} rejected record${quality.rejectedRows === 1 ? "" : "s"}). Check the field mapping, dates and amounts.`, 422, "NO_VALID_ROWS");
  const deterministic = analyzeOrdersDeterministically(rows);
  if (deterministic.totalRevenue <= 0) quality.messages.push("The total is zero or negative. Revenue shares are set to zero; they are not meaningful proportions for this dataset.");
  return {
    ...deterministic, sourceLabel: options.sourceLabel, sourceKind: options.sourceKind,
    currency: options.currency ?? "USD", quality,
    guidance: { source: "template", requested: false, message: "Reviewed strategy prompts. No AI call was made; prompts are suggestions, not observed customer intent." },
  };
}
export function createSampleAnalysis(): StudioAnalysis {
  return analyzeTable(tableFromCsv(SAMPLE_ORDERS_CSV), { sourceLabel: "Sample dataset", sourceKind: "sample", currency: "USD" });
}
