import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../../types";
import { useI18n } from "../../lib/i18n/I18nContext";
import {
  LAUNCH_REVIEW_OUTCOME_OPTIONS,
  addLaunchReviewActionsToAssortmentPlan,
  buildLaunchReviewMemoryPayload,
  createReviewDraftFromPlan,
  deriveReviewLearningReinforcement,
  deriveReviewLearningFlags,
  finalizeLaunchReview,
  launchReviewToMarkdown,
  launchReviewToPlainText,
  loadLaunchReviewForPlan,
  notifyLaunchOpsUpdated,
  saveLaunchReview,
  saveLaunchOpsSession,
  buildLaunchOpsMemoryPayload,
  type LaunchReviewDraft,
  type MarketplaceLaunchPlan,
  type MarketplaceLaunchReview,
} from "../../lib/launch-ops";
import { getActiveEntitySnapshot } from "../../lib/entity-snapshot";
import { setAssortmentActionStatus } from "../../lib/assortment-actions";
import { recordGeneration } from "../../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../../lib/markdown";
import type { LaunchOpsGatherContext } from "../../lib/launch-ops/types";

type Props = {
  plan: MarketplaceLaunchPlan;
  ctx: LaunchOpsGatherContext;
  onNavigate: (id: NavId) => void;
  onToast: (msg: string) => void;
};

function field(
  label: string,
  value: string,
  onChange: (v: string) => void,
  rows = 3,
): ReactNode {
  return (
    <label className="lrev-field">
      <span className="lrev-field__lab">{label}</span>
      <textarea className="lrev-field__input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function LaunchReviewSection({ plan, ctx, onNavigate, onToast }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<LaunchReviewDraft>(() => createReviewDraftFromPlan(plan));
  const [saved, setSaved] = useState<MarketplaceLaunchReview | null>(() => loadLaunchReviewForPlan(plan.id));

  useEffect(() => {
    const prev = loadLaunchReviewForPlan(plan.id);
    setSaved(prev);
    if (prev) {
      const { id: _id, createdAt: _c, reviewedAt: _r, learningReinforcement: _l, ...rest } = prev;
      setDraft(rest);
    } else {
      setDraft(createReviewDraftFromPlan(plan));
    }
  }, [plan.id]);

  const patch = useCallback((p: Partial<LaunchReviewDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const previewReinforcement = useMemo(() => {
    const tmp = finalizeLaunchReview(draft, t, saved?.id);
    const flags = deriveReviewLearningFlags(tmp);
    return deriveReviewLearningReinforcement(tmp, flags, t);
  }, [draft, saved?.id, t]);

  const pushAssortment = useCallback(
    (mode: "followup" | "refresh" | "cleanup" | "competitive") => {
      const snap = getActiveEntitySnapshot();
      const review = finalizeLaunchReview(draft, t, saved?.id);
      if (!snap) {
        onToast(t("lops.needSnapshot"));
        return;
      }
      const rows = addLaunchReviewActionsToAssortmentPlan(snap.id, review, plan, mode, t);
      if (!rows.length) {
        onToast(t("lops.noActions"));
        return;
      }
      for (const r of rows) setAssortmentActionStatus(snap.id, r.id, "new");
      onToast(t("lops.added", { n: String(rows.length) }));
      onNavigate("assortmentActions");
    },
    [draft, onNavigate, onToast, plan, saved?.id, t],
  );

  const saveReview = useCallback(() => {
    const review = finalizeLaunchReview(draft, t, saved?.id);
    saveLaunchReview(review);
    setSaved(review);
    setDraft({
      sourceLaunchPlanId: review.sourceLaunchPlanId,
      collectionId: review.collectionId,
      collectionName: review.collectionName,
      marketplace: review.marketplace,
      launchDate: review.launchDate,
      outcomeState: review.outcomeState,
      launchedItems: review.launchedItems,
      heldItems: review.heldItems,
      blockedItems: review.blockedItems,
      earlyMarketObservation: review.earlyMarketObservation,
      productionIssues: review.productionIssues,
      contentIssues: review.contentIssues,
      fulfillmentIssues: review.fulfillmentIssues,
      competitorObservation: review.competitorObservation,
      suspectedOutcome: review.suspectedOutcome,
      nextDecision: review.nextDecision,
      learningNotes: review.learningNotes,
      followUpActions: review.followUpActions,
    });
    const mem = buildLaunchReviewMemoryPayload(review, plan);
    saveLaunchOpsSession(buildLaunchOpsMemoryPayload(plan, ctx, review));
    recordGeneration({
      module: "launch_review",
      title: t("lrev.memory.title", { name: review.collectionName }),
      content: JSON.stringify(mem),
      mime: "application/json",
      previewText: t(`lrev.state.${review.outcomeState}`),
    });
    notifyLaunchOpsUpdated();
    onToast(t("lrev.toast.saved"));
  }, [ctx, draft, onToast, plan, saved?.id, t]);

  const reviewForExport = useMemo(
    () => finalizeLaunchReview(draft, t, saved?.id),
    [draft, saved?.id, t],
  );

  return (
    <section className="glass-panel lops-sec lops-sec--review">
      <h2>{t("lrev.section.title")}</h2>
      <p className="lops-muted lrev-lede">{t("lrev.section.lede")}</p>
      {saved ? (
        <p className="lrev-saved-badge">
          {t("lrev.savedBadge", { state: t(`lrev.state.${saved.outcomeState}`) })}
        </p>
      ) : null}

      <div className="lrev-grid">
        <label className="lrev-field">
          <span className="lrev-field__lab">{t("lrev.field.launchDate")}</span>
          <input
            type="date"
            className="lrev-field__input lrev-field__input--date"
            value={draft.launchDate}
            onChange={(e) => patch({ launchDate: e.target.value })}
          />
        </label>
        <label className="lrev-field">
          <span className="lrev-field__lab">{t("lrev.field.outcomeState")}</span>
          <select
            className="lrev-field__input"
            value={draft.outcomeState}
            onChange={(e) => patch({ outcomeState: e.target.value as LaunchReviewDraft["outcomeState"] })}
          >
            {LAUNCH_REVIEW_OUTCOME_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {t(`lrev.state.${o}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {field(t("lrev.field.launched"), draft.launchedItems, (v) => patch({ launchedItems: v }))}
      {field(t("lrev.field.held"), draft.heldItems, (v) => patch({ heldItems: v }), 2)}
      {field(t("lrev.field.blocked"), draft.blockedItems, (v) => patch({ blockedItems: v }), 2)}
      {field(t("lrev.field.observation"), draft.earlyMarketObservation, (v) => patch({ earlyMarketObservation: v }))}
      {field(t("lrev.field.production"), draft.productionIssues, (v) => patch({ productionIssues: v }), 2)}
      {field(t("lrev.field.content"), draft.contentIssues, (v) => patch({ contentIssues: v }), 2)}
      {field(t("lrev.field.fulfillment"), draft.fulfillmentIssues, (v) => patch({ fulfillmentIssues: v }), 2)}
      {field(t("lrev.field.competitor"), draft.competitorObservation, (v) => patch({ competitorObservation: v }))}
      {field(t("lrev.field.suspected"), draft.suspectedOutcome, (v) => patch({ suspectedOutcome: v }), 2)}
      {field(t("lrev.field.nextDecision"), draft.nextDecision, (v) => patch({ nextDecision: v }), 2)}
      {field(t("lrev.field.followUp"), draft.followUpActions, (v) => patch({ followUpActions: v }), 3)}
      {field(t("lrev.field.learning"), draft.learningNotes, (v) => patch({ learningNotes: v }), 3)}

      {previewReinforcement.length > 0 ? (
        <div className="lrev-learn">
          <h3 className="lops-subh">{t("lrev.learn.previewTitle")}</h3>
          <ul>
            {previewReinforcement.map((line: string, i: number) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="lops-actions lrev-actions">
        <button type="button" className="primary-btn" onClick={saveReview}>
          {t("lrev.action.save")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => pushAssortment("followup")}>
          {t("lrev.action.followup")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => pushAssortment("refresh")}>
          {t("lrev.action.refreshWave")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => pushAssortment("cleanup")}>
          {t("lrev.action.cleanup")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => pushAssortment("competitive")}>
          {t("lrev.action.competitive")}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void copyToClipboard(launchReviewToPlainText(reviewForExport, plan, t))}
        >
          {t("lrev.action.copy")}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() =>
            downloadText(`launch-review-${reviewForExport.id}.md`, launchReviewToMarkdown(reviewForExport, plan, t))
          }
        >
          {t("lrev.action.exportMd")}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => downloadJson(`launch-review-${reviewForExport.id}.json`, reviewForExport)}
        >
          {t("lrev.action.exportJson")}
        </button>
      </div>

      <style>{`
        .lops-sec--review { margin-top: 4px; }
        .lrev-lede { margin: 0 0 12px; font-size: 0.9rem; }
        .lrev-saved-badge { font-size: 0.85rem; color: #90d8a8; margin: 0 0 12px; }
        .lrev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 640px) { .lrev-grid { grid-template-columns: 1fr; } }
        .lrev-field { display: block; margin-bottom: 10px; }
        .lrev-field__lab { display: block; font-size: 0.82rem; opacity: 0.8; margin-bottom: 4px; }
        .lrev-field__input { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); color: inherit; font: inherit; resize: vertical; }
        .lrev-field__input--date { resize: none; }
        .lrev-learn { margin: 12px 0; padding: 10px; border-radius: 8px; background: rgba(120,180,255,0.06); }
        .lrev-learn ul { margin: 6px 0 0; padding-left: 1.1rem; font-size: 0.88rem; }
        .lrev-actions { margin-top: 14px; }
      `}</style>
    </section>
  );
}
