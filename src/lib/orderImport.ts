import {
  InputError, LIMITS, type ColumnMapping, type DataQuality, type DateFormat,
  type ImportInspection, type InputField, type RowIssueReason,
} from "./analysisTypes";
import type { NormalizedOrderRow } from "./deterministicSegmentAnalysis";

import { FIELD_ALIASES } from "./importAliases";
export { FIELD_ALIASES } from "./importAliases";

export interface ParsedTable {
  headers: string[];
  rows: { record: number; cells: unknown[]; formulas: number[] }[];
  blankRowsSkipped: number;
  sheetName: string | null;
  sheetCount: number;
  excel: boolean;
  date1904: boolean;
}
const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const blank = (value: unknown) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");

/** Strict RFC-style comma CSV. Quoted newlines/escaped quotes are supported. */
export function parseCsv(text: string): unknown[][] {
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, afterQuote = false;
  const finishCell = () => {
    row.push(cell); cell = ""; afterQuote = false;
    if (row.length > LIMITS.columns) throw new InputError(`Use at most ${LIMITS.columns} columns.`);
  };
  const finishRow = () => { finishCell(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; afterQuote = true; }
      } else cell += c;
    } else if (c === ',') finishCell();
    else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i++; finishRow(); }
    else if (c === '"' && cell === "" && !afterQuote) quoted = true;
    else if (c === '"' || (afterQuote && c !== ' ' && c !== '\t')) throw new InputError("Malformed CSV quoting. Save the file as a comma-separated CSV and try again.");
    else if (!afterQuote) cell += c;
    if (cell.length > LIMITS.cellCharacters) throw new InputError("A cell is too long. Remove free-text notes and use only the fields needed for this review.");
    if (rows.length > LIMITS.rows + 1) throw new InputError(`Use at most ${LIMITS.rows.toLocaleString("en-US")} data records.`, 413);
  }
  if (quoted) throw new InputError("A quoted CSV field is not closed.");
  if (cell !== "" || row.length || afterQuote) finishRow();
  return rows;
}

function tableFromRows(raw: unknown[][], options: Partial<ParsedTable> = {}, formulas: Map<number, number[]> = new Map()): ParsedTable {
  if (!raw.length) throw new InputError("The file is empty. Include a header row and at least one transaction.");
  const headers = raw[0].map((x, i) => String(x ?? "").trim().slice(0, 120) || `Unnamed column ${i + 1}`);
  if (headers.length < 3) throw new InputError("Include three columns: a stable customer ID, a purchase date and a transaction value. CSV files must be comma-separated.");
  if (headers.length > LIMITS.columns) throw new InputError(`Use at most ${LIMITS.columns} columns.`);
  let blankRowsSkipped = 0;
  const rows: ParsedTable["rows"] = [];
  raw.slice(1).forEach((cells, i) => {
    if (cells.length > headers.length && cells.slice(headers.length).some(x => !blank(x))) throw new InputError(`Record ${i + 2} has more fields than the header. Check CSV quoting.`);
    if (cells.every(blank)) { blankRowsSkipped++; return; }
    if (cells.some(x => typeof x === "string" && x.length > LIMITS.cellCharacters)) throw new InputError("A cell is too long. Remove unneeded free-text columns.");
    rows.push({ record: i + 2, cells, formulas: formulas.get(i + 1) ?? [] });
  });
  if (rows.length > LIMITS.rows) throw new InputError(`Use at most ${LIMITS.rows.toLocaleString("en-US")} data records.`, 413);
  return { headers, rows, blankRowsSkipped, sheetName: null, sheetCount: 1, excel: false, date1904: false, ...options };
}
export function tableFromCsv(text: string): ParsedTable { return tableFromRows(parseCsv(text)); }

/** Bound declared uncompressed XLSX size before handing the archive to SheetJS. */
export function checkWorkbookArchive(buffer: Buffer) {
  if (buffer.readUInt32LE(0) !== 0x04034b50) return; // XLS is compound binary, not ZIP.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new InputError("The Excel archive is incomplete.");
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16), expanded = 0;
  if (count === 0xffff || offset === 0xffffffff || count > 4000) throw new InputError("This workbook archive is too large or uses an unsupported ZIP64 format.", 413);
  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw new InputError("Invalid Excel archive directory.");
    expanded += buffer.readUInt32LE(offset + 24);
    if (expanded > LIMITS.expandedWorkbookBytes) throw new InputError("This workbook expands beyond the review limit. Export the first sheet as a smaller CSV.", 413);
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}

export async function decodeFile(fileBase64: string, fileName: string): Promise<ParsedTable> {
  if (!fileName || !/\.(csv|xlsx|xls)$/i.test(fileName)) throw new InputError("Choose a .csv, .xlsx or .xls file.", 415);
  if (!fileBase64 || fileBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(fileBase64)) throw new InputError("The file encoding is invalid.");
  if (fileBase64.length > Math.ceil(LIMITS.fileBytes / 3) * 4) throw new InputError("Choose a file no larger than 2 MiB.", 413);
  const buffer = Buffer.from(fileBase64, "base64");
  if (buffer.length > LIMITS.fileBytes) throw new InputError("Choose a file no larger than 2 MiB.", 413);
  if (/\.csv$/i.test(fileName)) {
    let text: string;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
    catch { throw new InputError("Save this CSV as UTF-8 before importing it."); }
    if (text.includes("\0")) throw new InputError("This does not appear to be a UTF-8 CSV.");
    return tableFromCsv(text);
  }
  if (buffer.length < 8) throw new InputError("The Excel file is incomplete.");
  const isZip = buffer.readUInt32LE(0) === 0x04034b50;
  const isCompound = buffer.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1";
  if (!isZip && !isCompound) throw new InputError("This is not a supported Excel workbook. Save it as CSV or a standard .xlsx file.");
  checkWorkbookArchive(buffer);
  const XLSX = await import("xlsx");
  if (Number(XLSX.version.split(".")[1]) < 20) throw new InputError("The installed Excel parser is outdated. Run npm ci using this release's package-lock.json.", 503, "PARSER_VERSION");
  let workbook: ReturnType<typeof XLSX.read>;
  try { workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, cellFormula: true, sheetRows: LIMITS.rows + 2, bookVBA: false }); }
  catch { throw new InputError("The workbook could not be read. Remove passwords or export its first sheet as UTF-8 CSV."); }
  const first = workbook.SheetNames[0];
  if (!first) throw new InputError("The workbook has no readable first sheet.");
  const sheet = workbook.Sheets[first];
  const range = sheet["!fullref"] || sheet["!ref"];
  if (range) {
    const bounds = XLSX.utils.decode_range(range);
    if (bounds.e.c + 1 > LIMITS.columns || bounds.e.r > LIMITS.rows) throw new InputError("The first sheet exceeds the row/column limit. Remove unused formatted rows or export a smaller CSV.", 413);
  }
  const formulas = new Map<number, number[]>();
  for (const key of Object.keys(sheet)) {
    if (key.startsWith("!")) continue;
    const cell = sheet[key];
    if (cell?.f) {
      const pos = XLSX.utils.decode_cell(key);
      formulas.set(pos.r, [...(formulas.get(pos.r) ?? []), pos.c]);
    }
  }
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "", blankrows: true, range: 0 });
  return tableFromRows(raw, { excel: true, sheetName: first, sheetCount: workbook.SheetNames.length, date1904: !!workbook.Workbook?.WBProps?.date1904 }, formulas);
}

export function inspectTable(table: ParsedTable): ImportInspection {
  const candidates = { customer: [], date: [], amount: [] } as Record<InputField, number[]>;
  const suggestedMapping = { customer: null, date: null, amount: null } as ImportInspection["suggestedMapping"];
  for (const field of Object.keys(candidates) as InputField[]) {
    const aliases = new Set(FIELD_ALIASES[field].map(normalizeHeader));
    candidates[field] = table.headers.flatMap((h, i) => aliases.has(normalizeHeader(h)) ? [i] : []);
    if (candidates[field].length === 1) suggestedMapping[field] = candidates[field][0];
  }
  const messages = ["Confirm that each row is a transaction, not a line item or account snapshot. Repeated rows are kept."];
  if (table.sheetCount > 1) messages.push(`Only the first sheet (${table.sheetName}) is read; ${table.sheetCount - 1} other sheet(s) are not analyzed.`);
  if (table.excel) messages.push("Numeric Excel IDs may already have lost leading zeros or precision. Use IDs stored as text.");
  if (new Set(table.headers.map(normalizeHeader)).size !== table.headers.length) messages.push("Some header names repeat. Columns are identified by position; choose the intended occurrence.");
  return {
    columns: table.headers.map((header, index) => ({ index, header, preview: table.rows.slice(0, 3).map(r => String(r.cells[index] ?? "").slice(0, 60)) })),
    suggestedMapping, candidates, inputRows: table.rows.length,
    blankRowsSkipped: table.blankRowsSkipped, sheetName: table.sheetName, sheetCount: table.sheetCount, messages,
  };
}

export function validateMapping(value: unknown, table: ParsedTable): ColumnMapping {
  const inspection = inspectTable(table);
  const mapping = (value ?? inspection.suggestedMapping) as Partial<ColumnMapping>;
  if (!mapping || typeof mapping !== "object") throw new InputError("Confirm the three field mappings.", 422, "MAPPING_REQUIRED");
  const indices = (["customer", "date", "amount"] as InputField[]).map(k => mapping[k]);
  if (indices.some(n => typeof n !== "number" || !Number.isInteger(n) || n < 0 || n >= table.headers.length) || new Set(indices).size !== 3) {
    throw new InputError("Choose a different source column for each required field. Missing or ambiguous columns are never guessed.", 422, "MAPPING_REQUIRED");
  }
  return { customer: indices[0] as number, date: indices[1] as number, amount: indices[2] as number };
}

function validYmd(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const stamp = new Date(Date.UTC(y, m - 1, d));
  if (stamp.getUTCFullYear() !== y || stamp.getUTCMonth() !== m - 1 || stamp.getUTCDate() !== d) return null;
  return stamp.toISOString().slice(0, 10);
}
export function parsePurchaseDate(value: unknown, dateFormat: DateFormat, excel = false, date1904 = false): string | null {
  if (typeof value === "number" && excel) {
    if (!Number.isFinite(value) || value < (date1904 ? 0 : 1) || value > 2_958_465) return null;
    const serial = Math.floor(value);
    if (!date1904 && serial === 60) return null; // Excel's fictitious 1900 leap day.
    const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 31);
    const d = new Date(base + (serial - (!date1904 && serial > 60 ? 1 : 0)) * 86_400_000);
    return validYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) return validYmd(+iso[1], +iso[2], +iso[3]);
  const timestamp = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(text);
  if (timestamp && validYmd(+timestamp[1], +timestamp[2], +timestamp[3])) {
    const ms = Date.parse(text); return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : null;
  }
  if (dateFormat !== "iso") {
    const m = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(text);
    if (m) return validYmd(+m[3], dateFormat === "mdy" ? +m[1] : +m[2], dateFormat === "mdy" ? +m[2] : +m[1]);
  }
  return null;
}
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) <= 1e10 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-4 ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  let s = value.trim().replace(/^\$/, "");
  if (/^\(.*\)$/.test(s)) s = '-' + s.slice(1, -1).replace(/^\$/, "");
  if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && Math.abs(n) <= 1e10 ? n : null;
}
export function normalizeTable(table: ParsedTable, mapping: ColumnMapping, format: DateFormat) {
  const quality: DataQuality = {
    inputRows: table.rows.length, validRows: 0, rejectedRows: 0, blankRowsSkipped: table.blankRowsSkipped,
    reasonCounts: { missingCustomerId: 0, invalidCustomerId: 0, invalidDate: 0, invalidAmount: 0, formulaCell: 0 },
    examples: [], examplesTruncated: false, negativeAmountRows: 0, zeroAmountRows: 0, messages: [],
  };
  const rows: NormalizedOrderRow[] = [];
  for (const row of table.rows) {
    const reasons: RowIssueReason[] = [];
    const uidValue = row.cells[mapping.customer];
    const uid = String(uidValue ?? "").trim();
    if (!uid) reasons.push("missingCustomerId");
    else if (uid.length > 200 || /[\u0000-\u001f\u007f]/.test(uid) || (typeof uidValue === "number" && !Number.isSafeInteger(uidValue))) reasons.push("invalidCustomerId");
    const date = parsePurchaseDate(row.cells[mapping.date], format, table.excel, table.date1904);
    const amount = parseAmount(row.cells[mapping.amount]);
    if (!date) reasons.push("invalidDate");
    if (amount === null) reasons.push("invalidAmount");
    if (Object.values(mapping).some(i => row.formulas.includes(i))) reasons.push("formulaCell");
    if (reasons.length) {
      quality.rejectedRows++;
      for (const reason of reasons) quality.reasonCounts[reason]++;
      if (quality.examples.length < 10) quality.examples.push({ record: row.record, reasons });
      else quality.examplesTruncated = true;
    } else {
      rows.push({ customer_uid: uid, purchase_date: date!, total: amount! });
      quality.validRows++;
      if (amount! < 0) quality.negativeAmountRows++;
      if (amount === 0) quality.zeroAmountRows++;
    }
  }
  quality.messages.push("No recorded purchase in this file does not establish that no purchase occurred elsewhere.");
  quality.messages.push("Each valid row counts as one transaction. No order-ID deduplication, FX conversion or profit calculation is performed.");
  if (quality.negativeAmountRows) quality.messages.push("Negative values are retained as signed transactions. Refunds/adjustments affect spend and also count toward frequency; review whether this matches your data.");
  if (table.sheetCount > 1) quality.messages.push(`Only the first sheet (${table.sheetName}) was analyzed.`);
  if (quality.rejectedRows) quality.messages.push("Reason counts can overlap: one rejected record can have more than one issue. The first 10 rejected record numbers are shown.");
  return { rows, quality };
}
