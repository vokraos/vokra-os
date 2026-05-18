import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { AD_PRESSURE_EVENT } from "../lib/ad-pressure";
import { ECONOMIC_PRESSURE_EVENT } from "../lib/economic-pressure";
import {
  buildFboFbsDecisionMemoryPayload,
  buildFboFbsDecisionReport,
  FBO_FBS_DECISION_EVENT,
  notifyFboFbsDecisionUpdated,
  reportToDisplay,
  saveFboFbsDecisionSession,
  type FboDecisionReadiness,
  type FboFitLevel,
} from "../lib/fbo-fbs-decision";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { PRICE_POSITIONING_EVENT } from "../lib/price-positioning";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { UNIT_ECONOMICS_EVENT } from "../lib/unit-economics";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function fitClass(level: FboFitLevel): string {
  return `ffd-fit ffd-fit--${level}`;
}

function readinessClass(level: FboDecisionReadiness): string {
  return `ffd-rdy ffd-rdy--${level}`;
}

export function FboFbsDecisionView({ onNavigate }: Props) {
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
    window.addEventListener(FBO_FBS_DECISION_EVENT, bump);
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
      window.removeEventListener(FBO_FBS_DECISION_EVENT, bump);
    };
  }, []);

  const report = useMemo(() => buildFboFbsDecisionReport(t), [tick, t]);
  const display = useMemo(() => reportToDisplay(report, t), [report, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildFboFbsDecisionMemoryPayload(report, {
      risks: display.risks,
      testWaveSuggestion: display.testWaveSuggestion,
    });
    saveFboFbsDecisionSession(payload);
    recordGeneration({
      module: "fbo_fbs_decision",
      title: t("ffd.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: display.confidenceNote,
    });
    notifyFboFbsDecisionUpdated();
    showToast(t("ffd.toast.saved"));
  }, [display.confidenceNote, display.risks, display.testWaveSuggestion, report, showToast, t]);

  const fits: { label: string; level: FboFitLevel }[] = [
    { label: t("ffd.fit.economics"), level: report.economicsFit },
    { label: t("ffd.fit.launch"), level: report.launchFit },
    { label: t("ffd.fit.visual"), level: report.visualContentFit },
    { label: t("ffd.fit.seo"), level: report.seoFit },
    { label: t("ffd.fit.operational"), level: report.operationalFit },
  ];

  return (
    <div className="ffd-page">
      <header className="glass-panel ffd-head">
        <p className="ffd-eyebrow">{t("ffd.eyebrow")}</p>
        <h1>{t("nav.fboFbsDecision")}</h1>
        <p className="ffd-lede">{t("ffd.lede")}</p>
        <p className="ffd-manual-tag">{t("ffd.manualTag")}</p>
        <div className="ffd-headline">
          <span className="ffd-mode">{t(`ffd.mode.${report.recommendedMode}`)}</span>
          <span className={readinessClass(report.readiness)}>{t(`ffd.readiness.${report.readiness}`)}</span>
          <span className="ffd-conf-tag">{t(`ffd.confidence.${report.decisionConfidence}`)}</span>
        </div>
        <p className="ffd-current">
          {t("ffd.field.current")}: <strong>{report.currentStockMode}</strong> → {t(`ffd.mode.${report.recommendedMode}`)}
        </p>
        <p className="ffd-reason">{display.reason}</p>
        <p className="ffd-test">{display.testWaveSuggestion}</p>
        <p className="ffd-conf">{display.confidenceNote}</p>
        <div className="ffd-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("ffd.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(JSON.stringify(report, null, 2))}>
            {t("ffd.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`fbo-fbs-decision-${report.id}.json`, report)}>
            {t("ffd.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="ffd-toast">{toast}</p> : null}

      <section className="glass-panel ffd-sec">
        <h2>{t("ffd.section.fits")}</h2>
        <p className="ffd-meta">
          {report.targetLabel} · {report.corridor} · {report.marketplace}
        </p>
        <dl className="ffd-fits">
          {fits.map((f) => (
            <div key={f.label} className="ffd-fit-row">
              <dt>{f.label}</dt>
              <dd className={fitClass(f.level)}>{t(`ffd.fitLevel.${f.level}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {display.risks.length > 0 ? (
        <section className="glass-panel ffd-sec ffd-sec--risks">
          <h2>{t("ffd.section.risks")}</h2>
          <ul>{display.risks.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
      ) : null}

      <section className="glass-panel ffd-sec ffd-sec--grid">
        <div>
          <h2>{t("ffd.section.allowed")}</h2>
          <ul className="ffd-list ffd-list--ok">{display.allowedActions.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
        <div>
          <h2>{t("ffd.section.forbidden")}</h2>
          <ul className="ffd-list ffd-list--no">{display.forbiddenActions.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      </section>

      <section className="glass-panel ffd-sec">
        <h2>{t("ffd.section.next")}</h2>
        <p className="ffd-next">{display.recommendedNextStep}</p>
      </section>

      <section className="glass-panel ffd-sec ffd-sec--links">
        <h2>{t("ffd.section.links")}</h2>
        <div className="ffd-links">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("scalingSafety")}>
            {t("ffd.link.scaling")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("unitEconomics")}>
            {t("ffd.link.unitEconomics")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
            {t("ffd.link.launch")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("ffd.link.marketplace")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("ffd.link.assortment")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("economicPressure")}>
            {t("ffd.link.economic")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
            {t("ffd.link.founder")}
          </button>
        </div>
      </section>

      <style>{`
        .ffd-page { max-width: 820px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .ffd-head { padding: 14px 16px; }
        .ffd-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .ffd-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .ffd-manual-tag { margin: 0 0 8px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .ffd-headline { display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; margin-bottom: 8px; }
        .ffd-mode { font-size: 1.15rem; font-weight: 700; }
        .ffd-conf-tag { font-size: 0.78rem; opacity: 0.7; }
        .ffd-current { margin: 0 0 8px; font-size: 0.88rem; }
        .ffd-reason { margin: 0 0 6px; font-weight: 600; }
        .ffd-test { margin: 0 0 8px; font-size: 0.9rem; opacity: 0.9; }
        .ffd-conf { margin: 0 0 12px; font-style: italic; font-size: 0.85rem; opacity: 0.8; }
        .ffd-head__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .ffd-sec { padding: 14px 16px; }
        .ffd-sec--grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .ffd-sec--grid { grid-template-columns: 1fr; } }
        .ffd-meta { margin: 0 0 10px; font-size: 0.85rem; opacity: 0.85; }
        .ffd-fits { margin: 0; }
        .ffd-fit-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.88rem; }
        .ffd-fit-row dt { margin: 0; opacity: 0.85; }
        .ffd-fit-row dd { margin: 0; }
        .ffd-fit--strong { color: #90d8a8; }
        .ffd-fit--good { color: #a8d4b8; }
        .ffd-fit--fair { color: #e8c080; }
        .ffd-fit--fragile { color: #e8a090; }
        .ffd-fit--blocked { color: #e87870; }
        .ffd-rdy--expansion_ready { color: #90d8a8; font-weight: 600; }
        .ffd-rdy--ready { color: #a8c4e8; font-weight: 600; }
        .ffd-rdy--test_ready { color: #e8c080; }
        .ffd-rdy--fragile { color: #e8a090; }
        .ffd-rdy--blocked { color: #e87870; }
        .ffd-sec--risks ul { margin: 0; padding-left: 18px; color: #e8b090; }
        .ffd-list { margin: 0; padding-left: 18px; font-size: 0.9rem; }
        .ffd-list--ok { color: #a8d4b8; }
        .ffd-list--no { color: #e8b090; }
        .ffd-next { margin: 0; font-weight: 600; }
        .ffd-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .ffd-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
