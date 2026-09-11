import type { CustomerMember, StudioAnalysis } from "./analysisTypes";
import type { SegmentGuildRecord } from "../data/segmentGuildData";

export const EXPORT_HEADERS = [
  "customer_uid", "segment", "last_purchase_date", "days_since_purchase", "order_count",
  "historical_spend", "currency", "analysis_as_of", "recency_band", "purchase_strength_band", "reason",
  "objective", "suggested_action", "review_window", "guidance_source",
] as const;
/** Escape cells and neutralize spreadsheet formulas in textual fields, including whitespace prefixes. */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/u.test(text)) text = "'" + text;
  if (typeof value === "string" && /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function buildActionCsv(analysis: StudioAnalysis, members: CustomerMember[], segments: SegmentGuildRecord[]): string {
  const allowed = new Map(analysis.customers.map(c => [c.customerUid, c]));
  const exported = new Set<string>();
  const segmentMap = new Map(segments.map(s => [s.key, s]));
  const lines = [EXPORT_HEADERS.map(csvCell).join(",")];
  for (const requested of members) {
    const member = allowed.get(requested.customerUid);
    if (!member) throw new Error("The export includes a customer outside this analysis.");
    if (exported.has(member.customerUid)) throw new Error("The export includes a duplicate customer.");
    exported.add(member.customerUid);
    const s = segmentMap.get(member.segmentKey);
    if (!s) throw new Error("A segment is missing from the export.");
    const aiFields = new Set(analysis.guidance.aiFieldsBySegment?.[member.segment] ?? []);
    const source = analysis.guidance.source === "ai"
      ? `suggested_action: ${aiFields.has("actionPreview") ? "AI" : "reviewed prompt"}; objective: ${aiFields.has("objective") ? "AI" : "reviewed prompt"}; review_window: ${aiFields.has("timeHorizon") ? "AI" : "reviewed prompt"}`
      : analysis.guidance.source === "fallback" ? "reviewed prompt (AI unavailable)" : "reviewed prompt";
    const row = [member.customerUid, member.segment, member.lastPurchaseDate, member.recencyDays, member.orderCount,
      member.historicalSpend, analysis.currency, analysis.asOfDate, member.recencyBand, member.purchaseStrengthBand, member.reason,
      s.objective, s.actionPreview, s.timeHorizon, source];
    lines.push(row.map(csvCell).join(","));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
export function downloadCsv(csv: string, name: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = name.replace(/[^a-zA-Z0-9_.-]/g, "-");
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
