import { useI18n } from "../../lib/i18n/I18nContext";
import {
  AGENTS,
  COG_TELEMETRY_TAG,
  MODE_CORE_LABEL,
  MODE_MISSION_LINE,
  NEURAL_MESH_PATHS,
  type AgentPersona,
  type CognitiveLayerId,
  type MissionSystemMode,
  type SignalRow,
  type ThoughtBlock,
  type WarfarePressure,
} from "./mcConstants";
import { AgentConsciousness } from "./AgentConsciousness";
import { CognitiveCore } from "./CognitiveCore";
import { EnvironmentalDepth } from "./EnvironmentalDepth";
import { MarketPressure } from "./MarketPressure";
import { NeuralRoutes } from "./NeuralRoutes";
import { SignalMatrix } from "./SignalMatrix";
import { StrategicOutput } from "./StrategicOutput";
import { StrategicOverlay } from "./StrategicOverlay";
import { OrchestrationSpine } from "./OrchestrationSpine";
import "./mcEcosystem.css";

export type McEcosystemProps = {
  systemMode: MissionSystemMode;
  cognitiveLayer: CognitiveLayerId;
  thought: ThoughtBlock;
  warfarePressure: WarfarePressure;
  signalRows: SignalRow[];
  signalHighlightIdx: number;
  spikeAgent: number | null;
  hoveredAgentIndex: number | null;
  onHoverAgent: (index: number | null) => void;
  meshDurations: string[];
  signalDurations: string[];
  signalRightDurations: string[];
  panelMotionDurations: string[];
  primaryPersona: AgentPersona | null;
  interAgentReasonPaths: { primary: string; ghost: string };
  coreFeedDurations: string[];
  marketStress: number;
  coreProcessing: boolean;
};

export default function McEcosystem({
  systemMode,
  cognitiveLayer,
  thought,
  warfarePressure,
  signalRows,
  signalHighlightIdx,
  spikeAgent,
  hoveredAgentIndex,
  onHoverAgent,
  meshDurations,
  signalDurations,
  signalRightDurations,
  panelMotionDurations,
  primaryPersona,
  interAgentReasonPaths,
  coreFeedDurations,
  marketStress,
  coreProcessing,
}: McEcosystemProps) {
  const { t } = useI18n();
  return (
    <div className="mc-ego">
      <EnvironmentalDepth marketStress={marketStress} />

      <header className="mc-ego__bar">
        <div className="mc-ego__bar-left">
          <span className="mc-ego__bar-mode">{MODE_CORE_LABEL[systemMode]}</span>
          <span className="mc-ego__bar-kicker">{t("mc.opsKicker")}</span>
        </div>
        <div className="mc-ego__bar-center">
          <p className="mc-ego__bar-mission">{MODE_MISSION_LINE[systemMode]}</p>
        </div>
        <div className="mc-ego__bar-right">
          <span className="mc-ego__bar-tag" title={t("mc.layerHint")}>
            {COG_TELEMETRY_TAG[cognitiveLayer]}
          </span>
          <span className="mc-ego__bar-pulse" aria-hidden />
        </div>
      </header>

      <div className="mc-ego__body">
        <div
          className="mc-ego__mainRow"
          data-mc-route-focus={hoveredAgentIndex != null ? "1" : ""}
          data-mc-mode={systemMode}
        >
          <StrategicOverlay />
          <OrchestrationSpine systemMode={systemMode} routeFocusIndex={hoveredAgentIndex} />
          <NeuralRoutes
            systemMode={systemMode}
            coreFeedDurations={coreFeedDurations}
            signalDurations={signalDurations}
            signalRightDurations={signalRightDurations}
            panelMotionDurations={panelMotionDurations}
            hoveredAgentIndex={hoveredAgentIndex}
            spikeAgent={spikeAgent}
          />
          <aside className="mc-ego__agents">
            <div className="mc-ego__agents-hdr">
              <span className="mc-ego__agents-title">{t("mc.agentsHdr")}</span>
              <span className="mc-ego__agents-sub">{t("mc.agentsSub")}</span>
            </div>
            <svg className="mc-ego__agent-mesh" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {NEURAL_MESH_PATHS.map((d, i) => (
                <g key={`mesh-${i}`}>
                  <path className="mc-ego__mesh-path" d={d} />
                  <circle className="mc-ego__mesh-dot" r="0.1" fill="rgba(148, 165, 205, 0.12)">
                    <animateMotion dur={meshDurations[i] ?? "96s"} repeatCount="indefinite" begin={`${-i * 4}s`} rotate="auto" path={d} />
                  </circle>
                </g>
              ))}
            </svg>
            <svg className="mc-ego__agent-chain-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="mc-ego-chain-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(110, 132, 178, 0.05)" />
                  <stop offset="50%" stopColor="rgba(135, 158, 205, 0.22)" />
                  <stop offset="100%" stopColor="rgba(110, 132, 178, 0.05)" />
                </linearGradient>
              </defs>
              <path className="mc-ego__chain-path mc-ego__chain-path--ghost" d={interAgentReasonPaths.ghost} fill="none" vectorEffect="non-scaling-stroke" />
              <path className="mc-ego__chain-path" d={interAgentReasonPaths.primary} fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="mc-ego__agents-scroll">
              {AGENTS.map((agent, index) => (
                <AgentConsciousness
                  key={agent.persona}
                  agent={agent}
                  index={index}
                  systemMode={systemMode}
                  primaryPersona={primaryPersona}
                  hoveredAgentIndex={hoveredAgentIndex}
                  spikeAgent={spikeAgent}
                  onHoverAgent={onHoverAgent}
                />
              ))}
            </div>
          </aside>

          <CognitiveCore
            systemMode={systemMode}
            cognitiveLayer={cognitiveLayer}
            marketStress={marketStress}
            coreProcessing={coreProcessing}
            routeAwake={hoveredAgentIndex != null}
          />

          <details className="mc-ego__market-details">
            <summary className="mc-ego__market-sum">{t("mc.marketExpand")}</summary>
            <MarketPressure warfarePressure={warfarePressure} hoveredAgentIndex={hoveredAgentIndex} suppressHeader />
          </details>
        </div>

        <div className="mc-ego__bottomRow">
          <SignalMatrix signalRows={signalRows} signalHighlightIdx={signalHighlightIdx} />
          <StrategicOutput thought={thought} warfarePressure={warfarePressure} />
        </div>
      </div>
    </div>
  );
}
