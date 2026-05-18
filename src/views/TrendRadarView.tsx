import { useCallback, useMemo, useState } from "react";
import { runOpenAIVision, runOpenAIText, visionUserImage, visionUserText } from "../lib/ai/openai";
import { buildTrendRadarSystemPrompt, buildTrendRadarUserMessage, type TrendRadarUserContext } from "../lib/trends/prompts";
import { parseTrendRadarJson } from "../lib/trends/parseTrendRadar";
import type { TrendRadarResult, TrendStagedImage } from "../lib/trends/types";
import { trendRadarToMarkdown } from "../lib/trends/toMarkdown";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { readFileAsImageData, validateImageFile } from "../lib/visual/imageUtils";
import { getOpenAISettings } from "../lib/settings";
import { getActiveProjectId, recordGeneration } from "../lib/memory";
import { getStoredLocale, translate } from "../lib/i18n/localeStorage";
import { useI18n } from "../lib/i18n/I18nContext";
import { TrendResultPanels } from "../components/trends/TrendResultPanels";

const MAX_IMAGES = 8;

function newImgId() {
  return `tr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function TrendRadarView() {
  const { t } = useI18n();
  const [niche, setNiche] = useState("");
  const [focus, setFocus] = useState<TrendRadarUserContext["marketplaceFocus"]>("wildberries");
  const [seasonEvent, setSeasonEvent] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [priceSegment, setPriceSegment] = useState("");
  const [brandStyle, setBrandStyle] = useState("");
  const [productionConstraints, setProductionConstraints] = useState("");
  const [pastedSocial, setPastedSocial] = useState("");
  const [pastedMp, setPastedMp] = useState("");
  const [pastedCompetitors, setPastedCompetitors] = useState("");
  const [images, setImages] = useState<TrendStagedImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendRadarResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canRun = useMemo(() => niche.trim().length > 0, [niche]);

  const imageSummary = useMemo(() => {
    if (!images.length) return t("trends.noImages");
    return images.map((im, i) => `${i + 1}. ${im.fileName}`).join("\n");
  }, [images, t]);

  const addImages = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setError(null);
    for (const file of list) {
      const v = validateImageFile(file);
      if (v) {
        setError(v);
        continue;
      }
      const r = await readFileAsImageData(file);
      if (!r.ok) {
        setError(r.error);
        continue;
      }
      setImages((prev) => {
        if (prev.length >= MAX_IMAGES) return prev;
        const next: TrendStagedImage = {
          id: newImgId(),
          fileName: file.name,
          mime: r.mime,
          dataUrl: r.dataUrl,
          addedAt: Date.now(),
        };
        return [...prev, next];
      });
    }
  }, []);

  const removeImage = (id: string) => setImages((prev) => prev.filter((x) => x.id !== id));

  async function runScan() {
    setError(null);
    setToast(null);
    const s = getOpenAISettings();
    const loc = getStoredLocale();
    if (!s.apiKey) {
      setError(translate(loc, "errors.noApiKey"));
      return;
    }
    if (!canRun) {
      setError(t("trends.needNiche"));
      return;
    }

    const ctx: TrendRadarUserContext = {
      niche: niche.trim(),
      marketplaceFocus: focus,
      seasonEvent,
      targetAudience,
      priceSegment,
      brandStyle,
      productionConstraints,
      pastedSocialTrends: pastedSocial,
      pastedMarketplaceObservations: pastedMp,
      pastedCompetitorIdeas: pastedCompetitors,
      imageSummary,
    };
    const userText = buildTrendRadarUserMessage(ctx);
    const system = buildTrendRadarSystemPrompt();

    setAnalyzing(true);
    try {
      let raw: string;
      if (images.length > 0) {
        const parts = [visionUserText(userText), ...images.map((im) => visionUserImage(im.dataUrl))];
        raw = await runOpenAIVision({ apiKey: s.apiKey, model: s.model, system, userContent: parts });
      } else {
        raw = await runOpenAIText({ apiKey: s.apiKey, model: s.model, system, user: userText });
      }
      const parsed = parseTrendRadarJson(raw);
      setResult(parsed);

      const previewBits = [parsed.executiveSummary.recommendedMove, parsed.executiveSummary.opportunityLevel]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 280);

      recordGeneration({
        module: "trend_radar",
        title: `${t("nav.trends")} · ${niche.trim().slice(0, 48)}`,
        content: JSON.stringify(parsed),
        mime: "application/json",
        previewText: previewBits || t("trends.cmdTitle"),
        previewImageDataUrl: images[0]?.dataUrl ?? null,
        tags: [focus, ...niche.split(/\s+/).filter(Boolean).slice(0, 8)],
        meta: {
          niche: niche.trim(),
          marketplaceFocus: focus,
          imageCount: images.length,
          scores: parsed.scores,
          trendCardCount: parsed.trendCards.length,
          productConceptCount: parsed.productConcepts.length,
          projectId: getActiveProjectId(),
        },
      });

      setToast(t("memory.autoSaved"));
      window.setTimeout(() => setToast(null), 2600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : translate(loc, "errors.analysisFailed"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function onCopyJson() {
    if (!result) return;
    await copyToClipboard(JSON.stringify(result, null, 2));
    setToast(t("common.copied"));
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="view trv">
      <header className="view__header">
        <p className="eyebrow">{t("trends.eyebrow")}</p>
        <h2 className="view__title">{t("trends.title")}</h2>
        <p className="view__desc">{t("trends.desc")}</p>
        <p className="trv__disclaimer">{t("trends.disclaimer")}</p>
      </header>

      {toast && <p className="trv__toast">{toast}</p>}
      {error && (
        <div className="glass-panel trv__err" role="alert">
          {error}
        </div>
      )}

      <div className="trv__grid">
        <div className="glass-panel trv__form">
          <label className="field-label">{t("trends.niche")}</label>
          <input className="input" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder={t("trends.nichePh")} />

          <p className="trv__seg-label">{t("trends.focus")}</p>
          <div className="seg">
            <button
              type="button"
              className={`seg__btn ${focus === "wildberries" ? "seg__btn--on" : ""}`}
              aria-pressed={focus === "wildberries"}
              onClick={() => setFocus("wildberries")}
            >
              {t("trends.focusWb")}
            </button>
            <button
              type="button"
              className={`seg__btn ${focus === "ozon" ? "seg__btn--on" : ""}`}
              aria-pressed={focus === "ozon"}
              onClick={() => setFocus("ozon")}
            >
              {t("trends.focusOzon")}
            </button>
            <button
              type="button"
              className={`seg__btn ${focus === "social" ? "seg__btn--on" : ""}`}
              aria-pressed={focus === "social"}
              onClick={() => setFocus("social")}
            >
              {t("trends.focusSocial")}
            </button>
            <button
              type="button"
              className={`seg__btn ${focus === "all" ? "seg__btn--on" : ""}`}
              aria-pressed={focus === "all"}
              onClick={() => setFocus("all")}
            >
              {t("trends.focusAll")}
            </button>
          </div>

          <div className="trv__up-block">
            <label className="field-label">{t("trends.uploads")}</label>
            <p className="trv__hint">{t("trends.uploadHint")}</p>
            <label className="trv__file-btn ghost-btn">
              {t("trends.addImage")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(e) => void addImages(e.target.files)}
              />
            </label>
            <ul className="trv__img-list">
              {images.map((im) => (
                <li key={im.id} className="trv__img-row glass-panel">
                  <img src={im.dataUrl} alt="" className="trv__thumb" />
                  <div className="trv__img-meta">
                    <span className="mono">{im.fileName}</span>
                    <button type="button" className="ghost-btn" onClick={() => removeImage(im.id)}>
                      {t("trends.remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <details className="trv__advanced glass-panel">
            <summary>{t("trends.advanced")}</summary>
            <p className="trv__advanced-hint">{t("trends.advancedHint")}</p>
            <div className="grid-form grid-form--2" style={{ marginTop: 8 }}>
              <div className="full-row">
                <label className="field-label">{t("trends.season")}</label>
                <input className="input" value={seasonEvent} onChange={(e) => setSeasonEvent(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{t("trends.audience")}</label>
                <input className="input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{t("trends.priceSeg")}</label>
                <input className="input" value={priceSegment} onChange={(e) => setPriceSegment(e.target.value)} />
              </div>
              <div className="full-row">
                <label className="field-label">{t("trends.brandStyle")}</label>
                <input className="input" value={brandStyle} onChange={(e) => setBrandStyle(e.target.value)} />
              </div>
              <div className="full-row">
                <label className="field-label">{t("trends.constraints")}</label>
                <input className="input" value={productionConstraints} onChange={(e) => setProductionConstraints(e.target.value)} />
              </div>
            </div>
            <label className="field-label">{t("trends.pasteSocial")}</label>
            <textarea className="input trv__ta" rows={3} value={pastedSocial} onChange={(e) => setPastedSocial(e.target.value)} />
            <label className="field-label">{t("trends.pasteMp")}</label>
            <textarea className="input trv__ta" rows={3} value={pastedMp} onChange={(e) => setPastedMp(e.target.value)} />
            <label className="field-label">{t("trends.pasteComp")}</label>
            <textarea className="input trv__ta" rows={2} value={pastedCompetitors} onChange={(e) => setPastedCompetitors(e.target.value)} />
          </details>

          <div className="trv__actions">
            <button type="button" className="generate-btn" disabled={analyzing || !canRun} onClick={() => void runScan()}>
              {analyzing ? (
                <>
                  <span className="loading-orb" aria-hidden />
                  {t("trends.scanning")}
                </>
              ) : (
                t("trends.run")
              )}
            </button>
            {result && (
              <>
                <button type="button" className="ghost-btn" onClick={() => void onCopyJson()}>
                  {t("trends.copyJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => downloadJson("vokra-trend-radar", result)}>
                  {t("trends.exportJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => downloadText("vokra-trend-radar.md", trendRadarToMarkdown(result))}>
                  {t("trends.exportMd")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="trv__out">
          {!result && !analyzing && <p className="trv__placeholder">{t("trends.placeholder")}</p>}
          {analyzing && (
            <div className="glass-panel trv__loading shimmer">
              <p>{t("trends.scanning")}</p>
            </div>
          )}
          {result && <TrendResultPanels r={result} t={t} />}
        </div>
      </div>

      <style>{`
        .trv__disclaimer {
          margin: 12px 0 0;
          max-width: 720px;
          font-size: 0.82rem;
          color: var(--faint);
          line-height: 1.5;
        }
        .trv__toast {
          color: var(--accent);
          font-size: 0.85rem;
          margin-bottom: 12px;
        }
        .trv__err {
          padding: 14px 18px;
          margin-bottom: 16px;
          color: rgba(255, 180, 180, 0.95);
          border-color: rgba(255, 100, 100, 0.35);
        }
        .trv__grid {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.2fr);
          gap: 22px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .trv__grid {
            grid-template-columns: 1fr;
          }
        }
        .trv__form {
          padding: 22px;
        }
        .trv__seg-label {
          margin: 18px 0 8px;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .trv__hint {
          margin: 6px 0 10px;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .trv__file-btn {
          display: inline-block;
          cursor: pointer;
          margin-bottom: 12px;
        }
        .trv__img-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .trv__img-row {
          display: flex;
          gap: 12px;
          padding: 10px 12px;
          align-items: center;
        }
        .trv__thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 10px;
        }
        .trv__img-meta {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          min-width: 0;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .trv__advanced {
          margin-top: 18px;
          padding: 0;
          overflow: hidden;
        }
        .trv__advanced summary {
          cursor: pointer;
          padding: 14px 18px;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(180, 195, 255, 0.9);
          list-style: none;
        }
        .trv__advanced summary::-webkit-details-marker {
          display: none;
        }
        .trv__advanced-hint {
          margin: 0 18px 12px;
          font-size: 0.78rem;
          color: var(--faint);
        }
        .trv__advanced .field-label,
        .trv__advanced .input,
        .trv__advanced .trv__ta,
        .trv__advanced .grid-form {
          margin-left: 18px;
          margin-right: 18px;
        }
        .trv__advanced .trv__ta {
          width: calc(100% - 36px);
          box-sizing: border-box;
          min-height: 64px;
          resize: vertical;
        }
        .trv__advanced .grid-form {
          padding-bottom: 18px;
        }
        .trv__actions {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .trv__out {
          min-height: 120px;
        }
        .trv__placeholder {
          color: var(--faint);
          font-size: 0.9rem;
        }
        .trv__loading {
          padding: 24px;
          margin-bottom: 16px;
        }
        .full-row {
          grid-column: 1 / -1;
        }
      `}</style>
    </div>
  );
}
