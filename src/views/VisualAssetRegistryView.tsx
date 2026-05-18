import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import type { VisualAssetEntity, VisualAssetRegistryEnvelope, VisualAssetStatus } from "../lib/visual-assets";
import {
  clearVisualAssetRegistrySession,
  consumeRerunVisualAssetRegistry,
  loadVisualAssetRegistryFromSession,
  patchAssetInSession,
  registryToJsonString,
  requestMemoryFilter,
  saveVisualAssetRegistryToSession,
} from "../lib/visual-assets";
import { setVisualProductionFocusJobId } from "../lib/visual-production";
import {
  appendCardPlan,
  createCardProductionPlanFromVisualAsset,
} from "../lib/card-production";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

type SectionKey = "marketplace" | "campaign" | "exhibition" | "corporate" | "fatigue" | "archived";

function primarySection(a: VisualAssetEntity): SectionKey {
  if (a.status === "replaced" || a.status === "archived") return "archived";
  if (a.status === "fatigued" || (a.fatigueRiskScore !== null && a.fatigueRiskScore >= 4)) return "fatigue";
  if (a.assetRole === "exhibition") return "exhibition";
  if (a.assetRole === "corporate_merch") return "corporate";
  if (a.assetRole === "campaign" || a.assetRole === "reels") return "campaign";
  return "marketplace";
}

function excerpt(s: string, n: number): string {
  const x = s.trim();
  if (x.length <= n) return x;
  return `${x.slice(0, n - 1)}…`;
}

function scoreStrip(a: VisualAssetEntity): string {
  const parts = [a.brandFitScore, a.marketplaceClarityScore, a.printReadabilityScore, a.premiumPerceptionScore, a.fatigueRiskScore].map(
    (v) => (v === null ? "—" : String(v)),
  );
  return parts.join(" · ");
}

export function VisualAssetRegistryView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [envelope, setEnvelope] = useState<VisualAssetRegistryEnvelope | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const onCreateCardPlan = useCallback(
    (a: VisualAssetEntity) => {
      if (a.status !== "approved") {
        showToast(t("visualAssets.toastCardPlanNeedsApproval"));
        return;
      }
      appendCardPlan(createCardProductionPlanFromVisualAsset(a));
      showToast(t("visualAssets.toastCardPlanCreated"));
      onNavigate("cardProduction");
    },
    [onNavigate, showToast, t],
  );

  const persist = useCallback((next: VisualAssetRegistryEnvelope) => {
    saveVisualAssetRegistryToSession(next);
    setEnvelope(next);
  }, []);

  useEffect(() => {
    const fromSession = loadVisualAssetRegistryFromSession();
    if (fromSession) {
      setEnvelope(fromSession);
      return;
    }
    const fromRerun = consumeRerunVisualAssetRegistry();
    if (fromRerun) {
      saveVisualAssetRegistryToSession(fromRerun);
      setEnvelope(fromRerun);
    }
  }, []);

  const assets = envelope?.assets ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => {
      const blob = `${a.title} ${a.collectionName} ${a.sourcePrompt} ${a.approvedUsage} ${a.usageTarget} ${a.assetRole}`.toLowerCase();
      return blob.includes(q);
    });
  }, [assets, query]);

  const byBucket = useCallback(
    (bucket: SectionKey) => filtered.filter((a) => primarySection(a) === bucket).sort((a, b) => b.updatedAt - a.updatedAt),
    [filtered],
  );

  const saveMemory = useCallback(() => {
    if (!envelope) return;
    const fatigueN = envelope.assets.filter((a) => primarySection(a) === "fatigue").length;
    recordGeneration({
      module: "visual_asset_registry",
      title: t("visualAssets.memoryTitle", { count: String(envelope.assets.length) }),
      content: registryToJsonString(envelope),
      mime: "application/json",
      tags: ["visual_asset_registry", "registry"],
      meta: {
        assetCount: String(envelope.assets.length),
        activeApprox: String(envelope.assets.filter((a) => a.status === "active" || a.status === "approved" || a.status === "testing").length),
        fatigueBucket: String(fatigueN),
      },
    });
    showToast(t("visualAssets.toastSavedMemory"));
  }, [envelope, showToast, t]);

  const clear = useCallback(() => {
    clearVisualAssetRegistrySession();
    setEnvelope(null);
    showToast(t("visualAssets.toastCleared"));
  }, [showToast, t]);

  const patch = useCallback(
    (id: string, patch: Partial<VisualAssetEntity>) => {
      const next = patchAssetInSession(id, patch);
      if (next) persist(next);
    },
    [persist],
  );

  if (!envelope) {
    return (
      <div className="cb-lab va-empty">
        <header className="cb-lab__head">
          <p className="cb-lab__eyebrow">{t("visualAssets.eyebrow")}</p>
          <h1 className="cb-lab__title">{t("nav.visualAssets")}</h1>
          <p className="cb-lab__lede">{t("visualAssets.empty")}</p>
          <div className="va-empty__actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("visualProduction")}>
              {t("visualAssets.openVisualProduction")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
              {t("visualAssets.openMemory")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
              {t("nav.cardProduction")}
            </button>
          </div>
        </header>
        <style>{`
          .va-empty__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cb-lab va-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("visualAssets.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.visualAssets")}</h1>
        <p className="cb-lab__lede">{t("visualAssets.lede")}</p>
        <p className="va-meta">
          {envelope.assets.length} {t("visualAssets.assetsLabel")}
        </p>
        <label className="cb-ws__field va-search">
          <span className="cb-ws__label">{t("visualAssets.searchLabel")}</span>
          <input
            type="search"
            className="cb-ws__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("visualAssets.searchPh")}
          />
        </label>
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("visualAssets.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualProduction")}>
            {t("visualAssets.openVisualProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("promptPack")}>
            {t("visualAssets.openPromptPack")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("visualAssets.openCollectionBuilder")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualStrategy")}>
            {t("visualAssets.openVisualStrategy")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("nav.cardProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("nav.skuIntelligence")}
          </button>
          <button type="button" className="ghost-btn" onClick={clear}>
            {t("visualAssets.clearSession")}
          </button>
        </div>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
      </header>

      <RegistrySection title={t("visualAssets.section.marketplace")} items={byBucket("marketplace")} emptyHint={t("visualAssets.emptySection")}>
        {(a) => (
          <AssetCard
            asset={a}
            t={t}
            strip={scoreStrip(a)}
            onCopyPrompt={() => void copyToClipboard(a.sourcePrompt).then(() => showToast(t("visualAssets.toastCopiedPrompt")))}
            onStatus={(s) => patch(a.id, { status: s })}
            onMarkFatigue={() => {
              patch(a.id, {
                status: "fatigued",
                fatigue: {
                  ...a.fatigue,
                  refreshRecommendation: t("visualAssets.fatigueRecHigh"),
                  fatigueRiskScore: a.fatigueRiskScore ?? 4,
                },
              });
            }}
            onOpenJob={() => {
              setVisualProductionFocusJobId(a.sourceJobId);
              onNavigate("visualProduction");
            }}
            onOpenPack={() => requestMemoryFilter("prompt_pack", onNavigate)}
            onOpenCollection={() => onNavigate("collectionBuilder")}
            onSaveMemory={saveMemory}
            onNavigate={onNavigate}
            onCreateCardPlan={() => onCreateCardPlan(a)}
          />
        )}
      </RegistrySection>

      <RegistrySection title={t("visualAssets.section.campaign")} items={byBucket("campaign")} emptyHint={t("visualAssets.emptySection")}>
        {(a) => (
          <AssetCard
            asset={a}
            t={t}
            strip={scoreStrip(a)}
            onCopyPrompt={() => void copyToClipboard(a.sourcePrompt).then(() => showToast(t("visualAssets.toastCopiedPrompt")))}
            onStatus={(s) => patch(a.id, { status: s })}
            onMarkFatigue={() => {
              patch(a.id, {
                status: "fatigued",
                fatigue: {
                  ...a.fatigue,
                  refreshRecommendation: t("visualAssets.fatigueRecHigh"),
                  fatigueRiskScore: a.fatigueRiskScore ?? 4,
                },
              });
            }}
            onOpenJob={() => {
              setVisualProductionFocusJobId(a.sourceJobId);
              onNavigate("visualProduction");
            }}
            onOpenPack={() => requestMemoryFilter("prompt_pack", onNavigate)}
            onOpenCollection={() => onNavigate("collectionBuilder")}
            onSaveMemory={saveMemory}
            onNavigate={onNavigate}
            onCreateCardPlan={() => onCreateCardPlan(a)}
          />
        )}
      </RegistrySection>

      <RegistrySection title={t("visualAssets.section.exhibition")} items={byBucket("exhibition")} emptyHint={t("visualAssets.emptySection")}>
        {(a) => (
          <AssetCard
            asset={a}
            t={t}
            strip={scoreStrip(a)}
            onCopyPrompt={() => void copyToClipboard(a.sourcePrompt).then(() => showToast(t("visualAssets.toastCopiedPrompt")))}
            onStatus={(s) => patch(a.id, { status: s })}
            onMarkFatigue={() => {
              patch(a.id, {
                status: "fatigued",
                fatigue: {
                  ...a.fatigue,
                  refreshRecommendation: t("visualAssets.fatigueRecHigh"),
                  fatigueRiskScore: a.fatigueRiskScore ?? 4,
                },
              });
            }}
            onOpenJob={() => {
              setVisualProductionFocusJobId(a.sourceJobId);
              onNavigate("visualProduction");
            }}
            onOpenPack={() => requestMemoryFilter("prompt_pack", onNavigate)}
            onOpenCollection={() => onNavigate("collectionBuilder")}
            onSaveMemory={saveMemory}
            onNavigate={onNavigate}
            onCreateCardPlan={() => onCreateCardPlan(a)}
          />
        )}
      </RegistrySection>

      <RegistrySection title={t("visualAssets.section.corporate")} items={byBucket("corporate")} emptyHint={t("visualAssets.emptySection")}>
        {(a) => (
          <AssetCard
            asset={a}
            t={t}
            strip={scoreStrip(a)}
            onCopyPrompt={() => void copyToClipboard(a.sourcePrompt).then(() => showToast(t("visualAssets.toastCopiedPrompt")))}
            onStatus={(s) => patch(a.id, { status: s })}
            onMarkFatigue={() => {
              patch(a.id, {
                status: "fatigued",
                fatigue: {
                  ...a.fatigue,
                  refreshRecommendation: t("visualAssets.fatigueRecHigh"),
                  fatigueRiskScore: a.fatigueRiskScore ?? 4,
                },
              });
            }}
            onOpenJob={() => {
              setVisualProductionFocusJobId(a.sourceJobId);
              onNavigate("visualProduction");
            }}
            onOpenPack={() => requestMemoryFilter("prompt_pack", onNavigate)}
            onOpenCollection={() => onNavigate("collectionBuilder")}
            onSaveMemory={saveMemory}
            onNavigate={onNavigate}
            onCreateCardPlan={() => onCreateCardPlan(a)}
          />
        )}
      </RegistrySection>

      <RegistrySection title={t("visualAssets.section.fatigue")} items={byBucket("fatigue")} emptyHint={t("visualAssets.emptySection")}>
        {(a) => (
          <AssetCard
            asset={a}
            t={t}
            strip={scoreStrip(a)}
            onCopyPrompt={() => void copyToClipboard(a.sourcePrompt).then(() => showToast(t("visualAssets.toastCopiedPrompt")))}
            onStatus={(s) => patch(a.id, { status: s })}
            onMarkFatigue={() => {
              patch(a.id, {
                status: "fatigued",
                fatigue: {
                  ...a.fatigue,
                  refreshRecommendation: t("visualAssets.fatigueRecHigh"),
                  fatigueRiskScore: a.fatigueRiskScore ?? 4,
                },
              });
            }}
            onOpenJob={() => {
              setVisualProductionFocusJobId(a.sourceJobId);
              onNavigate("visualProduction");
            }}
            onOpenPack={() => requestMemoryFilter("prompt_pack", onNavigate)}
            onOpenCollection={() => onNavigate("collectionBuilder")}
            onSaveMemory={saveMemory}
            onNavigate={onNavigate}
            onCreateCardPlan={() => onCreateCardPlan(a)}
          />
        )}
      </RegistrySection>

      <RegistrySection title={t("visualAssets.section.archived")} items={byBucket("archived")} emptyHint={t("visualAssets.emptySection")}>
        {(a) => (
          <AssetCard
            asset={a}
            t={t}
            strip={scoreStrip(a)}
            onCopyPrompt={() => void copyToClipboard(a.sourcePrompt).then(() => showToast(t("visualAssets.toastCopiedPrompt")))}
            onStatus={(s) => patch(a.id, { status: s })}
            onMarkFatigue={() => {
              patch(a.id, {
                status: "fatigued",
                fatigue: {
                  ...a.fatigue,
                  refreshRecommendation: t("visualAssets.fatigueRecHigh"),
                  fatigueRiskScore: a.fatigueRiskScore ?? 4,
                },
              });
            }}
            onOpenJob={() => {
              setVisualProductionFocusJobId(a.sourceJobId);
              onNavigate("visualProduction");
            }}
            onOpenPack={() => requestMemoryFilter("prompt_pack", onNavigate)}
            onOpenCollection={() => onNavigate("collectionBuilder")}
            onSaveMemory={saveMemory}
            onNavigate={onNavigate}
            onCreateCardPlan={() => onCreateCardPlan(a)}
          />
        )}
      </RegistrySection>

      <style>{`
        .va-meta { font-size: 0.72rem; color: var(--muted); margin: 0 0 8px; }
        .va-search { margin-bottom: 10px; max-width: 420px; }
        .va-sec { margin-bottom: 18px; }
        .va-sec__h { font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(160, 180, 215, 0.9); margin: 0 0 10px; }
        .va-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .va-card {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.22);
          padding: 12px;
          font-size: 0.78rem;
        }
        .va-card__title { font-weight: 600; margin: 0 0 6px; }
        .va-card__row { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-bottom: 6px; color: rgba(175, 190, 220, 0.9); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .va-card__scores { font-family: ui-monospace, monospace; font-size: 0.7rem; color: rgba(185, 200, 230, 0.95); margin: 0 0 6px; }
        .va-card__pre {
          margin: 0 0 8px;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          line-height: 1.35;
          color: rgba(200, 210, 235, 0.9);
          max-height: 100px;
          overflow: auto;
        }
        .va-card__fatigue { font-size: 0.68rem; color: rgba(160, 175, 205, 0.88); margin: 0 0 8px; line-height: 1.35; }
        .va-card__actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      `}</style>
    </div>
  );
}

function RegistrySection({
  title,
  items,
  emptyHint,
  children,
}: {
  title: string;
  items: VisualAssetEntity[];
  emptyHint: string;
  children: (a: VisualAssetEntity) => ReactNode;
}) {
  return (
    <section className="cb-lab__panel glass-panel va-sec">
      <h2 className="va-sec__h">{title}</h2>
      {items.length === 0 ? <p className="cb-lab__prose cb-lab__prose--tight">{emptyHint}</p> : null}
      <div className="va-grid">{items.map((a) => <div key={a.id}>{children(a)}</div>)}</div>
    </section>
  );
}

function AssetCard({
  asset: a,
  t,
  strip,
  onCopyPrompt,
  onStatus,
  onMarkFatigue,
  onOpenJob,
  onOpenPack,
  onOpenCollection,
  onSaveMemory,
  onNavigate,
  onCreateCardPlan,
}: {
  asset: VisualAssetEntity;
  t: (k: string, v?: Record<string, string>) => string;
  strip: string;
  onCopyPrompt: () => void;
  onStatus: (s: VisualAssetStatus) => void;
  onMarkFatigue: () => void;
  onOpenJob: () => void;
  onOpenPack: () => void;
  onOpenCollection: () => void;
  onSaveMemory: () => void;
  onNavigate: (id: NavId) => void;
  onCreateCardPlan: () => void;
}) {
  return (
    <article className="va-card">
      <p className="va-card__title">{a.title}</p>
      <div className="va-card__row">
        <span>
          {t("visualAssets.k.role")}: {t(`visualAssets.role.${a.assetRole}`)}
        </span>
        <span>
          {t("visualAssets.k.usage")}: {a.approvedUsage || a.usageTarget}
        </span>
        <span>
          {t("visualAssets.k.status")}: {t(`visualAssets.status.${a.status}`)}
        </span>
      </div>
      <p className="va-card__row" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
        {t("visualAssets.k.collection")}: {a.collectionName} · <code>{a.collectionId}</code>
      </p>
      <p className="va-card__scores">
        {t("visualAssets.scoreStrip")}: {strip}
      </p>
      <p className="va-card__scores">
        {t("visualAssets.fatigueRiskTop")}: {a.fatigueRiskScore === null ? "—" : String(a.fatigueRiskScore)}
      </p>
      <p className="va-card__fatigue">
        {t("visualAssets.fatigue.age")}: {a.fatigue.visualAgeDays}d · {t("visualAssets.fatigue.usage")}: {a.fatigue.usageCount} ·{" "}
        {t("visualAssets.fatigue.exposure")}: {a.fatigue.exposureNote || "—"}
        <br />
        {t("visualAssets.fatigue.refresh")}: {a.fatigue.refreshRecommendation}
      </p>
      {a.selectedResultNote.trim() ? (
        <p className="cb-lab__prose cb-lab__prose--tight" style={{ fontSize: "0.72rem", marginBottom: 6 }}>
          <strong>{t("visualAssets.selectedNote")}</strong> {a.selectedResultNote}
        </p>
      ) : null}
      <pre className="va-card__pre">{excerpt(a.sourcePrompt, 360)}</pre>
      <div className="va-card__actions">
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onCopyPrompt}>
          {t("visualAssets.action.copyPrompt")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => onStatus("active")} disabled={a.status === "active"}>
          {t("visualAssets.action.active")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => onStatus("testing")} disabled={a.status === "testing"}>
          {t("visualAssets.action.testing")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => onStatus("approved")} disabled={a.status === "approved"}>
          {t("visualAssets.action.approved")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => onStatus("replaced")} disabled={a.status === "replaced"}>
          {t("visualAssets.action.replaced")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onMarkFatigue} disabled={a.status === "fatigued"}>
          {t("visualAssets.action.fatigue")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => onStatus("archived")} disabled={a.status === "archived"}>
          {t("visualAssets.action.archive")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onOpenJob}>
          {t("visualAssets.action.openJob")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onOpenPack}>
          {t("visualAssets.action.openPack")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onOpenCollection}>
          {t("visualAssets.action.openCollection")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={() => onNavigate("visualStrategy")}>
          {t("visualAssets.action.openStrategy")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onCreateCardPlan}>
          {t("visualAssets.action.createCardPlan")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onSaveMemory}>
          {t("visualAssets.action.saveMemory")}
        </button>
      </div>
    </article>
  );
}
