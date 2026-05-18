import { useId } from "react";
import type { NavId } from "../types";
import { useSignalFabricOptional } from "../lib/signal-fabric/context";
import { useLiveState } from "../lib/live-state";

type Props = { active: NavId };

/** Ultra-subtle global neural haze + slow particles — visible on all non-home pages. */
export function SignalFabricAmbient({ active }: Props) {
  const fabric = useSignalFabricOptional();
  const { live } = useLiveState();
  const gid = useId().replace(/:/g, "");
  if (active === "home" || !fabric) return null;

  const hazeOpacity = Math.min(0.78, 0.48 * live.fabricHazeOpacityMul);
  const edgeStrokeBase = 0.06 * live.fabricPathOpacityMul;

  const edges = fabric.edges.slice(0, 14);

  return (
    <div className="sf-ambient" aria-hidden data-sf-pulse={fabric.pulseGeneration % 500}>
      <svg className="sf-ambient__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id={`${gid}-sf-haze`} cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(55, 68, 98, 0.07)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${gid}-sf-haze)`} />
        {edges.map((e, i) => {
          const y0 = 12 + (hashEdge(e.id) % 76);
          const y1 = 18 + (hashEdge(`${e.id}-t`) % 70);
          const d = `M 0 ${y0} C 35 ${y0 - 4 + (i % 6)}, 65 ${y1 + 6}, 100 ${y1}`;
          return (
            <path
              key={e.id}
              d={d}
              fill="none"
              stroke={`rgba(120, 138, 175, ${edgeStrokeBase.toFixed(3)})`}
              strokeWidth={0.15 + (e.intensity / 100) * 0.2}
              vectorEffect="non-scaling-stroke"
            >
              <animate attributeName="opacity" values="0.04;0.09;0.04" dur={`${96 + (i % 5) * 18}s`} repeatCount="indefinite" />
            </path>
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} r="0.25" fill="rgba(200, 210, 235, 0.12)">
            <animateMotion
              dur={`${140 + i * 22}s`}
              repeatCount="indefinite"
              path={`M ${10 + i * 18} ${20 + i * 8} Q 50 ${40 + i * 6} ${88 - i * 10} ${72 - i * 4}`}
            />
          </circle>
        ))}
      </svg>
      <style>{`
        .sf-ambient {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }
        .sf-ambient__svg {
          width: 100%;
          height: 100%;
          display: block;
          opacity: ${hazeOpacity};
        }
      `}</style>
    </div>
  );
}

function hashEdge(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
