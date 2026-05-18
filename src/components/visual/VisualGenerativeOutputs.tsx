import type { VisualGenerativeBundle } from "../../lib/visual/types";
import { useI18n } from "../../lib/i18n/I18nContext";

type Props = { generative: VisualGenerativeBundle };

export function VisualGenerativeOutputs({ generative }: Props) {
  const { t } = useI18n();
  return (
    <div className="vgo">
      <header className="vgo__head">
        <h3 className="vgo__title">{t("visual.genTitle")}</h3>
        <p className="vgo__hint">{t("visual.genHint")}</p>
      </header>
      <div className="vgo__grid">
        <section className="glass-panel vgo__card">
          <h4 className="vgo__h">SEO direction</h4>
          <p className="vgo__p">
            <span className="vgo__k">Tone</span>
            {generative.seoDirection.marketplaceTone}
          </p>
          <p className="vgo__p">
            <span className="vgo__k">Description angle</span>
            {generative.seoDirection.descriptionAngle}
          </p>
          <div className="vgo__chips">
            {generative.seoDirection.titleSeeds.map((t, i) => (
              <span key={i} className="vgo__chip">
                {t}
              </span>
            ))}
          </div>
          <p className="vgo__k" style={{ marginTop: 12 }}>
            Keywords
          </p>
          <p className="vgo__mono">{generative.seoDirection.keywords.join(", ")}</p>
        </section>
        <section className="glass-panel vgo__card">
          <h4 className="vgo__h">Rich content blocks</h4>
          {generative.richContentBlocks.length ? (
            <ol className="vgo__ol">
              {generative.richContentBlocks.map((b, i) => (
                <li key={i}>
                  <strong>{b.blockTitle}</strong>
                  <span className="vgo__angle">{b.angle}</span>
                  <span className="vgo__prompt">{b.heroPromptHint}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="vgo__empty">—</p>
          )}
        </section>
        <section className="glass-panel vgo__card vgo__card--wide">
          <h4 className="vgo__h">Fashion prompts</h4>
          {generative.fashionPrompts.length ? (
            <ul className="vgo__ul">
              {generative.fashionPrompts.map((p, i) => (
                <li key={i}>
                  <pre className="vgo__pre">{p}</pre>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vgo__empty">—</p>
          )}
        </section>
        <section className="glass-panel vgo__card">
          <h4 className="vgo__h">Reels concepts</h4>
          {generative.reelsConcepts.length ? (
            <ul className="vgo__bullets">
              {generative.reelsConcepts.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="vgo__empty">—</p>
          )}
        </section>
        <section className="glass-panel vgo__card">
          <h4 className="vgo__h">Campaign concepts</h4>
          {generative.campaignConcepts.length ? (
            <ul className="vgo__bullets">
              {generative.campaignConcepts.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="vgo__empty">—</p>
          )}
        </section>
        <section className="glass-panel vgo__card vgo__card--wide">
          <h4 className="vgo__h">Thumbnail improvements</h4>
          {generative.thumbnailImprovements.length ? (
            <ul className="vgo__bullets">
              {generative.thumbnailImprovements.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="vgo__empty">—</p>
          )}
        </section>
        <section className="glass-panel vgo__card vgo__card--full">
          <h4 className="vgo__h">Visual storytelling</h4>
          <p className="vgo__story">{generative.visualStorytelling || "—"}</p>
        </section>
      </div>
      <style>{`
        .vgo__head {
          margin-bottom: 18px;
        }
        .vgo__title {
          margin: 0 0 6px;
          font-family: var(--font-display);
          font-size: 1.05rem;
        }
        .vgo__hint {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
          max-width: 720px;
        }
        .vgo__grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .vgo__card {
          padding: 18px 20px;
        }
        .vgo__card--wide {
          grid-column: span 2;
        }
        .vgo__card--full {
          grid-column: 1 / -1;
        }
        @media (max-width: 900px) {
          .vgo__grid {
            grid-template-columns: 1fr;
          }
          .vgo__card--wide {
            grid-column: span 1;
          }
        }
        .vgo__h {
          margin: 0 0 14px;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .vgo__p {
          margin: 0 0 10px;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .vgo__k {
          display: block;
          font-size: 0.65rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 4px;
        }
        .vgo__mono {
          margin: 0;
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .vgo__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .vgo__chip {
          font-size: 0.78rem;
          padding: 6px 12px;
          border-radius: 99px;
          border: 1px solid rgba(123, 143, 255, 0.25);
          color: var(--text);
          background: rgba(123, 143, 255, 0.08);
        }
        .vgo__ol {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vgo__ol li strong {
          display: block;
          color: var(--text);
          margin-bottom: 4px;
        }
        .vgo__angle {
          display: block;
          font-size: 0.86rem;
          margin-bottom: 6px;
        }
        .vgo__prompt {
          display: block;
          font-size: 0.8rem;
          color: var(--faint);
          font-style: italic;
        }
        .vgo__ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vgo__pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--muted);
          background: rgba(0, 0, 0, 0.35);
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--stroke);
        }
        .vgo__bullets {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          line-height: 1.55;
        }
        .vgo__story {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.65;
          color: var(--muted);
        }
        .vgo__empty {
          margin: 0;
          color: var(--faint);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
