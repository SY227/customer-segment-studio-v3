"use client";
import { useMemo, useState } from "react";
import type { StudioAnalysis } from "../lib/analysisTypes";
import type { SegmentGuildRecord, SegmentKey } from "../data/segmentGuildData";
import { buildActionCsv, downloadCsv } from "../lib/actionExport";
import { formatMoney, formatNumber } from "../lib/presentation";

const PAGE_SIZE = 25;
export function MemberReview({ analysis, selectedKey, segments, onClose }: { analysis: StudioAnalysis; selectedKey: SegmentKey; segments: SegmentGuildRecord[]; onClose: () => void }) {
  const [scope, setScope] = useState<"selected" | "all">("selected");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("spend");
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState("");
  const current = segments.find(s => s.key === selectedKey)!;
  const groupMembers = useMemo(() => analysis.customers.filter(c => c.segmentKey === selectedKey), [analysis, selectedKey]);
  const scoped = scope === "all" ? analysis.customers : groupMembers;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = scoped.filter(c => !q || c.customerUid.toLowerCase().includes(q));
    return rows.sort((a, b) => sort === "id" ? a.customerUid.localeCompare(b.customerUid) : sort === "recency" ? b.recencyDays - a.recencyDays || a.customerUid.localeCompare(b.customerUid) : b.historicalSpend - a.historicalSpend || a.customerUid.localeCompare(b.customerUid));
  }, [scoped, query, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const shown = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const exportRows = (kind: "selected" | "all" | "filtered") => {
    const rows = kind === "selected" ? groupMembers : kind === "all" ? analysis.customers : filtered;
    if (!rows.length) return;
    downloadCsv(buildActionCsv(analysis, rows, segments), `studio-${kind === "selected" ? current.label : kind}-${analysis.asOfDate}.csv`);
    setMessage(`CSV prepared for ${formatNumber(rows.length)} customer${rows.length === 1 ? "" : "s"}. Your browser controls the download; no file is sent to a CRM.`);
  };
  return <section className="member-review panel" id="member-review" aria-labelledby="member-review-title" tabIndex={-1}>
    <div className="member-heading"><div><p className="mini-label">03 / MAKE IT USABLE</p><h2 id="member-review-title">The customers behind the group.</h2><p><strong>{current.label}</strong> · {formatNumber(groupMembers.length)} customers · As of {analysis.asOfDate}</p></div><button type="button" className="evidence-button quiet" onClick={onClose}>Close customer table</button></div>
    <p className="evidence-muted">Group rotation pauses while this table is open. Character movement is unchanged. Use the group cards above to change the selected group.</p>
    <div className="member-toolbar"><div className="scope-control" role="group" aria-label="Customer scope"><button type="button" aria-pressed={scope === "selected"} onClick={() => { setScope("selected"); setPage(0); }}>Selected group</button><button type="button" aria-pressed={scope === "all"} onClick={() => { setScope("all"); setPage(0); }}>All customers</button></div><label>Search customer ID<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Find an ID…" /></label><label>Sort by<select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}><option value="spend">Historical spend ↓</option><option value="recency">Days since purchase ↓</option><option value="id">Customer ID</option></select></label></div>
    <div className="member-table-scroll" role="region" aria-label="Customer evidence table; scroll horizontally on small screens" tabIndex={0}>
      <table><caption>{scope === "selected" ? current.label : "All groups"}: {formatNumber(filtered.length)} matching customers. {analysis.sourceKind === "sample" ? "Synthetic sample data." : "Based only on the supplied file."}</caption>
        <thead><tr><th scope="col">Customer ID</th><th scope="col">Group / evidence</th><th scope="col">Last purchase</th><th scope="col" className="numeric">Days since</th><th scope="col" className="numeric">Orders¹</th><th scope="col" className="numeric">Historical spend</th></tr></thead>
        <tbody>{shown.map(member => <tr key={member.customerUid}><th scope="row"><code>{member.customerUid}</code></th><td><strong>{member.segment}</strong><small>{member.recencyBand} · {member.purchaseStrengthBand} purchase strength</small><details><summary>Why this assignment?</summary><p>{member.reason}</p></details></td><td>{member.lastPurchaseDate}</td><td className="numeric">{formatNumber(member.recencyDays)}</td><td className="numeric">{formatNumber(member.orderCount)}</td><td className="numeric">{formatMoney(member.historicalSpend, analysis.currency)}</td></tr>)}
          {!shown.length && <tr><td colSpan={6} className="member-empty">{query ? "No IDs match this search. Clear the search or choose all customers." : "No customers fall into this group for the supplied data. Empty groups are possible with relative scoring."}</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="member-pagination"><p>Showing {filtered.length ? safePage * PAGE_SIZE + 1 : 0}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {formatNumber(filtered.length)}</p><div><button type="button" className="evidence-button quiet" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button><span>Page {safePage + 1} / {pages}</span><button type="button" className="evidence-button quiet" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button></div></div>
    <p className="evidence-muted">¹ Orders means valid transaction rows in this file. Without order IDs, line items, duplicate rows and refunds can affect that count. No automatic deduplication is applied.</p>
    <div className="export-panel"><div><h3>Take the next step with you.</h3><p>Customer-level evidence and suggested actions, ready for a spreadsheet or a human-led review. Not a native CRM integration.</p></div><div className="evidence-actions"><button type="button" className="evidence-button primary" disabled={!groupMembers.length} onClick={() => exportRows("selected")}>Download group CSV ({formatNumber(groupMembers.length)})</button><button type="button" className="evidence-button" onClick={() => exportRows("all")}>Download all customers</button>{query && <button type="button" className="evidence-button quiet" disabled={!filtered.length} onClick={() => exportRows("filtered")}>Download search results ({formatNumber(filtered.length)})</button>}</div></div>
    <p className="evidence-muted">Group and full exports include every customer in that scope—not just this page. Actions and review windows are suggestions; owners and due dates are not invented. Import the ID column as text to retain leading zeros. Formula-like textual values are prefixed with an apostrophe for spreadsheet safety.</p>
    <p className="export-status" role="status">{message}</p>
  </section>;
}
