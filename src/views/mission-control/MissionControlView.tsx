import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import {
  ENTITY_SNAPSHOT_EVENT,
  deriveSnapshotIntelligence,
  formatSnapshotTopActionLine,
  getActiveEntitySnapshot,
  selectEntitySnapshotBannerCounts,
} from "../../lib/entity-snapshot";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useLiveState, deriveMissionControlMicrostate, localizedMotionMul } from "../../lib/live-state";
import McEcosystem from "./McEcosystem";
import { McSignalFabricStrip } from "./McSignalFabricStrip";
import { ExecutiveSurface } from "../../components/executive-surface/ExecutiveSurface";
import { FollowUpContinuity } from "../../components/follow-up/FollowUpContinuity";
import { LeverageDragCostBand } from "../../components/business-impact/LeverageDragCostBand";
import { TimePressurePanel } from "../../components/time-pressure/TimePressurePanel";
import { TodayStack } from "../../components/today-stack/TodayStack";
import { useCognitiveDepth, missionSlotRole } from "../../lib/cognitive-depth";
import { DepthGate } from "../../components/cognitive-depth/DepthGate";
import { DepthSection } from "../../components/cognitive-depth/DepthSection";
import { CommandSurface } from "../../components/cognitive-depth/CommandSurface";
import { FounderFocusSurface } from "../../components/cognitive-depth/FounderFocusSurface";
import { OperationsFloor } from "../../components/cognitive-depth/OperationsFloor";
import { MarketTopologyPanel } from "../../components/cognitive-depth/MarketTopologyPanel";
import { MemoryArchivePanel } from "../../components/cognitive-depth/MemoryArchivePanel";
import { SimulationDepthPanel } from "../../components/cognitive-depth/SimulationDepthPanel";
import {
  AGENTS,
  COGNITIVE_LAYER_CYCLE,
  IDLE_SIGNALS,
  MODE_CYCLE,
  MODE_SIGNAL_POOLS,
  MESH_DURATIONS_BASE,
  PANEL_MOTION_BASE,
  SIGNAL_DURATIONS_BASE,
  SIGNAL_RIGHT_DURATIONS_BASE,
  THOUGHT_BY_MODE,
  buildAgentReasonPaths,
  computeMarketStress,
  initialSignalRows,
  initialWarfarePressure,
  modePhysics,
  modePrimaryPersona,
  pickSignalSwap,
  MODE_AGENT_REASON_CHAIN,
  type MissionSystemMode,
  type WarfarePressure,
} from "./mcConstants";

export type { CognitiveLayerId } from "./mcConstants";

function driftMetric(v: number): number {
  return Math.min(94, Math.max(12, v + (Math.random() - 0.5) * 7));
}

export default function MissionControlView() {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();
  const { pulseGeneration, lastEvent, initiatives, synthesis } = useCognitiveOs();
  const { live } = useLiveState();
  const [systemMode, setSystemMode] = useState<MissionSystemMode>("idle");
  const [hoveredAgentIndex, setHoveredAgentIndex] = useState<number | null>(null);
  const [signalRows, setSignalRows] = useState(() => initialSignalRows("idle"));
  const [signalHighlightIdx, setSignalHighlightIdx] = useState(0);
  const [cogLayerIdx, setCogLayerIdx] = useState(0);
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [warfarePressure, setWarfarePressure] = useState<WarfarePressure>(() => initialWarfarePressure());
  const [spikeAgent, setSpikeAgent] = useState<number | null>(null);
  const [coreProcessing, setCoreProcessing] = useState(false);
  const [cinematicBurst, setCinematicBurst] = useState(false);
  const modeIndexRef = useRef(0);
  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [esTick, setEsTick] = useState(0);

  useEffect(() => {
    const fn = () => setEsTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, fn);
    return () => window.removeEventListener(ENTITY_SNAPSHOT_EVENT, fn);
  }, []);

  const entitySnapBanner = useMemo(() => selectEntitySnapshotBannerCounts(), [esTick]);
  const snapshotActionLine = useMemo(() => {
    const s = getActiveEntitySnapshot();
    if (!s) return null;
    return formatSnapshotTopActionLine(t, deriveSnapshotIntelligence(s));
  }, [esTick, t]);

  const cognitiveLayer = COGNITIVE_LAYER_CYCLE[cogLayerIdx % COGNITIVE_LAYER_CYCLE.length];

  useEffect(() => {
    const id = window.setInterval(() => {
      setCogLayerIdx((i) => i + 1);
    }, 26000 + Math.floor(Math.random() * 14000));
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setThoughtIdx((i) => i + 1);
    }, 34000 + Math.floor(Math.random() * 18000));
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setThoughtIdx(0);
  }, [systemMode]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const idx = Math.floor(Math.random() * AGENTS.length);
      setSpikeAgent(idx);
      window.setTimeout(() => {
        setSpikeAgent((cur) => (cur === idx ? null : cur));
      }, 4800);
    }, 88000 + Math.floor(Math.random() * 24000));
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const id = window.setInterval(() => {
      setCoreProcessing(true);
      timers.push(
        window.setTimeout(() => {
          setCoreProcessing(false);
        }, 6800),
      );
    }, 62000);
    return () => {
      clearInterval(id);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    let burstClear: ReturnType<typeof setTimeout> | undefined;
    const id = window.setInterval(() => {
      setCinematicBurst(true);
      burstClear = window.setTimeout(() => setCinematicBurst(false), 2600);
    }, 148000);
    return () => {
      clearInterval(id);
      if (burstClear) clearTimeout(burstClear);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWarfarePressure((p) => ({
        trendAcceleration: driftMetric(p.trendAcceleration),
        ctrFatigue: driftMetric(p.ctrFatigue),
        oversaturationRisk: driftMetric(p.oversaturationRisk),
        animeClusterPressure: driftMetric(p.animeClusterPressure),
        premiumOpportunity: driftMetric(p.premiumOpportunity),
        fboInstability: driftMetric(p.fboInstability),
        dtfOverload: driftMetric(p.dtfOverload),
        engagementDecline: driftMetric(p.engagementDecline),
      }));
    }, 24000 + Math.floor(Math.random() * 12000));
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const arm = () => {
      const ms = 14000 + Math.floor(Math.random() * 8001);
      scheduleRef.current = setTimeout(() => {
        modeIndexRef.current = (modeIndexRef.current + 1) % MODE_CYCLE.length;
        setSystemMode(MODE_CYCLE[modeIndexRef.current]!);
        arm();
      }, ms);
    };
    arm();
    return () => {
      if (scheduleRef.current) clearTimeout(scheduleRef.current);
    };
  }, []);

  useEffect(() => {
    setSignalRows(initialSignalRows(systemMode));
    setSignalHighlightIdx(0);
    const pool = systemMode === "idle" ? [...IDLE_SIGNALS] : [...MODE_SIGNAL_POOLS[systemMode]];
    const timers: ReturnType<typeof setInterval>[] = [];
    for (let i = 0; i < 5; i++) {
      const period = 11800 + i * 2600 + Math.floor(Math.random() * 8200);
      timers.push(
        window.setInterval(() => {
          setSignalRows((rows) =>
            rows.map((r, j) =>
              j === i
                ? { id: `r-${Date.now()}-${j}-${Math.random().toString(36).slice(2, 7)}`, text: pickSignalSwap(pool, r.text) }
                : r,
            ),
          );
        }, period),
      );
    }
    return () => timers.forEach((t) => window.clearInterval(t));
  }, [systemMode]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSignalHighlightIdx((h) => (h + 1) % 5);
    }, 12800 + Math.floor(Math.random() * 7200));
    return () => window.clearInterval(id);
  }, [systemMode]);

  const primaryPersona = useMemo(() => modePrimaryPersona(systemMode), [systemMode]);
  const physics = useMemo(() => modePhysics(systemMode), [systemMode]);

  const meshDurations = useMemo(
    () => MESH_DURATIONS_BASE.map((s) => `${Math.round(s * physics.laneParticleLeftMul)}s`),
    [physics.laneParticleLeftMul],
  );
  const signalDurations = useMemo(
    () => SIGNAL_DURATIONS_BASE.map((s) => `${Math.round(s * physics.laneParticleLeftMul)}s`),
    [physics.laneParticleLeftMul],
  );
  const signalRightDurations = useMemo(
    () => SIGNAL_RIGHT_DURATIONS_BASE.map((s) => `${Math.round(s * physics.laneParticleRightMul)}s`),
    [physics.laneParticleRightMul],
  );
  const panelMotionDurations = useMemo(
    () => PANEL_MOTION_BASE.map((s) => `${Math.round(s * physics.laneParticlePanelMul)}s`),
    [physics.laneParticlePanelMul],
  );

  const interAgentReasonPaths = useMemo(
    () => buildAgentReasonPaths(MODE_AGENT_REASON_CHAIN[systemMode]),
    [systemMode],
  );

  const thought = useMemo(() => {
    const arr = THOUGHT_BY_MODE[systemMode];
    return arr[thoughtIdx % arr.length]!;
  }, [systemMode, thoughtIdx]);

  const coreFeedDurations = useMemo(
    () => AGENTS.map((_, i) => `${Math.round((72 + i * 9) * physics.laneParticleLeftMul)}s`),
    [physics.laneParticleLeftMul],
  );

  const marketStress = useMemo(() => computeMarketStress(warfarePressure), [warfarePressure]);

  const mcLiveMicro = useMemo(
    () =>
      deriveMissionControlMicrostate({
        live,
        marketStress01: marketStress,
        pulseSynced: Boolean(lastEvent),
        activeInitiativeCount: initiatives.length,
      }),
    [live, marketStress, lastEvent, initiatives.length],
  );

  const mcMotionMul = useMemo(
    () => localizedMotionMul(live.regimeTransition.profile, mcLiveMicro),
    [live.regimeTransition.profile, mcLiveMicro],
  );

  const rootStyle = useMemo(() => {
    const a = physics.atmos;
    return {
      "--cog-n": String(pulseGeneration % 6),
      "--mc-stress": String(marketStress),
      "--mc-live-tension": String(live.strategicTension.index01),
      "--mc-live-settling": String(live.confidenceDrift.settling01),
      "--mc-live-pressure": String(live.pressureWave.amplitude01),
      "--mc-lane-left-op": String(physics.laneLeftOpacity),
      "--mc-lane-right-op": String(physics.laneRightOpacity),
      "--mc-lane-panel-op": String(physics.lanePanelOpacity),
      "--mc-orbit-dur": `${physics.orbitSec}s`,
      "--mc-core-wave-a": `${physics.waveEarlySec}s`,
      "--mc-core-wave-b": `${physics.waveLateSec}s`,
      "--mc-core-wave-c": `${physics.waveLate2Sec}s`,
      "--mc-core-trail-opacity": String(physics.trailOpacity),
      "--mc-structure-speed": `${200 / physics.structureSpeedMul}s`,
      "--mc-core-fog-blur": `${physics.fogBlurPx}px`,
      "--mc-core-vol-opacity-mul": String(physics.volCool),
      "--mc-innermist-blur": `${physics.innermistBlur}px`,
      "--mc-magnetic-dur": `${physics.magneticDurSec}s`,
      "--mc-atmos-haze": String(a.hazeOpacity),
      "--mc-atmos-volumetric": String(a.volumetricOpacity),
      "--mc-atmos-particles": String(a.particlesOpacity),
      "--mc-atmos-dust": String(a.dustOpacity),
      "--mc-atmos-middepth": String(a.middepthOpacity),
      "--mc-atmos-bloom-mul": String(a.bloomOpacityMul),
      "--mc-room-spill-op": String(a.roomSpillOpacity),
      "--mc-room-vol-op": String(a.roomVolOpacity),
      "--mc-fg-motes-op": String(a.fgMotesOpacity),
      "--mc-depth-mid-op": String(a.depthMidOpacity),
      "--mc-particle-speed-mul": String(a.particleSpeedMul),
      "--mc-stream-tempo": String(physics.particleMul * mcMotionMul),
      "--mc-stream-tempo-left": String(physics.laneParticleLeftMul * mcMotionMul),
      "--mc-stream-tempo-right": String(physics.laneParticleRightMul * mcMotionMul),
      "--mc-stream-tempo-panel": String(physics.laneParticlePanelMul * mcMotionMul),
    } as CSSProperties;
  }, [physics, marketStress, pulseGeneration, live, mcMotionMul]);

  return (
    <div
      className="mc"
      data-mc-mode={systemMode}
      data-mc-cognitive-layer={cognitiveLayer}
      data-mc-hover-agent={hoveredAgentIndex ?? ""}
      data-mc-focus={hoveredAgentIndex !== null ? "1" : ""}
      data-mc-burst={cinematicBurst ? "1" : ""}
      data-mc-processing={coreProcessing ? "1" : ""}
      data-cog-pulse-gen={pulseGeneration}
      data-cog-last-event={lastEvent?.id ?? ""}
      data-mc-live-microstate={mcLiveMicro}
      data-mc-live-profile={live.regimeTransition.profile}
      data-mc-live-synthesis={synthesis.regime}
      style={rootStyle}
    >
      {snapshotActionLine ? (
        <p className="mc__entity-snap" role="status">
          {snapshotActionLine}
        </p>
      ) : entitySnapBanner ? (
        <p className="mc__entity-snap" role="status">
          {t("entitySnap.mission.banner", {
            sku: String(entitySnapBanner.sku),
            cards: String(entitySnapBanner.cards),
            corridors: String(entitySnapBanner.corridors),
          })}
        </p>
      ) : null}
      <DepthGate surface="mission" slot="commandBand">
        {mode === "command" ? <FounderFocusSurface variant="mission" /> : <CommandSurface variant="mission" />}
      </DepthGate>

      <DepthGate surface="mission" slot="operationsFloor">
        <DepthSection role={missionSlotRole(mode, "operationsFloor")}>
          <OperationsFloor variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="marketTopology">
        <DepthSection role={missionSlotRole(mode, "marketTopology")}>
          <MarketTopologyPanel variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="memoryArchive">
        <DepthSection role={missionSlotRole(mode, "memoryArchive")}>
          <MemoryArchivePanel variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="simulationLayer">
        <DepthSection role={missionSlotRole(mode, "simulationLayer")}>
          <SimulationDepthPanel variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="signalStrip">
        <DepthSection role={missionSlotRole(mode, "signalStrip")}>
          <McSignalFabricStrip />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="todayStack">
        <DepthSection role={missionSlotRole(mode, "todayStack")}>
          <TodayStack tone="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="leverageBand">
        <DepthSection role={missionSlotRole(mode, "leverageBand")}>
          <LeverageDragCostBand variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="timePressure">
        <DepthSection role={missionSlotRole(mode, "timePressure")}>
          <TimePressurePanel variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="followUp">
        <DepthSection role={missionSlotRole(mode, "followUp")}>
          <FollowUpContinuity variant="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="executiveSurface">
        <DepthSection role={missionSlotRole(mode, "executiveSurface")}>
          <ExecutiveSurface tone="mission" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="mission" slot="ecosystem">
        <DepthSection role={missionSlotRole(mode, "ecosystem")}>
          <McEcosystem
            systemMode={systemMode}
            cognitiveLayer={cognitiveLayer}
            thought={thought}
            warfarePressure={warfarePressure}
            signalRows={signalRows}
            signalHighlightIdx={signalHighlightIdx}
            spikeAgent={spikeAgent}
            hoveredAgentIndex={hoveredAgentIndex}
            onHoverAgent={setHoveredAgentIndex}
            meshDurations={meshDurations}
            signalDurations={signalDurations}
            signalRightDurations={signalRightDurations}
            panelMotionDurations={panelMotionDurations}
            primaryPersona={primaryPersona}
            interAgentReasonPaths={interAgentReasonPaths}
            coreFeedDurations={coreFeedDurations}
            marketStress={marketStress}
            coreProcessing={coreProcessing}
          />
        </DepthSection>
      </DepthGate>
    </div>
  );
}
