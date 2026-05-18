import type { CSSProperties } from "react";
import type { TrendScores } from "../../lib/trends/types";

type T = (key: string) => string;

const ROWS: { key: keyof TrendScores; labelKey: string }[] = [
  { key: "demandPotential", labelKey: "trends.score.demand" },
  { key: "trendFreshness", labelKey: "trends.score.freshness" },
  { key: "giftPotential", labelKey: "trends.score.gift" },
  { key: "premiumPotential", labelKey: "trends.score.premium" },
  { key: "seoOpportunity", labelKey: "trends.score.seo" },
  { key: "visualOpportunity", labelKey: "trends.score.visual" },
  { key: "productionEase", labelKey: "trends.score.production" },
  { key: "scalingPotential", labelKey: "trends.score.scaling" },
  { key: "marginPotential", labelKey: "trends.score.margin" },
  { key: "vokraFit", labelKey: "trends.score.fit" },
];

export function TrendScoreGrid({ scores, t }: { scores: TrendScores; t: T }) {
  return (
    <section className="tr-sc glass-panel">
      <div className="tr-sc__head">
        <h3 className="tr-sc__h">{t("trends.scoresTitle")}</h3>
        <span className="tr-sc__sub">{t("trends.scoresSub")}</span>
      </div>
      <div className="tr-sc__grid">
        {ROWS.map(({ key, labelKey }) => {
          const v = scores[key];
          return (
            <div key={key} className="tr-sc__cell">
              <div className="tr-sc__ring" style={{ "--p": `${v}%` } as CSSProperties}>
                <span className="tr-sc__num">{v}</span>
              </div>
              <span className="tr-sc__label">{t(labelKey)}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .tr-sc {
          padding: 24px 26px;
          border-radius: 20px;
        }
        .tr-sc__head {
          margin-bottom: 18px;
        }
        .tr-sc__h {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tr-sc__sub {
          display: block;
          margin-top: 6px;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .tr-sc__grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px 12px;
        }
        @media (max-width: 1100px) {
          .tr-sc__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tr-sc__cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }
        .tr-sc__ring {
          --p: 0%;
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(rgba(123, 143, 255, 0.92) var(--p), rgba(255, 255, 255, 0.06) 0);
          position: relative;
        }
        .tr-sc__ring::after {
          content: "";
          position: absolute;
          inset: 9px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.55));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .tr-sc__num {
          position: relative;
          z-index: 1;
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .tr-sc__label {
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
          max-width: 120px;
          line-height: 1.35;
        }
      `}</style>
    </section>
  );
}
