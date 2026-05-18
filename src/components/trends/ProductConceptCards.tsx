import type { TrendProductConcept } from "../../lib/trends/types";

type T = (key: string) => string;

export function ProductConceptCards({ concepts, t }: { concepts: TrendProductConcept[]; t: T }) {
  if (!concepts.length) return null;
  return (
    <section className="tr-pc">
      <h3 className="tr-pc__h">{t("trends.conceptsTitle")}</h3>
      <div className="tr-pc__grid">
        {concepts.map((p, i) => (
          <article key={`${p.name}-${i}`} className="tr-pc__card glass-panel">
            <h4 className="tr-pc__name">{p.name}</h4>
            <p className="tr-pc__print">{p.printIdea}</p>
            <div className="tr-pc__row">
              <span className="tr-pc__k">{t("trends.conceptType")}</span>
              <span>{p.productType}</span>
            </div>
            <div className="tr-pc__row">
              <span className="tr-pc__k">{t("trends.conceptCustomer")}</span>
              <span>{p.targetCustomer}</span>
            </div>
            <div className="tr-pc__row">
              <span className="tr-pc__k">{t("trends.conceptPos")}</span>
              <span>{p.marketplacePositioning}</span>
            </div>
            <p className="tr-pc__hook">
              <strong>{t("trends.conceptReels")}</strong> {p.reelsHook}
            </p>
            <div className="tr-pc__meta">
              <span>{p.launchDifficulty}</span>
              <span className="tr-pc__pot">{p.expectedPotential}</span>
            </div>
          </article>
        ))}
      </div>
      <style>{`
        .tr-pc__h {
          margin: 0 0 14px;
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tr-pc__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .tr-pc__card {
          padding: 16px 18px;
          border-radius: 16px;
        }
        .tr-pc__name {
          margin: 0 0 8px;
          font-size: 0.95rem;
        }
        .tr-pc__print {
          margin: 0 0 12px;
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .tr-pc__row {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 8px;
          font-size: 0.78rem;
          margin-bottom: 6px;
          color: var(--text);
        }
        .tr-pc__k {
          color: var(--faint);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .tr-pc__hook {
          margin: 12px 0 8px;
          font-size: 0.78rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .tr-pc__meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.68rem;
          color: var(--faint);
          margin-top: 8px;
        }
        .tr-pc__pot {
          color: rgba(180, 195, 255, 0.95);
        }
      `}</style>
    </section>
  );
}
