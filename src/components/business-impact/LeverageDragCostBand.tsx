import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useTemporalStrategy } from "../../lib/temporal-strategy";
import {
  buildCostOfDelayRows,
  buildDragLineKeys,
  buildLeverageLineKeys,
  buildWhatIfKeys,
  deriveDominantBusinessImpact,
  type BusinessImpactInput,
} from "../../lib/business-impact";

export type LeverageDragCostVariant = "today" | "mission" | "orchestrator";

type Props = { variant: LeverageDragCostVariant };

export function LeverageDragCostBand({ variant }: Props) {
  const { t } = useI18n();
  const { synthesis, decision, initiatives } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const orch = useExecutionOrchestrator();
  const primary = useMemo(() => orch.routes.find((r) => r.id === orch.primaryRouteId) ?? orch.routes[0] ?? null, [orch.routes, orch.primaryRouteId]);

  const input: BusinessImpactInput = useMemo(
    () => ({
      synthesis,
      decision,
      temporal,
      operationalDrag: orch.operationalDrag,
      executionConfidence: orch.executionConfidence,
      resourcePressure: orch.resourcePressure,
      initiatives,
      primaryRoute: primary,
    }),
    [synthesis, decision, temporal, orch.operationalDrag, orch.executionConfidence, orch.resourcePressure, initiatives, primary],
  );

  const dominant = useMemo(() => deriveDominantBusinessImpact(input), [input]);
  const levKeys = useMemo(() => buildLeverageLineKeys(input), [input]);
  const dragKeys = useMemo(() => buildDragLineKeys(input), [input]);
  const codRows = useMemo(() => buildCostOfDelayRows(input), [input]);
  const whatIfKeys = useMemo(() => buildWhatIfKeys(input), [input]);

  return (
    <>
      <div className={`ldc ldc--${variant}`} aria-label={t("biz.bandAria")}>
        <div className="ldc__macro" data-biz-impact={dominant}>
          <span className="ldc__macro-k">{t("biz.dominant")}</span>
          <span className="ldc__macro-v">{t(`biz.impact.${dominant}`)}</span>
        </div>
        <div className="ldc__ld">
          <div className="ldc__col">
            <span className="ldc__h">{t("biz.leverageTitle")}</span>
            <ul className="ldc__ul">
              {levKeys.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
          </div>
          <div className="ldc__col">
            <span className="ldc__h">{t("biz.dragTitle")}</span>
            <ul className="ldc__ul">
              {dragKeys.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ldc__cod">
          <span className="ldc__h">{t("biz.codTitle")}</span>
          <ul className="ldc__ul ldc__ul--tight">
            {codRows.map((r) => (
              <li key={r.id}>{r.bodyRu}</li>
            ))}
          </ul>
        </div>
        <div className="ldc__wi">
          <span className="ldc__h">{t("biz.whatIfTitle")}</span>
          <ul className="ldc__ul ldc__ul--tight">
            {whatIfKeys.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`
        .ldc {
          margin: 0 0 10px;
          padding: 8px 10px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(2, 5, 12, 0.55);
        }
        .ldc--today {
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ldc--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .ldc--orchestrator {
          margin-bottom: 14px;
        }
        .ldc__macro {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .ldc__macro-k {
          font-size: 0.45rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.65);
        }
        .ldc__macro-v {
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(200, 210, 235, 0.92);
        }
        .ldc__ld {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 14px;
          margin-bottom: 8px;
        }
        @media (max-width: 560px) {
          .ldc__ld {
            grid-template-columns: 1fr;
          }
        }
        .ldc__h {
          display: block;
          margin-bottom: 5px;
          font-size: 0.45rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(140, 155, 185, 0.72);
        }
        .ldc__ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.62rem;
          line-height: 1.3;
          color: rgba(185, 195, 220, 0.88);
        }
        .ldc__ul--tight {
          font-size: 0.6rem;
          color: rgba(175, 188, 212, 0.85);
        }
        .ldc__cod,
        .ldc__wi {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </>
  );
}
