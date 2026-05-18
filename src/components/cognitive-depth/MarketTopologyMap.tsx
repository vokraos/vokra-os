import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { TopologyCorridor, TopologyRelation } from "../../lib/cognitive-depth/market-war-os";
import { empireScaleNumbers } from "../../lib/cognitive-depth/sku-empire";

type Props = {
  seed: number;
  rows: TopologyCorridor[];
  relations: TopologyRelation[];
  corridorLabels: string[];
  waves: number;
  ariaLabel: string;
  title: string;
  subtitle: string;
};

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function nodePos(i: number, n: number, cx: number, cy: number, rx: number, ry: number) {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
}

export function MarketTopologyMap({ seed, rows, relations, corridorLabels, waves, ariaLabel, title, subtitle }: Props) {
  const { t } = useI18n();
  const n = rows.length || 1;
  const cx = 200;
  const cy = 118;
  const rx = 132;
  const ry = 76;
  const heroIdx = useMemo(() => {
    let best = 0;
    let h = -1;
    rows.forEach((r, i) => {
      if (r.heroDensity > h) {
        h = r.heroDensity;
        best = i;
      }
    });
    return best;
  }, [rows]);

  const nodes = useMemo(
    () =>
      rows.map((r, i) => {
        const { x, y } = nodePos(i, n, cx, cy, rx, ry);
        const rad = 5 + (r.saturation / 100) * 7 + (r.pressure / 100) * 4;
        return { ...r, x, y, rad, i, label: clip(corridorLabels[i] ?? `·${i}`, 16) };
      }),
    [rows, corridorLabels, n],
  );

  const prodLoad = useMemo(() => {
    const sc = empireScaleNumbers(seed);
    return Math.min(100, Math.round((sc.blockedPackaging + sc.visualWait) / 2));
  }, [seed]);

  return (
    <figure className="topo-map" aria-label={ariaLabel}>
      <figcaption className="topo-map__cap">
        <span className="topo-map__title">{title}</span>
        <span className="topo-map__sub">{subtitle}</span>
        <span className="topo-map__meta" data-topo-map-pulse={String(seed % 7)}>
          {t("depth.map.meta", { waves: String(waves), prod: String(prodLoad) })}
        </span>
      </figcaption>
      <svg className="topo-map__svg" viewBox="0 0 400 236" role="img" aria-hidden>
        <defs>
          <radialGradient id={`tg-${seed}-g`} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(95, 115, 175, 0.22)" />
            <stop offset="55%" stopColor="rgba(12, 16, 28, 0.08)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <radialGradient id={`tg-${seed}-h`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(220, 210, 255, 0.35)" />
            <stop offset="100%" stopColor="rgba(120, 140, 200, 0.04)" />
          </radialGradient>
        </defs>
        <rect width="400" height="236" fill={`url(#tg-${seed}-g)`} />
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx + 18}
          ry={ry + 12}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
          strokeDasharray="4 14"
          className="topo-map__orbit"
        />
        {relations.slice(0, 5).map((rel, ri) => {
          const a = nodes[rel.from];
          const b = nodes[rel.to];
          if (!a || !b) return null;
          const mx = (a.x + b.x) / 2 + (ri % 2 === 0 ? 10 : -10);
          const my = (a.y + b.y) / 2 - 6;
          return (
            <path
              key={`${rel.from}-${rel.to}-${ri}`}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              fill="none"
              stroke="rgba(130, 150, 200, 0.14)"
              strokeWidth={1.1}
              className="topo-map__link"
            />
          );
        })}
        {nodes.map((node) => {
          const isHero = node.i === heroIdx;
          const fill = isHero ? `url(#tg-${seed}-h)` : "rgba(18, 22, 38, 0.75)";
          const stroke = isHero ? "rgba(200, 205, 235, 0.35)" : "rgba(255,255,255,0.08)";
          return (
            <g key={node.id} className="topo-map__node" data-hero-pull={isHero ? "1" : undefined}>
              <circle cx={node.x} cy={node.y} r={node.rad + (isHero ? 6 : 0)} fill="rgba(80,100,160,0.06)" className="topo-map__halo" />
              <circle cx={node.x} cy={node.y} r={node.rad} fill={fill} stroke={stroke} strokeWidth={isHero ? 1.4 : 1} />
              <text
                x={node.x}
                y={node.y + node.rad + 12}
                textAnchor="middle"
                fill="rgba(165, 175, 200, 0.55)"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.04em"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <style>{`
        .topo-map {
          margin: 0 0 14px;
          padding: 10px 12px 12px;
          border-radius: 12px;
          background: radial-gradient(120% 90% at 50% 0%, rgba(22, 28, 48, 0.5) 0%, rgba(2, 4, 10, 0.72) 62%, rgba(0, 0, 0, 0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.045);
          box-shadow: inset 0 0 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.5);
        }
        .topo-map__cap {
          margin: 0 0 6px;
          padding: 0 4px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .topo-map__title {
          display: block;
          font-size: 0.52rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(155, 168, 200, 0.78);
        }
        .topo-map__sub {
          display: block;
          margin-top: 4px;
          font-size: 0.66rem;
          line-height: 1.35;
          color: rgba(110, 125, 155, 0.65);
        }
        .topo-map__meta {
          display: block;
          margin-top: 6px;
          font-size: 0.52rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(95, 108, 138, 0.55);
        }
        .topo-map__svg {
          display: block;
          width: 100%;
          height: auto;
          max-height: 220px;
        }
      `}</style>
    </figure>
  );
}
