import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import {
  AD_PRESSURE_EVENT,
  buildAdPressureMemoryPayload,
  buildPrimaryAdvertisingPressureReport,
  notifyAdPressureUpdated,
  reportToDisplay,
  saveAdPressureSession,
  type AdPressureLevel,
} from "../lib/ad-pressure";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { UNIT_ECONOMICS_EVENT } from "../lib/unit-economics";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function levelClass(level: AdPressureLevel): string {
  return `adp-lvl adp-lvl--${level}`;
}

function DimRow({ label, level, t }: { label: string; level: AdPressureLevel; t: (k: string) => string }) {
  return (
    <div className="adp-dim">
      <span>{label}</span>
      <span className={levelClass(level)}>{t(`adp.level.${level}`)}</span>
    </div>
  );
}

export function AdvertisingPressureView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(UNIT_ECONOMICS_EVENT, bump);
    window.addEventListener(AD_PRESSURE_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(UNIT_ECONOMICS_EVENT, bump);
      window.removeEventListener(AD_PRESSURE_EVENT, bump);
    };
  }, []);

  const report = useMemo(() => buildPrimaryAdvertisingPressureReport(), [tick]);
  const display = useMemo(() => reportToDisplay(report, t), [report, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildAdPressureMemoryPayload([report], {
      warnings: display.warnings,
      recommendations: [display.recommendedAction],
    });
    saveAdPressureSession(payload);
    recordGeneration({
      module: "advertising_pressure",
      title: t("adp.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: display.confidenceNote,
    });
    notifyAdPressureUpdated();
    showToast(t("adp.toast.saved"));
  }, [display.confidenceNote, display.recommendedAction, display.warnings, report, showToast, t]);

  const dims: { label: string; level: AdPressureLevel }[] = [
    { label: t("adp.dim.dependency"), level: report.adDependencyLevel },
    { label: t("adp.dim.launch"), level: report.launchAdPressure },
    { label: t("adp.dim.saturation"), level: report.saturationPressure },
    { label: t("adp.dim.unsafeSpend"), level: report.unsafeAdSpendRisk },
    { label: t("adp.dim.expansion"), level: report.expansionAdRisk },
    { label: t("adp.dim.refresh"), level: report.refreshAdPressure },
    { label: t("adp.dim.hero"), level: report.heroAdDependency },
  ];

  return (
    <div className="adp-page">
      <header className="glass-panel adp-head">
        <p className="adp-eyebrow">{t("adp.eyebrow")}</p>
        <h1>{t("nav.advertisingPressure")}</h1>
        <p className="adp-lede">{t("adp.lede")}</p>
        <p className="adp-manual-tag">{t("adp.manualTag")}</p>
        <p className="adp-conf">{display.confidenceNote}</p>
        <div className="adp-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("adp.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(JSON.stringify(report, null, 2))}>
            {t("adp.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`ad-pressure-${report.id}.json`, report)}>
            {t("adp.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="adp-toast">{toast}</p> : null}

      <section className="glass-panel adp-sec">
        <h2>{t("adp.section.overview")}</h2>
        <p className="adp-corridor">
          {t("adp.field.corridor")}: <strong>{report.corridor}</strong> · {report.marketplace} · {report.stockMode}
        </p>
        <p className="adp-action-main">{display.recommendedAction}</p>
        <div className="adp-dims">
          {dims.map((d) => (
            <DimRow key={d.label} label={d.label} level={d.level} t={t} />
          ))}
        </div>
      </section>

      {display.warnings.length > 0 ? (
        <section className="glass-panel adp-sec adp-sec--warn">
          <h2>{t("adp.section.warnings")}</h2>
          <ul>
            {display.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel adp-sec adp-sec--actions">
        <h2>{t("adp.section.links")}</h2>
        <div className="adp-actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("unitEconomics")}>
            {t("adp.link.unitEconomics")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
            {t("adp.link.launch")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("heroCommand")}>
            {t("adp.link.hero")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("adp.link.assortment")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("economicPressure")}>
            {t("adp.link.economic")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
            {t("adp.link.founder")}
          </button>
        </div>
      </section>

      <style>{`
        .adp-page { max-width: 800px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .adp-head { padding: 14px 16px; }
        .adp-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .adp-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .adp-manual-tag { margin: 0 0 8px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .adp-conf { margin: 0 0 12px; font-size: 0.85rem; font-style: italic; opacity: 0.8; }
        .adp-head__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .adp-sec { padding: 14px 16px; }
        .adp-corridor { margin: 0 0 12px; font-size: 0.88rem; opacity: 0.9; }
        .adp-action-main { margin: 0 0 14px; font-weight: 600; line-height: 1.4; }
        .adp-dims { display: grid; gap: 8px; }
        .adp-dim { display: flex; justify-content: space-between; font-size: 0.88rem; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .adp-lvl--low { color: #90d8a8; }
        .adp-lvl--manageable { color: #a8c4e8; }
        .adp-lvl--elevated { color: #e8c080; }
        .adp-lvl--dangerous { color: #e8a090; }
        .adp-lvl--critical { color: #e87870; }
        .adp-sec--warn ul { margin: 0; padding-left: 18px; color: #e8b090; font-size: 0.9rem; }
        .adp-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .adp-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
