import { SEGMENT_LABELS, type SegmentBusinessUpdate, type SegmentObjective } from "../data/segmentGuildData";
import type { StudioAnalysis } from "./analysisTypes";

export const SOFT_FIELDS = ["bestChannel", "kpi", "objective", "actionPreview", "messagingAngle", "sampleTactic", "interpretation", "timeHorizon", "offerIntensity", "speechBubble"] as const;
export type SoftGuidance = Pick<SegmentBusinessUpdate, "label"> & Partial<Pick<SegmentBusinessUpdate, typeof SOFT_FIELDS[number]>>;
const objectives = new Set<SegmentObjective>(["defend margin", "upsell", "retain", "reactivate", "deprioritize"]);
const unsupportedClaim = /guarantee|churn probabilit|predict(?:ed|ive)? revenue|will recover|will generate|\bROI\b|\bLTV\b|\bCAC\b|\d+(?:\.\d+)?%|\$\d/i;

export function sanitizeSoftGuidance(payload: unknown): SoftGuidance[] {
  const source = payload && typeof payload === "object" ? (payload as { segments?: unknown }).segments : null;
  if (!Array.isArray(source)) return [];
  const seen = new Set<string>();
  return source.slice(0, 30).flatMap((row: unknown) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (typeof item.label !== "string" || !SEGMENT_LABELS.includes(item.label) || seen.has(item.label)) return [];
    seen.add(item.label);
    const safe: SoftGuidance = { label: item.label };
    for (const key of SOFT_FIELDS) {
      const value = item[key];
      if (typeof value !== "string") continue;
      const text = value.trim();
      if (!text || text.length > 480 || unsupportedClaim.test(text) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) continue;
      if (key === "objective") { if (objectives.has(text as SegmentObjective)) safe.objective = text as SegmentObjective; }
      else safe[key] = text;
    }
    return Object.keys(safe).length > 1 ? [safe] : [];
  });
}

/** This prompt intentionally excludes filenames, identifiers and transaction rows. */
export function buildSoftGuidancePrompt(analysis: StudioAnalysis): string {
  const aggregates = analysis.segments.map(s => ({ label: s.label, customerCount: s.customerCount, revenueShare: s.revenueShare }));
  return `Return JSON only: {"segments":[{"label":"...","actionPreview":"..."}]}.
You write optional hypotheses for a purchase-history RFM review, not customer quotes.
Allowed labels: ${SEGMENT_LABELS.join(", ")}.
Allowed soft fields: ${SOFT_FIELDS.join(", ")}. Each text field must be under 480 characters.
Allowed objectives: defend margin, upsell, retain, reactivate, deprioritize.
Never provide or alter hard metrics, memberships, IDs, scores or labels.
Do not predict churn, recovered revenue, ROI, LTV, CAC, profit, customer intent or causal effects.
Do not invent product categories, marketing consent or available contact channels. Describe suggestions as tests.
Relative recency and combined frequency/value bands are not evidence of trends or first-time buying.
No measured channel performance is provided. Channel suggestions are tentative.
The caller may ignore any field. Do not output percentages, monetary amounts or outcome guarantees.
Historical total (not forecast): ${analysis.totalRevenue}; display currency: ${analysis.currency}; as of: ${analysis.asOfDate}.
Aggregates: ${JSON.stringify(aggregates)}`;
}

export function applySoftGuidance(analysis: StudioAnalysis, payload: unknown, model: string): StudioAnalysis {
  const safeRows = sanitizeSoftGuidance(payload);
  if (!safeRows.length) return { ...analysis, guidance: { source: "fallback", requested: true, message: "AI guidance was unavailable or failed validation. Reviewed strategy prompts remain available." } };
  const byLabel = new Map(safeRows.map(s => [s.label, s]));
  return {
    ...analysis,
    segments: analysis.segments.map(hard => {
      const safe = byLabel.get(hard.label);
      // Enumerate soft fields again at the merge boundary. No spread of provider objects.
      const merged: SegmentBusinessUpdate = { ...hard };
      if (safe) for (const key of SOFT_FIELDS) {
        if (key === "objective") { if (safe.objective) merged.objective = safe.objective; }
        else if (safe[key]) merged[key] = safe[key];
      }
      return merged;
    }),
    guidance: { source: "ai", requested: true, model, aiFieldsBySegment: Object.fromEntries(safeRows.map(row => [row.label, Object.keys(row).filter(key => key !== "label")])), message: "AI suggestions where available; reviewed prompts otherwise. All customer membership, metrics and assignment reasons remain deterministic." },
  };
}

export async function maybeAddGuidance(analysis: StudioAnalysis, requested: boolean): Promise<StudioAnalysis> {
  if (!requested) return analysis;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { ...analysis, guidance: { source: "fallback", requested: true, message: "No Gemini key is configured on this server. Analysis succeeded using reviewed strategy prompts." } };
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
  if (!/^[a-zA-Z0-9_.-]+$/.test(model)) return { ...analysis, guidance: { source: "fallback", requested: true, message: "The optional model setting is invalid. Reviewed strategy prompts are shown." } };
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 5000 },
          contents: [{ role: "user", parts: [{ text: buildSoftGuidancePrompt(analysis) }] }],
        }),
      });
      if (!response.ok) {
        if (response.status < 500 && response.status !== 429) break;
        throw new Error("Provider unavailable");
      }
      const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = result.candidates?.[0]?.content?.parts?.map(p => p.text ?? "").join("\n") ?? "";
      if (text.length > 32_000) break;
      return applySoftGuidance(analysis, JSON.parse(text), model);
    } catch { /* Do not log request bodies, provider payloads or secrets. */ }
    finally { clearTimeout(timeout); }
  }
  return { ...analysis, guidance: { source: "fallback", requested: true, message: "The optional AI service did not return usable guidance within the retry budget. Your deterministic analysis is complete." } };
}
