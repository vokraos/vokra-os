import { mix } from "../cognitive-depth/sku-empire";
import type { MarketRegime } from "../cognitive-os/types";
import type { DecisionEngineState } from "../cognitive-os/types";
import type { CognitiveSynthesisState } from "../cognitive-os/types";
import type { ExecutionOrchestrationSnapshot, ExecutionRouteKind } from "../execution-orchestrator/types";
import { buildMarketplaceEntitySnapshot } from "../entity-core/snapshot";
import type { CorridorEntity, MarketplaceEntitySnapshot } from "../entity-core/types";
import type { TemporalPhase } from "../temporal-strategy/types";
import type {
  CollectionEntity,
  CollectionKindId,
  HeroProductDef,
  ProductionFitBlock,
  SkuCluster,
  StrategicCollectionRole,
} from "./types";

export type CollectionDeriveInput = {
  locale: "ru" | "en";
  seed: number;
  tension01: number;
  pressure01: number;
  regime: MarketRegime;
  synthesis: Pick<
    CognitiveSynthesisState,
    "launchReadiness" | "pressureIndex" | "topOpportunityRu" | "dominantClusterRu" | "activeMissionRu" | "memoryEchoRu"
  >;
  decision: Pick<
    DecisionEngineState,
    "riskProductionOverload" | "riskBrandDilution" | "riskCtrFatigue" | "riskSaturationProb" | "rank"
  >;
  orchestration: Pick<
    ExecutionOrchestrationSnapshot,
    "executionConfidence" | "operationalDrag" | "primaryRouteId" | "routes" | "nextBestActionRu" | "resourcePressure"
  >;
  temporalPhase: TemporalPhase;
  visualFatigue: number;
  seoSaturation: number;
  initiativeHeadline: string;
  marketWeatherId: string;
  weather3Id: string;
  brandDnaSurfaceActive: boolean;
  fabricEdgeCount: number | null;
  fabricConflictCount: number | null;
  /** Workshop: shift corridor/kind/SKU cluster picks (0 = default builder row). */
  candidateSalt?: number;
};

function pick<T>(locale: "ru" | "en", pair: { ru: T; en: T }): T {
  return locale === "en" ? pair.en : pair.ru;
}

import { clip } from "../math";

const KINDS: CollectionKindId[] = [
  "fast_dtf_test_capsule",
  "premium_capsule",
  "seasonal_drop",
  "gift_collection",
  "evergreen_basics_line",
  "trend_capture_wave",
  "visual_refresh_collection",
  "fbo_scale_collection",
  "brand_building_capsule",
];

function routeKindBias(kind: ExecutionRouteKind | undefined): CollectionKindId | null {
  if (!kind) return null;
  if (kind === "premium_capsule") return "premium_capsule";
  if (kind === "fast_dtf_test") return "fast_dtf_test_capsule";
  if (kind === "visual_refresh") return "visual_refresh_collection";
  if (kind === "fbo_scale") return "fbo_scale_collection";
  if (kind === "brand_correction") return "brand_building_capsule";
  if (kind === "seo_reinforcement") return "trend_capture_wave";
  if (kind === "production_stabilization") return "evergreen_basics_line";
  return null;
}

function corridorScore(c: CorridorEntity, regime: MarketRegime): number {
  let s = c.momentum01 * (1 - c.pressure01 * 0.35) + c.stability01 * 0.12;
  if (c.lifecycle === "recovering" || c.lifecycle === "cooling") s += 0.14;
  if (c.lifecycle === "overloaded" || c.lifecycle === "blocked") s -= 0.12;
  if (regime === "opportunity") s += c.momentum01 * 0.18;
  if (regime === "production_load") s -= c.pressure01 * 0.1;
  if (c.terrain === "premium_altitude") s += 0.06;
  if (c.terrain === "semantic_deadzone") s -= 0.08;
  return s;
}

function pickCorridor(snapshot: MarketplaceEntitySnapshot, seed: number, regime: MarketRegime): CorridorEntity {
  const list = [...snapshot.corridors.values()];
  let best = list[0]!;
  let bestS = -1;
  for (const c of list) {
    const sc = corridorScore(c, regime) + (mix(seed, c.id.length + 3) % 7) * 0.003;
    if (sc > bestS) {
      bestS = sc;
      best = c;
    }
  }
  return best;
}

function strategicRoleFor(kind: CollectionKindId, regime: MarketRegime): StrategicCollectionRole {
  if (kind === "brand_building_capsule") return "brand_tightening";
  if (kind === "fbo_scale_collection") return "volume_scale";
  if (kind === "trend_capture_wave") return "trend_arbitrage";
  if (kind === "visual_refresh_collection" || kind === "seasonal_drop") return "shelf_defense";
  if (kind === "fast_dtf_test_capsule" || regime === "production_load") return "production_sync";
  if (kind === "premium_capsule") return "margin_expansion";
  if (regime === "saturation") return "launch_recovery";
  return "margin_expansion";
}

function kindFromInput(input: CollectionDeriveInput, primaryKind: ExecutionRouteKind | undefined): CollectionKindId {
  const salt = input.candidateSalt ?? 0;
  const biased = routeKindBias(primaryKind);
  if (biased && mix(input.seed + salt * 401, 404) % 5 !== 0) return biased;
  const idx = mix(input.seed + salt * 401, 900) % KINDS.length;
  let k = KINDS[idx]!;
  if (input.regime === "production_load" && mix(input.seed + salt * 401, 2) % 2 === 0) k = "fast_dtf_test_capsule";
  if (input.orchestration.resourcePressure.fboReadiness > 68 && primaryKind === "fbo_scale") k = "fbo_scale_collection";
  if (input.visualFatigue > 52 && mix(input.seed + salt * 401, 8) % 3 === 0) k = "visual_refresh_collection";
  return k;
}

function collectionName(locale: "ru" | "en", kind: CollectionKindId, corridorKey: string): string {
  const corridorShort = corridorKey.replace("depth.topo.", "C");
  const names: Record<CollectionKindId, { ru: string; en: string }> = {
    fast_dtf_test_capsule: {
      ru: `Быстрый DTF-тест · ${corridorShort}`,
      en: `Fast DTF test capsule · ${corridorShort}`,
    },
    premium_capsule: {
      ru: `Премиальная капсула · ${corridorShort}`,
      en: `Premium capsule · ${corridorShort}`,
    },
    seasonal_drop: {
      ru: `Сезонный дроп · ${corridorShort}`,
      en: `Seasonal drop · ${corridorShort}`,
    },
    gift_collection: {
      ru: `Подарочная линейка · ${corridorShort}`,
      en: `Gift collection · ${corridorShort}`,
    },
    evergreen_basics_line: {
      ru: `Evergreen basics · ${corridorShort}`,
      en: `Evergreen basics line · ${corridorShort}`,
    },
    trend_capture_wave: {
      ru: `Волна захвата тренда · ${corridorShort}`,
      en: `Trend capture wave · ${corridorShort}`,
    },
    visual_refresh_collection: {
      ru: `Визуальный refresh · ${corridorShort}`,
      en: `Visual refresh collection · ${corridorShort}`,
    },
    fbo_scale_collection: {
      ru: `FBO-масштаб · ${corridorShort}`,
      en: `FBO scale collection · ${corridorShort}`,
    },
    brand_building_capsule: {
      ru: `Brand-build капсула · ${corridorShort}`,
      en: `Brand-building capsule · ${corridorShort}`,
    },
  };
  return pick(locale, names[kind]);
}

function conceptLine(locale: "ru" | "en", input: CollectionDeriveInput, corridor: CorridorEntity, kind: CollectionKindId): string {
  const rp = input.orchestration.resourcePressure;
  const lr = input.synthesis.launchReadiness;
  const en =
    `${kind.replace(/_/g, " ")} cluster-first: corridor ${corridor.nameKey} · launch readiness ${lr}% · DTF queue ${rp.dtfQueue}% · ` +
    `weather ${input.weather3Id}. Capsule stays inside one corridor until test wave proves shelf + margin.`;
  const ru =
    `Кластерно в одном коридоре (${corridor.nameKey}): готовность запуска ${lr}% · DTF ${rp.dtfQueue}% · погода ${input.weather3Id}. ` +
    `Капсула не расползается по long-tail до зелёной тест-волны.`;
  return clip(pick(locale, { ru, en }), 420);
}

function opportunityReason(locale: "ru" | "en", input: CollectionDeriveInput, corridor: CorridorEntity, kind: CollectionKindId): string {
  const en = [
    `${corridor.nameKey}: lifecycle ${corridor.lifecycle}, terrain ${corridor.terrain}. `,
    `Primary OS route aligns with ${kind}. `,
    `Marketplace: ${input.synthesis.topOpportunityRu || input.synthesis.activeMissionRu || "stable shelf window"}. `,
    `Production: DTF ${input.orchestration.resourcePressure.dtfQueue}%, packaging ${input.orchestration.resourcePressure.packagingBottleneck}%. `,
    input.fabricConflictCount != null && input.fabricConflictCount > 1
      ? `Signal fabric shows ${input.fabricConflictCount} conflicts — capsule reduces overlap surface.`
      : "Signal fabric stable — capsule can own one semantic lane.",
  ].join("");
  const ru = [
    `${corridor.nameKey}: жизненный цикл ${corridor.lifecycle}, рельеф ${corridor.terrain}. `,
    `Совпадает с маршрутом OS и типом «${kind}». `,
    `Витрина: ${input.synthesis.topOpportunityRu || input.synthesis.activeMissionRu || "окно полки стабильно"}. `,
    `Производство: DTF ${input.orchestration.resourcePressure.dtfQueue}%, упаковка ${input.orchestration.resourcePressure.packagingBottleneck}%. `,
    input.fabricConflictCount != null && input.fabricConflictCount > 1
      ? `Сигнальная сеть: ${input.fabricConflictCount} конфликта — капсула сужает поверхность пересечений.`
      : "Сигнальная сеть ровная — капсула может занять одну семантическую полосу.",
  ].join("");
  return clip(pick(locale, { ru, en }), 520);
}

function skuClusters(
  locale: "ru" | "en",
  seed: number,
  salt: number,
  corridor: CorridorEntity,
  kind: CollectionKindId,
): SkuCluster[] {
  const s0 = seed + salt * 29;
  const h = 1 + (mix(s0, 11) % 3);
  const sup = 4 + (mix(s0, 12) % 9);
  const amp = 2 + (mix(s0, 13) % 4);
  const arch = 1 + (mix(s0, 14) % 3);
  const fbo = kind === "fbo_scale_collection" ? 6 + (mix(s0, 15) % 4) : mix(s0, 16) % 4;
  const refr = kind === "visual_refresh_collection" ? 5 + (mix(s0, 17) % 5) : 2 + (mix(s0, 18) % 3);
  const skuMass = corridor.skuCount;
  return [
    {
      role: "hero",
      label: pick(locale, { ru: "Hero", en: "Hero" }),
      count: h,
      note: pick(locale, {
        ru: `Жёстко ${h} стиля: весь трафик и визуал. Охват ~${Math.min(120 + mix(seed, 20) % 80, Math.floor(skuMass / 40))} связанных SKU в коридоре.`,
        en: `${h} locked hero styles; all traffic + visuals. Touches ~${Math.min(120 + mix(seed, 20) % 80, Math.floor(skuMass / 40))} linked SKUs in corridor.`,
      }),
    },
    {
      role: "support",
      label: pick(locale, { ru: "Support", en: "Support" }),
      count: sup,
      note: pick(locale, {
        ru: `${sup} кластеров цвета/размера — без новых принтов. Держат конверсию hero.`,
        en: `${sup} color/size clusters — no new prints; conversion support for heroes.`,
      }),
    },
    {
      role: "amplifier",
      label: pick(locale, { ru: "Amplifier", en: "Amplifier" }),
      count: amp,
      note: pick(locale, {
        ru: `${amp} SKU для промо и полки «рядом с hero» — не конкурируют по семантике.`,
        en: `${amp} SKUs for promos / shelf adjacency — non-competing semantics.`,
      }),
    },
    {
      role: "archive",
      label: pick(locale, { ru: "Archive / hold", en: "Archive / hold" }),
      count: arch,
      note: pick(locale, {
        ru: `${arch} позиции в hold: не трогать визуал до стабилизации волны.`,
        en: `${arch} SKUs on hold — no visual touch until wave stabilizes.`,
      }),
    },
    {
      role: "fbo_candidate",
      label: pick(locale, { ru: "FBO-кандидаты", en: "FBO candidates" }),
      count: fbo,
      note: pick(locale, {
        ru: fbo ? `${fbo} SKU после зелёного теста и упаковки.` : "FBO не в приоритете этой капсулы.",
        en: fbo ? `${fbo} SKUs after green test + packaging readiness.` : "FBO not prioritized for this capsule.",
      }),
    },
    {
      role: "refresh_candidate",
      label: pick(locale, { ru: "Refresh-кандидаты", en: "Refresh candidates" }),
      count: refr,
      note: pick(locale, {
        ru: `${refr} карточек в очереди на hero-кадр без смены SKU.`,
        en: `${refr} cards queued for hero shot refresh without SKU change.`,
      }),
    },
  ];
}

function heroDefs(
  locale: "ru" | "en",
  seed: number,
  salt: number,
  snapshot: MarketplaceEntitySnapshot,
  corridor: CorridorEntity,
  h: number,
): HeroProductDef[] {
  const heroes = [...snapshot.heroes.values()].filter((x) => x.corridorId === corridor.id);
  const out: HeroProductDef[] = [];
  for (let i = 0; i < h; i++) {
    const he = heroes[i];
    const sku = he ? snapshot.skus.get(he.skuId) : undefined;
    const id = sku?.wbStyleId ?? `WB-${mix(seed + salt * 29 + i, 30) % 900000 + 100000}`;
    out.push({
      title: pick(locale, { ru: `Hero lane ${i + 1} · ${id}`, en: `Hero lane ${i + 1} · ${id}` }),
      note: pick(locale, {
        ru: `Карточка тянет кластер; обновлять главное фото первой. Коридор ${corridor.nameKey}.`,
        en: `Card pulls cluster; refresh main photo first. Corridor ${corridor.nameKey}.`,
      }),
    });
  }
  return out;
}

function visualBlock(locale: "ru" | "en", input: CollectionDeriveInput, kind: CollectionKindId): CollectionEntity["visualDirection"] {
  void input.brandDnaSurfaceActive;
  return {
    mood: pick(locale, {
      ru: kind.includes("premium") ? "Плотный premium-calm, без шумного стрита." : "Чистая витрина, читаемый силуэт.",
      en: kind.includes("premium") ? "Tight premium calm — not noisy street." : "Clean shelf, readable silhouette.",
    }),
    printDirection: pick(locale, {
      ru: "Один семейный мотив на hero + вариации масштаба; support без новых сюжетов.",
      en: "One family motif on heroes + scale variants; support clusters stay motif-free.",
    }),
    forbiddenPatterns: pick(locale, {
      ru: ["Дубли hero-кадра между соседними SKU", "Случайный микс стилей в одной волне", "Тяжёлый многослойный DTF на support"],
      en: ["Duplicate hero shots on adjacent SKUs", "Random style mix in one wave", "Heavy multi-layer DTF on support"],
    }),
    heroCardDirection: pick(locale, {
      ru: "Крупный продукт 78–85% кадра; фон холодный нейтральный; без клипарта.",
      en: "Product 78–85% frame; cool neutral backdrop; no clipart.",
    }),
    modelBackgroundStyle: pick(locale, {
      ru: "Модель опционально только на hero; support — flat lay / mannequin.",
      en: "Models optional on heroes only; support = flat lay / mannequin.",
    }),
    marketplaceMainPhotoLogic: pick(locale, {
      ru: "WB: первый кадр = узнаваемость; Ozon: второй кадр lifestyle только если герой читается.",
      en: "WB: frame 1 = recognition; Ozon: lifestyle frame 2 only if hero still reads.",
    }),
    reelsDirection: pick(locale, {
      ru: "3–5 сек: материал + силуэт; без сюжетного шума; CTA мягкий.",
      en: "3–5s: material + silhouette; no story noise; soft CTA.",
    }),
  };
}

function productionBlock(locale: "ru" | "en", input: CollectionDeriveInput, kind: CollectionKindId): ProductionFitBlock {
  const rp = input.orchestration.resourcePressure;
  const overload = input.decision.riskProductionOverload;
  const packHi = rp.packagingBottleneck > 58;
  const dtfHi = rp.dtfQueue > 62;
  const warn =
    packHi && kind === "fbo_scale_collection"
      ? pick(locale, {
          ru: "Упаковка уже в напряжении — FBO-волна этой капсулы операционно опасна без паузы 5–7 дней.",
          en: "Packaging already tight — FBO wave is dangerous without a 5–7 day pause.",
        })
      : dtfHi && (kind === "premium_capsule" || kind === "trend_capture_wave")
        ? pick(locale, {
            ru: "Красивый концепт, но DTF-очередь высокая — упростить принт или сдвинуть волну.",
            en: "Strong concept but DTF queue is hot — simplify print or shift the wave.",
          })
        : null;
  return {
    dtfSuitability: pick(locale, {
      ru: `${kind.includes("fast") || kind.includes("test") ? "Высокая" : dtfHi ? "Средняя (очередь)" : "Высокая"} — DTF-first.`,
      en: `${kind.includes("fast") || kind.includes("test") ? "High" : dtfHi ? "Medium (queue)" : "High"} — DTF-first.`,
    }),
    printComplexity: pick(locale, {
      ru: kind.includes("premium") ? "Умеренная (2–3 слоя max на hero)" : "Низкая на support; hero — один мотив.",
      en: kind.includes("premium") ? "Moderate (2–3 layers max on heroes)" : "Low on support; single motif on heroes.",
    }),
    skuComplexity: pick(locale, {
      ru: `SKU-сложность ${rp.skuComplexity}% — держать кластеры, не расползаться в long-tail.`,
      en: `SKU complexity ${rp.skuComplexity}% — stay clustered, avoid long-tail sprawl.`,
    }),
    packagingPressure: pick(locale, {
      ru: `Упаковка ${rp.packagingBottleneck}% · FBO prep ${rp.fboReadiness}%.`,
      en: `Packaging ${rp.packagingBottleneck}% · FBO prep ${rp.fboReadiness}%.`,
    }),
    fboPrepPressure: pick(locale, {
      ru: `FBO prep ${rp.fboReadiness}% — не запускать FBO до зелёного теста.`,
      en: `FBO prep ${rp.fboReadiness}% — no FBO until test wave is green.`,
    }),
    launchSpeed: pick(locale, {
      ru: `Скорость запуска: исполнение ${input.orchestration.executionConfidence}% · drag ${input.orchestration.operationalDrag}%.`,
      en: `Launch speed: execution ${input.orchestration.executionConfidence}% · drag ${input.orchestration.operationalDrag}%.`,
    }),
    productionRisk: pick(locale, {
      ru: `Риск производства ${overload}% (overload) + очередь DTF ${rp.dtfQueue}%.`,
      en: `Production risk ${overload}% (overload index) + DTF queue ${rp.dtfQueue}%.`,
    }),
    operationalWarning: warn,
  };
}

function seoBlock(locale: "ru" | "en", input: CollectionDeriveInput, corridor: CorridorEntity): CollectionEntity["seoPlan"] {
  const dom = input.synthesis.dominantClusterRu || corridor.nameKey;
  return {
    primaryCluster: pick(locale, {
      ru: `${dom} — основной кластер заголовков и первых 3 карточек.`,
      en: `${dom} — primary cluster for titles + first three cards.`,
    }),
    secondaryClusters: pick(locale, {
      ru: ["Размерный long-tail внутри коридора", "Сезонный хвост без новых ключей", "Сопутствующий цвет"],
      en: ["Sized long-tail inside corridor", "Seasonal tail without new keys", "Adjacent color intent"],
    }),
    forbiddenSemanticDrift: pick(locale, {
      ru: ["Случайные англицизмы вне кластера", "Дубли title с соседним hero", "Расширение в deadzone коридора"],
      en: ["Random anglicisms outside cluster", "Title duplicates vs adjacent hero", "Drift into corridor deadzone"],
    }),
    titleTone: pick(locale, {
      ru: "Прямой benefit + материал; без поэтики; 56–72 символа WB.",
      en: "Direct benefit + material; no poetry; 56–72 chars WB.",
    }),
    richContentAngle: pick(locale, {
      ru: "Короткий блок «материал + посадка + уход»; один CTA на волну.",
      en: "Short block: material + fit + care; one CTA per wave.",
    }),
    wbVsOzon: pick(locale, {
      ru: "WB: плотность ключей выше; Ozon: чуть шире описание, меньше повторов в title.",
      en: "WB: denser keys; Ozon: slightly wider body, fewer repeats in title.",
    }),
  };
}

function launchBlock(locale: "ru" | "en", _input: CollectionDeriveInput): CollectionEntity["launchPlan"] {
  return {
    testWave: pick(locale, {
      ru: "Сначала: малый объём hero + 30% support на одном складе; метрики CTR/конверсия 48–72ч.",
      en: "First: small hero volume + 30% support on one stock point; CTR/conv 48–72h.",
    }),
    refreshWave: pick(locale, {
      ru: "Затем: hero-фото + title polish; без новых SKU.",
      en: "Then: hero shots + title polish; no new SKUs.",
    }),
    amplificationWave: pick(locale, {
      ru: "Потом: промо только на amplifier SKU; не трогать archive.",
      en: "Then: promos on amplifier SKUs only; leave archive untouched.",
    }),
    fboWave: pick(locale, {
      ru: "FBO только если упаковка <55% bottleneck и тест зелёный.",
      en: "FBO only if packaging bottleneck <55% and test is green.",
    }),
    holdStopCondition: pick(locale, {
      ru: "Стоп: падение конверсии >12% к базе или DTF >70% три дня подряд.",
      en: "Stop: conv drops >12% vs baseline or DTF >70% for three straight days.",
    }),
    launchOrder: pick(locale, {
      ru: "Порядок: тест → refresh → amplification → FBO (опционально).",
      en: "Order: test → refresh → amplification → FBO (optional).",
    }),
    doNotLaunch: pick(locale, {
      ru: "Не запускать параллельно вторую капсулу в том же коридоре; не открывать long-tail до зелёного теста.",
      en: "Do not launch a second capsule in the same corridor in parallel; no long-tail until test is green.",
    }),
  };
}

function targetBuyer(locale: "ru" | "en", rank: DecisionEngineState["rank"]): string {
  return pick(locale, {
    ru: `Покупатель с уклоном в маржу: brandFit ${rank.brandFit}% · speed ${rank.speedPotential}% · saturation risk ${rank.saturationRisk}%.`,
    en: `Margin-aware buyer: brand fit ${rank.brandFit}% · speed ${rank.speedPotential}% · saturation risk ${rank.saturationRisk}%.`,
  });
}

function seasonTiming(locale: "ru" | "en", input: CollectionDeriveInput): string {
  return pick(locale, {
    ru: `Фаза temporal: ${input.temporalPhase} · погода: ${input.marketWeatherId} / ${input.weather3Id} · SEO fatigue ${input.seoSaturation}.`,
    en: `Temporal phase: ${input.temporalPhase} · weather: ${input.marketWeatherId} / ${input.weather3Id} · SEO fatigue ${input.seoSaturation}.`,
  });
}

function brandFitLine(locale: "ru" | "en", input: CollectionDeriveInput): string {
  return pick(locale, {
    ru: `Brand fit ${input.decision.rank.brandFit}% · риск дилюции ${input.decision.riskBrandDilution}% · DNA surface: ${input.brandDnaSurfaceActive ? "on" : "off"}.`,
    en: `Brand fit ${input.decision.rank.brandFit}% · dilution risk ${input.decision.riskBrandDilution}% · DNA surface: ${input.brandDnaSurfaceActive ? "on" : "off"}.`,
  });
}

function marketplaceFitLine(locale: "ru" | "en", input: CollectionDeriveInput): string {
  return pick(locale, {
    ru: `Режим рынка ${input.regime} · давление ${input.synthesis.pressureIndex}% · готовность запуска ${input.synthesis.launchReadiness}% · инициатива: ${input.initiativeHeadline || "—"}.`,
    en: `Market regime ${input.regime} · pressure ${input.synthesis.pressureIndex}% · launch readiness ${input.synthesis.launchReadiness}% · initiative: ${input.initiativeHeadline || "—"}.`,
  });
}

function riskLine(locale: "ru" | "en", input: CollectionDeriveInput): string {
  return pick(locale, {
    ru: `Риски: насыщение ${input.decision.riskSaturationProb}% · CTR fatigue ${input.decision.riskCtrFatigue}% · производство ${input.decision.riskProductionOverload}%.`,
    en: `Risks: saturation ${input.decision.riskSaturationProb}% · CTR fatigue ${input.decision.riskCtrFatigue}% · production ${input.decision.riskProductionOverload}%.`,
  });
}

function stopList(locale: "ru" | "en", _input: CollectionDeriveInput): readonly string[] {
  return pick(locale, {
    ru: [
      "Стоп при росте overlap-risk в коридоре после первой волны.",
      "Стоп если packaging bottleneck >62% во время amplification.",
      "Стоп если brand dilution >55% — ужать SKU-count.",
    ],
    en: [
      "Stop if overlap-risk rises in corridor after wave one.",
      "Stop if packaging bottleneck >62% during amplification.",
      "Stop if brand dilution >55% — cut SKU count.",
    ],
  });
}

function expectedImpactLine(locale: "ru" | "en", _input: CollectionDeriveInput, primary: { expectedImpactRu?: string } | undefined): string {
  const base = primary?.expectedImpactRu?.trim();
  if (base) return clip(base, 220);
  return pick(locale, {
    ru: `Ожидаемый эффект: стабилизация полки в коридоре + рост конверсии hero-кластера при контроле DTF.`,
    en: `Expected: shelf stabilization in corridor + hero-cluster conversion lift under DTF control.`,
  });
}

export function buildCollectionEntity(input: CollectionDeriveInput): CollectionEntity {
  const salt = input.candidateSalt ?? 0;
  const snapSeed = input.seed + salt * 13;
  const snapshot = buildMarketplaceEntitySnapshot(snapSeed, input.tension01, input.pressure01);
  const corridor = pickCorridor(snapshot, input.seed + salt * 173, input.regime);
  const primary = input.orchestration.routes.find((r) => r.id === input.orchestration.primaryRouteId);
  const kind = kindFromInput(input, primary?.kind);
  const clusters = skuClusters(input.locale, input.seed, salt, corridor, kind);
  const heroCount = clusters.find((c) => c.role === "hero")?.count ?? 2;
  const heroes = heroDefs(input.locale, input.seed, salt, snapshot, corridor, heroCount);
  const skuMin = clusters.reduce((a, c) => a + c.count, 0);
  const skuMax = skuMin + Math.min(24, mix(input.seed + salt * 29, 777) % 16);

  const id =
    salt === 0
      ? `col-${input.seed}-${Math.round(input.tension01 * 100)}-${Math.round(input.pressure01 * 100)}`
      : `col-${input.seed}-c${salt}-${Math.round(input.tension01 * 100)}-${Math.round(input.pressure01 * 100)}`;

  return {
    id,
    generatedAt: Date.now(),
    pulseSeed: input.seed,
    kind,
    name: collectionName(input.locale, kind, corridor.nameKey),
    concept: conceptLine(input.locale, input, corridor, kind),
    corridorId: corridor.id,
    corridorNameKey: corridor.nameKey,
    corridorPressure01: corridor.pressure01,
    opportunityReason: opportunityReason(input.locale, input, corridor, kind),
    targetBuyer: targetBuyer(input.locale, input.decision.rank),
    seasonTiming: seasonTiming(input.locale, input),
    brandFit: brandFitLine(input.locale, input),
    marketplaceFit: marketplaceFitLine(input.locale, input),
    productionFit: productionBlock(input.locale, input, kind),
    strategicRole: strategicRoleFor(kind, input.regime),
    heroProducts: heroes,
    skuClusters: clusters,
    skuCountTarget: { min: skuMin, max: skuMax },
    visualDirection: visualBlock(input.locale, input, kind),
    seoPlan: seoBlock(input.locale, input, corridor),
    launchPlan: launchBlock(input.locale, input),
    risk: riskLine(input.locale, input),
    stopConditions: stopList(input.locale, input),
    expectedImpact: expectedImpactLine(input.locale, input, primary),
    integration: {
      executiveBestNext: clip(input.orchestration.nextBestActionRu, 200),
      primaryRouteId: input.orchestration.primaryRouteId,
      primaryRouteKind: primary?.kind ?? "unknown",
      orchestratorObjective: clip(primary?.objectiveRu ?? "", 200),
      signalFabricNote: pick(input.locale, {
        ru: `Рёбра сети: ${input.fabricEdgeCount ?? "—"} · конфликты ${input.fabricConflictCount ?? "—"}.`,
        en: `Fabric edges: ${input.fabricEdgeCount ?? "—"} · conflicts ${input.fabricConflictCount ?? "—"}.`,
      }),
      temporalNote: pick(input.locale, {
        ru: `Temporal: ${input.temporalPhase} · визуальная усталость ${input.visualFatigue} · echo: ${clip(input.synthesis.memoryEchoRu, 120)}`,
        en: `Temporal: ${input.temporalPhase} · visual fatigue ${input.visualFatigue} · echo: ${clip(input.synthesis.memoryEchoRu, 120)}`,
      }),
      dominantCluster: clip(input.synthesis.dominantClusterRu, 160),
      brandDnaGovernance: pick(input.locale, {
        ru: input.brandDnaSurfaceActive ? "DNA governor активен — визуал и SEO под конституцию." : "Открыть Brand DNA и сверить запреты перед production lock.",
        en: input.brandDnaSurfaceActive ? "DNA governor active — align visual + SEO to constitution." : "Open Brand DNA and lock forbiddens before production.",
      }),
    },
  };
}

export function collectionEntityToJson(entity: CollectionEntity): string {
  return JSON.stringify(entity, null, 2);
}
