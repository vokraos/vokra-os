import type { CompetitorAnalysisResult, CompetitorEngineCard, CompetitorInferredBrief, CompetitorLayerBlock } from "../../lib/competitors/types";
import { COMPETITOR_ENGINE_IDS } from "../../lib/competitors/agents";
import { CompetitorScoreGrid } from "./CompetitorScoreGrid";

type T = (key: string) => string;

const INFERRED_FIELDS: { key: keyof CompetitorInferredBrief; labelKey: string }[] = [
  { key: "targetAudience", labelKey: "competitors.infer.audience" },
  { key: "priceSegment", labelKey: "competitors.infer.price" },
  { key: "positioning", labelKey: "competitors.infer.positioning" },
  { key: "emotionalTone", labelKey: "competitors.infer.tone" },
  { key: "visualCategory", labelKey: "competitors.infer.visualCat" },
  { key: "fashionStyle", labelKey: "competitors.infer.style" },
  { key: "likelyConversionIssues", labelKey: "competitors.infer.conv" },
  { key: "seoStrategy", labelKey: "competitors.infer.seo" },
  { key: "marketplacePositioning", labelKey: "competitors.infer.mp" },
];

const EXEC_FIELDS: { key: keyof CompetitorAnalysisResult["executiveStrategic"]; labelKey: string }[] = [
  { key: "marketSaturation", labelKey: "competitors.cmd.saturation" },
  { key: "opportunityLevel", labelKey: "competitors.cmd.opportunity" },
  { key: "competitionPressure", labelKey: "competitors.cmd.pressure" },
  { key: "dominantMarketArchetype", labelKey: "competitors.cmd.archetype" },
  { key: "bestOpeningForVokra", labelKey: "competitors.cmd.opening" },
];

function LayerCard({ title, block }: { title: string; block: CompetitorLayerBlock }) {
  return (
    <article className="c-layer glass-panel">
      <h4 className="c-layer__h">{title}</h4>
      {block.summary ? <p className="c-layer__sum">{block.summary}</p> : null}
      {block.bullets.length > 0 && (
        <ul className="c-layer__ul">
          {block.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <style>{`
        .c-layer {
          padding: 16px 18px;
        }
        .c-layer__h {
          margin: 0 0 10px;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .c-layer__sum {
          margin: 0 0 10px;
          font-size: 0.86rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .c-layer__ul {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--text);
          font-size: 0.82rem;
          line-height: 1.45;
        }
        .c-layer__ul li {
          margin-bottom: 4px;
        }
      `}</style>
    </article>
  );
}

function EngineCard({ title, card }: { title: string; card: CompetitorEngineCard }) {
  return (
    <article className="c-eng glass-panel">
      <header className="c-eng__head">
        <span className="c-eng__pill">{title}</span>
      </header>
      {card.signals.length > 0 && (
        <div className="c-eng__signals">
          {card.signals.map((s, i) => (
            <span key={i} className="c-eng__sig">
              {s}
            </span>
          ))}
        </div>
      )}
      {card.headline ? <h4 className="c-eng__hl">{card.headline}</h4> : null}
      {card.body ? <p className="c-eng__body">{card.body}</p> : null}
      {card.moves.length > 0 && (
        <ul className="c-eng__moves">
          {card.moves.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      <style>{`
        .c-eng {
          padding: 22px 24px;
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.35));
        }
        .c-eng__head {
          margin-bottom: 14px;
        }
        .c-eng__pill {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(180, 195, 255, 0.95);
        }
        .c-eng__signals {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }
        .c-eng__sig {
          font-size: 0.68rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.35);
          color: var(--muted);
        }
        .c-eng__hl {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.04em;
          line-height: 1.35;
        }
        .c-eng__body {
          margin: 0 0 14px;
          font-size: 0.88rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .c-eng__moves {
          margin: 0;
          padding-left: 1.05rem;
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--text);
        }
        .c-eng__moves li {
          margin-bottom: 6px;
        }
      `}</style>
    </article>
  );
}

export function CompetitorResultPanels({ r, t }: { r: CompetitorAnalysisResult; t: T }) {
  const L = r.layers;
  const inferredChips = INFERRED_FIELDS.map(({ key, labelKey }) => ({
    label: t(labelKey),
    value: r.inferredBrief[key].trim(),
  })).filter((x) => x.value.length > 0 && x.value !== "—");

  return (
    <div className="c-panels">
      <section className="c-command glass-panel">
        <div className="c-command__top">
          <p className="c-command__eyebrow">{t("competitors.commandEyebrow")}</p>
          <h3 className="c-command__title">{t("competitors.commandTitle")}</h3>
        </div>
        <div className="c-command__grid">
          {EXEC_FIELDS.map(({ key, labelKey }) => (
            <div key={key} className="c-command__cell">
              <span className="c-command__k">{t(labelKey)}</span>
              <p className="c-command__v">{r.executiveStrategic[key] || "—"}</p>
            </div>
          ))}
        </div>
        <style>{`
          .c-command {
            padding: 28px 30px;
            border-radius: 22px;
            background: radial-gradient(120% 80% at 10% 0%, rgba(123, 143, 255, 0.14), transparent),
              linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.45));
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .c-command__eyebrow {
            margin: 0 0 8px;
            font-size: 0.65rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--accent);
          }
          .c-command__title {
            margin: 0;
            font-family: var(--font-display);
            font-size: 1.35rem;
            letter-spacing: 0.06em;
          }
          .c-command__grid {
            margin-top: 22px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px 22px;
          }
          .c-command__k {
            display: block;
            font-size: 0.62rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--faint);
            margin-bottom: 8px;
          }
          .c-command__v {
            margin: 0;
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--muted);
          }
        `}</style>
      </section>

      {inferredChips.length > 0 && (
        <section className="c-inf glass-panel">
          <h3 className="c-inf__h">{t("competitors.inferredTitle")}</h3>
          <p className="c-inf__sub">{t("competitors.inferredSub")}</p>
          <div className="c-inf__chips">
            {inferredChips.map((c, i) => (
              <div key={i} className="c-inf__chip">
                <span className="c-inf__lab">{c.label}</span>
                <span className="c-inf__val">{c.value}</span>
              </div>
            ))}
          </div>
          <style>{`
            .c-inf {
              padding: 22px 24px;
              border-radius: 18px;
            }
            .c-inf__h {
              margin: 0 0 6px;
              font-family: var(--font-display);
              font-size: 0.95rem;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .c-inf__sub {
              margin: 0 0 16px;
              font-size: 0.78rem;
              color: var(--faint);
            }
            .c-inf__chips {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .c-inf__chip {
              display: flex;
              flex-direction: column;
              gap: 4px;
              padding: 12px 14px;
              border-radius: 14px;
              border: 1px solid rgba(255, 255, 255, 0.08);
              background: rgba(0, 0, 0, 0.28);
              max-width: min(100%, 320px);
            }
            .c-inf__lab {
              font-size: 0.58rem;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: rgba(180, 195, 255, 0.85);
            }
            .c-inf__val {
              font-size: 0.82rem;
              line-height: 1.45;
              color: var(--muted);
            }
          `}</style>
        </section>
      )}

      <CompetitorScoreGrid scores={r.opportunityScores} t={t} />

      <section className="c-engines">
        <h3 className="c-engines__title">{t("competitors.enginesTitle")}</h3>
        <p className="c-engines__sub">{t("competitors.enginesSub")}</p>
        <div className="c-engines__grid">
          {COMPETITOR_ENGINE_IDS.map((id) => (
            <EngineCard key={id} title={t(`competitors.engine.${id}`)} card={r.engines[id]} />
          ))}
        </div>
        <style>{`
          .c-engines__title {
            margin: 0 0 6px;
            font-family: var(--font-display);
            font-size: 1.05rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .c-engines__sub {
            margin: 0 0 18px;
            font-size: 0.78rem;
            color: var(--faint);
          }
          .c-engines__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
          }
        `}</style>
      </section>

      <details className="c-details glass-panel">
        <summary>{t("competitors.deliverables")}</summary>
        <div className="c-details__inner">
          <article className="c-blue">
            <h3 className="c-sec-h">{t("competitors.blueprint")}</h3>
            <p className="c-blue__line">
              <strong>{t("competitors.blueprintMain")}</strong> — {r.cardBlueprint.mainPhoto}
            </p>
            <p className="c-blue__line">
              <strong>{t("competitors.blueprintSecond")}</strong> — {r.cardBlueprint.secondImage}
            </p>
            <ol className="c-blue__ol">
              {r.cardBlueprint.slides.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <p className="c-blue__notes">{r.cardBlueprint.notes}</p>
          </article>
          <article className="c-seo">
            <h3 className="c-sec-h">{t("competitors.seo")}</h3>
            <p className="c-seo__title">{r.seoReconstruction.bestTitle}</p>
            <p className="c-mini-h">{t("competitors.seoClusters")}</p>
            <ul>
              {r.seoReconstruction.keywordClusters.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <p className="c-mini-h">{t("competitors.seoWb")}</p>
            <pre className="c-pre">{r.seoReconstruction.wbDescription}</pre>
            <p className="c-mini-h">{t("competitors.seoOzon")}</p>
            <pre className="c-pre">{r.seoReconstruction.ozonDescription}</pre>
            <p className="c-mini-h">{t("competitors.seoAntispam")}</p>
            <ul>
              {r.seoReconstruction.antiSpamRecommendations.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </article>
          <article className="c-crea">
            <h3 className="c-sec-h">{t("competitors.creative")}</h3>
            {(
              [
                ["Fashion", "competitors.creFashion", r.creativeReconstruction.fashionPhotoPrompt],
                ["Marketplace main", "competitors.creMarket", r.creativeReconstruction.marketplaceMainPhotoPrompt],
                ["Lifestyle", "competitors.creLife", r.creativeReconstruction.lifestylePrompt],
                ["Rich content", "competitors.creRich", r.creativeReconstruction.richContentPrompts],
                ["Reels", "competitors.creReels", r.creativeReconstruction.reelsPrompt],
                ["Campaign", "competitors.creCampaign", r.creativeReconstruction.campaignPrompt],
              ] as const
            ).map(([label, labelKey, text]) => (
              <div key={label} className="c-crea__block">
                <h4 className="c-crea__h">{t(labelKey)}</h4>
                <pre className="c-pre">{text}</pre>
              </div>
            ))}
          </article>
        </div>
        <style>{`
          .c-details {
            padding: 0;
            overflow: hidden;
          }
          .c-details summary {
            cursor: pointer;
            padding: 18px 22px;
            font-family: var(--font-display);
            font-size: 0.88rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            list-style: none;
          }
          .c-details summary::-webkit-details-marker {
            display: none;
          }
          .c-details__inner {
            padding: 0 22px 22px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
          }
          .c-sec-h {
            margin: 0 0 14px;
            font-family: var(--font-display);
            font-size: 0.95rem;
            letter-spacing: 0.06em;
          }
          .c-blue__line {
            margin: 0 0 10px;
            font-size: 0.86rem;
            color: var(--muted);
          }
          .c-blue__ol {
            margin: 12px 0;
            padding-left: 1.2rem;
            color: var(--text);
            font-size: 0.84rem;
            line-height: 1.45;
          }
          .c-blue__notes {
            margin: 12px 0 0;
            font-size: 0.8rem;
            color: var(--faint);
          }
          .c-seo__title {
            font-family: var(--font-display);
            font-size: 0.95rem;
            margin: 0 0 12px;
          }
          .c-mini-h {
            font-size: 0.62rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--accent);
            margin: 12px 0 6px;
          }
          .c-pre {
            margin: 0;
            white-space: pre-wrap;
            font-size: 0.78rem;
            color: var(--muted);
            line-height: 1.45;
          }
          .c-seo ul {
            margin: 0;
            padding-left: 1rem;
            font-size: 0.82rem;
            color: var(--muted);
          }
          .c-crea__block {
            margin-bottom: 12px;
          }
          .c-crea__h {
            margin: 0 0 6px;
            font-size: 0.65rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--faint);
          }
        `}</style>
      </details>

      <details className="c-details glass-panel">
        <summary>{t("competitors.archive")}</summary>
        <div className="c-archive">
          <section className="c-exec-mini">
            <h3 className="c-sec-h">{t("competitors.exec")}</h3>
            <dl className="c-dl">
              <div>
                <dt>{t("competitors.execMarket")}</dt>
                <dd>{r.executiveSummary.marketDifficulty}</dd>
              </div>
              <div>
                <dt>{t("competitors.execOpportunity")}</dt>
                <dd>{r.executiveSummary.opportunity}</dd>
              </div>
              <div>
                <dt>{t("competitors.execAngle")}</dt>
                <dd>{r.executiveSummary.recommendedAngle}</dd>
              </div>
              <div>
                <dt>{t("competitors.execRisk")}</dt>
                <dd>{r.executiveSummary.riskLevel}</dd>
              </div>
              <div>
                <dt>{t("competitors.execCreative")}</dt>
                <dd>{r.executiveSummary.creativeDirection}</dd>
              </div>
            </dl>
          </section>
          <section className="c-grid2">
            <article className="c-pat">
              <h3 className="c-sec-h">{t("competitors.patterns")}</h3>
              {(
                [
                  ["visual", "competitors.patVisual"],
                  ["seo", "competitors.patSeo"],
                  ["offer", "competitors.patOffer"],
                  ["emotional", "competitors.patEmotional"],
                ] as const
              ).map(([k, labelKey]) => (
                <div key={k} className="c-pat__block">
                  <h4 className="c-pat__h">{t(labelKey)}</h4>
                  <ul>
                    {r.patternMap[k].map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>
            <article className="c-weak">
              <h3 className="c-sec-h">{t("competitors.weak")}</h3>
              <ul className="c-weak__ul">
                {r.weaknessesToExploit.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </article>
          </section>
          <section className="c-strat">
            <h3 className="c-sec-h">{t("competitors.strategy")}</h3>
            <div className="c-strat__grid">
              {(
                [
                  ["positioning", "competitors.strat.positioning", r.vokraWinningStrategy.positioning],
                  ["mainPhoto", "competitors.strat.mainPhoto", r.vokraWinningStrategy.mainPhotoConcept],
                  ["seo", "competitors.strat.seo", r.vokraWinningStrategy.seoAngle],
                  ["rich", "competitors.strat.rich", r.vokraWinningStrategy.richContentStructure],
                  ["offer", "competitors.strat.offer", r.vokraWinningStrategy.offerFraming],
                  ["reels", "competitors.strat.reels", r.vokraWinningStrategy.reelsDirection],
                  ["campaign", "competitors.strat.campaign", r.vokraWinningStrategy.campaignHook],
                ] as const
              ).map(([k, labelKey, v]) => (
                <div key={k} className="c-card">
                  <span className="c-card__k">{t(labelKey)}</span>
                  <p className="c-card__v">{v}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="c-layers">
            <h3 className="c-sec-h">{t("competitors.layers")}</h3>
            <div className="c-layers__grid">
              <LayerCard title={t("competitors.layer.search")} block={L.searchResultStructure} />
              <LayerCard title={t("competitors.layer.visual")} block={L.visualCompetition} />
              <LayerCard title={t("competitors.layer.seo")} block={L.seoCompetition} />
              <LayerCard title={t("competitors.layer.offer")} block={L.offerCompetition} />
              <LayerCard title={t("competitors.layer.psych")} block={L.psychology} />
              <LayerCard title={t("competitors.layer.gap")} block={L.gapAnalysis} />
            </div>
          </section>
        </div>
        <style>{`
          .c-archive {
            padding: 0 22px 22px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .c-exec-mini .c-dl {
            display: grid;
            gap: 10px;
            margin: 0;
          }
          .c-exec-mini dt {
            font-size: 0.62rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--faint);
          }
          .c-exec-mini dd {
            margin: 4px 0 0;
            font-size: 0.84rem;
            color: var(--muted);
          }
          .c-grid2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          @media (max-width: 900px) {
            .c-grid2 {
              grid-template-columns: 1fr;
            }
          }
          .c-pat__block {
            margin-bottom: 12px;
          }
          .c-pat__h {
            margin: 0 0 6px;
            font-size: 0.65rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--accent);
          }
          .c-pat ul {
            margin: 0;
            padding-left: 1rem;
            font-size: 0.8rem;
            color: var(--muted);
          }
          .c-weak__ul {
            margin: 0;
            padding-left: 1rem;
            font-size: 0.82rem;
            line-height: 1.45;
          }
          .c-strat__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
          }
          .c-card {
            border-radius: 12px;
            border: 1px solid var(--stroke);
            padding: 12px 14px;
            background: rgba(0, 0, 0, 0.22);
          }
          .c-card__k {
            font-size: 0.58rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--faint);
          }
          .c-card__v {
            margin: 6px 0 0;
            font-size: 0.82rem;
            line-height: 1.4;
            color: var(--muted);
          }
          .c-layers__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 12px;
          }
        `}</style>
      </details>

      <style>{`
        .c-panels {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </div>
  );
}
