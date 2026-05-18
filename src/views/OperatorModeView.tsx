import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import type { OperatorWorkOrderLine } from "../lib/operator-brief/types";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import {
  PRODUCTION_PRESSURE_EVENT,
  buildProductionPressureReport,
  loadProductionShiftFeedbackOverlay,
  setProductionShiftFeedbackOperatorNote,
} from "../lib/production-pressure";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadText } from "../lib/markdown";
import {
  EXECUTION_FEEDBACK_EVENT,
  applyExecutionFeedbackLearning,
  bindExecutionFeedbackWorkOrder,
  buildExecutionFeedbackMarkdown,
  buildExecutionFeedbackMemoryPayload,
  buildExecutionFeedbackPlain,
  buildExecutionFeedbackReport,
  getExecutionFeedbackTaskFlags,
  loadExecutionFeedbackOverlay,
  patchExecutionFeedbackTaskFlags,
  setExecutionFeedbackFounderNotes,
  setExecutionFeedbackOperatorNotes,
  saveExecutionFeedbackSession,
} from "../lib/execution-feedback";
import { MORNING_FLOW_EVENT, buildMorningOperatingFlow } from "../lib/morning-operating-flow";
import {
  OPERATOR_BRIEF_EVENT,
  buildOperatorBrief,
  buildOperatorBriefMarkdown,
  buildOperatorBriefMemoryPayload,
  buildOperatorBriefPlain,
  buildOperatorWorkOrder,
  buildOperatorWorkOrderMarkdown,
  buildOperatorWorkOrderPlain,
  notifyOperatorBriefUpdated,
  saveOperatorBriefSession,
  setOperatorBriefNotes,
  setOperatorTaskStatus,
  type OperatorTask,
  type OperatorTaskStatus,
} from "../lib/operator-brief";
import { useSafeMode } from "../hooks/useSafeMode";
import { isSafeModeFeatureDisabled } from "../lib/safe-mode";

type Props = { onNavigate: (id: NavId) => void };

function TaskRow({
  task,
  t,
  onStatus,
  onOpen,
}: {
  task: OperatorTask;
  t: (k: string, v?: Record<string, string>) => string;
  onStatus: (status: OperatorTaskStatus) => void;
  onOpen: () => void;
}) {
  return (
    <li className={`opm-task opm-task--${task.status}`}>
      <div className="opm-task__main">
        <button type="button" className="opm-task__title" onClick={onOpen}>
          {task.title}
        </button>
        <span className="opm-task__src">{t(`opm.source.${task.source}`)}</span>
        <p className="opm-task__instr">{task.instruction}</p>
      </div>
      <div className="opm-task__acts">
        <button type="button" className="ghost-btn opm-task__btn" onClick={() => onStatus("done")}>
          {t("opm.action.done")}
        </button>
        <button type="button" className="ghost-btn opm-task__btn" onClick={() => onStatus("blocked")}>
          {t("opm.action.blocked")}
        </button>
        <button type="button" className="ghost-btn opm-task__btn" onClick={() => onStatus("deferred")}>
          {t("opm.action.defer")}
        </button>
      </div>
    </li>
  );
}

function WoLines({ items }: { items: OperatorWorkOrderLine[] }) {
  if (!items.length) return null;
  return (
    <ul className="opm-wo-list">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <strong>{item.label}</strong>
          {item.detail ? <span className="opm-wo-detail">{item.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function WoBullets({ items }: { items: string[] }) {
  return (
    <ul className="opm-wo-list opm-wo-list--plain">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function FeedbackTaskRow({
  task,
  t,
}: {
  task: OperatorTask;
  t: (k: string, v?: Record<string, string>) => string;
}) {
  const flags = getExecutionFeedbackTaskFlags(task.source, task.id);
  return (
    <li className="opm-fb-task">
      <p className="opm-fb-task__title">{task.title}</p>
      <p className="opm-fb-task__src">{t(`opm.source.${task.source}`)}</p>
      <div className="opm-fb-flags">
        <label className="opm-fb-flag">
          <input
            type="checkbox"
            checked={Boolean(flags.unclear)}
            onChange={(e) => patchExecutionFeedbackTaskFlags(task.source, task.id, { unclear: e.target.checked })}
          />
          {t("efb.flag.unclear")}
        </label>
        <label className="opm-fb-flag">
          <input
            type="checkbox"
            checked={Boolean(flags.delayed)}
            onChange={(e) => patchExecutionFeedbackTaskFlags(task.source, task.id, { delayed: e.target.checked })}
          />
          {t("efb.flag.delayed")}
        </label>
        <label className="opm-fb-flag">
          <input
            type="checkbox"
            checked={Boolean(flags.repeatTomorrow)}
            onChange={(e) =>
              patchExecutionFeedbackTaskFlags(task.source, task.id, { repeatTomorrow: e.target.checked })
            }
          />
          {t("efb.flag.repeat")}
        </label>
      </div>
    </li>
  );
}

function TaskSection({
  title,
  tasks,
  t,
  onStatus,
  onOpen,
}: {
  title: string;
  tasks: OperatorTask[];
  t: (k: string, v?: Record<string, string>) => string;
  onStatus: (task: OperatorTask, status: OperatorTaskStatus) => void;
  onOpen: (task: OperatorTask) => void;
}) {
  if (!tasks.length) return null;
  return (
    <section className="glass-panel opm-sec">
      <h2>{title}</h2>
      <ul className="opm-list">
        {tasks.map((task) => (
          <TaskRow
            key={`${task.source}-${task.id}`}
            task={task}
            t={t}
            onStatus={(s) => onStatus(task, s)}
            onOpen={() => onOpen(task)}
          />
        ))}
      </ul>
    </section>
  );
}

export function OperatorModeView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const safe = useSafeMode();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [operatorFbNotes, setOperatorFbNotes] = useState("");
  const [founderFbNotes, setFounderFbNotes] = useState("");
  const [productionNote, setProductionNote] = useState("");

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(OPERATOR_BRIEF_EVENT, bump);
    window.addEventListener(EXECUTION_FEEDBACK_EVENT, bump);
    window.addEventListener(PRODUCTION_PRESSURE_EVENT, bump);
    window.addEventListener(MORNING_FLOW_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(OPERATOR_BRIEF_EVENT, bump);
      window.removeEventListener(EXECUTION_FEEDBACK_EVENT, bump);
      window.removeEventListener(PRODUCTION_PRESSURE_EVENT, bump);
      window.removeEventListener(MORNING_FLOW_EVENT, bump);
    };
  }, []);

  const brief = useMemo(() => buildOperatorBrief(t), [tick, t]);

  useEffect(() => {
    setNotesDraft(brief.notes);
  }, [brief.notes]);

  useEffect(() => {
    const fb = loadExecutionFeedbackOverlay();
    setOperatorFbNotes(fb.operatorNotes);
    setFounderFbNotes(fb.founderNotes);
    setProductionNote(loadProductionShiftFeedbackOverlay().operatorNote);
  }, [tick]);

  const workOrder = useMemo(
    () =>
      buildOperatorWorkOrder({ ...brief, notes: notesDraft }, t, locale, undefined, {
        minimalComposition: isSafeModeFeatureDisabled("operator_work_order"),
      }),
    [brief, notesDraft, t, locale, safe.enabled, safe.disabledFeatures],
  );

  const morningFlow = useMemo(() => buildMorningOperatingFlow(t, locale), [tick, t, locale]);

  useEffect(() => {
    bindExecutionFeedbackWorkOrder(workOrder.id);
  }, [workOrder.id]);

  const feedbackReport = useMemo(
    () =>
      buildExecutionFeedbackReport(t, locale, undefined, { ...brief, notes: notesDraft }, workOrder),
    [brief, locale, notesDraft, t, tick, workOrder],
  );

  const feedbackTasks = useMemo(() => {
    const all = [
      ...brief.todayTasks,
      ...brief.visualTasks,
      ...brief.cardTasks,
      ...brief.launchTasks,
      ...brief.dataCleanupTasks,
      ...brief.blockedTasks,
    ];
    const seen = new Set<string>();
    return all.filter((task) => {
      if (task.status === "done") return false;
      const k = `${task.source}:${task.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [brief]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const persistNotes = useCallback(() => {
    setOperatorBriefNotes(notesDraft);
    notifyOperatorBriefUpdated();
  }, [notesDraft]);

  const saveMemory = useCallback(() => {
    persistNotes();
    const payload = buildOperatorBriefMemoryPayload(
      { ...brief, notes: notesDraft },
      t,
      locale,
      workOrder.id,
    );
    saveOperatorBriefSession(payload);
    recordGeneration({
      module: "operator_brief",
      title: t("opm.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: brief.nextAction?.title ?? t("opm.empty.next"),
    });
    notifyOperatorBriefUpdated();
    showToast(t("opm.toast.saved"));
  }, [brief, locale, notesDraft, persistNotes, showToast, t, workOrder.id]);

  const setStatus = useCallback(
    (task: OperatorTask, status: OperatorTaskStatus) => {
      setOperatorTaskStatus(task, status);
      notifyOperatorBriefUpdated();
    },
    [],
  );

  const copyBrief = useCallback(() => {
    const fresh = buildOperatorBrief(t, brief.id);
    void copyToClipboard(buildOperatorBriefPlain({ ...fresh, notes: notesDraft }, t));
    showToast(t("opm.toast.copied"));
  }, [brief.id, notesDraft, showToast, t]);

  const exportMd = useCallback(() => {
    const fresh = buildOperatorBrief(t, brief.id);
    downloadText(`operator-brief-${fresh.id}.md`, buildOperatorBriefMarkdown({ ...fresh, notes: notesDraft }, t));
  }, [brief.id, notesDraft, t]);

  const copyWorkOrder = useCallback(() => {
    void copyToClipboard(buildOperatorWorkOrderPlain(workOrder, t));
    showToast(t("opm.wo.toast.copied"));
  }, [showToast, t, workOrder]);

  const exportWorkOrderMd = useCallback(() => {
    downloadText(`operator-work-order-${workOrder.id}.md`, buildOperatorWorkOrderMarkdown(workOrder, t));
  }, [t, workOrder]);

  const commitFeedback = useCallback(() => {
    setExecutionFeedbackOperatorNotes(operatorFbNotes);
    setExecutionFeedbackFounderNotes(founderFbNotes);
    const report = buildExecutionFeedbackReport(t, locale, feedbackReport.id, { ...brief, notes: notesDraft }, workOrder);
    applyExecutionFeedbackLearning(report);
    const payload = buildExecutionFeedbackMemoryPayload(report);
    saveExecutionFeedbackSession(payload);
    recordGeneration({
      module: "execution_feedback",
      title: t("efb.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: report.operationalProblems[0] ? t(report.operationalProblems[0]) : t("efb.export.title"),
    });
    window.dispatchEvent(new Event(EXECUTION_FEEDBACK_EVENT));
    showToast(t("efb.toast.saved"));
  }, [brief, feedbackReport.id, founderFbNotes, locale, notesDraft, operatorFbNotes, showToast, t, workOrder]);

  const copyFeedback = useCallback(() => {
    void copyToClipboard(buildExecutionFeedbackPlain(feedbackReport, t));
    showToast(t("efb.toast.copied"));
  }, [feedbackReport, showToast, t]);

  const exportFeedbackMd = useCallback(() => {
    downloadText(`execution-feedback-${feedbackReport.id}.md`, buildExecutionFeedbackMarkdown(feedbackReport, t));
  }, [feedbackReport, t]);

  const openTask = useCallback((task: OperatorTask) => onNavigate(task.destination), [onNavigate]);

  const next = brief.nextAction;

  return (
    <div className="opm-page">
      <header className="glass-panel opm-head">
        <p className="opm-eyebrow">{t("opm.eyebrow")}</p>
        <h1>{t("nav.operatorMode")}</h1>
        <p className="opm-lede">{t("opm.lede")}</p>
        <p className="opm-tag">{t("opm.tag")}</p>
        <div className="opm-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("opm.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyBrief}>
            {t("opm.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("opm.action.exportMd")}
          </button>
        </div>
      </header>

      {toast ? <p className="opm-toast">{toast}</p> : null}

      <section className="glass-panel opm-sec opm-sec--next">
        <h2>{t("opm.section.next")}</h2>
        {next ? (
          <>
            <p className="opm-next-title">{next.title}</p>
            <p className="opm-next-instr">{next.instruction}</p>
            <button type="button" className="primary-btn" onClick={() => openTask(next)}>
              {t("opm.action.openModule")}
            </button>
          </>
        ) : (
          <p className="opm-empty">{t("opm.empty.next")}</p>
        )}
        <p className="opm-conf">{t(brief.confidenceNoteKey)}</p>
      </section>

      <section className="glass-panel opm-sec opm-sec--mflow">
        <h2>{t("opm.mflow.section.title")}</h2>
        <p className="opm-mflow-lede">
          {morningFlow.workOrderReady
            ? t("opm.mflow.workOrderReady", { n: String(morningFlow.workOrderTaskCount) })
            : t("opm.mflow.workOrderEmpty")}
        </p>
        <div className="opm-mflow-actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("morningStart")}>
            {t("opm.mflow.openMorning")}
          </button>
          {morningFlow.workOrderReady ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                void copyToClipboard(buildOperatorWorkOrderPlain(workOrder, t));
                showToast(t("opm.wo.toast.copied"));
              }}
            >
              {t("opm.mflow.copyWorkOrder")}
            </button>
          ) : null}
        </div>
      </section>

      <section className="glass-panel opm-sec opm-sec--wo">
        <div className="opm-wo-head">
          <div>
            <h2>{t("opm.wo.section.title")}</h2>
            <p className="opm-wo-date">{workOrder.dateLabel}</p>
          </div>
          <div className="opm-wo-actions">
            <button type="button" className="primary-btn" onClick={copyWorkOrder}>
              {t("opm.wo.action.copy")}
            </button>
            <button type="button" className="ghost-btn" onClick={exportWorkOrderMd}>
              {t("opm.wo.action.exportMd")}
            </button>
          </div>
        </div>
        <p className="opm-wo-lede">{t("opm.wo.lede")}</p>

        <div className="opm-prod-note">
          <h4 className="opm-wo-h4">{t("opm.prodNote.title")}</h4>
          <p className="opm-prod-note__hint">{t("opm.prodNote.hint")}</p>
          <textarea
            className="opm-prod-note__input"
            rows={2}
            value={productionNote}
            onChange={(e) => setProductionNote(e.target.value)}
            placeholder={t("opm.prodNote.placeholder")}
          />
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              const ppr = buildProductionPressureReport(t);
              setProductionShiftFeedbackOperatorNote(productionNote, ppr.dailyPlan.id);
              showToast(t("opm.prodNote.toast"));
            }}
          >
            {t("opm.prodNote.save")}
          </button>
        </div>

        {workOrder.warRoomTeamInstructions.length ||
        workOrder.warRoomWatchList.length ||
        workOrder.warRoomBlockedItems.length ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.warRoom.section.title")}</h3>
            <p className="opm-wo-lede">{t("opm.warRoom.lede")}</p>
            {workOrder.warRoomTeamInstructions.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.warRoom.team")}</h4>
                <WoLines items={workOrder.warRoomTeamInstructions} />
              </>
            ) : null}
            {workOrder.warRoomWatchList.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.warRoom.watch")}</h4>
                <WoBullets items={workOrder.warRoomWatchList} />
              </>
            ) : null}
            {workOrder.warRoomBlockedItems.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.warRoom.blocked")}</h4>
                <WoLines items={workOrder.warRoomBlockedItems} />
              </>
            ) : null}
          </>
        ) : null}

        {workOrder.productionDoFirst.length ||
        workOrder.productionDelay.length ||
        workOrder.productionAvoid.length ||
        workOrder.productionBottleneckWatch.length ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.plan.section.title")}</h3>
            <p className="opm-wo-lede">{t("opm.plan.lede")}</p>
            {workOrder.productionDoFirst.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.plan.section.doFirst")}</h4>
                <WoLines items={workOrder.productionDoFirst} />
              </>
            ) : null}
            {workOrder.productionDelay.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.plan.section.delay")}</h4>
                <WoLines items={workOrder.productionDelay} />
              </>
            ) : null}
            {workOrder.productionAvoid.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.plan.section.avoid")}</h4>
                <WoLines items={workOrder.productionAvoid} />
              </>
            ) : null}
            {workOrder.productionBottleneckWatch.length ? (
              <>
                <h4 className="opm-wo-h4">{t("opm.plan.section.bottleneck")}</h4>
                <WoBullets items={workOrder.productionBottleneckWatch} />
              </>
            ) : null}
          </>
        ) : null}

        <h3 className="opm-wo-h3">{t("opm.wo.section.priority")}</h3>
        {workOrder.priorityTasks.length ? (
          <WoLines items={workOrder.priorityTasks} />
        ) : (
          <p className="opm-wo-empty">{t("opm.wo.empty.section")}</p>
        )}

        {workOrder.visualTasks.length ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.wo.section.visual")}</h3>
            <WoLines items={workOrder.visualTasks} />
          </>
        ) : null}
        {workOrder.cardTasks.length ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.wo.section.card")}</h3>
            <WoLines items={workOrder.cardTasks} />
          </>
        ) : null}
        {workOrder.launchTasks.length ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.wo.section.launch")}</h3>
            <WoLines items={workOrder.launchTasks} />
          </>
        ) : null}
        {workOrder.dataTasks.length ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.wo.section.data")}</h3>
            <WoLines items={workOrder.dataTasks} />
          </>
        ) : null}

        <h3 className="opm-wo-h3">{t("opm.wo.section.blocked")}</h3>
        {workOrder.blockedItems.length ? (
          <WoLines items={workOrder.blockedItems} />
        ) : (
          <p className="opm-wo-empty">{t("opm.wo.empty.blocked")}</p>
        )}

        <h3 className="opm-wo-h3">{t("opm.wo.section.check")}</h3>
        <WoBullets items={workOrder.checkBeforeFinish} />

        <h3 className="opm-wo-h3">{t("opm.wo.section.report")}</h3>
        <WoBullets items={workOrder.reportBackQuestions} />

        {workOrder.notes ? (
          <>
            <h3 className="opm-wo-h3">{t("opm.wo.section.notes")}</h3>
            <p className="opm-wo-notes">{workOrder.notes}</p>
          </>
        ) : null}
      </section>

      <section className="glass-panel opm-sec opm-sec--fb">
        <div className="opm-fb-head">
          <h2>{t("efb.section.title")}</h2>
          <div className="opm-fb-actions">
            <button type="button" className="primary-btn" onClick={commitFeedback}>
              {t("efb.action.commit")}
            </button>
            <button type="button" className="ghost-btn" onClick={copyFeedback}>
              {t("efb.action.copy")}
            </button>
            <button type="button" className="ghost-btn" onClick={exportFeedbackMd}>
              {t("efb.action.exportMd")}
            </button>
          </div>
        </div>
        <p className="opm-fb-lede">{t("efb.lede")}</p>
        {feedbackTasks.length ? (
          <ul className="opm-fb-list">
            {feedbackTasks.map((task) => (
              <FeedbackTaskRow key={`${task.source}-${task.id}`} task={task} t={t} />
            ))}
          </ul>
        ) : (
          <p className="opm-wo-empty">{t("efb.empty.tasks")}</p>
        )}
        <label className="opm-fb-label">{t("efb.notes.operator")}</label>
        <textarea
          className="opm-notes"
          value={operatorFbNotes}
          onChange={(e) => setOperatorFbNotes(e.target.value)}
          rows={2}
          placeholder={t("efb.notes.operatorPh")}
        />
        <label className="opm-fb-label">{t("efb.notes.founder")}</label>
        <textarea
          className="opm-notes"
          value={founderFbNotes}
          onChange={(e) => setFounderFbNotes(e.target.value)}
          rows={2}
          placeholder={t("efb.notes.founderPh")}
        />
        {feedbackReport.operationalProblems.length ? (
          <ul className="opm-fb-hints">
            {feedbackReport.operationalProblems.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <TaskSection title={t("opm.section.today")} tasks={brief.todayTasks} t={t} onStatus={setStatus} onOpen={openTask} />
      <TaskSection title={t("opm.section.visual")} tasks={brief.visualTasks} t={t} onStatus={setStatus} onOpen={openTask} />
      <TaskSection title={t("opm.section.card")} tasks={brief.cardTasks} t={t} onStatus={setStatus} onOpen={openTask} />
      <TaskSection title={t("opm.section.launch")} tasks={brief.launchTasks} t={t} onStatus={setStatus} onOpen={openTask} />
      <TaskSection title={t("opm.section.cleanup")} tasks={brief.dataCleanupTasks} t={t} onStatus={setStatus} onOpen={openTask} />
      <TaskSection title={t("opm.section.blocked")} tasks={brief.blockedTasks} t={t} onStatus={setStatus} onOpen={openTask} />

      <section className="glass-panel opm-sec">
        <h2>{t("opm.section.notes")}</h2>
        <textarea
          className="opm-notes"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={persistNotes}
          rows={4}
          placeholder={t("opm.notes.placeholder")}
        />
      </section>

      <style>{`
        .opm-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .opm-head { padding: 14px 16px; }
        .opm-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .opm-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .opm-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; }
        .opm-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .opm-sec { padding: 14px 16px; }
        .opm-sec--next { border-color: rgba(140,190,255,0.2); }
        .opm-next-title { margin: 0 0 8px; font-size: 1.05rem; font-weight: 600; }
        .opm-next-instr { margin: 0 0 12px; font-size: 0.9rem; line-height: 1.45; opacity: 0.9; }
        .opm-empty { margin: 0; opacity: 0.75; }
        .opm-conf { margin: 12px 0 0; font-size: 0.78rem; opacity: 0.7; }
        .opm-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .opm-task { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); }
        .opm-task--done { opacity: 0.55; }
        .opm-task--blocked { border-color: rgba(232,144,144,0.25); }
        .opm-task__title { background: none; border: none; padding: 0; color: inherit; font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
        .opm-task__title:hover { text-decoration: underline; }
        .opm-task__src { display: block; font-size: 0.72rem; opacity: 0.6; margin: 4px 0; text-transform: uppercase; }
        .opm-task__instr { margin: 0 0 8px; font-size: 0.88rem; line-height: 1.4; opacity: 0.88; }
        .opm-task__acts { display: flex; flex-wrap: wrap; gap: 6px; }
        .opm-task__btn { font-size: 0.75rem; padding: 4px 8px; }
        .opm-notes { width: 100%; box-sizing: border-box; font: inherit; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); color: inherit; resize: vertical; }
        .opm-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
        .opm-sec--wo { border-color: rgba(120,200,160,0.22); }
        .opm-wo-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 10px; }
        .opm-wo-date { margin: 4px 0 0; font-size: 0.85rem; opacity: 0.75; }
        .opm-wo-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .opm-wo-lede { margin: 0 0 14px; font-size: 0.88rem; opacity: 0.85; line-height: 1.45; }
        .opm-wo-h3 { margin: 14px 0 8px; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.7; }
        .opm-wo-h4 { margin: 10px 0 6px; font-size: 0.78rem; opacity: 0.75; }
        .opm-prod-note { margin: 12px 0 16px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .opm-prod-note__hint { font-size: 12px; opacity: 0.7; margin: 0 0 8px; }
        .opm-prod-note__input { width: 100%; font-size: 13px; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: inherit; margin-bottom: 8px; }
        .opm-wo-list { margin: 0 0 4px; padding-left: 18px; font-size: 0.9rem; line-height: 1.45; }
        .opm-wo-list li { margin-bottom: 8px; }
        .opm-wo-detail { display: block; margin-top: 4px; opacity: 0.85; font-weight: normal; }
        .opm-wo-empty { margin: 0 0 8px; opacity: 0.7; font-size: 0.88rem; }
        .opm-wo-notes { margin: 0; white-space: pre-wrap; font-size: 0.9rem; line-height: 1.45; }
        .opm-sec--fb { border-color: rgba(200,180,120,0.25); }
        .opm-fb-head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 8px; }
        .opm-fb-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .opm-fb-lede { margin: 0 0 12px; font-size: 0.88rem; opacity: 0.85; }
        .opm-fb-list { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 10px; }
        .opm-fb-task { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.12); }
        .opm-fb-task__title { margin: 0 0 4px; font-weight: 600; font-size: 0.9rem; }
        .opm-fb-task__src { margin: 0 0 8px; font-size: 0.72rem; opacity: 0.6; text-transform: uppercase; }
        .opm-fb-flags { display: flex; flex-wrap: wrap; gap: 10px 14px; }
        .opm-fb-flag { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; }
        .opm-fb-label { display: block; margin: 10px 0 4px; font-size: 0.78rem; opacity: 0.7; text-transform: uppercase; }
        .opm-fb-hints { margin: 12px 0 0; padding-left: 18px; font-size: 0.85rem; color: #e8c878; }
      `}</style>
    </div>
  );
}
