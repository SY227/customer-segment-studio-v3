"use client";
import { useState } from "react";
import { StudioDialog } from "./StudioDialog";
import { CURRENCIES, type ColumnMapping, type Currency, type DateFormat, type ImportInspection, type InputField, type SuggestedMapping } from "../lib/analysisTypes";

const fields: { key: InputField; name: string; note: string }[] = [
  { key: "customer", name: "Customer ID", note: "One stable identifier reused across a customer's transactions." },
  { key: "date", name: "Purchase date", note: "The date of each transaction, not an account's last-touch field." },
  { key: "amount", name: "Transaction value", note: "One transaction amount, not ARR, lifetime spend or a line-item subtotal." },
];
export function ImportMapping({ inspection, name, busy, error, initialAI, onCancel, onConfirm }: {
  inspection: ImportInspection; name: string; busy: boolean; error: string | null; initialAI: boolean;
  onCancel: () => void;
  onConfirm: (mapping: ColumnMapping, format: DateFormat, currency: Currency, includeAI: boolean) => void;
}) {
  const [mapping, setMapping] = useState<SuggestedMapping>(inspection.suggestedMapping);
  const [format, setFormat] = useState<DateFormat>("iso");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [includeAI, setAI] = useState(initialAI);
  const values = Object.values(mapping);
  const complete = values.every(v => typeof v === "number") && new Set(values).size === 3;
  return <StudioDialog title="Match your columns" eyebrow="01 / BRING THE EVIDENCE" onClose={onCancel}>
    <p className="dialog-intro"><strong>{name}</strong> · {inspection.inputRows.toLocaleString("en-US")} nonblank records{inspection.sheetName ? ` · First sheet: ${inspection.sheetName}` : ""}</p>
    <p className="evidence-muted">Your file has been read on the application server for this preview. Confirm the three fields before analysis. No AI is used for field matching.</p>
    <form onSubmit={e => { e.preventDefault(); if (complete && !busy) onConfirm(mapping as ColumnMapping, format, currency, includeAI); }}>
      <div className="mapping-grid">
        {fields.map(field => {
          const selected = inspection.columns.find(c => c.index === mapping[field.key]);
          const unresolved = inspection.candidates[field.key].length > 1;
          return <div className="mapping-field" key={field.key}>
            <label htmlFor={`map-${field.key}`}>{field.name}</label>
            <p>{field.note}</p>
            <select id={`map-${field.key}`} required disabled={busy} value={mapping[field.key] ?? ""}
              onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value === "" ? null : Number(e.target.value) }))}>
              <option value="">{unresolved ? "Multiple matches — choose one" : "Choose a column"}</option>
              {inspection.columns.map(c => <option key={c.index} value={c.index}>Column {c.index + 1}: {c.header}</option>)}
            </select>
            <div className="mapping-preview"><span>Preview</span>{selected ? selected.preview.map((v, i) => <code key={i}>{v || "(empty)"}</code>) : <p>No source selected</p>}</div>
          </div>;
        })}
      </div>
      {!complete && <p className="evidence-notice">Select three distinct columns. Ambiguous matches are never chosen automatically.</p>}
      <div className="mapping-options">
        <label>Date interpretation<select value={format} disabled={busy} onChange={e => setFormat(e.target.value as DateFormat)}>
          <option value="iso">ISO dates / Excel date cells</option><option value="mdy">Month / day / year</option><option value="dmy">Day / month / year</option>
        </select></label>
        <label>Amount currency<select value={currency} disabled={busy} onChange={e => setCurrency(e.target.value as Currency)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <p className="evidence-muted">Dates without an explicit local format must use YYYY-MM-DD (or an ISO timestamp with timezone). Amounts use a dot decimal, optional comma thousands separators and at most two decimal places. The currency is your setting, not detected. Mixed currencies must be separated first; no conversion is performed.</p>
      <div className="import-assumptions">{inspection.messages.map(message => <p key={message}>{message}</p>)}</div>
      <label className="evidence-checkbox"><input type="checkbox" checked={includeAI} disabled={busy} onChange={e => setAI(e.target.checked)} /> Add optional AI-written suggestions</label>
      <p className="evidence-muted">Off by default. When requested and configured, Gemini receives nine group totals, historical total, currency and as-of date—not file contents, filenames or customer IDs. Hard metrics never come from AI.</p>
      {error && <p className="evidence-error" role="alert">{error}</p>}
      <div className="evidence-actions"><button className="evidence-button primary" type="submit" disabled={!complete || busy}>{busy ? "Analyzing…" : "Confirm & analyze"} <span aria-hidden="true">→</span></button><button className="evidence-button quiet" type="button" onClick={onCancel}>{busy ? "Cancel request" : "Cancel import"}</button></div>
    </form>
  </StudioDialog>;
}
