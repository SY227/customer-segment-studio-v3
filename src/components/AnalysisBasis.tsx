import type { StudioAnalysis, ScoreThresholds } from "../lib/analysisTypes";
import { formatMoney, formatNumber } from "../lib/presentation";

const reasonLabels = {
  missingCustomerId: "Missing customer ID", invalidCustomerId: "Invalid / unsafe customer ID",
  invalidDate: "Invalid or unresolved date", invalidAmount: "Invalid or missing amount", formulaCell: "Formula in a required field",
};
function ThresholdLine({ title, cut, inverse = false }: { title: string; cut: ScoreThresholds; inverse?: boolean }) {
  return <div><dt>{title}</dt><dd>{cut.tied ? "All values equal → score 2 (middle band)." : <>≤ {formatNumber(cut.lower)} → score {inverse ? "3" : "1"}; ≤ {formatNumber(cut.upper)} → score 2; above → score {inverse ? "1" : "3"}.</>}</dd></div>;
}
export function AnalysisBasis({ analysis }: { analysis: StudioAnalysis }) {
  const q = analysis.quality;
  return <section className="evidence-basis panel" aria-labelledby="analysis-basis-title">
    <details>
      <summary>
        <div><p className="mini-label">02 / KNOW THE BASIS</p><h2 id="analysis-basis-title">Evidence, not a black box.</h2></div>
        <div className="basis-summary"><span>As of <strong>{analysis.asOfDate}</strong></span><span className={q.rejectedRows ? "quality-pill warning" : "quality-pill"}>{q.rejectedRows ? `${q.rejectedRows} records excluded` : "All records accepted"}</span><span className="basis-open">View analysis basis <span aria-hidden="true">＋</span></span></div>
      </summary>
      <div className="basis-body">
        <div className="basis-metrics">
          <article><span>Customers</span><strong>{formatNumber(analysis.totalCustomers)}</strong></article>
          <article><span>Valid transactions</span><strong>{formatNumber(analysis.transactionCount)}</strong></article>
          <article><span>Historical total</span><strong>{formatMoney(analysis.totalRevenue, analysis.currency)}</strong></article>
          <article><span>Records excluded</span><strong>{formatNumber(q.rejectedRows)}</strong></article>
        </div>
        <p className="source-description"><strong>Source:</strong> {analysis.sourceLabel}. {analysis.sourceKind === "sample" && "Synthetic demonstration data, not client results."}</p>
        <div className="basis-columns">
          <div><h3>What was calculated</h3><p>Customer aggregation, group assignment and metrics use deterministic code. The analysis date is the latest valid transaction in this file, <strong>not today's date</strong>. Time since purchase is measured in UTC days.</p><p>Scores are relative to the customer distribution in this dataset. Boundaries are ordered-value cut points, not universal business thresholds. Ties can produce uneven or empty groups.</p><dl className="basis-definitions"><ThresholdLine title="Recency (days)" cut={analysis.basis.recency} inverse /><ThresholdLine title="Frequency (rows/customer)" cut={analysis.basis.frequency}/><ThresholdLine title={`Monetary (${analysis.currency}/customer)`} cut={analysis.basis.monetary}/><div><dt>Purchase strength</dt><dd>{analysis.basis.purchaseStrength}</dd></div></dl><p className="evidence-muted">Names such as “New Buyers”, “Growing Buyers” and “At-Risk VIPs” are retained segment labels, not proof of a first purchase, a growth trend or future churn.</p></div>
          <div><h3>What the file can—and cannot—tell us</h3><dl className="basis-definitions"><div><dt>Nonblank data records</dt><dd>{formatNumber(q.inputRows)}</dd></div><div><dt>Valid / excluded</dt><dd>{formatNumber(q.validRows)} / {formatNumber(q.rejectedRows)}</dd></div><div><dt>Blank records skipped</dt><dd>{formatNumber(q.blankRowsSkipped)}</dd></div>{Object.entries(q.reasonCounts).filter(([, count]) => count > 0).map(([key, count]) => <div key={key}><dt>{reasonLabels[key as keyof typeof reasonLabels]}</dt><dd>{formatNumber(count)}</dd></div>)}</dl>
            <div className="quality-notes">{q.messages.map(message => <p key={message}>{message}</p>)}</div>
            {q.examples.length > 0 && <details className="quality-examples"><summary>Excluded record examples</summary><ul>{q.examples.map(example => <li key={example.record}>Record {example.record}: {example.reasons.map(r => reasonLabels[r]).join("; ")}</li>)}</ul><p>Record numbers include the header. {q.examplesTruncated && "Only the first 10 examples are displayed."}</p></details>}
            <h3>What is guidance</h3><p>{analysis.guidance.message}</p><p className="evidence-muted">Suggested channels, objectives and review windows are not measured effectiveness, customer intent or predicted outcomes.</p>
          </div>
        </div>
      </div>
    </details>
  </section>;
}
