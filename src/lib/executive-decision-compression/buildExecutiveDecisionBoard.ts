import type { CognitiveSynthesisState, DecisionEngineState } from "../cognitive-os/types";
import type { StrategicInitiative } from "../initiative-engine/types";
import { PRIORITY_RANK } from "../initiative-engine/types";
import type { ExecutionOrchestrationSnapshot, ExecutionRoute } from "../execution-orchestrator/types";
import type { ExecutiveDecisionBoard } from "./types";

export type ExecutiveDecisionBuildInput = {
  locale: "ru" | "en";
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  orchestration: ExecutionOrchestrationSnapshot;
  initiatives: readonly StrategicInitiative[];
};

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function uniq(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of lines) {
    const k = x.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x.trim());
  }
  return out;
}

function primaryRoute(orch: ExecutionOrchestrationSnapshot): ExecutionRoute | undefined {
  return orch.routes.find((r) => r.id === orch.primaryRouteId) ?? orch.routes[0];
}

function forbiddenFromHeuristics(
  locale: "ru" | "en",
  syn: CognitiveSynthesisState,
  dec: DecisionEngineState,
  orch: ExecutionOrchestrationSnapshot,
): string[] {
  const pairs: [string, string][] = [];

  if (syn.launchReadiness < 52) {
    pairs.push([
      "Не открывать новые SKU 5–7 дней — сначала выровнять витрину и готовность запуска.",
      "Do not launch new SKUs for 5–7 days — fix shelf readiness first.",
    ]);
  }
  if (dec.riskProductionOverload > 52 || orch.resourcePressure.packagingBottleneck > 55) {
    pairs.push([
      "Не наращивать FBO параллельно пику DTF и упаковки — сначала снять bottleneck.",
      "Do not scale FBO while DTF + packaging are peaking — clear the bottleneck first.",
    ]);
  }
  if (dec.riskBrandDilution > 48) {
    pairs.push([
      "Не включать агрессивный discount / широкий промо на premium-линейку.",
      "No aggressive discounts / broad promos on the premium line.",
    ]);
  }
  if (dec.riskCtrFatigue > 48) {
    pairs.push([
      "Не лить новый paid-трафик на «уставшие» карточки без обновления hero-визуала.",
      "Do not push new paid traffic to tired cards without a hero visual refresh.",
    ]);
  }
  if (dec.riskSaturationProb > 52) {
    pairs.push([
      "Не расширять long-tail SKU вне hero-кластера — риск размытия и складского шума.",
      "Do not expand long-tail SKUs outside the hero cluster — dilution + stock noise.",
    ]);
  }

  return pairs.map((p) => (locale === "en" ? p[1] : p[0])).slice(0, 5);
}

function splitRiskPhrases(risksRu: string): string[] {
  return risksRu
    .split(/[.;]\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function buildExecutiveDecisionBoard(input: ExecutiveDecisionBuildInput): ExecutiveDecisionBoard {
  const { locale, synthesis: syn, decision: dec, orchestration: orch, initiatives } = input;
  const primary = primaryRoute(orch);

  const actionsRaw: string[] = [];
  if (dec.priorityAccelerateRu.trim()) actionsRaw.push(clip(dec.priorityAccelerateRu, 110));
  else if (dec.priorityHeadlineRu.trim()) actionsRaw.push(clip(dec.priorityHeadlineRu, 110));

  const sortedIni = [...initiatives].sort(
    (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || b.leverage - a.leverage,
  );
  for (const i of sortedIni) {
    const h = locale === "en" ? i.headlineEn : i.headlineRu;
    if (h.trim()) actionsRaw.push(clip(h, 110));
    if (actionsRaw.length >= 5) break;
  }
  if (actionsRaw.length < 3 && primary?.nextActionRu.trim()) {
    actionsRaw.push(clip(primary.nextActionRu, 110));
  }
  if (actionsRaw.length < 3 && syn.activeMissionRu.trim()) {
    actionsRaw.push(clip(syn.activeMissionRu, 110));
  }
  const actions = uniq(actionsRaw).slice(0, 3);

  const risksRaw: string[] = [];
  if (syn.biggestRiskRu.trim()) risksRaw.push(clip(syn.biggestRiskRu, 120));
  for (const b of orch.blockers.slice(0, 2)) {
    risksRaw.push(clip(b.labelRu, 120));
  }
  risksRaw.push(...splitRiskPhrases(dec.launch.risksRu).map((x) => clip(x, 120)));
  if (primary?.risksRu.trim()) risksRaw.push(clip(primary.risksRu, 120));
  const risks = uniq(risksRaw).slice(0, 3);

  const forbiddenPool = forbiddenFromHeuristics(locale, syn, dec, orch);
  const forbidden = uniq(forbiddenPool).slice(0, 3);

  const bestNext = clip(orch.nextBestActionRu || primary?.nextActionRu || dec.priorityHeadlineRu, 200);

  const whyNow = clip(dec.executiveReasoningRu || syn.memoryEchoRu || syn.activeMissionRu, 260);

  const expectedImpact = clip(dec.launch.expectedImpactRu || primary?.expectedImpactRu || syn.topOpportunityRu, 200);

  const tw = [dec.timingWindowRu, dec.timingMomentumRu, dec.timingMarketplaceRu].filter(Boolean).join(" · ");
  const timeWindow = clip(tw || dec.launch.timingRu, 220);

  const leakLine = clip(orch.resourcePressure.summaryRu, 140);

  const b0 = orch.blockers[0]?.labelRu?.trim();
  const br0 = primary?.blockersRu[0]?.trim();
  const leakRaw = orch.resourcePressure.summaryRu.replace(/\s+/g, " ").trim();
  const noBlocker = locale === "en" ? "No explicit route blocker" : "Нет явного блокера маршрута";
  const bottleneck = clip(b0 || br0 || leakRaw || noBlocker, 118);

  const readinessLine =
    locale === "en"
      ? `Launch ${syn.launchReadiness}% · execution ${orch.executionConfidence}% · drag ${orch.operationalDrag}%`
      : `Запуск ${syn.launchReadiness}% · исполнение ${orch.executionConfidence}% · тормоз ${orch.operationalDrag}%`;

  return {
    actions: actions.length ? actions : [locale === "en" ? "Hold pattern — confirm priority in Mission Control." : "Удержать паттерн — зафиксировать приоритет в Mission Control."],
    risks: risks.length ? risks : [locale === "en" ? "No acute risk flagged — still watch packaging and shelf." : "Острых рисков нет — всё равно следить за упаковкой и витриной."],
    forbidden: forbidden.length
      ? forbidden
      : [locale === "en" ? "Avoid parallel launches until one route is green." : "Избегать параллельных запусков, пока один маршрут не «зелёный»."],
    bestNext,
    whyNow: whyNow || (locale === "en" ? "Cadence is steady — align the next SKU wave with production." : "Каденция ровная — синхронизировать следующую волну SKU с производством."),
    expectedImpact: expectedImpact || (locale === "en" ? "Stabilize margin and shelf conversion before scaling." : "Стабилизировать маржу и конверсию полки перед масштабом."),
    timeWindow: timeWindow || (locale === "en" ? "This week — ship one decisive move." : "На этой неделе — один решительный шаг."),
    leakLine: leakLine || (locale === "en" ? "Watch warehouse + DTF coupling for hidden drag." : "Следить за связкой склад + DTF на скрытое трение."),
    bottleneck,
    readinessLine,
  };
}
