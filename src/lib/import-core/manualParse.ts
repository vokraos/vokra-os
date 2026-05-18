import type {
  ColumnMappingRule,
  ImportPreview,
  ImportPreviewWarning,
  MappingRequirement,
  MarketplaceImportKind,
  NormalizedTargetFieldId,
} from "./types";
import { DATA_IMPORT_MEMORY_SCHEMA } from "./types";
import { computeRequiredMissing, validateImportPreview } from "./validators";
import { unmappedSourceColumns } from "./mapping";

/** Max rows parsed in-browser for MVP (paste / mini-table). */
export const MANUAL_IMPORT_MAX_ROWS = 500 as const;

type HeaderMatch = { field: NormalizedTargetFieldId; requirement: MappingRequirement; hint: string };

const MANUAL_HEADER_RULES: readonly { patterns: readonly string[]; field: NormalizedTargetFieldId; requirement: MappingRequirement; hint: string }[] = [
  { patterns: ["sku name", "skuname", "название sku"], field: "skuName", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["cardtitle", "card_title", "заголовок карточ", "листинг"], field: "cardTitle", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["seocluster", "seo_cluster", "seo-кластер", "seo кластер", "кластер"], field: "seoCluster", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["productfamily", "product_family", "семейств", "family"], field: "productFamily", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["stockmode", "stock_mode", "режим остат", "fbs", "fbo"], field: "stockMode", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["skucode", "sku_code", "sku"], field: "skuCode", requirement: "required", hint: "import.hint.trim_spaces" },
  { patterns: ["article", "артикул поставщика", "vendor"], field: "article", requirement: "optional", hint: "import.hint.trim_spaces" },
  { patterns: ["баркод", "ean", "штрихкод", "barcode"], field: "barcode", requirement: "optional", hint: "import.hint.normalize_digits" },
  { patterns: ["маркетплейс", "marketplace", "площадк"], field: "marketplace", requirement: "optional", hint: "import.hint.enum_wb_ozon" },
  { patterns: ["title", "назван", "наимен", "предмет", "name"], field: "title", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["size", "размер"], field: "size", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["color", "цвет"], field: "color", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["warehouse", "склад"], field: "warehouse", requirement: "optional", hint: "import.hint.canonical_wh" },
  { patterns: ["corridor", "коридор"], field: "corridor", requirement: "optional", hint: "import.hint.slug_optional" },
  { patterns: ["stock", "остаток"], field: "stock", requirement: "optional", hint: "import.hint.non_negative_int" },
];

function matchManualHeader(header: string): HeaderMatch | null {
  const h = header.trim().toLowerCase().replace(/\s+/g, " ");
  const compact = h.replace(/[_\s]/g, "");
  for (const rule of MANUAL_HEADER_RULES) {
    for (const p of rule.patterns) {
      const pc = p.replace(/[_\s]/g, "");
      if (h.includes(p) || compact.includes(pc)) {
        return { field: rule.field, requirement: rule.requirement, hint: rule.hint };
      }
    }
  }
  return null;
}

export function detectDelimiter(headerLine: string): "," | "\t" | ";" {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semi = (headerLine.match(/;/g) ?? []).length;
  if (tabs >= commas && tabs >= semi && tabs > 0) return "\t";
  if (semi > commas) return ";";
  return ",";
}

function splitRow(line: string, delim: "," | "\t" | ";"): string[] {
  if (delim === "\t") return line.split("\t").map((c) => c.trim());
  if (delim === ";") return line.split(";").map((c) => c.trim());
  return line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
}

export type ManualParseResult = {
  delimiter: "," | "\t" | ";";
  headers: string[];
  rows: string[][];
};

export function parseDelimitedText(text: string): ManualParseResult | null {
  const raw = text.trim();
  if (!raw) return null;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return null;
  const delim = detectDelimiter(lines[0]!);
  const headers = splitRow(lines[0]!, delim);
  if (headers.length === 0 || headers.every((h) => !h)) return null;
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]!, delim);
    if (cells.every((c) => !c)) continue;
    while (cells.length < headers.length) cells.push("");
    rows.push(cells.slice(0, headers.length));
    if (rows.length >= MANUAL_IMPORT_MAX_ROWS) break;
  }
  return { delimiter: delim, headers, rows };
}

function buildMappings(headers: string[]): ColumnMappingRule[] {
  const out: ColumnMappingRule[] = [];
  const seen = new Set<NormalizedTargetFieldId>();
  for (const h of headers) {
    const m = matchManualHeader(h);
    if (!m || seen.has(m.field)) continue;
    seen.add(m.field);
    out.push({
      sourceColumn: h.trim(),
      targetField: m.field,
      confidence: 82,
      requirement: m.requirement,
      transformHint: m.hint,
      validationStatus: "pending",
    });
  }
  return withValidationRules(out);
}

/** Exported from validators for manual parse — apply validation flags. */
export function withValidationRules(rules: ColumnMappingRule[]): ColumnMappingRule[] {
  return rules.map((r) => ({
    ...r,
    validationStatus: r.confidence >= 70 ? "ok" : r.confidence >= 45 ? "warn" : "error",
  }));
}

function normalizeDataRow(headers: string[], cells: string[], mappings: ColumnMappingRule[]): Record<string, string> {
  const headerToValue = new Map<string, string>();
  headers.forEach((h, i) => headerToValue.set(h.trim(), cells[i] ?? ""));
  const out: Record<string, string> = {};
  for (const m of mappings) {
    const v = headerToValue.get(m.sourceColumn) ?? "";
    if (v) out[m.targetField] = v;
  }
  return out;
}

function defaultWarnings(rowCount: number, truncated: boolean): ImportPreviewWarning[] {
  const w: ImportPreviewWarning[] = [{ id: "manual_local", labelKey: "import.warn.manual_local_only" }];
  if (truncated) w.push({ id: "trunc", labelKey: "import.warn.row_truncated" });
  if (rowCount > 200) w.push({ id: "many_rows", labelKey: "import.warn.many_rows" });
  return w;
}

export function buildManualIntakePreview(
  importType: "manual_sku_list" | "manual_card_list",
  text: string,
): ImportPreview | null {
  const parsed = parseDelimitedText(text);
  if (!parsed || parsed.rows.length === 0) return null;

  const mappedColumns = buildMappings(parsed.headers);
  const unmapped = unmappedSourceColumns(parsed.headers, mappedColumns);
  const requiredMissing = computeRequiredMissing(importType, mappedColumns);
  const sampleRows = parsed.rows.slice(0, 8).map((cells) => normalizeDataRow(parsed.headers, cells, mappedColumns));
  const truncated = parsed.rows.length >= MANUAL_IMPORT_MAX_ROWS;

  const draft: ImportPreview = {
    schema: DATA_IMPORT_MEMORY_SCHEMA,
    importType,
    rowCount: parsed.rows.length,
    detectedColumns: parsed.headers.map((h) => h.trim()).filter(Boolean),
    mappedColumns,
    unmappedColumns: unmapped,
    requiredMissing,
    sampleRows,
    warnings: defaultWarnings(parsed.rows.length, truncated),
    readiness: 0,
  };
  return validateImportPreview(draft);
}

export function normalizedRowsFromParse(parsed: ManualParseResult, mappedColumns: ColumnMappingRule[]): Record<string, string>[] {
  return parsed.rows.map((cells) => normalizeDataRow(parsed.headers, cells, mappedColumns));
}

export function miniTableToTsv(headers: readonly string[], rows: readonly Record<string, string>[]): string {
  const lines: string[] = [headers.join("\t")];
  for (const r of rows) {
    lines.push(headers.map((h) => (r[h] ?? "").replace(/\t/g, " ").trim()).join("\t"));
  }
  return lines.join("\n");
}

export const MANUAL_SKU_HEADERS = [
  "skuCode",
  "article",
  "barcode",
  "marketplace",
  "title",
  "size",
  "color",
  "stockMode",
  "warehouse",
  "corridor",
  "productFamily",
] as const;

export const MANUAL_CARD_HEADERS = [
  ...MANUAL_SKU_HEADERS,
  "cardTitle",
  "seoCluster",
] as const;

export function isManualMvpKind(k: MarketplaceImportKind): k is "manual_sku_list" | "manual_card_list" {
  return k === "manual_sku_list" || k === "manual_card_list";
}
