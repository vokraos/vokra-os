import { useCallback, useMemo, useState } from "react";
import { runOpenAIVision, runOpenAIText, visionUserImage, visionUserText } from "../lib/ai/openai";
import { buildCompetitorIntelligenceSystemPrompt, buildCompetitorUserMessage, type CompetitorUserContext } from "../lib/competitors/prompts";
import { parseCompetitorAnalysisJson } from "../lib/competitors/parseCompetitorAnalysis";
import type { CompetitorAnalysisResult, CompetitorStagedImage } from "../lib/competitors/types";
import { competitorAnalysisToMarkdown } from "../lib/competitors/toMarkdown";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { readFileAsImageData, validateImageFile } from "../lib/visual/imageUtils";
import { getOpenAISettings } from "../lib/settings";
import { recordGeneration } from "../lib/memory";
import { getStoredLocale, translate } from "../lib/i18n/localeStorage";
import { useI18n } from "../lib/i18n/I18nContext";
import { CompetitorResultPanels } from "../components/competitors/CompetitorResultPanels";

const MAX_IMAGES = 6;

function newImgId() {
  return `ci_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function CompetitorIntelligenceView() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<"wildberries" | "ozon" | "both">("wildberries");
  const [pastedTitles, setPastedTitles] = useState("");
  const [pastedPrices, setPastedPrices] = useState("");
  const [pastedLinks, setPastedLinks] = useState("");
  const [productIdea, setProductIdea] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [brandStyle, setBrandStyle] = useState("");
  const [constraints, setConstraints] = useState("");
  const [dtfNotes, setDtfNotes] = useState("");
  const [images, setImages] = useState<CompetitorStagedImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const hasAdvancedPaste = useMemo(() => {
    return Boolean(pastedTitles.trim() || pastedPrices.trim() || pastedLinks.trim());
  }, [pastedTitles, pastedPrices, pastedLinks]);

  const canRun = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return images.length > 0 || hasAdvancedPaste;
  }, [query, images.length, hasAdvancedPaste]);

  const imageSummary = useMemo(() => {
    if (!images.length) return "Изображения не прикреплены.";
    return images.map((im, i) => `${i + 1}. [${im.role}] ${im.fileName}`).join("\n");
  }, [images]);

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
        const next: CompetitorStagedImage = {
          id: newImgId(),
          role: "search_results",
          fileName: file.name,
          mime: r.mime,
          dataUrl: r.dataUrl,
          addedAt: Date.now(),
        };
        return [...prev, next];
      });
    }
  }, []);

  const updateRole = (id: string, role: CompetitorStagedImage["role"]) => {
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, role } : x)));
  };

  const removeImage = (id: string) => setImages((prev) => prev.filter((x) => x.id !== id));

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
      setError(t("competitors.needInput"));
      return;
    }

    const ctx: CompetitorUserContext = {
      query: query.trim(),
      marketplace: market,
      pastedTitlesDesc: pastedTitles,
      pastedPricesRatings: pastedPrices,
      pastedLinksNotes: pastedLinks,
      productIdea,
      targetCustomer,
      priceRange,
      brandStyle,
      constraints,
      dtfNotes,
      imageRolesSummary: imageSummary,
    };
    const userText = buildCompetitorUserMessage(ctx);
    const system = buildCompetitorIntelligenceSystemPrompt();

    setAnalyzing(true);
    try {
      let raw: string;
      if (images.length > 0) {
        const parts = [visionUserText(userText), ...images.map((im) => visionUserImage(im.dataUrl))];
        raw = await runOpenAIVision({ apiKey: s.apiKey, model: s.model, system, userContent: parts });
      } else {
        raw = await runOpenAIText({ apiKey: s.apiKey, model: s.model, system, user: userText });
      }
      const parsed = parseCompetitorAnalysisJson(raw);
      setResult(parsed);

      const titleBase = query.trim() || t("competitors.title");
      const previewBits = [
        parsed.executiveStrategic.bestOpeningForVokra,
        parsed.executiveStrategic.opportunityLevel,
        parsed.executiveSummary.recommendedAngle,
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 280);

      recordGeneration({
        module: "competitor_analysis",
        title: `${t("nav.competitors")} · ${titleBase.slice(0, 48)}`,
        content: JSON.stringify(parsed),
        mime: "application/json",
        previewText: previewBits || t("competitors.commandTitle"),
        previewImageDataUrl: images[0]?.dataUrl ?? null,
        tags: [market, ...query.split(/\s+/).filter(Boolean).slice(0, 8)],
        meta: {
          query: query.trim(),
          marketplace: market,
          imageCount: images.length,
          imageRoles: images.map((i) => ({ id: i.id, role: i.role, fileName: i.fileName })),
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
    <div className="view civ">
      <header className="view__header">
        <p className="eyebrow">{t("competitors.eyebrow")}</p>
        <h2 className="view__title">{t("competitors.title")}</h2>
        <p className="view__desc">{t("competitors.desc")}</p>
        <p className="civ__tagline">{t("competitors.tagline")}</p>
        <p className="civ__disclaimer">{t("competitors.disclaimer")}</p>
      </header>

      {toast && <p className="civ__toast">{toast}</p>}
      {error && (
        <div className="glass-panel civ__err" role="alert">
          {error}
        </div>
      )}

      <div className="civ__grid">
        <div className="glass-panel civ__form">
          <label className="field-label">{t("competitors.query")}</label>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("competitors.queryPh")} />

          <p className="civ__seg-label">{t("competitors.market")}</p>
          <div className="seg">
            <button
              type="button"
              className={`seg__btn ${market === "wildberries" ? "seg__btn--on" : ""}`}
              aria-pressed={market === "wildberries"}
              onClick={() => setMarket("wildberries")}
            >
              {t("competitors.marketWb")}
            </button>
            <button
              type="button"
              className={`seg__btn ${market === "ozon" ? "seg__btn--on" : ""}`}
              aria-pressed={market === "ozon"}
              onClick={() => setMarket("ozon")}
            >
              {t("competitors.marketOzon")}
            </button>
            <button
              type="button"
              className={`seg__btn ${market === "both" ? "seg__btn--on" : ""}`}
              aria-pressed={market === "both"}
              onClick={() => setMarket("both")}
            >
              {t("competitors.marketBoth")}
            </button>
          </div>

          <div className="civ__up-block">
            <label className="field-label">{t("competitors.uploads")}</label>
            <p className="civ__hint">{t("competitors.uploadHint")}</p>
            <label className="civ__file-btn ghost-btn">
              {t("competitors.addImage")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(e) => void addImages(e.target.files)}
              />
            </label>
            <ul className="civ__img-list">
              {images.map((im) => (
                <li key={im.id} className="civ__img-row glass-panel">
                  <img src={im.dataUrl} alt="" className="civ__thumb" />
                  <div className="civ__img-meta">
                    <span className="mono">{im.fileName}</span>
                    <select
                      className="input civ__select"
                      value={im.role}
                      onChange={(e) => updateRole(im.id, e.target.value as CompetitorStagedImage["role"])}
                    >
                      <option value="search_results">{t("competitors.roleSearch")}</option>
                      <option value="competitor_cards">{t("competitors.roleCards")}</option>
                      <option value="other">{t("competitors.roleOther")}</option>
                    </select>
                    <button type="button" className="ghost-btn" onClick={() => removeImage(im.id)}>
                      {t("competitors.remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <details className="civ__advanced glass-panel">
            <summary>{t("competitors.advanced")}</summary>
            <p className="civ__advanced-hint">{t("competitors.advancedHint")}</p>
            <label className="field-label">{t("competitors.pasteTitles")}</label>
            <textarea className="input civ__ta" rows={4} value={pastedTitles} onChange={(e) => setPastedTitles(e.target.value)} />
            <label className="field-label">{t("competitors.pastePrices")}</label>
            <textarea className="input civ__ta" rows={3} value={pastedPrices} onChange={(e) => setPastedPrices(e.target.value)} />
            <label className="field-label">{t("competitors.pasteLinks")}</label>
            <textarea className="input civ__ta" rows={2} value={pastedLinks} onChange={(e) => setPastedLinks(e.target.value)} />

            <p className="civ__subh">{t("gen.autoMemoryHint")}</p>
            <div className="grid-form grid-form--2" style={{ marginTop: 12 }}>
              <div>
                <label className="field-label">{t("competitors.ctxProduct")}</label>
                <input className="input" value={productIdea} onChange={(e) => setProductIdea(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{t("competitors.ctxCustomer")}</label>
                <input className="input" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{t("competitors.ctxPrice")}</label>
                <input className="input" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{t("competitors.ctxBrand")}</label>
                <input className="input" value={brandStyle} onChange={(e) => setBrandStyle(e.target.value)} />
              </div>
              <div className="full-row">
                <label className="field-label">{t("competitors.ctxConstraints")}</label>
                <input className="input" value={constraints} onChange={(e) => setConstraints(e.target.value)} />
              </div>
              <div className="full-row">
                <label className="field-label">{t("competitors.ctxDtf")}</label>
                <input className="input" value={dtfNotes} onChange={(e) => setDtfNotes(e.target.value)} />
              </div>
            </div>
          </details>

          <div className="civ__actions">
            <button type="button" className="generate-btn" disabled={analyzing || !canRun} onClick={() => void runAnalysis()}>
              {analyzing ? (
                <>
                  <span className="loading-orb" aria-hidden />
                  {t("competitors.analyzing")}
                </>
              ) : (
                t("competitors.run")
              )}
            </button>
            {result && (
              <>
                <button type="button" className="ghost-btn" onClick={() => void onCopyJson()}>
                  {t("competitors.copyJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => downloadJson("vokra-competitor-intelligence", result)}>
                  {t("competitors.exportJson")}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => downloadText("vokra-competitor-intelligence.md", competitorAnalysisToMarkdown(result))}
                >
                  {t("competitors.exportMd")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="civ__out">
          {!result && !analyzing && <p className="civ__placeholder">{t("competitors.needInput")}</p>}
          {analyzing && (
            <div className="glass-panel civ__loading shimmer">
              <p>{t("competitors.analyzing")}</p>
            </div>
          )}
          {result && <CompetitorResultPanels r={result} t={t} />}
        </div>
      </div>

      <style>{`
        .civ__tagline {
          margin: 10px 0 0;
          max-width: 640px;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .civ__disclaimer {
          margin: 12px 0 0;
          max-width: 720px;
          font-size: 0.82rem;
          color: var(--faint);
          line-height: 1.5;
        }
        .civ__advanced {
          margin-top: 18px;
          padding: 0;
          overflow: hidden;
        }
        .civ__advanced summary {
          cursor: pointer;
          padding: 14px 18px;
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(180, 195, 255, 0.9);
          list-style: none;
        }
        .civ__advanced summary::-webkit-details-marker {
          display: none;
        }
        .civ__advanced-hint {
          margin: 0 18px 12px;
          font-size: 0.78rem;
          color: var(--faint);
          line-height: 1.45;
        }
        .civ__advanced .field-label,
        .civ__advanced .input,
        .civ__advanced .civ__ta,
        .civ__advanced .grid-form {
          margin-left: 18px;
          margin-right: 18px;
        }
        .civ__advanced .civ__ta {
          width: calc(100% - 36px);
          box-sizing: border-box;
        }
        .civ__advanced .grid-form {
          padding-bottom: 18px;
        }
        .civ__advanced .civ__subh {
          margin-left: 18px;
          margin-right: 18px;
        }
        .civ__toast {
          color: var(--accent);
          font-size: 0.85rem;
          margin-bottom: 12px;
        }
        .civ__err {
          padding: 14px 18px;
          margin-bottom: 16px;
          color: rgba(255, 180, 180, 0.95);
          border-color: rgba(255, 100, 100, 0.35);
        }
        .civ__grid {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.2fr);
          gap: 22px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .civ__grid {
            grid-template-columns: 1fr;
          }
        }
        .civ__form {
          padding: 22px;
        }
        .civ__ta {
          min-height: 72px;
          resize: vertical;
        }
        .civ__seg-label {
          margin: 18px 0 8px;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .civ__subh {
          margin: 20px 0 0;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .civ__hint {
          margin: 6px 0 10px;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .civ__file-btn {
          display: inline-block;
          cursor: pointer;
          margin-bottom: 12px;
        }
        .civ__img-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .civ__img-row {
          display: flex;
          gap: 12px;
          padding: 10px 12px;
          align-items: center;
        }
        .civ__thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 10px;
        }
        .civ__img-meta {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          min-width: 0;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .civ__select {
          max-width: 160px;
          padding: 6px 10px;
          font-size: 0.75rem;
        }
        .civ__actions {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .civ__out {
          min-height: 120px;
        }
        .civ__placeholder {
          color: var(--faint);
          font-size: 0.9rem;
        }
        .civ__loading {
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
