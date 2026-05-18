import { newSerpSnapshotId, serpItemId } from "./ids";
import type { CompetitorSerpItem, CompetitorSerpSnapshot } from "./types";

const HEADER_SYNONYMS: Record<string, keyof ManualSerpRow> = {
  position: "position",
  pos: "position",
  "#": "position",
  нп: "position",
  место: "position",
  order: "position",
  title: "title",
  название: "title",
  name: "title",
  brand: "brand",
  бренд: "brand",
  price: "price",
  цена: "price",
  rating: "rating",
  рейтинг: "rating",
  stars: "rating",
  reviews: "reviewCount",
  отзывы: "reviewCount",
  review: "reviewCount",
  "review count": "reviewCount",
  "hero note": "heroImageNote",
  "hero notes": "heroImageNote",
  hero: "heroImageNote",
  герой: "heroImageNote",
  "hero image": "heroImageNote",
  "visual pattern": "visualPattern",
  pattern: "visualPattern",
  визуал: "visualPattern",
  паттерн: "visualPattern",
  color: "colorDominance",
  цвет: "colorDominance",
  model: "modelPresence",
  модель: "modelPresence",
  "print readability": "printReadability",
  print: "printReadability",
  читаемость: "printReadability",
  "premium level": "perceivedPremiumLevel",
  premium: "perceivedPremiumLevel",
  премиум: "perceivedPremiumLevel",
  diff: "differentiationNote",
  differentiation: "differentiationNote",
  note: "differentiationNote",
  заметка: "differentiationNote",
};

type ManualSerpRow = {
  position: string;
  title: string;
  brand: string;
  price: string;
  rating: string;
  reviewCount: string;
  heroImageNote: string;
  visualPattern: string;
  colorDominance: string;
  modelPresence: string;
  printReadability: string;
  perceivedPremiumLevel: string;
  differentiationNote: string;
};

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");
}

function mapHeader(cell: string): keyof ManualSerpRow | null {
  const k = normHeader(cell);
  return HEADER_SYNONYMS[k] ?? null;
}

function splitRow(line: string): string[] {
  const t = line.trim();
  if (!t) return [];
  if (t.includes("\t")) return t.split("\t").map((c) => c.trim());
  const parts: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (!q && ch === ",") {
      parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur.trim());
  return parts;
}

export function parseMoney(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "").replace(/\s/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let norm = s;
  if (lastComma > lastDot) norm = s.replace(/\./g, "").replace(",", ".");
  else norm = s.replace(/,/g, "");
  const n = Number.parseFloat(norm);
  return Number.isFinite(n) ? n : null;
}

export function parseRating(raw: string): number | null {
  const m = raw.replace(",", ".").match(/(\d+(\.\d+)?)/);
  if (!m) return null;
  const n = Number.parseFloat(m[1]!);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(0, n));
}

export function parseReviewCount(raw: string): number | null {
  const d = raw.replace(/\s/g, "").replace(/[^\d]/g, "");
  if (!d) return null;
  const n = Number.parseInt(d, 10);
  return Number.isFinite(n) ? n : null;
}

/** Parse header + data rows from TSV/CSV pasted from spreadsheet or marketplace notes. */
export function parseSerpTable(
  text: string,
  query: string,
  marketplace: string,
): { snapshot: CompetitorSerpSnapshot; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    errors.push("need_header_and_rows");
    return {
      snapshot: {
        id: newSerpSnapshotId(),
        query: query.trim(),
        marketplace: marketplace.trim() || "unknown",
        capturedAt: Date.now(),
        source: "manual",
        items: [],
      },
      errors,
    };
  }

  const headerCells = splitRow(lines[0]!);
  const colMap: (keyof ManualSerpRow | null)[] = headerCells.map((h) => mapHeader(h));

  if (!colMap.some(Boolean)) {
    errors.push("no_recognized_headers");
  }

  const snapshotId = newSerpSnapshotId();
  const items: CompetitorSerpItem[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = splitRow(lines[r]!);
    const row: Partial<ManualSerpRow> = {};
    for (let c = 0; c < colMap.length; c++) {
      const key = colMap[c];
      if (!key) continue;
      row[key] = cells[c] ?? "";
    }
    const title = (row.title ?? "").trim();
    if (!title) continue;

    const posRaw = (row.position ?? String(r)).trim();
    const position = Number.parseInt(posRaw.replace(/\D/g, "") || String(r), 10) || r;

    const id = serpItemId(snapshotId, position, title);
    items.push({
      id,
      position,
      title,
      brand: (row.brand ?? "").trim(),
      price: parseMoney(row.price ?? ""),
      rating: parseRating(row.rating ?? ""),
      reviewCount: parseReviewCount(row.reviewCount ?? ""),
      heroImageNote: (row.heroImageNote ?? "").trim(),
      visualPattern: (row.visualPattern ?? "").trim(),
      colorDominance: (row.colorDominance ?? "").trim(),
      modelPresence: (row.modelPresence ?? "").trim(),
      printReadability: (row.printReadability ?? "").trim(),
      perceivedPremiumLevel: (row.perceivedPremiumLevel ?? "").trim(),
      differentiationNote: (row.differentiationNote ?? "").trim(),
    });
  }

  return {
    snapshot: {
      id: snapshotId,
      query: query.trim(),
      marketplace: (marketplace.trim() || "unknown").toLowerCase(),
      capturedAt: Date.now(),
      source: "manual",
      items,
    },
    errors,
  };
}

/**
 * Quick notes: one competitor per line — `pos | title | brand | price | ...` or tab-separated.
 * Minimum: position + title (first two fields).
 */
export function parseSerpQuickNotes(
  text: string,
  query: string,
  marketplace: string,
): { snapshot: CompetitorSerpSnapshot; errors: string[] } {
  const errors: string[] = [];
  const snapshotId = newSerpSnapshotId();
  const items: CompetitorSerpItem[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let row = 0;
  for (const line of lines) {
    const parts = line.includes("|") ? line.split("|").map((x) => x.trim()) : splitRow(line);
    if (parts.length < 2) continue;
    row += 1;
    const position = Number.parseInt(parts[0]!.replace(/\D/g, "") || String(row), 10) || row;
    const title = parts[1] ?? "";
    if (!title) continue;
    const id = serpItemId(snapshotId, position, title);
    items.push({
      id,
      position,
      title,
      brand: parts[2] ?? "",
      price: parts[3] ? parseMoney(parts[3]!) : null,
      rating: parts[4] ? parseRating(parts[4]!) : null,
      reviewCount: parts[5] ? parseReviewCount(parts[5]!) : null,
      heroImageNote: parts[6] ?? "",
      visualPattern: parts[7] ?? "",
      colorDominance: parts[8] ?? "",
      modelPresence: parts[9] ?? "",
      printReadability: parts[10] ?? "",
      perceivedPremiumLevel: parts[11] ?? "",
      differentiationNote: parts[12] ?? "",
    });
  }

  if (items.length === 0) errors.push("quick_notes_empty");

  return {
    snapshot: {
      id: snapshotId,
      query: query.trim(),
      marketplace: (marketplace.trim() || "unknown").toLowerCase(),
      capturedAt: Date.now(),
      source: "manual",
      items,
    },
    errors,
  };
}
