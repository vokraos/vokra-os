import type { AssortmentAction, UrgencyBand } from "./types";
import { formatAssortmentReasonLine } from "./prioritization/explain";

function esc(s: string): string {
  return s.replace(/\|/g, "\\|");
}

type TFn = (key: string, vars?: Record<string, string>) => string;

function urgencyTier(u: UrgencyBand): number {
  if (u === "critical" || u === "elevated") return 0;
  if (u === "medium") return 1;
  return 2;
}

function sortForExport(actions: readonly AssortmentAction[]): AssortmentAction[] {
  return [...actions].sort((a, b) => {
    const t = urgencyTier(a.urgencyBand) - urgencyTier(b.urgencyBand);
    if (t !== 0) return t;
    return b.executionPressure - a.executionPressure || b.leverageScore - a.leverageScore;
  });
}

function mdReasonBlock(t: TFn, a: AssortmentAction): string[] {
  const out: string[] = [];
  const pushSec = (labelKey: string, keys: string[]) => {
    if (keys.length === 0) return;
    out.push(`  - *${esc(t(labelKey))}*`);
    for (const k of keys) {
      out.push(`    - ${esc(formatAssortmentReasonLine(t, a, k))}`);
    }
  };
  pushSec("aa.why.section.priority", a.priorityReasons);
  pushSec("aa.why.section.leverage", a.leverageReasons);
  pushSec("aa.why.section.effort", a.effortReasons);
  pushSec("aa.why.section.risk", a.riskReasons);
  out.push(`  - *${esc(t("aa.why.trust"))}*: ${esc(formatAssortmentReasonLine(t, a, a.trustNote))}`);
  return out;
}

export function buildAssortmentMarkdownPlan(actions: readonly AssortmentAction[], t: TFn): string {
  const sorted = sortForExport(actions);
  const today = sorted.filter((a) => a.urgencyBand === "critical" || a.urgencyBand === "elevated").slice(0, 12);
  const qw = sorted.filter((a) => a.executiveQueues.includes("quick_wins")).slice(0, 4);
  const todayMerged = [...today];
  for (const q of qw) {
    if (!todayMerged.some((x) => x.id === q.id)) todayMerged.push(q);
    if (todayMerged.length >= 12) break;
  }

  const week = sorted
    .filter((a) => !todayMerged.some((x) => x.id === a.id))
    .filter((a) => a.urgencyBand === "medium" || (a.urgencyBand === "low" && a.executionPressure >= 44))
    .slice(0, 16);

  const later = sorted.filter((a) => !todayMerged.some((x) => x.id === a.id) && !week.some((x) => x.id === a.id)).slice(0, 14);

  const lines: string[] = [];
  lines.push(`# ${t("aa.export.md.title")}`);
  lines.push("");
  lines.push(`## ${t("aa.export.md.today")}`);
  for (const a of todayMerged) {
    lines.push(
      `- **${esc(t(a.titleKey, a.titleVars))}** — ${esc(t(a.reasonKey, a.reasonVars))} · ${a.urgencyBand} · L${a.leverageScore}/E${a.effortScore}`,
    );
    lines.push(...mdReasonBlock(t, a));
  }
  if (todayMerged.length === 0) lines.push(`- ${t("aa.export.md.todayEmpty")}`);
  lines.push("");
  lines.push(`## ${t("aa.export.md.week")}`);
  for (const a of week) {
    lines.push(`- ${esc(t(a.titleKey, a.titleVars))} (${a.urgencyBand})`);
    lines.push(...mdReasonBlock(t, a));
  }
  if (week.length === 0) lines.push(`- ${t("aa.export.md.weekEmpty")}`);
  lines.push("");
  lines.push(`## ${t("aa.export.md.later")}`);
  for (const a of later) {
    lines.push(`- ${esc(t(a.titleKey, a.titleVars))}`);
    lines.push(...mdReasonBlock(t, a));
  }
  if (later.length === 0) lines.push(`- ${t("aa.export.md.laterEmpty")}`);
  lines.push("");
  lines.push("---");
  lines.push(t("aa.export.md.footer", { n: String(actions.length) }));
  return lines.join("\n");
}

export function buildAssortmentJson(actions: readonly AssortmentAction[]): string {
  return JSON.stringify(
    {
      exportedAt: Date.now(),
      actions: actions.map((a) => ({
        id: a.id,
        sourceSnapshotId: a.sourceSnapshotId,
        actionType: a.actionType,
        category: a.category,
        titleKey: a.titleKey,
        reasonKey: a.reasonKey,
        titleVars: a.titleVars,
        reasonVars: a.reasonVars,
        affectedSkuIds: a.affectedSkuIds,
        affectedCardIds: a.affectedCardIds,
        corridor: a.corridor,
        marketplace: a.marketplace,
        priority: a.priority,
        expectedImpact: a.expectedImpact,
        difficulty: a.difficulty,
        ownerSystem: a.ownerSystem,
        suggestedDestination: a.suggestedDestination,
        status: a.status,
        createdAt: a.createdAt,
        leverageScore: a.leverageScore,
        effortScore: a.effortScore,
        operationalRisk: a.operationalRisk,
        executionPressure: a.executionPressure,
        confidence: a.confidence,
        expectedOutcome: a.expectedOutcome,
        urgencyBand: a.urgencyBand,
        executiveQueues: a.executiveQueues,
        priorityReasons: a.priorityReasons,
        leverageReasons: a.leverageReasons,
        riskReasons: a.riskReasons,
        effortReasons: a.effortReasons,
        trustNote: a.trustNote,
      })),
    },
    null,
    2,
  );
}

export function buildAssortmentCopySummary(actions: readonly AssortmentAction[], t: TFn): string {
  const n = actions.length;
  const crit = actions.filter((a) => a.priority === "critical").length;
  const neu = actions.filter((a) => a.status === "new").length;
  const qw = actions.filter((a) => a.status === "new" && a.executiveQueues.includes("quick_wins")).length;
  const top = [...actions]
    .filter((a) => a.status === "new")
    .sort((a, b) => b.executionPressure - a.executionPressure)[0];
  const topLine = top ? t(top.titleKey, top.titleVars) : "—";
  return t("aa.export.copySummary", { n: String(n), critical: String(crit), neu: String(neu), qw: String(qw), top: topLine });
}
