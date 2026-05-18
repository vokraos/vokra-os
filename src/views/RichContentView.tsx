import { useMemo, useState } from "react";
import type { RichContentInput } from "../types";
import { OutputDeck } from "../components/OutputDeck";
import { buildTextModuleSystemPrompt } from "../lib/ai/localeAi";
import { richContentPrompt } from "../lib/ai/prompts";
import { useAiStream } from "../lib/ai/useAiStream";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";

const initial: RichContentInput = {
  printName: "",
  theme: "",
  style: "",
  idea: "",
};

export function RichContentView() {
  const { t } = useI18n();
  const [form, setForm] = useState<RichContentInput>(initial);
  const [saveState, setSaveState] = useState<"idle" | "ok">("idle");

  const langProbe = useMemo(
    () => [form.printName, form.theme, form.style, form.idea].join("\n"),
    [form.printName, form.theme, form.style, form.idea],
  );

  const prompt = useMemo(() => {
    const user = richContentPrompt(form);
    return { system: buildTextModuleSystemPrompt(langProbe), user };
  }, [form, langProbe]);

  const streamOptions = useMemo(
    () => ({
      onComplete: (finalText: string) => {
        if (!finalText.trim()) return;
        recordGeneration({
          module: "rich",
          title: `${t("nav.rich")} · ${form.printName || "SKU"}`,
          content: finalText,
          tags: [form.theme, form.style].filter(Boolean),
        });
        setSaveState("ok");
        window.setTimeout(() => setSaveState("idle"), 2400);
      },
    }),
    [t, form.printName, form.theme, form.style],
  );

  const { text, loading, error, run, stop } = useAiStream(prompt, streamOptions);

  return (
    <div className="view">
      <header className="view__header">
        <p className="eyebrow">{t("rich.eyebrow")}</p>
        <h2 className="view__title">{t("rich.title")}</h2>
        <p className="view__desc">{t("rich.desc")}</p>
        <p className="view__hint">{t("gen.autoMemoryHint")}</p>
      </header>
      <div className="glass-panel form-panel">
        <div className="grid-form grid-form--2">
          <div>
            <label className="field-label" htmlFor="rc-print">
              {t("rich.print")}
            </label>
            <input
              id="rc-print"
              className="input"
              value={form.printName}
              onChange={(e) => setForm({ ...form, printName: e.target.value })}
              placeholder="ARC LINE"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="rc-theme">
              {t("rich.theme")}
            </label>
            <input
              id="rc-theme"
              className="input"
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              placeholder="night infrastructure / transit light"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="rc-style">
              {t("rich.style")}
            </label>
            <input
              id="rc-style"
              className="input"
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              placeholder="luxury streetwear / tech-tailoring"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="rc-idea">
              {t("rich.idea")}
            </label>
            <input
              id="rc-idea"
              className="input"
              value={form.idea}
              onChange={(e) => setForm({ ...form, idea: e.target.value })}
              placeholder="signal carved into fog, slow dolly reveal"
            />
          </div>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="generate-btn"
            onClick={() => {
              setSaveState("idle");
              void run();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-orb" aria-hidden />
                {t("common.streaming")}
              </>
            ) : (
              t("rich.generate")
            )}
          </button>
          {loading && (
            <button type="button" className="ghost-btn" onClick={stop}>
              {t("common.stop")}
            </button>
          )}
          {saveState === "ok" && <span className="memory-pill">{t("memory.autoSaved")}</span>}
        </div>
      </div>
      {loading && (
        <div className="glass-panel loading-banner shimmer" style={{ marginTop: 18, padding: 20 }}>
          <p className="loading-banner__text">{t("gen.loadingHint")}</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {text && (
        <div className="blocks scroll-area">
          <OutputDeck markdown={text} filename="vokra-rich-content.md" />
        </div>
      )}
      <style>{`
        .view__header {
          margin-bottom: 22px;
        }
        .view__title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          margin-bottom: 8px;
        }
        .view__desc {
          max-width: 720px;
          margin: 0;
        }
        .view__hint {
          margin: 10px 0 0;
          font-size: 0.82rem;
          color: var(--faint);
        }
        .form-panel {
          margin-bottom: 18px;
          padding: 24px;
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
        .loading-banner__text {
          margin: 0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: var(--muted);
        }
        .error {
          color: rgba(255, 130, 130, 0.92);
          margin: 12px 0 0;
          font-size: 0.9rem;
        }
        .blocks {
          margin-top: 18px;
        }
      `}</style>
    </div>
  );
}
