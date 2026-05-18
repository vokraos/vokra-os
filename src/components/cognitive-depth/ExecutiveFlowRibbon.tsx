import { useI18n } from "../../lib/i18n/I18nContext";
import { CAUSAL_FLOW_KEYS, causalFlowVars } from "../../lib/cognitive-depth/market-war-os";

export function ExecutiveFlowRibbon({ seed }: { seed: number }) {
  const { t } = useI18n();
  return (
    <div className="exec-flow" aria-label={t("depth.flow.aria")}>
      <div className="exec-flow__inner">
        {CAUSAL_FLOW_KEYS.map((key, i) => (
          <span key={key} className="exec-flow__seg" data-flow-step={String(i)}>
            {i > 0 ? (
              <span className="exec-flow__arr" aria-hidden>
                →
              </span>
            ) : null}
            <span className="exec-flow__txt">{t(key, causalFlowVars(seed, i))}</span>
          </span>
        ))}
      </div>
      <style>{`
        .exec-flow {
          margin: 0 0 12px;
          padding: 8px 10px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          background: linear-gradient(105deg, rgba(8, 10, 18, 0.9) 0%, rgba(4, 5, 10, 0.95) 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }
        .exec-flow__inner {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 6px;
          row-gap: 6px;
        }
        .exec-flow__seg {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          max-width: 100%;
        }
        .exec-flow__arr {
          font-size: 0.62rem;
          color: rgba(120, 135, 170, 0.45);
          user-select: none;
        }
        .exec-flow__txt {
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(165, 175, 200, 0.78);
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}
