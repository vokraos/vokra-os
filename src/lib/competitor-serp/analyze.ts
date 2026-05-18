import type {
  CompetitorSerpItem,
  SerpCrossModuleHint,
  SerpDerivedAnalysis,
  SerpInsight,
  SerpPatternShare,
} from "./types";

/** Exported for gap analysis — same heuristics as SERP rows. */
export function premiumScoreFromLabel(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const n = Number.parseFloat(s.replace(",", "."));
  if (Number.isFinite(n) && n >= 0 && n <= 100) return Math.round(n);
  if (/high|высок|премиум|luxury|premium/i.test(s)) return 78;
  if (/mid|средн|medium|average/i.test(s)) return 48;
  if (/low|низк|budget|эконом/i.test(s)) return 24;
  return null;
}

/** Exported for gap analysis — same heuristics as SERP rows. */
export function printScoreFromLabel(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const n = Number.parseFloat(s.replace(",", "."));
  if (Number.isFinite(n) && n >= 0 && n <= 100) return Math.round(n);
  if (/bad|poor|низк|плох|illegible|нечитаем/i.test(s)) return 28;
  if (/mid|средн|ok|норм/i.test(s)) return 52;
  if (/good|high|отлич|читаем|clear/i.test(s)) return 82;
  return null;
}

function hasModelSignal(raw: string): boolean {
  return /yes|да|есть|model|модель|lifestyle|studio\s*model/i.test(raw.trim());
}

function aggregateShares(rows: string[], max = 8): SerpPatternShare[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const parts = r
      .split(/[,;/|]+/)
      .map((x) => x.trim().toLowerCase())
      .filter((x) => x.length > 1);
    if (parts.length === 0 && r.trim()) {
      const k = r.trim().toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    for (const p of parts) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  const total = rows.filter((x) => x.trim()).length || 1;
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, sharePct: Math.round((100 * count) / total) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max);
}

function titleTokenOverlap(items: readonly CompetitorSerpItem[]): number {
  const slice = items.length > 32 ? items.slice(0, 32) : [...items];
  if (slice.length < 2) return 0;
  const sets = slice.map((it) => new Set(it.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)));
  let simSum = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const a = sets[i]!;
      const b = sets[j]!;
      let inter = 0;
      for (const x of a) if (b.has(x)) inter += 1;
      const u = a.size + b.size - inter;
      pairs += 1;
      simSum += u === 0 ? 0 : inter / u;
    }
  }
  return pairs === 0 ? 0 : simSum / pairs;
}

export function analyzeSerpItems(items: readonly CompetitorSerpItem[]): {
  analysis: SerpDerivedAnalysis;
  insights: SerpInsight[];
  crossModuleHints: SerpCrossModuleHint[];
} {
  const n = items.length;
  const prices = items.map((i) => i.price).filter((p): p is number => p != null && Number.isFinite(p));
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
  let low: number | null = null;
  let high: number | null = null;
  if (prices.length) {
    const sorted = [...prices].sort((a, b) => a - b);
    low = sorted[Math.floor(0.15 * (sorted.length - 1))] ?? sorted[0]!;
    high = sorted[Math.floor(0.85 * (sorted.length - 1))] ?? sorted[sorted.length - 1]!;
  }
  const mid = low != null && high != null ? Math.round((low + high) / 2) : avgPrice;

  const patterns = aggregateShares(items.map((i) => i.visualPattern));
  const colors = aggregateShares(items.map((i) => i.colorDominance));

  let modelYes = 0;
  const printScores: number[] = [];
  const premScores: number[] = [];
  let weak = 0;
  let strong = 0;

  for (const it of items) {
    if (hasModelSignal(it.modelPresence)) modelYes += 1;
    const ps = printScoreFromLabel(it.printReadability);
    if (ps != null) printScores.push(ps);
    const pr = premiumScoreFromLabel(it.perceivedPremiumLevel);
    if (pr != null) premScores.push(pr);

    const pGuess = pr ?? premiumScoreFromLabel(it.heroImageNote) ?? 45;
    const printGuess = ps ?? printScoreFromLabel(it.heroImageNote) ?? 50;
    if (pGuess < 42 && (printGuess < 48 || /flat|busy|шум|простой/i.test(it.heroImageNote))) weak += 1;
    if (pGuess > 68 || printGuess > 72) strong += 1;
  }

  const modelShare = n ? Math.round((100 * modelYes) / n) : 0;
  const modelUsageSummaryKey =
    modelShare >= 55
      ? "serp.model.summary_high"
      : modelShare <= 18
        ? "serp.model.summary_low"
        : "serp.model.summary_mid";

  const printBuckets = [
    { bucket: "low", count: 0, sharePct: 0 },
    { bucket: "mid", count: 0, sharePct: 0 },
    { bucket: "high", count: 0, sharePct: 0 },
  ];
  for (const it of items) {
    const sc = printScoreFromLabel(it.printReadability) ?? printScoreFromLabel(it.heroImageNote);
    const v = sc == null ? 1 : sc < 42 ? 0 : sc < 68 ? 1 : 2;
    printBuckets[v]!.count += 1;
  }
  for (const b of printBuckets) b.sharePct = n ? Math.round((100 * b.count) / n) : 0;

  const premIdx =
    premScores.length > 0
      ? Math.round(premScores.reduce((a, b) => a + b, 0) / premScores.length)
      : Math.round(items.reduce((acc, it) => acc + (premiumScoreFromLabel(it.perceivedPremiumLevel) ?? 46), 0) / Math.max(1, n));

  const titleOverlap = titleTokenOverlap(items);
  const patternConcentration = patterns[0]?.sharePct ?? 0;
  const saturationSignal = Math.min(
    100,
    Math.round(n * 2.2 + titleOverlap * 38 + patternConcentration * 0.35),
  );

  const gapKeys: string[] = [];
  if (printBuckets[0]!.sharePct >= 45) gapKeys.push("serp.gap.print_readability");
  if (premIdx < 42) gapKeys.push("serp.gap.premium_ceiling_low");
  if (modelShare >= 50 && /front|фронт|straight/i.test(items.map((i) => i.heroImageNote).join(" ")))
    gapKeys.push("serp.gap.hero_frontal_cluster");
  if (patternConcentration >= 42) gapKeys.push("serp.gap.visual_pattern_cluster");
  if (weak >= Math.ceil(n * 0.35)) gapKeys.push("serp.gap.weak_visual_pocket");
  if (gapKeys.length === 0) gapKeys.push("serp.gap.none_explicit");

  const weakVisualCompetitorSharePct = n ? Math.round((100 * weak) / n) : 0;
  const strongVisualCompetitorSharePct = n ? Math.round((100 * strong) / n) : 0;

  const analysis: SerpDerivedAnalysis = {
    itemCount: n,
    averagePrice: avgPrice,
    priceBand: { low, high, mid },
    dominantVisualPatterns: patterns,
    dominantColors: colors,
    modelUsageSummaryKey: modelUsageSummaryKey,
    modelUsageVars: { pct: String(modelShare) },
    printReadabilityBuckets: printBuckets,
    premiumPerceptionIndex: premIdx,
    premiumLowSharePct: n
      ? Math.round((100 * items.filter((i) => (premiumScoreFromLabel(i.perceivedPremiumLevel) ?? 50) < 38).length) / n)
      : 0,
    premiumHighSharePct: n
      ? Math.round((100 * items.filter((i) => (premiumScoreFromLabel(i.perceivedPremiumLevel) ?? 0) > 72).length) / n)
      : 0,
    saturationSignal,
    differentiationGapKeys: gapKeys,
    weakVisualCompetitorSharePct,
    strongVisualCompetitorSharePct,
  };

  const insights: SerpInsight[] = [];
  let hid = 0;
  const push = (messageKey: string, vars: Record<string, string>, severity: number) => {
    hid += 1;
    insights.push({ id: `ins_${hid}`, messageKey, vars, severity });
  };

  if (modelShare >= 48 && /front|фронт|straight|head.?on/i.test(items.map((i) => i.heroImageNote).join(" "))) {
    push("serp.insight.frontal_majority", { pct: String(modelShare) }, 62);
  }
  if (printBuckets[0]!.sharePct >= 40) {
    push("serp.insight.print_poor_share", { pct: String(printBuckets[0]!.sharePct) }, 68);
  }
  if (premIdx < 44) {
    push("serp.insight.premium_low_field", { idx: String(premIdx) }, 54);
  }
  if (/dark|cinematic|ночн|контраст/i.test(items.map((i) => i.heroImageNote + i.visualPattern).join(" ")) === false && premIdx > 38) {
    push("serp.insight.dark_cinematic_window", {}, 44);
  }
  if (avgPrice != null && premIdx > 58) {
    push("serp.insight.price_above_need_proof", { price: String(avgPrice) }, 58);
  }
  if (weakVisualCompetitorSharePct >= 30) {
    push("serp.insight.weak_visual_pocket", { pct: String(weakVisualCompetitorSharePct) }, 50);
  }

  const crossModuleHints: SerpCrossModuleHint[] = [
    {
      nav: "visualStrategy",
      messageKey: "serp.hint.openVisualStrategy",
      vars: {},
    },
    {
      nav: "promptComposer",
      messageKey: "serp.hint.openPromptComposer",
      vars: {},
      suggestedHeroArch:
        /flat|фронт|front/i.test(items.map((i) => i.heroImageNote).join(" "))
          ? "cinematic_movement_hero"
          : "clean_marketplace_hero",
    },
    { nav: "collectionBuilder", messageKey: "serp.hint.openCollectionBuilder", vars: {} },
    { nav: "assortmentActions", messageKey: "serp.hint.openAssortmentActions", vars: {} },
  ];

  if (printBuckets[0]!.sharePct >= 35) {
    crossModuleHints.unshift({
      nav: "visualProduction",
      messageKey: "serp.hint.visualRefresh",
      vars: { pct: String(printBuckets[0]!.sharePct) },
    });
  }

  return { analysis, insights: insights.sort((a, b) => b.severity - a.severity), crossModuleHints };
}
