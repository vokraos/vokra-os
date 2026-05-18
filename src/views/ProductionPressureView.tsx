import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { EXECUTION_FEEDBACK_EVENT } from "../lib/execution-feedback";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";
import {
  buildProductionPressureMemoryPayload,
  buildProductionPressureReport,
  notifyProductionPressureUpdated,
  PRODUCTION_PRESSURE_EVENT,
  reportToDisplay,
  saveProductionPressureSession,
  type ProductionState,
} from "../lib/production-pressure";
import { ProductionPressureCapacityPanel } from "./ProductionPressureCapacityPanel";
import { ProductionPressureShiftPanel } from "./ProductionPressureShiftPanel";
import { ProductionPressureShiftRequirementPanel } from "./ProductionPressureShiftRequirementPanel";
import { ProductionPressureDailyPlanPanel } from "./ProductionPressureDailyPlanPanel";
import { ProductionPressureShiftFeedbackPanel } from "./ProductionPressureShiftFeedbackPanel";

type Props = { onNavigate: (id: NavId) => void };

function stateClass(state: ProductionState): string {
  return `ppr-state ppr-state--${state}`;
}

function bandClass(band: string): string {
  return `ppr-band ppr-band--${band}`;
}

export function ProductionPressureView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(SCALING_SAFETY_EVENT, bump);
    window.addEventListener(EXECUTION_FEEDBACK_EVENT, bump);
    window.addEventListener(PRODUCTION_PRESSURE_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(SCALING_SAFETY_EVENT, bump);
      window.removeEventListener(EXECUTION_FEEDBACK_EVENT, bump);
      window.removeEventListener(PRODUCTION_PRESSURE_EVENT, bump);
    };
  }, []);

  const report = useMemo(() => buildProductionPressureReport(t), [tick, t]);
  const display = useMemo(() => reportToDisplay(report, t), [report, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildProductionPressureMemoryPayload(report, {
      bottlenecks: report.operatorBottlenecks,
      dangerousZones: display.dangerousZones,
      recommendations: display.recommendedActions,
    });
    saveProductionPressureSession(payload);
    recordGeneration({
      module: "production_pressure",
      title: t("prod.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: display.confidenceNote,
    });
    notifyProductionPressureUpdated();
    showToast(t("prod.toast.saved"));
  }, [display.confidenceNote, display.dangerousZones, display.recommendedActions, report, showToast, t]);

  const pressures = [
    { key: "print", score: report.printPressure },
    { key: "pack", score: report.packagingPressure },
    { key: "fulfill", score: report.fulfillmentPressure },
    { key: "launch", score: report.launchLoad },
    { key: "collision", score: report.waveCollisionRisk },
    { key: "cadence", score: report.cadenceStability },
  ] as const;

  return (
    <div className="ppr-page">
      <header className="glass-panel ppr-head">
        <p className="ppr-eyebrow">{t("prod.eyebrow")}</p>
        <h1>{t("nav.productionPressure")}</h1>
        <p className="ppr-lede">{t("prod.lede")}</p>
        <p className="ppr-manual-tag">{t("prod.manualTag")}</p>
        <div className="ppr-headline">
          <span className={stateClass(report.productionState)}>{t(`prod.state.${report.productionState}`)}</span>
          <span className="ppr-target">{report.targetLabel}</span>
        </div>
        <p className="ppr-conf">{display.confidenceNote}</p>
        <div className="ppr-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("prod.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(JSON.stringify(report, null, 2))}>
            {t("prod.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`production-pressure-${report.id}.json`, report)}>
            {t("prod.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="ppr-toast">{toast}</p> : null}

      <ProductionPressureCapacityPanel
        loadSnapshot={report.loadSnapshot}
        comparisons={report.capacity.comparisons}
        hasProfile={report.capacity.hasProfile}
        profileName={report.capacity.profileName}
        onProfilesChange={() => setTick((x) => x + 1)}
      />

      <ProductionPressureShiftPanel
        loadSnapshot={report.loadSnapshot}
        comparisons={report.capacity.comparisons}
        resolvedCapacity={report.resolvedCapacity}
        onChange={() => setTick((x) => x + 1)}
      />

      <ProductionPressureShiftRequirementPanel shiftRequirement={report.shiftRequirement} />

      <ProductionPressureDailyPlanPanel plan={report.dailyPlan} onToast={showToast} />

      <ProductionPressureShiftFeedbackPanel
        report={report}
        onToast={showToast}
        onSaved={() => setTick((x) => x + 1)}
      />

      <section className="glass-panel ppr-sec">
        <h2>{t("prod.section.pressures")}</h2>
        <ul className="ppr-grid">
          {pressures.map(({ key, score }) => (
            <li key={key} className="ppr-tile">
              <span className="ppr-tile__label">{t(`prod.pressure.${key}`)}</span>
              <span className={bandClass(score.band)}>{t(`prod.band.${score.band}`)}</span>
              <p className="ppr-tile__sum">{t(score.summaryKey, score.summaryVars)}</p>
            </li>
          ))}
        </ul>
      </section>

      {display.bottlenecks.length > 0 ? (
        <section className="glass-panel ppr-sec ppr-sec--warn">
          <h2>{t("prod.section.bottlenecks")}</h2>
          <ul className="ppr-list">
            {display.bottlenecks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {display.dangerousZones.length > 0 ? (
        <section className="glass-panel ppr-sec ppr-sec--danger">
          <h2>{t("prod.section.danger")}</h2>
          <ul className="ppr-list">
            {display.dangerousZones.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel ppr-sec ppr-sec--grid">
        <div>
          <h2>{t("prod.section.reco")}</h2>
          <ul className="ppr-list ppr-list--ok">
            {display.recommendedActions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>{t("prod.section.forbidden")}</h2>
          <ul className="ppr-list ppr-list--no">
            {display.forbiddenMoves.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-panel ppr-sec">
        <h2>{t("prod.section.links")}</h2>
        <div className="ppr-links">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
            {t("prod.link.launch")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketTiming")}>
            {t("prod.link.timing")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("scalingSafety")}>
            {t("prod.link.scaling")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("prod.link.assortment")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("operatorMode")}>
            {t("prod.link.operator")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("controlTower")}>
            {t("prod.link.tower")}
          </button>
        </div>
      </section>

      <style>{`
        .ppr-page { max-width: 820px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .ppr-head { padding: 20px; }
        .ppr-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin: 0 0 6px; }
        .ppr-lede { margin: 8px 0; opacity: 0.85; }
        .ppr-manual-tag { font-size: 12px; opacity: 0.6; }
        .ppr-headline { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 12px 0 8px; }
        .ppr-state { font-weight: 600; padding: 4px 10px; border-radius: 999px; font-size: 13px; }
        .ppr-state--stable { background: rgba(80, 200, 120, 0.15); color: #6fd89a; }
        .ppr-state--pressured { background: rgba(255, 200, 80, 0.12); color: #e8c46a; }
        .ppr-state--overloaded { background: rgba(255, 140, 80, 0.15); color: #f0a070; }
        .ppr-state--unstable { background: rgba(180, 120, 255, 0.12); color: #c9a0ff; }
        .ppr-state--blocked { background: rgba(255, 90, 90, 0.15); color: #ff8a8a; }
        .ppr-target { font-size: 14px; opacity: 0.75; }
        .ppr-conf { font-size: 12px; opacity: 0.65; }
        .ppr-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .ppr-sec { padding: 16px 18px; }
        .ppr-sec--grid { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) { .ppr-sec--grid { grid-template-columns: 1fr; } }
        .ppr-grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
        .ppr-tile { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .ppr-tile__label { display: block; font-size: 12px; opacity: 0.7; margin-bottom: 4px; }
        .ppr-band { font-size: 12px; font-weight: 600; }
        .ppr-band--low { color: #6fd89a; }
        .ppr-band--moderate { color: #e8c46a; }
        .ppr-band--high { color: #f0a070; }
        .ppr-band--critical { color: #ff8a8a; }
        .ppr-tile__sum { font-size: 12px; margin: 6px 0 0; opacity: 0.8; }
        .ppr-list { margin: 8px 0 0; padding-left: 18px; }
        .ppr-list--ok li { color: #9fd4b0; }
        .ppr-list--no li { color: #f0a0a0; }
        .ppr-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .ppr-toast { text-align: center; font-size: 13px; opacity: 0.85; }
        .ppr-sec--capacity { margin-top: 0; }
        .ppr-cap-hint { font-size: 12px; opacity: 0.7; margin: 0 0 10px; }
        .ppr-cap-warn { color: #e8c46a; font-size: 13px; }
        .ppr-cap-active { font-size: 13px; margin: 0 0 10px; }
        .ppr-cap-toolbar, .ppr-cap-form-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .ppr-cap-profiles { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .ppr-cap-pill { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: inherit; cursor: pointer; }
        .ppr-cap-pill--on { border-color: rgba(120, 180, 255, 0.5); background: rgba(80, 140, 220, 0.15); }
        .ppr-cap-form-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); margin-bottom: 10px; }
        .ppr-cap-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; opacity: 0.85; }
        .ppr-cap-field--wide { grid-column: 1 / -1; margin-bottom: 8px; }
        .ppr-cap-field input, .ppr-cap-field textarea { font-size: 13px; padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: inherit; }
        .ppr-cap-sub { font-size: 13px; margin: 16px 0 8px; opacity: 0.85; }
        .ppr-cap-load { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        .ppr-cap-load li { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); }
        .ppr-cap-sources { font-size: 11px; opacity: 0.55; margin-top: 8px; }
        .ppr-cap-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
        .ppr-cap-table th, .ppr-cap-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ppr-cap { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
        .ppr-cap--stable { color: #6fd89a; }
        .ppr-cap--pressured { color: #e8c46a; }
        .ppr-cap--overloaded { color: #ff8a8a; }
        .ppr-cap--unknown { color: #999; }
        .ppr-cap-usage { display: block; font-size: 10px; opacity: 0.65; margin-top: 2px; }
        .ppr-cap-summaries { margin: 10px 0 0; padding-left: 18px; font-size: 12px; opacity: 0.8; }
        .ppr-sec--shift { margin-top: 0; }
        .ppr-shift-hint { font-size: 12px; opacity: 0.7; margin: 0 0 10px; }
        .ppr-shift-active { font-size: 13px; margin: 0 0 10px; }
        .ppr-shift-warn { color: #e8c46a; font-size: 13px; }
        .ppr-shift-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }
        .ppr-shift-select { font-size: 13px; padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); color: inherit; }
        .ppr-shift-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .ppr-shift-pill { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: inherit; cursor: pointer; }
        .ppr-shift-pill--on { border-color: rgba(180, 140, 255, 0.5); background: rgba(140, 100, 220, 0.15); }
        .ppr-shift-form { margin-bottom: 12px; }
        .ppr-shift-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; margin-bottom: 8px; max-width: 280px; }
        .ppr-shift-field--wide { max-width: none; }
        .ppr-shift-field input, .ppr-shift-field textarea, .ppr-shift-field select { font-size: 13px; padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: inherit; }
        .ppr-shift-form-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .ppr-shift-sub { font-size: 13px; margin: 12px 0 8px; opacity: 0.85; }
        .ppr-shift-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ppr-shift-table th, .ppr-shift-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
}
