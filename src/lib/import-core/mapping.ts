import type { ColumnMappingRule, MappingRequirement, MarketplaceImportKind, NormalizedTargetFieldId } from "./types";
import { schemaFor } from "./schemas";

type Synonym = { patterns: readonly string[]; field: NormalizedTargetFieldId; requirement: MappingRequirement; hint: string };

const SYNONYMS: readonly Synonym[] = [
  { patterns: ["cardtitle", "card_title", "заголовок карточ"], field: "cardTitle", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["seocluster", "seo_cluster", "seo-кластер", "кластер seo"], field: "seoCluster", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["productfamily", "product_family", "семейств"], field: "productFamily", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["sku name", "skuname"], field: "skuName", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["stockmode", "stock_mode", "режим остат"], field: "stockMode", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["размер", "size"], field: "size", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["цвет", "color"], field: "color", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["vendor article", "артикул поставщика", "supplier article"], field: "article", requirement: "optional", hint: "import.hint.trim_spaces" },
  { patterns: ["skucode", "sku код", "код sku", "sku"], field: "skuCode", requirement: "required", hint: "import.hint.trim_spaces" },
  { patterns: ["артикул продав"], field: "skuCode", requirement: "required", hint: "import.hint.trim_spaces" },
  { patterns: ["баркод", "ean", "штрихкод", "barcode"], field: "barcode", requirement: "optional", hint: "import.hint.normalize_digits" },
  { patterns: ["nmid", "nm id", "номенклатур"], field: "nmId", requirement: "optional", hint: "import.hint.wb_nm_numeric" },
  { patterns: ["offer"], field: "offerId", requirement: "optional", hint: "import.hint.ozon_offer_numeric" },
  { patterns: ["заказ"], field: "orders", requirement: "optional", hint: "import.hint.integer_locale" },
  { patterns: ["выкуп"], field: "buyouts", requirement: "optional", hint: "import.hint.integer_locale" },
  { patterns: ["остаток", "stock", "fbs"], field: "stock", requirement: "optional", hint: "import.hint.non_negative_int" },
  { patterns: ["показ"], field: "impressions", requirement: "optional", hint: "import.hint.strip_thousands_sep" },
  { patterns: ["переход", "клик"], field: "clicks", requirement: "optional", hint: "import.hint.strip_thousands_sep" },
  { patterns: ["ctr"], field: "ctr", requirement: "optional", hint: "import.hint.percent_to_ratio" },
  { patterns: ["цена", "price"], field: "price", requirement: "optional", hint: "import.hint.currency_strip" },
  { patterns: ["склад", "warehouse"], field: "warehouse", requirement: "optional", hint: "import.hint.canonical_wh" },
  { patterns: ["выручк", "revenue"], field: "revenue", requirement: "optional", hint: "import.hint.currency_strip" },
  { patterns: ["расход", "spend"], field: "spend", requirement: "optional", hint: "import.hint.currency_strip" },
  { patterns: ["конверс"], field: "conversionRate", requirement: "optional", hint: "import.hint.percent_to_ratio" },
  { patterns: ["коридор", "corridor"], field: "corridor", requirement: "optional", hint: "import.hint.slug_optional" },
  { patterns: ["job", "batch"], field: "printJobId", requirement: "optional", hint: "import.hint.opaque_id" },
  { patterns: ["queue", "depth"], field: "queueDepth", requirement: "optional", hint: "import.hint.non_negative_int" },
  { patterns: ["shift"], field: "shiftHours", requirement: "optional", hint: "import.hint.decimal_hours" },
  { patterns: ["назван", "name", "title", "предмет", "наимен"], field: "title", requirement: "optional", hint: "import.hint.text_trim" },
  { patterns: ["маркетплейс", "marketplace"], field: "marketplace", requirement: "optional", hint: "import.hint.enum_wb_ozon" },
];

function matchField(header: string): { field: NormalizedTargetFieldId; requirement: MappingRequirement; hint: string } | null {
  const h = header.toLowerCase();
  for (const s of SYNONYMS) {
    for (const p of s.patterns) {
      if (h.includes(p)) return { field: s.field, requirement: s.requirement, hint: s.hint };
    }
  }
  return null;
}

/** Heuristic column → target mapping for sample previews (not ML). */
export function suggestMappingsForColumns(
  columns: readonly string[],
  kind: MarketplaceImportKind,
): ColumnMappingRule[] {
  const def = schemaFor(kind);
  const out: ColumnMappingRule[] = [];

  for (const col of columns) {
    const m = matchField(col);
    if (!m) continue;
    const requirement: MappingRequirement = def.requiredTargets.includes(m.field) ? "required" : "optional";
    const confidence = Math.min(100, 55 + (col.length > 2 ? 15 : 0) + (m.field === "skuCode" ? 20 : 0));
    out.push({
      sourceColumn: col,
      targetField: m.field,
      confidence,
      requirement,
      transformHint: m.hint,
      validationStatus: "pending",
    });
  }

  const seen = new Set<NormalizedTargetFieldId>();
  return out.filter((r) => {
    if (seen.has(r.targetField)) return false;
    seen.add(r.targetField);
    return true;
  });
}

export function unmappedSourceColumns(columns: readonly string[], mapped: readonly ColumnMappingRule[]): string[] {
  const src = new Set(mapped.map((m) => m.sourceColumn));
  return columns.filter((c) => !src.has(c));
}
