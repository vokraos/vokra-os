import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import {
  ASSORTMENT_ACTIONS_EVENT,
  ASSORTMENT_ACTIONS_MEMORY_SCHEMA,
  type AssortmentAction,
  type AssortmentActionCategory,
  type AssortmentActionStatus,
  type AssortmentChecklistItem,
  type AssortmentChecklistItemStatus,
  type AssortmentExecutionPlan,
  type AssortmentExecutionReview,
  type AssortmentPlanChecklistSection,
  type ExecutiveQueueId,
  type AssortmentExecutionLearningSignal,
  type AssortmentExecutiveReport,
  buildAssortmentCopySummary,
  buildAssortmentDailyPlanCopy,
  buildAssortmentExecutionPlan,
  buildAssortmentExecutionReview,
  buildAssortmentExecutiveReport,
  buildAssortmentExecutiveReportJson,
  buildAssortmentExecutiveReportMarkdown,
  buildAssortmentExecutiveReportPlain,
  buildAssortmentJson,
  buildAssortmentMarkdownPlan,
  buildAssortmentPriorityDigest,
  buildExecutionPlanJson,
  buildExecutionPlanMarkdown,
  commitAssortmentExecutionLearning,
  deriveAssortmentActions,
  EXECUTIVE_QUEUE_ORDER,
  exportAssortmentChecklistForMemory,
  exportLearningSignalsForMemory,
  formatAssortmentReasonLine,
  getAssortmentChecklistMap,
  getAssortmentChecklistProgress,
  getCorridorPrioritySignalsFromIntel,
  getTopLearningSignals,
  mergeStatusesIntoActions,
  setAssortmentActionStatus,
  setAssortmentChecklistStatus,
  snapshotHasAssortmentChecklist,
  summarizeAssortmentActions,
  syncAssortmentChecklistFromPlan,
} from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT, deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../lib/entity-snapshot";
import { consumeAssortmentSerpHint } from "../lib/competitor-serp";
import {
  exportHeroExecutionActionsForMemory,
  getHeroExecutionActions,
  mergeHeroExecutionIntoAssortmentActions,
  setHeroExecutionActionStatus,
  type HeroExecutionActionStatus,
} from "../lib/hero-assortment-bridge";
import {
  exportCollectionExecutionActionsForMemory,
  getCollectionExecutionActions,
  mergeCollectionExecutionIntoAssortmentActions,
  setCollectionExecutionActionStatus,
  type CollectionExecutionActionStatus,
} from "../lib/collection-assortment-bridge";
import {
  exportLaunchExecutionActionsForMemory,
  getLaunchExecutionActions,
  mergeLaunchExecutionIntoAssortmentActions,
  setLaunchExecutionActionStatus,
  type LaunchExecutionActionStatus,
} from "../lib/launch-ops";

type Props = { onNavigate: (id: NavId) => void };

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stripBar(label: string, value: number) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="aa-strip">
      <div className="aa-strip__lab">
        <span>{label}</span>
        <span>{pct}</span>
      </div>
      <div className="aa-strip__track">
        <div className="aa-strip__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AssortmentActionsView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [learnTick, setLearnTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const learnCtx = useRef<{ snapshotId: string; executionPlan: AssortmentExecutionPlan | null; actions: AssortmentAction[] }>(
    { snapshotId: "", executionPlan: null, actions: [] },
  );

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    const hint = consumeAssortmentSerpHint();
    if (!hint) return;
    if (hint.heroRefreshFromGap) {
      const summary = (hint.heroRefreshSummary ?? "").trim() || hint.query;
      const fatigue = (hint.heroFatigueSummary ?? "").trim();
      setToast(
        fatigue
          ? `${t("gap.assortmentRefreshToast", { summary: summary.slice(0, 140) })} · ${fatigue.slice(0, 120)}`
          : t("gap.assortmentRefreshToast", { summary: summary.slice(0, 160) }),
      );
    } else {
      setToast(t("serp.assortmentContextToast", { query: hint.query }));
    }
    window.setTimeout(() => setToast(null), 4500);
  }, [t]);

  const snapshot = useMemo(() => getActiveEntitySnapshot(), [tick]);

  const heroExecutionRows = useMemo(
    () => (snapshot ? getHeroExecutionActions(snapshot.id) : []),
    [snapshot, tick],
  );

  const collectionExecutionRows = useMemo(
    () => (snapshot ? getCollectionExecutionActions(snapshot.id) : []),
    [snapshot, tick],
  );

  const launchExecutionRows = useMemo(
    () => (snapshot ? getLaunchExecutionActions(snapshot.id) : []),
    [snapshot, tick],
  );

  const actions = useMemo(() => {
    if (!snapshot) return [];
    const base = deriveAssortmentActions(snapshot);
    const merged = mergeStatusesIntoActions(base, snapshot.id);
    const withHero = mergeHeroExecutionIntoAssortmentActions(snapshot, merged, heroExecutionRows);
    const withCollection = mergeCollectionExecutionIntoAssortmentActions(snapshot, withHero, collectionExecutionRows);
    return mergeLaunchExecutionIntoAssortmentActions(snapshot, withCollection, launchExecutionRows);
  }, [snapshot, tick, heroExecutionRows, collectionExecutionRows, launchExecutionRows]);

  const heroWorkflowActions = useMemo(() => actions.filter((a) => a.heroDerived), [actions]);
  const collectionWorkflowActions = useMemo(() => actions.filter((a) => a.collectionDerived), [actions]);
  const launchWorkflowActions = useMemo(() => actions.filter((a) => a.launchDerived), [actions]);

  const summary = useMemo(() => summarizeAssortmentActions(actions), [actions]);

  const intel = useMemo(() => (snapshot ? deriveSnapshotIntelligence(snapshot) : null), [snapshot]);

  const corridorHints = useMemo(() => (intel ? getCorridorPrioritySignalsFromIntel(intel) : null), [intel]);

  const priorityDigest = useMemo(
    () => (actions.length > 0 && corridorHints ? buildAssortmentPriorityDigest(actions, corridorHints) : null),
    [actions, corridorHints],
  );

  const executionPlan = useMemo<AssortmentExecutionPlan | null>(
    () => (snapshot && actions.length > 0 ? buildAssortmentExecutionPlan(snapshot.id, actions) : null),
    [snapshot, actions],
  );

  const planSyncKey = useMemo(() => {
    if (!executionPlan) return "";
    const sig = (list: AssortmentAction[]) => list.map((a) => a.id).join(",");
    return `${sig(executionPlan.todayActions)}|${sig(executionPlan.weekActions)}|${sig(executionPlan.laterActions)}|${sig(executionPlan.holdActions)}`;
  }, [executionPlan]);

  useLayoutEffect(() => {
    if (!snapshot || !executionPlan) return;
    syncAssortmentChecklistFromPlan(snapshot.id, executionPlan, t);
  }, [snapshot, executionPlan, planSyncKey, t]);

  const checklistMap = useMemo(
    () => (snapshot ? getAssortmentChecklistMap(snapshot.id) : {}),
    [snapshot, tick, executionPlan, planSyncKey],
  );

  const checklistProgress = useMemo(
    () => (snapshot && executionPlan ? getAssortmentChecklistProgress(snapshot.id, executionPlan) : null),
    [snapshot, executionPlan, tick],
  );

  const checklistLearningSig = useMemo(() => {
    if (!snapshot) return "";
    return JSON.stringify(
      Object.values(checklistMap)
        .filter((r) => r.sourceSnapshotId === snapshot.id)
        .map((r) => [r.sourceActionId, r.status, Boolean(r.stale)] as const)
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    );
  }, [snapshot, checklistMap]);

  useLayoutEffect(() => {
    learnCtx.current = {
      snapshotId: snapshot?.id ?? "",
      executionPlan,
      actions,
    };
  }, [snapshot?.id, executionPlan, actions]);

  useEffect(() => {
    const sid = snapshot?.id;
    if (!sid) return;
    const tmr = window.setTimeout(() => {
      const { snapshotId, executionPlan: p, actions: acts } = learnCtx.current;
      if (!snapshotId || !p || acts.length === 0) return;
      const eligible = acts.filter((a) => a.status !== "done" && a.status !== "rejected");
      commitAssortmentExecutionLearning(snapshotId, eligible, p, getAssortmentChecklistMap(snapshotId));
      setLearnTick((x) => x + 1);
      window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
    }, 1400);
    return () => window.clearTimeout(tmr);
  }, [snapshot?.id, checklistLearningSig, planSyncKey]);

  const topLearningSignals = useMemo((): AssortmentExecutionLearningSignal[] => {
    if (!snapshot) return [];
    return getTopLearningSignals(snapshot.id, 3);
  }, [snapshot, tick, learnTick]);

  const staleChecklistRows = useMemo(() => {
    if (!snapshot) return [];
    return Object.values(checklistMap).filter((r) => r.sourceSnapshotId === snapshot.id && r.stale);
  }, [snapshot, checklistMap]);

  const executionReview = useMemo<AssortmentExecutionReview | null>(() => {
    if (!snapshot || !executionPlan || !snapshotHasAssortmentChecklist(snapshot.id)) return null;
    return buildAssortmentExecutionReview(snapshot.id, executionPlan, checklistMap, t);
  }, [snapshot, executionPlan, checklistMap, t]);

  const learningForReport = useMemo(
    () => (snapshot ? getTopLearningSignals(snapshot.id, 8) : []),
    [snapshot, tick, learnTick],
  );

  const executiveReport = useMemo((): AssortmentExecutiveReport | null => {
    if (!snapshot || !executionPlan) return null;
    return buildAssortmentExecutiveReport(
      snapshot,
      actions,
      executionPlan,
      checklistMap,
      executionReview,
      learningForReport,
      t,
    );
  }, [snapshot, actions, executionPlan, checklistMap, executionReview, learningForReport, t]);

  const reviewCarryRows = useMemo(() => {
    if (!executionReview) return [];
    const m = new Map<string, AssortmentChecklistItem>();
    for (const r of executionReview.deferredItems) m.set(r.id, r);
    for (const r of executionReview.staleItems) m.set(r.id, r);
    return [...m.values()];
  }, [executionReview]);

  const queueBuckets = useMemo(() => {
    const init = {} as Record<ExecutiveQueueId, AssortmentAction[]>;
    for (const q of EXECUTIVE_QUEUE_ORDER) init[q] = [];
    for (const a of actions) {
      for (const q of a.executiveQueues) {
        init[q].push(a);
      }
    }
    return init;
  }, [actions]);

  const byCat = useMemo(() => {
    const m: Record<AssortmentActionCategory, AssortmentAction[]> = {
      fix: [],
      growth: [],
      risk: [],
      visual: [],
      fbo: [],
      collection: [],
    };
    for (const a of actions) {
      if (a.heroDerived || a.collectionDerived) continue;
      m[a.category].push(a);
    }
    return m;
  }, [actions]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const setStatus = (id: string, status: AssortmentActionStatus) => {
    if (!snapshot) return;
    setAssortmentActionStatus(snapshot.id, id, status);
    const heroRow = heroExecutionRows.find((h) => h.id === id);
    if (heroRow) {
      const heroStatus: HeroExecutionActionStatus =
        status === "rejected" ? "deferred" : (status as HeroExecutionActionStatus);
      setHeroExecutionActionStatus(snapshot.id, id, heroStatus);
    }
    const colRow = collectionExecutionRows.find((c) => c.id === id);
    if (colRow) {
      const colStatus: CollectionExecutionActionStatus =
        status === "rejected" ? "deferred" : (status as CollectionExecutionActionStatus);
      setCollectionExecutionActionStatus(snapshot.id, id, colStatus);
    }
    const launchRow = launchExecutionRows.find((l) => l.id === id);
    if (launchRow) {
      const launchStatus: LaunchExecutionActionStatus =
        status === "rejected" ? "deferred" : (status as LaunchExecutionActionStatus);
      setLaunchExecutionActionStatus(snapshot.id, id, launchStatus);
    }
    setTick((x) => x + 1);
  };

  const saveMemory = () => {
    if (!snapshot || actions.length === 0) return;
    const statuses = Object.fromEntries(actions.map((a) => [a.id, a.status])) as Record<string, AssortmentActionStatus>;
    const digest =
      corridorHints != null ? buildAssortmentPriorityDigest(actions, corridorHints) : undefined;
    const plan = buildAssortmentExecutionPlan(snapshot.id, actions);
    const eligible = actions.filter((a) => a.status !== "done" && a.status !== "rejected");
    commitAssortmentExecutionLearning(snapshot.id, eligible, plan, getAssortmentChecklistMap(snapshot.id));
    setLearnTick((x) => x + 1);
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
    const checklistItems = exportAssortmentChecklistForMemory(snapshot.id);
    const executionReviewPayload =
      snapshotHasAssortmentChecklist(snapshot.id) && executionPlan
        ? buildAssortmentExecutionReview(snapshot.id, executionPlan, getAssortmentChecklistMap(snapshot.id), t)
        : null;
    const learningSnap = getTopLearningSignals(snapshot.id, 8);
    const executiveReportSnapshot = buildAssortmentExecutiveReport(
      snapshot,
      actions,
      plan,
      getAssortmentChecklistMap(snapshot.id),
      executionReviewPayload,
      learningSnap,
      t,
    );
    const payload = {
      schema: ASSORTMENT_ACTIONS_MEMORY_SCHEMA,
      sourceSnapshotId: snapshot.id,
      actions,
      statuses,
      summary: { ...summary, quickWinNew: summary.quickWinNew },
      priorityDigest: digest ?? null,
      executionPlan: plan,
      checklistItems,
      executionReview: executionReviewPayload,
      learningSignals: exportLearningSignalsForMemory(snapshot.id),
      executiveReport: executiveReportSnapshot,
      heroExecutionActions: exportHeroExecutionActionsForMemory(snapshot.id),
      collectionExecutionActions: exportCollectionExecutionActionsForMemory(snapshot.id),
      launchExecutionActions: exportLaunchExecutionActionsForMemory(snapshot.id),
      savedAt: Date.now(),
    };
    recordGeneration({
      module: "assortment_actions",
      title: t("aa.memoryTitle", { id: snapshot.id.slice(-8) }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["assortment_actions", snapshot.id],
      meta: {
        sourceSnapshotId: snapshot.id,
        total: String(summary.total),
        newCount: String(summary.newCount),
        criticalNew: String(summary.criticalNew),
        quickWins: String(summary.quickWinNew),
        topAction: digest?.topRecommendedActionId?.slice(-10) ?? "",
      },
    });
    showToast(t("aa.toastSavedMemory"));
  };

  const copySummary = async () => {
    const text = buildAssortmentCopySummary(actions, t);
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("aa.toastCopied"));
    } catch {
      showToast(text);
    }
  };

  const copyDailyPlan = async () => {
    if (!executionPlan) return;
    const text = buildAssortmentDailyPlanCopy(executionPlan, t);
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("aa.toastCopied"));
    } catch {
      showToast(text);
    }
  };

  const copyExecutiveReport = async () => {
    if (!executiveReport) return;
    const text = buildAssortmentExecutiveReportPlain(executiveReport, t);
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("aa.toastCopied"));
    } catch {
      showToast(text);
    }
  };

  const copyOne = async (a: AssortmentAction) => {
    const parts: string[] = [
      `${t(a.titleKey, a.titleVars)}`,
      `${t(a.reasonKey, a.reasonVars)}`,
      `L${a.leverageScore} · E${a.effortScore} · R${a.operationalRisk} · ${a.urgencyBand}`,
      "",
      `${t("aa.why.summary")}`,
      `${t("aa.why.section.priority")}: ${a.priorityReasons.map((k) => formatAssortmentReasonLine(t, a, k)).join(" · ") || "—"}`,
      `${t("aa.why.section.leverage")}: ${a.leverageReasons.map((k) => formatAssortmentReasonLine(t, a, k)).join(" · ") || "—"}`,
      `${t("aa.why.section.effort")}: ${a.effortReasons.map((k) => formatAssortmentReasonLine(t, a, k)).join(" · ") || "—"}`,
      `${t("aa.why.section.risk")}: ${a.riskReasons.map((k) => formatAssortmentReasonLine(t, a, k)).join(" · ") || "—"}`,
      `${t("aa.why.trust")}: ${formatAssortmentReasonLine(t, a, a.trustNote)}`,
    ];
    const text = parts.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("aa.toastCopied"));
    } catch {
      showToast(text);
    }
  };

  if (!snapshot) {
    return (
      <div className="cb-lab aa-lab">
        <header className="cb-lab__head">
          <p className="cb-lab__eyebrow">{t("aa.eyebrow")}</p>
          <h1 className="cb-lab__title">{t("nav.assortmentActions")}</h1>
          <p className="cb-lab__lede">{t("aa.empty")}</p>
          <div className="cb-lab__actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("entityFusion")}>
              {t("nav.entityFusion")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("dataCleanup")}>
              {t("nav.dataCleanup")}
            </button>
          </div>
        </header>
        <style>{`.aa-lab { max-width: 960px; margin: 0 auto; padding: 24px 20px 48px; }`}</style>
      </div>
    );
  }

  const setChk = (actionId: string, status: AssortmentChecklistItemStatus) => {
    if (!snapshot) return;
    setAssortmentChecklistStatus(snapshot.id, actionId, status);
  };

  const renderPlanList = (section: AssortmentPlanChecklistSection, list: AssortmentAction[]) => {
    if (list.length === 0) {
      return <p className="cb-lab__prose aa-muted aa-plan__empty">{t("aa.plan.empty")}</p>;
    }
    return (
      <ul className={`aa-plan aa-plan--${section}`}>
        {list.map((a) => {
          const chk = checklistMap[a.id];
          const st = chk?.status ?? "todo";
          return (
            <li key={a.id} className={`aa-plan__li aa-plan__li--chk-${st}`}>
              <p className="aa-plan__title">
                {t(a.titleKey, a.titleVars)}{" "}
                <span className="aa-plan__st">{t(`aa.checklist.status.${st}`)}</span>
              </p>
              <p className="aa-plan__reason">{t(a.reasonKey, a.reasonVars)}</p>
              <p className="aa-plan__meta">
                {t(`aa.outcome.${a.expectedOutcome}`)} · {t("aa.meta.difficulty", { v: a.difficulty })} ·{" "}
                {t("aa.meta.confidence", { n: String(a.confidence) })}
              </p>
              <div className="aa-plan__row">
                <div className="aa-plan__chk">
                  <button type="button" className="ghost-btn aa-mini" onClick={() => setChk(a.id, "started")}>
                    {t("aa.checklist.start")}
                  </button>
                  <button type="button" className="ghost-btn aa-mini" onClick={() => setChk(a.id, "done")}>
                    {t("aa.checklist.done")}
                  </button>
                  <button type="button" className="ghost-btn aa-mini" onClick={() => setChk(a.id, "deferred")}>
                    {t("aa.checklist.defer")}
                  </button>
                  <button type="button" className="ghost-btn aa-mini" onClick={() => setChk(a.id, "blocked")}>
                    {t("aa.checklist.block")}
                  </button>
                </div>
                <button type="button" className="ghost-btn aa-mini" onClick={() => onNavigate(a.suggestedDestination)}>
                  {t("aa.btn.open")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderCard = (a: AssortmentAction) => (
    <li key={a.id} className={`aa-card aa-card--${a.priority}`}>
      <div className="aa-card__head">
        {a.heroDerived ? (
          <span className="aa-pill aa-pill--hero">{t("hab.badge")}</span>
        ) : a.collectionDerived ? (
          <span className="aa-pill aa-pill--collection">{t("cab.badge")}</span>
        ) : (
          <span className="aa-pill">{t(`aa.type.${a.actionType}`)}</span>
        )}
        <span className="aa-pill aa-pill--muted">{a.status}</span>
        <span className="aa-pill aa-pill--pri">{a.priority}</span>
        <span className={`aa-pill aa-urg aa-urg--${a.urgencyBand}`}>{t(`aa.urgency.${a.urgencyBand}`)}</span>
        {a.marketTimingBadgeKey ? (
          <span className="aa-pill aa-pill--mtm">
            {t(a.marketTimingBadgeKey, {
              state: a.marketTimingState ? t(`mtm.state.${a.marketTimingState}`) : "",
            })}
          </span>
        ) : null}
        {a.corridorStrategyBadgeKey ? (
          <span className="aa-pill aa-pill--cst">
            {t(a.corridorStrategyBadgeKey, {
              corridor: a.titleVars.cstCorridor ?? a.corridor ?? "",
              strategy: a.corridorStrategyKey ? t(`cst.strategy.${a.corridorStrategyKey}`) : "",
            })}
          </span>
        ) : null}
        {a.fboFbsBadgeKey ? (
          <span className="aa-pill aa-pill--ffd">
            {t(a.fboFbsBadgeKey, {
              mode: a.fboFbsMode ? t(`ffd.mode.${a.fboFbsMode}`) : "",
            })}
          </span>
        ) : null}
        {a.scalingSafetyBadgeKey ? (
          <span className="aa-pill aa-pill--ssf">
            {t(a.scalingSafetyBadgeKey, {
              mode: a.scalingSafetyMode ? t(`ssf.mode.${a.scalingSafetyMode}`) : "",
              level: a.titleVars.ssfLevel ? t(`ssf.level.${a.titleVars.ssfLevel}`) : "",
            })}
          </span>
        ) : null}
        {a.productionPressureBadgeKey ? (
          <span className="aa-pill aa-pill--ppr">
            {t(a.productionPressureBadgeKey, {
              state: a.productionPressureState ? t(`prod.state.${a.productionPressureState}`) : "",
              shift: a.productionShiftScenarioType
                ? t(`prod.shift.type.${a.productionShiftScenarioType}`)
                : "",
            })}
          </span>
        ) : null}
        {a.guardrailBadgeKey ? (
          <span className={`aa-pill aa-pill--guardrail aa-pill--egr-${a.guardrailSeverity ?? "caution"}`}>
            {t(a.guardrailBadgeKey, {
              severity: t(`egr.severity.${a.guardrailSeverity ?? "caution"}`),
            })}
          </span>
        ) : null}
      </div>
      {stripBar(t("aa.strip.leverage"), a.leverageScore)}
      {stripBar(t("aa.strip.effort"), a.effortScore)}
      <p className="aa-card__title">{t(a.titleKey, a.titleVars)}</p>
      <p className="aa-card__reason">{t(a.reasonKey, a.reasonVars)}</p>
      <p className="aa-card__meta">
        {t("aa.meta.counts", {
          skus: String(a.affectedSkuIds.length),
          cards: String(a.affectedCardIds.length),
        })}{" "}
        · {t("aa.meta.impact", { v: a.expectedImpact })} · {t("aa.meta.difficulty", { v: a.difficulty })}
        {" · "}
        {t("aa.meta.risk", { n: String(a.operationalRisk) })} · {t("aa.meta.pressure", { n: String(a.executionPressure) })} ·{" "}
        {t("aa.meta.confidence", { n: String(a.confidence) })}
        <br />
        <span className="aa-meta-out">{t(`aa.outcome.${a.expectedOutcome}`)}</span>
        {a.corridor ? <> · {a.corridor}</> : null}
      </p>
      <details className="aa-why">
        <summary className="aa-why__sum">{t("aa.why.summary")}</summary>
        <div className="aa-why__body">
          {a.priorityReasons.length > 0 ? (
            <>
              <p className="aa-why__h">{t("aa.why.section.priority")}</p>
              <ul className="aa-why__ul">
                {a.priorityReasons.map((k) => (
                  <li key={`p-${k}`}>{formatAssortmentReasonLine(t, a, k)}</li>
                ))}
              </ul>
            </>
          ) : null}
          {a.leverageReasons.length > 0 ? (
            <>
              <p className="aa-why__h">{t("aa.why.section.leverage")}</p>
              <ul className="aa-why__ul">
                {a.leverageReasons.map((k) => (
                  <li key={`l-${k}`}>{formatAssortmentReasonLine(t, a, k)}</li>
                ))}
              </ul>
            </>
          ) : null}
          {a.effortReasons.length > 0 ? (
            <>
              <p className="aa-why__h">{t("aa.why.section.effort")}</p>
              <ul className="aa-why__ul">
                {a.effortReasons.map((k) => (
                  <li key={`e-${k}`}>{formatAssortmentReasonLine(t, a, k)}</li>
                ))}
              </ul>
            </>
          ) : null}
          {a.riskReasons.length > 0 ? (
            <>
              <p className="aa-why__h">{t("aa.why.section.risk")}</p>
              <ul className="aa-why__ul">
                {a.riskReasons.map((k) => (
                  <li key={`r-${k}`}>{formatAssortmentReasonLine(t, a, k)}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="aa-why__trust">
            <span className="aa-why__trust-k">{t("aa.why.trust")}</span> {formatAssortmentReasonLine(t, a, a.trustNote)}
          </p>
        </div>
      </details>
      <div className="aa-card__actions">
        <button type="button" className="ghost-btn aa-mini" onClick={() => setStatus(a.id, "accepted")}>
          {t("aa.btn.accept")}
        </button>
        <button type="button" className="ghost-btn aa-mini" onClick={() => setStatus(a.id, "deferred")}>
          {t("aa.btn.defer")}
        </button>
        <button type="button" className="ghost-btn aa-mini" onClick={() => setStatus(a.id, "rejected")}>
          {t("aa.btn.reject")}
        </button>
        <button type="button" className="ghost-btn aa-mini" onClick={() => setStatus(a.id, "in_progress")}>
          {t("aa.btn.progress")}
        </button>
        <button type="button" className="ghost-btn aa-mini" onClick={() => setStatus(a.id, "done")}>
          {t("aa.btn.done")}
        </button>
        <button type="button" className="ghost-btn aa-mini" onClick={() => copyOne(a)}>
          {t("aa.btn.copy")}
        </button>
        <button type="button" className="ghost-btn aa-mini" onClick={() => onNavigate(a.suggestedDestination)}>
          {t("aa.btn.open")}
        </button>
      </div>
    </li>
  );

  const renderSection = (key: AssortmentActionCategory, titleKey: string) => {
    const list = byCat[key];
    if (list.length === 0) return null;
    return (
      <section className="glass-panel aa-sec" key={key}>
        <h2 className="aa-sec__h">{t(titleKey)}</h2>
        <ul className="aa-list">{list.map(renderCard)}</ul>
      </section>
    );
  };

  return (
    <div className="cb-lab aa-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("aa.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.assortmentActions")}</h1>
        <p className="cb-lab__lede">{t("aa.lede")}</p>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("fusion.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("fusion.openMops")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dataCleanup")}>
            {t("nav.dataCleanup")}
          </button>
        </div>
      </header>

      {heroWorkflowActions.length > 0 ? (
        <section className="glass-panel aa-sec aa-sec--hero-workflow">
          <h2 className="aa-sec__h">{t("hab.section.title")}</h2>
          <p className="cb-lab__prose aa-muted">{t("hab.section.lede")}</p>
          <ul className="aa-list">{heroWorkflowActions.map(renderCard)}</ul>
        </section>
      ) : null}

      {collectionWorkflowActions.length > 0 ? (
        <section className="glass-panel aa-sec aa-sec--collection-workflow">
          <h2 className="aa-sec__h">{t("cab.section.title")}</h2>
          <p className="cb-lab__prose aa-muted">{t("cab.section.lede")}</p>
          <ul className="aa-list">{collectionWorkflowActions.map(renderCard)}</ul>
        </section>
      ) : null}

      {launchWorkflowActions.length > 0 ? (
        <section className="glass-panel aa-sec aa-sec--launch-workflow">
          <h2 className="aa-sec__h">{t("lops.section.title")}</h2>
          <p className="cb-lab__prose aa-muted">{t("lops.section.lede")}</p>
          <ul className="aa-list">{launchWorkflowActions.map(renderCard)}</ul>
        </section>
      ) : null}

      {executionPlan ? (
        <section className="glass-panel aa-sec aa-sec--plan">
          <h2 className="aa-sec__h">{t("aa.section.executionPlan")}</h2>
          <p className="cb-lab__prose aa-muted aa-plan__lede">
            {t("aa.plan.lede", {
              focus: t(executionPlan.estimatedFocus),
              bottleneck: t(executionPlan.bottleneck),
              outcome: t(executionPlan.expectedOutcome),
            })}
          </p>
          {executionPlan.warnings.length > 0 ? (
            <ul className="aa-plan__warn">
              {executionPlan.warnings.map((w) => (
                <li key={w}>{t(w)}</li>
              ))}
            </ul>
          ) : null}
          {snapshotHasAssortmentChecklist(snapshot.id) ? (
            <div className="aa-plan__carry">
              <h3 className="aa-plan__subh">{t("aa.carry.banner.title")}</h3>
              <p className="cb-lab__prose aa-muted aa-plan__carry-strat">
                <span className="aa-plan__carry-k">{t("aa.carry.banner.strategy")}</span> {t(executionPlan.carryStrategy)}
              </p>
              {executionPlan.previousCompletionRate !== null ? (
                <p className="cb-lab__prose aa-muted aa-plan__carry-prev">
                  {t("aa.carry.banner.prevRate", { n: String(executionPlan.previousCompletionRate) })}
                </p>
              ) : null}
              {executionPlan.carriedForwardActionIds.length > 0 ? (
                <>
                  <p className="aa-plan__carry-lab">{t("aa.carry.banner.carriedList")}</p>
                  <ul className="aa-plan__carry-ul">
                    {executionPlan.carriedForwardActionIds.map((id) => (
                      <li key={id}>{checklistMap[id]?.title ?? id.slice(-10)}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {executionPlan.repeatedBlockers.length > 0 ? (
                <>
                  <p className="aa-plan__carry-lab">{t("aa.carry.banner.repeated")}</p>
                  <ul className="aa-plan__carry-ul aa-plan__carry-ul--warn">
                    {executionPlan.repeatedBlockers.map((id) => (
                      <li key={id}>{checklistMap[id]?.title ?? id.slice(-10)}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {executionPlan.continuityWarnings.length > 0 ? (
                <ul className="aa-plan__carry-warn">
                  {executionPlan.continuityWarnings.map((w) => (
                    <li key={w}>{t(w)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {checklistProgress ? (
            <p className="cb-lab__prose aa-muted aa-plan__prog">
              {t("aa.checklist.progress", {
                dt: String(checklistProgress.doneToday),
                tt: String(checklistProgress.totalToday),
                dw: String(checklistProgress.doneWeek),
                tw: String(checklistProgress.totalWeek),
                blocked: String(checklistProgress.blocked),
              })}
            </p>
          ) : null}
        <div className="aa-plan__grid">
          <div>
            <h3 className="aa-plan__subh">{t("aa.plan.section.today")}</h3>
            {renderPlanList("today", executionPlan.todayActions)}
          </div>
          <div>
            <h3 className="aa-plan__subh">{t("aa.plan.section.week")}</h3>
            {renderPlanList("week", executionPlan.weekActions)}
          </div>
          <div>
            <h3 className="aa-plan__subh">{t("aa.plan.section.later")}</h3>
            {renderPlanList("later", executionPlan.laterActions)}
          </div>
          <div>
            <h3 className="aa-plan__subh">{t("aa.plan.section.hold")}</h3>
            {renderPlanList("hold", executionPlan.holdActions)}
          </div>
        </div>
        {staleChecklistRows.length > 0 ? (
          <div className="aa-plan__stale-wrap">
            <p className="cb-lab__prose aa-muted aa-plan__stale-h">
              {t("aa.checklist.staleBanner", { n: String(staleChecklistRows.length) })}
            </p>
            <ul className="aa-plan__stale-ul">
              {staleChecklistRows.map((r) => (
                <li key={r.id}>
                  {r.title} · {t(`aa.checklist.status.${r.status}`)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        </section>
      ) : null}

      {executionPlan && executionReview ? (
        <section className="glass-panel aa-sec aa-sec--review">
          <h2 className="aa-sec__h">{t("aa.section.executionReview")}</h2>
          <p className="cb-lab__prose aa-muted aa-rev__rate">
            {t("aa.review.completion", { n: String(executionReview.completionRate) })}
          </p>
          <p className="cb-lab__prose aa-muted aa-rev__block">{t(executionReview.blockerSummaryKey, executionReview.blockerSummaryVars)}</p>

          <h3 className="aa-rev__subh">{t("aa.review.doneToday")}</h3>
          <ul className="aa-rev__ul">
            {executionReview.doneItems.filter((x) => x.section === "today").length === 0 ? (
              <li className="aa-rev__empty">{t("aa.review.emptyDoneToday")}</li>
            ) : (
              executionReview.doneItems
                .filter((x) => x.section === "today")
                .map((r) => (
                  <li key={r.id}>
                    <span className="aa-rev__t">{r.title}</span>
                  </li>
                ))
            )}
          </ul>

          <h3 className="aa-rev__subh">{t("aa.review.blocked")}</h3>
          <ul className="aa-rev__ul">
            {executionReview.blockedItems.length === 0 ? (
              <li className="aa-rev__empty">{t("aa.review.emptyBlocked")}</li>
            ) : (
              executionReview.blockedItems.map((r) => (
                <li key={r.id}>
                  <span className="aa-rev__t">{r.title}</span>
                </li>
              ))
            )}
          </ul>

          <h3 className="aa-rev__subh">{t("aa.review.deferred")}</h3>
          <ul className="aa-rev__ul">
            {executionReview.deferredItems.length === 0 ? (
              <li className="aa-rev__empty">{t("aa.review.emptyDeferred")}</li>
            ) : (
              executionReview.deferredItems.map((r) => (
                <li key={r.id}>
                  <span className="aa-rev__t">{r.title}</span>
                </li>
              ))
            )}
          </ul>

          <h3 className="aa-rev__subh">{t("aa.review.carryForward")}</h3>
          <ul className="aa-rev__ul">
            {reviewCarryRows.length === 0 ? (
              <li className="aa-rev__empty">{t("aa.review.emptyCarry")}</li>
            ) : (
              reviewCarryRows.map((r) => (
                <li key={r.id}>
                  <span className="aa-rev__t">{r.title}</span>
                  {r.stale ? <span className="aa-rev__tag"> · {t("aa.review.staleTag")}</span> : null}
                </li>
              ))
            )}
          </ul>

          <h3 className="aa-rev__subh">{t("aa.review.nextFocus")}</h3>
          <p className="cb-lab__prose aa-muted aa-rev__focus">{t(executionReview.nextSuggestedFocusKey)}</p>

          <h3 className="aa-rev__subh">{t("aa.review.suggestions")}</h3>
          <ul className="aa-rev__ul aa-rev__ul--dots">
            {executionReview.nextPlanSuggestions.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>

          <h3 className="aa-rev__subh">{t("aa.review.learning")}</h3>
          <ul className="aa-rev__ul aa-rev__ul--dots">
            {executionReview.learningNotes.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel aa-sec aa-sec--learn">
        <h2 className="aa-sec__h">{t("aa.section.executionLearning")}</h2>
        {topLearningSignals.length === 0 ? (
          <p className="cb-lab__prose aa-muted">{t("aa.learn.empty")}</p>
        ) : (
          <ul className="aa-learn__ul">
            {topLearningSignals.map((sig) => {
              const typeLabel = t(`aa.type.${sig.actionType}`);
              const v = { type: typeLabel, n: sig.reasonVars?.n ?? "", ...(sig.titleVars ?? {}), ...(sig.reasonVars ?? {}) };
              return (
                <li key={sig.id} className="aa-learn__li">
                  <p className="aa-learn__title">{t(sig.title, { ...v, type: typeLabel })}</p>
                  <p className="cb-lab__prose aa-muted aa-learn__reason">{t(sig.reason, { ...v, type: typeLabel })}</p>
                  <p className="aa-learn__adj">
                    <span className="aa-learn__adj-k">{t("aa.learn.adjustLabel")}:</span> {t(sig.recommendedAdjustment)}
                  </p>
                  <p className="aa-learn__conf">{t("aa.learn.confidence", { n: String(Math.round(sig.confidence)) })}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {executiveReport ? (
        <section className="glass-panel aa-sec aa-sec--report">
          <h2 className="aa-sec__h">{t("aa.section.assortmentReport")}</h2>
          <p className="cb-lab__prose aa-muted aa-report__lede">{t("aa.report.lede")}</p>
          <div className="aa-report__grid">
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.sectionSummary")}</h3>
              <p className="aa-report__v">{executiveReport.snapshotSummary}</p>
            </div>
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.sectionPlanned")}</h3>
              <p className="aa-report__v">{executiveReport.planSummary}</p>
            </div>
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.sectionExecution")}</h3>
              <p className="aa-report__v">{executiveReport.executionSummary}</p>
              <p className="aa-report__sub">
                <span className="aa-report__tag">{t("aa.report.labelDone")}</span>{" "}
                {executionReview ? executionReview.doneItems.length : "—"} ·{" "}
                <span className="aa-report__tag">{t("aa.report.labelBlocked")}</span>{" "}
                {executionReview ? executionReview.blockedItems.length : "—"} ·{" "}
                <span className="aa-report__tag">{t("aa.report.labelDeferred")}</span>{" "}
                {executionReview ? executionReview.deferredItems.length : "—"}
              </p>
            </div>
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.sectionBlocked")}</h3>
              <p className="aa-report__v">{executiveReport.blockerSummary}</p>
            </div>
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.labelCarried")}</h3>
              <p className="aa-report__v">{executiveReport.carryForwardSummary}</p>
            </div>
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.labelLearned")}</h3>
              <p className="aa-report__v">{executiveReport.learningSummary}</p>
            </div>
            <div className="aa-report__cell">
              <h3 className="aa-report__k">{t("aa.report.labelNext")}</h3>
              <p className="aa-report__v aa-report__v--focus">{executiveReport.nextFocus}</p>
            </div>
            <div className="aa-report__cell aa-report__cell--full">
              <h3 className="aa-report__k">{t("aa.report.sectionConfidence")}</h3>
              <p className="aa-report__v aa-muted">{executiveReport.confidenceNote}</p>
            </div>
          </div>
          {executiveReport.warnings.length > 0 ? (
            <ul className="aa-report__warn">
              {executiveReport.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
          {executiveReport.topActions.length > 0 ? (
            <div className="aa-report__top">
              <h3 className="aa-report__k">{t("aa.report.sectionTopActions")}</h3>
              <ul className="aa-report__top-ul">
                {executiveReport.topActions.map((a) => (
                  <li key={a.id}>
                    <span className="aa-report__bucket">{a.bucket === "other" ? t("aa.report.bucketOther") : t(`aa.plan.section.${a.bucket}`)}</span>
                    {a.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="aa-export-row aa-report__actions">
            <button type="button" className="ghost-btn" onClick={copyExecutiveReport}>
              {t("aa.report.copy")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                downloadText(
                  "assortment-executive-report.md",
                  buildAssortmentExecutiveReportMarkdown(executiveReport, t),
                  "text/markdown;charset=utf-8",
                )
              }
            >
              {t("aa.report.exportMd")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                downloadText("assortment-executive-report.json", buildAssortmentExecutiveReportJson(executiveReport), "application/json;charset=utf-8")
              }
            >
              {t("aa.report.exportJson")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="glass-panel aa-sec aa-sec--exec">
        <h2 className="aa-sec__h">{t("aa.section.exec")}</h2>
        <ul className="aa-exec">
          <li>{t("aa.exec.total", { n: String(summary.total) })}</li>
          <li>{t("aa.exec.new", { n: String(summary.newCount) })}</li>
          <li>{t("aa.exec.critical", { n: String(summary.criticalNew) })}</li>
          <li>{t("aa.exec.quickWins", { n: String(summary.quickWinNew) })}</li>
        </ul>
        {priorityDigest ? (
          <p className="cb-lab__prose aa-muted aa-exec-hint">
            {t("aa.exec.signals", {
              safest: priorityDigest.safestLaunchCorridor ?? "—",
              leverage: priorityDigest.highestLeverageCorridor ?? "—",
              drag: priorityDigest.highestDragCorridor ?? "—",
            })}
          </p>
        ) : null}
        <p className="cb-lab__prose aa-muted">{buildAssortmentCopySummary(actions, t)}</p>
      </section>

      <section className="glass-panel aa-sec">
        <h2 className="aa-sec__h">{t("aa.section.queues")}</h2>
        <div className="aa-queues">
          {EXECUTIVE_QUEUE_ORDER.map((q) => {
            const list = queueBuckets[q];
            return (
              <div key={q} className="aa-q">
                <h3 className="aa-q__h">{t(`aa.queue.${q}`)}</h3>
                <p className="aa-q__n">{list.length}</p>
                <ul className="aa-q__ul">
                  {list.slice(0, 3).map((a) => (
                    <li key={a.id}>{t(a.titleKey, a.titleVars)}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {renderSection("fix", "aa.section.fix")}
      {renderSection("growth", "aa.section.growth")}
      {renderSection("risk", "aa.section.risk")}
      {renderSection("visual", "aa.section.visual")}
      {renderSection("fbo", "aa.section.fbo")}
      {renderSection("collection", "aa.section.collection")}

      <section className="glass-panel aa-sec aa-sec--export">
        <h2 className="aa-sec__h">{t("aa.section.export")}</h2>
        <p className="cb-lab__prose aa-muted">{t("aa.export.hint")}</p>
        <div className="aa-export-row">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              if (!executionPlan) return;
              downloadText(
                "assortment-execution-plan.md",
                buildExecutionPlanMarkdown(executionPlan, t, executionReview),
                "text/markdown;charset=utf-8",
              );
            }}
            disabled={!executionPlan}
          >
            {t("aa.export.planMd")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              if (!executionPlan) return;
              downloadText("assortment-execution-plan.json", buildExecutionPlanJson(executionPlan), "application/json;charset=utf-8");
            }}
            disabled={!executionPlan}
          >
            {t("aa.export.planJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyDailyPlan} disabled={!executionPlan}>
            {t("aa.export.copyDailyPlan")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadText("assortment-actions.md", buildAssortmentMarkdownPlan(actions, t), "text/markdown;charset=utf-8")}
          >
            {t("aa.export.md")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadText("assortment-actions.json", buildAssortmentJson(actions), "application/json;charset=utf-8")}
          >
            {t("aa.export.json")}
          </button>
          <button type="button" className="ghost-btn" onClick={copySummary}>
            {t("aa.export.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("aa.saveMemory")}
          </button>
        </div>
      </section>

      <style>{`
        .aa-lab { max-width: 960px; margin: 0 auto; padding: 24px 20px 48px; }
        .aa-sec { margin-top: 14px; padding: 16px 18px; }
        .aa-sec__h { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
        .aa-sec--exec { border-color: rgba(123, 143, 255, 0.22); }
        .aa-exec { margin: 0; padding-left: 18px; font-size: 0.85rem; line-height: 1.55; }
        .aa-exec-hint { margin-top: 8px; }
        .aa-muted { color: var(--muted); font-size: 0.8rem; }
        .aa-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .aa-card { padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); }
        .aa-card--critical { border-left: 3px solid rgba(255, 140, 140, 0.85); }
        .aa-card--high { border-left: 3px solid rgba(255, 200, 160, 0.8); }
        .aa-card--medium { border-left: 3px solid rgba(200, 210, 255, 0.65); }
        .aa-card--low { border-left: 3px solid rgba(160, 200, 180, 0.45); }
        .aa-card__head { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .aa-pill { font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.12); }
        .aa-pill--muted { opacity: 0.75; }
        .aa-pill--pri { color: rgba(255, 220, 200, 0.95); }
        .aa-urg--critical { border-color: rgba(255, 120, 120, 0.55); color: rgba(255, 200, 200, 0.95); }
        .aa-urg--elevated { border-color: rgba(255, 190, 140, 0.45); color: rgba(255, 220, 190, 0.92); }
        .aa-urg--medium { border-color: rgba(200, 210, 255, 0.35); }
        .aa-urg--low { opacity: 0.75; }
        .aa-strip { margin-bottom: 6px; }
        .aa-strip__lab { display: flex; justify-content: space-between; font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
        .aa-strip__track { height: 4px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .aa-strip__fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, rgba(120, 160, 255, 0.55), rgba(200, 160, 255, 0.45)); }
        .aa-card__title { margin: 0; font-size: 0.9rem; font-weight: 600; }
        .aa-card__reason { margin: 6px 0 0; font-size: 0.78rem; color: var(--muted); line-height: 1.45; }
        .aa-card__meta { margin: 8px 0 0; font-size: 0.72rem; color: rgba(200, 210, 230, 0.85); line-height: 1.45; }
        .aa-meta-out { color: rgba(180, 210, 255, 0.9); }
        .aa-card__actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .aa-mini { font-size: 0.65rem; padding: 4px 8px; }
        .aa-export-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .aa-rec { margin: 0; padding-left: 18px; font-size: 0.82rem; line-height: 1.55; }
        .aa-rec__btn { background: none; border: none; color: inherit; cursor: pointer; text-align: left; padding: 0; font: inherit; text-decoration: underline; text-underline-offset: 3px; }
        .aa-rec__sub { color: var(--muted); font-size: 0.72rem; }
        .aa-queues { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .aa-q { padding: 10px 10px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.12); }
        .aa-q__h { margin: 0; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .aa-q__n { margin: 4px 0 6px; font-size: 1.1rem; font-weight: 600; }
        .aa-q__ul { margin: 0; padding-left: 14px; font-size: 0.72rem; color: rgba(210, 220, 240, 0.88); line-height: 1.4; }
        .aa-why { margin-top: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.12); }
        .aa-why__sum { cursor: pointer; list-style: none; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(200, 215, 255, 0.9); padding: 8px 10px; }
        .aa-why__sum::-webkit-details-marker { display: none; }
        .aa-why__body { padding: 0 10px 10px; border-top: 1px solid rgba(255,255,255,0.05); }
        .aa-why__h { margin: 8px 0 4px; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .aa-why__ul { margin: 0; padding-left: 16px; font-size: 0.74rem; line-height: 1.45; color: rgba(220, 228, 245, 0.92); }
        .aa-why__trust { margin: 10px 0 0; font-size: 0.72rem; color: rgba(200, 210, 230, 0.88); line-height: 1.45; }
        .aa-why__trust-k { color: rgba(255, 210, 180, 0.85); font-weight: 600; margin-right: 6px; }
        .aa-sec--plan { border-color: rgba(140, 200, 255, 0.18); }
        .aa-plan__lede { margin-top: 6px; font-size: 0.8rem; line-height: 1.5; }
        .aa-plan__warn { margin: 8px 0 0; padding-left: 18px; color: rgba(255, 200, 170, 0.92); font-size: 0.78rem; }
        .aa-plan__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-top: 12px; }
        .aa-plan__subh { margin: 0 0 8px; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .aa-plan { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .aa-plan__li { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); background: rgba(0,0,0,0.12); }
        .aa-plan__title { margin: 0; font-size: 0.82rem; font-weight: 600; }
        .aa-plan__reason { margin: 6px 0 0; font-size: 0.72rem; color: var(--muted); line-height: 1.4; }
        .aa-plan__meta { margin: 8px 0 0; font-size: 0.68rem; color: rgba(200, 215, 235, 0.88); }
        .aa-plan__empty { margin: 0; }
        .aa-plan__prog { margin: 10px 0 0; font-size: 0.76rem; }
        .aa-plan__st { margin-left: 6px; font-size: 0.62rem; font-weight: 500; color: rgba(180, 210, 255, 0.85); text-transform: uppercase; letter-spacing: 0.06em; }
        .aa-plan__row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
        .aa-plan__chk { display: flex; flex-wrap: wrap; gap: 4px; }
        .aa-plan__li--chk-done { opacity: 0.72; border-color: rgba(120, 200, 140, 0.2); }
        .aa-plan__li--chk-blocked { border-color: rgba(255, 120, 100, 0.25); }
        .aa-plan__li--chk-deferred { opacity: 0.85; }
        .aa-plan__stale-wrap { margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); }
        .aa-plan__stale-h { margin: 0 0 6px; font-size: 0.72rem; }
        .aa-plan__stale-ul { margin: 0; padding-left: 18px; font-size: 0.7rem; color: rgba(200, 200, 210, 0.75); line-height: 1.45; }
        .aa-plan__carry { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .aa-plan__carry-strat { margin: 4px 0 0; font-size: 0.78rem; }
        .aa-plan__carry-k { font-weight: 600; margin-right: 6px; color: rgba(200, 220, 255, 0.9); }
        .aa-plan__carry-prev { margin: 4px 0 0; font-size: 0.72rem; }
        .aa-plan__carry-lab { margin: 10px 0 4px; font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
        .aa-plan__carry-ul { margin: 0; padding-left: 18px; font-size: 0.74rem; line-height: 1.45; color: rgba(215, 225, 245, 0.9); }
        .aa-plan__carry-ul--warn { color: rgba(255, 200, 180, 0.95); }
        .aa-plan__carry-warn { margin: 8px 0 0; padding-left: 18px; font-size: 0.72rem; color: rgba(255, 200, 170, 0.92); }
        .aa-sec--review { border-color: rgba(200, 180, 255, 0.16); }
        .aa-rev__rate { margin: 0 0 6px; font-size: 0.82rem; font-weight: 600; }
        .aa-rev__block { margin: 0 0 12px; font-size: 0.78rem; line-height: 1.45; }
        .aa-rev__subh { margin: 14px 0 6px; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .aa-rev__subh:first-of-type { margin-top: 0; }
        .aa-rev__ul { margin: 0; padding-left: 18px; font-size: 0.76rem; line-height: 1.45; color: rgba(215, 225, 245, 0.92); }
        .aa-rev__ul--dots { list-style: disc; }
        .aa-rev__empty { list-style: none; margin-left: -18px; color: var(--muted); font-size: 0.74rem; }
        .aa-rev__t { font-weight: 500; }
        .aa-rev__tag { color: var(--muted); font-size: 0.72rem; }
        .aa-rev__focus { margin: 0; font-size: 0.8rem; line-height: 1.45; }
        .aa-sec--learn { border-color: rgba(140, 220, 200, 0.14); }
        .aa-sec--report { border-color: rgba(200, 190, 255, 0.16); }
        .aa-report__lede { margin: 0 0 10px; font-size: 0.76rem; line-height: 1.45; }
        .aa-report__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px 14px; }
        .aa-report__cell { min-width: 0; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.08); }
        .aa-report__cell--full { grid-column: 1 / -1; }
        .aa-report__k { margin: 0 0 6px; font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .aa-report__v { margin: 0; font-size: 0.78rem; line-height: 1.45; color: rgba(220, 228, 245, 0.95); }
        .aa-report__v--focus { font-weight: 600; color: rgba(230, 235, 255, 0.98); }
        .aa-report__sub { margin: 6px 0 0; font-size: 0.7rem; color: rgba(175, 188, 215, 0.9); }
        .aa-report__tag { font-weight: 600; color: rgba(200, 215, 255, 0.85); }
        .aa-report__warn { margin: 10px 0 0; padding-left: 18px; font-size: 0.72rem; color: rgba(255, 200, 170, 0.9); }
        .aa-report__top { margin-top: 12px; }
        .aa-report__top-ul { margin: 6px 0 0; padding-left: 18px; font-size: 0.74rem; line-height: 1.45; color: rgba(215, 225, 245, 0.92); }
        .aa-report__bucket { display: inline-block; min-width: 5.5rem; margin-right: 6px; font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(160, 185, 255, 0.85); }
        .aa-report__actions { margin-top: 12px; }
        .aa-learn__ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .aa-learn__li { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); background: rgba(0,0,0,0.1); }
        .aa-learn__title { margin: 0; font-size: 0.84rem; font-weight: 600; line-height: 1.4; }
        .aa-learn__reason { margin: 6px 0 0; font-size: 0.74rem; line-height: 1.45; }
        .aa-learn__adj { margin: 8px 0 0; font-size: 0.74rem; color: rgba(200, 230, 210, 0.92); line-height: 1.45; }
        .aa-learn__adj-k { font-weight: 600; margin-right: 4px; color: rgba(180, 220, 200, 0.85); }
        .aa-learn__conf { margin: 4px 0 0; font-size: 0.68rem; letter-spacing: 0.04em; color: rgba(160, 175, 200, 0.85); }
      `}</style>
    </div>
  );
}
