import type { MissionSystemMode } from "./mcConstants";

/**
 * Архитектурный слой маршрутизации: тренд → стратегия → ядро → SEO → производство → вывод.
 * Тонкие линии и медленные импульсы — без «неона» и игровых эффектов.
 */
export type OrchestrationSpineProps = {
  systemMode: MissionSystemMode;
  routeFocusIndex: number | null;
};

const SPINE_MAIN =
  "M 8 51 C 16 49 20 48 26 48 C 34 47 40 47 48 47.5 C 56 48 62 48.5 70 49 C 78 49.5 86 50.5 93 51";

const SPINE_AUX =
  "M 12 68 Q 24 58 38 52 Q 44 50 48 48.5 M 14 32 Q 28 40 40 46 Q 45 47.5 48 47.5 M 86 34 Q 78 42 68 47 Q 58 48 52 48.5";

export function OrchestrationSpine({ systemMode, routeFocusIndex }: OrchestrationSpineProps) {
  const focus = routeFocusIndex != null ? "1" : "";
  return (
    <svg
      className="mc-ego__orchestration"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      data-mc-spine-focus={focus}
      data-mc-spine-mode={systemMode}
    >
      <defs>
        <linearGradient id="mc-spine-stroke" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="rgba(72, 88, 128, 0.12)" />
          <stop offset="35%" stopColor="rgba(120, 138, 178, 0.22)" />
          <stop offset="65%" stopColor="rgba(110, 128, 168, 0.2)" />
          <stop offset="100%" stopColor="rgba(68, 82, 118, 0.1)" />
        </linearGradient>
        <linearGradient id="mc-spine-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(200, 210, 235, 0)" />
          <stop offset="45%" stopColor="rgba(210, 218, 238, 0.14)" />
          <stop offset="55%" stopColor="rgba(210, 218, 238, 0.16)" />
          <stop offset="100%" stopColor="rgba(200, 210, 235, 0)" />
        </linearGradient>
      </defs>
      <path className="mc-ego__orchestration-base" d={SPINE_AUX} fill="none" vectorEffect="non-scaling-stroke" />
      <path className="mc-ego__orchestration-base mc-ego__orchestration-base--main" d={SPINE_MAIN} fill="none" vectorEffect="non-scaling-stroke" />
      <path className="mc-ego__orchestration-flow" d={SPINE_MAIN} fill="none" vectorEffect="non-scaling-stroke" />
      <g className="mc-ego__orchestration-nodes">
        {[
          { cx: 8, cy: 51, t: "Тренд" },
          { cx: 26, cy: 48, t: "Стратегия" },
          { cx: 48, cy: 47.5, t: "Ядро" },
          { cx: 70, cy: 49, t: "SEO" },
          { cx: 82, cy: 50.5, t: "Производство" },
          { cx: 93, cy: 51, t: "Вывод" },
        ].map((n) => (
          <circle key={n.t} className="mc-ego__orchestration-node" cx={n.cx} cy={n.cy} r="0.35">
            <title>{n.t}</title>
          </circle>
        ))}
      </g>
    </svg>
  );
}
