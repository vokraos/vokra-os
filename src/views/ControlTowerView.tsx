import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { AD_PRESSURE_EVENT } from "../lib/ad-pressure";
import { CORRIDOR_STRATEGY_EVENT } from "../lib/corridor-strategy";
import { FBO_FBS_DECISION_EVENT } from "../lib/fbo-fbs-decision";
import { FOUNDER_BRIEF_EVENT } from "../lib/founder-brief";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { MARKET_TIMING_EVENT } from "../lib/market-timing";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { formatControlTowerProductionPressureLine, PRODUCTION_PRESSURE_EVENT } from "../lib/production-pressure";
import { ECONOMIC_PRESSURE_EVENT } from "../lib/economic-pressure";
import { formatControlTowerExecutionFeedbackLine } from "../lib/execution-feedback";
import { EXECUTION_FEEDBACK_EVENT } from "../lib/execution-feedback/types";
import { formatControlTowerOsAuditLine } from "../lib/os-health-audit";
import {
  buildControlTowerMemoryPayload,
  buildControlTowerSnapshot,
  CONTROL_TOWER_EVENT,
  notifyControlTowerUpdated,
  saveControlTowerSession,
  type SystemHealthLevel,
} from "../lib/strategic-control-tower";
import {
  hasOpenCriticalSimplifications,
  loadSimplificationBacklogState,
  SIMPLIFICATION_BACKLOG_CHANGED_EVENT,
} from "../lib/simplification-backlog";
import {
  deriveRecommendedOperatingMode,
  setOperatingRoleMode,
  useOperatingRoleMode,
} from "../lib/operating-role-mode";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";
import { ReportWarmupStrip } from "../components/ReportWarmupStrip";

type Props = { onNavigate: (id: NavId) => void };

function healthClass(h: SystemHealthLevel): string {
  return `sct-health sct-health--${h}`;
}

export function ControlTowerView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const { mode: roleMode } = useOperatingRoleMode();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(FOUNDER_BRIEF_EVENT, bump);
    window.addEventListener(ECONOMIC_PRESSURE_EVENT, bump);
    window.addEventListener(AD_PRESSURE_EVENT, bump);
    window.addEventListener(SCALING_SAFETY_EVENT, bump);
    window.addEventListener(FBO_FBS_DECISION_EVENT, bump);
    window.addEventListener(CORRIDOR_STRATEGY_EVENT, bump);
    window.addEventListener(MARKET_TIMING_EVENT, bump);
    window.addEventListener(CONTROL_TOWER_EVENT, bump);
    window.addEventListener(EXECUTION_FEEDBACK_EVENT, bump);
    window.addEventListener(PRODUCTION_PRESSURE_EVENT, bump);
    window.addEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(FOUNDER_BRIEF_EVENT, bump);
      window.removeEventListener(ECONOMIC_PRESSURE_EVENT, bump);
      window.removeEventListener(AD_PRESSURE_EVENT, bump);
      window.removeEventListener(SCALING_SAFETY_EVENT, bump);
      window.removeEventListener(FBO_FBS_DECISION_EVENT, bump);
      window.removeEventListener(CORRIDOR_STRATEGY_EVENT, bump);
      window.removeEventListener(MARKET_TIMING_EVENT, bump);
      window.removeEventListener(CONTROL_TOWER_EVENT, bump);
      window.removeEventListener(EXECUTION_FEEDBACK_EVENT, bump);
      window.removeEventListener(PRODUCTION_PRESSURE_EVENT, bump);
      window.removeEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
    };
  }, []);

  const snapshot = useMemo(() => buildControlTowerSnapshot(t, locale), [tick, t, locale]);
  const simplificationCritical = useMemo(
    () => hasOpenCriticalSimplifications(loadSimplificationBacklogState()),
    [tick],
  );
  const modeRecommend = useMemo(
    () => deriveRecommendedOperatingMode(snapshot, t),
    [snapshot, t],
  );
  const osAuditLine = useMemo(() => formatControlTowerOsAuditLine(snapshot, t), [snapshot, t]);
  const efbLine = useMemo(() => formatControlTowerExecutionFeedbackLine(snapshot, t), [snapshot, t]);
  const pprLine = useMemo(() => formatControlTowerProductionPressureLine(snapshot, t), [snapshot, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildControlTowerMemoryPayload(snapshot);
    saveControlTowerSession(payload);
    recordGeneration({
      module: "control_tower",
      title: t("sct.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(snapshot.topPriorityKey, snapshot.topPriorityVars),
    });
    notifyControlTowerUpdated();
    showToast(t("sct.toast.saved"));
  }, [showToast, snapshot, t]);

  return (
    <div className="sct-page">
      <header className="glass-panel sct-head">
        <p className="sct-eyebrow">{t("sct.eyebrow")}</p>
        <h1>{t("nav.controlTower")}</h1>
        <p className="sct-lede">{t("sct.lede")}</p>
        <p className="sct-manual-tag">{t("sct.manualTag")}</p>
        <ReportWarmupStrip className="sct-warmup-strip" />
        <p className="sct-mode">{t("orm.currentMode", { mode: t(`orm.mode.${roleMode}`) })}</p>
        {simplificationCritical ? (
          <p className="sct-simplification-line">
            {t("sct.simplification.criticalLine")}{" "}
            <button type="button" className="sct-mode-rec__btn" onClick={() => onNavigate("osSimplification")}>
              {t("nav.osSimplification")}
            </button>
          </p>
        ) : null}
        {modeRecommend && modeRecommend.mode !== roleMode ? (
          <p className="sct-mode-rec">
            {t(modeRecommend.reasonKey, { mode: t(`orm.mode.${modeRecommend.mode}`) })}
            <button
              type="button"
              className="sct-mode-rec__btn"
              onClick={() => setOperatingRoleMode(modeRecommend.mode)}
            >
              {t("orm.switchTo", { mode: t(`orm.mode.${modeRecommend.mode}`) })}
            </button>
          </p>
        ) : null}
        <div className="sct-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("sct.action.save")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(JSON.stringify(snapshot, null, 2))}
          >
            {t("sct.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate(snapshot.nextBestRoute)}>
            {t("sct.action.nextRoute")}
          </button>
        </div>
      </header>

      {toast ? <p className="sct-toast">{toast}</p> : null}

      <section className="glass-panel sct-sec sct-sec--hero">
        <div className="sct-overall">
          <span className={`sct-overall__pill sct-overall__pill--${snapshot.overallState}`}>
            {t(`sct.overall.${snapshot.overallState}`)}
          </span>
          <p className="sct-priority">
            <strong>{t("sct.label.priority")}:</strong> {t(snapshot.topPriorityKey, snapshot.topPriorityVars)}
          </p>
        </div>
        <div className="sct-signals">
          <p>
            <strong>{t("sct.label.blocked")}:</strong>{" "}
            {t(snapshot.blockedSystemKey, snapshot.blockedSystemVars)}
          </p>
          <p>
            <strong>{t("sct.label.leverage")}:</strong>{" "}
            {t(snapshot.leverageSystemKey, snapshot.leverageSystemVars)}
          </p>
          <p>
            <strong>{t("sct.label.risk")}:</strong> {t(snapshot.riskSystemKey, snapshot.riskSystemVars)}
          </p>
          <p>
            <strong>{t("sct.label.memory")}:</strong>{" "}
            {t(snapshot.memorySignalKey, snapshot.memorySignalVars)}
          </p>
        </div>
        {snapshot.warningKeys.length ? (
          <ul className="sct-warns">
            {snapshot.warningKeys.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        ) : null}
        <p className="sct-conf">{t(snapshot.confidenceNoteKey)}</p>
        {efbLine ? (
          <p className="sct-efb">
            <button type="button" className="dom__aa-link" onClick={() => onNavigate("operatorMode")}>
              {efbLine}
            </button>
          </p>
        ) : null}
        {pprLine ? (
          <p className="sct-ppr">
            <button type="button" className="dom__aa-link" onClick={() => onNavigate("productionPressure")}>
              {pprLine}
            </button>
          </p>
        ) : null}
        {osAuditLine ? (
          <p className="sct-os-audit">
            <button type="button" className="dom__aa-link" onClick={() => onNavigate("osHealthAudit")}>
              {osAuditLine}
            </button>
          </p>
        ) : null}
      </section>

      <section className="glass-panel sct-sec">
        <h2>{t("sct.section.systems")}</h2>
        <div className="sct-tiles">
          {snapshot.tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className="sct-tile glass-panel--hover"
              onClick={() => onNavigate(tile.navId)}
            >
              <div className="sct-tile__head">
                <span className="sct-tile__title">{t(`sct.tile.${tile.id}`)}</span>
                <span className={healthClass(tile.health)}>{t(`sct.health.${tile.health}`)}</span>
              </div>
              <p className="sct-tile__line">{t(tile.summaryKey, tile.summaryVars)}</p>
              <span className="sct-tile__link">{t("sct.tile.open")}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel sct-sec sct-sec--links">
        <h2>{t("sct.section.links")}</h2>
        <div className="sct-links">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
            {t("sct.link.founder")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("command")}>
            {t("sct.link.daily")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("sct.link.memory")}
          </button>
        </div>
      </section>

      <style>{`
        .sct-page { max-width: 960px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .sct-head { padding: 14px 16px; }
        .sct-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .sct-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .sct-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .sct-mode { margin: 0 0 8px; font-size: 0.82rem; opacity: 0.75; }
        .sct-mode-rec { margin: 0 0 12px; font-size: 0.82rem; color: #e8c46a; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .sct-mode-rec__btn {
          border: 1px solid rgba(232, 196, 106, 0.4);
          background: rgba(232, 196, 106, 0.1);
          color: inherit;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 999px;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .sct-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .sct-sec { padding: 14px 16px; }
        .sct-overall { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 10px; }
        .sct-overall__pill { font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 0.9rem; }
        .sct-overall__pill--stable { background: rgba(100,180,120,0.2); }
        .sct-overall__pill--pressured { background: rgba(220,180,80,0.2); }
        .sct-overall__pill--fragile { background: rgba(220,140,80,0.25); }
        .sct-overall__pill--blocked { background: rgba(200,90,90,0.25); }
        .sct-overall__pill--expansion_ready { background: rgba(100,160,220,0.25); }
        .sct-priority { margin: 0; font-size: 0.92rem; }
        .sct-signals { display: grid; gap: 4px; font-size: 0.88rem; margin-bottom: 10px; }
        .sct-warns { margin: 0 0 8px; padding-left: 18px; font-size: 0.85rem; color: #e8b090; }
        .sct-conf { margin: 0; font-size: 0.78rem; opacity: 0.7; }
        .sct-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .sct-tile { text-align: left; padding: 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(255,255,255,0.03); cursor: pointer; color: inherit; font: inherit; width: 100%; }
        .sct-tile__head { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .sct-tile__title { font-weight: 600; font-size: 0.88rem; }
        .sct-health { font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; }
        .sct-health--stable { opacity: 0.75; }
        .sct-health--watch { background: rgba(120,180,255,0.15); }
        .sct-health--pressured { background: rgba(230,160,90,0.2); }
        .sct-health--blocked { background: rgba(200,90,90,0.25); }
        .sct-health--ready { background: rgba(100,180,120,0.2); }
        .sct-tile__line { margin: 0 0 6px; font-size: 0.82rem; line-height: 1.35; opacity: 0.9; }
        .sct-tile__link { font-size: 0.72rem; opacity: 0.55; text-transform: uppercase; }
        .sct-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .sct-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
