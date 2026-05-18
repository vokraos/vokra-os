import type { ImportPreview, ImportPreviewWarning, MarketplaceImportKind } from "./types";
import { DATA_IMPORT_MEMORY_SCHEMA } from "./types";
import { SAMPLE_COLUMNS_BY_IMPORT } from "./sampleColumns";
import { computeRequiredMissing, computeReadiness, validateImportPreview } from "./validators";
import { suggestMappingsForColumns, unmappedSourceColumns } from "./mapping";

const SAMPLE_ROW_TEMPLATES: Partial<
  Record<MarketplaceImportKind, ReadonlyArray<Readonly<Record<string, string | number>>>>
> = {
  wb_sales_report: [
    { skuCode: "VOK-001", orders: 42, buyouts: 31, revenue: 128900, warehouse: "Коледино" },
    { skuCode: "VOK-002", orders: 18, buyouts: 12, revenue: 45200, warehouse: "Электросталь" },
  ],
  wb_stock_report: [
    { skuCode: "VOK-001", stock: 240, warehouse: "Коледино" },
    { skuCode: "VOK-003", stock: 0, warehouse: "Тула" },
  ],
  manual_sku_list: [{ skuCode: "VOK-001", skuName: "Футболка DTF", marketplace: "WB", corridor: "premium_dtf" }],
};

function defaultWarnings(kind: MarketplaceImportKind): ImportPreviewWarning[] {
  const w: ImportPreviewWarning[] = [
    { id: "no_file_pipeline", labelKey: "import.warn.no_file_pipeline" },
    { id: "sample_only", labelKey: "import.warn.sample_only" },
  ];
  if (kind.startsWith("wb")) w.push({ id: "wb_locale", labelKey: "import.warn.wb_locale" });
  if (kind.startsWith("ozon")) w.push({ id: "ozon_locale", labelKey: "import.warn.ozon_locale" });
  return w;
}

/** Build a synthetic ImportPreview for UX — no file I/O. */
export function buildSampleImportPreview(kind: MarketplaceImportKind): ImportPreview {
  const detectedColumns = [...SAMPLE_COLUMNS_BY_IMPORT[kind]];
  let mappedColumns = suggestMappingsForColumns(detectedColumns, kind);
  const unmapped = unmappedSourceColumns(detectedColumns, mappedColumns);
  let requiredMissing = computeRequiredMissing(kind, mappedColumns);
  const sampleRows = SAMPLE_ROW_TEMPLATES[kind] ?? [
    { skuCode: "DEMO-1", note: "sample" },
    { skuCode: "DEMO-2", note: "sample" },
  ];
  const rowCount = 1240;

  const draft: ImportPreview = {
    schema: DATA_IMPORT_MEMORY_SCHEMA,
    importType: kind,
    rowCount,
    detectedColumns,
    mappedColumns,
    unmappedColumns: unmapped,
    requiredMissing,
    sampleRows,
    warnings: defaultWarnings(kind),
    readiness: computeReadiness(kind, mappedColumns, requiredMissing),
  };
  return validateImportPreview(draft);
}

export function sampleNormalizedFieldsFromPreview(preview: ImportPreview): Record<string, string | number> {
  const row = preview.sampleRows[0];
  if (!row) return { importType: preview.importType, readiness: preview.readiness };
  const out: Record<string, string | number> = { importType: preview.importType };
  for (const [k, v] of Object.entries(row)) {
    out[k] = v;
  }
  out.readiness = preview.readiness;
  return out;
}
