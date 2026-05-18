import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  useCollectionDeriveInput,
  useCollectionPipelineInputWithoutEntity,
  compareWorkshopCandidates,
  buildCollectionEntity,
} from "../lib/collection-builder";
import {
  LAUNCH_OPS_EVENT,
  addLaunchActionsToAssortmentPlan,
  buildLaunchOpsMemoryPayload,
  buildMarketplaceLaunchPlan,
  gatherLaunchOpsContext,
  notifyLaunchOpsUpdated,
  saveLaunchOpsSession,
  type LaunchReadinessLevel,
} from "../lib/launch-ops";
import { getActiveEntitySnapshot } from "../lib/entity-snapshot";
import { setAssortmentActionStatus } from "../lib/assortment-actions";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";
import { LaunchReviewSection } from "../components/launch-ops/LaunchReviewSection";

type Props = { onNavigate: (id: NavId) => void };

function readinessClass(level: LaunchReadinessLevel): string {
  return `lops-readiness lops-readiness--${level}`;
}

function pctBar(label: string, pct: number) {
  const v = Math.min(100, Math.max(0, Math.round(pct)));
  return (
    <div className="lops-bar">
      <div className="lops-bar__head">
        <span>{label}</span>
        <span>{v}%</span>
      </div>
      <div className="lops-bar__track">
        <div className="lops-bar__fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function LaunchOperationsView({ onNavigate }: Props) {
  const { t } = useI18n();
  const deriveInput = useCollectionDeriveInput();
  const pipelineInput = useCollectionPipelineInputWithoutEntity();
  const [salt, setSalt] = useState(0);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener(LAUNCH_OPS_EVENT, fn);
    return () => window.removeEventListener(LAUNCH_OPS_EVENT, fn);
  }, []);

  const recommendedSalt = useMemo(() => {
    const candidates = [0, 1, 2].map((s) => buildCollectionEntity({ ...deriveInput, candidateSalt: s }));
    const { recommendedId } = compareWorkshopCandidates(candidates, pipelineInput);
    const idx = candidates.findIndex((c) => c.id === recommendedId);
    return idx >= 0 ? idx : 0;
  }, [deriveInput, pipelineInput, tick]);

  const ctx = useMemo(
    () => gatherLaunchOpsContext(deriveInput, pipelineInput, salt || recommendedSalt),
    [deriveInput, pipelineInput, salt, recommendedSalt, tick],
  );

  const plan = useMemo(() => buildMarketplaceLaunchPlan(ctx, t), [ctx, t]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const pushAssortment = useCallback(
    (mode: Parameters<typeof addLaunchActionsToAssortmentPlan>[2]) => {
      const snap = getActiveEntitySnapshot();
      if (!snap || !plan) {
        showToast(t("lops.needSnapshot"));
        return;
      }
      const rows = addLaunchActionsToAssortmentPlan(snap.id, plan, mode, t);
      if (!rows.length) {
        showToast(t("lops.noActions"));
        return;
      }
      for (const r of rows) setAssortmentActionStatus(snap.id, r.id, "new");
      showToast(t("lops.added", { n: String(rows.length) }));
      onNavigate("assortmentActions");
    },
    [onNavigate, plan, showToast, t],
  );

  const saveMemory = useCallback(() => {
    if (!plan) return;
    const payload = buildLaunchOpsMemoryPayload(plan, ctx);
    saveLaunchOpsSession(payload);
    recordGeneration({
      module: "launch_operations",
      title: t("lops.memory.title", { name: plan.collectionName }),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`lops.readiness.${plan.launchReadiness}`),
    });
    notifyLaunchOpsUpdated();
    showToast(t("lops.toast.saved"));
  }, [ctx, plan, showToast, t]);

  if (!plan) {
    return (
      <div className="lops-page">
        <header className="glass-panel lops-page__head">
          <h1>{t("lops.title")}</h1>
          <p>{t("lops.lede")}</p>
        </header>
        <section className="glass-panel lops-empty">
          <p>{t("lops.empty")}</p>
          <button type="button" className="primary-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("lops.action.collectionBuilder")}
          </button>
        </section>
        <LopsStyles />
      </div>
    );
  }

  return (
    <div className="lops-page">
      <header className="glass-panel lops-page__head">
        <p className="lops-eyebrow">{t("lops.eyebrow")}</p>
        <h1>{t("lops.title")}</h1>
        <p className="lops-lede">{t("lops.lede")}</p>
        <div className="lops-head__meta">
          <span>{plan.collectionName}</span>
          <span>·</span>
          <span>{plan.marketplace}</span>
          <span>·</span>
          <span className={readinessClass(plan.launchReadiness)}>{t(`lops.readiness.${plan.launchReadiness}`)}</span>
          <span>({plan.launchReadinessScore}%)</span>
        </div>
        <div className="lops-head__actions">
          <label className="lops-salt">
            {t("lops.candidate")}
            <select value={salt} onChange={(e) => setSalt(Number(e.target.value))}>
              {[0, 1, 2, 3].map((s) => (
                <option key={s} value={s}>
                  {s === recommendedSalt ? `${s} ★` : String(s)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("lops.action.collectionBuilder")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("heroCommand")}>
            {t("lops.action.heroCommand")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("lops.action.saveMemory")}
          </button>
        </div>
      </header>

      {toast ? <p className="lops-toast">{toast}</p> : null}

      <section className="glass-panel lops-sec">
        <h2>{t("lops.section.readiness")}</h2>
        <p className="lops-risk">{plan.launchRisk}</p>
        <p>{plan.saturationRisk}</p>
        <p>
          <strong>{t("lops.timing.label")}:</strong> {plan.launchTiming.label} — {plan.launchTiming.windowNote}
        </p>
        {pctBar(t("lops.pressure.launch"), plan.launchPressure)}
        {pctBar(t("lops.pressure.fbo"), plan.fboPressure)}
        {pctBar(t("lops.pressure.fbs"), plan.fbsPressure)}
      </section>

      <section className="glass-panel lops-sec">
        <h2>{t("lops.section.waves")}</h2>
        <ul className="lops-waves">
          {[plan.heroWave, plan.supportWave, plan.expansionWave, plan.archiveRefreshWave].map((w) => (
            <li key={w.kind} className={`lops-wave lops-wave--${w.status}`}>
              <span className="lops-wave__order">{w.sequenceOrder}</span>
              <div>
                <strong>{w.title}</strong>
                <p>{w.reason}</p>
                <p className="lops-muted">{w.skuNote}</p>
                <span className="lops-wave__st">{t(`lops.waveStatus.${w.status}`)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel lops-sec">
        <h2>{t("lops.section.sequence")}</h2>
        <ol className="lops-seq">
          {plan.launchSequence.map((s) => (
            <li key={s.order} className={`lops-seq__li lops-seq__li--${s.status}`}>
              <span>{s.order}.</span> {s.label}
            </li>
          ))}
        </ol>
      </section>

      <section className="glass-panel lops-sec">
        <h2>{t("lops.section.blockers")}</h2>
        {plan.blockers.length === 0 ? (
          <p className="lops-muted">{t("lops.blockers.none")}</p>
        ) : (
          <ul className="lops-blockers">
            {plan.blockers.map((b) => (
              <li key={b.id}>
                <span className={`lops-sev lops-sev--${b.severity}`}>{b.severity}</span> {b.label}
              </li>
            ))}
          </ul>
        )}
        {plan.stopConditions.length > 0 ? (
          <>
            <h3 className="lops-subh">{t("lops.section.stops")}</h3>
            <ul className="lops-stops">
              {plan.stopConditions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="glass-panel lops-sec">
        <h2>{t("lops.section.rec")}</h2>
        <ul>
          {plan.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        {plan.operationalWarnings.length > 0 ? (
          <ul className="lops-warn">
            {plan.operationalWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <LaunchReviewSection plan={plan} ctx={ctx} onNavigate={onNavigate} onToast={showToast} />

      <section className="glass-panel lops-sec lops-sec--actions">
        <h2>{t("lops.section.integrations")}</h2>
        <div className="lops-actions">
          <button type="button" className="primary-btn" onClick={() => pushAssortment("blockers")}>
            {t("lops.action.sendBlockers")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => pushAssortment("review")}>
            {t("lops.action.launchReview")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => pushAssortment("hold")}>
            {t("lops.action.launchHold")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => pushAssortment("expansion")}>
            {t("lops.action.expansionWave")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => pushAssortment("refresh")}>
            {t("lops.action.refreshWave")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("lops.action.assortment")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("lops.action.marketplaceOps")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("lops.action.visualAssets")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("lops.action.cardProduction")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(JSON.stringify(plan, null, 2))}
          >
            {t("lops.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`launch-plan-${plan.id}.json`, plan)}>
            {t("lops.action.exportJson")}
          </button>
        </div>
      </section>

      <LopsStyles />
    </div>
  );
}

function LopsStyles() {
  return (
    <style>{`
      .lops-page { max-width: 960px; margin: 0 auto; padding: 8px 0 40px; display: grid; gap: 14px; }
      .lops-page__head { padding: 14px 16px; }
      .lops-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
      .lops-lede { margin: 6px 0 0; opacity: 0.85; line-height: 1.45; }
      .lops-head__meta { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.9rem; }
      .lops-head__actions { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .lops-salt { display: flex; gap: 6px; align-items: center; font-size: 0.88rem; }
      .lops-sec { padding: 14px 16px; }
      .lops-sec--actions { margin-bottom: 8px; }
      .lops-subh { margin: 12px 0 6px; font-size: 0.95rem; }
      .lops-muted { opacity: 0.75; }
      .lops-risk { font-weight: 600; }
      .lops-waves { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
      .lops-wave { display: grid; grid-template-columns: 28px 1fr; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
      .lops-wave--blocked { border-color: rgba(220, 120, 100, 0.45); }
      .lops-wave--ready { border-color: rgba(120, 200, 140, 0.35); }
      .lops-wave__order { font-weight: 700; opacity: 0.7; }
      .lops-wave__st { font-size: 0.78rem; opacity: 0.75; }
      .lops-seq { margin: 0; padding-left: 1.2rem; }
      .lops-seq__li--blocked { opacity: 0.7; color: #e8a090; }
      .lops-blockers, .lops-stops, .lops-warn { margin: 0; padding-left: 1.1rem; }
      .lops-sev { font-size: 0.72rem; text-transform: uppercase; opacity: 0.8; }
      .lops-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .lops-bar { margin-top: 8px; }
      .lops-bar__head { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; }
      .lops-bar__track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
      .lops-bar__fill { height: 100%; background: rgba(120, 180, 255, 0.55); }
      .lops-readiness--blocked { color: #e8a090; }
      .lops-readiness--fragile { color: #e8c080; }
      .lops-readiness--ready, .lops-readiness--expansion_ready { color: #90d8a8; }
      .lops-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      .lops-empty { padding: 20px; text-align: center; }
    `}</style>
  );
}
