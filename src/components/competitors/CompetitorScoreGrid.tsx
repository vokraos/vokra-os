import type { CSSProperties } from "react";
import type { CompetitorOpportunityScores } from "../../lib/competitors/types";

type T = (key: string) => string;

const ROWS: { key: keyof CompetitorOpportunityScores; labelKey: string }[] = [
  { key: "competitionIntensity", labelKey: "competitors.score.competition" },
  { key: "visualOpportunity", labelKey: "competitors.score.visual" },
  { key: "seoOpportunity", labelKey: "competitors.score.seo" },
  { key: "trendPotential", labelKey: "competitors.score.trend" },
  { key: "giftPotential", labelKey: "competitors.score.gift" },
  { key: "premiumPotential", labelKey: "competitors.score.premium" },
  { key: "vokraFit", labelKey: "competitors.score.fit" },
  { key: "executionDifficulty", labelKey: "competitors.score.exec" },
];

export function CompetitorScoreGrid({ scores, t }: { scores: CompetitorOpportunityScores; t: T }) {
  return (
    <section className="c-sc glass-panel">
      <div className="c-sc__head">
        <h3 className="c-sc__h">{t("competitors.scores")}</h3>
        <span className="c-sc__sub">{t("competitors.scoresSub")}</span>
      </div>
      <div className="c-sc__grid">
        {ROWS.map(({ key, labelKey }) => {
          const v = scores[key];
          return (
            <div key={key} className="c-sc__cell">
              <div className="c-sc__ring" style={{ "--p": `${v}%` } as CSSProperties}>
                <span className="c-sc__num">{v}</span>
              </div>
              <span className="c-sc__label">{t(labelKey)}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .c-sc {
          padding: 26px 28px;
          border-radius: 20px;
        }
        .c-sc__head {
          margin-bottom: 22px;
        }
        .c-sc__h {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.15rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .c-sc__sub {
          display: block;
          margin-top: 6px;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .c-sc__grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px 16px;
        }
        @media (max-width: 1100px) {
          .c-sc__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .c-sc__cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }
        .c-sc__ring {
          --p: 0%;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(
            rgba(123, 143, 255, 0.92) var(--p),
            rgba(255, 255, 255, 0.06) 0
          );
          position: relative;
        }
        .c-sc__ring::after {
          content: "";
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.55));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .c-sc__num {
          position: relative;
          z-index: 1;
          font-family: var(--font-display);
          font-size: 1.65rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          line-height: 1;
        }
        .c-sc__label {
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
          max-width: 140px;
          line-height: 1.35;
        }
      `}</style>
    </section>
  );
}
