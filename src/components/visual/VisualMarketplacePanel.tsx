import type { MarketplaceScreenshotAnalysis } from "../../lib/visual/types";
import { useI18n } from "../../lib/i18n/I18nContext";

type Props = { analysis: MarketplaceScreenshotAnalysis };

function Row({ label, score, insight }: { label: string; score: number; insight: string }) {
  return (
    <div className="vmp-row">
      <div className="vmp-row__head">
        <span>{label}</span>
        <span className="vmp-row__score">{score}</span>
      </div>
      <p className="vmp-row__txt">{insight}</p>
    </div>
  );
}

export function VisualMarketplacePanel({ analysis }: Props) {
  const { t } = useI18n();
  return (
    <div className="vmp glass-panel">
      <header className="vmp__head">
        <p className="vmp__eyebrow">{t("visual.mpEyebrow")}</p>
        <h3 className="vmp__title">{t("visual.mpTitle")}</h3>
        <p className="vmp__desc">{t("visual.mpDesc")}</p>
      </header>
      <div className="vmp__body">
        <Row label="Stopping power" score={analysis.stoppingPower.score} insight={analysis.stoppingPower.insight} />
        <Row label="First-image effectiveness" score={analysis.firstImageEffectiveness.score} insight={analysis.firstImageEffectiveness.insight} />
        <Row label="Mobile feed visibility" score={analysis.mobileFeedVisibility.score} insight={analysis.mobileFeedVisibility.insight} />
        <Row label="Visual clutter" score={analysis.visualClutter.score} insight={analysis.visualClutter.insight} />
        <Row label="Print visibility" score={analysis.printVisibility.score} insight={analysis.printVisibility.insight} />
        <Row label="Emotional impact in feed" score={analysis.emotionalImpactInFeed.score} insight={analysis.emotionalImpactInFeed.insight} />
        {analysis.likelyConversionWeaknesses.length > 0 && (
          <div className="vmp-weak">
            <h4 className="vmp-weak__h">{t("visual.mpWeak")}</h4>
            <ul>
              {analysis.likelyConversionWeaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <style>{`
        .vmp {
          padding: 22px 24px;
        }
        .vmp__head {
          margin-bottom: 20px;
        }
        .vmp__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          margin: 0 0 8px;
        }
        .vmp__title {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.2rem;
        }
        .vmp__desc {
          margin: 0;
          color: var(--muted);
          font-size: 0.9rem;
          max-width: 640px;
        }
        .vmp__body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .vmp-row {
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vmp-row:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }
        .vmp-row__head {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 8px;
        }
        .vmp-row__score {
          font-family: var(--font-display);
          color: var(--text);
          font-size: 1rem;
        }
        .vmp-row__txt {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .vmp-weak {
          margin-top: 8px;
          padding: 16px;
          border-radius: 14px;
          border: 1px dashed rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.25);
        }
        .vmp-weak__h {
          margin: 0 0 10px;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text);
        }
        .vmp-weak ul {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          line-height: 1.55;
        }
      `}</style>
    </div>
  );
}
