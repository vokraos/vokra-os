import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveDepth } from "../../lib/cognitive-depth";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";
import { useLiveState } from "../../lib/live-state";
import { demoSeoClusterCardCount } from "../../lib/cognitive-depth/sku-demo";
import {
  empireLaunchWaves,
  empireMicroSignals,
  empireScaleNumbers,
} from "../../lib/cognitive-depth/sku-empire";
import {
  executionLanesFull,
  executiveSignalPriorityFromTier,
  laneBlockNarrative,
  launchCadenceState,
  signalTierForIndex,
  skuGravityLines,
  warMarketplaceSig,
  warProductionSigs,
} from "../../lib/cognitive-depth/market-war-os";
import {
  consequenceAtmosphere,
  executionPressureLive,
  operationsOrchestrationFloor,
  skuEcologyMicroLines,
  strategicEnergyFlowLines,
  tradeOffConsequence,
} from "../../lib/cognitive-depth/strategic-organism";
import {
  buildMarketplaceEntitySnapshot,
  entityNetworkAwarenessMicros,
  EXECUTION_GEOMETRY_STEPS,
  heroHierarchySpotlight,
  heroRotationNarrativeMicro,
  liveMarketPressureMicros,
  marketCommandChainMicro,
  operationalWarfareLines,
  primaryTerrainAwarenessMicro,
  recommendationFieldMicros,
  recommendationTopologyTerritoryMicros,
} from "../../lib/entity-core";
import { topLeverageSignal } from "../../lib/executive-action-intelligence";
import { ExecutiveFlowRibbon } from "./ExecutiveFlowRibbon";
import type { RouteState } from "../../lib/execution-orchestrator/types";
import { HeroSkuTriad } from "./HeroSkuTriad";
import { SkuEmpireTicker } from "./SkuEmpireTicker";

type NodeState = "ready" | "active" | "blocked" | "waiting" | "cooling" | "overloaded";

type FlowNode = { id: string; labelKey: string; state: NodeState };

function routeToNodeState(routeState: RouteState, pressure: number): NodeState {
  if (pressure > 82) return "overloaded";
  if (routeState === "blocked" || routeState === "exhausted") return "blocked";
  if (routeState === "waiting" || routeState === "paused") return "waiting";
  if (routeState === "completed") return "cooling";
  if (routeState === "active" || routeState === "scaling" || routeState === "synchronized") return "active";
  if (routeState === "production_ready") return "ready";
  return "waiting";
}

export function OperationsFloor({ variant }: { variant: "dashboard" | "mission" | "orchestrator" }) {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();
  const snap = useExecutionOrchestrator();
  const { live } = useLiveState();
  const edc = useExecutiveDecisionBoard();
  const rp = snap.resourcePressure;
  const primary = snap.routes.find((r) => r.id === snap.primaryRouteId) ?? snap.routes[0];
  const seed = snap.pulseGeneration;
  const sc = useMemo(() => empireScaleNumbers(seed), [seed]);
  const waves = useMemo(() => empireLaunchWaves(seed), [seed]);
  const micro = useMemo(() => empireMicroSignals(seed, 5), [seed]);
  const prodSigs = useMemo(() => warProductionSigs(seed, 2), [seed]);
  const mpSig = useMemo(() => warMarketplaceSig(seed), [seed]);
  const cadence = useMemo(() => launchCadenceState(seed), [seed]);
  const gravity = useMemo(() => skuGravityLines(seed, 2), [seed]);
  const execLanes = useMemo(() => executionLanesFull(seed), [seed]);
  const laneBlock = useMemo(() => laneBlockNarrative(seed), [seed]);
  const tension01 = live.strategicTension.index01;
  const pressure01 = live.pressureWave.amplitude01;
  const tradeSig = useMemo(() => tradeOffConsequence(seed), [seed]);
  const energyLines = useMemo(() => strategicEnergyFlowLines(seed, 2), [seed]);
  const conseqLines = useMemo(() => consequenceAtmosphere(seed, 1), [seed]);
  const ecoLines = useMemo(() => skuEcologyMicroLines(seed, 1), [seed]);
  const pressureLive = useMemo(() => executionPressureLive(seed, 1), [seed]);
  const opsOrch = useMemo(() => operationsOrchestrationFloor(seed, 1), [seed]);

  const entitySnap = useMemo(
    () => buildMarketplaceEntitySnapshot(seed, tension01, pressure01),
    [seed, tension01, pressure01],
  );
  const ops7lines = useMemo(
    () => operationalWarfareLines(seed, tension01, pressure01).slice(0, 2),
    [seed, tension01, pressure01],
  );
  const heroSpot = useMemo(() => heroHierarchySpotlight(entitySnap, seed), [entitySnap, seed]);
  const terrainMicro = useMemo(() => primaryTerrainAwarenessMicro(entitySnap, seed), [entitySnap, seed]);
  const recoMicro = useMemo(() => recommendationFieldMicros(entitySnap, seed, 1)[0], [entitySnap, seed]);
  const chainMicro = useMemo(() => marketCommandChainMicro(seed), [seed]);
  const netMicros = useMemo(() => entityNetworkAwarenessMicros(seed, 2), [seed]);
  const topoMicros = useMemo(() => recommendationTopologyTerritoryMicros(seed, 1), [seed]);
  const pressureMicros = useMemo(() => liveMarketPressureMicros(seed, 1), [seed]);
  const heroRotate = useMemo(() => heroRotationNarrativeMicro(seed), [seed]);
  const leverageWhisper = useMemo(() => topLeverageSignal(seed, tension01), [seed, tension01]);

  const scaleStrip = t("depth.ops.scaleStrip", {
    cards: String(sc.cards),
    linked: String(sc.linkedSku),
    heroes: String(sc.heroCandidates),
    archive: String(sc.archiveSku),
    visual: String(sc.visualWait),
    blocked: String(sc.blockedPackaging),
    waves: String(sc.launchWaves),
    fronts: String(sc.semanticFronts),
    refreshOps: String(sc.refreshOperations),
  });

  const flowNodes = useMemo<FlowNode[]>(() => {
    const p = primary?.routeState ?? "waiting";
    const pr = (rp.packagingBottleneck + rp.dtfQueue) / 2;
    return [
      { id: "hero", labelKey: "depth.ops.node.hero", state: routeToNodeState(p, pr) },
      { id: "amplification", labelKey: "depth.ops.node.amplification", state: routeToNodeState(p, rp.seoBandwidth) },
      { id: "visual", labelKey: "depth.ops.node.visual", state: routeToNodeState(p, rp.contentLoad) },
      { id: "rich", labelKey: "depth.ops.node.rich", state: routeToNodeState(p, rp.skuComplexity) },
      { id: "ads", labelKey: "depth.ops.node.ads", state: routeToNodeState(p, rp.campaignPressure) },
      { id: "fbo", labelKey: "depth.ops.node.fbo", state: routeToNodeState(p, 100 - rp.fboReadiness) },
      { id: "regional", labelKey: "depth.ops.node.regional", state: routeToNodeState(p, rp.campaignPressure + 10) },
    ];
  }, [primary, rp]);

  const pressureRows = useMemo(
    () => [
      { k: "depth.ops.pressure.dtf", v: rp.dtfQueue },
      { k: "depth.ops.pressure.packaging", v: rp.packagingBottleneck },
      { k: "depth.ops.pressure.seo", v: rp.seoBandwidth },
      { k: "depth.ops.pressure.visual", v: rp.contentLoad },
      { k: "depth.ops.pressure.fbo", v: rp.fboReadiness },
      { k: "depth.ops.pressure.campaign", v: rp.campaignPressure },
    ],
    [rp],
  );

  const blockedTop = snap.blockers.slice(0, 2);
  const readyHint = primary?.routeState === "production_ready" || primary?.routeState === "active";
  const risky = edc.risks[0] ?? "";
  const refreshLine = t("depth.ops.queue.refreshDemo", { n: String(demoSeoClusterCardCount(seed, 42)) });

  if (mode === "command") {
    return null;
  }

  return (
    <>
      <div className={`ops-floor ops-floor--${variant}`} aria-label={t("depth.ops.aria")}>
        <header className="ops-floor__head">
          <span className="ops-floor__title">{t("depth.ops.title")}</span>
          <span className="ops-floor__sub">{t("depth.ops.sub")}</span>
        </header>
        {mode === "operations" || mode === "analysis" ? (
          <p className="ops-floor__eai-leverage">
            {t("depth.ops.leverageWhisper", { line: t(leverageWhisper.key, leverageWhisper.vars) })}
          </p>
        ) : null}

        <p className="ops-floor__scale">{scaleStrip}</p>
        <SkuEmpireTicker signals={micro} variant={variant} />
        <HeroSkuTriad seed={seed} variant={variant} />

        <ExecutiveFlowRibbon seed={seed} />

        <section className="ops-floor__entity7" aria-label={t("depth.ops7.aria")}>
          <h3 className="ops-floor__h">{t("depth.ops7.title")}</h3>
          <p className="ops-floor__geom-sum">{t("depth.geom.summary")}</p>
          <ul className="ops-floor__geom-micro" aria-label={t("depth.geom.summary")}>
            {EXECUTION_GEOMETRY_STEPS.map((step, gi) => (
              <li key={`geom-${gi}`} className="ops-floor__geom-li">
                <span className="ops-floor__geom-node">{t(step.nodeKey)}</span>
                { "edgeKey" in step && step.edgeKey ? (
                  <span className="ops-floor__geom-edge">
                    {" "}
                    → {t(step.edgeKey)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="ops-floor__terrain7">{t(terrainMicro.key, terrainMicro.vars)}</p>
          {recoMicro ? (
            <p className="ops-floor__reco7">{t(recoMicro.key, recoMicro.vars)}</p>
          ) : null}
          {heroSpot ? <p className="ops-floor__hero7">{t(heroSpot.key, heroSpot.vars)}</p> : null}
          {ops7lines.map((line, li) => (
            <p key={`ops7-${line.key}-${li}`} className="ops-floor__ops7">
              {t(line.key, line.vars)}
            </p>
          ))}
        </section>

        <section className="ops-floor__p8" aria-label={t("depth.p8.aria")}>
          <h3 className="ops-floor__h">{t("depth.p8.title")}</h3>
          <p className="ops-floor__p8-chain">{t(chainMicro.key, chainMicro.vars)}</p>
          {netMicros.map((sig, ni) => (
            <p key={`p8-net-${sig.key}-${ni}`} className="ops-floor__p8-line">
              {t(sig.key, sig.vars)}
            </p>
          ))}
          {topoMicros.map((sig, ti) => (
            <p key={`p8-topo-${sig.key}-${ti}`} className="ops-floor__p8-line">
              {t(sig.key, sig.vars)}
            </p>
          ))}
          {pressureMicros.map((sig, pi) => (
            <p key={`p8-pr-${sig.key}-${pi}`} className="ops-floor__p8-line">
              {t(sig.key, sig.vars)}
            </p>
          ))}
          <p className="ops-floor__p8-line">{t(heroRotate.key, heroRotate.vars)}</p>
        </section>

        <p className="ops-floor__trade">{t(tradeSig.key, tradeSig.vars)}</p>
        {energyLines.map((sig, ei) => (
          <p key={`${sig.key}-en-${ei}`} className="ops-floor__energy">
            {t(sig.key, sig.vars)}
          </p>
        ))}
        {conseqLines.map((sig, ci) => (
          <p key={`${sig.key}-cq-${ci}`} className="ops-floor__conseq">
            {t(sig.key, sig.vars)}
          </p>
        ))}
        {ecoLines.map((sig, ei) => (
          <p key={`${sig.key}-${ei}`} className="ops-floor__eco">
            {t(sig.key, sig.vars)}
          </p>
        ))}
        {pressureLive.map((sig, pi) => (
          <p key={`${sig.key}-pl-${pi}`} className="ops-floor__pressure-live">
            {t(sig.key, sig.vars)}
          </p>
        ))}
        {opsOrch.map((sig, oi) => (
          <p key={`${sig.key}-o5-${oi}`} className="ops-floor__orch">
            {t(sig.key, sig.vars)}
          </p>
        ))}

        <section className="ops-floor__lanes" aria-label={t("depth.lane.execAria")}>
          <h3 className="ops-floor__h">{t("depth.lane.execTitle")}</h3>
          <div className="ops-floor__lane-grid">
            {execLanes.map((lane, li) => (
              <span
                key={lane.id}
                className="ops-floor__xlane"
                data-exec-lane={lane.id}
                data-exec-pulse={lane.phase}
                data-sig-tier={signalTierForIndex(tension01, seed, li + 2)}
                data-sig-priority={executiveSignalPriorityFromTier(signalTierForIndex(tension01, seed, li + 2))}
              >
                {t("depth.lane.meta8", {
                  name: t(`depth.lane.id.${lane.id}`),
                  p: String(lane.pressure),
                  s: String(lane.stability),
                  r: String(lane.risk),
                  cad: String(lane.cadenceSec),
                  dr: String(lane.drag),
                  th: String(lane.throughput),
                  cg: String(lane.congestion),
                })}
              </span>
            ))}
          </div>
          <p className="ops-floor__lane-block">
            {t(laneBlock.key, {
              blocked: t(`depth.lane.id.${laneBlock.vars.blocked}`),
              blocker: t(`depth.lane.id.${laneBlock.vars.blocker}`),
            })}
          </p>
        </section>

        <section className="ops-floor__cadence" aria-label={t("depth.cadence.aria")}>
          <h3 className="ops-floor__h">{t("depth.cadence.title")}</h3>
          <div className="ops-floor__cadence-lanes">
            {cadence.map((c) => (
              <span key={c.lane} className="ops-floor__lane" data-exec-pulse={c.phase}>
                {t(`depth.cadence.lane.${c.lane}`)} · {t(`depth.pulse.${c.phase}`)}
              </span>
            ))}
          </div>
        </section>

        <div className="ops-floor__gravity">
          {gravity.map((g, gi) => (
            <p key={`${g.key}-${gi}`} className="ops-floor__grav-line">
              {t(g.key, g.vars)}
            </p>
          ))}
        </div>

        <div className="ops-floor__waves" aria-label={t("depth.ops.wavesAria")}>
          {waves.map((w) => (
            <span key={w.wave} className="ops-floor__wave">
              {t("depth.ops.wave.label", { n: String(w.wave) })} · {t(`depth.ops.wave.${w.state}`)}
            </span>
          ))}
        </div>

        {prodSigs.map((s, pi) => (
          <p key={`${s.key}-${pi}`} className="ops-floor__prod">
            {t(s.key, s.vars)}
          </p>
        ))}
        <p className="ops-floor__mp">{t(mpSig.key, mpSig.vars)}</p>

        <section className="ops-floor__sec" aria-label={t("depth.ops.flowAria")}>
          <h3 className="ops-floor__h">{t("depth.ops.flowTitle")}</h3>
          <div className="ops-floor__flow">
            {flowNodes.map((n, i) => (
              <div key={n.id} className="ops-floor__flow-node">
                {i > 0 ? <span className="ops-floor__arrow" aria-hidden /> : null}
                <div className={`ops-floor__pill ops-floor__pill--${n.state}`}>
                  <span className="ops-floor__pill-l">{t(n.labelKey)}</span>
                  <span className="ops-floor__pill-s">{t(`depth.ops.state.${n.state}`)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-floor__sec" aria-label={t("depth.ops.routingAria")}>
          <h3 className="ops-floor__h">{t("depth.ops.routingTitle")}</h3>
          <div className="ops-floor__grid">
            {pressureRows.map((row) => (
              <div key={row.k} className="ops-floor__cell">
                <span className="ops-floor__cell-k">{t(row.k)}</span>
                <div className="ops-floor__meter" aria-hidden>
                  <span className="ops-floor__meter-fill" style={{ width: `${Math.min(100, row.v)}%` }} />
                </div>
                <span className="ops-floor__cell-v">{row.v}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-floor__sec" aria-label={t("depth.ops.queueAria")}>
          <h3 className="ops-floor__h">{t("depth.ops.queueTitle")}</h3>
          <ul className="ops-floor__queue">
            <li>
              <span className="ops-floor__qk">{t("depth.ops.queue.blocked")}</span>
              {blockedTop.length ? (
                <span className="ops-floor__qv">{blockedTop.map((b) => b.labelRu).join(" · ")}</span>
              ) : (
                <span className="ops-floor__qv">{t("depth.ops.queue.none")}</span>
              )}
            </li>
            <li>
              <span className="ops-floor__qk">{t("depth.ops.queue.ready")}</span>
              <span className="ops-floor__qv">
                {readyHint ? t("depth.ops.queue.readyLine") : t("depth.ops.queue.readyWait")}
              </span>
            </li>
            <li>
              <span className="ops-floor__qk">{t("depth.ops.queue.risky")}</span>
              <span className="ops-floor__qv">{risky || "—"}</span>
            </li>
            <li>
              <span className="ops-floor__qk">{t("depth.ops.queue.refresh")}</span>
              <span className="ops-floor__qv">{refreshLine}</span>
            </li>
          </ul>
        </section>
      </div>
      <style>{`
        .ops-floor {
          margin: 0 0 16px;
          padding: 12px 14px 14px;
          border-radius: 18px 12px 20px 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: radial-gradient(100% 60% at 80% 0%, rgba(40, 55, 95, 0.2) 0%, transparent 50%),
            linear-gradient(175deg, rgba(8, 10, 18, 0.88) 0%, rgba(3, 4, 10, 0.94) 100%);
          box-shadow: inset 0 0 36px rgba(0, 0, 0, 0.35), 0 8px 32px rgba(0, 0, 0, 0.35);
        }
        .ops-floor--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .ops-floor__head {
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .ops-floor__title {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(175, 188, 220, 0.88);
        }
        .ops-floor__sub {
          display: block;
          margin-top: 4px;
          font-size: 0.72rem;
          color: rgba(140, 152, 178, 0.65);
        }
        .ops-floor__eai-leverage {
          margin: 0 0 8px;
          font-size: 0.55rem;
          line-height: 1.4;
          letter-spacing: 0.06em;
          color: rgba(135, 155, 195, 0.55);
        }
        .ops-floor__scale {
          margin: 0 0 8px;
          font-size: 0.62rem;
          line-height: 1.4;
          color: rgba(145, 158, 188, 0.78);
        }
        .ops-floor__grav-line {
          margin: 0 0 4px;
          font-size: 0.65rem;
          line-height: 1.35;
          color: rgba(185, 175, 210, 0.8);
        }
        .ops-floor__trade {
          margin: 0 0 6px;
          font-size: 0.62rem;
          line-height: 1.4;
          color: rgba(175, 185, 210, 0.78);
          font-style: italic;
        }
        .ops-floor__energy {
          margin: 0 0 4px;
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(165, 185, 215, 0.74);
        }
        .ops-floor__conseq {
          margin: 0 0 6px;
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(190, 175, 200, 0.72);
        }
        .ops-floor__orch {
          margin: 0 0 4px;
          font-size: 0.58rem;
          line-height: 1.35;
          letter-spacing: 0.04em;
          color: rgba(155, 170, 195, 0.78);
        }
        .ops-floor__eco {
          margin: 0 0 4px;
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(160, 175, 200, 0.72);
        }
        .ops-floor__pressure-live {
          margin: 0 0 4px;
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(200, 185, 175, 0.75);
        }
        .ops-floor__lanes {
          margin: 10px 0 10px;
        }
        .ops-floor__lane-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ops-floor__xlane {
          font-size: 0.5rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(165, 178, 208, 0.78);
          background: rgba(0, 0, 0, 0.28);
          max-width: 100%;
        }
        .ops-floor__lane-block {
          margin: 8px 0 0;
          font-size: 0.62rem;
          line-height: 1.4;
          color: rgba(155, 145, 175, 0.72);
          font-style: italic;
        }
        .ops-floor__cadence {
          margin: 10px 0 8px;
        }
        .ops-floor__cadence-lanes {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ops-floor__lane {
          font-size: 0.52rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(175, 190, 220, 0.82);
          background: rgba(0, 0, 0, 0.32);
          white-space: nowrap;
        }
        .ops-floor__waves {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 10px 0 8px;
        }
        .ops-floor__wave {
          font-size: 0.55rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(123, 143, 255, 0.2);
          color: rgba(185, 198, 228, 0.85);
          background: rgba(0, 0, 0, 0.35);
          white-space: nowrap;
        }
        .ops-floor__prod {
          margin: 0 0 4px;
          font-size: 0.66rem;
          line-height: 1.35;
          color: rgba(175, 188, 212, 0.82);
        }
        .ops-floor__mp {
          margin: 0 0 12px;
          font-size: 0.66rem;
          line-height: 1.35;
          color: rgba(210, 175, 160, 0.82);
        }
        .ops-floor__sec {
          margin-bottom: 14px;
        }
        .ops-floor__sec:last-child {
          margin-bottom: 0;
        }
        .ops-floor__h {
          margin: 0 0 8px;
          font-size: 0.52rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.72);
        }
        .ops-floor__flow {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          gap: 6px 4px;
        }
        .ops-floor__flow-node {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ops-floor__arrow {
          width: 10px;
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
        }
        .ops-floor__pill {
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 8px;
          min-width: 0;
          background: rgba(0, 0, 0, 0.35);
        }
        .ops-floor__pill-l {
          display: block;
          font-size: 0.62rem;
          color: rgba(215, 222, 240, 0.92);
        }
        .ops-floor__pill-s {
          font-size: 0.52rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(130, 145, 175, 0.65);
        }
        .ops-floor__pill--ready {
          border-color: rgba(100, 160, 120, 0.35);
        }
        .ops-floor__pill--active {
          border-color: rgba(123, 143, 255, 0.45);
        }
        .ops-floor__pill--blocked {
          border-color: rgba(180, 100, 100, 0.4);
        }
        .ops-floor__pill--waiting {
          border-color: rgba(255, 255, 255, 0.06);
        }
        .ops-floor__pill--cooling {
          border-color: rgba(140, 150, 170, 0.25);
        }
        .ops-floor__pill--overloaded {
          border-color: rgba(200, 120, 80, 0.45);
        }
        .ops-floor__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 12px;
        }
        @media (max-width: 640px) {
          .ops-floor__grid {
            grid-template-columns: 1fr;
          }
        }
        .ops-floor__cell {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 4px 8px;
          align-items: center;
        }
        .ops-floor__cell-k {
          grid-column: 1 / -1;
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(145, 158, 185, 0.7);
        }
        .ops-floor__meter {
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .ops-floor__meter-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(123, 143, 255, 0.35), rgba(123, 143, 255, 0.75));
        }
        .ops-floor__cell-v {
          font-size: 0.68rem;
          color: rgba(200, 210, 235, 0.85);
        }
        .ops-floor__queue {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ops-floor__queue li {
          display: grid;
          grid-template-columns: minmax(100px, 28%) 1fr;
          gap: 8px;
          align-items: baseline;
        }
        .ops-floor__qk {
          font-size: 0.52rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.72);
        }
        .ops-floor__qv {
          font-size: 0.72rem;
          line-height: 1.35;
          color: rgba(210, 218, 238, 0.88);
        }
        .ops-floor__entity7 {
          margin: 10px 0 12px;
          padding: 10px 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.045);
          background: rgba(0, 0, 0, 0.22);
        }
        .ops-floor__geom-sum {
          margin: 0 0 8px;
          font-size: 0.62rem;
          line-height: 1.45;
          color: rgba(155, 168, 198, 0.72);
        }
        .ops-floor__geom-micro {
          margin: 0 0 10px;
          padding: 0 0 0 14px;
          font-size: 0.58rem;
          line-height: 1.4;
          color: rgba(140, 155, 185, 0.68);
        }
        .ops-floor__geom-li {
          margin-bottom: 2px;
        }
        .ops-floor__geom-node {
          color: rgba(185, 198, 225, 0.82);
        }
        .ops-floor__geom-edge {
          color: rgba(120, 135, 165, 0.55);
        }
        .ops-floor__terrain7,
        .ops-floor__reco7,
        .ops-floor__hero7,
        .ops-floor__ops7 {
          margin: 0 0 6px;
          font-size: 0.62rem;
          line-height: 1.4;
          color: rgba(165, 175, 205, 0.78);
        }
        .ops-floor__p8 {
          margin: 12px 0 14px;
          padding: 12px 12px 14px;
          border-radius: 12px 8px 14px 10px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          background:
            linear-gradient(165deg, rgba(18, 22, 34, 0.55) 0%, rgba(4, 5, 10, 0.72) 100%),
            radial-gradient(80% 50% at 10% 0%, rgba(90, 110, 180, calc(0.06 + var(--live-topology-emphasis, 0.45) * 0.08)), transparent 55%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 -20px 40px rgba(0, 0, 0, 0.25);
        }
        .ops-floor__p8-chain {
          margin: 0 0 10px;
          font-size: 0.64rem;
          line-height: 1.45;
          letter-spacing: 0.02em;
          color: rgba(195, 205, 232, 0.82);
        }
        .ops-floor__p8-line {
          margin: 0 0 6px;
          font-size: 0.6rem;
          line-height: 1.4;
          color: rgba(155, 168, 198, 0.72);
        }
      `}</style>
    </>
  );
}
