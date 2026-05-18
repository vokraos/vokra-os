import { useCallback, useMemo, useState } from "react";
import { runOpenAIVision, visionUserImage, visionUserText } from "../lib/ai/openai";
import { copyToClipboard, downloadJson } from "../lib/markdown";
import { getOpenAISettings } from "../lib/settings";
import { lsGet, lsSet } from "../lib/storage";
import { buildVisualAnalysisSystemPrompt, buildVisualAnalysisUserPrompt } from "../lib/visual/analysisPrompt";
import { parseVisualAnalysisJson } from "../lib/visual/parseAnalysis";
import { selectAssetsForApi, selectAssetsForCompare } from "../lib/visual/slots";
import {
  VISUAL_ANALYSIS_STORAGE_KEY,
  VISUAL_ASSET_KINDS,
  type VisualAnalysisResult,
  type VisualAssetKind,
  type VisualStagedAsset,
} from "../lib/visual/types";
import { VisualDimensionGrid } from "../components/visual/VisualDimensionGrid";
import { VisualGenerativeOutputs } from "../components/visual/VisualGenerativeOutputs";
import { VisualMarketplacePanel } from "../components/visual/VisualMarketplacePanel";
import { VisualMetaPanel } from "../components/visual/VisualMetaPanel";
import { VisualRecommendations } from "../components/visual/VisualRecommendations";
import { VisualScoreCards } from "../components/visual/VisualScoreCards";
import { VisualUploadZone } from "../components/visual/VisualUploadZone";
import { useI18n } from "../lib/i18n/I18nContext";
import { getStoredLocale, translate } from "../lib/i18n/localeStorage";
import { recordVisualAnalysis } from "../lib/memory";

function emptyAssets(): Record<VisualAssetKind, VisualStagedAsset | null> {
  return {
    print: null,
    mockup: null,
    product: null,
    marketplace_screenshot: null,
    fashion_reference: null,
    campaign_reference: null,
  };
}

function tryLoadCached(): VisualAnalysisResult | null {
  const raw = lsGet(VISUAL_ANALYSIS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as VisualAnalysisResult;
    if ((o?.schemaVersion === 1 || o?.schemaVersion === 2) && o.scores && o.dimensions) return o;
  } catch {
    /* ignore */
  }
  return null;
}

export function VisualIntelligenceLabView() {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Record<VisualAssetKind, VisualStagedAsset | null>>(emptyAssets);
  const [marketplaceMode, setMarketplaceMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisualAnalysisResult | null>(() => tryLoadCached());
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "ok">("idle");

  const batch = useMemo(
    () => (compareMode ? selectAssetsForCompare(assets) : selectAssetsForApi(assets)),
    [assets, compareMode],
  );

  const canRun = compareMode ? batch.length >= 2 : batch.length >= 1;
  const primaryPreview = batch[0]?.asset.dataUrl;

  const setKindAsset = useCallback((kind: VisualAssetKind, next: VisualStagedAsset | null) => {
    setAssets((prev) => ({ ...prev, [kind]: next }));
  }, []);

  async function runAnalysis() {
    setError(null);
    setToast(null);
    const s = getOpenAISettings();
    const loc = getStoredLocale();
    if (!s.apiKey) {
      setError(translate(loc, "errors.noApiKey"));
      return;
    }
    if (!canRun) {
      setError(compareMode ? t("visual.compareNeedTwo") : translate(loc, "errors.noImages"));
      return;
    }

    const userPrompt = buildVisualAnalysisUserPrompt({
      marketplaceMode,
      compareMode,
      slots: batch.map(({ kind }) => ({ kind })),
    });

    const userContent = [visionUserText(userPrompt), ...batch.map(({ asset }) => visionUserImage(asset.dataUrl))];

    setAnalyzing(true);
    try {
      const raw = await runOpenAIVision({
        apiKey: s.apiKey,
        model: s.model,
        system: buildVisualAnalysisSystemPrompt(),
        userContent,
      });
      const parsed = parseVisualAnalysisJson(raw);
      setResult(parsed);
      lsSet(VISUAL_ANALYSIS_STORAGE_KEY, JSON.stringify(parsed));
      recordVisualAnalysis({
        title: `${t("visual.title")} · ${new Date().toLocaleString()}`,
        analysisJson: JSON.stringify(parsed),
        schemaVersion: parsed.schemaVersion === 2 ? 2 : 1,
        previewImageDataUrl: batch[0]?.asset.dataUrl ?? null,
        uploadedAssetsMeta: batch.map(({ kind, asset }) => ({ kind, fileName: asset.fileName })),
        scoresSummary: parsed.quickSummary ?? parsed.executiveSummary,
      });
      setSaveState("ok");
      window.setTimeout(() => setSaveState("idle"), 2400);
      setToast(t("visual.toastDone"));
      window.setTimeout(() => setToast(null), 3200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : translate(loc, "errors.analysisFailed");
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  async function onCopyJson() {
    if (!result) return;
    await copyToClipboard(JSON.stringify(result, null, 2));
    setToast(t("visual.copyJsonToast"));
    window.setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="view vil">
      <header className="view__header vil__header">
        <p className="eyebrow">{t("visual.eyebrow")}</p>
        <h2 className="view__title">{t("visual.title")}</h2>
        <p className="view__desc vil__lede">{t("visual.desc")}</p>
        <p className="vil__onboard">{t("gen.autoMemoryHint")}</p>
      </header>

      <div className="vil__toolbar glass-panel">
        <div className="vil__toggles">
          <label className="vil-toggle">
            <input type="checkbox" checked={marketplaceMode} onChange={(e) => setMarketplaceMode(e.target.checked)} />
            <span>
              <strong>{t("visual.wbMode")}</strong>
              <small>{t("visual.wbModeHint")}</small>
            </span>
          </label>
          <label className="vil-toggle">
            <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
            <span>
              <strong>{t("visual.compare")}</strong>
              <small>{t("visual.compareHint")}</small>
            </span>
          </label>
        </div>
        <div className="vil__actions">
          <button type="button" className="generate-btn" onClick={() => void runAnalysis()} disabled={analyzing || !canRun}>
            {analyzing ? (
              <>
                <span className="loading-orb" aria-hidden />
                {t("visual.analyzing")}
              </>
            ) : (
              t("visual.run")
            )}
          </button>
          {result && (
            <>
              <button type="button" className="ghost-btn" onClick={() => void onCopyJson()}>
                {t("visual.copyJson")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => downloadJson("vokra-visual-analysis", result)}>
                {t("visual.exportJson")}
              </button>
              {saveState === "ok" && (
                <span className="memory-pill" style={{ marginLeft: 8 }}>
                  {t("memory.autoSaved")}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <p className="vil__toast">{toast}</p>}
      {error && (
        <div className="vil__err glass-panel" role="alert">
          {error}
        </div>
      )}

      <section className="vil__uploads">
        <h3 className="vil__sec-title">{t("visual.ingest")}</h3>
        <p className="vil__sec-hint">{t("visual.ingestHint")}</p>
        <div className="vil__grid">
          {VISUAL_ASSET_KINDS.map((kind) => (
            <VisualUploadZone
              key={kind}
              title={t(`visual.slot.${kind}.title`)}
              subtitle={t(`visual.slot.${kind}.subtitle`)}
              asset={assets[kind]}
              disabled={false}
              busy={analyzing}
              dropCta={t("visual.upload.drop")}
              replaceLabel={t("visual.upload.replace")}
              clearLabel={t("visual.upload.clear")}
              noFileError={t("visual.ingestError")}
              onAsset={(payload) => setKindAsset(kind, { ...payload, kind })}
              onClear={() => setKindAsset(kind, null)}
              onError={(msg) => setError(msg)}
            />
          ))}
        </div>
      </section>

      {primaryPreview && (
        <section className="vil__mobile glass-panel">
          <h3 className="vil__sec-title">{t("visual.mobileSim")}</h3>
          <p className="vil__sec-hint">{t("visual.ingestHint")}</p>
          <div className="vil__phone">
            <div className="vil__phone-notch" aria-hidden />
            <div className="vil__feed">
              <div className="vil__tile">
                <img src={primaryPreview} alt="" className="vil__tile-img" />
              </div>
              <div className="vil__tile vil__tile--ghost" />
              <div className="vil__tile vil__tile--ghost" />
            </div>
          </div>
        </section>
      )}

      {result && (
        <div className="vil__results">
          {(result.executiveSummary || result.quickSummary) && (
            <div className="vil__exec glass-panel">
              <h3 className="vil__sec-title">{t("visual.execBlock")}</h3>
              {result.executiveSummary && <p className="vil__exec-text">{result.executiveSummary}</p>}
              {result.quickSummary && (
                <div className="vil__quick">
                  <h4 className="vil__quick-h">{t("visual.quickSummary")}</h4>
                  <p className="vil__exec-text vil__exec-text--muted">{result.quickSummary}</p>
                </div>
              )}
              {result.scoreConfidence && (
                <div className="vil__conf">
                  <h4 className="vil__quick-h">{t("visual.confidence")}</h4>
                  <p className="vil__conf-row">
                    <span>{t("visual.scoreMarket")}</span>
                    <strong>{result.scoreConfidence.overall}</strong>
                  </p>
                  <p className="vil__conf-row">
                    <span>CTR signal</span>
                    <strong>{result.scoreConfidence.ctrSignal}</strong>
                  </p>
                  <p className="vil__conf-notes">{result.scoreConfidence.notes}</p>
                </div>
              )}
              {result.conversionPrediction && (
                <div className="vil__conv">
                  <h4 className="vil__quick-h">{t("visual.conversionPred")}</h4>
                  <p className="vil__conv-head">{result.conversionPrediction.headline}</p>
                  <p className="vil__exec-text vil__exec-text--muted">{result.conversionPrediction.rationale}</p>
                  <p className="vil__conv-score">
                    {result.conversionPrediction.score}
                    <span>/100</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {result.compare && (
            <div className="vil__compare glass-panel">
              <h3 className="vil__sec-title">{t("visual.compare")}</h3>
              <p className="vil__exec-text">
                <strong>A/B:</strong> {result.compare.thumbnailPick} · {result.compare.winner}
              </p>
              <p className="vil__exec-text">{result.compare.rationale}</p>
              <div className="vil__compare-grid">
                <div>
                  <h4 className="vil__quick-h">{t("visual.whyCtr")}</h4>
                  <p className="vil__exec-text vil__exec-text--muted">{result.compare.whyCtrGap}</p>
                </div>
                <div>
                  <h4 className="vil__quick-h">{t("visual.howToFix")}</h4>
                  <p className="vil__exec-text vil__exec-text--muted">{result.compare.howToCloseGap}</p>
                </div>
              </div>
            </div>
          )}

          {result.recommendationClusters && (result.recommendationClusters.ctrRisk.length > 0 || result.recommendationClusters.production.length > 0) && (
            <div className="vil__clusters glass-panel">
              <h3 className="vil__sec-title">{t("visual.whyCtr")} / {t("visual.howToFix")}</h3>
              <div className="vil__cluster-cols">
                <div>
                  <h4 className="vil__quick-h">CTR / лента</h4>
                  <ul className="vil__cluster-list">
                    {result.recommendationClusters.ctrRisk.map((c, i) => (
                      <li key={i}>
                        <strong>{c.title}</strong>
                        <span>{c.whyCtr}</span>
                        <em>{c.howToFix}</em>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="vil__quick-h">Production</h4>
                  <ul className="vil__cluster-list">
                    {result.recommendationClusters.production.map((c, i) => (
                      <li key={i}>
                        <strong>{c.title}</strong>
                        <span>{c.action}</span>
                        <em>{c.rationale}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <VisualMetaPanel meta={result.meta} />
          <VisualScoreCards scores={result.scores} />
          <div className="vil__split">
            <VisualDimensionGrid dimensions={result.dimensions} />
            {result.marketplaceScreenshot ? (
              <VisualMarketplacePanel analysis={result.marketplaceScreenshot} />
            ) : (
              <div className="vil__placeholder glass-panel">
                <p className="vil__ph-title">{t("visual.marketEmptyTitle")}</p>
                <p className="vil__ph-body">{t("visual.marketEmptyBody")}</p>
              </div>
            )}
          </div>
          <VisualRecommendations items={result.recommendations} />
          <VisualGenerativeOutputs generative={result.generative} />
        </div>
      )}

      <style>{`
        .vil__header {
          margin-bottom: 22px;
        }
        .vil__lede {
          max-width: 820px;
        }
        .vil__onboard {
          margin: 10px 0 0;
          font-size: 0.82rem;
          color: var(--faint);
          max-width: 820px;
        }
        .vil__toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 22px;
          margin-bottom: 16px;
        }
        .vil__toggles {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 520px;
        }
        .vil-toggle {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          cursor: pointer;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.12);
          transform: translateY(0);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          transition:
            border-color 0.2s var(--ease-out),
            background 0.2s var(--ease-out),
            box-shadow 0.2s var(--ease-out),
            transform 0.15s var(--ease-out);
        }
        .vil-toggle:hover:not(:has(input:checked)) {
          border-color: var(--stroke-strong);
          background: rgba(255, 255, 255, 0.03);
        }
        .vil-toggle:active:not(:has(input:checked)) {
          transform: translateY(1px);
        }
        .vil-toggle:has(input:focus-visible) {
          outline: 2px solid rgba(123, 143, 255, 0.65);
          outline-offset: 2px;
        }
        .vil-toggle input:focus-visible {
          outline: none;
        }
        .vil-toggle:has(input:checked) {
          transform: translateY(1px);
          border-color: var(--toggle-on-border);
          background: linear-gradient(180deg, rgba(22, 24, 38, 0.85) 0%, rgba(8, 9, 15, 0.92) 100%);
          box-shadow:
            var(--toggle-pressed-inset),
            0 0 0 1px rgba(123, 143, 255, 0.28),
            0 0 18px var(--toggle-on-glow),
            0 0 40px var(--toggle-on-glow-outer);
        }
        .vil-toggle input {
          margin-top: 4px;
          accent-color: var(--accent);
        }
        .vil-toggle strong {
          display: block;
          font-size: 0.88rem;
          color: var(--text);
          margin-bottom: 4px;
        }
        .vil-toggle small {
          display: block;
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .vil__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .vil__toast {
          margin: 0 0 14px;
          font-size: 0.82rem;
          color: var(--accent);
          letter-spacing: 0.04em;
        }
        .memory-pill {
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          padding: 6px 12px;
          border-radius: 99px;
          border: 1px solid rgba(123, 143, 255, 0.35);
        }
        .vil__err {
          padding: 14px 18px;
          margin-bottom: 18px;
          border-color: rgba(255, 120, 120, 0.35);
          color: rgba(255, 200, 200, 0.95);
          font-size: 0.9rem;
        }
        .vil__uploads {
          margin-bottom: 28px;
        }
        .vil__mobile {
          padding: 20px 22px;
          margin-bottom: 28px;
        }
        .vil__phone {
          margin-top: 16px;
          max-width: 280px;
          border-radius: 36px;
          border: 1px solid var(--stroke);
          background: #050506;
          padding: 14px 12px 18px;
          position: relative;
        }
        .vil__phone-notch {
          width: 64px;
          height: 5px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 auto 12px;
        }
        .vil__feed {
          display: flex;
          gap: 8px;
        }
        .vil__tile {
          flex: 1;
          aspect-ratio: 3/4;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #111;
        }
        .vil__tile--ghost {
          opacity: 0.25;
        }
        .vil__tile-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vil__sec-title {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .vil__sec-hint {
          margin: 0 0 16px;
          font-size: 0.82rem;
          color: var(--muted);
        }
        .vil__grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 1100px) {
          .vil__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .vil__grid {
            grid-template-columns: 1fr;
          }
        }
        .vil__results {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .vil__exec,
        .vil__compare,
        .vil__clusters {
          padding: 22px 24px;
        }
        .vil__exec-text {
          margin: 0 0 12px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text);
        }
        .vil__exec-text--muted {
          color: var(--muted);
        }
        .vil__quick-h {
          margin: 16px 0 8px;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .vil__conf-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: var(--muted);
          margin: 0 0 6px;
        }
        .vil__conf-notes {
          margin: 8px 0 0;
          font-size: 0.86rem;
          color: var(--muted);
        }
        .vil__conv-head {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.05rem;
        }
        .vil__conv-score {
          margin: 8px 0 0;
          font-family: var(--font-display);
          font-size: 1.8rem;
          color: var(--accent);
        }
        .vil__conv-score span {
          font-size: 0.9rem;
          color: var(--faint);
          margin-left: 6px;
        }
        .vil__compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        @media (max-width: 720px) {
          .vil__compare-grid {
            grid-template-columns: 1fr;
          }
        }
        .vil__cluster-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 12px;
        }
        @media (max-width: 900px) {
          .vil__cluster-cols {
            grid-template-columns: 1fr;
          }
        }
        .vil__cluster-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vil__cluster-list li {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.22);
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.86rem;
          color: var(--muted);
        }
        .vil__cluster-list strong {
          color: var(--text);
          font-size: 0.88rem;
        }
        .vil__cluster-list em {
          font-style: normal;
          color: var(--accent);
          font-size: 0.82rem;
        }
        .vil__split {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .vil__split {
            grid-template-columns: 1fr;
          }
        }
        .vil__placeholder {
          padding: 22px;
          min-height: 200px;
        }
        .vil__ph-title {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: 0.95rem;
        }
        .vil__ph-body {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.55;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
