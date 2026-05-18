import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import type {
  CardProductionBoardEnvelope,
  CardProductionPlan,
  MarketplaceUploadBrief,
  UploadReadinessChecks,
} from "../lib/card-production";
import {
  assembleCardContentPatch,
  boardToJsonString,
  buildImageUploadOrderForPlan,
  buildMarketplaceUploadBrief,
  clearCardProductionSession,
  computeUploadReadinessChecks,
  consumeRerunCardProductionBoard,
  deriveComplianceWarnings,
  deriveContentChecklist,
  deriveUploadMissingItems,
  inSectionAssemblyReady,
  inSectionBlocked,
  inSectionMissingDetail,
  inSectionMissingGrid,
  inSectionMissingHero,
  inSectionMissingSeo,
  inSectionReadyOzon,
  inSectionReadyWb,
  loadCardProductionBoardFromSession,
  patchCardPlanInSession,
  patchUploadBriefByPlanId,
  planToJsonString,
  planToMarkdownBrief,
  refreshPlanDerivedFields,
  saveCardProductionBoardToSession,
  uploadBriefPlainCopy,
  uploadBriefToJson,
  uploadBriefToMarkdown,
  uploadReadinessPercent,
  upsertUploadBriefToSession,
} from "../lib/card-production";
import { loadVisualAssetRegistryFromSession } from "../lib/visual-assets";
import { loadPromptPackFromSession } from "../lib/prompt-pack";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function contentChecklistLabel(t: (k: string, v?: Record<string, string>) => string, code: string): string {
  if (code.startsWith("warning:")) return code.slice("warning:".length);
  const key = `cardProduction.checklist.${code}`;
  const msg = t(key);
  return msg === key ? code : msg;
}

function excerpt(s: string, n: number): string {
  const x = s.trim();
  if (x.length <= n) return x;
  return `${x.slice(0, n - 1)}…`;
}

export function CardProductionView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [envelope, setEnvelope] = useState<CardProductionBoardEnvelope | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    const fromSession = loadCardProductionBoardFromSession();
    if (fromSession) {
      setEnvelope(fromSession);
      return;
    }
    const fromRerun = consumeRerunCardProductionBoard();
    if (fromRerun) {
      saveCardProductionBoardToSession(fromRerun);
      setEnvelope(fromRerun);
    }
  }, []);

  const plans = envelope?.plans ?? [];
  const uploadBriefs = envelope?.uploadBriefs ?? [];

  const displayPlans = useMemo(() => {
    const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
    return plans.map((p) => refreshPlanDerivedFields(p, assets));
  }, [plans]);

  const saveMemory = useCallback(() => {
    if (!envelope) return;
    recordGeneration({
      module: "card_production",
      title: t("cardProduction.memoryTitle", { count: String(envelope.plans.length) }),
      content: boardToJsonString(envelope),
      mime: "application/json",
      tags: ["card_production", "registry"],
      meta: {
        planCount: String(envelope.plans.length),
        briefCount: String(envelope.uploadBriefs?.length ?? 0),
      },
    });
    showToast(t("cardProduction.toastSavedMemory"));
  }, [envelope, showToast, t]);

  const clear = useCallback(() => {
    clearCardProductionSession();
    setEnvelope(null);
    showToast(t("cardProduction.toastCleared"));
  }, [showToast, t]);

  const onPatchPlan = useCallback(
    (planId: string, patch: Partial<CardProductionPlan>) => {
      const cur = loadCardProductionBoardFromSession();
      if (!cur) return;
      const idx = cur.plans.findIndex((p) => p.id === planId);
      if (idx < 0) return;
      const prev = cur.plans[idx]!;
      const merged = { ...prev, ...patch, updatedAt: Date.now() };
      const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
      const refr = refreshPlanDerivedFields(merged, assets);
      const next = patchCardPlanInSession(planId, refr);
      if (next) setEnvelope(next);
    },
    [setEnvelope],
  );

  if (!envelope) {
    return (
      <div className="cb-lab cp-empty">
        <header className="cb-lab__head">
          <p className="cb-lab__eyebrow">{t("cardProduction.eyebrow")}</p>
          <h1 className="cb-lab__title">{t("nav.cardProduction")}</h1>
          <p className="cb-lab__lede">{t("cardProduction.empty")}</p>
          <div className="cp-empty__actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
              {t("cardProduction.openVisualAssets")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
              {t("cardProduction.openMarketplaceOps")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
              {t("cardProduction.openSkuIntel")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("ingestionReadiness")}>
              {t("cardProduction.openIngestionReadiness")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
              {t("cardProduction.openMemory")}
            </button>
          </div>
        </header>
        <style>{`.cp-empty__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }`}</style>
      </div>
    );
  }

  return (
    <div className="cb-lab cp-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("cardProduction.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.cardProduction")}</h1>
        <p className="cb-lab__lede">{t("cardProduction.lede")}</p>
        <p className="cp-meta">
          {envelope.plans.length} {t("cardProduction.plansLabel")}
        </p>
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("cardProduction.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("cardProduction.openVisualAssets")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("seo")}>
            {t("cardProduction.openSeo")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("cardProduction.openMarketplaceOps")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("cardProduction.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("ingestionReadiness")}>
            {t("cardProduction.openIngestionReadiness")}
          </button>
          <button type="button" className="ghost-btn" onClick={clear}>
            {t("cardProduction.clearSession")}
          </button>
        </div>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
      </header>

      <section className="cb-lab__panel glass-panel cp-sec">
        <h2 className="cp-sec__h">{t("cardProduction.section.uploadBrief")}</h2>
        <div className="cp-grid">
          {displayPlans.map((plan) => {
            const brief = uploadBriefs.find((b) => b.cardPlanId === plan.id) ?? null;
            return (
              <UploadBriefCard
                key={`upload-brief-${plan.id}`}
                plan={plan}
                brief={brief}
                t={t}
                showToast={showToast}
                onGenerate={() => {
                  const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
                  const nb = buildMarketplaceUploadBrief(plan, assets);
                  const next = upsertUploadBriefToSession(nb);
                  if (next) setEnvelope(next);
                  showToast(t("cardProduction.toastUploadBrief"));
                }}
                onPatchBrief={(patch) => {
                  const next = patchUploadBriefByPlanId(plan.id, patch);
                  if (next) setEnvelope(next);
                }}
              />
            );
          })}
        </div>
      </section>

      <PlanSection title={t("cardProduction.section.assembly")} plans={displayPlans} filter={inSectionAssemblyReady} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.missingHero")} plans={displayPlans} filter={inSectionMissingHero} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.missingDetail")} plans={displayPlans} filter={inSectionMissingDetail} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.missingSeo")} plans={displayPlans} filter={inSectionMissingSeo} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.missingGrid")} plans={displayPlans} filter={inSectionMissingGrid} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.readyWb")} plans={displayPlans} filter={inSectionReadyWb} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.readyOzon")} plans={displayPlans} filter={inSectionReadyOzon} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <PlanSection title={t("cardProduction.section.blocked")} plans={displayPlans} filter={inSectionBlocked} emptyHint={t("cardProduction.emptySection")}>
        {(p) => (
          <PlanCard
            plan={p}
            t={t}
            showToast={showToast}
            onPatch={(patch) => onPatchPlan(p.id, patch)}
            onAssembleContent={() => {
              const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
              const patch = assembleCardContentPatch(p, { assets, promptPack: loadPromptPackFromSession() });
              onPatchPlan(p.id, patch);
              showToast(t("cardProduction.toastAssembled"));
            }}
            onCopySummary={() => void copySummary(p, t).then(() => showToast(t("cardProduction.toastCopied")))}
          />
        )}
      </PlanSection>

      <style>{`
        .cp-meta { font-size: 0.72rem; color: var(--muted); margin: 0 0 8px; }
        .cp-sec { margin-bottom: 18px; }
        .cp-sec__h { font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(160, 180, 215, 0.9); margin: 0 0 10px; }
        .cp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
        .cp-card {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.22);
          padding: 12px;
          font-size: 0.78rem;
        }
        .cp-card__title { font-weight: 600; margin: 0 0 6px; }
        .cp-card__row { font-size: 0.68rem; color: rgba(175, 190, 220, 0.92); margin-bottom: 6px; line-height: 1.4; }
        .cp-card__checks { font-family: ui-monospace, monospace; font-size: 0.68rem; color: rgba(185, 200, 230, 0.95); margin: 0 0 8px; white-space: pre-wrap; }
        .cp-card__list { margin: 0 0 8px; padding-left: 1rem; font-size: 0.7rem; color: rgba(165, 180, 210, 0.9); }
        .cp-card__ta { width: 100%; min-height: 56px; font-size: 0.72rem; font-family: inherit; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: var(--text); padding: 6px 8px; margin-bottom: 8px; }
        .cp-card__actions { display: flex; flex-wrap: wrap; gap: 6px; }
      `}</style>
    </div>
  );
}

async function copySummary(plan: CardProductionPlan, t: (k: string) => string): Promise<void> {
  const c = plan.readinessChecks;
  const cc = plan.contentReadinessChecks;
  const lines = [
    plan.cardTitle,
    `${t("cardProduction.k.marketplace")}: ${plan.marketplace}`,
    `${t("cardProduction.k.status")}: ${plan.cardStatus}`,
    `${t("cardProduction.hero")}: ${plan.heroVisualId ?? "—"}`,
    `${t("cardProduction.support")}: ${plan.supportVisualIds.join(", ") || "—"}`,
    `${t("cardProduction.detail")}: ${plan.detailVisualIds.join(", ") || "—"}`,
    `${t("cardProduction.rich")}: ${plan.richContentVisualIds.join(", ") || "—"}`,
    `${t("cardProduction.grid")}: ${plan.sizeGridVisualId ?? "—"}`,
    `${t("cardProduction.reels")}: ${plan.reelsVisualIds.join(", ") || "—"}`,
    `${t("cardProduction.readinessLine")}: ${plan.readiness}`,
    `hero:${c.heroVisualReady} support:${c.supportVisualsReady} detail:${c.detailShotsReady} seo:${c.seoReady} grid:${c.sizeGridReady} clarity:${c.marketplaceClarityReady} brand:${c.brandFitReady}`,
    `${t("cardProduction.contentReadinessLine")}: ${plan.contentReadiness}`,
    `content: seo:${cc.seoContentReady} desc:${cc.descriptionContentReady} rich:${cc.richContentStructureReady} mat:${cc.materialBlockReady} size:${cc.sizeBlockReady} copy:${cc.marketplaceCopyReady}`,
    `${t("cardProduction.lbl.wbTitle")}: ${plan.wbTitle || "—"}`,
    `${t("cardProduction.lbl.ozonTitle")}: ${plan.ozonTitle || "—"}`,
    `${t("cardProduction.lbl.primaryKw")}: ${plan.primaryKeywords.join(", ") || "—"}`,
    `${t("cardProduction.blockers")}: ${plan.blockers.join("; ") || "—"}`,
    `${t("cardProduction.seoCluster")}: ${excerpt(plan.seoCluster, 400)}`,
    `${t("cardProduction.lbl.description")}: ${excerpt(plan.descriptionDraft, 600)}`,
    `${t("cardProduction.futureSku")}: ${plan.skuIds.join(", ") || "—"}`,
    `${t("cardProduction.futureCardIds")}: ${plan.cardIds.join(", ") || "—"}`,
    `wbArticle: ${plan.wbArticle ?? "—"} ozonOfferId: ${plan.ozonOfferId ?? "—"}`,
  ];
  await copyToClipboard(lines.join("\n"));
}

const UPLOAD_READINESS_GATES: { key: keyof UploadReadinessChecks; i18nKey: string }[] = [
  { key: "titleReady", i18nKey: "cardProduction.uploadGate.title" },
  { key: "descriptionReady", i18nKey: "cardProduction.uploadGate.description" },
  { key: "keywordsReady", i18nKey: "cardProduction.uploadGate.keywords" },
  { key: "heroImageReady", i18nKey: "cardProduction.uploadGate.heroImage" },
  { key: "richContentReady", i18nKey: "cardProduction.uploadGate.richContent" },
  { key: "sizeGridReady", i18nKey: "cardProduction.uploadGate.sizeGrid" },
  { key: "attributesReady", i18nKey: "cardProduction.uploadGate.attributes" },
  { key: "complianceReady", i18nKey: "cardProduction.uploadGate.compliance" },
];

function uploadMissingLabel(t: (k: string, v?: Record<string, string>) => string, code: string): string {
  const key = `cardProduction.uploadMissing.${code}`;
  const msg = t(key);
  return msg === key ? code : msg;
}

function complianceLabel(t: (k: string, v?: Record<string, string>) => string, code: string): string {
  const key = `cardProduction.compliance.${code}`;
  const msg = t(key);
  return msg === key ? code : msg;
}

function uploadSlotLabel(t: (k: string, v?: Record<string, string>) => string, slot: string): string {
  const key = `cardProduction.uploadSlot.${slot}`;
  const msg = t(key);
  return msg === key ? slot : msg;
}

function UploadBriefCard({
  plan,
  brief,
  t,
  showToast,
  onGenerate,
  onPatchBrief,
}: {
  plan: CardProductionPlan;
  brief: MarketplaceUploadBrief | null;
  t: (k: string, v?: Record<string, string>) => string;
  showToast: (msg: string) => void;
  onGenerate: () => void;
  onPatchBrief: (patch: Partial<MarketplaceUploadBrief>) => void;
}) {
  const registry = loadVisualAssetRegistryFromSession();
  const assets = registry?.assets ?? [];
  const byId = new Map(assets.map((a) => [a.id, a] as const));
  const liveComp = deriveComplianceWarnings(plan, byId);
  const liveChecks = computeUploadReadinessChecks(plan, byId, liveComp);
  const livePct = uploadReadinessPercent(liveChecks);
  const liveMissing = deriveUploadMissingItems(liveChecks);

  const wbT = brief?.wbTitle ?? plan.wbTitle;
  const ozT = brief?.ozonTitle ?? plan.ozonTitle;
  const desc = brief?.fullDescription ?? plan.descriptionDraft;
  const kw = brief?.keywords ?? [...new Set([...plan.primaryKeywords, ...plan.secondaryKeywords].map((x) => x.trim()).filter(Boolean))];
  const richOrder = brief?.richContentOrder ?? plan.richContentBlocks.map((b) => `${b.id}: ${b.headline}`);
  const imageOrder = brief?.imageOrder ?? buildImageUploadOrderForPlan(plan);
  const exportBrief = brief ?? buildMarketplaceUploadBrief(plan, assets);

  const safeSlug = plan.id.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 48);

  return (
    <article className="cp-card">
      <p className="cp-card__title">{plan.cardTitle}</p>
      <p className="cp-card__row">
        {t("cardProduction.k.marketplace")}: {brief?.marketplace ?? plan.marketplace} · SKU: <code>{brief?.targetSkuFamily ?? plan.targetSkuFamily}</code>
      </p>

      <div className="cp-card__actions" style={{ marginBottom: 10 }}>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onGenerate}>
          {t("cardProduction.uploadBrief.generate")}
        </button>
      </div>
      {!brief ? <p className="cb-lab__prose cb-lab__prose--tight">{t("cardProduction.uploadBrief.empty")}</p> : null}

      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.wbTitle")}</span>
        <textarea className="cp-card__ta" rows={2} readOnly value={wbT} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.ozonTitle")}</span>
        <textarea className="cp-card__ta" rows={2} readOnly value={ozT} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.description")}</span>
        <textarea className="cp-card__ta" rows={6} readOnly value={desc} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.primaryKw")}</span>
        <textarea className="cp-card__ta" rows={2} readOnly value={kw.join(", ")} />
      </label>

      <p className="cp-card__row">{t("cardProduction.uploadBrief.richOrder")}</p>
      <ul className="cp-card__list">
        {richOrder.length === 0 ? <li>—</li> : richOrder.map((line) => <li key={line}>{line}</li>)}
      </ul>

      <p className="cp-card__row">{t("cardProduction.uploadBrief.imageOrder")}</p>
      <ul className="cp-card__list">
        {imageOrder.map((row) => (
          <li key={row.step}>
            {uploadSlotLabel(t, row.slot)} → <code>{row.assetId ?? "—"}</code>
          </li>
        ))}
      </ul>

      <p className="cp-card__row">{t("cardProduction.uploadBrief.missing")}</p>
      <ul className="cp-card__list">
        {liveMissing.length === 0 ? <li>—</li> : liveMissing.map((code) => <li key={code}>{uploadMissingLabel(t, code)}</li>)}
      </ul>

      <p className="cp-card__row">{t("cardProduction.uploadBrief.compliance")}</p>
      <ul className="cp-card__list">
        {liveComp.length === 0 ? <li>—</li> : liveComp.map((code) => <li key={code}>{complianceLabel(t, code)}</li>)}
      </ul>

      <p className="cp-card__row">
        {t("cardProduction.uploadBrief.readiness")}: <strong>{livePct}%</strong> ({t("cardProduction.uploadBrief.livePct")})
        {brief ? (
          <span style={{ opacity: 0.75 }}>
            {" "}
            · {t("cardProduction.uploadBrief.storedLine")}: {brief.uploadReadiness}
          </span>
        ) : null}
      </p>
      <ul className="cp-card__list cp-card__checks">
        {UPLOAD_READINESS_GATES.map(({ key, i18nKey }) => (
          <li key={key}>
            {liveChecks[key] ? "✓" : "○"} {t(i18nKey)}
          </li>
        ))}
      </ul>

      {brief ? (
        <>
          <p className="cp-card__row">{t("cardProduction.uploadBrief.attributes")}</p>
          <ul className="cp-card__list">
            {brief.attributesChecklist.map((id) => (
              <li key={id}>
                □ <code>{id}</code>
              </li>
            ))}
          </ul>
          <label className="cb-ws__field">
            <span className="cb-ws__label">{t("cardProduction.uploadBrief.priceNote")}</span>
            <textarea
              className="cp-card__ta"
              rows={2}
              value={brief.pricePositioningNote}
              onChange={(e) => onPatchBrief({ pricePositioningNote: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span className="cb-ws__label">{t("cardProduction.uploadBrief.categoryNote")}</span>
            <textarea
              className="cp-card__ta"
              rows={2}
              value={brief.categoryNote}
              onChange={(e) => onPatchBrief({ categoryNote: e.target.value })}
            />
          </label>
        </>
      ) : null}

      <div className="cp-card__actions">
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(wbT).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyWbTitle")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(ozT).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyOzonTitle")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(desc).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyDescription")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(kw.join(", ")).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.uploadBrief.copyKeywords")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(uploadBriefPlainCopy(exportBrief)).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.uploadBrief.copyBrief")}
        </button>
        <button
          type="button"
          className="ghost-btn ghost-btn--sm"
          onClick={() => {
            downloadText(`upload-brief-${safeSlug}.md`, uploadBriefToMarkdown(exportBrief, plan));
            showToast(t("cardProduction.toastExportedMd"));
          }}
        >
          {t("cardProduction.uploadBrief.exportMd")}
        </button>
        <button
          type="button"
          className="ghost-btn ghost-btn--sm"
          onClick={() => {
            downloadText(`upload-brief-${safeSlug}.json`, uploadBriefToJson(exportBrief, plan));
            showToast(t("cardProduction.toastExportedJson"));
          }}
        >
          {t("cardProduction.uploadBrief.exportJson")}
        </button>
      </div>
    </article>
  );
}

function PlanSection({
  title,
  plans,
  filter,
  emptyHint,
  children,
}: {
  title: string;
  plans: CardProductionPlan[];
  filter: (p: CardProductionPlan) => boolean;
  emptyHint: string;
  children: (p: CardProductionPlan) => ReactNode;
}) {
  const list = useMemo(() => plans.filter(filter), [plans, filter]);
  return (
    <section className="cb-lab__panel glass-panel cp-sec">
      <h2 className="cp-sec__h">{title}</h2>
      {list.length === 0 ? <p className="cb-lab__prose cb-lab__prose--tight">{emptyHint}</p> : null}
      <div className="cp-grid">{list.map((p) => <div key={p.id}>{children(p)}</div>)}</div>
    </section>
  );
}

function PlanCard({
  plan: p,
  t,
  showToast,
  onPatch,
  onAssembleContent,
  onCopySummary,
}: {
  plan: CardProductionPlan;
  t: (k: string, v?: Record<string, string>) => string;
  showToast: (msg: string) => void;
  onPatch: (patch: Partial<CardProductionPlan>) => void;
  onAssembleContent: () => void;
  onCopySummary: () => void;
}) {
  const c = p.readinessChecks;
  const cc = p.contentReadinessChecks;
  const checkLine = [
    `H:${c.heroVisualReady ? 1 : 0}`,
    `S:${c.supportVisualsReady ? 1 : 0}`,
    `D:${c.detailShotsReady ? 1 : 0}`,
    `SEO:${c.seoReady ? 1 : 0}`,
    `G:${c.sizeGridReady ? 1 : 0}`,
    `CLR:${c.marketplaceClarityReady ? 1 : 0}`,
    `BR:${c.brandFitReady ? 1 : 0}`,
  ].join(" ");
  const contentLine = [
    `SEO:${cc.seoContentReady ? 1 : 0}`,
    `DESC:${cc.descriptionContentReady ? 1 : 0}`,
    `RICH:${cc.richContentStructureReady ? 1 : 0}`,
    `MAT:${cc.materialBlockReady ? 1 : 0}`,
    `SZ:${cc.sizeBlockReady ? 1 : 0}`,
    `CPY:${cc.marketplaceCopyReady ? 1 : 0}`,
  ].join(" ");
  const contentMiss = deriveContentChecklist(p, cc);

  const safeSlug = p.id.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 48);

  return (
    <article className="cp-card">
      <p className="cp-card__title">{p.cardTitle}</p>
      <div className="cp-card__row">
        {t("cardProduction.k.marketplace")}: {p.marketplace} · {t("cardProduction.k.status")}: {p.cardStatus} · coll <code>{p.collectionId}</code>
      </div>
      <p className="cp-card__row">
        {t("cardProduction.hero")}: <code>{p.heroVisualId ?? "—"}</code>
      </p>
      <p className="cp-card__checks">{checkLine}</p>
      <p className="cp-card__row">{t("cardProduction.readinessLine")}: {p.readiness}</p>
      <p className="cp-card__checks">{t("cardProduction.contentChecks")}: {contentLine}</p>
      <p className="cp-card__row">{t("cardProduction.contentReadinessLine")}: {p.contentReadiness}</p>
      <p className="cp-card__row">{t("cardProduction.nextGen")}</p>
      <ul className="cp-card__list">
        {!c.heroVisualReady ? <li>{t("cardProduction.hint.hero")}</li> : null}
        {!c.supportVisualsReady ? <li>{t("cardProduction.hint.support")}</li> : null}
        {!c.detailShotsReady ? <li>{t("cardProduction.hint.detail")}</li> : null}
        {!c.seoReady ? <li>{t("cardProduction.hint.seo")}</li> : null}
        {!c.sizeGridReady ? <li>{t("cardProduction.hint.grid")}</li> : null}
        {!c.marketplaceClarityReady ? <li>{t("cardProduction.hint.clarity")}</li> : null}
        {!c.brandFitReady ? <li>{t("cardProduction.hint.brand")}</li> : null}
        {p.blockers.length > 0 ? (
          <li>
            {t("cardProduction.blockers")}: {p.blockers.join(", ")}
          </li>
        ) : null}
      </ul>
      <p className="cp-card__row">{t("cardProduction.lbl.missingContent")}</p>
      <ul className="cp-card__list">
        {contentMiss.length === 0 ? <li>—</li> : contentMiss.map((code) => <li key={code}>{contentChecklistLabel(t, code)}</li>)}
      </ul>
      <p className="cp-card__row">{t("cardProduction.pasteWb")}</p>
      <p className="cp-card__row">{t("cardProduction.pasteOzon")}</p>

      <div className="cp-card__actions" style={{ marginBottom: 10 }}>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onAssembleContent}>
          {t("cardProduction.assembleContent")}
        </button>
      </div>

      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.wbTitle")}</span>
        <textarea className="cp-card__ta" rows={2} value={p.wbTitle} onChange={(e) => onPatch({ wbTitle: e.target.value })} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.ozonTitle")}</span>
        <textarea className="cp-card__ta" rows={2} value={p.ozonTitle} onChange={(e) => onPatch({ ozonTitle: e.target.value })} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.primaryKw")}</span>
        <textarea
          className="cp-card__ta"
          rows={2}
          value={p.primaryKeywords.join(", ")}
          onChange={(e) =>
            onPatch({
              primaryKeywords: e.target.value
                .split(/[,;\n]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.secondaryKw")}</span>
        <textarea
          className="cp-card__ta"
          rows={2}
          value={p.secondaryKeywords.join(", ")}
          onChange={(e) =>
            onPatch({
              secondaryKeywords: e.target.value
                .split(/[,;\n]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.description")}</span>
        <textarea className="cp-card__ta" rows={5} value={p.descriptionDraft} onChange={(e) => onPatch({ descriptionDraft: e.target.value })} />
      </label>

      <p className="cp-card__row">{t("cardProduction.lbl.richBlocks")}</p>
      {p.richContentBlocks.map((b) => (
        <label key={b.id} className="cb-ws__field">
          <span className="cb-ws__label">{b.headline}</span>
          <textarea
            className="cp-card__ta"
            rows={3}
            value={b.body}
            onChange={(e) =>
              onPatch({
                richContentBlocks: p.richContentBlocks.map((x) => (x.id === b.id ? { ...x, body: e.target.value } : x)),
              })
            }
          />
        </label>
      ))}

      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.material")}</span>
        <textarea className="cp-card__ta" rows={3} value={p.materialBlock} onChange={(e) => onPatch({ materialBlock: e.target.value })} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.printQuality")}</span>
        <textarea className="cp-card__ta" rows={2} value={p.printQualityBlock} onChange={(e) => onPatch({ printQualityBlock: e.target.value })} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.care")}</span>
        <textarea className="cp-card__ta" rows={2} value={p.careInstructions} onChange={(e) => onPatch({ careInstructions: e.target.value })} />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.lbl.sizeNote")}</span>
        <textarea className="cp-card__ta" rows={2} value={p.sizeBlock} onChange={(e) => onPatch({ sizeBlock: e.target.value })} />
      </label>

      {p.seoWarnings.length > 0 ? (
        <>
          <p className="cp-card__row">{t("cardProduction.lbl.warnings")}</p>
          <ul className="cp-card__list">
            {p.seoWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      ) : null}

      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.seoCluster")}</span>
        <textarea
          className="cp-card__ta"
          value={p.seoCluster}
          onChange={(e) => onPatch({ seoCluster: e.target.value })}
          placeholder={t("cardProduction.seoPh")}
        />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.productionNotes")}</span>
        <textarea
          className="cp-card__ta"
          rows={2}
          value={p.productionNotes}
          onChange={(e) => onPatch({ productionNotes: e.target.value })}
        />
      </label>
      <label className="cb-ws__field">
        <span className="cb-ws__label">{t("cardProduction.marketplaceNotes")}</span>
        <textarea
          className="cp-card__ta"
          rows={2}
          value={p.marketplaceNotes}
          onChange={(e) => onPatch({ marketplaceNotes: e.target.value })}
        />
      </label>
      <div className="cp-card__actions">
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(p.wbTitle).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyWbTitle")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(p.ozonTitle).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyOzonTitle")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(p.descriptionDraft).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyDescription")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => void copyToClipboard(planToMarkdownBrief(p)).then(() => showToast(t("cardProduction.toastCopied")))}>
          {t("cardProduction.copyFullBrief")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onCopySummary}>
          {t("cardProduction.copyHandoff")}
        </button>
        <button
          type="button"
          className="ghost-btn ghost-btn--sm"
          onClick={() => {
            downloadText(`card-brief-${safeSlug}.md`, planToMarkdownBrief(p));
            showToast(t("cardProduction.toastExportedMd"));
          }}
        >
          {t("cardProduction.exportMd")}
        </button>
        <button
          type="button"
          className="ghost-btn ghost-btn--sm"
          onClick={() => {
            downloadText(`card-plan-${safeSlug}.json`, planToJsonString(p));
            showToast(t("cardProduction.toastExportedJson"));
          }}
        >
          {t("cardProduction.exportJson")}
        </button>
      </div>
    </article>
  );
}
