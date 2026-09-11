"use client";
import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AtelierChrome, GuildSeal, HeaderEngraving } from "./AtelierChrome";
import { HeaderActionsClient } from "./HeaderActionsClient";
import { StudioDialog } from "./StudioDialog";
import { ImportMapping } from "./ImportMapping";
import { AnalysisBasis } from "./AnalysisBasis";
import { MemberReview } from "./MemberReview";
import { DEFAULT_SEGMENT_KEY, type SegmentKey } from "../data/segmentGuildData";
import { LIMITS, type ColumnMapping, type Currency, type DateFormat, type ImportInspection, type StudioAnalysis } from "../lib/analysisTypes";
import { segmentsForAnalysis, formatMoney, formatNumber, formatShare } from "../lib/presentation";
import { FIELD_ALIASES } from "../lib/importAliases";

const SegmentGuildCanvas = memo(dynamic(() => import("./SegmentGuildCanvas").then(m => m.SegmentGuildCanvas), { ssr: false, loading: () => <div className="guild-canvas-shell" aria-hidden="true"><div className="guild-canvas-viewport" /></div> }));
const SegmentCardAvatar = memo(dynamic(() => import("./SegmentCardAvatar").then(m => m.SegmentCardAvatar), { ssr: false, loading: () => <div className="segment-card-avatar-shell" aria-hidden="true" /> }));
const objectiveTone: Record<string, string> = { "defend margin": "objective-gold", upsell: "objective-emerald", retain: "objective-sky", reactivate: "objective-rose", deprioritize: "objective-slate" };
const dayLabel = (cut: { min: number; max: number }) => `${cut.min}–${cut.max} days across this file`;
const readFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onerror = () => reject(new Error("The file could not be read."));
  reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] ?? "") : reject(new Error("The file could not be read."));
  reader.readAsDataURL(file);
});

export function StudioClient({ initialAnalysis }: { initialAnalysis: StudioAnalysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [selectedKey, setSelectedKey] = useState<SegmentKey>(DEFAULT_SEGMENT_KEY);
  const [conversationPaused, setConversationPaused] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [dialog, setDialog] = useState<"format" | "sample" | "data" | null>(null);
  const [pending, setPending] = useState<{ name: string; base64: string; inspection: ImportInspection } | null>(null);
  const [busy, setBusy] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [includeAI, setIncludeAI] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const membersButton = useRef<HTMLButtonElement>(null);
  const segments = useMemo(() => segmentsForAnalysis(analysis), [analysis]);
  const selectedSegment = segments.find(s => s.key === selectedKey) ?? segments[0];
  const selectedMembers = useMemo(() => analysis.customers.filter(c => c.segmentKey === selectedKey), [analysis, selectedKey]);
  const selectedRevenue = selectedMembers.reduce((sum, c) => sum + c.historicalSpend, 0);
  const revenueLeader = useMemo(() => segments.reduce((best, s) => s.revenueShare > best.revenueShare ? s : best, segments[0]), [segments]);
  const highestUrgency = segments.find(s => s.key === "Dormant|High Frequency") ?? segments[0];
  const recentOpportunity = segments.find(s => s.key === "Recent|Low Frequency") ?? segments[0];
  const sourceLine = `${analysis.sourceKind === "sample" ? "Synthetic sample" : "Your uploaded data"} · ${formatNumber(analysis.totalCustomers)} customers · As of ${analysis.asOfDate}`;

  useEffect(() => () => controllerRef.current?.abort(), []);
  const post = useCallback(async (body: Record<string, unknown>, signal: AbortSignal) => {
    const response = await fetch("/api/segment-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Analysis failed. Your previous review is unchanged.");
    return result;
  }, []);
  const begin = (label: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController(); controllerRef.current = controller;
    const id = ++requestId.current; setBusy(true); setProcessingLabel(label); setError(null);
    return { id, controller };
  };
  const cancelImport = () => {
    requestId.current++; controllerRef.current?.abort(); setPending(null); setBusy(false); setError(null);
  };
  const apply = (result: StudioAnalysis) => { setAnalysis(result); setSelectedKey(DEFAULT_SEGMENT_KEY); setMemberOpen(false); setPending(null); };
  const loadSample = async () => {
    const { id, controller } = begin(includeAI ? "Calculating sample + optional guidance…" : "Calculating the sample…");
    try { const result = await post({ mode: "sample", includeAI }, controller.signal); if (id === requestId.current) apply(result); }
    catch (e) { if (!controller.signal.aborted && id === requestId.current) setError(e instanceof Error ? e.message : "Sample analysis failed."); }
    finally { if (id === requestId.current) setBusy(false); }
  };
  const upload = async (file: File) => {
    if (!/\.(csv|xlsx|xls)$/i.test(file.name) || file.size > LIMITS.fileBytes || file.size === 0) { setError("Choose a nonempty CSV, XLSX or XLS file no larger than 2 MiB."); return; }
    const { id, controller } = begin("Reading columns for your review…");
    try {
      const base64 = await readFile(file);
      if (id !== requestId.current) return;
      const result = await post({ mode: "inspect", fileName: file.name, fileBase64: base64 }, controller.signal);
      if (id === requestId.current) setPending({ name: file.name, base64, inspection: result.inspection });
    } catch (e) { if (!controller.signal.aborted && id === requestId.current) setError(e instanceof Error ? e.message : "The file could not be read."); }
    finally { if (id === requestId.current) setBusy(false); }
  };
  const confirm = async (mapping: ColumnMapping, dateFormat: DateFormat, currency: Currency, useAI: boolean) => {
    if (!pending) return;
    setIncludeAI(useAI);
    const { id, controller } = begin(useAI ? "Calculating groups + optional guidance…" : "Calculating customer evidence…");
    try {
      const result = await post({ mode: "upload", fileName: pending.name, fileBase64: pending.base64, mapping, dateFormat, currency, includeAI: useAI }, controller.signal);
      if (id === requestId.current) apply(result);
    } catch (e) { if (!controller.signal.aborted && id === requestId.current) setError(e instanceof Error ? e.message : "Analysis failed."); }
    finally { if (id === requestId.current) setBusy(false); }
  };
  const openMembers = () => {
    setMemberOpen(true);
    window.setTimeout(() => { const target = document.getElementById("member-review"); target?.focus({ preventScroll: true }); target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }, 0);
  };

  return <main className="guild-shell" id="main">
    <AtelierChrome />
    <section className="guild-board">
      <header className="guild-header panel">
        <HeaderEngraving />
        <div className="title-stack"><p className="eyebrow"><GuildSeal /> Segment Guild <span className="release-chip">V3 · Evidence + Action</span></p><h1>Customer Segment <em>Studio</em></h1><p className="lead-copy">See the purchase patterns. Inspect the customers. Take a next step with you.</p><p className="product-boundary">Purchase-history RFM · deterministic groups · human-reviewed decisions</p></div>
        <HeaderActionsClient isProcessing={busy} dataSourceLine={sourceLine} processingLabel={processingLabel} importWarning={pending ? null : error} onLoadSample={() => void loadSample()} onOpenSampleData={() => setDialog("sample")} onOpenSampleFormat={() => setDialog("format")} onOpenDataUse={() => setDialog("data")} onUploadFile={file => void upload(file)} />
      </header>

      <div className="evidence-orientation"><span><i aria-hidden="true"/> {analysis.sourceKind === "sample" ? "SYNTHETIC SAMPLE" : "UPLOADED TRANSACTIONS"}</span><p><strong>{formatNumber(analysis.totalCustomers)}</strong> customers · <strong>{formatNumber(analysis.transactionCount)}</strong> transactions · <strong>{formatMoney(analysis.totalRevenue, analysis.currency)}</strong> historical total</p><button type="button" className="text-action" onClick={openMembers}>View customer evidence <span aria-hidden="true">↗</span></button></div>

      <section className="board-middle">
        <div className="hall-panel panel"><div className="panel-topline canvas-panel-topline"><div className="canvas-title-block"><p className="mini-label">Visual segment map</p><h2>Living customer segment map</h2></div><div className="canvas-summary-rail" aria-label="Purchase-history review prompts"><article><span>Largest historical share</span><strong>{analysis.totalRevenue > 0 ? revenueLeader.label : "Not meaningful"}</strong><p>{analysis.totalRevenue > 0 ? `${formatShare(revenueLeader.revenueShare)} of this file's total` : "Zero/negative historical total"}</p></article><article><span>Reactivation group to review</span><strong>{highestUrgency.label}</strong><p>{formatNumber(highestUrgency.customerCount)} customers · not a risk ranking</p></article><article><span>Recent-buyer group to review</span><strong>{recentOpportunity.label}</strong><p>{formatNumber(recentOpportunity.customerCount)} customers · not predicted growth</p></article></div></div>
          <SegmentGuildCanvas segments={segments} selectedKey={selectedKey} onSelect={setSelectedKey} conversationPaused={conversationPaused || memberOpen || !!pending} />
          <p className="scene-boundary">Character dialogue illustrates strategy. It is not customer testimony or simulated sentiment.</p>
        </div>
        <aside className="detail-panel panel" style={{ ["--selected-accent" as string]: selectedSegment.accent, ["--selected-soft" as string]: selectedSegment.accentSoft }}>
          <div className="panel-topline detail-topline"><div><p className="mini-label">Customer group</p><h2>{selectedSegment.label}</h2></div><div className="detail-topline-actions"><label className="conversation-toggle" htmlFor="conversation-pause-toggle"><input id="conversation-pause-toggle" type="checkbox" checked={conversationPaused || memberOpen} disabled={memberOpen} onChange={e => setConversationPaused(e.target.checked)}/><span>{memberOpen ? "Locked during review" : "Keep this group selected"}</span></label><span className={`objective-pill ${objectiveTone[selectedSegment.objective]}`}>{selectedSegment.objective}</span></div></div>
          <p className="detail-narrative">{selectedSegment.interpretation}</p>
          <div className="detail-metrics"><article className="metric-card"><span>Customers in group</span><strong>{formatNumber(selectedSegment.customerCount)}</strong></article><article className="metric-card"><span>Historical share</span><strong>{analysis.totalRevenue > 0 ? formatShare(selectedSegment.revenueShare) : "Not meaningful"}</strong></article><article className="metric-card"><span>Historical revenue represented</span><strong>{formatMoney(selectedRevenue, analysis.currency)}</strong></article><article className="metric-card"><span>Suggested channel</span><strong>{selectedSegment.bestChannel}</strong></article></div>
          <button ref={membersButton} type="button" className="evidence-button primary member-open-button" onClick={openMembers}>View {formatNumber(selectedSegment.customerCount)} {selectedSegment.customerCount === 1 ? "customer" : "customers"} <span aria-hidden="true">→</span></button>
          <div className="group-evidence"><p className="mini-label">Why this group?</p><h3>{selectedSegment.recency} recency · {selectedSegment.frequency.replace(" Frequency", "").toLowerCase()} purchase strength</h3><p>Recency ranks the last supplied purchase against this file. Purchase strength combines frequency and monetary scores—not frequency alone.</p><p className="evidence-muted">As of {analysis.asOfDate} · {dayLabel(analysis.basis.recency)}. “New”, “Growing” and “At-Risk” are category names, not verified outcomes.</p></div>
          <div className="suggestion-heading"><span className="mini-label">Next step to test</span><span className="guidance-badge">{analysis.guidance.aiFieldsBySegment?.[selectedSegment.label]?.length ? "AI suggestions / template" : "Reviewed prompt"}</span></div>
          <dl className="detail-list"><div><dt>Action</dt><dd>{selectedSegment.actionPreview}</dd></div><div><dt>Suggested KPI</dt><dd>{selectedSegment.kpi}</dd></div></dl>
          <details className="strategy-details"><summary>Objective, messaging & review window</summary><dl className="detail-list"><div><dt>Objective</dt><dd>{selectedSegment.objective}</dd></div><div><dt>Messaging angle</dt><dd>{selectedSegment.messagingAngle}</dd></div><div><dt>Sample tactic</dt><dd>{selectedSegment.sampleTactic}</dd></div><div><dt>Review window</dt><dd>{selectedSegment.timeHorizon} · {selectedSegment.offerIntensity}</dd></div></dl></details>
          <p className="evidence-muted">Suggestions require your business context and contact permissions. Historical spend is not recoverable revenue, profit or a forecast.</p>
        </aside>
      </section>

      <AnalysisBasis analysis={analysis} />
      <section className="segment-grid panel"><div className="panel-topline segment-grid-topline"><div><p className="mini-label">Nine customer groups</p><h2>Customer segment cards</h2></div><button className="evidence-button" type="button" onClick={openMembers}>Open customer table</button></div><div className="segment-cards">{segments.map(segment => <button key={segment.key} type="button" className={`segment-card ${segment.key === selectedKey ? "is-selected" : ""}`} style={{ ["--segment-accent" as string]: segment.accent, ["--segment-accent-soft" as string]: segment.accentSoft }} onClick={() => setSelectedKey(segment.key)} aria-pressed={segment.key === selectedKey}>
        <div className="segment-card-top"><div><p className="segment-card-name">{segment.label}</p><p className="segment-card-role">{segment.fantasyRole}</p></div><span className={`objective-pill segment-objective-pill ${objectiveTone[segment.objective]}`}>{segment.objective}</span></div><div className="segment-card-avatar-shell"><span className="portrait-engraving" aria-hidden="true"><GuildSeal /></span><SegmentCardAvatar asset={segment.asset} textureOverride={segment.textureOverride} accent={segment.accent} characterHeight={segment.characterHeight} label={segment.label}/></div><div className="segment-card-stats"><article className="segment-stat-card"><span>Customer count</span><strong>{formatNumber(segment.customerCount)}</strong></article><article className="segment-stat-card"><span>Historical share</span><strong>{analysis.totalRevenue > 0 ? formatShare(segment.revenueShare) : "—"}</strong></article></div><div className="segment-card-next"><span className="segment-card-next-label">Next move to test</span><p>{segment.actionPreview}</p></div></button>)}</div></section>

      {memberOpen ? <MemberReview key={`${analysis.sourceLabel}:${selectedKey}:${analysis.asOfDate}`} analysis={analysis} selectedKey={selectedKey} segments={segments} onClose={() => { setMemberOpen(false); membersButton.current?.focus(); }} /> : <section className="member-entry panel"><div><p className="mini-label">03 / MAKE IT USABLE</p><h2>From a group to a usable customer list.</h2><p>Inspect member-level evidence, search customer IDs and export suggestions alongside the facts.</p></div><button className="evidence-button primary" type="button" onClick={openMembers}>Inspect & export <span aria-hidden="true">→</span></button></section>}

      <aside className="coverage-callout panel"><div><p className="mini-label">EXPLORING CUSTOMER COVERAGE?</p><h2>A separate question. A focused pilot.</h2><p>This Studio analyzes purchase behavior. We are also exploring a customer-coverage review for B2B SaaS teams: which accounts deserve human attention, why, and what happens next.</p></div><a className="evidence-button" href="https://customer-segment-studio-flagship-si-inky.vercel.app/?story=coverage" target="_blank" rel="noreferrer">Learn about the Coverage Review <span aria-hidden="true">↗</span></a><small>The coverage workflow is a separate pilot inquiry, not a feature of this RFM analysis.</small></aside>
      <footer className="studio-footer"><span>Customer Segment Studio · V3.0.0</span><span>Evidence → understanding → exportable action</span><button type="button" onClick={() => setDialog("data")}>Data & limitations</button></footer>
    </section>

    {pending && <ImportMapping inspection={pending.inspection} name={pending.name} busy={busy} error={error} initialAI={includeAI} onCancel={cancelImport} onConfirm={(m, f, c, ai) => void confirm(m, f, c, ai)}/>}
    {dialog === "data" && <StudioDialog title="How your data is used" eyebrow="DATA & LIMITATIONS" onClose={() => setDialog(null)}><div className="data-use-copy"><h3>Application server</h3><p>Your file is sent to this application's server for column inspection and, after confirmation, for deterministic analysis. The inspection request does not invoke AI. The application code does not write transaction files to a database or disk, but this is not a zero-retention guarantee: hosting, infrastructure logs and memory behavior are outside that statement.</p><h3>Your browser</h3><p>The chosen file and the completed result are held in the current page's memory. CSV exports are created in your browser from the analysis result. This release does not add database accounts, autosaved projects or analytics. Reloading resets the review to the synthetic sample.</p><h3>Optional Gemini guidance</h3><p>AI is off unless you request it. With a server key, only group labels, counts, revenue shares, historical total, currency and analysis date are sent to Google. Filenames, customer IDs, source rows and member lists are excluded. Provider terms still apply. A failed or unconfigured provider falls back to reviewed prompts and is labeled.</p><label className="evidence-checkbox"><input type="checkbox" checked={includeAI} onChange={e => setIncludeAI(e.target.checked)}/> Request AI suggestions on the next analysis</label><p>This setting applies to the next sample load and is offered again when confirming an upload; it does not send your current data now.</p><h3>Before you upload</h3><p>Use authorized, pseudonymous customer IDs. Remove names, emails and free-text notes. All columns in the chosen file are transmitted for parsing even if only three are analyzed. No FX conversion, consent check, profitability calculation or churn prediction is performed.</p><p>Review limits: 2 MiB file, 50,000 data records, 10,000 customers and a 3,500 KiB response. Workbook expansion is also bounded. These are guardrails, not load-test or production-security certification.</p></div></StudioDialog>}
    {dialog === "format" && <StudioDialog title="A small file. Clear evidence." eyebrow="IMPORT FORMAT" onClose={() => setDialog(null)}><div className="data-use-copy"><p>CSV (UTF-8, comma-separated) or Excel (.xlsx/.xls, first sheet). One transaction per row, with a stable customer ID, purchase date and amount.</p><div className="format-example"><code>customer_uid,purchase_date,total<br/>CUST_001,2026-06-01,120.50<br/>CUST_001,2026-06-14,89.00<br/>CUST_002,2026-05-22,45.00</code></div><h3>Common names are recognized</h3><dl className="basis-definitions">{Object.entries(FIELD_ALIASES).map(([field, aliases]) => <div key={field}><dt>{field === "customer" ? "Customer ID" : field === "date" ? "Purchase date" : "Transaction value"}</dt><dd>{aliases.join(", ")}</dd></div>)}</dl><p>You can select any column manually. Multiple matching names require a choice. Formula cells in required fields are rejected; paste their values before importing. Blank amounts are not treated as zero.</p><p>Negative transactions and zero values are retained and disclosed; decide whether refund/adjustment rows should count as orders in your business. Repeated rows are not deduplicated.</p><a href="/sample-segment-guild-format.csv" download className="evidence-button primary">Download sample CSV</a></div></StudioDialog>}
    {dialog === "sample" && <StudioDialog title="One sample, all the way through." eyebrow="SYNTHETIC DEMONSTRATION" onClose={() => setDialog(null)}><div className="data-use-copy"><p>The opening view and “Load sample data” analyze the same {initialAnalysis.transactionCount} synthetic transaction rows for {initialAnalysis.totalCustomers} customer IDs. Total: {formatMoney(initialAnalysis.totalRevenue, initialAnalysis.currency)}. As of {initialAnalysis.asOfDate}.</p><p>Counts, member lists, assignment reasons and exports reconcile to those transactions. These are demonstration identifiers, not real customers or measured outcomes.</p><a href="/sample-outreach-transactions.csv" download className="evidence-button primary">Download the complete demo dataset</a><p>The small import-format CSV is a separate formatting example, not this demonstration dataset.</p></div></StudioDialog>}
  </main>;
}
