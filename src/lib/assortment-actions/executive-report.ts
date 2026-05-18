import type { EntitySnapshot } from "../entity-snapshot/types";
import { stableActionId } from "./hash";
import type {
  AssortmentAction,
  AssortmentExecutionLearningSignal,
  AssortmentExecutionPlan,
  AssortmentExecutionReview,
  AssortmentChecklistItem,
  AssortmentExecutiveReport,
  AssortmentExecutiveReportTopAction,
  AssortmentPlanChecklistSection,
} from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function bucketForAction(plan: AssortmentExecutionPlan, actionId: string): AssortmentPlanChecklistSection | "other" {
  if (plan.todayActions.some((a) => a.id === actionId)) return "today";
  if (plan.weekActions.some((a) => a.id === actionId)) return "week";
  if (plan.laterActions.some((a) => a.id === actionId)) return "later";
  if (plan.holdActions.some((a) => a.id === actionId)) return "hold";
  return "other";
}

function actionTitle(t: TFn, a: AssortmentAction): string {
  return t(a.titleKey, a.titleVars);
}

/** Compact human-readable report of the assortment execution loop (no analytics APIs). */
export function buildAssortmentExecutiveReport(
  snapshot: EntitySnapshot,
  actions: readonly AssortmentAction[],
  plan: AssortmentExecutionPlan,
  _checklistMap: Record<string, AssortmentChecklistItem>,
  review: AssortmentExecutionReview | null,
  learningSignals: readonly AssortmentExecutionLearningSignal[],
  t: TFn,
): AssortmentExecutiveReport {
  const now = Date.now();
  const reportId = stableActionId(["exec-report", snapshot.id, String(plan.id), String(now)]);

  const snapshotSummary = t("aa.report.snapshotSummary", {
    idShort: snapshot.id.slice(-10),
    skus: String(snapshot.skuEntities.length),
    cards: String(snapshot.cardEntities.length),
    corridors: String(snapshot.corridors?.length ?? 0),
    importRows: String(snapshot.rowCountIncluded ?? 0),
  });

  const planSummary = t("aa.report.planSummary", {
    today: String(plan.todayActions.length),
    week: String(plan.weekActions.length),
    later: String(plan.laterActions.length),
    hold: String(plan.holdActions.length),
    focus: t(plan.estimatedFocus),
    bottleneck: t(plan.bottleneck),
  });

  let executionSummary: string;
  if (review) {
    executionSummary = t("aa.report.executionSummary", {
      pct: String(review.completionRate),
      done: String(review.doneItems.length),
      blocked: String(review.blockedItems.length),
      deferred: String(review.deferredItems.length),
      stale: String(review.staleItems.length),
    });
  } else {
    executionSummary = t("aa.report.executionNoChecklist");
  }

  const blockerSummary = review ? t(review.blockerSummaryKey, review.blockerSummaryVars) : t("aa.report.blockerNone");

  const carryForwardSummary = t("aa.report.carryForwardSummary", {
    carried: String(plan.carriedForwardActionIds.length),
    repeatedBlockers: String(plan.repeatedBlockers.length),
    strategy: t(plan.carryStrategy),
  });

  let learningSummary: string;
  if (learningSignals.length === 0) {
    learningSummary = t("aa.report.learningEmpty");
  } else {
    const parts = learningSignals.slice(0, 3).map((sig) => {
      const typeLabel = t(`aa.type.${sig.actionType}`);
      const v = {
        type: typeLabel,
        n: sig.reasonVars?.n ?? "",
        ...(sig.titleVars ?? {}),
        ...(sig.reasonVars ?? {}),
      };
      return t(sig.title, { ...v, type: typeLabel });
    });
    learningSummary = parts.join(" · ");
  }

  const nextFocus = review ? t(review.nextSuggestedFocusKey) : t(plan.estimatedFocus);

  const topActions: AssortmentExecutiveReportTopAction[] = [];
  const seen = new Set<string>();
  const pushFrom = (list: readonly AssortmentAction[]) => {
    for (const a of list) {
      if (topActions.length >= 5) return;
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      topActions.push({
        id: a.id,
        title: actionTitle(t, a),
        bucket: bucketForAction(plan, a.id),
      });
    }
  };
  pushFrom(plan.todayActions);
  pushFrom(plan.weekActions);

  const warnings = [...plan.warnings, ...plan.continuityWarnings].map((w) => t(w));

  const openCount = actions.filter((a) => a.status !== "done" && a.status !== "rejected").length;
  const confidenceNote = t("aa.report.confidenceNote", {
    open: String(openCount),
    trust: t("aa.trust.noSalesData"),
  });

  return {
    id: reportId,
    sourceSnapshotId: snapshot.id,
    createdAt: now,
    snapshotSummary,
    planSummary,
    executionSummary,
    blockerSummary,
    carryForwardSummary,
    learningSummary,
    nextFocus,
    topActions,
    warnings,
    confidenceNote,
  };
}

function bucketLabel(t: TFn, b: AssortmentExecutiveReportTopAction["bucket"]): string {
  if (b === "other") return t("aa.report.bucketOther");
  return t(`aa.plan.section.${b}`);
}

export function buildAssortmentExecutiveReportPlain(report: AssortmentExecutiveReport, t: TFn): string {
  const lines: string[] = [];
  lines.push(t("aa.report.exportTitle"));
  lines.push("");
  lines.push(t("aa.report.sectionSummary"));
  lines.push(report.snapshotSummary);
  lines.push("");
  lines.push(t("aa.report.sectionPlanned"));
  lines.push(report.planSummary);
  lines.push("");
  lines.push(t("aa.report.sectionExecution"));
  lines.push(report.executionSummary);
  lines.push("");
  lines.push(t("aa.report.sectionBlocked"));
  lines.push(report.blockerSummary);
  lines.push("");
  lines.push(t("aa.report.sectionCarry"));
  lines.push(report.carryForwardSummary);
  lines.push("");
  lines.push(t("aa.report.sectionLearned"));
  lines.push(report.learningSummary);
  lines.push("");
  lines.push(t("aa.report.sectionNext"));
  lines.push(report.nextFocus);
  lines.push("");
  lines.push(t("aa.report.sectionTopActions"));
  for (const a of report.topActions) {
    lines.push(`- [${bucketLabel(t, a.bucket)}] ${a.title}`);
  }
  if (report.topActions.length === 0) lines.push("—");
  lines.push("");
  if (report.warnings.length > 0) {
    lines.push(t("aa.report.sectionWarnings"));
    for (const w of report.warnings) lines.push(`- ${w}`);
    lines.push("");
  }
  lines.push(t("aa.report.sectionConfidence"));
  lines.push(report.confidenceNote);
  return lines.join("\n");
}

function mdEsc(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/#/g, "\\#");
}

export function buildAssortmentExecutiveReportMarkdown(report: AssortmentExecutiveReport, t: TFn): string {
  const lines: string[] = [];
  lines.push(`# ${t("aa.report.exportTitle")}`);
  lines.push("");
  lines.push(`## ${t("aa.report.sectionSummary")}`);
  lines.push(mdEsc(report.snapshotSummary));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionPlanned")}`);
  lines.push(mdEsc(report.planSummary));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionExecution")}`);
  lines.push(mdEsc(report.executionSummary));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionBlocked")}`);
  lines.push(mdEsc(report.blockerSummary));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionCarry")}`);
  lines.push(mdEsc(report.carryForwardSummary));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionLearned")}`);
  lines.push(mdEsc(report.learningSummary));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionNext")}`);
  lines.push(mdEsc(report.nextFocus));
  lines.push("");
  lines.push(`## ${t("aa.report.sectionTopActions")}`);
  for (const a of report.topActions) {
    lines.push(`- **${mdEsc(bucketLabel(t, a.bucket))}** — ${mdEsc(a.title)}`);
  }
  if (report.topActions.length === 0) lines.push("_—_");
  lines.push("");
  if (report.warnings.length > 0) {
    lines.push(`## ${t("aa.report.sectionWarnings")}`);
    for (const w of report.warnings) lines.push(`- ${mdEsc(w)}`);
    lines.push("");
  }
  lines.push(`## ${t("aa.report.sectionConfidence")}`);
  lines.push(mdEsc(report.confidenceNote));
  return lines.join("\n");
}

export function buildAssortmentExecutiveReportJson(report: AssortmentExecutiveReport): string {
  return JSON.stringify(report, null, 2);
}
