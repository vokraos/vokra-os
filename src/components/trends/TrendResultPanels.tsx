import type { TrendRadarResult } from "../../lib/trends/types";
import { TrendScoreGrid } from "./TrendScoreGrid";
import { TrendCards } from "./TrendCards";
import { ProductConceptCards } from "./ProductConceptCards";
import { AgentRecommendations } from "./AgentRecommendations";

type T = (key: string) => string;

const MAP_KEYS: { key: keyof TrendRadarResult["opportunityMap"]; labelKey: string }[] = [
  { key: "highDemandLowQualityCompetition", labelKey: "trends.map.demandQuality" },
  { key: "premiumGap", labelKey: "trends.map.premium" },
  { key: "giftGap", labelKey: "trends.map.gift" },
  { key: "seoGap", labelKey: "trends.map.seo" },
  { key: "visualFatigue", labelKey: "trends.map.visual" },
  { key: "underservedAudience", labelKey: "trends.map.audience" },
  { key: "fastLaunchIdeas", labelKey: "trends.map.fast" },
  { key: "longTermBrandIdeas", labelKey: "trends.map.long" },
];

export function TrendResultPanels({ r, t }: { r: TrendRadarResult; t: T }) {
  const ex = r.executiveSummary;
  return (
    <div className="tr-panels">
      <section className="tr-cmd glass-panel">
        <p className="tr-cmd__eyebrow">{t("trends.cmdEyebrow")}</p>
        <h3 className="tr-cmd__title">{t("trends.cmdTitle")}</h3>
        <div className="tr-cmd__grid">
          <div className="tr-cmd__cell">
            <span className="tr-cmd__k">{t("trends.exec.temp")}</span>
            <p className="tr-cmd__v">{ex.marketTemperature}</p>
          </div>
          <div className="tr-cmd__cell">
            <span className="tr-cmd__k">{t("trends.exec.opp")}</span>
            <p className="tr-cmd__v">{ex.opportunityLevel}</p>
          </div>
          <div className="tr-cmd__cell">
            <span className="tr-cmd__k">{t("trends.exec.move")}</span>
            <p className="tr-cmd__v">{ex.recommendedMove}</p>
          </div>
          <div className="tr-cmd__cell">
            <span className="tr-cmd__k">{t("trends.exec.risk")}</span>
            <p className="tr-cmd__v">{ex.riskLevel}</p>
          </div>
          <div className="tr-cmd__cell">
            <span className="tr-cmd__k">{t("trends.exec.time")}</span>
            <p className="tr-cmd__v">{ex.timingUrgency}</p>
          </div>
          <div className="tr-cmd__cell tr-cmd__cell--wide">
            <span className="tr-cmd__k">{t("trends.exec.angle")}</span>
            <p className="tr-cmd__v">{ex.bestStrategicAngle}</p>
          </div>
        </div>
        <style>{`
          .tr-cmd {
            padding: 26px 28px;
            border-radius: 22px;
            background: radial-gradient(100% 80% at 0% 0%, rgba(123, 143, 255, 0.12), transparent),
              linear-gradient(185deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.42));
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .tr-cmd__eyebrow {
            margin: 0 0 8px;
            font-size: 0.62rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--accent);
          }
          .tr-cmd__title {
            margin: 0 0 18px;
            font-family: var(--font-display);
            font-size: 1.2rem;
            letter-spacing: 0.06em;
          }
          .tr-cmd__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          .tr-cmd__cell--wide {
            grid-column: 1 / -1;
          }
          .tr-cmd__k {
            display: block;
            font-size: 0.58rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--faint);
            margin-bottom: 6px;
          }
          .tr-cmd__v {
            margin: 0;
            font-size: 0.88rem;
            line-height: 1.45;
            color: var(--muted);
          }
        `}</style>
      </section>

      <TrendScoreGrid scores={r.scores} t={t} />

      <section className="tr-map glass-panel">
        <h3 className="tr-map__h">{t("trends.mapTitle")}</h3>
        <div className="tr-map__grid">
          {MAP_KEYS.map(({ key, labelKey }) => (
            <div key={key} className="tr-map__cell">
              <span className="tr-map__k">{t(labelKey)}</span>
              <p className="tr-map__v">{r.opportunityMap[key]}</p>
            </div>
          ))}
        </div>
        <style>{`
          .tr-map {
            padding: 20px 22px;
            border-radius: 18px;
          }
          .tr-map__h {
            margin: 0 0 14px;
            font-family: var(--font-display);
            font-size: 0.95rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .tr-map__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 12px 16px;
          }
          .tr-map__k {
            display: block;
            font-size: 0.58rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(180, 195, 255, 0.85);
            margin-bottom: 4px;
          }
          .tr-map__v {
            margin: 0;
            font-size: 0.8rem;
            line-height: 1.45;
            color: var(--muted);
          }
        `}</style>
      </section>

      <TrendCards cards={r.trendCards} t={t} />
      <ProductConceptCards concepts={r.productConcepts} t={t} />

      <section className="tr-plan glass-panel">
        <h3 className="tr-plan__h">{t("trends.planTitle")}</h3>
        <div className="tr-plan__cols">
          <div>
            <span className="tr-plan__k">{t("trends.planFirst")}</span>
            <p>{r.actionPlan.launchFirst}</p>
          </div>
          <div>
            <span className="tr-plan__k">{t("trends.planSecond")}</span>
            <p>{r.actionPlan.testSecond}</p>
          </div>
          <div>
            <span className="tr-plan__k">{t("trends.planAvoid")}</span>
            <p>{r.actionPlan.avoid}</p>
          </div>
          <div>
            <span className="tr-plan__k">{t("trends.planWatch")}</span>
            <p>{r.actionPlan.watch}</p>
          </div>
          <div className="tr-plan__full">
            <span className="tr-plan__k">{t("trends.planSeason")}</span>
            <p>{r.actionPlan.prepareSeasonally}</p>
          </div>
        </div>
        <style>{`
          .tr-plan {
            padding: 20px 22px;
            border-radius: 18px;
          }
          .tr-plan__h {
            margin: 0 0 14px;
            font-family: var(--font-display);
            font-size: 0.95rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .tr-plan__cols {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 14px;
          }
          .tr-plan__full {
            grid-column: 1 / -1;
          }
          .tr-plan__k {
            display: block;
            font-size: 0.58rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--faint);
            margin-bottom: 6px;
          }
          .tr-plan__cols p {
            margin: 0;
            font-size: 0.84rem;
            line-height: 1.5;
            color: var(--muted);
          }
        `}</style>
      </section>

      <AgentRecommendations agents={r.agentRecommendations} t={t} />

      <details className="tr-layers glass-panel">
        <summary>{t("trends.layersTitle")}</summary>
        <div className="tr-layers__grid">
          <LayerBlock title={t("trends.layer.demand")} block={r.layers.marketDemandSignals} />
          <LayerBlock title={t("trends.layer.patterns")} block={r.layers.trendPatterns} />
          <LayerBlock title={t("trends.layer.mp")} block={r.layers.marketplaceOpportunity} />
          <LayerBlock title={t("trends.layer.product")} block={r.layers.productOpportunity} />
          <LayerBlock title={t("trends.layer.creative")} block={r.layers.creativeOpportunity} />
          <LayerBlock title={t("trends.layer.business")} block={r.layers.businessPriority} />
        </div>
        <style>{`
          .tr-layers {
            padding: 0;
            overflow: hidden;
          }
          .tr-layers summary {
            cursor: pointer;
            padding: 16px 20px;
            font-family: var(--font-display);
            font-size: 0.78rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            list-style: none;
          }
          .tr-layers summary::-webkit-details-marker {
            display: none;
          }
          .tr-layers__grid {
            padding: 0 20px 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 12px;
          }
        `}</style>
      </details>

      <style>{`
        .tr-panels {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </div>
  );
}

function LayerBlock({ title, block }: { title: string; block: TrendRadarResult["layers"]["marketDemandSignals"] }) {
  return (
    <article className="tr-ly glass-panel">
      <h4 className="tr-ly__h">{title}</h4>
      {block.summary ? <p className="tr-ly__s">{block.summary}</p> : null}
      {block.bullets.length > 0 && (
        <ul>
          {block.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <style>{`
        .tr-ly {
          padding: 14px 16px;
        }
        .tr-ly__h {
          margin: 0 0 8px;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .tr-ly__s {
          margin: 0 0 8px;
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .tr-ly ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.78rem;
          line-height: 1.4;
        }
      `}</style>
    </article>
  );
}
