import type { CSSProperties } from "react";
import { useMemo } from "react";
import { AGENTS, AGENT_MARKET_KEYS, WARFARE_ROW_META, type WarfarePressure } from "./mcConstants";

export type MarketPressureProps = {
  warfarePressure: WarfarePressure;
  hoveredAgentIndex: number | null;
  /** When wrapped in a collapsible, hide the inner title row (summary provides context). */
  suppressHeader?: boolean;
};

function miniTrendPoints(key: string, v: number): string {
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed += key.charCodeAt(i) * (i + 3);
  const n = 12;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin((seed + i * 17) * 0.11) * 4 + Math.cos((seed + i * 9) * 0.09) * 2.5;
    const y = 11 - (v / 100) * 9 + wobble * 0.28;
    const x = (i / (n - 1)) * 40;
    pts.push(`${x.toFixed(1)},${Math.min(12, Math.max(0.5, y)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function MarketPressure({ warfarePressure, hoveredAgentIndex, suppressHeader }: MarketPressureProps) {
  const hotMarketKeys =
    hoveredAgentIndex != null && AGENTS[hoveredAgentIndex]
      ? new Set(AGENT_MARKET_KEYS[AGENTS[hoveredAgentIndex]!.persona])
      : null;

  const marketTemp = useMemo(() => {
    const vals = WARFARE_ROW_META.map((r) => warfarePressure[r.key]);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [warfarePressure]);

  return (
    <aside className="mc-ego__market mc-market">
      <div className="mc-market__field" aria-hidden />
      {!suppressHeader ? (
        <div className="mc-ego__market-hdr">
          <span className="mc-ego__market-title">Тактическое поле рынка</span>
          <span className="mc-ego__market-temp" title="Средний индекс контура">
            индекс {marketTemp}%
          </span>
        </div>
      ) : null}
      <ul className="mc-ego__bp-list">
        {WARFARE_ROW_META.map((row) => {
          const v = warfarePressure[row.key];
          const isHot = hotMarketKeys?.has(row.key);
          const pts = miniTrendPoints(row.key, v);
          return (
            <li
              key={row.key}
              className={`mc-ego__bp-row${isHot ? " mc-ego__bp-row--hot" : ""}`}
              data-mc-vector-zone={v > 78 ? "overloaded" : v > 58 ? "strained" : v < 30 ? "aligned" : "nominal"}
              style={{ "--mc-bp": String(v) } as CSSProperties}
            >
              <div className="mc-ego__bp-top">
                <span className="mc-ego__bp-label">{row.label}</span>
                <span className="mc-ego__bp-val">{Math.round(v)}</span>
              </div>
              <div className="mc-ego__bp-bar" aria-hidden>
                <span className="mc-ego__bp-fill" />
                <span className="mc-ego__bp-fill-veil" />
              </div>
              <svg className="mc-market__trend" viewBox="0 0 40 12" preserveAspectRatio="none" aria-hidden>
                <polyline className="mc-market__trend-line" points={pts} fill="none" />
              </svg>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
