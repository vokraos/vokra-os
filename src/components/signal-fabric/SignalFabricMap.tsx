import { useMemo, useId } from "react";
import type { FabricModuleKey, SignalFabricSnapshot, SignalPropagation } from "../../lib/signal-fabric/types";
import type { LiveState } from "../../lib/live-state/types";
import { deriveFabricEdgeLiveState } from "../../lib/live-state/localizedMicrostate";

const LAYOUT: Record<FabricModuleKey, { x: number; y: number }> = {
  missionControl: { x: 50, y: 18 },
  initiativeEngine: { x: 72, y: 22 },
  trends: { x: 18, y: 28 },
  command: { x: 82, y: 38 },
  strategicSimulation: { x: 62, y: 48 },
  temporalStrategy: { x: 38, y: 42 },
  executionPlanner: { x: 28, y: 62 },
  executionOrchestrator: { x: 36, y: 72 },
  dna: { x: 14, y: 52 },
  seo: { x: 22, y: 78 },
  visual: { x: 42, y: 88 },
  rich: { x: 58, y: 82 },
  reels: { x: 72, y: 72 },
  campaign: { x: 88, y: 58 },
  analytics: { x: 88, y: 28 },
  memory: { x: 12, y: 72 },
  operations: { x: 50, y: 92 },
};

type Props = {
  fabric: SignalFabricSnapshot;
  activeModule?: FabricModuleKey | null;
  live?: LiveState | null;
};

function edgePath(from: FabricModuleKey, to: FabricModuleKey): string | null {
  const a = LAYOUT[from];
  const b = LAYOUT[to];
  if (!a || !b) return null;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 6;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

function propagationPathD(path: readonly FabricModuleKey[]): string | null {
  const coords = path.map((id) => LAYOUT[id]).filter((c): c is { x: number; y: number } => Boolean(c));
  if (coords.length < 2) return null;
  let d = `M ${coords[0]!.x} ${coords[0]!.y}`;
  for (let i = 1; i < coords.length; i++) {
    const curr = coords[i]!;
    const prev = coords[i - 1]!;
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2 - 4;
    d += ` Q ${mx} ${my} ${curr.x} ${curr.y}`;
  }
  return d;
}

function propagationImpulseDur(p: SignalPropagation, live: LiveState | null | undefined): string {
  const base = live?.signalMotionSec ?? 96;
  const bias = 1.15 - (p.intensity / 100) * 0.22;
  return `${Math.round(base * bias)}s`;
}

export function SignalFabricMap({ fabric, activeModule, live }: Props) {
  const gid = useId().replace(/:/g, "");

  const propagationPaths = useMemo(() => {
    return fabric.propagations
      .slice(0, 4)
      .map((p) => ({ p, d: propagationPathD(p.path) }))
      .filter((x): x is { p: SignalPropagation; d: string } => Boolean(x.d));
  }, [fabric.propagations]);

  const motionMul = live?.regimeTransition.profile === "premium_defense" ? 0.9 : live?.regimeTransition.profile === "recovery" ? 0.92 : 1;

  return (
    <div className="sf-map glass-panel" data-sf-live-profile={live?.regimeTransition.profile ?? ""}>
      <h2 className="sf-map__h2">Узлы и маршруты</h2>
      <p className="sf-map__hint">Тонкие линии контура · направленный импульс</p>
      <svg className="sf-map__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-sf-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(88, 102, 138, 0.02)" />
            <stop offset="50%" stopColor="rgba(130, 148, 188, 0.14)" />
            <stop offset="100%" stopColor="rgba(88, 102, 138, 0.02)" />
          </linearGradient>
        </defs>
        {fabric.edges.map((e) => {
          const d = edgePath(e.from, e.to);
          if (!d) return null;
          const state = live ? deriveFabricEdgeLiveState(e, fabric, live) : "stable";
          const dash =
            state === "conflict"
              ? "0.35 0.55"
              : state === "blocked"
                ? "0.2 0.45"
                : state === "decayed"
                  ? "0.15 0.35"
                  : "1.1 0.9";
          const durMul = state === "reinforced" ? 1.18 : state === "blocked" ? 0.72 : state === "decayed" ? 1.35 : state === "conflict" ? 0.88 : 1;
          const strokeOpBase = 0.06 + (e.intensity / 100) * 0.18 + (state === "conflict" ? 0.06 : 0);
          const strokeW = 0.12 + (e.intensity / 100) * 0.35 + (state === "reinforced" ? 0.04 : 0);
          return (
            <path
              key={e.id}
              data-sf-edge-live={state}
              d={d}
              fill="none"
              stroke={`url(#${gid}-sf-edge)`}
              strokeWidth={strokeW}
              strokeOpacity={Math.min(0.32, strokeOpBase)}
              strokeDasharray={dash}
              vectorEffect="non-scaling-stroke"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-30"
                dur={`${e.flowDurationSec * durMul * motionMul}s`}
                repeatCount="indefinite"
              />
              {state === "sync" ? (
                <animate attributeName="stroke-opacity" values="0.07;0.14;0.07" dur={`${28 + (e.intensity % 12)}s`} repeatCount="indefinite" />
              ) : null}
            </path>
          );
        })}
        {live
          ? propagationPaths.map(({ p, d }) => (
              <g key={`imp-${p.id}`} className="sf-map__impulse">
                <circle r="0.28" fill="rgba(195, 205, 230, 0.16)">
                  <animateMotion dur={propagationImpulseDur(p, live)} repeatCount="indefinite" rotate="auto" path={d} />
                </circle>
              </g>
            ))
          : null}
        {fabric.nodes.map((n) => {
          const p = LAYOUT[n.id];
          if (!p) return null;
          const on = activeModule === n.id;
          return (
            <g key={n.id}>
              <circle
                className={`sf-map__node${on ? " sf-map__node--on" : ""}`}
                cx={p.x}
                cy={p.y}
                r={on ? 2.4 : 1.8}
                fill={on ? "rgba(175, 190, 225, 0.22)" : "rgba(120, 135, 170, 0.14)"}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.08}
              />
              <text x={p.x} y={p.y - 3.2} className="sf-map__label" textAnchor="middle">
                {n.labelRu.length > 18 ? `${n.labelRu.slice(0, 16)}…` : n.labelRu}
              </text>
            </g>
          );
        })}
      </svg>
      <style>{`
        .sf-map {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
        }
        .sf-map__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 6px;
        }
        .sf-map__hint {
          margin: 0 0 10px;
          font-size: 0.7rem;
          color: rgba(150, 165, 195, 0.5);
        }
        .sf-map__svg {
          width: 100%;
          height: auto;
          min-height: 280px;
          display: block;
        }
        .sf-map__label {
          font-size: 2.4px;
          fill: rgba(165, 180, 210, 0.45);
        }
        .sf-map path[data-sf-edge-live="conflict"] {
          filter: none;
        }
        .sf-map path[data-sf-edge-live="blocked"] {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
