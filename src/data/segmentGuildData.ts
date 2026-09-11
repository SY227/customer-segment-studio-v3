export type RecencyBand = "Recent" | "Not Recent" | "Dormant";
export type FrequencyBand = "High Frequency" | "Medium Frequency" | "Low Frequency";
export type SegmentObjective = "defend margin" | "upsell" | "retain" | "reactivate" | "deprioritize";

export type SegmentKey = `${RecencyBand}|${FrequencyBand}`;

export interface SegmentGuildRecord {
  key: SegmentKey;
  label: string;
  recency: RecencyBand;
  frequency: FrequencyBand;
  customerCount: number;
  revenueShare: number;
  bestChannel: string;
  kpi: string;
  objective: SegmentObjective;
  actionPreview: string;
  messagingAngle: string;
  sampleTactic: string;
  interpretation: string;
  timeHorizon: string;
  offerIntensity: string;
  fantasyRole: string;
  fantasySummary: string;
  speechBubble: string;
  asset: string;
  textureOverride?: string;
  characterHeight: number;
  priorityRank: number;
  accent: string;
  accentSoft: string;
  roomX: number;
  roomY: number;
  driftX: number;
  driftY: number;
  walkDurationMs: number;
  walkDelayMs: number;
  depth: number;
}

export const TOTAL_REVENUE = 1_240_000;

export const SEGMENT_GUILD_DATA: SegmentGuildRecord[] = [
  {
    key: "Recent|High Frequency",
    label: "Best Customers",
    recency: "Recent",
    frequency: "High Frequency",
    customerCount: 148,
    revenueShare: 0.19,
    bestChannel: "Lifecycle email",
    kpi: "Repeat-purchase response during a defined test",
    objective: "defend margin",
    actionPreview: "Protect margin with loyalty benefits and early access.",
    messagingAngle: "Recognize their value and give them reasons to stay close.",
    sampleTactic: "Offer VIP access, premium support, and early product drops.",
    interpretation: "Recent purchasing with high combined frequency and historical value within this dataset.",
    timeHorizon: "This week",
    offerIntensity: "Low discount, high value",
    fantasyRole: "Recent customers with strong purchase history",
    fantasySummary: "High purchase strength relative to this file. Consider recognition before defaulting to a discount.",
    speechBubble: "Consider recognition and useful benefits before adding a bigger discount.",
    asset: "/assets/models/characters/Knight.glb",
    characterHeight: 1.16,
    priorityRank: 1,
    accent: "#f0c56d",
    accentSoft: "rgba(240, 197, 109, 0.18)",
    roomX: 54,
    roomY: 66,
    driftX: 30,
    driftY: -14,
    walkDurationMs: 9200,
    walkDelayMs: 400,
    depth: 7,
  },
  {
    key: "Recent|Medium Frequency",
    label: "Loyal Buyers",
    recency: "Recent",
    frequency: "Medium Frequency",
    customerCount: 236,
    revenueShare: 0.17,
    bestChannel: "Email",
    kpi: "Average order value during a defined test",
    objective: "upsell",
    actionPreview: "Use cross-sell and loyalty reminders to deepen category adoption.",
    messagingAngle: "You already trust us, here is a useful next step.",
    sampleTactic: "Send a tailored reorder or cross-sell sequence based on the last purchase.",
    interpretation: "Recent purchasing with medium combined frequency and historical value relative to this dataset.",
    timeHorizon: "2-3 weeks",
    offerIntensity: "Moderate",
    fantasyRole: "Recent customers with medium purchase strength",
    fantasySummary: "A relative purchase-history group; confirm business context before choosing a reorder or cross-sell test.",
    speechBubble: "Test a relevant reorder or cross-sell idea against the purchase context.",
    asset: "/assets/models/characters/Ranger.glb",
    characterHeight: 1.12,
    priorityRank: 4,
    accent: "#75d8b4",
    accentSoft: "rgba(117, 216, 180, 0.18)",
    roomX: 30,
    roomY: 63,
    driftX: 28,
    driftY: 18,
    walkDurationMs: 10800,
    walkDelayMs: 1500,
    depth: 6,
  },
  {
    key: "Recent|Low Frequency",
    label: "New Buyers",
    recency: "Recent",
    frequency: "Low Frequency",
    customerCount: 312,
    revenueShare: 0.11,
    bestChannel: "Email",
    kpi: "Next-purchase response during a defined test",
    objective: "retain",
    actionPreview: "Review order counts and test a relevant next-purchase prompt.",
    messagingAngle: "Make the next purchase easy and relevant.",
    sampleTactic: "For confirmed one-order customers, test a useful post-purchase follow-up.",
    interpretation: "Recent purchasing with lower combined frequency and historical value in this file. Not every member is necessarily a first-time buyer.",
    timeHorizon: "7-10 days",
    offerIntensity: "Moderate",
    fantasyRole: "Recent customers with lighter purchase history",
    fantasySummary: "Check member order counts before treating this as a first-purchase cohort.",
    speechBubble: "Check how often these customers have purchased before choosing a follow-up.",
    asset: "/assets/models/characters/Druid.glb",
    characterHeight: 1.08,
    priorityRank: 7,
    accent: "#7bc0ff",
    accentSoft: "rgba(123, 192, 255, 0.18)",
    roomX: 76,
    roomY: 67,
    driftX: 26,
    driftY: 18,
    walkDurationMs: 9900,
    walkDelayMs: 3400,
    depth: 6,
  },
  {
    key: "Not Recent|High Frequency",
    label: "At-Risk VIPs",
    recency: "Not Recent",
    frequency: "High Frequency",
    customerCount: 102,
    revenueShare: 0.16,
    bestChannel: "Email",
    kpi: "Response to a reviewed retention test",
    objective: "retain",
    actionPreview: "Review high-value customers with a longer purchase gap.",
    messagingAngle: "Show them what has changed or improved since their last high-value purchase.",
    sampleTactic: "Run a staged win-back sequence with strong relevance before deeper incentives.",
    interpretation: "Middle recency band with high combined frequency and historical value in this file. The label does not predict churn.",
    timeHorizon: "7-14 days",
    offerIntensity: "High",
    fantasyRole: "Strong purchase history with a longer gap",
    fantasySummary: "Review the supplied purchase gap and business context before selecting a retention test.",
    speechBubble: "Review the purchase gap and test a relevant reason to reconnect.",
    asset: "/assets/models/characters/Barbarian.glb",
    characterHeight: 1.18,
    priorityRank: 2,
    accent: "#ff9a7a",
    accentSoft: "rgba(255, 154, 122, 0.18)",
    roomX: 66,
    roomY: 39,
    driftX: -24,
    driftY: 20,
    walkDurationMs: 10400,
    walkDelayMs: 2600,
    depth: 5,
  },
  {
    key: "Not Recent|Medium Frequency",
    label: "Growing Buyers",
    recency: "Not Recent",
    frequency: "Medium Frequency",
    customerCount: 188,
    revenueShare: 0.1,
    bestChannel: "Email",
    kpi: "30-day repeat rate",
    objective: "retain",
    actionPreview: "Test a relevant next-purchase idea after reviewing the evidence.",
    messagingAngle: "Help them discover the next product that fits what they already like.",
    sampleTactic: "Send a short follow-up series based on recent category interest.",
    interpretation: "Middle recency and medium combined frequency/value scores. The group label does not establish a growth trend.",
    timeHorizon: "2-3 weeks",
    offerIntensity: "Moderate",
    fantasyRole: "Mid-recency customers with medium purchase strength",
    fantasySummary: "Use member evidence to decide whether a relevant next-purchase test is worthwhile.",
    speechBubble: "Inspect the purchase history and choose a relevant next-purchase test.",
    asset: "/assets/models/characters/Engineer.glb",
    characterHeight: 1.08,
    priorityRank: 5,
    accent: "#c7b47c",
    accentSoft: "rgba(199, 180, 124, 0.18)",
    roomX: 41,
    roomY: 38,
    driftX: 24,
    driftY: -18,
    walkDurationMs: 11200,
    walkDelayMs: 5100,
    depth: 5,
  },
  {
    key: "Not Recent|Low Frequency",
    label: "Occasional Buyers",
    recency: "Not Recent",
    frequency: "Low Frequency",
    customerCount: 264,
    revenueShare: 0.07,
    bestChannel: "Email",
    kpi: "Reactivation rate",
    objective: "reactivate",
    actionPreview: "Use low-cost email before offering discounts.",
    messagingAngle: "Reach out when the timing or offer is clearly relevant.",
    sampleTactic: "Test calendar-based or seasonal offers before paid channels.",
    interpretation: "Middle recency band with lower combined frequency/value scores relative to this file.",
    timeHorizon: "3-4 weeks",
    offerIntensity: "Low to moderate",
    fantasyRole: "Mid-recency customers with lighter purchase history",
    fantasySummary: "Reachability and preferred channels are not measured here; confirm contact permissions before testing.",
    speechBubble: "Test timing and relevance before increasing incentives.",
    asset: "/assets/models/characters/Rogue.glb",
    characterHeight: 1.06,
    priorityRank: 8,
    accent: "#c484ff",
    accentSoft: "rgba(196, 132, 255, 0.18)",
    roomX: 22,
    roomY: 76,
    driftX: 30,
    driftY: -14,
    walkDurationMs: 12300,
    walkDelayMs: 1900,
    depth: 8,
  },
  {
    key: "Dormant|High Frequency",
    label: "Dormant VIPs",
    recency: "Dormant",
    frequency: "High Frequency",
    customerCount: 64,
    revenueShare: 0.13,
    bestChannel: "Email",
    kpi: "14-day reactivation response",
    objective: "reactivate",
    actionPreview: "Use a strong comeback reason before spending more to reactivate.",
    messagingAngle: "Remind them what made them valuable and why now is worth a return.",
    sampleTactic: "Test a relevant comeback message over an agreed review window; evaluate incentives separately.",
    interpretation: "Longest relative purchase gaps with high combined frequency and historical value in this dataset.",
    timeHorizon: "14 days",
    offerIntensity: "High",
    fantasyRole: "Strong purchase history with the longest gaps",
    fantasySummary: "Historical contribution is not recoverable revenue. Review business context before a reactivation test.",
    speechBubble: "Review the history and test a credible reason to return.",
    asset: "/assets/models/characters/Barbarian.glb",
    textureOverride: "/assets/models/characters/barbarian_texture_alt_C.png",
    characterHeight: 1.16,
    priorityRank: 3,
    accent: "#ff74c6",
    accentSoft: "rgba(255, 116, 198, 0.18)",
    roomX: 18,
    roomY: 31,
    driftX: 20,
    driftY: 16,
    walkDurationMs: 13800,
    walkDelayMs: 6200,
    depth: 4,
  },
  {
    key: "Dormant|Medium Frequency",
    label: "Light Repeaters",
    recency: "Dormant",
    frequency: "Medium Frequency",
    customerCount: 121,
    revenueShare: 0.05,
    bestChannel: "Email",
    kpi: "Reactivation conversion over 21 days",
    objective: "reactivate",
    actionPreview: "Keep the offer simple and low-cost to test for stronger repeat behavior.",
    messagingAngle: "Make the next purchase easy without giving away too much margin.",
    sampleTactic: "Use short email follow-ups and light reorder prompts.",
    interpretation: "Longest relative purchase gaps with medium combined frequency/value scores in this file.",
    timeHorizon: "2-4 weeks",
    offerIntensity: "Low",
    fantasyRole: "Longer purchase gaps with medium purchase strength",
    fantasySummary: "Order counts and spend are visible in member evidence. The label is not a prediction of response.",
    speechBubble: "Keep a first reactivation test simple and proportionate.",
    asset: "/assets/models/characters/Mage.glb",
    characterHeight: 1.1,
    priorityRank: 6,
    accent: "#87d7ff",
    accentSoft: "rgba(135, 215, 255, 0.18)",
    roomX: 82,
    roomY: 36,
    driftX: -22,
    driftY: -18,
    walkDurationMs: 11700,
    walkDelayMs: 7600,
    depth: 4,
  },
  {
    key: "Dormant|Low Frequency",
    label: "Inactive Customers",
    recency: "Dormant",
    frequency: "Low Frequency",
    customerCount: 410,
    revenueShare: 0.02,
    bestChannel: "Email automation",
    kpi: "Cost per reactivated customer",
    objective: "deprioritize",
    actionPreview: "Do not over-discount low-value inactive customers.",
    messagingAngle: "Test light-touch reminders before allocating more budget.",
    sampleTactic: "Run a low-cost reactivation email and suppress non-responders.",
    interpretation: "Longest relative purchase gaps with lower combined frequency/value scores in this dataset.",
    timeHorizon: "Quarterly check",
    offerIntensity: "Minimal",
    fantasyRole: "Longer gaps with lighter purchase history",
    fantasySummary: "Weak recent purchase signal in this file. Test carefully before allocating more budget.",
    speechBubble: "Start with a small, permissioned test before allocating more effort.",
    asset: "/assets/models/characters/Rogue_Hooded.glb",
    characterHeight: 1.06,
    priorityRank: 9,
    accent: "#94a6c9",
    accentSoft: "rgba(148, 166, 201, 0.18)",
    roomX: 88,
    roomY: 79,
    driftX: -18,
    driftY: 14,
    walkDurationMs: 13100,
    walkDelayMs: 8800,
    depth: 9,
  },
];

export const DEFAULT_SEGMENT_KEY: SegmentKey = "Not Recent|High Frequency";

export const TOTAL_CUSTOMERS = SEGMENT_GUILD_DATA.reduce((sum, segment) => sum + segment.customerCount, 0);

export const REVENUE_SHARE_LEADER = SEGMENT_GUILD_DATA.reduce((best, segment) =>
  segment.revenueShare > best.revenueShare ? segment : best,
);

export const HIGHEST_URGENCY = SEGMENT_GUILD_DATA.find((segment) => segment.key === "Dormant|High Frequency") ?? SEGMENT_GUILD_DATA[0];
export const FASTEST_LIFT = SEGMENT_GUILD_DATA.find((segment) => segment.key === "Recent|Low Frequency") ?? SEGMENT_GUILD_DATA[0];

export const SEGMENT_LABELS = SEGMENT_GUILD_DATA.map((segment) => segment.label);

export interface SegmentBusinessUpdate {
  label: string;
  customerCount?: number;
  revenueShare?: number;
  bestChannel?: string;
  kpi?: string;
  objective?: SegmentObjective;
  actionPreview?: string;
  messagingAngle?: string;
  sampleTactic?: string;
  interpretation?: string;
  timeHorizon?: string;
  offerIntensity?: string;
  speechBubble?: string;
}

const OBJECTIVE_VALUES: SegmentObjective[] = ["defend margin", "upsell", "retain", "reactivate", "deprioritize"];

function normalizeObjective(value: string | undefined, fallback: SegmentObjective): SegmentObjective {
  return OBJECTIVE_VALUES.includes(value as SegmentObjective) ? (value as SegmentObjective) : fallback;
}

function normalizeRevenueShare(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

export function mergeSegmentBusinessData(baseSegments: SegmentGuildRecord[], updates: SegmentBusinessUpdate[]) {
  const updateMap = new Map(updates.map((update) => [update.label, update]));

  return baseSegments.map((segment) => {
    const update = updateMap.get(segment.label);
    if (!update) return segment;

    return {
      ...segment,
      customerCount: typeof update.customerCount === "number" ? Math.max(0, Math.round(update.customerCount)) : segment.customerCount,
      revenueShare: normalizeRevenueShare(update.revenueShare, segment.revenueShare),
      bestChannel: update.bestChannel?.trim() || segment.bestChannel,
      kpi: update.kpi?.trim() || segment.kpi,
      objective: normalizeObjective(update.objective, segment.objective),
      actionPreview: update.actionPreview?.trim() || segment.actionPreview,
      messagingAngle: update.messagingAngle?.trim() || segment.messagingAngle,
      sampleTactic: update.sampleTactic?.trim() || segment.sampleTactic,
      interpretation: update.interpretation?.trim() || segment.interpretation,
      timeHorizon: update.timeHorizon?.trim() || segment.timeHorizon,
      offerIntensity: update.offerIntensity?.trim() || segment.offerIntensity,
      speechBubble: update.speechBubble?.trim() || segment.speechBubble,
    };
  });
}
