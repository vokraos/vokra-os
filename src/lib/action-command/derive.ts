import type { NavId } from "../../types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type { ExecutionRoute, ExecutionStage, RouteState } from "../execution-orchestrator/types";
import {
  ACTION_COMMAND_STATUS_RU,
  ACTION_COMMAND_TYPE_LABEL_RU,
  type ActionCommand,
  type ActionCommandLayerSnapshot,
  type ActionCommandStatus,
  type ActionCommandType,
} from "./types";
import { clamp, hashStr } from "../math";

function stageToCommandType(stageIndex: number, routeKind: ExecutionRoute["kind"]): ActionCommandType {
  const byIdx: ActionCommandType[] = [
    "check_production",
    "verify_brand_dna",
    "create_sku",
    "prepare_print",
    "update_hero_visual",
    "expand_seo",
    "assemble_rich",
    "update_card",
    "launch_reels",
    "prepare_fbo",
    "test_price",
    "reduce_sku_entropy",
  ];
  let t = byIdx[stageIndex] ?? "check_production";
  if (routeKind === "seo_reinforcement") {
    if (stageIndex === 2 || stageIndex === 5) t = "expand_seo";
    if (stageIndex === 6) t = "assemble_rich";
  }
  if (routeKind === "visual_refresh") {
    if (stageIndex === 4 || stageIndex === 3) t = "update_hero_visual";
    if (stageIndex === 8) t = "launch_reels";
  }
  if (routeKind === "fbo_scale" && (stageIndex === 9 || stageIndex === 8)) t = "prepare_fbo";
  if (routeKind === "fast_dtf_test" && (stageIndex === 3 || stageIndex === 2)) t = "prepare_print";
  if (routeKind === "brand_correction" && (stageIndex === 1 || stageIndex === 7)) t = "verify_brand_dna";
  return t;
}

function stageToCommandStatus(st: ExecutionStage, dnaHold: boolean, owner: string): ActionCommandStatus {
  if (dnaHold && (owner === "visual" || owner === "campaign")) return "blocked";
  const s: RouteState = st.status;
  if (s === "blocked") return "blocked";
  if (s === "active" || s === "scaling") return "in_progress";
  if (s === "completed" || s === "exhausted") return "done";
  if (s === "paused") return "deferred";
  if (s === "production_ready") return "ready";
  if (s === "waiting") return st.index > 0 ? "waiting_dependency" : "new";
  if (s === "synchronized") return st.index < 2 ? "in_progress" : "waiting_dependency";
  return "new";
}

function riskForType(t: ActionCommandType): string {
  const m: Record<ActionCommandType, string> = {
    create_sku: "Потеря окна запуска и перегруз матрицы без якоря.",
    prepare_print: "Задержка DTF и срыв синхронизации с витриной.",
    update_hero_visual: "Просадка CTR и визуальная усталость героя.",
    expand_seo: "Размытие кластера и рост CPC без семантической опоры.",
    assemble_rich: "Слабая конверсия карточки и разрыв нарратива.",
    launch_reels: "Потеря импульса в соцдоказательстве и охвате.",
    verify_brand_dna: "Риск dilution и конфликт с gate бренда.",
    prepare_fbo: "Логистический дробитель и нестабильный fulfillment.",
    reduce_sku_entropy: "Шум матрицы SKU и давление на операции.",
    check_production: "Срыв партий и рост operational drag.",
    update_card: "Расхождение карточки с SEO и визуальным контуром.",
    test_price: "Неверный ценовой якорь и давление на маржу.",
  };
  return m[t];
}

function firstStepFromStage(st: ExecutionStage): string {
  const d = st.dependencyRu;
  if (d.length < 90) return d;
  return `${d.slice(0, 87)}…`;
}

export type BuildActionCommandsInput = {
  routes: readonly ExecutionRoute[];
  initiatives: readonly StrategicInitiative[];
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  temporal: TemporalStrategySnapshot;
  fabric: SignalFabricSnapshot | null;
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  pulseGeneration: number;
};

export function buildActionCommands(input: BuildActionCommandsInput): ActionCommandLayerSnapshot {
  const { routes, initiatives, modules, temporal, fabric, synthesis, decision, pulseGeneration } = input;
  const dnaHold = modules.dna?.brandGate === "hold";
  const out: ActionCommand[] = [];
  const seed = hashStr(`ac-${pulseGeneration}`);

  /** Stage-derived commands: primary route only (avoid 80+ duplicate rows). */
  const stageRoutes = routes.slice(0, 1);
  for (const route of stageRoutes) {
    for (const st of route.sequence.stages) {
      const cmdType = stageToCommandType(st.index, route.kind);
      const status = stageToCommandStatus(st, dnaHold, st.owner);
      const basePri =
        42 +
        (route.urgency === "critical" ? 28 : route.urgency === "high" ? 18 : 0) +
        Math.round(st.pressure * 0.22) +
        ((seed + st.index * 7) % 12);
      let priority = clamp(basePri);
      if (fabric && fabric.corePressure > 62) priority = clamp(priority + 6);
      const top = initiatives[0];
      if (top?.priority === "critical" && st.index <= 4) priority = clamp(priority + 10);

      const id = `ac-${route.id}-s${st.index}`;
      out.push({
        id,
        titleRu: st.nameRu,
        commandType: cmdType,
        typeLabelRu: ACTION_COMMAND_TYPE_LABEL_RU[cmdType],
        owner: st.owner as string,
        priority,
        status,
        statusLabelRu: ACTION_COMMAND_STATUS_RU[status],
        reasonRu: `${route.titleRu}: ${route.objectiveRu.slice(0, 72)}${route.objectiveRu.length > 72 ? "…" : ""}`,
        firstStepRu: firstStepFromStage(st),
        expectedOutcomeRu: route.expectedImpactRu.slice(0, 100) + (route.expectedImpactRu.length > 100 ? "…" : ""),
        deadlineWindowRu: temporal.bestLaunchWindowRu.slice(0, 80) + (temporal.bestLaunchWindowRu.length > 80 ? "…" : ""),
        dependenciesRu:
          st.index === 0
            ? ["Контур: Trend Radar / Signal Fabric"]
            : [
                `Стадия ${st.index}${
                  st.dependencyRu.length > 72 ? ` · ${st.dependencyRu.slice(0, 69)}…` : ` · ${st.dependencyRu}`
                }`,
              ],
        riskIfIgnoredRu: riskForType(cmdType),
        linkedRouteId: route.id,
        linkedStageIndex: st.index,
      });
    }
  }

  if (initiatives.length) {
    const ini = initiatives[0]!;
    const iniType: ActionCommandType =
      ini.kind === "seo"
        ? "expand_seo"
        : ini.kind === "production"
          ? "check_production"
          : ini.kind === "brand_integrity"
            ? "verify_brand_dna"
            : "reduce_sku_entropy";
    const iniPri = clamp(58 + (ini.priority === "critical" ? 22 : ini.priority === "high_leverage" ? 14 : 8) + Math.round(ini.leverage % 13));
    out.push({
      id: `ac-init-${ini.id}`,
      titleRu: ini.headlineRu.slice(0, 120) + (ini.headlineRu.length > 120 ? "…" : ""),
      commandType: iniType,
      typeLabelRu: ACTION_COMMAND_TYPE_LABEL_RU[iniType],
      owner: "initiative_engine",
      priority: iniPri,
      status: dnaHold && iniType === "verify_brand_dna" ? "blocked" : "new",
      statusLabelRu: ACTION_COMMAND_STATUS_RU[dnaHold && iniType === "verify_brand_dna" ? "blocked" : "new"],
      reasonRu: `Initiative Engine: ${ini.bodyRu.slice(0, 100)}${ini.bodyRu.length > 100 ? "…" : ""}`,
      firstStepRu: "Зафиксировать владельца стадии и SLA в Mission Control.",
      expectedOutcomeRu: synthesis.topOpportunityRu.slice(0, 90) + (synthesis.topOpportunityRu.length > 90 ? "…" : ""),
      deadlineWindowRu: temporal.bestLaunchWindowRu.slice(0, 70) + (temporal.bestLaunchWindowRu.length > 70 ? "…" : ""),
      dependenciesRu: ["Инициатива", "маршрут премиум / основной"],
      riskIfIgnoredRu: "Потеря рычага окна и рост biggestRisk контура.",
      linkedRouteId: routes[0]!.id,
      linkedStageIndex: -1,
    });
  }

  if (fabric && fabric.events[0]) {
    const ev = fabric.events[0]!;
    const boostType: ActionCommandType = ev.type === "SEO_SIGNAL" ? "expand_seo" : "check_production";
    out.push({
      id: `ac-sf-${ev.id}`,
      titleRu: ev.labelRu.slice(0, 100),
      commandType: boostType,
      typeLabelRu: ACTION_COMMAND_TYPE_LABEL_RU[boostType],
      owner: "signal_fabric",
      priority: clamp(48 + Math.round(ev.intensity * 0.35)),
      status: "new",
      statusLabelRu: ACTION_COMMAND_STATUS_RU.new,
      reasonRu: ev.causeRu.slice(0, 110) + (ev.causeRu.length > 110 ? "…" : ""),
      firstStepRu: ev.effectRu.slice(0, 110) + (ev.effectRu.length > 110 ? "…" : ""),
      expectedOutcomeRu: `Согласование каскада · confidence ${ev.confidence}%`,
      deadlineWindowRu: decision.timingWindowRu.slice(0, 75) + (decision.timingWindowRu.length > 75 ? "…" : ""),
      dependenciesRu: ["Signal Fabric", String(ev.source)],
      riskIfIgnoredRu: "Импульс сети не закрепится в исполнении.",
      linkedRouteId: routes[0]!.id,
      linkedStageIndex: -2,
    });
  }

  const sorted = [...out].sort((a, b) => b.priority - a.priority);
  const top = sorted.find((c) => c.status !== "done" && c.status !== "deferred") ?? sorted[0] ?? null;

  return {
    generatedAt: Date.now(),
    pulseGeneration,
    commands: sorted,
    topCommandId: top?.id ?? null,
  };
}
