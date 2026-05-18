import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useTemporalStrategy } from "../../lib/temporal-strategy";
import { buildFollowUpContinuity } from "../../lib/operational-timing";

export type FollowUpVariant = "mission" | "orchestrator";

type Props = { variant: FollowUpVariant };

export function FollowUpContinuity({ variant }: Props) {
  const { t } = useI18n();
  const { synthesis, decision } = useCognitiveOs();
  const temporal = useTemporalStrategy();
  const orch = useExecutionOrchestrator();
  const primary = useMemo(() => orch.routes.find((r) => r.id === orch.primaryRouteId) ?? orch.routes[0] ?? null, [orch.routes, orch.primaryRouteId]);

  const items = useMemo(
    () =>
      buildFollowUpContinuity({
        synthesis,
        decision,
        temporal,
        primaryRoute: primary,
        resourcePressure: orch.resourcePressure,
      }),
    [synthesis, decision, temporal, primary, orch.resourcePressure],
  );

  if (!items.length) return null;

  return (
    <>
      <section className={`fuc fuc--${variant}`} aria-label={t("followUp.aria")}>
        <header className="fuc__head">
          <span className="fuc__title">{t("followUp.title")}</span>
        </header>
        <ul className="fuc__list">
          {items.map((it) => (
            <li key={it.id} className="fuc__item" data-fuc-posture={it.posture}>
              <span className="fuc__badge">{t(`timing.posture.${it.posture}`)}</span>
              <p className="fuc__line">{it.lineRu}</p>
            </li>
          ))}
        </ul>
      </section>
      <style>{`
        .fuc {
          margin: 0 0 12px;
          padding: 10px 12px 12px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          background: rgba(3, 6, 12, 0.62);
          backdrop-filter: blur(8px);
        }
        .fuc--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .fuc--orchestrator {
          margin-bottom: 16px;
        }
        .fuc__head {
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .fuc__title {
          font-size: 0.5rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(145, 158, 188, 0.78);
        }
        .fuc__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .fuc__item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 10px;
          align-items: start;
        }
        .fuc__badge {
          font-size: 0.45rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(165, 180, 210, 0.82);
          white-space: nowrap;
        }
        .fuc__line {
          margin: 0;
          font-size: 0.68rem;
          line-height: 1.35;
          color: rgba(200, 210, 232, 0.9);
        }
      `}</style>
    </>
  );
}
