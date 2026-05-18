import type { GenerationRecord, VisualAnalysisRecord } from "./types";

function downloadBlob(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportGenerationMarkdown(record: GenerationRecord) {
  downloadBlob(sanitizeFilename(`${record.title}.md`), record.content, "text/markdown");
}

export function exportGenerationPlain(record: GenerationRecord) {
  downloadBlob(sanitizeFilename(`${record.title}.txt`), record.content, "text/plain");
}

export function exportGenerationJsonRecord(record: GenerationRecord) {
  downloadBlob(sanitizeFilename(`${record.title}.json`), JSON.stringify(record, null, 2), "application/json");
}

export function exportVisualAnalysisJson(record: VisualAnalysisRecord) {
  downloadBlob(sanitizeFilename(`${record.title}.json`), JSON.stringify(record, null, 2), "application/json");
}

export function exportVisualAnalysisParsed(record: VisualAnalysisRecord) {
  downloadBlob(sanitizeFilename(`${record.title}-analysis.json`), record.analysisJson, "application/json");
}

function sanitizeFilename(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "export";
}
