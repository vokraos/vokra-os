import type {
  CampaignVisualRole,
  VisualCorridorGrammar,
  VisualDirectionEntity,
  VisualMemoryLedgerItem,
  VisualStrategySnapshot,
} from "./types";
import { visualCorridorFromMarketplaceCorridorId, VISUAL_CORRIDOR_CATALOG, corridorByIndex } from "./corridors";
import { buildMarketplaceVisualPhysics } from "./marketplace-physics";
import { buildVisualFatigueState } from "./fatigue-engine";
import { buildHeroVisualEntity } from "./hero-system";
import { buildCampaignVisualEntity } from "./campaign-structure";
import { buildPromptFoundationTemplate } from "./prompt-foundation";
import { vokraVsGenericDigestEn, vokraVsGenericDigestRu } from "./dna";

const ROLES: CampaignVisualRole[] = ["hero_window", "support_matrix", "reels_pressure", "thumbnail_war"];

function pick(seed: number, mod: number): number {
  return ((seed % mod) + mod) % mod;
}

export function buildVisualDirectionEntity(input: {
  seed: number;
  corridorGrammar: VisualCorridorGrammar;
  visualMood: string;
  marketplaceFit: number;
  dtfCompatibility: number;
  fatigueRisk: number;
  heroSuitability: number;
}): VisualDirectionEntity {
  const role = ROLES[pick(input.seed, ROLES.length)]!;
  const premiumLevel = Math.max(44, Math.min(96, Math.round(72 + pick(input.seed + 11, 17) - input.fatigueRisk * 0.2)));

  return {
    id: `vd-${input.seed}-${input.corridorGrammar.id}`,
    name: `${input.corridorGrammar.labelRu} · ${input.visualMood.slice(0, 48)}`,
    corridor: input.corridorGrammar.id,
    visualMood: input.visualMood,
    premiumLevel,
    marketplaceFit: Math.max(40, Math.min(96, Math.round(input.marketplaceFit))),
    dtfCompatibility: Math.max(38, Math.min(95, Math.round(input.dtfCompatibility))),
    fatigueRisk: Math.max(0, Math.min(100, Math.round(input.fatigueRisk))),
    heroSuitability: Math.max(40, Math.min(98, Math.round(input.heroSuitability))),
    campaignRole: role,
  };
}

function buildMemoryLedger(seed: number, fatigueScore: number, overlap: number): VisualMemoryLedgerItem[] {
  const base: VisualMemoryLedgerItem[] = [
    {
      id: `vm-${seed}-1`,
      category: "hero_success",
      labelRu: "Успешный hero",
      labelEn: "Successful hero",
      noteRu: "Коридор удержал премиальное восприятие на последней волне героя.",
      noteEn: "Corridor held premium perception on last hero wave.",
      severity: fatigueScore < 55 ? "info" : "watch",
    },
    {
      id: `vm-${seed}-2`,
      category: "fatigue_history",
      labelRu: "История fatigue",
      labelEn: "Fatigue history",
      noteRu: `Индекс усталости визуала: ${Math.round(fatigueScore)} — контроль refresh.`,
      noteEn: `Visual fatigue index: ${Math.round(fatigueScore)} — refresh discipline.`,
      severity: fatigueScore > 68 ? "critical" : "watch",
    },
    {
      id: `vm-${seed}-3`,
      category: "overlap_event",
      labelRu: "Overlap",
      labelEn: "Overlap",
      noteRu: `Давление пересечений коридоров: ${Math.round(overlap * 100)}.`,
      noteEn: `Corridor overlap pressure: ${Math.round(overlap * 100)}.`,
      severity: overlap > 0.58 ? "critical" : "info",
    },
    {
      id: `vm-${seed}-4`,
      category: "premium_win",
      labelRu: "Premium perception",
      labelEn: "Premium perception",
      noteRu: "Тьма и кинематограф удерживают дифференциацию от generic marketplace.",
      noteEn: "Dark cinematic axis holds differentiation vs generic marketplace.",
      severity: "info",
    },
  ];
  return base;
}

export type VisualStrategySnapshotInput = {
  pulseSeed: number;
  locale: "ru" | "en";
  visualFatigue01: number;
  seoSaturation01: number;
  tension01: number;
  pressure01: number;
  riskCtrFatigue: number;
  dominantClusterRu: string;
  executiveBestNext: string;
  executiveWhyNow: string;
  brandDnaSurfaceActive: boolean;
  collectionCorridorId: string;
  collectionCorridorNameKey: string;
  collectionKind: string;
  visualMood: string;
  corridorPressure01: number;
  overlap01: number;
  heroDensity01: number;
  dtfSuitabilityLine: string;
  collectionReelsDirection?: string;
  collectionMarketplaceThumb?: string;
  collectionModelBg?: string;
};

function digestRu(input: VisualStrategySnapshotInput, corridorLabelRu: string): string[] {
  const ru: string[] = [];
  ru.push(
    `${corridorLabelRu}: визуальная стабильность коридора привязана к pressure=${Math.round(input.corridorPressure01 * 100)}%.`,
  );
  if (input.brandDnaSurfaceActive) {
    ru.push("Brand DNA: поверхностный надзор активен — визуал в зоне gate.");
  }
  ru.push(`Executive: ${input.executiveBestNext.slice(0, 140)}${input.executiveBestNext.length > 140 ? "…" : ""}`);
  ru.push(`Кластер: ${input.dominantClusterRu}`);
  ru.push(`Коллекция (${input.collectionKind}): коридор ${input.collectionCorridorNameKey}.`);
  return ru;
}

function digestEn(input: VisualStrategySnapshotInput, corridorLabelEn: string): string[] {
  const en: string[] = [];
  en.push(
    `${corridorLabelEn}: corridor visual stability tied to pressure=${Math.round(input.corridorPressure01 * 100)}%.`,
  );
  if (input.brandDnaSurfaceActive) {
    en.push("Brand DNA: surface governance active — visual in gate zone.");
  }
  en.push(`Executive: ${input.executiveBestNext.slice(0, 140)}${input.executiveBestNext.length > 140 ? "…" : ""}`);
  en.push(`Cluster focus: ${input.dominantClusterRu}`);
  en.push(`Collection (${input.collectionKind}): corridor key ${input.collectionCorridorNameKey}.`);
  return en;
}

export function buildVisualStrategySnapshot(input: VisualStrategySnapshotInput): VisualStrategySnapshot {
  const primary = visualCorridorFromMarketplaceCorridorId(input.collectionCorridorId, input.pulseSeed);
  const secondary = corridorByIndex(primary.id.length + input.pulseSeed + 1);

  const fatigue = buildVisualFatigueState({
    visualFatigue01: input.visualFatigue01,
    overlap01: input.overlap01,
    corridorPressure01: input.corridorPressure01,
    ctrFatigueRisk: input.riskCtrFatigue,
    saturation01: input.seoSaturation01,
  });

  const physics = buildMarketplaceVisualPhysics({
    visualFatigue01: input.visualFatigue01,
    tension01: input.tension01,
    pressure01: input.pressure01,
    ctrFatigueRisk: input.riskCtrFatigue,
    overlap01: input.overlap01,
    heroDensity01: input.heroDensity01,
  });

  const hero = buildHeroVisualEntity(input.pulseSeed, fatigue.score, input.overlap01);

  const campaign = buildCampaignVisualEntity(
    input.pulseSeed,
    hero,
    input.collectionReelsDirection ?? "",
    input.collectionMarketplaceThumb ?? "",
    input.collectionModelBg ?? "",
  );

  const dirPrimary = buildVisualDirectionEntity({
    seed: input.pulseSeed,
    corridorGrammar: primary,
    visualMood: input.visualMood,
    marketplaceFit: physics.conversionClarity,
    dtfCompatibility: 78 - input.pressure01 * 12,
    fatigueRisk: fatigue.score,
    heroSuitability: hero.ctrSuitability,
  });

  const dirAlt = buildVisualDirectionEntity({
    seed: input.pulseSeed + 9,
    corridorGrammar: secondary,
    visualMood: `${input.visualMood} · alt axis`,
    marketplaceFit: physics.thumbnailReadability,
    dtfCompatibility: 74 - input.tension01 * 10,
    fatigueRisk: fatigue.overlapPressure,
    heroSuitability: hero.readability,
  });

  const digestRuLines = digestRu(input, primary.labelRu);
  const digestEnLines = digestEn(input, primary.labelEn);

  const ledger = buildMemoryLedger(input.pulseSeed, fatigue.score, input.overlap01);

  const promptFoundation = buildPromptFoundationTemplate({
    corridor: primary.id,
    visualMood: input.visualMood,
    composition: hero.compositionType,
    premiumLevel: dirPrimary.premiumLevel,
    dtfNote: input.dtfSuitabilityLine,
  });

  const extraDigestRu = [vokraVsGenericDigestRu(), `Почему сейчас: ${input.executiveWhyNow.slice(0, 160)}`];
  const extraDigestEn = [vokraVsGenericDigestEn(), `Why now: ${input.executiveWhyNow.slice(0, 160)}`];

  return {
    generatedAt: Date.now(),
    pulseSeed: input.pulseSeed,
    locale: input.locale,
    corridors: [...VISUAL_CORRIDOR_CATALOG],
    activeDirections: [dirPrimary, dirAlt],
    heroVisual: hero,
    campaign,
    physics,
    fatigue,
    memoryLedger: ledger,
    promptFoundation,
    integrationDigestRu: [...digestRuLines, ...extraDigestRu],
    integrationDigestEn: [...digestEnLines, ...extraDigestEn],
  };
}
