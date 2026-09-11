import type { SegmentBusinessUpdate, SegmentKey } from "../data/segmentGuildData";

export const LIMITS = Object.freeze({
  fileBytes: 2 * 1024 * 1024,
  requestBytes: 3 * 1024 * 1024,
  responseBytes: 3500 * 1024,
  rows: 50_000,
  customers: 10_000,
  columns: 120,
  cellCharacters: 4096,
  expandedWorkbookBytes: 24 * 1024 * 1024,
});
export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "HKD", "SGD"] as const;
export type Currency = typeof CURRENCIES[number];
export type DateFormat = "iso" | "mdy" | "dmy";
export type InputField = "customer" | "date" | "amount";
export type ColumnMapping = Record<InputField, number>;
export type SuggestedMapping = Record<InputField, number | null>;
export type RowIssueReason = "missingCustomerId" | "invalidCustomerId" | "invalidDate" | "invalidAmount" | "formulaCell";
export interface RowIssue { record: number; reasons: RowIssueReason[] }
export interface DataQuality {
  inputRows: number;
  validRows: number;
  rejectedRows: number;
  blankRowsSkipped: number;
  reasonCounts: Record<RowIssueReason, number>;
  examples: RowIssue[];
  examplesTruncated: boolean;
  negativeAmountRows: number;
  zeroAmountRows: number;
  messages: string[];
}
export interface ImportInspection {
  columns: { index: number; header: string; preview: string[] }[];
  suggestedMapping: SuggestedMapping;
  candidates: Record<InputField, number[]>;
  inputRows: number;
  blankRowsSkipped: number;
  sheetName: string | null;
  sheetCount: number;
  messages: string[];
}
export interface CustomerMember {
  customerUid: string;
  segmentKey: SegmentKey;
  segment: string;
  lastPurchaseDate: string;
  recencyDays: number;
  orderCount: number;
  historicalSpend: number;
  recencyScore: 1 | 2 | 3;
  frequencyScore: 1 | 2 | 3;
  monetaryScore: 1 | 2 | 3;
  recencyBand: "Recent" | "Not Recent" | "Dormant";
  purchaseStrengthBand: "High" | "Medium" | "Low";
  reason: string;
}
export interface ScoreThresholds {
  min: number; max: number; lower: number; upper: number; tied: boolean;
}
export interface AnalysisBasis {
  method: "Relative RFM · V2-compatible";
  asOfPolicy: "latest_valid_transaction";
  recency: ScoreThresholds;
  frequency: ScoreThresholds;
  monetary: ScoreThresholds;
  purchaseStrength: string;
  rowPolicy: string;
}
export interface GuidanceStatus {
  source: "template" | "ai" | "fallback";
  requested: boolean;
  message: string;
  model?: string;
  aiFieldsBySegment?: Record<string, string[]>;
}
export interface StudioAnalysis {
  sourceLabel: string;
  sourceKind: "sample" | "upload";
  currency: Currency;
  totalRevenue: number;
  totalCustomers: number;
  transactionCount: number;
  asOfDate: string;
  segments: SegmentBusinessUpdate[];
  customers: CustomerMember[];
  basis: AnalysisBasis;
  quality: DataQuality;
  guidance: GuidanceStatus;
}
export class InputError extends Error {
  constructor(message: string, public readonly status = 400, public readonly code = "INVALID_INPUT") {
    super(message); this.name = "InputError";
  }
}
