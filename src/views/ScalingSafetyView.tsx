import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { AD_PRESSURE_EVENT } from "../lib/ad-pressure";
import { ECONOMIC_PRESSURE_EVENT } from "../lib/economic-pressure";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { PRICE_POSITIONING_EVENT } from "../lib/price-positioning";
import {
  buildScalingSafetyMemoryPayload,
  buildScalingSafetyReport,
  notifyScalingSafetyUpdated,
  reportToDisplay,
  saveScalingSafetySession,
  SCALING_SAFETY_EVENT,
  type ScalingSafetyLevel,
} from "../lib/scaling-safety";
import { UNIT_ECONOMICS_EVENT } from "../lib/unit-economics";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function levelClass(level: ScalingSafetyLevel): string {
  return `ssf-lvl ssf-lvl--${level}`;
}

export function ScalingSafetyView({ onNavigate }: Props) {
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
    window.addEventListener(PRICE_POSITIONING_EVENT, bump);
    window.addEventListener(AD_PRESSURE_EVENT, bump);
    window.addEventListener(ECONOMIC_PRESSURE_EVENT, bump);
    window.addEventListener(SCALING_SAFETY_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(UNIT_ECONOMICS_EVENT, bump);
      window.removeEventListener(PRICE_POSITIONING_EVENT, bump);
      window.removeEventListener(AD_PRESSURE_EVENT, bump);
      window.removeEventListener(ECONOMIC_PRESSURE_EVENT, bump);
      window.removeEventListener(SCALING_SAFETY_EVENT, bump);
    };
  }, []);

  const report = useMemo(() => buildScalingSafetyReport(t), [tick, t]);
  const display = useMemo(() => reportToDisplay(report, t), [report, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildScalingSafetyMemoryPayload(report, {
      supportingSignals: display.supportingSignals,
      recommendations: [display.recommendedNextStep],
    });
    saveScalingSafetySession(payload);
    recordGeneration({
      module: "scaling_safety",
      title: t("ssf.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: display.confidenceNote,
    });
    notifyScalingSafetyUpdated();
    showToast(t("ssf.toast.saved"));
  }, [display.confidenceNote, display.recommendedNextStep, display.supportingSignals, report, showToast, t]);

  return (
    <div className="ssf-page">
      <header className="glass-panel ssf-head">
        <p className="ssf-eyebrow">{t("ssf.eyebrow")}</p>
        <h1>{t("nav.scalingSafety")}</h1>
        <p className="ssf-lede">{t("ssf.lede")}</p>
        <p className="ssf-manual-tag">{t("ssf.manualTag")}</p>
        <div className="ssf-headline">
          <span className={levelClass(report.safetyLevel)}>{t(`ssf.level.${report.safetyLevel}`)}</span>
          <span className="ssf-mode">{t(`ssf.mode.${report.scalingMode}`)}</span>
        </div>
        <p className="ssf-main">{display.mainReason}</p>
        <p className="ssf-conf">{display.confidenceNote}</p>
        <div className="ssf-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("ssf.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(JSON.stringify(report, null, 2))}>
            {t("ssf.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`scaling-safety-${report.id}.json`, report)}>
            {t("ssf.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="ssf-toast">{toast}</p> : null}

      <section className="glass-panel ssf-sec">
        <h2>{t("ssf.section.signals")}</h2>
        <p className="ssf-meta">
          {report.targetLabel} · {report.corridor} · {report.marketplace}
        </p>
        <ul className="ssf-list">
          {display.supportingSignals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {display.blockedBy.length > 0 ? (
        <section className="glass-panel ssf-sec ssf-sec--blocked">
          <h2>{t("ssf.section.blocked")}</h2>
          <ul className="ssf-list">
            {display.blockedBy.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel ssf-sec ssf-sec--grid">
        <div>
          <h2>{t("ssf.section.allowed")}</h2>
          <ul className="ssf-list ssf-list--ok">
            {display.allowedActions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>{t("ssf.section.forbidden")}</h2>
          <ul className="ssf-list ssf-list--no">
            {display.forbiddenActions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass-panel ssf-sec">
        <h2>{t("ssf.section.next")}</h2>
        <p className="ssf-next">{display.recommendedNextStep}</p>
      </section>

      <section className="glass-panel ssf-sec ssf-sec--links">
        <h2>{t("ssf.section.links")}</h2>
        <div className="ssf-links">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("economicPressure")}>
            {t("ssf.link.economic")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("unitEconomics")}>
            {t("ssf.link.unitEconomics")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("advertisingPressure")}>
            {t("ssf.link.ads")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
            {t("ssf.link.launch")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("ssf.link.assortment")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("ssf.link.collection")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("ssf.link.marketplace")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("heroCommand")}>
            {t("ssf.link.hero")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
            {t("ssf.link.founder")}
          </button>
        </div>
      </section>

      <style>{`
        .ssf-page { max-width: 820px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .ssf-head { padding: 14px 16px; }
        .ssf-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .ssf-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .ssf-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .ssf-headline { display: flex; gap: 12px; align-items: baseline; margin-bottom: 10px; flex-wrap: wrap; }
        .ssf-mode { font-size: 1.1rem; font-weight: 600; }
        .ssf-main { margin: 0 0 8px; font-weight: 600; line-height: 1.4; }
        .ssf-conf { margin: 0 0 12px; font-size: 0.85rem; font-style: italic; opacity: 0.8; }
        .ssf-head__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .ssf-sec { padding: 14px 16px; }
        .ssf-sec--grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .ssf-sec--grid { grid-template-columns: 1fr; } }
        .ssf-meta { margin: 0 0 10px; font-size: 0.85rem; opacity: 0.85; }
        .ssf-list { margin: 0; padding-left: 18px; font-size: 0.9rem; line-height: 1.45; }
        .ssf-list--ok { color: #a8d4b8; }
        .ssf-list--no { color: #e8b090; }
        .ssf-sec--blocked .ssf-list { color: #e89890; }
        .ssf-next { margin: 0; font-weight: 600; }
        .ssf-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .ssf-lvl--safe { color: #90d8a8; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
        .ssf-lvl--cautious { color: #a8c4e8; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
        .ssf-lvl--fragile { color: #e8c080; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
        .ssf-lvl--unsafe { color: #e8a090; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
        .ssf-lvl--blocked { color: #e87870; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; }
        .ssf-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
