import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { CONTROL_TOWER_EVENT } from "../lib/strategic-control-tower";
import { FOUNDER_BRIEF_EVENT } from "../lib/founder-brief";
import { OS_HEALTH_AUDIT_EVENT } from "../lib/os-health-audit";
import { recordGeneration } from "../lib/memory";
import {
  GUIDED_SETUP_EVENT,
  GUIDED_SETUP_STEP_ORDER,
  buildGuidedSetupMemoryPayload,
  buildGuidedSetupPlan,
  notifyGuidedSetupUpdated,
  saveGuidedSetupSession,
  stepMeta,
  type GuidedSetupStepId,
} from "../lib/guided-setup";

type Props = { onNavigate: (id: NavId) => void };

export function GuidedSetupView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(FOUNDER_BRIEF_EVENT, bump);
    window.addEventListener(CONTROL_TOWER_EVENT, bump);
    window.addEventListener(OS_HEALTH_AUDIT_EVENT, bump);
    window.addEventListener(GUIDED_SETUP_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(FOUNDER_BRIEF_EVENT, bump);
      window.removeEventListener(CONTROL_TOWER_EVENT, bump);
      window.removeEventListener(OS_HEALTH_AUDIT_EVENT, bump);
      window.removeEventListener(GUIDED_SETUP_EVENT, bump);
    };
  }, []);

  const plan = useMemo(() => buildGuidedSetupPlan(undefined, t, locale), [tick, t, locale]);
  const currentMeta = useMemo(() => stepMeta(plan.currentStep), [plan.currentStep]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildGuidedSetupMemoryPayload(plan);
    saveGuidedSetupSession(payload);
    recordGeneration({
      module: "guided_setup",
      title: t("gsp.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(currentMeta.titleKey),
    });
    notifyGuidedSetupUpdated();
    showToast(t("gsp.toast.saved"));
  }, [currentMeta.titleKey, plan, showToast, t]);

  const stepState = (id: GuidedSetupStepId): "done" | "blocked" | "current" | "pending" => {
    if (plan.completedSteps.includes(id)) return "done";
    if (plan.blockedSteps.includes(id)) return "blocked";
    if (plan.currentStep === id) return "current";
    return "pending";
  };

  return (
    <div className="gsp-page">
      <header className="glass-panel gsp-head">
        <p className="gsp-eyebrow">{t("gsp.eyebrow")}</p>
        <h1>{t("nav.guidedSetup")}</h1>
        <p className="gsp-lede">{t("gsp.lede")}</p>
        <p className="gsp-manual-tag">{t("gsp.manualTag")}</p>
        <div className="gsp-progress" role="progressbar" aria-valuenow={plan.progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="gsp-progress__bar" style={{ width: `${plan.progressPercent}%` }} />
          <span className="gsp-progress__label">
            {t("gsp.progress", {
              done: String(plan.completedSteps.length),
              total: String(GUIDED_SETUP_STEP_ORDER.length),
              pct: String(plan.progressPercent),
            })}
          </span>
        </div>
        <div className="gsp-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("gsp.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("osHealthAudit")}>
            {t("gsp.link.audit")}
          </button>
        </div>
      </header>

      {toast ? <p className="gsp-toast">{toast}</p> : null}

      <section className="glass-panel gsp-sec gsp-sec--current">
        <h2>{plan.isComplete ? t("gsp.section.complete") : t("gsp.section.current")}</h2>
        {plan.isComplete ? (
          <p className="gsp-complete">{t(plan.expectedOutcomeKey)}</p>
        ) : (
          <>
            <p className="gsp-step-title">{t(currentMeta.titleKey)}</p>
            <dl className="gsp-dl">
              <div>
                <dt>{t("gsp.label.why")}</dt>
                <dd>{t(currentMeta.whyKey)}</dd>
              </div>
              <div>
                <dt>{t("gsp.label.what")}</dt>
                <dd>{t(currentMeta.whatKey)}</dd>
              </div>
              <div>
                <dt>{t("gsp.label.outcome")}</dt>
                <dd>{t(plan.expectedOutcomeKey, plan.expectedOutcomeVars)}</dd>
              </div>
            </dl>
            <button type="button" className="primary-btn" onClick={() => onNavigate(currentMeta.navId)}>
              {t("gsp.action.openModule")}
            </button>
          </>
        )}
        <p className="gsp-conf">{t(plan.confidenceNoteKey)}</p>
      </section>

      <section className="glass-panel gsp-sec">
        <h2>{t("gsp.section.steps")}</h2>
        <ol className="gsp-steps">
          {GUIDED_SETUP_STEP_ORDER.map((id) => {
            const meta = stepMeta(id);
            const state = stepState(id);
            return (
              <li key={id} className={`gsp-step gsp-step--${state}`}>
                <div className="gsp-step__head">
                  <span className="gsp-step__title">{t(meta.titleKey)}</span>
                  <span className="gsp-step__badge">{t(`gsp.state.${state}`)}</span>
                </div>
                {state !== "done" ? (
                  <button type="button" className="gsp-step__link" onClick={() => onNavigate(meta.navId)} disabled={state === "blocked"}>
                    {t("gsp.action.go")}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <style>{`
        .gsp-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .gsp-head { padding: 14px 16px; }
        .gsp-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .gsp-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .gsp-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .gsp-progress { position: relative; height: 28px; background: rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
        .gsp-progress__bar { height: 100%; background: linear-gradient(90deg, rgba(120,180,255,0.35), rgba(120,220,180,0.45)); transition: width 0.25s ease; }
        .gsp-progress__label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 600; }
        .gsp-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .gsp-sec { padding: 14px 16px; }
        .gsp-step-title { margin: 0 0 12px; font-size: 1.05rem; font-weight: 600; }
        .gsp-dl { margin: 0 0 14px; display: grid; gap: 10px; }
        .gsp-dl dt { font-size: 0.72rem; text-transform: uppercase; opacity: 0.6; margin-bottom: 2px; }
        .gsp-dl dd { margin: 0; font-size: 0.9rem; line-height: 1.45; }
        .gsp-complete { margin: 0 0 10px; font-size: 0.95rem; }
        .gsp-conf { margin: 12px 0 0; font-size: 0.78rem; opacity: 0.7; }
        .gsp-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .gsp-step { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); }
        .gsp-step--done { opacity: 0.75; }
        .gsp-step--current { border-color: rgba(140,190,255,0.35); }
        .gsp-step--blocked { opacity: 0.5; }
        .gsp-step__head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
        .gsp-step__badge { font-size: 0.68rem; text-transform: uppercase; opacity: 0.65; }
        .gsp-step__link { margin-top: 8px; font-size: 0.78rem; background: none; border: none; color: inherit; cursor: pointer; opacity: 0.85; padding: 0; }
        .gsp-step__link:disabled { cursor: not-allowed; opacity: 0.4; }
        .gsp-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
