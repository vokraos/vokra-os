import type { VisualScores } from "../../lib/visual/types";
import { useI18n } from "../../lib/i18n/I18nContext";

const LABEL_KEYS: { key: keyof VisualScores; msg: string }[] = [
  { key: "ctrPotential", msg: "visual.scoreCtr" },
  { key: "marketplace", msg: "visual.scoreMarket" },
  { key: "cinematic", msg: "visual.scoreCinema" },
  { key: "luxury", msg: "visual.scoreLuxury" },
  { key: "readability", msg: "visual.scoreRead" },
  { key: "emotionalImpact", msg: "visual.scoreEmotion" },
];

type Props = { scores: VisualScores };

export function VisualScoreCards({ scores }: Props) {
  const { t } = useI18n();
  return (
    <div className="vsc-grid">
      {LABEL_KEYS.map(({ key, msg }) => {
        const v = scores[key];
        return (
          <article key={key} className="glass-panel glass-panel--hover vsc-card">
            <div className="vsc-ring-wrap">
              <svg className="vsc-ring" viewBox="0 0 72 72" aria-hidden>
                <circle className="vsc-ring-bg" cx="36" cy="36" r="30" />
                <circle
                  className="vsc-ring-fg"
                  cx="36"
                  cy="36"
                  r="30"
                  style={{
                    strokeDashoffset: 188 - (188 * v) / 100,
                  }}
                />
              </svg>
              <span className="vsc-val">{v}</span>
            </div>
            <p className="vsc-label">{t(msg)}</p>
          </article>
        );
      })}
      <style>{`
        .vsc-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1100px) {
          .vsc-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .vsc-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .vsc-card {
          padding: 18px 14px 16px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .vsc-card::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(123, 143, 255, 0.35), transparent);
          opacity: 0.6;
        }
        .vsc-ring-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          margin: 0 auto 10px;
        }
        .vsc-ring {
          width: 72px;
          height: 72px;
          transform: rotate(-90deg);
        }
        .vsc-ring-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 5;
        }
        .vsc-ring-fg {
          fill: none;
          stroke: rgba(123, 143, 255, 0.92);
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 188;
          transition: stroke-dashoffset 0.8s var(--ease-out);
        }
        .vsc-val {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
        }
        .vsc-label {
          margin: 0;
          font-size: 0.65rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
