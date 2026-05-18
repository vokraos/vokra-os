import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveDepth } from "../../lib/cognitive-depth";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useTemporalStrategy } from "../../lib/temporal-strategy";
import { useLiveState } from "../../lib/live-state";
import { clipDepthText } from "../../lib/cognitive-depth/compression";
import { withHeroSkuLine } from "../../lib/cognitive-depth/sku-demo";
import { mix, empireMicroSignals, empireScaleNumbers } from "../../lib/cognitive-depth/sku-empire";
import { tensionNarrativeVars } from "../../lib/cognitive-depth/market-war-os";
import { SkuEmpireTicker } from "./SkuEmpireTicker";

export type CommandBandVariant = "dashboard" | "mission" | "orchestrator";

type Props = { variant: CommandBandVariant };

function readinessOneLine(line: string, max = 48): string {
  const m = line.match(/(\d{1,3})\s*%/);
  if (m) return `${m[1]}%.`;
  return clipDepthText(line, max);
}

type BandRow = { k: string; v: string };

/** Combat brief — command mode is stripped to a cold founder slice; other modes keep orchestration chrome. */
export function CommandBand({ variant }: Props) {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();
  const commandBrief = mode === "command";
  const { live } = useLiveState();
  const edc = useExecutiveDecisionBoard();
  const orch = useExecutionOrchestrator();
  const temporal = useTemporalStrategy();

  const seed = orch.pulseGeneration;

  const timeWindow = useMemo(() => {
    const a = clipDepthText(temporal.nextRiskWindowRu, 88);
    const b = clipDepthText(edc.timeWindow, 88);
    return a.length > 10 ? a : b;
  }, [temporal.nextRiskWindowRu, edc.timeWindow]);

  const actionLine = useMemo(() => {
    const raw = orch.nextBestActionRu || edc.bestNext;
    return withHeroSkuLine(clipDepthText(raw, 96), seed, 220);
  }, [orch.nextBestActionRu, edc.bestNext, seed]);

  const moveLine = useMemo(() => clipDepthText(edc.bestNext, 160), [edc.bestNext]);

  const microBand = useMemo(() => empireMicroSignals(seed + 11, 2), [seed]);
  const sc = useMemo(() => empireScaleNumbers(seed), [seed]);
  const scaleStrip = useMemo(
    () =>
      t("depth.ops.scaleStrip", {
        cards: String(sc.cards),
        linked: String(sc.linkedSku),
        heroes: String(sc.heroCandidates),
        archive: String(sc.archiveSku),
        visual: String(sc.visualWait),
        blocked: String(sc.blockedPackaging),
        waves: String(sc.launchWaves),
        fronts: String(sc.semanticFronts),
        refreshOps: String(sc.refreshOperations),
      }),
    [t, sc],
  );

  const scaleOneLine = useMemo(
    () =>
      t("depth.cmd.scaleOne", {
        linked: String(sc.linkedSku),
        waves: String(sc.launchWaves),
      }),
    [t, sc],
  );

  const machineLine = useMemo(
    () =>
      t("depth.cmd.machineActive", {
        sku: String(sc.linkedSku),
        waves: String(sc.launchWaves),
        corridors: String(sc.unstableRecoCorridors),
      }),
    [t, sc],
  );

  const tensionLine = useMemo(() => {
    const keys = ["depth.exec.tension.t1", "depth.exec.tension.t2", "depth.exec.tension.t3"] as const;
    const k = keys[mix(seed, 1010) % 3]!;
    return t(k, tensionNarrativeVars(seed, live.strategicTension.index01));
  }, [t, seed, live.strategicTension.index01]);

  const consequenceLine = useMemo(
    () => clipDepthText(edc.expectedImpact || edc.whyNow || "—", 140),
    [edc.expectedImpact, edc.whyNow],
  );

  const lines = useMemo((): BandRow[] => {
    const core: BandRow[] = [
      { k: "depth.band.move", v: moveLine },
      { k: "depth.band.risk", v: clipDepthText(edc.risks[0] ?? "—", 140) },
      { k: "depth.band.forbidden", v: clipDepthText(edc.forbidden[0] ?? "—", 140) },
      { k: "depth.band.bottleneck", v: clipDepthText(edc.bottleneck, 100) },
      { k: "depth.band.readiness", v: readinessOneLine(edc.readinessLine) },
      { k: "depth.band.window", v: timeWindow },
    ];
    if (commandBrief) {
      return [...core, { k: "depth.band.consequence", v: consequenceLine }, { k: "depth.band.action", v: actionLine }];
    }
    return [...core, { k: "depth.band.action", v: actionLine }];
  }, [commandBrief, edc, moveLine, timeWindow, actionLine, consequenceLine]);

  return (
    <>
      <section className={`cmd-band cmd-band--${variant}`} aria-label={t("depth.commandAria")}>
        <p className="cmd-band__scale">{commandBrief ? scaleOneLine : scaleStrip}</p>
        {commandBrief ? <p className="cmd-band__machine">{machineLine}</p> : null}
        {!commandBrief ? <p className="cmd-band__tension">{tensionLine}</p> : null}
        {!commandBrief ? <SkuEmpireTicker signals={microBand} variant={`cmd-${variant}`} /> : null}
        <ul className="cmd-band__ul">
          {lines.map((row) => (
            <li key={row.k} className="cmd-band__li" data-focus-row={row.k === "depth.band.action" ? "action" : undefined}>
              <span className="cmd-band__k">{t(row.k)}</span>
              <span className="cmd-band__v">{row.v}</span>
            </li>
          ))}
        </ul>
      </section>
      <style>{`
        .cmd-band {
          margin: 0 0 10px;
          padding: 8px 10px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.55);
        }
        .cmd-band--mission {
          max-width: min(920px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .cmd-band--orchestrator {
          border-color: rgba(118, 138, 210, 0.35);
          background: rgba(0, 0, 0, 0.45);
        }
        .cmd-band__scale {
          margin: 0 0 6px;
          font-size: 0.58rem;
          line-height: 1.35;
          color: rgba(130, 145, 175, 0.72);
        }
        .cmd-band__machine {
          margin: 0 0 8px;
          font-size: 0.56rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          line-height: 1.35;
          color: rgba(155, 168, 198, 0.68);
        }
        .cmd-band__tension {
          margin: 0 0 6px;
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(165, 155, 185, 0.78);
          font-style: italic;
        }
        .cmd-band__ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cmd-band__li {
          display: grid;
          grid-template-columns: minmax(112px, 128px) 1fr;
          gap: 10px 14px;
          align-items: baseline;
          padding: 2px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .cmd-band__li:last-child {
          border-bottom: none;
        }
        @media (max-width: 520px) {
          .cmd-band__li {
            grid-template-columns: 1fr;
            gap: 2px;
          }
        }
        .cmd-band__k {
          font-size: 0.5rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(140, 155, 185, 0.75);
        }
        .cmd-band__v {
          font-size: 0.74rem;
          line-height: 1.28;
          color: rgba(228, 232, 245, 0.96);
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
