import { NextResponse } from "next/server";
import { analyzeTable, createSampleAnalysis } from "@/lib/analysisService";
import { decodeFile, inspectTable } from "@/lib/orderImport";
import { maybeAddGuidance } from "@/lib/softGuidance";
import { CURRENCIES, InputError, LIMITS, type Currency, type DateFormat } from "@/lib/analysisTypes";

export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };

async function boundedJson(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new InputError("Send application/json.", 415);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new InputError("Cross-origin file requests are not accepted.", 403);
  if (Number(request.headers.get("content-length") || 0) > LIMITS.requestBytes) throw new InputError("The request is too large. Choose a file no larger than 2 MiB.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("The request is empty.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > LIMITS.requestBytes) { await reader.cancel(); throw new InputError("The request is too large.", 413); }
      chunks.push(value);
    }
    const result: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("Invalid object");
    return result as Record<string, unknown>;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError("The request body is not valid JSON.");
  } finally { reader.releaseLock(); }
}
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers }); }

export async function POST(request: Request) {
  try {
    const body = await boundedJson(request);
    if (body.mode !== "sample" && body.mode !== "inspect" && body.mode !== "upload") throw new InputError("Choose sample, inspect or upload mode.");
    if (body.includeAI !== undefined && typeof body.includeAI !== "boolean") throw new InputError("The AI option must be a boolean.");
    if (body.currency !== undefined && !CURRENCIES.includes(body.currency as Currency)) throw new InputError("Choose a supported display currency. Mixed currencies cannot be analyzed together.");
    if (body.dateFormat !== undefined && !["iso", "mdy", "dmy"].includes(body.dateFormat as string)) throw new InputError("Choose an explicit supported date format.");
    let analysis;
    if (body.mode === "sample") analysis = createSampleAnalysis();
    else {
      if (typeof body.fileName !== "string" || typeof body.fileBase64 !== "string" || body.fileName.length > 250) throw new InputError("A filename and encoded file are required.");
      const table = await decodeFile(body.fileBase64, body.fileName);
      if (body.mode === "inspect") return json({ inspection: inspectTable(table) });
      const safeName = body.fileName.replace(/[\u0000-\u001f\u007f]/g, "").split(/[\\/]/).pop() || "file";
      analysis = analyzeTable(table, {
        mapping: body.mapping, dateFormat: (body.dateFormat as DateFormat | undefined) ?? "iso",
        sourceLabel: `Uploaded dataset: ${safeName}`, sourceKind: "upload", currency: (body.currency as Currency | undefined) ?? "USD",
      });
    }
    analysis = await maybeAddGuidance(analysis, body.includeAI === true);
    // Never silently truncate memberships: either return the complete review or a clear limit error.
    if (Buffer.byteLength(JSON.stringify(analysis), "utf8") > LIMITS.responseBytes) throw new InputError("The complete customer detail is too large for one review. Split your file into a smaller cohort.", 413, "RESPONSE_TOO_LARGE");
    return json(analysis);
  } catch (error) {
    if (error instanceof InputError) return json({ error: error.message, code: error.code }, error.status);
    return json({ error: "The analysis could not be completed. Check the file and try again. No previous analysis was replaced.", code: "ANALYSIS_ERROR" }, 500);
  }
}
