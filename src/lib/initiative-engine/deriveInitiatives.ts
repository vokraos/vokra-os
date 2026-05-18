import type { NavId } from "../../types";
import type { CognitivePulseEvent, CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { InitiativeMemory, StrategicInitiative } from "./types";
import { isSuppressed, patternBoost, pruneInitiativeMemory } from "./memory";
import { PRIORITY_RANK } from "./types";
import { readSelfEvolvingSyncAdjustments } from "../self-evolving-strategy/reactivity";

export type DeriveInitiativeInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  lastEvent: CognitivePulseEvent | null;
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
  initiativeScanGeneration: number;
  memory: InitiativeMemory;
};

function push(
  out: StrategicInitiative[],
  init: StrategicInitiative,
  pulseGen: number,
  memory: InitiativeMemory,
): void {
  if (isSuppressed(init.id, pulseGen, memory)) return;
  out.push(init);
}

function sortInitiatives(list: StrategicInitiative[]): StrategicInitiative[] {
  return [...list].sort((a, b) => {
    const pr = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (pr !== 0) return pr;
    return b.leverage - a.leverage;
  });
}

function avgPressure(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): number {
  const vals = Object.values(modules)
    .map((m) => m?.pressure)
    .filter((v): v is number => v != null);
  if (!vals.length) return 44;
  return vals.reduce((x, y) => x + y, 0) / vals.length;
}

export function deriveInitiatives(input: DeriveInitiativeInput): readonly StrategicInitiative[] {
  const { synthesis, decision, lastEvent, modules, pulseGeneration, initiativeScanGeneration, memory: rawMemory } = input;
  const memory = pruneInitiativeMemory(pulseGeneration, rawMemory);
  const out: StrategicInitiative[] = [];
  const p = avgPressure(modules);
  const d = decision;
  const s = synthesis;
  const ev = lastEvent;
  const scan = initiativeScanGeneration;

  const pb = (key: string) => patternBoost(key, memory);

  /** Baseline autonomous scan — always evaluating */
  if (s.regime === "opportunity" && d.rank.saturationRisk < 58) {
    push(
      out,
      {
        id: "auto-opportunity-corridor",
        kind: "opportunity",
        priority: d.rank.strategic > 68 ? "high_leverage" : "strategic",
        headlineRu: "Обнаружено: коридор возможности с низким давлением насыщения",
        headlineEn: "Detected: opportunity corridor with low saturation pressure",
        bodyRu: `Кластер «${s.dominantClusterRu}» держит запас по насыщению; контур рекомендует зафиксировать героя до сужения окна.`,
        bodyEn: `Cluster «${s.dominantClusterRu}» retains saturation headroom; lock the hero before the window tightens.`,
        leverage: 62 + pb("opportunity") + Math.round((100 - d.rank.saturationRisk) * 0.15),
      },
      pulseGeneration,
      memory,
    );
  }

  if (d.riskCtrFatigue > 52) {
    push(
      out,
      {
        id: "auto-risk-ctr-structure",
        kind: "risk",
        priority: d.riskCtrFatigue > 72 ? "critical" : "high_leverage",
        headlineRu: "Предупреждение: растёт вероятность визуальной усталости в структуре героя",
        headlineEn: "Warning: rising visual fatigue probability in current hero-shot structure",
        bodyRu: "Сместить proof в motion и пересобрать семантику героя; статичный якорь ослабевает быстрее контура.",
        bodyEn: "Shift proof toward motion and rebuild hero semantics; static anchors decay faster than the contour tolerates.",
        leverage: 70 + pb("ctr") + d.riskCtrFatigue * 0.25,
      },
      pulseGeneration,
      memory,
    );
  }

  if (d.riskProductionOverload > 48 || s.regime === "production_load") {
    push(
      out,
      {
        id: "auto-production-priority-shift",
        kind: "production",
        priority: d.riskProductionOverload > 70 ? "critical" : "strategic",
        headlineRu: "Рекомендация: сместить приоритет производства к высокомаржинальным малым партиям",
        headlineEn: "Recommendation: shift production priority toward high-margin low-return SKU groups",
        bodyRu: "Очередь DTF не должна питать низкодоходные расширения матрицы; FBO оставить подтверждённым SKU.",
        bodyEn: "The DTF queue should not feed low-yield matrix expansion; reserve FBO for validated SKUs only.",
        leverage: 64 + d.riskProductionOverload * 0.22,
      },
      pulseGeneration,
      memory,
    );
  }

  if (modules.visual?.brandGate === "watch" || modules.visual?.brandGate === "hold") {
    push(
      out,
      {
        id: "auto-brand-drift",
        kind: "brand_integrity",
        priority: modules.visual?.brandGate === "hold" ? "critical" : "high_leverage",
        headlineRu: "Обнаружено: визуальный вектор отходит от конституции VOKRA DNA",
        headlineEn: "Detected: current visual direction drifting from VOKRA DNA",
        bodyRu: "Ужесточить gate и остановить масштабирование до повторного согласования negative space и палитры.",
        bodyEn: "Tighten gate and halt scale until negative space and palette pass a second constitutional pass.",
        leverage: 78 + pb("dna"),
      },
      pulseGeneration,
      memory,
    );
  }

  if (d.rank.seoLeverage < 48 || s.regime === "saturation") {
    push(
      out,
      {
        id: "auto-seo-differentiation",
        kind: "seo",
        priority: "strategic",
        headlineRu: "Семантический кластер теряет дифференциальное преимущество",
        headlineEn: "Semantic cluster losing differentiation advantage",
        bodyRu: "Сместить опору с ширины long-tail на entity-глубину героя; не открывать параллельные слабые кластеры.",
        bodyEn: "Move anchor from long-tail width to hero entity depth; do not open parallel weak clusters.",
        leverage: 52 + (100 - d.rank.seoLeverage) * 0.35,
      },
      pulseGeneration,
      memory,
    );
  }

  /** Strategic interventions — opinionated */
  if (s.regime === "saturation" && d.rank.speedPotential > 62) {
    push(
      out,
      {
        id: "intervene-overscale-weak-trend",
        kind: "intervention",
        priority: "high_leverage",
        headlineRu: "Вмешательство: не масштабировать слабый тренд при фазе насыщения",
        headlineEn: "Intervention: do not overscale a weak trend under saturation phase",
        bodyRu: "Контур оспаривает ускорение охвата: вероятность dilution выше ожидаемого прироста маржи.",
        bodyEn: "The contour challenges reach acceleration: dilution probability exceeds expected margin lift.",
        leverage: 82,
      },
      pulseGeneration,
      memory,
    );
  }

  if (d.rank.marginPotential < 45 && d.rank.speedPotential > 55) {
    push(
      out,
      {
        id: "intervene-low-margin-launch",
        kind: "intervention",
        priority: "strategic",
        headlineRu: "Вмешательство: отложить запуск с низкой маржинальной устойчивостью",
        headlineEn: "Intervention: discourage low-margin launch trajectory",
        bodyRu: "Скорость без маржи увеличивает SKU-энтропию; контур предлагает сузить матрицу до proof-героя.",
        bodyEn: "Speed without margin raises SKU entropy; narrow the matrix to a proof hero.",
        leverage: 68,
      },
      pulseGeneration,
      memory,
    );
  }

  if (p > 62 && s.launchReadiness < 55) {
    push(
      out,
      {
        id: "intervene-resource-entropy",
        kind: "resource",
        priority: "strategic",
        headlineRu: "Редирект ресурса: снизить энтропию SKU до стабилизации давления",
        headlineEn: "Resource redirect: reduce SKU entropy until pressure stabilizes",
        bodyRu: "Параллельные входы в производство и контент ослабляют исполнение; один сильный маршрут предпочтительнее.",
        bodyEn: "Parallel production and content entries weaken execution; one strong route is preferable.",
        leverage: 58,
      },
      pulseGeneration,
      memory,
    );
  }

  /** Pulse-bound initiatives */
  if (ev) {
    if (ev.id === "trend-oversize-premium") {
      push(
        out,
        {
          id: "pulse-op-anime-noir-oversize",
          kind: "opportunity",
          priority: "high_leverage",
          headlineRu: "Обнаружено: премиальный anime-noir oversize с низким давлением насыщения",
          headlineEn: "Detected: premium anime-noir oversize cluster with low saturation pressure",
          bodyRu: ev.detailRu,
          bodyEn: "Trend impulse confirms headroom; prioritize capsule proof before marketplace dilution.",
          leverage: 88 + pb("trend-oversize-premium"),
        },
        pulseGeneration,
        memory,
      );
    }
    if (ev.id === "analytics-ctr-still") {
      push(
        out,
        {
          id: "pulse-risk-ctr-hero",
          kind: "risk",
          priority: "critical",
          headlineRu: "Предупреждение: вероятность визуальной усталости в текущей структуре героя",
          headlineEn: "Warning: visual fatigue probability increasing in current hero-shot structure",
          bodyRu: ev.detailRu,
          bodyEn: "Motion-first proof and hero rebuild are indicated before the next promo cadence.",
          leverage: 92,
        },
        pulseGeneration,
        memory,
      );
    }
    if (ev.id === "ops-queue-pressure") {
      push(
        out,
        {
          id: "pulse-prod-queue",
          kind: "production",
          priority: "critical",
          headlineRu: "Критично: перегруз маршрута печати — перераспределить приоритет",
          headlineEn: "Critical: print-route overload — reallocate priority",
          bodyRu: ev.detailRu,
          bodyEn: "Defer secondary launches; protect DTF SLA and FBO stability.",
          leverage: 95,
        },
        pulseGeneration,
        memory,
      );
    }
    if (ev.id === "visual-brand-watch" || ev.id === "dna-governor-tighten") {
      push(
        out,
        {
          id: `pulse-brand-${ev.id}`,
          kind: "brand_integrity",
          priority: ev.id === "dna-governor-tighten" ? "critical" : "high_leverage",
          headlineRu: "Целостность бренда: конституция требует корректировки вектора",
          headlineEn: "Brand integrity: constitution requires vector correction",
          bodyRu: ev.detailRu,
          bodyEn: "Reject visually generic extensions until DNA gate clears.",
          leverage: 86,
        },
        pulseGeneration,
        memory,
      );
    }
    if (ev.id === "seo-semantic-shift") {
      push(
        out,
        {
          id: "pulse-seo-shift",
          kind: "seo",
          priority: "high_leverage",
          headlineRu: "SEO: зафиксировать entity-опору до потери дифференциации",
          headlineEn: "SEO: lock entity anchor before differentiation loss",
          bodyRu: ev.detailRu,
          bodyEn: "Route rich and memory layers to reinforce the hero entity, not fragment clusters.",
          leverage: 74,
        },
        pulseGeneration,
        memory,
      );
    }
    if (ev.id === "trend-anime-sat") {
      push(
        out,
        {
          id: "pulse-intervene-anime-sat",
          kind: "intervention",
          priority: "critical",
          headlineRu: "Вмешательство: не расширять anime luxury до охлаждения ниши",
          headlineEn: "Intervention: do not expand anime luxury until niche cools",
          bodyRu: ev.detailRu,
          bodyEn: "The contour flags overscaling risk; micro-drop or noir contrast only.",
          leverage: 90,
        },
        pulseGeneration,
        memory,
      );
    }
  }

  /** Rotating autonomous observe — surfaces on scan tick */
  const scanLines: StrategicInitiative[] = [
    {
      id: `scan-structure-${scan % 4}`,
      kind: "opportunity",
      priority: "observe",
      headlineRu: "Наблюдение: повторяющаяся структура рынка в gift / archive",
      headlineEn: "Observe: recurring market structure in gift / archive",
      bodyRu: "Контур усиливает вес успешных паттернов при стабильном отклике.",
      bodyEn: "The contour increases weight on patterns that repeatedly validate.",
      leverage: 22 + (scan % 3) * 2,
    },
    {
      id: `scan-sku-${scan % 3}`,
      kind: "resource",
      priority: "observe",
      headlineRu: "Наблюдение: плотность SKU выше оптимума для текущей полосы proof",
      headlineEn: "Observe: SKU density above optimum for current proof bandwidth",
      bodyRu: "Самооптимизация: слабые рекомендации снижают приоритет до подтверждения сигнала.",
      bodyEn: "Self-tuning: weak recommendations deprioritize until signal confirms.",
      leverage: 20,
    },
    {
      id: `scan-comp-${scan % 5}`,
      kind: "risk",
      priority: "observe",
      headlineRu: "Наблюдение: давление конкурентов в премиальном якоре — мониторинг",
      headlineEn: "Observe: competitor pressure on premium anchor — monitoring",
      bodyRu: "Реакция конкурентов вероятна в 7–30 дн.; без преждевременного ценового зеркала.",
      bodyEn: "Competitor reaction likely in 7–30d; avoid premature price mirroring.",
      leverage: 18,
    },
  ];
  const scanPick = scanLines[scan % scanLines.length]!;
  push(out, scanPick, pulseGeneration, memory);

  const sorted = sortInitiatives(out);
  const seAdj = readSelfEvolvingSyncAdjustments();
  const bias = seAdj.initiativeLeverageBias;
  const adjusted = sorted.map((it) => ({
    ...it,
    leverage: Math.round(
      it.leverage + bias + (it.kind === "seo" ? (seAdj.seoLeverageMul - 1) * 12 : 0) + (it.kind === "production" ? (seAdj.productionLeverageMul - 1) * 10 : 0),
    ),
  }));
  return sortInitiatives(adjusted).slice(0, 7);
}

export function maxUrgencyFromInitiatives(list: readonly StrategicInitiative[]): "calm" | "elevated" | "critical" {
  let u: "calm" | "elevated" | "critical" = "calm";
  for (const i of list) {
    if (i.priority === "critical") return "critical";
    if (i.priority === "high_leverage") u = "elevated";
  }
  if (list.some((i) => i.kind === "intervention" && i.priority === "strategic")) {
    if (u === "calm") u = "elevated";
  }
  return u;
}
