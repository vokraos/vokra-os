import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useTemporalStrategy } from "../../lib/temporal-strategy";
import { buildTimePressureRows, deriveInitiativeOperationalTiming } from "../../lib/operational-timing";

export type TimePressureVariant = "mission" | "orchestrator";

type Props = { variant: TimePressureVariant };

export function TimePressurePanel({ variant }: Props) {
  const { t } = useI18n();
  const { synthesis, decision, initiatives } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const orch = useExecutionOrchestrator();
  const primary = useMemo(() => orch.routes.find((r) => r.id === orch.primaryRouteId) ?? orch.routes[0] ?? null, [orch.routes, orch.primaryRouteId]);

  const initiativeInput = useMemo(
    () => ({
      synthesis,
      decision,
      temporal: {
        phase: temporal.phase,
        patienceScore: temporal.patienceScore,
        decay: temporal.decay,
        recommendedTiming: temporal.recommendedTiming,
      },
      operationalDrag: orch.operationalDrag,
    }),
    [synthesis, decision, temporal.phase, temporal.patienceScore, temporal.decay, temporal.recommendedTiming, orch.operationalDrag],
  );

  const initiativeRows = useMemo(
    () =>
      initiatives.slice(0, 4).map((i) => ({
        id: i.id,
        headline: i.headlineRu,
        posture: deriveInitiativeOperationalTiming(i, initiativeInput),
      })),
    [initiatives, initiativeInput],
  );

  const rows = useMemo(
    () =>
      buildTimePressureRows({
        temporal,
        synthesis,
        resourcePressure: orch.resourcePressure,
        operationalDrag: orch.operationalDrag,
        primaryRoute: primary,
      }),
    [temporal, synthesis, orch.resourcePressure, orch.operationalDrag, primary],
  );

  return (
    <>
      <section className={`tpp tpp--${variant}`} aria-label={t("timePressure.aria")}>
        <header className="tpp__head">
          <span className="tpp__title">{t("timePressure.title")}</span>
        </header>
        <ul className="tpp__list">
          {rows.map((row) => (
            <li key={row.id} className="tpp__row" data-tpp-posture={row.posture}>
              <span className="tpp__badge">{t(`timing.posture.${row.posture}`)}</span>
              <p className="tpp__body">{row.bodyRu}</p>
            </li>
          ))}
        </ul>
        {initiativeRows.length ? (
          <div className="tpp__sub">
            <span className="tpp__sub-k">{t("timePressure.initiatives")}</span>
            <ul className="tpp__inits">
              {initiativeRows.map((r) => (
                <li key={r.id} className="tpp__init" data-tpp-posture={r.posture}>
                  <span className="tpp__ib">{t(`timing.posture.${r.posture}`)}</span>
                  <span className="tpp__ih">{r.headline}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <style>{`
        .tpp {
          margin: 0 0 12px;
          padding: 10px 12px 12px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          background: rgba(4, 8, 16, 0.68);
          backdrop-filter: blur(8px);
        }
        .tpp--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .tpp--orchestrator {
          margin-bottom: 16px;
        }
        .tpp__head {
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .tpp__title {
          font-size: 0.5rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(155, 168, 198, 0.82);
        }
        .tpp__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tpp__row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 10px;
          align-items: start;
        }
        .tpp__badge {
          font-size: 0.45rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(175, 188, 215, 0.85);
          white-space: nowrap;
        }
        .tpp__body {
          margin: 0;
          font-size: 0.68rem;
          line-height: 1.35;
          color: rgba(195, 205, 228, 0.88);
        }
        .tpp__sub {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .tpp__sub-k {
          display: block;
          margin-bottom: 6px;
          font-size: 0.45rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(130, 142, 168, 0.65);
        }
        .tpp__inits {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tpp__init {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 6px 8px;
          align-items: baseline;
          font-size: 0.62rem;
          line-height: 1.3;
          color: rgba(175, 188, 215, 0.88);
        }
        .tpp__ib {
          font-size: 0.42rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(150, 165, 195, 0.72);
          white-space: nowrap;
        }
        .tpp__ih {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
