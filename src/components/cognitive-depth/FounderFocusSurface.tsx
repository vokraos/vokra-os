import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useLiveState } from "../../lib/live-state";
import { useTemporalStrategy } from "../../lib/temporal-strategy";
import { clipDepthText } from "../../lib/cognitive-depth/compression";
import { buildFounderFocusBundle } from "../../lib/executive-action-intelligence";

export type FounderFocusVariant = "dashboard" | "mission" | "orchestrator";

export function FounderFocusSurface({ variant }: { variant: FounderFocusVariant }) {
  const { t } = useI18n();
  const { live } = useLiveState();
  const edc = useExecutiveDecisionBoard();
  const orch = useExecutionOrchestrator();
  const temporal = useTemporalStrategy();

  const timeWindow = useMemo(() => {
    const a = clipDepthText(temporal.nextRiskWindowRu, 88);
    const b = clipDepthText(edc.timeWindow, 88);
    return a.length > 10 ? a : b;
  }, [temporal.nextRiskWindowRu, edc.timeWindow]);

  const bundle = useMemo(
    () =>
      buildFounderFocusBundle(orch.pulseGeneration, live.strategicTension.index01, live.pressureWave.amplitude01, edc, timeWindow),
    [orch.pulseGeneration, live.strategicTension.index01, live.pressureWave.amplitude01, edc, timeWindow],
  );

  return (
    <>
      <section
        className={`founder-focus founder-focus--${variant}`}
        aria-label={t("depth.eai9.focus.aria")}
        data-eai-tension={bundle.calmTension.id}
      >
        <header className="founder-focus__head">
          <span className="founder-focus__title">{t("depth.eai9.focus.title")}</span>
          <span className="founder-focus__sub">{t("depth.eai9.focus.sub")}</span>
        </header>
        <p className="founder-focus__spine">{t(bundle.spine.key, bundle.spine.vars)}</p>
        <ul className="founder-focus__ul">
          {bundle.rows.map((row) => (
            <li key={row.rowId} className="founder-focus__li" data-decision-weight={row.weight}>
              <span className="founder-focus__k">{t(row.labelKey)}</span>
              <span className="founder-focus__w">{t(`depth.eai9.weight.${row.weight}`)}</span>
              <span className="founder-focus__v">{t(row.bodyKey, row.bodyVars)}</span>
            </li>
          ))}
        </ul>
        <p className="founder-focus__mem">{t(bundle.memory.key, bundle.memory.vars)}</p>
        <p className="founder-focus__calm">{t(bundle.calmTension.sig.key, bundle.calmTension.sig.vars)}</p>
      </section>
      <style>{`
        .founder-focus {
          margin: 0 0 14px;
          padding: 12px 14px 14px;
          border-radius: 10px 14px 12px 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(168deg, rgba(10, 12, 20, 0.92) 0%, rgba(4, 5, 10, 0.97) 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 10px 40px rgba(0, 0, 0, 0.35);
        }
        .founder-focus--mission {
          max-width: min(920px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .founder-focus--orchestrator {
          border-color: rgba(118, 138, 210, 0.28);
        }
        .founder-focus__head {
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .founder-focus__title {
          display: block;
          font-size: 0.56rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(185, 195, 225, 0.88);
        }
        .founder-focus__sub {
          display: block;
          margin-top: 4px;
          font-size: 0.62rem;
          line-height: 1.35;
          color: rgba(120, 132, 160, 0.62);
        }
        .founder-focus__spine {
          margin: 0 0 10px;
          font-size: 0.58rem;
          line-height: 1.45;
          letter-spacing: 0.04em;
          color: rgba(145, 158, 188, 0.72);
        }
        .founder-focus__ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .founder-focus__li {
          display: grid;
          grid-template-columns: minmax(72px, 88px) minmax(56px, 72px) 1fr;
          gap: 8px 12px;
          align-items: baseline;
          padding: 6px 0 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.045);
        }
        .founder-focus__li:last-of-type {
          border-bottom: none;
        }
        .founder-focus__k {
          font-size: 0.48rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(130, 145, 175, 0.78);
        }
        .founder-focus__w {
          font-size: 0.45rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(110, 125, 155, 0.55);
        }
        .founder-focus__v {
          font-size: 0.74rem;
          line-height: 1.32;
          color: rgba(232, 236, 248, 0.96);
          font-weight: 500;
        }
        .founder-focus__mem,
        .founder-focus__calm {
          margin: 10px 0 0;
          font-size: 0.56rem;
          line-height: 1.4;
          color: rgba(115, 128, 158, 0.58);
        }
        .founder-focus__calm {
          margin-top: 4px;
          font-style: italic;
        }
        @media (max-width: 520px) {
          .founder-focus__li {
            grid-template-columns: 1fr;
            gap: 2px;
          }
          .founder-focus__w {
            grid-row: 2;
          }
        }
      `}</style>
    </>
  );
}
