import type { AssortmentExecutionPlan, AssortmentExecutionReview } from "./types";

function esc(s: string): string {
  return s.replace(/\|/g, "\\|");
}

type TFn = (key: string, vars?: Record<string, string>) => string;

function planSection(t: TFn, titleKey: string, actions: readonly { titleKey: string; titleVars: Record<string, string>; reasonKey: string; reasonVars: Record<string, string>; expectedOutcome: string; difficulty: string; confidence: number }[]): string[] {
  const lines: string[] = [];
  lines.push(`### ${esc(t(titleKey))}`);
  if (actions.length === 0) {
    lines.push(`- ${esc(t("aa.plan.export.empty"))}`);
    lines.push("");
    return lines;
  }
  for (const a of actions) {
    lines.push(`- **${esc(t(a.titleKey, a.titleVars))}**`);
    lines.push(`  - ${esc(t(a.reasonKey, a.reasonVars))}`);
    lines.push(
      `  - ${esc(
        t("aa.plan.export.meta", {
          outcome: t(`aa.outcome.${a.expectedOutcome}`),
          difficulty: t("aa.meta.difficulty", { v: a.difficulty }),
          confidence: String(a.confidence),
        }),
      )}`,
    );
  }
  lines.push("");
  return lines;
}

function checklistTitlesForExport(t: TFn, items: readonly { title: string; reason: string; expectedOutcome: string }[]): string[] {
  const lines: string[] = [];
  if (items.length === 0) {
    lines.push(`- ${esc(t("aa.review.export.empty"))}`);
    return lines;
  }
  for (const it of items) {
    lines.push(`- **${esc(it.title)}**`);
    lines.push(`  - ${esc(it.reason)}`);
    const outcomeLabel = t(`aa.outcome.${it.expectedOutcome}`);
    lines.push(`  - ${esc(t("aa.review.export.outcomeLine", { outcome: outcomeLabel }))}`);
  }
  return lines;
}

function executionReviewMarkdownSection(t: TFn, review: AssortmentExecutionReview): string[] {
  const lines: string[] = [];
  lines.push(`## ${esc(t("aa.review.export.title"))}`);
  lines.push("");
  lines.push(`- ${esc(t("aa.review.export.completion", { n: String(review.completionRate) }))}`);
  lines.push(`- ${esc(t(review.blockerSummaryKey, review.blockerSummaryVars))}`);
  lines.push("");

  const doneToday = review.doneItems.filter((x) => x.section === "today");
  lines.push(`### ${esc(t("aa.review.export.doneToday"))}`);
  lines.push(...checklistTitlesForExport(t, doneToday));
  lines.push("");

  lines.push(`### ${esc(t("aa.review.export.blocked"))}`);
  lines.push(...checklistTitlesForExport(t, review.blockedItems));
  lines.push("");

  lines.push(`### ${esc(t("aa.review.export.deferred"))}`);
  lines.push(...checklistTitlesForExport(t, review.deferredItems));
  lines.push("");

  const carryMap = new Map<string, (typeof review.deferredItems)[number]>();
  for (const r of review.deferredItems) carryMap.set(r.id, r);
  for (const r of review.staleItems) carryMap.set(r.id, r);
  const carry = [...carryMap.values()];
  lines.push(`### ${esc(t("aa.review.export.carryForward"))}`);
  lines.push(...checklistTitlesForExport(t, carry));
  lines.push("");

  lines.push(`### ${esc(t("aa.review.export.nextFocus"))}`);
  lines.push(`- ${esc(t(review.nextSuggestedFocusKey))}`);
  lines.push("");

  lines.push(`### ${esc(t("aa.review.export.suggestions"))}`);
  for (const k of review.nextPlanSuggestions) lines.push(`- ${esc(t(k))}`);
  lines.push("");

  lines.push(`### ${esc(t("aa.review.export.learning"))}`);
  for (const k of review.learningNotes) lines.push(`- ${esc(t(k))}`);
  lines.push("");

  return lines;
}

function carryForwardPlanMarkdown(t: TFn, plan: AssortmentExecutionPlan): string[] {
  const lines: string[] = [];
  const hasCarry =
    plan.carriedForwardActionIds.length > 0 ||
    plan.repeatedBlockers.length > 0 ||
    plan.continuityWarnings.length > 0 ||
    plan.previousCompletionRate !== null;
  if (!hasCarry) return lines;

  lines.push(`## ${esc(t("aa.carry.export.title"))}`);
  lines.push("");
  lines.push(`- **${esc(t("aa.carry.export.strategy"))}** ${esc(t(plan.carryStrategy))}`);
  if (plan.previousCompletionRate !== null) {
    lines.push(`- ${esc(t("aa.carry.export.prevRate", { n: String(plan.previousCompletionRate) }))}`);
  }
  lines.push("");
  if (plan.carriedForwardActionIds.length > 0) {
    lines.push(`### ${esc(t("aa.carry.export.carried"))}`);
    lines.push(`- ${esc(t("aa.carry.export.idCount", { n: String(plan.carriedForwardActionIds.length) }))}`);
    lines.push("");
  }
  if (plan.repeatedBlockers.length > 0) {
    lines.push(`### ${esc(t("aa.carry.export.repeated"))}`);
    lines.push(`- ${esc(t("aa.carry.export.idCount", { n: String(plan.repeatedBlockers.length) }))}`);
    lines.push("");
  }
  if (plan.continuityWarnings.length > 0) {
    lines.push(`### ${esc(t("aa.carry.export.continuity"))}`);
    for (const w of plan.continuityWarnings) lines.push(`- ${esc(t(w))}`);
    lines.push("");
  }
  return lines;
}

export function buildExecutionPlanMarkdown(plan: AssortmentExecutionPlan, t: TFn, review?: AssortmentExecutionReview | null): string {
  const lines: string[] = [];
  lines.push(`# ${t("aa.plan.export.mdTitle")}`);
  lines.push("");
  lines.push(t("aa.plan.export.head", { focus: t(plan.estimatedFocus), bottleneck: t(plan.bottleneck), outcome: t(plan.expectedOutcome) }));
  lines.push("");
  if (plan.warnings.length > 0) {
    lines.push(`## ${t("aa.plan.export.warnings")}`);
    for (const w of plan.warnings) lines.push(`- ${esc(t(w))}`);
    lines.push("");
  }
  lines.push(...carryForwardPlanMarkdown(t, plan));
  lines.push(...planSection(t, "aa.plan.section.today", plan.todayActions));
  lines.push(...planSection(t, "aa.plan.section.week", plan.weekActions));
  lines.push(...planSection(t, "aa.plan.section.later", plan.laterActions));
  lines.push(...planSection(t, "aa.plan.section.hold", plan.holdActions));
  if (review) {
    lines.push(...executionReviewMarkdownSection(t, review));
  }
  lines.push("---");
  lines.push(t("aa.plan.export.footer", { id: plan.id.slice(-12) }));
  return lines.join("\n");
}

export function buildExecutionPlanJson(plan: AssortmentExecutionPlan): string {
  return JSON.stringify(
    {
      exportedAt: Date.now(),
      plan: {
        id: plan.id,
        sourceSnapshotId: plan.sourceSnapshotId,
        createdAt: plan.createdAt,
        estimatedFocus: plan.estimatedFocus,
        bottleneck: plan.bottleneck,
        expectedOutcome: plan.expectedOutcome,
        warnings: plan.warnings,
        carriedForwardActionIds: plan.carriedForwardActionIds,
        repeatedBlockers: plan.repeatedBlockers,
        previousCompletionRate: plan.previousCompletionRate,
        continuityWarnings: plan.continuityWarnings,
        carryStrategy: plan.carryStrategy,
        todayActionIds: plan.todayActions.map((a) => a.id),
        weekActionIds: plan.weekActions.map((a) => a.id),
        laterActionIds: plan.laterActions.map((a) => a.id),
        holdActionIds: plan.holdActions.map((a) => a.id),
        todayActions: plan.todayActions,
        weekActions: plan.weekActions,
        laterActions: plan.laterActions,
        holdActions: plan.holdActions,
      },
    },
    null,
    2,
  );
}

/** Compact clipboard text for “today” slice + counts (no calendar). */
export function buildAssortmentDailyPlanCopy(plan: AssortmentExecutionPlan, t: TFn): string {
  const lines: string[] = [t("aa.plan.copy.dailyTitle"), ""];
  lines.push(t("aa.plan.copy.counts", { week: String(plan.weekActions.length), later: String(plan.laterActions.length), hold: String(plan.holdActions.length) }));
  lines.push("");
  if (plan.todayActions.length === 0) {
    lines.push(t("aa.plan.digest.noToday"));
  } else {
    for (const a of plan.todayActions) {
      lines.push(`• ${t(a.titleKey, a.titleVars)}`);
      lines.push(`  ${t(a.reasonKey, a.reasonVars)}`);
      lines.push(
        `  ${t("aa.plan.copy.itemMeta", {
          outcome: t(`aa.outcome.${a.expectedOutcome}`),
          difficulty: t("aa.meta.difficulty", { v: a.difficulty }),
          confidence: String(a.confidence),
        })}`,
      );
      lines.push("");
    }
  }
  if (plan.warnings.length > 0) {
    lines.push(t("aa.plan.copy.warningsHeader"));
    for (const w of plan.warnings) lines.push(`• ${t(w)}`);
  }
  lines.push("");
  lines.push(t(plan.expectedOutcome));
  return lines.join("\n").trim();
}
