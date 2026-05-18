import { useId, useMemo } from "react";
import type { DependencyEdge, ExecutionRoute } from "../../lib/execution-orchestrator/types";

function trunc(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function routePalette(state: ExecutionRoute["routeState"]): { fill: string; stroke: string; glow?: string } {
  switch (state) {
    case "blocked":
      return { fill: "rgba(120, 72, 72, 0.22)", stroke: "rgba(200, 130, 130, 0.45)" };
    case "active":
    case "scaling":
      return { fill: "rgba(88, 102, 150, 0.28)", stroke: "rgba(140, 158, 210, 0.55)", glow: "rgba(130, 150, 220, 0.35)" };
    case "completed":
    case "exhausted":
      return { fill: "rgba(72, 96, 78, 0.2)", stroke: "rgba(120, 150, 130, 0.35)" };
    case "paused":
    case "waiting":
      return { fill: "rgba(70, 76, 92, 0.35)", stroke: "rgba(120, 128, 150, 0.28)" };
    case "synchronized":
    case "production_ready":
      return { fill: "rgba(82, 96, 124, 0.3)", stroke: "rgba(130, 145, 180, 0.42)" };
    default:
      return { fill: "rgba(70, 76, 92, 0.35)", stroke: "rgba(120, 128, 150, 0.28)" };
  }
}

type Props = {
  routes: readonly ExecutionRoute[];
  focusRouteId: string;
  edges: readonly DependencyEdge[];
  pulseGeneration: number;
  hintRu: string;
};

export function OrchLogisticsMap({ routes, focusRouteId, edges, pulseGeneration, hintRu }: Props) {
  const gid = useId().replace(/:/g, "");
  const W = 960;
  const routeY = 36;
  const edgeStartY = 92;
  const rowGap = 52;

  const routeNodes = useMemo(() => {
    const n = routes.length;
    if (n === 0) return [];
    const usable = W - 120;
    const step = n <= 1 ? 0 : usable / (n - 1);
    return routes.map((r, i) => ({
      r,
      cx: 60 + step * i,
      cy: routeY,
      focused: r.id === focusRouteId,
    }));
  }, [routes, W, routeY]);

  return (
    <div className="orch-map" data-orch-pulse-gen={pulseGeneration % 10000}>
      <p className="orch-map__hint">{hintRu}</p>
      <svg className="orch-map__svg" viewBox={`0 0 ${W} ${edgeStartY + edges.length * rowGap + 36}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(95, 108, 145, 0.02)" />
            <stop offset="50%" stopColor="rgba(135, 152, 195, 0.14)" />
            <stop offset="100%" stopColor="rgba(95, 108, 145, 0.02)" />
          </linearGradient>
          <filter id={`${gid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text x="24" y="18" className="orch-map__cap">
          МАРШРУТЫ
        </text>
        {routeNodes.map(({ r, cx, cy, focused }) => {
          const pal = routePalette(r.routeState);
          const pulse = r.routeState === "active" || r.routeState === "scaling";
          return (
            <g key={r.id} transform={`translate(${cx}, ${cy})`} className={focused ? "orch-map__rg--focus" : ""}>
              {pulse ? (
                <circle r="14" fill="none" stroke="rgba(130, 150, 210, 0.12)" strokeWidth="1" className="orch-map__pulse-ring" />
              ) : null}
              <circle r="10" fill={pal.fill} stroke={pal.stroke} strokeWidth={focused ? 1.4 : 0.9} filter={`url(#${gid}-soft)`} />
              <title>{`${r.titleRu} · ${r.routeState}`}</title>
            </g>
          );
        })}

        <text x="24" y={edgeStartY - 8} className="orch-map__cap">
          ЗАВИСИМОСТИ
        </text>
        {edges.map((e, idx) => {
          const y = edgeStartY + idx * rowGap;
          const x0 = 48;
          const x1 = W - 48;
          const mx = (x0 + x1) / 2;
          const d = `M ${x0} ${y} C ${mx} ${y - 22}, ${mx} ${y + 22}, ${x1} ${y}`;
          return (
            <g key={e.id}>
              <path
                d={d}
                fill="none"
                stroke={`url(#${gid}-arc)`}
                strokeWidth="1.1"
                strokeOpacity="0.55"
                strokeLinecap="round"
                className="orch-map__dep-path"
              />
              <path
                d={d}
                fill="none"
                stroke="rgba(125, 142, 185, 0.12)"
                strokeWidth="2.2"
                strokeDasharray="2 7"
                strokeLinecap="round"
                className="orch-map__dep-dash"
              />
              <rect x={x0 - 36} y={y - 18} width={108} height={36} rx="6" className="orch-map__node" />
              <rect x={x1 - 120} y={y - 18} width={120} height={36} rx="6" className="orch-map__node" />
              <text x={x0 + 18} y={y + 5} textAnchor="middle" className="orch-map__lbl">
                {trunc(e.fromRu, 16)}
              </text>
              <text x={x1 - 60} y={y + 5} textAnchor="middle" className="orch-map__lbl">
                {trunc(e.toRu, 18)}
              </text>
              <text x={mx} y={y + 34} textAnchor="middle" className="orch-map__cond">
                {trunc(e.conditionRu, 52)}
              </text>
            </g>
          );
        })}
      </svg>
      <style>{`
        .orch-map {
          position: relative;
          border-radius: var(--radius-xl, 14px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: radial-gradient(120% 80% at 50% 0%, rgba(55, 62, 88, 0.35), rgba(8, 10, 16, 0.92));
          overflow: hidden;
        }
        .orch-map__hint {
          margin: 0;
          padding: 10px 16px 0;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .orch-map__svg {
          display: block;
          width: 100%;
          height: auto;
          min-height: 200px;
        }
        .orch-map__cap {
          fill: rgba(130, 140, 165, 0.45);
          font-size: 8px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-family: var(--font-body, system-ui);
        }
        .orch-map__node {
          fill: rgba(0, 0, 0, 0.35);
          stroke: rgba(255, 255, 255, 0.06);
        }
        .orch-map__lbl {
          fill: rgba(205, 214, 232, 0.88);
          font-size: 9px;
          font-family: var(--font-body, system-ui);
        }
        .orch-map__cond {
          fill: rgba(150, 162, 188, 0.55);
          font-size: 8px;
          font-family: var(--font-body, system-ui);
        }
        .orch-map__rg--focus > circle:last-of-type {
          stroke: rgba(165, 180, 235, 0.75);
        }
        @keyframes orch-map-pulse {
          0%,
          100% {
            opacity: 0.12;
          }
          50% {
            opacity: 0.38;
          }
        }
        .orch-map__pulse-ring {
          animation: orch-map-pulse 2.6s ease-in-out infinite;
        }
        @keyframes orch-map-dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        .orch-map__dep-dash {
          animation: orch-map-dash 14s linear infinite;
        }
      `}</style>
    </div>
  );
}
