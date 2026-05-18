import { AGENTS, agentTier, buildCoreFeedPaths, routeSignalKinds, type MissionSystemMode, type SignalTransportKind } from "./mcConstants";

export type SignalTransportProps = {
  systemMode: MissionSystemMode;
  coreFeedDurations: string[];
};

const KIND_DUR_MUL: Record<SignalTransportKind, number> = {
  intel: 1.15,
  execution: 1,
  risk: 0.82,
  creative: 1.08,
  critical: 0.68,
};

export function SignalTransport({ systemMode, coreFeedDurations }: SignalTransportProps) {
  const paths = buildCoreFeedPaths(AGENTS.length);
  return (
    <svg className="mc-ego__transport" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <filter id="mc-transport-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.08" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((d, i) => {
        const agent = AGENTS[i]!;
        const tier = agentTier(agent.persona, systemMode);
        const kinds = routeSignalKinds(agent.persona, tier);
        const baseDur = parseFloat((coreFeedDurations[i] ?? "88s").replace("s", "")) || 88;
        return (
          <g key={`tr-${i}`} className={`mc-transport-group mc-transport-group--${i}`}>
            {kinds.map((kind, j) => {
              const durSec = Math.max(38, baseDur * KIND_DUR_MUL[kind] * (1 + j * 0.12));
              return (
                <circle
                  key={`${i}-${kind}-${j}`}
                  className={`mc-transport-dot mc-transport-dot--${kind}`}
                  r={kind === "critical" ? 0.2 : 0.14}
                  filter={kind === "critical" ? "url(#mc-transport-glow)" : undefined}
                >
                  <animateMotion dur={`${durSec}s`} repeatCount="indefinite" begin={`${-i * 5.5 - j * 2.2}s`} rotate="auto" path={d} />
                </circle>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
