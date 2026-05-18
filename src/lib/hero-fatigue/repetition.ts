import type { CompetitorSerpItem } from "../competitor-serp/types";

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-zа-яё0-9]+/i)
    .map((x) => x.trim())
    .filter((x) => x.length > 2);
}

/** Bigram repetition across pasted rows — semantic exhaustion proxy (text only). */
export function semanticRepetitionScore(items: readonly CompetitorSerpItem[]): number {
  if (items.length < 4) return 22;
  const bigrams = new Map<string, number>();
  for (const it of items) {
    const blob = `${it.heroImageNote} ${it.visualPattern}`.toLowerCase();
    const toks = tokens(blob);
    for (let i = 0; i < toks.length - 1; i++) {
      const bg = `${toks[i]} ${toks[i + 1]}`;
      bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
    }
  }
  let max = 0;
  for (const c of bigrams.values()) if (c > max) max = c;
  const n = items.length;
  const share = max / Math.max(1, n);
  return Math.round(Math.min(100, share * 55 + max * 3));
}

export function colorRepetitionSharePct(items: readonly CompetitorSerpItem[]): number {
  if (!items.length) return 0;
  const counts = new Map<string, number>();
  for (const it of items) {
    const k = it.colorDominance.trim().toLowerCase();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let top = 0;
  for (const c of counts.values()) if (c > top) top = c;
  return Math.round((100 * top) / items.length);
}

export function modelRepetitionSharePct(items: readonly CompetitorSerpItem[]): number {
  if (!items.length) return 0;
  let yes = 0;
  for (const it of items) {
    if (/yes|да|есть|model|модель|lifestyle|studio/i.test(it.modelPresence.trim())) yes += 1;
  }
  return Math.round((100 * yes) / items.length);
}

export function printLabelRepetitionSharePct(items: readonly CompetitorSerpItem[]): number {
  if (!items.length) return 0;
  const counts = new Map<string, number>();
  for (const it of items) {
    const k = it.printReadability.trim().toLowerCase();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let top = 0;
  for (const c of counts.values()) if (c > top) top = c;
  return Math.round((100 * top) / items.length);
}
