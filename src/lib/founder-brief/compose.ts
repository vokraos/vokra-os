import type { NavId } from "../../types";
import { newFounderBriefId } from "./ids";
import { loadLastFounderBrief } from "./storage";
import type { FounderBriefGatherContext } from "./gather";
import type { BriefField, FounderCommandBrief } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function clip(s: string, max: number): string {
  const x = s.replace(/\s+/g, " ").trim();
  if (!x.length) return "—";
  return x.length <= max ? x : `${x.slice(0, max - 1)}…`;
}

function field(text: string, navId: NavId): BriefField {
  return { text: clip(text, 160), navId };
}

function actionTitle(a: { titleKey: string; titleVars?: Record<string, string> }, t: TFn): string {
  return t(a.titleKey, a.titleVars);
}

export function buildFounderCommandBrief(ctx: FounderBriefGatherContext, t: TFn): FounderCommandBrief {
  const snap = ctx.snapshot;
  const plan = ctx.executionPlan;

  const activeSnapshotSummary = snap
    ? t("fbrief.snap.summary", {
        sku: String(snap.skuEntities.length),
        cards: String(snap.cardEntities.length),
        id: snap.id.slice(-8),
      })
    : t("fbrief.snap.none");

  let topToday = field(t("fbrief.today.none"), "dataImport");
  if (plan?.todayActions[0]) {
    topToday = field(actionTitle(plan.todayActions[0], t), "assortmentActions");
  } else if (ctx.launchExecutionTop) {
    topToday = field(ctx.launchExecutionTop, "assortmentActions");
  } else if (ctx.collectionExecutionTop) {
    topToday = field(ctx.collectionExecutionTop, "assortmentActions");
  } else if (ctx.heroExecutionTop) {
    topToday = field(ctx.heroExecutionTop, "assortmentActions");
  }

  let topBlocked = field(t("fbrief.blocked.none"), "assortmentActions");
  if (ctx.launchPlan?.blockers[0]) {
    topBlocked = field(ctx.launchPlan.blockers[0].label, "launchOperations");
  } else if (plan?.holdActions[0]) {
    topBlocked = field(actionTitle(plan.holdActions[0], t), "assortmentActions");
  } else if (ctx.checklistBlocked > 0) {
    topBlocked = field(t("fbrief.blocked.checklist", { n: String(ctx.checklistBlocked) }), "assortmentActions");
  } else if (ctx.cleanupPlan && ctx.cleanupPlan.missingFieldGroups.length > 0) {
    topBlocked = field(
      t("fbrief.blocked.data", { n: String(ctx.cleanupPlan.missingFieldGroups.length) }),
      "dataCleanup",
    );
  }

  const leveragePool = plan
    ? [...plan.todayActions, ...plan.weekActions].sort((a, b) => b.leverageScore - a.leverageScore)
    : [];
  const topLeverage = leveragePool[0];
  const highestLeverageMove = topLeverage
    ? field(actionTitle(topLeverage, t), topLeverage.suggestedDestination ?? "assortmentActions")
    : ctx.intel?.actionQueue[0]
      ? field(t(ctx.intel.actionQueue[0].titleKey, ctx.intel.actionQueue[0].vars), "skuIntelligence")
      : field(t("fbrief.leverage.none"), "assortmentActions");

  let heroStatus = field(t("fbrief.hero.idle"), "competitiveMap");
  if (ctx.heroSnapshot?.hasActiveWorkflow) {
    heroStatus = field(
      t("fbrief.hero.active", { next: t(ctx.heroSnapshot.nextStepKey), query: ctx.heroSnapshot.query || "—" }),
      "heroCommand",
    );
  } else if (ctx.heroWorkflowActive) {
    heroStatus = field(t("fbrief.hero.map"), "competitiveMap");
  }

  let launchStatus = field(t("fbrief.launch.none"), "launchOperations");
  if (ctx.launchReview) {
    launchStatus = field(
      t("fbrief.launch.review", {
        state: t(`lrev.state.${ctx.launchReview.outcomeState}`),
        name: ctx.launchReview.collectionName,
      }),
      "launchOperations",
    );
  } else if (ctx.launchPlan) {
    launchStatus = field(
      t("fbrief.launch.plan", {
        readiness: t(`lops.readiness.${ctx.launchPlan.launchReadiness}`),
        name: ctx.launchPlan.collectionName,
      }),
      "launchOperations",
    );
  }

  let collectionStatus = field(t("fbrief.collection.none"), "collectionBuilder");
  if (ctx.collectionExecutionTop) {
    collectionStatus = field(ctx.collectionExecutionTop, "collectionBuilder");
  } else if (ctx.launchPlan) {
    collectionStatus = field(
      t("fbrief.collection.fromLaunch", { wave: ctx.launchPlan.heroWave.title }),
      "collectionBuilder",
    );
  }

  let dataStatus = field(t("fbrief.data.ok"), "dataCleanup");
  if (!snap) {
    dataStatus = field(t("fbrief.data.noSnap"), "dataImport");
  } else if (ctx.cleanupPlan) {
    const gaps = ctx.cleanupPlan.missingFieldGroups.length;
    const batch = ctx.cleanupPlan.batchActions.filter((a) => a.kind !== "ignore_defer").length;
    dataStatus = field(
      gaps > 0 ? t("fbrief.data.gaps", { gaps: String(gaps), batch: String(batch) }) : t("fbrief.data.ready"),
      "dataCleanup",
    );
  }

  let executionStatus = field(t("fbrief.exec.none"), "assortmentActions");
  if (plan) {
    executionStatus = field(
      t("fbrief.exec.plan", {
        today: String(plan.todayActions.length),
        week: String(plan.weekActions.length),
        hold: String(plan.holdActions.length),
      }),
      "assortmentActions",
    );
  }

  let memorySignal = field(t("fbrief.memory.quiet"), "memory");
  if (ctx.learningTop) {
    memorySignal = field(t(ctx.learningTop), "memory");
  } else if (ctx.launchReview?.learningReinforcement[0]) {
    memorySignal = field(clip(ctx.launchReview.learningReinforcement[0], 120), "memory");
  }

  const holdBits: string[] = [];
  if (plan && plan.holdActions.length > 0) {
    holdBits.push(t("fbrief.dnt.hold", { n: String(plan.holdActions.length) }));
  }
  if (ctx.launchReview?.outcomeState === "successful") {
    holdBits.push(t("fbrief.dnt.launchOk"));
  }
  if (ctx.launchPlan?.launchReadiness === "blocked") {
    holdBits.push(t("fbrief.dnt.launchBlocked"));
  }
  const doNotTouch = field(
    holdBits.length ? holdBits.join(" · ") : t("fbrief.dnt.clear"),
    plan?.holdActions.length ? "assortmentActions" : "launchOperations",
  );

  const routeCandidates: { nav: NavId; weight: number; text: string }[] = [];
  if (topBlocked.navId) routeCandidates.push({ nav: topBlocked.navId, weight: 90, text: topBlocked.text });
  if (topToday.navId !== "dataImport") routeCandidates.push({ nav: topToday.navId, weight: 85, text: topToday.text });
  routeCandidates.push({ nav: highestLeverageMove.navId, weight: 80, text: highestLeverageMove.text });
  if (ctx.heroSnapshot?.hasActiveWorkflow) routeCandidates.push({ nav: "heroCommand", weight: 75, text: heroStatus.text });
  if (ctx.launchPlan?.launchReadiness === "blocked" || ctx.launchPlan?.launchReadiness === "fragile") {
    routeCandidates.push({ nav: "launchOperations", weight: 88, text: launchStatus.text });
  }
  routeCandidates.sort((a, b) => b.weight - a.weight);
  const best = routeCandidates[0] ?? { nav: "assortmentActions" as NavId, text: topToday.text };
  const nextBestRoute = field(t("fbrief.route", { target: best.text }), best.nav);

  const warnings = plan?.warnings.length ?? 0;
  const confidenceNote =
    !snap
      ? t("fbrief.confidence.noSnap")
      : warnings > 0
        ? t("fbrief.confidence.warn", { n: String(warnings) })
        : ctx.launchPlan && ctx.launchPlan.launchReadinessScore < 55
          ? t("fbrief.confidence.launchLow", { n: String(ctx.launchPlan.launchReadinessScore) })
          : t("fbrief.confidence.ok");

  const prev = loadLastFounderBrief();
  let sinceLastReview = t("fbrief.change.first");
  if (prev) {
    const shifts: string[] = [];
    if (prev.topTodayAction.text !== topToday.text) shifts.push(t("fbrief.change.today"));
    if (prev.topBlockedItem.text !== topBlocked.text) shifts.push(t("fbrief.change.blocked"));
    if (prev.launchStatus.text !== launchStatus.text) shifts.push(t("fbrief.change.launch"));
    if (prev.heroStatus.text !== heroStatus.text) shifts.push(t("fbrief.change.hero"));
    sinceLastReview = shifts.length ? shifts.join(" · ") : t("fbrief.change.stable");
  }

  return {
    id: newFounderBriefId(),
    createdAt: Date.now(),
    activeSnapshotSummary,
    topTodayAction: topToday,
    topBlockedItem: topBlocked,
    highestLeverageMove,
    heroStatus,
    launchStatus,
    collectionStatus,
    dataStatus,
    executionStatus,
    memorySignal,
    doNotTouch,
    nextBestRoute,
    confidenceNote,
    sinceLastReview,
  };
}
