import {
  PANEL_SYNAPSE_PATHS,
  SIGNAL_SYNAPSE_PATHS,
  SYNAPSE_PATHS,
  buildCoreFeedPaths,
  AGENTS,
  type MissionSystemMode,
} from "./mcConstants";
import { SignalTransport } from "./SignalTransport";

export type NeuralRoutesProps = {
  systemMode: MissionSystemMode;
  coreFeedDurations: string[];
  signalDurations: string[];
  signalRightDurations: string[];
  panelMotionDurations: string[];
  hoveredAgentIndex: number | null;
  spikeAgent: number | null;
};

export function NeuralRoutes({
  systemMode,
  coreFeedDurations,
  signalDurations,
  signalRightDurations,
  panelMotionDurations,
  hoveredAgentIndex,
  spikeAgent,
}: NeuralRoutesProps) {
  const corePaths = buildCoreFeedPaths(AGENTS.length);
  return (
    <>
      <svg className="mc-ego__synapses" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="mc-ego-syn" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(130, 148, 195, 0.14)" />
            <stop offset="100%" stopColor="rgba(88, 108, 150, 0.04)" />
          </linearGradient>
        </defs>
        <g className="mc-ego__syn-left">
          {SYNAPSE_PATHS.map((d, i) => (
            <g key={`syn-l-${i}`}>
              <path className="mc-ego__syn-path mc-ego__syn-path--ghost" d={d} style={{ animationDelay: `${-i * 5}s` }} />
              <path className="mc-ego__syn-path" d={d} style={{ animationDelay: `${-i * 3.5}s` }} />
              <circle className="mc-ego__syn-dot" r="0.2" fill="rgba(165, 182, 220, 0.18)">
                <animateMotion dur={signalDurations[i] ?? "48s"} repeatCount="indefinite" rotate="auto" path={d} />
              </circle>
            </g>
          ))}
        </g>
        <g className="mc-ego__syn-right">
          {SIGNAL_SYNAPSE_PATHS.map((d, i) => (
            <g key={`syn-r-${i}`}>
              <path className="mc-ego__syn-path mc-ego__syn-path--ghost mc-ego__syn-path--dim" d={d} />
              <path className="mc-ego__syn-path mc-ego__syn-path--dim" d={d} />
              <circle className="mc-ego__syn-dot mc-ego__syn-dot--sm" r="0.16" fill="rgba(155, 175, 215, 0.14)">
                <animateMotion dur={signalRightDurations[i] ?? "52s"} repeatCount="indefinite" rotate="auto" path={d} />
              </circle>
            </g>
          ))}
        </g>
        <g className="mc-ego__syn-panel">
          {PANEL_SYNAPSE_PATHS.map((d, i) => (
            <g key={`syn-p-${i}`}>
              <path className="mc-ego__syn-path mc-ego__syn-path--panel" d={d} />
              <circle className="mc-ego__syn-dot mc-ego__syn-dot--xs" r="0.12" fill="rgba(140, 158, 200, 0.12)">
                <animateMotion dur={panelMotionDurations[i] ?? "64s"} repeatCount="indefinite" rotate="auto" path={d} />
              </circle>
            </g>
          ))}
        </g>
      </svg>

      <svg className="mc-ego__routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="mc-ego-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(110, 135, 185, 0.35)" />
            <stop offset="100%" stopColor="rgba(75, 95, 140, 0.08)" />
          </linearGradient>
        </defs>
        {corePaths.map((d, i) => (
          <g key={`route-${i}`} className={`mc-ego__route-group mc-ego__route-group--${i}`}>
            <path className="mc-ego__route mc-ego__route--ghost" d={d} />
            <path
              className={`mc-ego__route mc-ego__route--main${hoveredAgentIndex === i ? " mc-ego__route--hot" : ""}${spikeAgent === i ? " mc-ego__route--spike" : ""}`}
              d={d}
            />
            <circle className="mc-ego__route-pulse" r="0.24" fill="rgba(175, 195, 235, 0.35)">
              <animateMotion dur={coreFeedDurations[i] ?? "88s"} repeatCount="indefinite" rotate="auto" path={d} />
            </circle>
          </g>
        ))}
      </svg>
      <SignalTransport systemMode={systemMode} coreFeedDurations={coreFeedDurations} />
    </>
  );
}
