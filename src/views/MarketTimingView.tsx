import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { AD_PRESSURE_EVENT } from "../lib/ad-pressure";
import { CORRIDOR_STRATEGY_EVENT } from "../lib/corridor-strategy";
import { FBO_FBS_DECISION_EVENT } from "../lib/fbo-fbs-decision";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import {
  buildMarketTimingMemoryPayload,
  buildMarketTimingReports,
  MARKET_TIMING_EVENT,
  notifyMarketTimingUpdated,
  reportToDisplay,
  saveMarketTimingSession,
  scoreLevel,
} from "../lib/market-timing";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function scoreBar(label: string, score: number) {
  const lvl = scoreLevel(score);
  return (
    <div className="mtm-bar">
      <div className="mtm-bar__head">
        <span>{label}</span>
        <span className={`mtm-bar__lvl mtm-bar__lvl--${lvl}`}>{score}</span>
      </div>
      <div className="mtm-bar__track">
        <div className={`mtm-bar__fill mtm-bar__fill--${lvl}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  );
}

export function MarketTimingView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(SCALING_SAFETY_EVENT, bump);
    window.addEventListener(FBO_FBS_DECISION_EVENT, bump);
    window.addEventListener(CORRIDOR_STRATEGY_EVENT, bump);
    window.addEventListener(AD_PRESSURE_EVENT, bump);
    window.addEventListener(MARKET_TIMING_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(SCALING_SAFETY_EVENT, bump);
      window.removeEventListener(FBO_FBS_DECISION_EVENT, bump);
      window.removeEventListener(CORRIDOR_STRATEGY_EVENT, bump);
      window.removeEventListener(AD_PRESSURE_EVENT, bump);
      window.removeEventListener(MARKET_TIMING_EVENT, bump);
    };
  }, []);

  const reports = useMemo(() => buildMarketTimingReports(t), [tick, t]);
  const active = useMemo(() => {
    if (!reports.length) return null;
    if (selected) return reports.find((r) => r.corridor === selected) ?? reports[0]!;
    return reports[0]!;
  }, [reports, selected]);

  const display = useMemo(() => (active ? reportToDisplay(active, t) : null), [active, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildMarketTimingMemoryPayload(reports);
    saveMarketTimingSession(payload);
    recordGeneration({
      module: "market_timing",
      title: t("mtm.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: active ? t(active.reasonKey, active.reasonVars) : "",
    });
    notifyMarketTimingUpdated();
    showToast(t("mtm.toast.saved"));
  }, [active, reports, showToast, t]);

  return (
    <div className="mtm-page">
      <header className="glass-panel mtm-head">
        <p className="mtm-eyebrow">{t("mtm.eyebrow")}</p>
        <h1>{t("nav.marketTiming")}</h1>
        <p className="mtm-lede">{t("mtm.lede")}</p>
        <p className="mtm-manual-tag">{t("mtm.manualTag")}</p>
        <div className="mtm-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory} disabled={!reports.length}>
            {t("mtm.action.save")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(JSON.stringify(reports, null, 2))}
            disabled={!reports.length}
          >
            {t("mtm.action.copyJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="mtm-toast">{toast}</p> : null}

      {!reports.length ? (
        <section className="glass-panel mtm-sec">
          <p>{t("mtm.empty")}</p>
        </section>
      ) : (
        <>
          <section className="glass-panel mtm-sec mtm-sec--list">
            <h2>{t("mtm.section.corridors")}</h2>
            <ul className="mtm-corridor-list">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`mtm-corridor-btn${active?.corridor === r.corridor ? " mtm-corridor-btn--on" : ""}`}
                    onClick={() => setSelected(r.corridor)}
                  >
                    <span>{r.corridor}</span>
                    <span className={`mtm-pill mtm-pill--${r.timingState}`}>{t(`mtm.state.${r.timingState}`)}</span>
                    <span className="mtm-pill mtm-pill--cad">{t(`mtm.cadence.${r.launchCadence}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {active && display ? (
            <section className="glass-panel mtm-sec">
              <h2>{active.corridor}</h2>
              <p className="mtm-state-head">
                <span className={`mtm-state mtm-state--${active.timingState}`}>
                  {t(`mtm.state.${active.timingState}`)}
                </span>
                <span className="mtm-cad">{t(`mtm.cadence.${active.recommendedCadence}`)}</span>
              </p>
              <p className="mtm-reason">{display.reason}</p>
              <div className="mtm-cadence-grid">
                <p>
                  <strong>{t("mtm.field.launchCadence")}:</strong> {t(`mtm.cadence.${active.launchCadence}`)}
                </p>
                <p>
                  <strong>{t("mtm.field.refreshCadence")}:</strong> {t(`mtm.cadence.${active.refreshCadence}`)}
                </p>
                <p>
                  <strong>{t("mtm.field.opsRhythm")}:</strong> {t(`mtm.cadence.${active.operationalRhythm}`)}
                </p>
                <p>
                  <strong>{t("mtm.field.launchTiming")}:</strong> {display.launchTiming}
                </p>
                <p>
                  <strong>{t("mtm.field.refreshTiming")}:</strong> {display.refreshTiming}
                </p>
                <p>
                  <strong>{t("mtm.field.seasonal")}:</strong> {display.seasonalContext}
                </p>
              </div>
              <div className="mtm-bars">
                {scoreBar(t("mtm.metric.overlap"), active.overlapPressure)}
                {scoreBar(t("mtm.metric.burnout"), active.burnoutRisk)}
                {scoreBar(t("mtm.metric.spacing"), active.spacingQuality)}
              </div>
              <div className="mtm-moves-grid">
                <div>
                  <h3>{t("mtm.section.recommended")}</h3>
                  <ul>{display.recommendedPatterns.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
                <div>
                  <h3>{t("mtm.section.dangerous")}</h3>
                  <ul className="mtm-danger">{display.dangerousPatterns.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
              </div>
              <p className="mtm-conf">{display.confidenceNote}</p>
            </section>
          ) : null}

          <section className="glass-panel mtm-sec mtm-sec--links">
            <h2>{t("mtm.section.links")}</h2>
            <div className="mtm-links">
              <button type="button" className="ghost-btn" onClick={() => onNavigate("corridorStrategy")}>
                {t("mtm.link.corridor")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
                {t("mtm.link.launch")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
                {t("mtm.link.assortment")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("scalingSafety")}>
                {t("mtm.link.scaling")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("productionPressure")}>
                {t("nav.productionPressure")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("advertisingPressure")}>
                {t("mtm.link.ads")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
                {t("mtm.link.founder")}
              </button>
            </div>
          </section>
        </>
      )}

      <style>{`
        .mtm-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .mtm-head { padding: 14px 16px; }
        .mtm-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .mtm-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .mtm-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .mtm-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .mtm-sec { padding: 14px 16px; }
        .mtm-corridor-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
        .mtm-corridor-btn { width: 100%; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; color: inherit; font: inherit; text-align: left; }
        .mtm-corridor-btn--on { border-color: rgba(120,180,255,0.45); background: rgba(80,120,200,0.12); }
        .mtm-pill { font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; opacity: 0.9; }
        .mtm-state-head { display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 8px; }
        .mtm-cad { font-weight: 700; }
        .mtm-reason { margin: 0 0 14px; font-weight: 600; line-height: 1.4; }
        .mtm-cadence-grid { display: grid; gap: 6px; font-size: 0.88rem; margin-bottom: 14px; }
        .mtm-bars { display: grid; gap: 8px; margin-bottom: 14px; }
        .mtm-bar__head { display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 3px; }
        .mtm-bar__track { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .mtm-bar__fill { height: 100%; }
        .mtm-bar__fill--low { background: rgba(120,200,140,0.5); }
        .mtm-bar__fill--moderate { background: rgba(120,180,255,0.45); }
        .mtm-bar__fill--elevated { background: rgba(230,200,100,0.55); }
        .mtm-bar__fill--high { background: rgba(230,140,90,0.6); }
        .mtm-moves-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.9rem; }
        @media (max-width: 640px) { .mtm-moves-grid { grid-template-columns: 1fr; } }
        .mtm-danger { color: #e8b090; }
        .mtm-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .mtm-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
