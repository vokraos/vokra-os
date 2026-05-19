import { useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { EXECUTION_FEEDBACK_EVENT } from "../lib/execution-feedback";
import { FOUNDER_BRIEF_EVENT } from "../lib/founder-brief";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { OPERATOR_BRIEF_EVENT } from "../lib/operator-brief";
import { PRODUCTION_PRESSURE_EVENT } from "../lib/production-pressure";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { CONTROL_TOWER_EVENT } from "../lib/strategic-control-tower";
import {
  buildDailyWarRoomSnapshot,
  DAILY_WAR_ROOM_EVENT,
  type DailyWarRoomSnapshot,
  type WarRoomLine,
} from "../lib/daily-war-room";
import {
  buildFounderCommandBrief,
  buildConstraintDisplay,
  gatherFounderBriefContext,
  isNominalBlocked,
  type BriefField,
} from "../lib/founder-brief";
import { EVENING_CLOSE_EVENT, loadEveningCloseForMorning } from "../lib/evening-close";
import {
  loadMorningFlowProgress,
  MORNING_FLOW_EVENT,
  MORNING_FLOW_STEP_IDS,
} from "../lib/morning-operating-flow";
import {
  PRODUCTION_INPUT_EVENT,
  getTopProductionSignal,
  loadTodayProductionInput,
} from "../lib/production-input";
import { deriveProductionPhase, phaseNextActionLabel, type ProductionPhaseId } from "../lib/production-phase";

type Props = { onNavigate: (id: NavId) => void };

function isWarningConf(key: string) {
  return key.includes("warn") || key.includes("launchLow") || key.includes("noSnap");
}

/* Map current production phase to the timeline node it lives in. */
type TimelineNodeKey = "morning" | "production" | "control" | "close";

function timelineNodeForPhase(phaseId: ProductionPhaseId): TimelineNodeKey {
  switch (phaseId) {
    case "pre_shift":
    case "morning_wb":
      return "morning";
    case "ozon":
    case "evening_wb":
    case "recovery":
      return "production";
    case "off_hours":
      return "close";
    default:
      return "production";
  }
}

/* ─── Atomic row components ───────────────────────────────────────────────── */

function OpLine({
  label,
  line,
  onGo,
  dim,
}: {
  label: string;
  line: WarRoomLine;
  onGo: () => void;
  dim?: boolean;
}) {
  return (
    <button type="button" className={`cc-line${dim ? " cc-line--dim" : ""}`} onClick={onGo}>
      <span className="cc-line__lab">{label}</span>
      <span className="cc-line__txt">{line.text}</span>
    </button>
  );
}

function BriefRow({
  label,
  field,
  onGo,
}: {
  label: string;
  field: BriefField;
  onGo: () => void;
}) {
  return (
    <button type="button" className="cc-line cc-line--brief" onClick={onGo}>
      <span className="cc-line__lab">{label}</span>
      <span className="cc-line__txt">{field.text}</span>
    </button>
  );
}

function stateLabel(state: DailyWarRoomSnapshot["dailyState"], t: (k: string) => string) {
  return t(`dwr.state.${state}`);
}

/* ─── Main view ───────────────────────────────────────────────────────────── */

export function CommandCenterView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(0);
  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setClockTick((x) => x + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    const events = [
      ENTITY_SNAPSHOT_EVENT,
      ASSORTMENT_ACTIONS_EVENT,
      HERO_COMMAND_EVENT,
      LAUNCH_OPS_EVENT,
      FOUNDER_BRIEF_EVENT,
      CONTROL_TOWER_EVENT,
      OPERATOR_BRIEF_EVENT,
      EXECUTION_FEEDBACK_EVENT,
      PRODUCTION_PRESSURE_EVENT,
      SCALING_SAFETY_EVENT,
      DAILY_WAR_ROOM_EVENT,
      EVENING_CLOSE_EVENT,
      MORNING_FLOW_EVENT,
      PRODUCTION_INPUT_EVENT,
    ];
    for (const e of events) window.addEventListener(e, bump);
    return () => { for (const e of events) window.removeEventListener(e, bump); };
  }, []);

  const snapshot        = useMemo(() => buildDailyWarRoomSnapshot(t, locale), [tick, t, locale]);
  const brief           = useMemo(() => buildFounderCommandBrief(gatherFounderBriefContext(), t), [tick, t]);
  const briefConstraint = useMemo(() => buildConstraintDisplay(brief, t), [brief, t]);
  const showBriefBlocked  = useMemo(
    () => !isNominalBlocked(brief.topBlockedItem.text, t),
    [brief.topBlockedItem.text, t],
  );
  const priorClose      = useMemo(() => loadEveningCloseForMorning(), [tick]);
  const morningProgress = useMemo(() => loadMorningFlowProgress(), [tick]);
  const topSignal       = useMemo(() => getTopProductionSignal(), [tick]);
  const morningInput    = useMemo(() => loadTodayProductionInput(), [tick]);
  const productionPhase = useMemo(() => deriveProductionPhase(), [clockTick, tick]);

  const hasMorningInput  = morningInput !== null;
  const totalSteps       = MORNING_FLOW_STEP_IDS.length;
  const completedSteps   = morningProgress?.completedSteps.length ?? 0;
  const morningComplete  = completedSteps >= totalSteps;
  const morningStarted   = morningProgress !== null && completedSteps > 0;
  const topBlocked       = snapshot.blockedItems.slice(0, 3);
  const carryForward     = priorClose?.tomorrowCarryForward ?? [];
  const nextAction       = phaseNextActionLabel(productionPhase);
  const isWarning        = isWarningConf(snapshot.confidenceNote);

  const tlMorningState = morningComplete ? "done" : morningStarted ? "active" : "hot";
  const tlNow          = timelineNodeForPhase(productionPhase.id);

  return (
    <div className="cc">

      {/* ── Header strip ──────────────────────────────────────────────────── */}
      <div className="cc-hdr">
        <div className="cc-hdr__left">
          <span className="cc-hdr__date">{snapshot.dateLabel}</span>
          <span className={`cc-state-pip cc-state-pip--${snapshot.dailyState}`}>
            {stateLabel(snapshot.dailyState, t)}
          </span>
          {isWarning && (
            <span className="cc-hdr__warn">{t(snapshot.confidenceNote)}</span>
          )}
        </div>
        {topSignal && (
          <button
            type="button"
            className={`cc-signal-flag cc-signal-flag--${topSignal.severity}`}
            onClick={() => onNavigate("productionPressure")}
          >
            <span className="cc-signal-flag__dot" aria-hidden />
            {t(topSignal.labelKey, topSignal.labelVars)}
          </button>
        )}
      </div>

      {/* ── Phase hero — dominant operational surface ──────────────────────── */}
      <div className={`cc-hero cc-hero--${productionPhase.urgency}`}>
        <div className="cc-hero__meta">
          <span className="cc-hero__cap">Текущий этап смены</span>
          {productionPhase.windowLabel && (
            <span className="cc-hero__window">{productionPhase.windowLabel}</span>
          )}
        </div>
        <h1 className="cc-hero__phase">{productionPhase.label}</h1>
        <p className="cc-hero__goal">{productionPhase.goal}</p>
        {(nextAction || snapshot.nextRoute.text) && (
          <button
            type="button"
            className={`cc-hero__cta cc-hero__cta--${productionPhase.urgency}`}
            onClick={() =>
              snapshot.nextRoute.navId
                ? onNavigate(snapshot.nextRoute.navId)
                : onNavigate("productionPressure")
            }
          >
            {nextAction || snapshot.nextRoute.text}
            <span className="cc-hero__cta-arrow" aria-hidden>→</span>
          </button>
        )}
      </div>

      {/* ── Asymmetric body: ops (5fr) + founder context (3fr) ────────────── */}
      <div className="cc-body">

        {/* LEFT — Operational focus */}
        <div className="cc-ops">
          <span className="cc-col-cap">Фокус смены</span>
          <div className="cc-lines">
            <OpLine
              label={t("dwr.focus.founder")}
              line={snapshot.founderFocus}
              onGo={() => snapshot.founderFocus.navId && onNavigate(snapshot.founderFocus.navId)}
            />
            <OpLine
              label={t("dwr.focus.operator")}
              line={snapshot.operatorFocus}
              onGo={() => snapshot.operatorFocus.navId && onNavigate(snapshot.operatorFocus.navId)}
            />
            <OpLine
              label={t("dwr.focus.production")}
              line={snapshot.productionFocus}
              onGo={() =>
                snapshot.productionFocus.navId && onNavigate(snapshot.productionFocus.navId)
              }
              dim
            />
          </div>

          {topBlocked.length > 0 && (
            <div className="cc-blocked">
              <span className="cc-col-cap cc-col-cap--warn">{t("dwr.section.blocked")}</span>
              <ul className="cc-blocked__list">
                {topBlocked.map((line) =>
                  line.navId ? (
                    <li key={line.text}>
                      <button
                        type="button"
                        className="cc-blocked__btn"
                        onClick={() => line.navId && onNavigate(line.navId)}
                      >
                        {line.text}
                      </button>
                    </li>
                  ) : (
                    <li key={line.text} className="cc-blocked__txt">{line.text}</li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT — Founder context */}
        <div className="cc-context">
          <span className="cc-col-cap">{t("nav.founderBrief")}</span>
          <div className="cc-lines">
            {showBriefBlocked ? (
              <BriefRow
                label={t("fbrief.primary.blocked")}
                field={brief.topBlockedItem}
                onGo={() => onNavigate(brief.topBlockedItem.navId)}
              />
            ) : null}
            <BriefRow
              label={t("fbrief.primary.action")}
              field={brief.topTodayAction}
              onGo={() => onNavigate(brief.topTodayAction.navId)}
            />
            <BriefRow
              label={t("fbrief.primary.leverage")}
              field={brief.highestLeverageMove}
              onGo={() => onNavigate(brief.highestLeverageMove.navId)}
            />
            {briefConstraint ? (
              <BriefRow
                label={t("fbrief.primary.constraint")}
                field={{ text: briefConstraint.text, navId: briefConstraint.navId }}
                onGo={() => onNavigate(briefConstraint.navId)}
              />
            ) : null}
          </div>
          {carryForward.length > 0 && (
            <div className="cc-carry">
              <span className="cc-col-cap">{t("dwr.section.carryPressure")}</span>
              <ul className="cc-carry__list">
                {carryForward.slice(0, 3).map((line) => (
                  <li key={line.text} className="cc-carry__item">{line.text}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            className="cmd-act cmd-act--primary cc-context__open"
            onClick={() => onNavigate("founderBrief")}
          >
            {t("nav.founderBrief")} →
          </button>
        </div>
      </div>

      {/* ── Morning data — inline operational command ──────────────────────── */}
      <button
        type="button"
        className={`cc-morning-line cc-morning-line--${hasMorningInput ? "ok" : "empty"}`}
        onClick={() => onNavigate("morningStart")}
      >
        <span className="cc-morning-line__ind" aria-hidden />
        <span className="cc-morning-line__txt">
          {hasMorningInput ? "Утренний запуск внесён" : "Утренний запуск не внесён"}
        </span>
        <span className="cc-morning-line__act">
          {hasMorningInput ? "Изменить →" : "Внести →"}
        </span>
      </button>

      {/* ── Production timeline ──────────────────────────────────────────────── */}
      <div className="cc-tl" role="navigation" aria-label="Производственный ритм">
        <button
          type="button"
          className={`cc-tl__node cc-tl__node--${tlMorningState}`}
          data-sig-priority={tlNow === "morning" ? "dominant" : undefined}
          onClick={() => onNavigate("morningStart")}
        >
          <span className="cc-tl__node-cap">Запуск смены</span>
          <span className="cc-tl__node-label">
            {morningComplete
              ? `✓ ${t("nav.morningStart")}`
              : morningStarted
              ? `${t("nav.morningStart")} ${completedSteps}/${totalSteps}`
              : "Утренний запуск"}
          </span>
          <span className="cc-tl__node-hint">
            {morningStarted && !morningComplete
              ? t("mflow.hint.inProgress")
              : hasMorningInput ? "данные внесены" : "данные не внесены"}
          </span>
        </button>
        <div className="cc-tl__sep" aria-hidden />
        <button
          type="button"
          className="cc-tl__node cc-tl__node--warm"
          data-sig-priority={tlNow === "production" ? "dominant" : undefined}
          onClick={() => onNavigate("productionPressure")}
        >
          <span className="cc-tl__node-cap">В течение смены</span>
          <span className="cc-tl__node-label">{t("nav.productionPressure")}</span>
          <span className="cc-tl__node-hint">контроль давления</span>
        </button>
        <div className="cc-tl__sep" aria-hidden />
        <button
          type="button"
          className="cc-tl__node cc-tl__node--cold"
          data-sig-priority={tlNow === "control" ? "dominant" : undefined}
          onClick={() => onNavigate("controlTower")}
        >
          <span className="cc-tl__node-cap">Управление</span>
          <span className="cc-tl__node-label">{t("nav.controlTower")}</span>
          <span className="cc-tl__node-hint">башня контроля</span>
        </button>
        <div className="cc-tl__sep" aria-hidden />
        <button
          type="button"
          className="cc-tl__node cc-tl__node--cold"
          data-sig-priority={tlNow === "close" ? "dominant" : undefined}
          onClick={() => onNavigate("eveningClose")}
        >
          <span className="cc-tl__node-cap">Финал дня</span>
          <span className="cc-tl__node-label">{t("dwr.action.closeDay")}</span>
          <span className="cc-tl__node-hint">закрытие смены</span>
        </button>
      </div>

      <style>{`
        /* ── Page shell ──────────────────────────────────────────────────────── */
        .cc {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 0 72px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Header ──────────────────────────────────────────────────────────── */
        .cc-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line-faint);
          margin-bottom: 0;
        }
        .cc-hdr__left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .cc-hdr__date {
          font-size: 0.64rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--c4);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .cc-state-pip {
          font-size: 0.60rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--c3);
          padding: 3px 9px;
          border-radius: 4px;
          background: var(--surface-1);
          border: 1px solid var(--line-faint);
          white-space: nowrap;
        }
        .cc-state-pip--at_risk   { color: rgba(220, 170, 80, 0.95); background: rgba(210, 145, 60, 0.10); border-color: rgba(210,145,60,0.20); }
        .cc-state-pip--blocked   { color: rgba(225, 100, 90, 0.95); background: rgba(200, 70, 70, 0.10);  border-color: rgba(200,70,70,0.22); }
        .cc-state-pip--on_track  { color: rgba(100, 210, 150, 0.95); background: rgba(70, 170, 110, 0.10); border-color: rgba(70,170,110,0.22); }
        .cc-hdr__warn {
          font-size: 0.66rem;
          color: rgba(220, 170, 80, 0.92);
          letter-spacing: 0.04em;
          min-width: 0;
        }

        /* Signal flag */
        .cc-signal-flag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: none;
          background: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 0.70rem;
          letter-spacing: 0.04em;
          padding: 3px 0;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.16s;
        }
        .cc-signal-flag:hover { opacity: 0.72; }
        .cc-signal-flag__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: cc-dot-pulse 2.4s ease-in-out infinite;
        }
        @keyframes cc-dot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .cc-signal-flag--info    { color: rgba(148, 185, 255, 0.90); }
        .cc-signal-flag--info .cc-signal-flag__dot    { background: rgba(148, 185, 255, 0.95); }
        .cc-signal-flag--warn    { color: rgba(218, 170, 80, 0.92); }
        .cc-signal-flag--warn .cc-signal-flag__dot    { background: rgba(218, 170, 80, 0.95); }
        .cc-signal-flag--critical { color: rgba(225, 100, 90, 0.95); }
        .cc-signal-flag--critical .cc-signal-flag__dot { background: rgba(225, 100, 90, 0.95); }

        /* ── Phase hero ──────────────────────────────────────────────────────── */
        .cc-hero {
          position: relative;
          padding: 32px 0 32px 22px;
          border-bottom: 1px solid var(--line-faint);
          background: linear-gradient(
            180deg,
            rgba(16, 16, 28, 0.55) 0%,
            rgba(10, 10, 18, 0.30) 100%
          );
          border-radius: 0;
          margin: 0 -4px;
          padding-left: 26px;
        }

        /* Left urgency accent */
        .cc-hero::before {
          content: '';
          position: absolute;
          left: 0;
          top: 32px;
          bottom: 32px;
          width: 3px;
          border-radius: 3px;
          background: rgba(123, 143, 255, 0.50);
          transition: background 0.30s;
        }
        .cc-hero--elevated::before { background: rgba(210, 152, 54, 0.70); }
        .cc-hero--critical::before { background: rgba(220, 75, 75, 0.80); }

        .cc-hero__meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        .cc-hero__cap {
          font-size: 0.56rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--c4);
        }
        .cc-hero__window {
          font-size: 0.64rem;
          color: var(--c4);
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.06em;
        }

        .cc-hero__phase {
          margin: 0 0 12px;
          font-family: var(--font-display);
          font-size: clamp(1.90rem, 3.4vw, 2.55rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--c1);
          line-height: 1.04;
        }
        .cc-hero--elevated .cc-hero__phase { color: #d9aa58; }
        .cc-hero--critical .cc-hero__phase { color: #e08080; }

        .cc-hero__goal {
          margin: 0 0 24px;
          font-size: 0.96rem;
          color: var(--c2);
          line-height: 1.50;
          max-width: 58ch;
        }

        /* Primary CTA — sentence-case operational command */
        .cc-hero__cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: -0.005em;
          text-transform: none;
          color: #06060d;
          cursor: pointer;
          background: linear-gradient(138deg, #eceaff 0%, #cec7ff 50%, #bac0ff 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.36),
            0 6px 28px rgba(123, 143, 255, 0.30);
          transition: transform 0.16s var(--ease-out), box-shadow 0.16s var(--ease-out);
        }
        .cc-hero__cta:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.42),
            0 10px 36px rgba(123, 143, 255, 0.38);
        }
        .cc-hero__cta-arrow { opacity: 0.60; }
        .cc-hero__cta--elevated {
          background: linear-gradient(138deg, #f6ead2 0%, #d9aa58 58%, #c49238 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.30), 0 6px 24px rgba(201,147,58,0.34);
        }
        .cc-hero__cta--elevated:hover {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.36), 0 10px 32px rgba(201,147,58,0.44);
        }
        .cc-hero__cta--critical {
          background: linear-gradient(138deg, #f5d2d2 0%, #e07878 58%, #c85555 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.26), 0 6px 24px rgba(220,70,70,0.32);
        }
        .cc-hero__cta--critical:hover {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.32), 0 10px 32px rgba(220,70,70,0.42);
        }

        /* ── Asymmetric body grid ────────────────────────────────────────────── */
        .cc-body {
          display: grid;
          grid-template-columns: 5fr 3fr;
          gap: 0;
          border-bottom: 1px solid var(--line-faint);
        }

        /* Column caption — readable */
        .cc-col-cap {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--c4);
          padding: 22px 0 10px;
          font-weight: 600;
        }
        .cc-col-cap--warn { color: rgba(218, 170, 80, 0.82); }

        /* ── Op lines — flat, rule-separated ────────────────────────────────── */
        .cc-lines { display: flex; flex-direction: column; }

        .cc-line {
          display: grid;
          grid-template-columns: 92px 1fr;
          align-items: start;
          gap: 18px;
          width: 100%;
          padding: 13px 10px;
          border: none;
          border-bottom: 1px solid var(--line-faint);
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition: background 0.14s var(--ease-out), padding-left 0.14s;
        }
        .cc-line:first-child {
          border-top: 1px solid var(--line-faint);
        }
        .cc-line:hover {
          background: var(--surface-1);
          padding-left: 16px;
        }

        /* Label — clearly readable, not invisible */
        .cc-line__lab {
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--c4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-top: 2px;
          font-weight: 600;
        }

        /* Text — primary readable */
        .cc-line__txt {
          font-size: 0.90rem;
          color: var(--c2);
          line-height: 1.42;
        }

        /* Brief column — slightly secondary */
        .cc-line--brief .cc-line__txt {
          color: var(--c3);
          font-size: 0.84rem;
        }

        /* Dim — low-priority line */
        .cc-line--dim .cc-line__txt {
          color: var(--c3);
        }

        /* ── Ops column ──────────────────────────────────────────────────────── */
        .cc-ops {
          padding-right: 44px;
        }
        .cc-blocked {
          padding-top: 6px;
          padding-bottom: 24px;
        }
        .cc-blocked__list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cc-blocked__btn {
          background: none;
          border: none;
          padding: 0;
          color: rgba(220, 170, 80, 0.92);
          font: inherit;
          font-size: 0.86rem;
          text-align: left;
          cursor: pointer;
          transition: opacity 0.14s;
        }
        .cc-blocked__btn:hover {
          opacity: 0.76;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .cc-blocked__txt {
          font-size: 0.86rem;
          color: rgba(220, 170, 80, 0.82);
        }

        /* ── Context column ──────────────────────────────────────────────────── */
        .cc-context {
          padding-left: 44px;
          border-left: 1px solid var(--line-faint);
          display: flex;
          flex-direction: column;
        }
        .cc-context .cc-lines { flex: 1; }
        .cc-carry {
          padding: 8px 0 16px;
          border-top: 1px solid var(--line-faint);
        }
        .cc-carry .cc-col-cap { padding-top: 12px; }
        .cc-carry__list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cc-carry__item {
          font-size: 0.82rem;
          color: var(--c3);
          line-height: 1.40;
        }
        .cc-context__open {
          margin-top: auto;
          padding-top: 18px;
          padding-bottom: 22px;
          align-self: flex-start;
        }

        /* ── Morning data — inline operational command ─────────────────────── */
        .cc-morning-line {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          padding: 14px 0;
          border: none;
          background: none;
          cursor: pointer;
          font: inherit;
          color: inherit;
          text-align: left;
          border-bottom: 1px solid var(--line-faint);
          width: 100%;
          transition: opacity 0.15s var(--ease-out);
        }
        .cc-morning-line:hover { opacity: 0.78; }

        .cc-morning-line__ind {
          display: inline-block;
          align-self: center;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cc-morning-line--ok    .cc-morning-line__ind { background: rgba(80, 205, 125, 0.85); }
        .cc-morning-line--empty .cc-morning-line__ind { background: rgba(200, 155, 65, 0.85); }

        .cc-morning-line__txt {
          flex: 1;
          font-size: 0.82rem;
          color: var(--c2);
          line-height: 1.4;
        }
        .cc-morning-line--empty .cc-morning-line__txt { color: rgba(220, 170, 80, 0.78); }

        .cc-morning-line__act {
          font-size: 0.78rem;
          color: var(--c3);
          border-bottom: 1px solid var(--line-soft);
          padding-bottom: 1px;
          transition: color 0.15s var(--ease-out), border-color 0.15s var(--ease-out);
        }
        .cc-morning-line:hover .cc-morning-line__act {
          color: var(--c1);
          border-bottom-color: var(--line-accent);
        }

        /* ── Production timeline — open, rule-separated ─────────────────────── */
        .cc-tl {
          display: flex;
          align-items: stretch;
          margin-top: 24px;
          padding-top: 24px;
          background: transparent;
          border-radius: 0;
          border: none;
          border-top: 1px solid var(--line-faint);
          overflow: visible;
        }
        .cc-tl__sep {
          width: 1px;
          background: var(--line-faint);
          flex-shrink: 0;
          align-self: stretch;
        }
        .cc-tl__node {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 16px;
          border: none;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          text-align: left;
          transition: background 0.16s var(--ease-out);
        }
        .cc-tl__node:hover { background: var(--surface-1); }

        .cc-tl__node-cap {
          font-size: 0.60rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--c4);
          margin-bottom: 2px;
          font-weight: 600;
        }
        .cc-tl__node-label {
          font-size: 0.80rem;
          font-weight: 600;
          color: var(--c3);
          line-height: 1.25;
        }
        .cc-tl__node-hint {
          font-size: 0.64rem;
          color: var(--c4);
          margin-top: 1px;
        }

        /* Hot — current / not started */
        .cc-tl__node--hot .cc-tl__node-cap { color: rgba(138, 158, 255, 0.80); }
        .cc-tl__node--hot .cc-tl__node-label {
          color: var(--c1);
          font-weight: 700;
        }
        /* Active — in progress */
        .cc-tl__node--active .cc-tl__node-cap { color: rgba(138, 158, 255, 0.70); }
        .cc-tl__node--active .cc-tl__node-label {
          color: rgba(178, 195, 255, 0.95);
          font-weight: 700;
        }
        /* Done */
        .cc-tl__node--done .cc-tl__node-label { color: rgba(90, 210, 148, 0.90); }
        .cc-tl__node--done .cc-tl__node-cap   { color: rgba(90, 210, 148, 0.55); }
        /* Warm */
        .cc-tl__node--warm .cc-tl__node-label { color: var(--c2); }
        /* Cold */
        .cc-tl__node--cold { opacity: 0.42; }
        .cc-tl__node--cold:hover { opacity: 0.72; }

        /* ── Responsive ─────────────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .cc-body {
            grid-template-columns: 1fr;
          }
          .cc-ops { padding-right: 0; }
          .cc-context {
            padding-left: 0;
            border-left: none;
            border-top: 1px solid var(--line-faint);
          }
          .cc-tl { flex-wrap: wrap; gap: 0; border-radius: 0; padding-top: 16px; margin-top: 16px; }
          .cc-tl__sep { display: none; }
          .cc-tl__node { flex: 1 1 140px; border-bottom: 1px solid var(--line-faint); }
        }
        @media (max-width: 560px) {
          .cc-line { grid-template-columns: 72px 1fr; gap: 12px; }
          .cc-hero { padding-left: 18px; }
          .cc-hero__phase { font-size: clamp(1.60rem, 7vw, 2.0rem); }
        }
      `}</style>
    </div>
  );
}