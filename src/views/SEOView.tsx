import { useMemo, useState } from "react";
import type { SeoInput } from "../types";
import { buildTextModuleSystemPrompt } from "../lib/ai/localeAi";
import { seoPrompt } from "../lib/ai/prompts";
import { useAiStream } from "../lib/ai/useAiStream";
import { OutputDeck } from "../components/OutputDeck";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";

const initial: SeoInput = {
  productName: "",
  keywords: "",
  category: "",
  style: "",
};

export function SEOView() {
  const { t } = useI18n();
  const [form, setForm] = useState<SeoInput>(initial);
  const [saveState, setSaveState] = useState<"idle" | "ok">("idle");

  const langProbe = useMemo(
    () => [form.productName, form.category, form.keywords, form.style].join("\n"),
    [form.productName, form.category, form.keywords, form.style],
  );

  const prompt = useMemo(() => {
    const user = seoPrompt(form);
    return { system: buildTextModuleSystemPrompt(langProbe), user };
  }, [form, langProbe]);

  const streamOptions = useMemo(
    () => ({
      onComplete: (finalText: string) => {
        if (!finalText.trim()) return;
        recordGeneration({
          module: "seo",
          title: `${t("nav.seo")} · ${form.productName || "SKU"}`,
          content: finalText,
          tags: form.keywords
            .split(/[,;]+/)
            .map((x) => x.trim())
            .filter(Boolean),
        });
        setSaveState("ok");
        window.setTimeout(() => setSaveState("idle"), 2400);
      },
    }),
    [t, form.productName, form.keywords],
  );

  const { text, loading, error, run, stop } = useAiStream(prompt, streamOptions);

  async function onGenerate() {
    setSaveState("idle");
    await run();
  }

  return (
    <div className="view">
      <header className="view__header">
        <p className="eyebrow">{t("seo.eyebrow")}</p>
        <h2 className="view__title">{t("seo.title")}</h2>
        <p className="view__desc">{t("seo.desc")}</p>
        <p className="view__hint">{t("gen.autoMemoryHint")}</p>
      </header>
      <div className="split">
        <div className="glass-panel form-panel">
          <h3 className="panel-title">{t("common.input")}</h3>
          <div className="grid-form grid-form--2">
            <div>
              <label className="field-label" htmlFor="seo-name">
                {t("seo.productName")}
              </label>
              <input
                id="seo-name"
                className="input"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="NOCTURNAL SIGNAL · Tee"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="seo-cat">
                {t("seo.category")}
              </label>
              <input
                id="seo-cat"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Футболки / Streetwear"
              />
            </div>
            <div className="full-row">
              <label className="field-label" htmlFor="seo-kw">
                {t("seo.keywords")}
              </label>
              <input
                id="seo-kw"
                className="input"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="оверсайз, хлопок, DTF, унисекс"
              />
            </div>
            <div className="full-row">
              <label className="field-label" htmlFor="seo-style">
                {t("seo.style")}
              </label>
              <input
                id="seo-style"
                className="input"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                placeholder="luxury street / cinematic minimal"
              />
            </div>
          </div>
          <div className="btn-row">
            <button type="button" className="generate-btn" onClick={() => void onGenerate()} disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-orb" aria-hidden />
                  {t("common.streaming")}
                </>
              ) : (
                t("seo.generate")
              )}
            </button>
            {loading && (
              <button type="button" className="ghost-btn" onClick={stop}>
                {t("common.stop")}
              </button>
            )}
            {saveState === "ok" && (
              <span className="memory-pill" role="status">
                {t("memory.autoSaved")}
              </span>
            )}
          </div>
        </div>
        <div className="results">
          {!text && !loading && <p className="placeholder">{t("seo.placeholder")}</p>}
          {loading && (
            <div className="glass-panel loading-card shimmer">
              <p className="loading-text">{t("gen.loadingHint")}</p>
            </div>
          )}
          {error && <p className="error">{error}</p>}
          {text && (
            <div className="result-stack scroll-area">
              <OutputDeck markdown={text} filename="vokra-seo.md" />
            </div>
          )}
        </div>
      </div>
      <style>{`
        .view__header {
          margin-bottom: 24px;
        }
        .view__title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          margin-bottom: 8px;
        }
        .view__desc {
          max-width: 620px;
          margin: 0;
        }
        .view__hint {
          margin: 10px 0 0;
          font-size: 0.82rem;
          color: var(--faint);
          max-width: 620px;
        }
        .split {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr);
          gap: 22px;
          align-items: start;
        }
        .form-panel {
          padding: 24px;
        }
        .panel-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          margin: 0 0 18px;
        }
        .full-row {
          grid-column: 1 / -1;
        }
        .btn-row {
          margin-top: 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
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
        .results {
          min-height: 200px;
        }
        .placeholder {
          color: var(--faint);
          font-size: 0.95rem;
          margin: 12px 0;
        }
        .loading-card {
          padding: 28px;
        }
        .loading-text {
          margin: 0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: var(--muted);
        }
        .result-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .error {
          color: rgba(255, 130, 130, 0.92);
          margin: 12px 0 0;
          font-size: 0.9rem;
        }
        @media (max-width: 960px) {
          .split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
