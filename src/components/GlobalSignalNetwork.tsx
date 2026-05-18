import { useId } from "react";
import type { NavId } from "../types";
import { signalNetworkAnchors, useCognitiveOs } from "../lib/cognitive-os";
import { useLiveState } from "../lib/live-state";

/**
 * Глобальная сеть сигналов: путь последнего импульса → ядро → активный модуль.
 * Тонкие линии, без «неона»; только когда есть lastEvent или лёгкий фон сети.
 */
export function GlobalSignalNetwork({ active }: { active: NavId }) {
  const { lastEvent, pulseGeneration, initiativeUrgency } = useCognitiveOs();
  const { live } = useLiveState();
  const gid = useId().replace(/:/g, "");
  if (active === "home") return null;

  const src = lastEvent?.source ?? "missionControl";
  const anchors = signalNetworkAnchors(src, active, pulseGeneration);
  const d = `M ${anchors.sx} ${anchors.sy} Q ${anchors.cx * 0.72} ${anchors.sy * 0.88 + anchors.cy * 0.12} ${anchors.cx} ${anchors.cy} Q ${anchors.cx * 1.12 + anchors.tx * 0.08} ${anchors.ty * 0.85 + anchors.cy * 0.15} ${anchors.tx} ${anchors.ty}`;
  const dGhost = `M ${anchors.sx} ${anchors.sy + 4} Q ${anchors.cx} ${anchors.cy + 6} ${anchors.tx} ${anchors.ty - 3}`;

  return (
    <svg
      className={`cog-signal-net cog-signal-net--urgency-${initiativeUrgency}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      data-cog-net-pulse={pulseGeneration % 500}
    >
      <defs>
        <linearGradient id={`${gid}-cog-net-stroke`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="rgba(72, 88, 118, 0.06)" />
          <stop offset="45%" stopColor="rgba(120, 138, 175, 0.14)" />
          <stop offset="100%" stopColor="rgba(68, 82, 108, 0.05)" />
        </linearGradient>
      </defs>
      <path className="cog-signal-net__ghost" d={dGhost} fill="none" vectorEffect="non-scaling-stroke" />
      <path className="cog-signal-net__path" d={d} fill="none" vectorEffect="non-scaling-stroke" stroke={`url(#${gid}-cog-net-stroke)`} />
      {lastEvent ? (
        <circle className="cog-signal-net__pulse" r="0.22" fill="rgba(200, 210, 235, 0.2)">
          <animateMotion dur={`${live.signalMotionSec}s`} repeatCount="indefinite" rotate="auto" path={d} />
        </circle>
      ) : null}
    </svg>
  );
}
