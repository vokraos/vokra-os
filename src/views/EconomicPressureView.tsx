import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import {
  buildEconomicPressureMemoryPayload,
  buildEconomicPressureReport,
  ECONOMIC_PRESSURE_EVENT,
  gatherEconomicPressureContext,
  notifyEconomicPressureUpdated,
  saveEconomicPressureSession,
  type EconomicPressureLevel,
  type PressureZone,
} from "../lib/economic-pressure";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function levelClass(level: EconomicPressureLevel): string {
  return `econ-lvl econ-lvl--${level}`;
}

function PressureStrip({ label, score, level }: { label: string; score: number; level: EconomicPressureLevel }) {
  const v = Math.min(100, Math.max(0, Math.round(score)));
  return (
    <div className="econ-strip">
      <div className="econ-strip__head">
        <span>{label}</span>
        <span className={levelClass(level)}>{level}</span>
      </div>
      <div className="econ-strip__track">
        <div className={`econ-strip__fill econ-strip__fill--${level}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function ZoneList({
  title,
  zones,
  onGo,
}: {
  title: string;
  zones: PressureZone[];
  onGo: (nav: NavId) => void;
}) {
  if (!zones.length) return null;
  return (
    <div className="econ-zones">
      <h3 className="econ-subh">{title}</h3>
      <ul>
        {zones.map((z) => (
          <li key={z.id}>
            <button type="button" className="econ-zone-btn" onClick={() => onGo(z.navId)}>
              <span className={levelClass(z.level)}>{z.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EconomicPressureView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(ECONOMIC_PRESSURE_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(ECONOMIC_PRESSURE_EVENT, bump);
    };
  }, []);

  const report = useMemo(() => buildEconomicPressureReport(gatherEconomicPressureContext(), t), [tick, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildEconomicPressureMemoryPayload(report, report.guardrailSummary);
    saveEconomicPressureSession(payload);
    recordGeneration({
      module: "economic_pressure",
      title: t("econ.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: report.confidenceNote,
    });
    notifyEconomicPressureUpdated();
    showToast(t("econ.toast.saved"));
  }, [report, showToast, t]);

  const strips = [
    { label: t("econ.strip.operational"), score: report.operationalPressure, level: report.operationalLevel },
    { label: t("econ.strip.expansion"), score: report.expansionPressure, level: report.expansionLevel },
    { label: t("econ.strip.fragmentation"), score: report.fragmentationPressure, level: report.fragmentationLevel },
    { label: t("econ.strip.warehouse"), score: report.warehousePressure, level: report.warehouseLevel },
    { label: t("econ.strip.refresh"), score: report.refreshPressure, level: report.refreshLevel },
    { label: t("econ.strip.launch"), score: report.launchPressure, level: report.launchLevel },
    { label: t("econ.strip.saturation"), score: report.saturationPressure, level: levelFromSaturation(report.saturationPressure) },
    { label: t("econ.strip.complexity"), score: report.assortmentComplexity, level: levelFromSaturation(report.assortmentComplexity) },
  ];

  return (
    <div className="econ-page">
      <header className="glass-panel econ-head">
        <p className="econ-eyebrow">{t("econ.eyebrow")}</p>
        <h1>{t("nav.economicPressure")}</h1>
        <p className="econ-lede">{t("econ.lede")}</p>
        <p className="econ-conf">{report.confidenceNote}</p>
        <div className="econ-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("econ.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(JSON.stringify(report, null, 2))}>
            {t("econ.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`economic-pressure-${report.id}.json`, report)}>
            {t("econ.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="econ-toast">{toast}</p> : null}

      <section className="glass-panel econ-sec">
        <h2>{t("econ.section.pressure")}</h2>
        <div className="econ-strips">{strips.map((s) => <PressureStrip key={s.label} {...s} />)}</div>
      </section>

      <section className="glass-panel econ-sec econ-sec--grid">
        <ZoneList title={t("econ.section.dangerous")} zones={report.dangerousExpansionZones} onGo={onNavigate} />
        <ZoneList title={t("econ.section.stable")} zones={report.stableZones} onGo={onNavigate} />
      </section>

      {report.stopExpansionSignals.length > 0 ? (
        <section className="glass-panel econ-sec econ-sec--stop">
          <h2>{t("econ.section.stops")}</h2>
          <ul>{report.stopExpansionSignals.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
      ) : null}

      <section className="glass-panel econ-sec">
        <h2>{t("econ.section.rec")}</h2>
        <ul>{report.recommendedFocus.map((r, i) => <li key={i}>{r}</li>)}</ul>
        {report.operationalWarnings.length > 0 ? (
          <ul className="econ-warn">
            {report.operationalWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="glass-panel econ-sec econ-sec--actions">
        <h2>{t("econ.section.actions")}</h2>
        <div className="econ-actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
            {t("econ.action.stopExpansion")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("econ.action.consolidate")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("competitiveMap")}>
            {t("econ.action.refreshSlowdown")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dataCleanup")}>
            {t("econ.action.cleanup")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("econ.action.marketplaceOps")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
            {t("econ.action.founderBrief")}
          </button>
        </div>
      </section>

      <style>{`
        .econ-page { max-width: 800px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .econ-head { padding: 14px 16px; }
        .econ-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .econ-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .econ-conf { margin: 0 0 12px; font-size: 0.85rem; font-style: italic; opacity: 0.8; }
        .econ-head__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .econ-sec { padding: 14px 16px; }
        .econ-sec--grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .econ-sec--grid { grid-template-columns: 1fr; } }
        .econ-sec--stop ul { color: #e8a090; }
        .econ-subh { margin: 0 0 8px; font-size: 0.9rem; }
        .econ-strips { display: grid; gap: 10px; }
        .econ-strip__head { display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px; }
        .econ-strip__track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
        .econ-strip__fill { height: 100%; }
        .econ-strip__fill--low { background: rgba(120,200,140,0.5); }
        .econ-strip__fill--manageable { background: rgba(120,180,255,0.45); }
        .econ-strip__fill--elevated { background: rgba(230,200,100,0.55); }
        .econ-strip__fill--dangerous { background: rgba(230,140,90,0.6); }
        .econ-strip__fill--critical { background: rgba(220,90,80,0.65); }
        .econ-lvl--low { color: #90d8a8; }
        .econ-lvl--manageable { color: #a8c4e8; }
        .econ-lvl--elevated { color: #e8c080; }
        .econ-lvl--dangerous { color: #e8a090; }
        .econ-lvl--critical { color: #e87870; }
        .econ-zones ul { margin: 0; padding-left: 0; list-style: none; }
        .econ-zone-btn { background: none; border: none; padding: 6px 0; font: inherit; color: inherit; cursor: pointer; text-align: left; text-decoration: underline; text-underline-offset: 3px; }
        .econ-warn { margin-top: 10px; opacity: 0.9; }
        .econ-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .econ-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}

function levelFromSaturation(score: number): EconomicPressureLevel {
  if (score < 25) return "low";
  if (score < 45) return "manageable";
  if (score < 65) return "elevated";
  if (score < 80) return "dangerous";
  return "critical";
}
