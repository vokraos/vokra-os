import type { TrendCard } from "../../lib/trends/types";

type T = (key: string) => string;

export function TrendCards({ cards, t }: { cards: TrendCard[]; t: T }) {
  if (!cards.length) return null;
  return (
    <section className="tr-cards">
      <h3 className="tr-cards__h">{t("trends.cardsTitle")}</h3>
      <div className="tr-cards__scroll">
        {cards.map((c, i) => (
          <article key={`${c.trendName}-${i}`} className="tr-card glass-panel">
            <header className="tr-card__head">
              <span className="tr-card__score">{c.priorityScore}</span>
              <div>
                <h4 className="tr-card__name">{c.trendName || t("trends.cardUntitled")}</h4>
                <span className="tr-card__type">{c.trendType}</span>
              </div>
            </header>
            <p className="tr-card__why">{c.whyItMatters}</p>
            <div className="tr-card__tags">
              {c.emotionalTrigger ? <span className="tr-chip">{c.emotionalTrigger}</span> : null}
              {c.launchSpeed ? <span className="tr-chip tr-chip--accent">{c.launchSpeed}</span> : null}
            </div>
            <dl className="tr-card__dl">
              <div>
                <dt>{t("trends.cardAudience")}</dt>
                <dd>{c.targetAudience}</dd>
              </div>
              <div>
                <dt>{t("trends.cardMp")}</dt>
                <dd>{c.marketplacePotential}</dd>
              </div>
              <div>
                <dt>{t("trends.cardVisual")}</dt>
                <dd>{c.visualDirection}</dd>
              </div>
            </dl>
            {c.productIdeas.length > 0 && (
              <ul className="tr-card__ideas">
                {c.productIdeas.slice(0, 4).map((x, j) => (
                  <li key={j}>{x}</li>
                ))}
              </ul>
            )}
            <footer className="tr-card__foot">
              <span>{c.seoAngle}</span>
            </footer>
          </article>
        ))}
      </div>
      <style>{`
        .tr-cards__h {
          margin: 0 0 14px;
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tr-cards__scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 8px;
          scroll-snap-type: x mandatory;
        }
        .tr-card {
          flex: 0 0 min(340px, 88vw);
          scroll-snap-align: start;
          padding: 18px 20px;
          border-radius: 18px;
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.4));
        }
        .tr-card__head {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .tr-card__score {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
          color: rgba(180, 195, 255, 0.95);
        }
        .tr-card__name {
          margin: 0;
          font-size: 1rem;
          line-height: 1.25;
        }
        .tr-card__type {
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .tr-card__why {
          margin: 0 0 10px;
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--muted);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tr-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .tr-chip {
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--muted);
        }
        .tr-chip--accent {
          border-color: rgba(123, 143, 255, 0.45);
          color: rgba(200, 210, 255, 0.95);
        }
        .tr-card__dl {
          margin: 0;
          display: grid;
          gap: 8px;
        }
        .tr-card__dl dt {
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .tr-card__dl dd {
          margin: 2px 0 0;
          font-size: 0.78rem;
          color: var(--text);
          line-height: 1.35;
        }
        .tr-card__ideas {
          margin: 10px 0 0;
          padding-left: 1rem;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .tr-card__ideas li {
          margin-bottom: 4px;
        }
        .tr-card__foot {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.72rem;
          color: var(--faint);
          line-height: 1.4;
        }
      `}</style>
    </section>
  );
}
