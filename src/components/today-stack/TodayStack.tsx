import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useTemporalStrategy } from "../../lib/temporal-strategy";
import { buildTodayTemporalSlice } from "../../lib/operational-timing";
import { LeverageDragCostBand } from "../business-impact/LeverageDragCostBand";

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type TodayStackTone = "dashboard" | "mission";

type Props = { tone: TodayStackTone };

/**
 * Compresses current OS state into four executive lines.
 * Composes existing hooks only — no new engines.
 */
export function TodayStack({ tone }: Props) {
  const { t } = useI18n();
  const edc = useExecutiveDecisionBoard();
  const { synthesis: syn, decision } = useCognitiveOs();
  const orch = useExecutionOrchestrator();
  const temporal = useTemporalStrategy();

  const timeSlice = useMemo(
    () =>
      buildTodayTemporalSlice({
        synthesis: syn,
        decision,
        temporal,
        operationalDrag: orch.operationalDrag,
      }),
    [syn, decision, temporal, orch.operationalDrag],
  );

  const mustMove = useMemo(
    () => clip(edc.actions[0]?.trim() || edc.bestNext, 132),
    [edc.actions, edc.bestNext],
  );

  const safeScale = useMemo(() => {
    const lr = syn.launchReadiness;
    const drag = orch.operationalDrag;
    const press = syn.pressureIndex;
    if (lr >= 56 && drag < 52 && press < 62) {
      return clip(syn.topOpportunityRu || edc.expectedImpact, 132);
    }
    return t("today.safeLimited", {
      lr: String(lr),
      drag: String(drag),
      leak: clip(edc.leakLine, 72),
    });
  }, [edc.expectedImpact, edc.leakLine, orch.operationalDrag, syn.launchReadiness, syn.pressureIndex, syn.topOpportunityRu, t]);

  const hold = useMemo(() => clip(edc.forbidden[0] ?? "", 132), [edc.forbidden]);

  const riskIgnored = useMemo(
    () => clip(edc.risks[0] || edc.risks[1] || edc.leakLine, 132),
    [edc.leakLine, edc.risks],
  );

  return (
    <>
      <section className={`ts ts--${tone}`} aria-label={t("today.aria")}>
        <header className="ts__head">
          <span className="ts__title">{t("today.title")}</span>
        </header>
        <div className="ts__grid ts__grid--time">
          <div className="ts__cell ts__cell--stale">
            <span className="ts__k">{t("today.timeStale")}</span>
            <p className="ts__v ts__v--tight">{timeSlice.staleLine}</p>
          </div>
          <div className="ts__cell ts__cell--window">
            <span className="ts__k">{t("today.timeWindow")}</span>
            <p className="ts__v ts__v--tight">{timeSlice.closingWindowLine}</p>
          </div>
          <div className="ts__cell ts__cell--early">
            <span className="ts__k">{t("today.timeEarly")}</span>
            <p className="ts__v ts__v--tight">{timeSlice.tooEarlyLine}</p>
          </div>
          <div className="ts__cell ts__cell--accel">
            <span className="ts__k">{t("today.timeAccelerate")}</span>
            <p className="ts__v ts__v--tight">{timeSlice.accelerateLine}</p>
          </div>
        </div>
        <LeverageDragCostBand variant="today" />
        <div className="ts__grid">
          <div className="ts__cell ts__cell--move">
            <span className="ts__k">{t("today.mustMove")}</span>
            <p className="ts__v">{mustMove}</p>
          </div>
          <div className="ts__cell ts__cell--safe">
            <span className="ts__k">{t("today.safeScale")}</span>
            <p className="ts__v">{safeScale}</p>
          </div>
          <div className="ts__cell ts__cell--hold">
            <span className="ts__k">{t("today.hold")}</span>
            <p className="ts__v">{hold}</p>
          </div>
          <div className="ts__cell ts__cell--risk">
            <span className="ts__k">{t("today.riskIgnored")}</span>
            <p className="ts__v">{riskIgnored}</p>
          </div>
        </div>
      </section>
      <style>{`
        .ts {
          position: relative;
          z-index: 4;
          margin: 0 0 10px;
          padding: 10px 12px 12px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          background: rgba(3, 6, 12, 0.65);
          backdrop-filter: blur(8px);
        }
        .ts--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .ts--dashboard {
          margin-bottom: 14px;
        }
        .ts__head {
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ts__title {
          font-size: 0.5rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(145, 158, 188, 0.75);
        }
        .ts__grid--time {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ts__v--tight {
          font-size: 0.65rem;
          line-height: 1.28;
        }
        .ts__cell--stale .ts__v {
          color: rgba(230, 200, 170, 0.9);
        }
        .ts__cell--window .ts__v {
          color: rgba(255, 200, 175, 0.9);
        }
        .ts__cell--early .ts__v {
          color: rgba(175, 195, 230, 0.88);
        }
        .ts__cell--accel .ts__v {
          color: rgba(185, 230, 205, 0.9);
        }
        .ts__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 12px;
        }
        @media (max-width: 640px) {
          .ts__grid {
            grid-template-columns: 1fr;
          }
        }
        .ts__k {
          display: block;
          margin-bottom: 4px;
          font-size: 0.48rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.68);
        }
        .ts__v {
          margin: 0;
          font-size: 0.7rem;
          line-height: 1.32;
          color: rgba(208, 216, 236, 0.94);
        }
        .ts__cell--move .ts__v {
          font-weight: 600;
          color: rgba(238, 242, 255, 0.98);
        }
        .ts__cell--safe .ts__v {
          color: rgba(185, 225, 210, 0.92);
        }
        .ts__cell--hold .ts__v {
          color: rgba(255, 200, 190, 0.9);
        }
        .ts__cell--risk .ts__v {
          color: rgba(255, 205, 185, 0.9);
        }
      `}</style>
    </>
  );
}
