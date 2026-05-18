import { useMemo, useState } from "react";
import type { RichContentInput } from "../types";
import { OutputDeck } from "../components/OutputDeck";
import { buildTextModuleSystemPrompt } from "../lib/ai/localeAi";
import { campaignPrompt } from "../lib/ai/prompts";
import { useAiStream } from "../lib/ai/useAiStream";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";

const initial: RichContentInput = {
  printName: "",
  theme: "",
  style: "",
  idea: "",
};

export function CampaignView() {
  const { t } = useI18n();
  const [form, setForm] = useState<RichContentInput>(initial);
  const [saveState, setSaveState] = useState<"idle" | "ok">("idle");

  const langProbe = useMemo(
    () => [form.printName, form.theme, form.style, form.idea].join("\n"),
    [form.printName, form.theme, form.style, form.idea],
  );

  const prompt = useMemo(() => {
    const user = campaignPrompt(form);
    return { system: buildTextModuleSystemPrompt(langProbe, { includeStrategicDateContext: true }), user };
  }, [form, langProbe]);

  const streamOptions = useMemo(
    () => ({
      onComplete: (finalText: string) => {
        if (!finalText.trim()) return;
        recordGeneration({
          module: "campaign",
          title: `${t("nav.campaign")} · ${form.printName || "SKU"}`,
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
        <p className="eyebrow">{t("campaign.eyebrow")}</p>
        <h2 className="view__title">{t("campaign.title")}</h2>
        <p className="view__desc">{t("campaign.desc")}</p>
        <p className="view__hint">{t("gen.autoMemoryHint")}</p>
      </header>
      <div className="glass-panel camp-panel">
        <div className="grid-form grid-form--2">
          <div>
            <label className="field-label" htmlFor="cp-print">
              {t("campaign.heroPrint")}
            </label>
            <input id="cp-print" className="input" value={form.printName} onChange={(e) => setForm({ ...form, printName: e.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="cp-theme">
              {t("campaign.narrativeTheme")}
            </label>
            <input id="cp-theme" className="input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="cp-style">
              {t("campaign.visualStyle")}
            </label>
            <input id="cp-style" className="input" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="cp-idea">
              {t("campaign.creativeIdea")}
            </label>
            <input id="cp-idea" className="input" value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} />
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
              t("campaign.generate")
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
      {error && <p className="error">{error}</p>}
      {text && (
        <article className="glass-panel glass-panel--hover brief-card">
          <OutputDeck markdown={text} filename="vokra-campaign.md" />
        </article>
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
          max-width: 640px;
          margin: 0;
        }
        .view__hint {
          margin: 10px 0 0;
          font-size: 0.82rem;
          color: var(--faint);
        }
        .camp-panel {
          padding: 24px;
          margin-bottom: 18px;
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
        .brief-card {
          padding: 18px;
        }
        .error {
          color: rgba(255, 130, 130, 0.92);
          margin: 12px 0 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
