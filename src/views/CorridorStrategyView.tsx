import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import {
  buildCorridorStrategyMemoryPayload,
  buildCorridorStrategyReports,
  CORRIDOR_STRATEGY_EVENT,
  notifyCorridorStrategyUpdated,
  reportToDisplay,
  saveCorridorStrategySession,
  scoreLevel,
} from "../lib/corridor-strategy";
import { FBO_FBS_DECISION_EVENT } from "../lib/fbo-fbs-decision";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function scoreBar(label: string, score: number) {
  const lvl = scoreLevel(score);
  return (
    <div className="cst-bar">
      <div className="cst-bar__head">
        <span>{label}</span>
        <span className={`cst-bar__lvl cst-bar__lvl--${lvl}`}>{score}</span>
      </div>
      <div className="cst-bar__track">
        <div className={`cst-bar__fill cst-bar__fill--${lvl}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  );
}

export function CorridorStrategyView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(SCALING_SAFETY_EVENT, bump);
    window.addEventListener(FBO_FBS_DECISION_EVENT, bump);
    window.addEventListener(CORRIDOR_STRATEGY_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(SCALING_SAFETY_EVENT, bump);
      window.removeEventListener(FBO_FBS_DECISION_EVENT, bump);
      window.removeEventListener(CORRIDOR_STRATEGY_EVENT, bump);
    };
  }, []);

  const reports = useMemo(() => buildCorridorStrategyReports(t), [tick, t]);
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
    const payload = buildCorridorStrategyMemoryPayload(reports);
    saveCorridorStrategySession(payload);
    recordGeneration({
      module: "corridor_strategy",
      title: t("cst.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: active ? t(active.strategyReasonKey, active.strategyReasonVars) : "",
    });
    notifyCorridorStrategyUpdated();
    showToast(t("cst.toast.saved"));
  }, [active, reports, showToast, t]);

  return (
    <div className="cst-page">
      <header className="glass-panel cst-head">
        <p className="cst-eyebrow">{t("cst.eyebrow")}</p>
        <h1>{t("nav.corridorStrategy")}</h1>
        <p className="cst-lede">{t("cst.lede")}</p>
        <p className="cst-manual-tag">{t("cst.manualTag")}</p>
        <div className="cst-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory} disabled={!reports.length}>
            {t("cst.action.save")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(JSON.stringify(reports, null, 2))}
            disabled={!reports.length}
          >
            {t("cst.action.copyJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="cst-toast">{toast}</p> : null}

      {!reports.length ? (
        <section className="glass-panel cst-sec">
          <p>{t("cst.empty")}</p>
        </section>
      ) : (
        <>
          <section className="glass-panel cst-sec cst-sec--list">
            <h2>{t("cst.section.corridors")}</h2>
            <ul className="cst-corridor-list">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`cst-corridor-btn${active?.corridor === r.corridor ? " cst-corridor-btn--on" : ""}`}
                    onClick={() => setSelected(r.corridor)}
                  >
                    <span>{r.corridor}</span>
                    <span className={`cst-pill cst-pill--${r.corridorState}`}>{t(`cst.state.${r.corridorState}`)}</span>
                    <span className="cst-pill cst-pill--strat">{t(`cst.strategy.${r.recommendedStrategy}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {active && display ? (
            <section className="glass-panel cst-sec">
              <h2>{active.corridor}</h2>
              <p className="cst-strategy-head">
                <span className={`cst-state cst-state--${active.corridorState}`}>{t(`cst.state.${active.corridorState}`)}</span>
                <span className="cst-strat">{t(`cst.strategy.${active.recommendedStrategy}`)}</span>
              </p>
              <p className="cst-reason">{display.strategyReason}</p>
              <div className="cst-bars">
                {scoreBar(t("cst.metric.dominance"), active.dominancePotential)}
                {scoreBar(t("cst.metric.saturation"), active.saturationPressure)}
                {scoreBar(t("cst.metric.fragmentation"), active.fragmentationPressure)}
                {scoreBar(t("cst.metric.expansion"), active.expansionSafety)}
                {scoreBar(t("cst.metric.fulfillment"), active.fulfillmentFit)}
                {scoreBar(t("cst.metric.refresh"), active.refreshNeed)}
                {scoreBar(t("cst.metric.seo"), active.seoCoverage)}
                {scoreBar(t("cst.metric.hero"), active.heroPressure)}
                {scoreBar(t("cst.metric.burden"), active.operationalBurden)}
              </div>
              <div className="cst-moves-grid">
                <div>
                  <h3>{t("cst.section.recommended")}</h3>
                  <ul>{display.recommendedMoves.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
                <div>
                  <h3>{t("cst.section.forbidden")}</h3>
                  <ul className="cst-forbidden">{display.forbiddenMoves.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
              </div>
              <p className="cst-conf">{display.confidenceNote}</p>
            </section>
          ) : null}

          <section className="glass-panel cst-sec cst-sec--links">
            <h2>{t("cst.section.links")}</h2>
            <div className="cst-links">
              <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
                {t("cst.link.assortment")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("scalingSafety")}>
                {t("cst.link.scaling")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("fboFbsDecision")}>
                {t("cst.link.fbo")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
                {t("cst.link.launch")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
                {t("cst.link.marketplace")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("economicPressure")}>
                {t("cst.link.economic")}
              </button>
            </div>
          </section>
        </>
      )}

      <style>{`
        .cst-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .cst-head { padding: 14px 16px; }
        .cst-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .cst-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .cst-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .cst-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .cst-sec { padding: 14px 16px; }
        .cst-corridor-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
        .cst-corridor-btn { width: 100%; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 8px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; color: inherit; font: inherit; text-align: left; }
        .cst-corridor-btn--on { border-color: rgba(120,180,255,0.45); background: rgba(80,120,200,0.12); }
        .cst-pill { font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; opacity: 0.9; }
        .cst-strategy-head { display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 8px; }
        .cst-strat { font-weight: 700; }
        .cst-reason { margin: 0 0 14px; font-weight: 600; line-height: 1.4; }
        .cst-bars { display: grid; gap: 8px; margin-bottom: 14px; }
        .cst-bar__head { display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 3px; }
        .cst-bar__track { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .cst-bar__fill { height: 100%; }
        .cst-bar__fill--low { background: rgba(120,200,140,0.5); }
        .cst-bar__fill--moderate { background: rgba(120,180,255,0.45); }
        .cst-bar__fill--elevated { background: rgba(230,200,100,0.55); }
        .cst-bar__fill--high { background: rgba(230,140,90,0.6); }
        .cst-moves-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.9rem; }
        @media (max-width: 640px) { .cst-moves-grid { grid-template-columns: 1fr; } }
        .cst-forbidden { color: #e8b090; }
        .cst-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .cst-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
