import type { CSSProperties } from "react";
import type { NavId } from "../types";
import type { StrategicRankVector } from "../lib/cognitive-os";
import { useCognitiveOs } from "../lib/cognitive-os";

type Props = { active: NavId };

const RANK_ROWS: { key: keyof StrategicRankVector; label: string }[] = [
  { key: "strategic", label: "Стратегия" },
  { key: "marginPotential", label: "Маржа" },
  { key: "speedPotential", label: "Скорость" },
  { key: "seoLeverage", label: "SEO" },
  { key: "brandFit", label: "Бренд" },
  { key: "productionFit", label: "Произв." },
  { key: "saturationRisk", label: "Насыщ." },
  { key: "executionDifficulty", label: "Сложность" },
];

/**
 * Исполнительный слой решений: четыре двигателя + ранжирование + оркестрация запуска.
 * Минимальная архитектурная подача — не «дашборд аналитики».
 */
export function ExecutiveDecisionDeck({ active }: Props) {
  const { decision, pulseGeneration } = useCognitiveOs();
  if (active === "home") return null;

  const d = decision;

  return (
    <section className="cog-deck" aria-labelledby="cog-deck-title" data-cog-deck-pulse={pulseGeneration % 1000}>
      <div className="cog-deck__head">
        <h2 id="cog-deck-title" className="cog-deck__title">
          Двигатель решений
        </h2>
        <span className="cog-deck__badge">EXEC · synthesis</span>
      </div>

      <div className="cog-deck__reason-block">
        <p className="cog-deck__reason">{d.executiveReasoningRu}</p>
        <p className="cog-deck__memory">{d.executiveMemoryRu}</p>
      </div>

      <div className="cog-deck__engines">
        <article className="cog-deck__engine">
          <h3 className="cog-deck__engine-k">Приоритет</h3>
          <p className="cog-deck__engine-lead">{d.priorityHeadlineRu}</p>
          <p className="cog-deck__engine-txt">{d.priorityDensityRu}</p>
          <p className="cog-deck__engine-action">{d.priorityAccelerateRu}</p>
        </article>
        <article className="cog-deck__engine">
          <h3 className="cog-deck__engine-k">Риск</h3>
          <ul className="cog-deck__risk-list">
            <li>
              <span className="cog-deck__risk-n">p насыт.</span>
              <span className="cog-deck__risk-bar" style={{ "--cog-r": d.riskSaturationProb } as CSSProperties} />
              <span className="cog-deck__risk-v">{d.riskSaturationProb}%</span>
            </li>
            <li>
              <span className="cog-deck__risk-n">CTR fatigue</span>
              <span className="cog-deck__risk-bar" style={{ "--cog-r": d.riskCtrFatigue } as CSSProperties} />
              <span className="cog-deck__risk-v">{d.riskCtrFatigue}%</span>
            </li>
            <li>
              <span className="cog-deck__risk-n">Произв.</span>
              <span className="cog-deck__risk-bar" style={{ "--cog-r": d.riskProductionOverload } as CSSProperties} />
              <span className="cog-deck__risk-v">{d.riskProductionOverload}%</span>
            </li>
            <li>
              <span className="cog-deck__risk-n">Дилюция</span>
              <span className="cog-deck__risk-bar" style={{ "--cog-r": d.riskBrandDilution } as CSSProperties} />
              <span className="cog-deck__risk-v">{d.riskBrandDilution}%</span>
            </li>
            <li>
              <span className="cog-deck__risk-n">Цена</span>
              <span className="cog-deck__risk-bar" style={{ "--cog-r": d.riskPricingPressure } as CSSProperties} />
              <span className="cog-deck__risk-v">{d.riskPricingPressure}%</span>
            </li>
          </ul>
        </article>
        <article className="cog-deck__engine">
          <h3 className="cog-deck__engine-k">Ресурс</h3>
          <p className="cog-deck__engine-txt">{d.resourceProductionRu}</p>
          <p className="cog-deck__engine-txt">{d.resourceSkuRu}</p>
          <p className="cog-deck__engine-txt">{d.resourceMarketingRu}</p>
        </article>
        <article className="cog-deck__engine">
          <h3 className="cog-deck__engine-k">Тайминг</h3>
          <p className="cog-deck__engine-txt">{d.timingWindowRu}</p>
          <p className="cog-deck__engine-txt">{d.timingSeasonalRu}</p>
          <p className="cog-deck__engine-txt">{d.timingMomentumRu}</p>
          <p className="cog-deck__engine-txt">{d.timingMarketplaceRu}</p>
        </article>
      </div>

      <div className="cog-deck__rank">
        <div className="cog-deck__rank-head">
          <span className="cog-deck__rank-title">Ранжирование</span>
          <span className="cog-deck__rank-op">{d.opportunityLabelRu}</span>
        </div>
        <div className="cog-deck__rank-grid">
          {RANK_ROWS.map(({ key, label }) => (
            <div key={key} className="cog-deck__rank-cell">
              <span className="cog-deck__rank-l">{label}</span>
              <span className="cog-deck__rank-track" aria-hidden>
                <span className="cog-deck__rank-fill" style={{ width: `${d.rank[key]}%` }} />
              </span>
              <span className="cog-deck__rank-num">{d.rank[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <article className="cog-deck__launch">
        <h3 className="cog-deck__launch-k">Оркестрация запуска</h3>
        <p className="cog-deck__launch-type">{d.launch.archetypeRu}</p>
        <div className="cog-deck__launch-grid">
          <div>
            <span className="cog-deck__launch-subl">Обоснование</span>
            <p className="cog-deck__launch-p">{d.launch.reasoningRu}</p>
          </div>
          <div>
            <span className="cog-deck__launch-subl">Тайминг</span>
            <p className="cog-deck__launch-p">{d.launch.timingRu}</p>
          </div>
          <div>
            <span className="cog-deck__launch-subl">Нагрузка</span>
            <p className="cog-deck__launch-p">{d.launch.resourceLoadRu}</p>
          </div>
          <div>
            <span className="cog-deck__launch-subl">Эффект</span>
            <p className="cog-deck__launch-p">{d.launch.expectedImpactRu}</p>
          </div>
          <div className="cog-deck__launch-span">
            <span className="cog-deck__launch-subl">Риски</span>
            <p className="cog-deck__launch-p">{d.launch.risksRu}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
