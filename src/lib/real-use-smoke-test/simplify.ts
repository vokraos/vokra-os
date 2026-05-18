import { stepsForScenario } from "./scenarios";
import type { StoredSmokeTestState } from "./store";
import type { SmokeTestSimplification, SmokeTestVerdict } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildSmokeTestSimplification(
  state: StoredSmokeTestState,
  t: TFn,
): SmokeTestSimplification {
  const defs = stepsForScenario(state.scenarioType);
  const allIds = defs.map((d) => d.id);
  const completed = new Set(state.completedSteps);
  const blocked = new Set(state.blockedSteps);
  const confusing = new Set(state.confusingScreens);

  const screensUsed = defs.filter((d) => completed.has(d.id)).map((d) => t(d.titleKey));
  const screensIgnored = defs
    .filter((d) => !completed.has(d.id) && !blocked.has(d.id))
    .map((d) => t(d.titleKey));

  const confusingAreas: string[] = [];
  for (const id of confusing) {
    const def = defs.find((d) => d.id === id);
    if (def) confusingAreas.push(t(def.titleKey));
  }
  for (const line of state.observedFriction) {
    if (line.trim()) confusingAreas.push(line.trim());
  }

  const missingData = [...state.missingData].filter(Boolean);

  const recommendedSimplifications: string[] = [];
  const recommendedNextBuildFixes: string[] = [];

  if (blocked.size >= 2) {
    recommendedSimplifications.push(t("rtest.simplify.blockedFlow"));
    recommendedNextBuildFixes.push(t("rtest.fix.reduceBlockers"));
  }
  if (confusing.size >= 2) {
    recommendedSimplifications.push(t("rtest.simplify.tooManyConfusing"));
    recommendedNextBuildFixes.push(t("rtest.fix.clarifyNavigation"));
  }
  if (screensIgnored.length >= Math.ceil(allIds.length / 2)) {
    recommendedSimplifications.push(t("rtest.simplify.skippedHalf"));
    recommendedNextBuildFixes.push(t("rtest.fix.shortenFlow"));
  }
  const dupNav = countDuplicateNavs(defs.map((d) => d.navId));
  if (dupNav >= 3) {
    recommendedSimplifications.push(t("rtest.simplify.sameScreenOften"));
    recommendedNextBuildFixes.push(t("rtest.fix.splitSections"));
  }
  if (missingData.length >= 2) {
    recommendedSimplifications.push(t("rtest.simplify.missingDataHeavy"));
    recommendedNextBuildFixes.push(t("rtest.fix.importPath"));
  }
  if (!recommendedSimplifications.length) {
    recommendedSimplifications.push(t("rtest.simplify.flowOk"));
  }
  if (!recommendedNextBuildFixes.length) {
    recommendedNextBuildFixes.push(t("rtest.fix.polishOnly"));
  }

  return {
    screensUsed,
    screensIgnored,
    confusingAreas: [...new Set(confusingAreas)],
    missingData,
    recommendedSimplifications,
    recommendedNextBuildFixes,
  };
}

function countDuplicateNavs(navIds: string[]): number {
  const c = new Map<string, number>();
  for (const n of navIds) c.set(n, (c.get(n) ?? 0) + 1);
  return [...c.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0);
}

export function deriveRecommendedFromVerdict(
  verdict: SmokeTestVerdict,
  simplification: SmokeTestSimplification,
  t: TFn,
): string[] {
  const base = [...simplification.recommendedSimplifications];
  if (verdict === "works") base.unshift(t("rtest.verdict.note.works"));
  if (verdict === "partial") base.unshift(t("rtest.verdict.note.partial"));
  if (verdict === "confusing") base.unshift(t("rtest.verdict.note.confusing"));
  if (verdict === "blocked") base.unshift(t("rtest.verdict.note.blocked"));
  return [...new Set(base)];
}
