import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { DAILY_WAR_ROOM_EVENT } from "../lib/daily-war-room";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { OPERATOR_BRIEF_EVENT } from "../lib/operator-brief";
import { OPERATING_ROLE_MODE_EVENT } from "../lib/operating-role-mode";
import { PRODUCTION_PRESSURE_EVENT } from "../lib/production-pressure";
import {
  PRODUCTION_INPUT_EVENT,
  loadTodayProductionInput,
  saveMorningProductionInput,
  deriveMorningProductionSignals,
  type MorningProductionInput,
} from "../lib/production-input";
import {
  buildMorningFlowMarkdown,
  buildMorningFlowPlain,
  buildMorningOperatingFlow,
  buildMorningFlowMemoryPayload,
  markMorningStepBlocked,
  markMorningStepDone,
  MORNING_FLOW_EVENT,
  MORNING_FLOW_STEP_IDS,
  notifyMorningFlowUpdated,
  resetMorningStep,
  saveMorningFlowSession,
  loadMorningFlowProgress,
  type MorningFlowStepId,
} from "../lib/morning-operating-flow";
import {
  buildOperatorBrief,
  buildOperatorWorkOrder,
  buildOperatorWorkOrderPlain,
} from "../lib/operator-brief";
import { EVENING_CLOSE_EVENT, loadEveningCloseForMorning } from "../lib/evening-close";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function readinessClass(r: string): string {
  return `mflow-readiness mflow-readiness--${r}`;
}

type ProductionInputFormProps = {
  existing: MorningProductionInput | null;
  onSaved: () => void;
};

function ProductionInputForm({ existing, onSaved }: ProductionInputFormProps) {
  const [editing, setEditing] = useState(!existing);
  const [queue, setQueue] = useState(String(existing?.printQueueDepth ?? ""));
  const [capacity, setCapacity] = useState(String(existing?.shiftCapacityUnits ?? ""));
  const [staff, setStaff] = useState(existing?.shiftStaffConfirmed ?? true);
  const [packaging, setPackaging] = useState(String(existing?.packagingUnitsOnHand ?? ""));

  const handleSave = () => {
    const q = parseInt(queue, 10);
    const c = parseInt(capacity, 10);
    const p = parseInt(packaging, 10);
    if (isNaN(q) || isNaN(c) || isNaN(p)) return;
    const today = new Date().toISOString().slice(0, 10);
    saveMorningProductionInput({
      date: today,
      printQueueDepth: q,
      shiftCapacityUnits: c,
      shiftStaffConfirmed: staff,
      packagingUnitsOnHand: p,
    });
    setEditing(false);
    onSaved();
  };

  if (!editing && existing) {
    const signals = deriveMorningProductionSignals(existing);
    const signalColors: Record<string, string> = {
      critical: "#e07878",
      warn: "#d4a45a",
      info: "rgba(160,190,255,0.8)",
    };
    // Only show packaging signal if it's actually risky — don't surface it as a main KPI
    const flowSignals = signals.filter((s) => s.id !== "packaging_risk");
    const packagingRisk = signals.find((s) => s.id === "packaging_risk");
    const noFlowIssues = flowSignals.length === 0;
    const flowSignalLabels: Record<string, string> = {
      queue_overload: "Перегруз производства",
      queue_near_limit: "Нагрузка у предела",
      shift_unconfirmed: "Смена не подтверждена",
    };
    const constraintStatus = [
      existing.shiftStaffConfirmed ? "Смена подтверждена" : "⚠ Смена не подтверждена",
      packagingRisk ? "⚠ Риск по упаковке" : "Упаковка в порядке",
    ];
    return (
      <div className="pinput-done">
        <div className="pinput-done__title">
          <span className="pinput-done__icon" aria-hidden>✅</span>
          Утренняя смена сохранена
        </div>

        <div className="pinput-done__flow">
          <div className="pinput-done__cell">
            <span className="pinput-done__cell-k">Очередь заказов</span>
            <span className="pinput-done__cell-v">{existing.printQueueDepth}</span>
          </div>
          <div className="pinput-done__cell">
            <span className="pinput-done__cell-k">Мощность смены</span>
            <span className="pinput-done__cell-v">{existing.shiftCapacityUnits}</span>
          </div>
        </div>

        <div className="pinput-done__constraints">
          <span className="pinput-done__constraints-k">Ограничения</span>
          <div className="pinput-done__constraints-list">
            {constraintStatus.map((s) => (
              <span key={s} className={`pinput-done__constraint ${s.startsWith("⚠") ? "pinput-done__constraint--warn" : ""}`}>{s}</span>
            ))}
          </div>
        </div>

        <div className="pinput-done__interp">
          {noFlowIssues ? (
            <span className="pinput-done__interp-ok">Нормальная нагрузка — перегруза нет</span>
          ) : (
            <ul className="pinput-done__signals">
              {flowSignals.map((s) => (
                <li key={s.id} className="pinput-done__signal" style={{ color: signalColors[s.severity] }}>
                  {flowSignalLabels[s.id] ?? s.id}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" className="pinput-edit-btn" onClick={() => setEditing(true)}>
          Изменить
        </button>
      </div>
    );
  }

  return (
    <div className="pinput-wrap">
      <div className="pinput-header">
        <p className="pinput-header__title">Готовность смены</p>
        <p className="pinput-header__desc">Заполни утром — система посчитает риск перегруза и приоритеты.</p>
      </div>
      <form
        className="pinput-form"
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
      >
        <div className="pinput-group">
          <span className="pinput-group__label">Поток</span>
          <div className="pinput-group__cards">
            <label className="pinput-card">
              <span className="pinput-card__name">Очередь заказов</span>
              <input
                type="number"
                min={0}
                className="pinput-card__input"
                value={queue}
                onChange={(e) => setQueue(e.target.value)}
                placeholder="например 300"
              />
            </label>
            <label className="pinput-card">
              <span className="pinput-card__name">Мощность смены</span>
              <input
                type="number"
                min={0}
                className="pinput-card__input"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="например 600"
              />
            </label>
          </div>
        </div>

        <div className="pinput-group">
          <span className="pinput-group__label">Ограничения</span>
          <div className="pinput-group__cards">
            <label className="pinput-card pinput-card--check">
              <span className="pinput-card__name">Смена подтверждена</span>
              <span className="pinput-card__toggle">
                <input
                  type="checkbox"
                  className="pinput-card__checkbox"
                  checked={staff}
                  onChange={(e) => setStaff(e.target.checked)}
                  id="pinput-staff"
                />
                <span className="pinput-card__toggle-track" aria-hidden>
                  <span className="pinput-card__toggle-thumb" />
                </span>
                <span className="pinput-card__toggle-label">{staff ? "Да" : "Нет"}</span>
              </span>
            </label>
            <label className="pinput-card">
              <span className="pinput-card__name">Упаковка есть с запасом</span>
              <input
                type="number"
                min={0}
                className="pinput-card__input"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                placeholder="например 500"
              />
              <span className="pinput-card__hint">единиц на складе</span>
            </label>
          </div>
          <p className="pinput-group__note">Упаковка — один из ограничителей потока. Позже сюда добавим КИЗы, футболки, плёнку, клей и принтер.</p>
        </div>

        <button type="submit" className="pinput-save-btn">
          Сохранить утренние данные
        </button>
      </form>
    </div>
  );
}

export function MorningStartView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    const events = [
      ENTITY_SNAPSHOT_EVENT,
      ASSORTMENT_ACTIONS_EVENT,
      HERO_COMMAND_EVENT,
      LAUNCH_OPS_EVENT,
      DAILY_WAR_ROOM_EVENT,
      OPERATOR_BRIEF_EVENT,
      PRODUCTION_PRESSURE_EVENT,
      PRODUCTION_INPUT_EVENT,
      OPERATING_ROLE_MODE_EVENT,
      MORNING_FLOW_EVENT,
      EVENING_CLOSE_EVENT,
    ];
    for (const e of events) window.addEventListener(e, bump);
    return () => {
      for (const e of events) window.removeEventListener(e, bump);
    };
  }, []);

  const flow = useMemo(() => buildMorningOperatingFlow(t, locale), [tick, t, locale]);
  const priorClose = useMemo(() => loadEveningCloseForMorning(), [tick]);
  const productionInput = useMemo(() => loadTodayProductionInput(), [tick]);

  const workOrderPlain = useMemo(() => {
    const brief = buildOperatorBrief(t);
    const order = buildOperatorWorkOrder(brief, t, locale);
    return buildOperatorWorkOrderPlain(order, t);
  }, [tick, t, locale]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  const onDone = useCallback(
    (stepId: MorningFlowStepId) => {
      markMorningStepDone(stepId, t, locale, flow.id);
      refresh();
      if (stepId === "save_start_snapshot") showToast(t("mflow.toast.snapshot"));
    },
    [flow.id, locale, refresh, showToast, t],
  );

  const onBlocked = useCallback(
    (stepId: MorningFlowStepId) => {
      markMorningStepBlocked(stepId, t, locale, flow.id);
      refresh();
    },
    [flow.id, locale, refresh, t],
  );

  const onReset = useCallback(
    (stepId: MorningFlowStepId) => {
      resetMorningStep(stepId, t, locale, flow.id);
      refresh();
    },
    [flow.id, locale, refresh, t],
  );

  const saveMemory = useCallback(() => {
    const progress = loadMorningFlowProgress();
    if (!progress) return;
    const payload = buildMorningFlowMemoryPayload(flow, progress);
    saveMorningFlowSession(payload);
    recordGeneration({
      module: "morning_flow",
      title: t("mflow.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`mflow.readiness.${flow.readiness}`),
    });
    notifyMorningFlowUpdated();
    showToast(t("mflow.toast.saved"));
  }, [flow, showToast, t]);

  const copySummary = useCallback(() => {
    void copyToClipboard(buildMorningFlowPlain(flow, t));
    showToast(t("mflow.toast.copied"));
  }, [flow, showToast, t]);

  const total = MORNING_FLOW_STEP_IDS.length;
  const done = flow.completedSteps.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mflow-page">
      <header className="glass-panel mflow-head">
        <p className="mflow-eyebrow">{t("mflow.eyebrow")}</p>
        <h1>{t("nav.morningStart")}</h1>
        <p className="mflow-lede">{t("mflow.lede")}</p>
        <p className="mflow-date">{flow.dateLabel}</p>
        <div className="mflow-head__meta">
          <span className={readinessClass(flow.readiness)}>{t(`mflow.readiness.${flow.readiness}`)}</span>
          <span className="mflow-mode">{t("orm.currentMode", { mode: t(`orm.mode.${flow.roleMode}`) })}</span>
        </div>
        <div className="mflow-progress" aria-label={t("mflow.progressAria")}>
          <div className="mflow-progress__bar" style={{ width: `${pct}%` }} />
          <span className="mflow-progress__txt">
            {t("mflow.progress", { done: String(done), total: String(total) })}
          </span>
        </div>
        <p className="mflow-conf">{t(flow.confidenceNote)}</p>
        <div className="mflow-head__actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dailyPilot")}>
            {t("mflow.link.dailyPilot")}
          </button>
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("mflow.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={copySummary}>
            {t("mflow.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadText(`morning-${flow.id}.md`, buildMorningFlowMarkdown(flow, t))}>
            {t("mflow.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`morning-${flow.id}.json`, flow)}>
            {t("mflow.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="mflow-toast">{toast}</p> : null}

      {priorClose ? (
        <section className="glass-panel mflow-sec mflow-sec--prior">
          <h2>{t("mflow.section.priorClose")}</h2>
          <p className="mflow-prior-meta">
            {t("mflow.prior.readiness", { state: t(`eclose.tomorrow.${priorClose.tomorrowReadiness}`) })}
          </p>
          {priorClose.preloadMorningFocus.length ? (
            <>
              <h3 className="mflow-prior-h">{t("mflow.prior.focus")}</h3>
              <ul className="mflow-prior-list">
                {priorClose.preloadMorningFocus.map((x) => (
                  <li key={x.text}>{x.text}</li>
                ))}
              </ul>
            </>
          ) : null}
          {priorClose.tomorrowCarryForward.length ? (
            <>
              <h3 className="mflow-prior-h">{t("mflow.prior.carry")}</h3>
              <ul className="mflow-prior-list">
                {priorClose.tomorrowCarryForward.slice(0, 5).map((x) => (
                  <li key={x.text}>{x.text}</li>
                ))}
              </ul>
            </>
          ) : null}
          {priorClose.tomorrowWarnings.length ? (
            <>
              <h3 className="mflow-prior-h">{t("mflow.prior.warnings")}</h3>
              <ul className="mflow-prior-list mflow-prior-list--warn">
                {priorClose.tomorrowWarnings.slice(0, 4).map((x) => (
                  <li key={x.text}>{x.text}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {flow.isComplete ? (
        <section className="glass-panel mflow-sec mflow-sec--done">
          <h2>{t("mflow.section.complete")}</h2>
          <p>{t("mflow.complete.lede")}</p>
          {flow.startSnapshot ? (
            <p className="mflow-snap-hint">
              {t("mflow.complete.snapshot", {
                state: t(`dwr.state.${flow.startSnapshot.dailyState}`),
              })}
            </p>
          ) : null}
          <button type="button" className="primary-btn" onClick={() => onNavigate("warRoom")}>
            {t("mflow.action.openWarRoom")}
          </button>
        </section>
      ) : (
        <section className="glass-panel mflow-sec mflow-sec--current">
          <h2>{t("mflow.section.current")}</h2>
          <p className="mflow-current-title">{t(flow.steps.find((s) => s.id === flow.currentStep)?.titleKey ?? "")}</p>
          <p className="mflow-current-why">
            {t(flow.steps.find((s) => s.id === flow.currentStep)?.whyKey ?? "")}
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => onNavigate(flow.nextAction.navId)}
          >
            {t("mflow.action.openModule")}
          </button>
        </section>
      )}

      {flow.workOrderReady || flow.currentStep === "prepare_operator_work_order" ? (
        <section className="glass-panel mflow-sec mflow-sec--wo">
          <h2>{t("mflow.section.workOrder")}</h2>
          <p>{t("mflow.workOrder.lede", { n: String(flow.workOrderTaskCount) })}</p>
          <div className="mflow-wo-actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("operatorMode")}>
              {t("mflow.action.openOperator")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                void copyToClipboard(workOrderPlain);
                showToast(t("mflow.toast.workOrderCopied"));
              }}
            >
              {t("mflow.action.copyWorkOrder")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="glass-panel mflow-sec">
        <h2>{t("mflow.section.steps")}</h2>
        <ol className="mflow-steps">
          {flow.steps.map((step) => {
            const isCurrent = step.id === flow.currentStep && !flow.isComplete;
            return (
              <li
                key={step.id}
                className={`mflow-step mflow-step--${step.status}${isCurrent ? " mflow-step--current" : ""}`}
              >
                <div className="mflow-step__head">
                  <span className="mflow-step__title">{t(step.titleKey)}</span>
                  <span className={`mflow-step__status mflow-step__status--${step.status}`}>
                    {t(`mflow.status.${step.status}`)}
                  </span>
                </div>
                <p className="mflow-step__why">{t(step.whyKey)}</p>
                {step.id === "check_production_capacity" && (
                  <ProductionInputForm
                    existing={productionInput}
                    onSaved={refresh}
                  />
                )}
                {step.hintKey ? (
                  <p className="mflow-step__hint">{t(step.hintKey, step.hintVars)}</p>
                ) : null}
                <div className="mflow-step__acts">
                  <button type="button" className="ghost-btn" onClick={() => onNavigate(step.navId)}>
                    {t("mflow.action.openModule")}
                  </button>
                  {step.status !== "done" ? (
                    <button type="button" className="primary-btn" onClick={() => onDone(step.id)}>
                      {t("mflow.action.done")}
                    </button>
                  ) : (
                    <button type="button" className="ghost-btn" onClick={() => onReset(step.id)}>
                      {t("mflow.action.reset")}
                    </button>
                  )}
                  {step.status !== "blocked" ? (
                    <button type="button" className="ghost-btn mflow-step__block" onClick={() => onBlocked(step.id)}>
                      {t("mflow.action.blocked")}
                    </button>
                  ) : (
                    <button type="button" className="ghost-btn" onClick={() => onReset(step.id)}>
                      {t("mflow.action.unblock")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="glass-panel mflow-sec mflow-sec--summary">
        <h2>{t("mflow.section.summary")}</h2>
        <p>{t("mflow.summary.next", { action: flow.nextAction.text })}</p>
      </section>

      <style>{`
        .mflow-page { max-width: 720px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .mflow-head { padding: 20px; }
        .mflow-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin: 0 0 6px; }
        .mflow-lede { margin: 8px 0; opacity: 0.85; font-size: 14px; }
        .mflow-date { font-size: 12px; opacity: 0.65; margin: 0 0 10px; }
        .mflow-head__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .mflow-readiness { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
        .mflow-readiness--ready { background: rgba(80, 200, 120, 0.15); color: #6fd89a; }
        .mflow-readiness--needs_attention { background: rgba(255, 200, 80, 0.12); color: #e8c46a; }
        .mflow-readiness--blocked { background: rgba(255, 90, 90, 0.15); color: #ff8a8a; }
        .mflow-mode { font-size: 12px; opacity: 0.7; }
        .mflow-progress { position: relative; height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; margin: 12px 0 8px; overflow: hidden; }
        .mflow-progress__bar { height: 100%; background: linear-gradient(90deg, rgba(123,143,255,0.5), rgba(140,100,220,0.6)); border-radius: inherit; transition: width 0.35s ease; }
        .mflow-progress__txt { font-size: 12px; opacity: 0.75; display: block; margin-top: 6px; }
        .mflow-conf { font-size: 12px; opacity: 0.65; margin: 8px 0 0; }
        .mflow-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .mflow-sec { padding: 16px 18px; }
        .mflow-sec h2 { margin: 0 0 10px; font-size: 14px; }
        .mflow-current-title { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
        .mflow-current-why { font-size: 13px; opacity: 0.85; margin: 0 0 12px; }
        .mflow-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .mflow-step { padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); }
        .mflow-step--current { border-color: rgba(123, 143, 255, 0.4); box-shadow: 0 0 0 1px rgba(123, 143, 255, 0.15); }
        .mflow-step--done { opacity: 0.72; }
        .mflow-step__head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; margin-bottom: 6px; }
        .mflow-step__title { font-weight: 600; font-size: 13px; }
        .mflow-step__status { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.65; }
        .mflow-step__why, .mflow-step__hint { font-size: 12px; opacity: 0.8; margin: 0 0 8px; }
        .mflow-step__acts { display: flex; flex-wrap: wrap; gap: 6px; }
        .mflow-step__block { opacity: 0.85; }
        .mflow-wo-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .mflow-toast { text-align: center; font-size: 13px; opacity: 0.85; }
        .mflow-sec--prior { border-color: rgba(140, 100, 220, 0.25); }
        .mflow-prior-meta { font-size: 13px; margin: 0 0 10px; opacity: 0.85; }
        .mflow-prior-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin: 10px 0 6px; opacity: 0.7; }
        .mflow-prior-list { margin: 0; padding-left: 18px; font-size: 13px; }
        .mflow-prior-list--warn { color: #e8c46a; }
        .pinput-wrap { margin: 12px 0 4px; display: grid; gap: 14px; }
        .pinput-header__title { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
        .pinput-header__desc { font-size: 12px; opacity: 0.65; margin: 0; }
        .pinput-form { display: grid; gap: 12px; }
        .pinput-group { display: grid; gap: 8px; }
        .pinput-group__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.45; }
        .pinput-group__cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .pinput-group__note { font-size: 11px; opacity: 0.45; margin: 2px 0 0; line-height: 1.5; }
        .pinput-card { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); cursor: text; }
        .pinput-card--check { cursor: default; }
        .pinput-card__name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.6; }
        .pinput-card__hint { font-size: 10px; opacity: 0.35; margin-top: 2px; }
        .pinput-card__input { background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.18); color: var(--text); font-family: var(--font-body); font-size: 20px; font-weight: 600; padding: 4px 0; width: 100%; box-sizing: border-box; }
        .pinput-card__input::placeholder { font-size: 13px; font-weight: 400; opacity: 0.35; color: var(--text); }
        .pinput-card__input:focus { outline: none; border-bottom-color: rgba(123,143,255,0.6); }
        .pinput-card__toggle { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
        .pinput-card__checkbox { position: absolute; opacity: 0; width: 0; height: 0; }
        .pinput-card__toggle-track { position: relative; width: 38px; height: 22px; border-radius: 99px; background: rgba(255,255,255,0.12); flex-shrink: 0; transition: background 0.2s; cursor: pointer; }
        .pinput-card__checkbox:checked + .pinput-card__toggle-track { background: rgba(80,200,120,0.45); }
        .pinput-card__toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,0.7); transition: transform 0.2s; }
        .pinput-card__checkbox:checked + .pinput-card__toggle-track .pinput-card__toggle-thumb { transform: translateX(16px); background: #6fd89a; }
        .pinput-card__toggle-label { font-size: 13px; font-weight: 600; opacity: 0.85; }
        .pinput-save-btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: rgba(123,143,255,0.2); border: 1px solid rgba(123,143,255,0.35); color: rgba(180,200,255,0.95); font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; transition: background 0.15s; }
        .pinput-save-btn:hover { background: rgba(123,143,255,0.3); }
        .pinput-done { margin: 12px 0 4px; padding: 16px 18px; border-radius: 12px; background: rgba(80,200,120,0.08); border: 1px solid rgba(80,200,120,0.25); display: grid; gap: 14px; }
        .pinput-done__title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #8ae6a8; }
        .pinput-done__icon { font-size: 18px; line-height: 1; }
        .pinput-done__flow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pinput-done__cell { display: flex; flex-direction: column; gap: 3px; }
        .pinput-done__cell-k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.5; }
        .pinput-done__cell-v { font-size: 22px; font-weight: 700; }
        .pinput-done__constraints { display: grid; gap: 5px; padding-top: 4px; }
        .pinput-done__constraints-k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.45; }
        .pinput-done__constraints-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .pinput-done__constraint { font-size: 12px; font-weight: 500; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,0.06); }
        .pinput-done__constraint--warn { background: rgba(212,164,90,0.15); color: #d4a45a; }
        .pinput-done__interp { padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
        .pinput-done__interp-ok { font-size: 13px; color: #6fd89a; font-weight: 500; }
        .pinput-done__signals { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
        .pinput-done__signal { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .pinput-done__signal::before { content: "▲"; font-size: 9px; }
        .pinput-edit-btn { align-self: start; background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: var(--muted); font-family: var(--font-body); font-size: 11px; padding: 4px 10px; cursor: pointer; }
        .pinput-edit-btn:hover { border-color: rgba(255,255,255,0.28); }
      `}</style>
    </div>
  );
}
