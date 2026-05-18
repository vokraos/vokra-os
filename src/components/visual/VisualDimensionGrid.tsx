import type { VisualDimensions } from "../../lib/visual/types";
import { useI18n } from "../../lib/i18n/I18nContext";

const ROW_KEYS: (keyof VisualDimensions)[] = [
  "composition",
  "contrast",
  "thumbnailVisibility",
  "printReadability",
  "luxuryPerception",
  "fashionPositioning",
  "emotionalTone",
  "cinematicQuality",
  "marketplaceCtrPotential",
  "mobileReadability",
  "silhouetteVisibility",
  "lightingQuality",
];

type Props = { dimensions: VisualDimensions };

export function VisualDimensionGrid({ dimensions }: Props) {
  const { t } = useI18n();
  return (
    <div className="vdg">
      <header className="vdg__head">
        <h3 className="vdg__title">{t("visual.dimTitle")}</h3>
        <p className="vdg__hint">{t("visual.dimHint")}</p>
      </header>
      <div className="vdg__grid">
        {ROW_KEYS.map((key) => {
          const d = dimensions[key];
          return (
            <article key={key} className="glass-panel vdg__row">
              <div className="vdg__top">
                <span className="vdg__label">{t(`visual.dim.${key}`)}</span>
                <span className="vdg__score">{d.score}</span>
              </div>
              <div className="vdg__bar">
                <span className="vdg__fill" style={{ width: `${d.score}%` }} />
              </div>
              <p className="vdg__insight">{d.insight}</p>
            </article>
          );
        })}
      </div>
      <style>{`
        .vdg__head {
          margin-bottom: 16px;
        }
        .vdg__title {
          margin: 0 0 6px;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.04em;
        }
        .vdg__hint {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
        }
        .vdg__grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 900px) {
          .vdg__grid {
            grid-template-columns: 1fr;
          }
        }
        .vdg__row {
          padding: 16px 18px;
        }
        .vdg__top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 10px;
        }
        .vdg__label {
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .vdg__score {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--accent);
        }
        .vdg__bar {
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
          margin-bottom: 12px;
        }
        .vdg__fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(123, 143, 255, 0.25), rgba(123, 143, 255, 0.85));
          transition: width 0.7s var(--ease-out);
        }
        .vdg__insight {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
