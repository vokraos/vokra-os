import type { DailyPilotDebrief } from "../daily-pilot-debrief/types";
import type { DailyPilotScreenKey } from "../daily-operations-pilot/types";
import { dailyPilotStepNav } from "../daily-operations-pilot/steps";
import { getActiveProjectId } from "../memory/service";
import { loadSnapshot } from "../memory/persist";
import { parseDailyPilotDebriefPayload } from "../daily-pilot-debrief/storage";
import { dailyPilotScreenToNav } from "./screen-map";
import type { SimplificationBacklogItem, SimplificationSeverity } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function collectDistinctDebriefs(current: DailyPilotDebrief): DailyPilotDebrief[] {
  const byId = new Map<string, DailyPilotDebrief>();
  byId.set(current.id, current);
  const snap = loadSnapshot();
  const pid = getActiveProjectId();
  if (!pid) return [...byId.values()];
  const p = snap.projects[pid];
  if (!p) return [...byId.values()];
  for (const gid of p.generationIds) {
    const g = snap.generations[gid];
    if (!g || g.module !== "daily_pilot_debrief") continue;
    const d = parseDailyPilotDebriefPayload(g.content);
    if (d) byId.set(d.id, d);
  }
  return [...byId.values()];
}

function confusingCountsAcrossDebriefs(debriefs: DailyPilotDebrief[]): Record<DailyPilotScreenKey, number> {
  const counts = {} as Record<DailyPilotScreenKey, number>;
  for (const d of debriefs) {
    for (const s of d.confusingScreens) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return counts;
}

function splitLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function newItem(
  partial: Omit<SimplificationBacklogItem, "id" | "createdAt"> & Partial<Pick<SimplificationBacklogItem, "createdAt">>,
  now: number,
  seq: number,
): SimplificationBacklogItem {
  return {
    id: `sbi_${now}_${seq}`,
    createdAt: now,
    ...partial,
  };
}

function severityForConfusing(count: number): SimplificationSeverity {
  return count >= 2 ? "high" : "medium";
}

/**
 * Maps debrief fields only + debrief history counts — no new conclusions.
 */
export function deriveSimplificationItemsFromDebrief(debrief: DailyPilotDebrief, t: TFn): SimplificationBacklogItem[] {
  const now = Date.now();
  const debriefs = collectDistinctDebriefs(debrief);
  const confusingHits = confusingCountsAcrossDebriefs(debriefs);

  const items: SimplificationBacklogItem[] = [];
  let seq = 0;
  const push = (p: Omit<SimplificationBacklogItem, "id" | "createdAt">) => {
    items.push(newItem(p, now, seq++));
  };

  for (const screen of debrief.confusingScreens) {
    const hits = confusingHits[screen] ?? 0;
    const sev = severityForConfusing(hits);
    const screenLabel = t("dopilot.screen." + screen);
    const nav = dailyPilotScreenToNav(screen);
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "rename",
      title: t("simback.derive.renameTitle", { screen: screenLabel }),
      reason: t("simback.derive.confusingReason", { screen: screenLabel }),
      affectedModule: nav,
      severity: sev,
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "compress",
      title: t("simback.derive.compressTitle", { screen: screenLabel }),
      reason: t("simback.derive.confusingReason", { screen: screenLabel }),
      affectedModule: nav,
      severity: sev,
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "navigation",
      title: t("simback.derive.navigationTitle", { screen: screenLabel }),
      reason: t("simback.derive.confusingReason", { screen: screenLabel }),
      affectedModule: nav,
      severity: sev,
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
  }

  const hideDailyNav = new Set<string>();
  for (const stepId of debrief.skippedScreens) {
    const nav = dailyPilotStepNav(stepId);
    if (!nav) continue;
    if (hideDailyNav.has(nav)) continue;
    hideDailyNav.add(nav);
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "hide_from_daily",
      title: t("simback.derive.skippedHideTitle", { step: t("dopilot.step." + stepId) }),
      reason: t("simback.derive.skippedHideReason", { step: t("dopilot.step." + stepId) }),
      affectedModule: nav,
      severity: "low",
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
  }

  for (const screen of debrief.hideFromDailyUseCandidates) {
    const nav = dailyPilotScreenToNav(screen);
    if (hideDailyNav.has(nav)) continue;
    hideDailyNav.add(nav);
    const screenLabel = t("dopilot.screen." + screen);
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "hide_from_daily",
      title: t("simback.derive.hideCandidateTitle", { screen: screenLabel }),
      reason: t("simback.derive.hideCandidateReason", { screen: screenLabel }),
      affectedModule: nav,
      severity: "low",
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
  }

  for (const line of splitLines(debrief.missingData)) {
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "data_gap",
      title: t("simback.derive.dataGapTitle"),
      reason: line,
      affectedModule: "",
      severity: "medium",
      effort: "small",
      status: "open",
      suggestedFix: line,
      confidenceNote: debrief.confidenceNote,
    });
  }

  for (const line of splitLines(debrief.recommendedFixes)) {
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "workflow_fix",
      title: line.length > 72 ? line.slice(0, 71) + "…" : line,
      reason: t("simback.derive.workflowReason"),
      affectedModule: "",
      severity: debrief.pilotVerdict === "blocked" ? "critical" : "medium",
      effort: "small",
      status: "open",
      suggestedFix: line,
      confidenceNote: debrief.confidenceNote,
    });
  }

  for (const line of splitLines(debrief.recommendedSimplifications)) {
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "wording",
      title: line.length > 72 ? line.slice(0, 71) + "…" : line,
      reason: t("simback.derive.wordingReason"),
      affectedModule: "",
      severity: "low",
      effort: "small",
      status: "open",
      suggestedFix: line,
      confidenceNote: debrief.confidenceNote,
    });
  }

  if (debrief.pilotVerdict === "too_complex") {
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "navigation",
      title: t("simback.derive.tooComplexTitle"),
      reason: t("simback.derive.tooComplexReason"),
      affectedModule: "",
      severity: "high",
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
  }

  const morningFriction =
    debrief.confusingScreens.includes("morning_start") ||
    debrief.skippedScreens.includes("complete_morning_start") ||
    debrief.skippedScreens.includes("review_next_morning_preload");
  if (morningFriction) {
    push({
      sourceDebriefId: debrief.id,
      sourcePilotId: debrief.sourcePilotId,
      itemType: "workflow_fix",
      title: t("simback.derive.founderMorningTitle"),
      reason: t("simback.derive.founderMorningReason"),
      affectedModule: "morningStart",
      severity: "medium",
      effort: "small",
      status: "open",
      suggestedFix: "",
      confidenceNote: debrief.confidenceNote,
    });
  }

  return items;
}

export function itemFingerprint(item: SimplificationBacklogItem): string {
  return `${item.sourceDebriefId}|${item.itemType}|${item.title}|${item.reason}|${item.affectedModule}`;
}
