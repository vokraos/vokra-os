import { useMemo, useState } from "react";
import type { ReelsInput } from "../types";
import { OutputDeck } from "../components/OutputDeck";
import { buildTextModuleSystemPrompt } from "../lib/ai/localeAi";
import { reelsPrompt } from "../lib/ai/prompts";
import { useAiStream } from "../lib/ai/useAiStream";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";

const initial: ReelsInput = {
  printName: "",
  theme: "",
  style: "",
  idea: "",
};

export function ReelsView() {
  const { t } = useI18n();
  const [form, setForm] = useState<ReelsInput>(initial);
  const [saveState, setSaveState] = useState<"idle" | "ok">("idle");

  const langProbe = useMemo(
    () => [form.printName, form.theme, form.style, form.idea].join("\n"),
    [form.printName, form.theme, form.style, form.idea],
  );

  const prompt = useMemo(() => {
    const user = reelsPrompt(form);
    return { system: buildTextModuleSystemPrompt(langProbe), user };
  }, [form, langProbe]);

  const streamOptions = useMemo(
    () => ({
      onComplete: (finalText: string) => {
        if (!finalText.trim()) return;
        recordGeneration({
          module: "reels",
          title: `${t("nav.reels")} · ${form.printName || "SKU"}`,
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
        <p className="eyebrow">{t("reels.eyebrow")}</p>
        <h2 className="view__title">{t("reels.title")}</h2>
        <p className="view__desc">{t("reels.desc")}</p>
        <p className="view__hint">{t("gen.autoMemoryHint")}</p>
      </header>
      <div className="reels-grid">
        <div className="glass-panel reels-form">
          <div className="grid-form">
            <div>
              <label className="field-label" htmlFor="rl-print">
                {t("rich.print")}
              </label>
              <input
                id="rl-print"
                className="input"
                value={form.printName}
                onChange={(e) => setForm({ ...form, printName: e.target.value })}
              />
            </div>
            <div className="grid-form grid-form--2">
              <div>
                <label className="field-label" htmlFor="rl-theme">
                  {t("rich.theme")}
                </label>
                <input id="rl-theme" className="input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} />
              </div>
              <div>
                <label className="field-label" htmlFor="rl-style">
                  {t("rich.style")}
                </label>
                <input id="rl-style" className="input" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="rl-idea">
                {t("rich.idea")}
              </label>
              <textarea
                id="rl-idea"
                className="textarea"
                value={form.idea}
                onChange={(e) => setForm({ ...form, idea: e.target.value })}
                rows={3}
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
                t("reels.generate")
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
        {!text && !loading && <p className="placeholder">{t("reels.placeholder")}</p>}
        {error && <p className="error">{error}</p>}
        {text && (
          <div className="reels-output scroll-area">
            <OutputDeck markdown={text} filename="vokra-reels.md" />
          </div>
        )}
      </div>
      <style>{`
        .view__header {
          margin-bottom: 22px;
        }
        .view__title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          margin-bottom: 8px;
        }
        .view__desc {
          max-width: 640px;
          margin: 0;
        }
        .view__hint {
          margin: 10px 0 0;
          font-size: 0.82rem;
          color: var(--faint);
        }
        .reels-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }
        .reels-form {
          padding: 24px;
        }
        .btn-row {
          margin-top: 20px;
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
        .reels-output {
          max-height: min(72vh, 800px);
        }
        .placeholder {
          color: var(--faint);
          font-size: 0.95rem;
          margin: 0;
        }
        .error {
          color: rgba(255, 130, 130, 0.92);
          margin: 12px 0 0;
          font-size: 0.9rem;
        }
        @media (max-width: 960px) {
          .reels-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
