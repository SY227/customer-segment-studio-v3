import { SEGMENT_GUILD_DATA, mergeSegmentBusinessData, type SegmentGuildRecord } from "../data/segmentGuildData";
import type { StudioAnalysis } from "./analysisTypes";

export function segmentsForAnalysis(analysis: StudioAnalysis): SegmentGuildRecord[] {
  const hardByLabel = new Map(analysis.segments.map(s => [s.label, s]));
  return mergeSegmentBusinessData(SEGMENT_GUILD_DATA, analysis.segments).map(s => ({
    ...s,
    customerCount: hardByLabel.get(s.label)?.customerCount ?? 0,
    // Preserve actual signed proportions: never reinterpret fractions >1 as percentages.
    revenueShare: hardByLabel.get(s.label)?.revenueShare ?? 0,
  }));
}
export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
export const formatNumber = (value: number) => value.toLocaleString("en-US");
export const formatShare = (value: number) => new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);
