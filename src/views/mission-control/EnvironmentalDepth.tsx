import type { CSSProperties } from "react";

export type EnvironmentalDepthProps = {
  marketStress: number;
};

export function EnvironmentalDepth({ marketStress }: EnvironmentalDepthProps) {
  const style = { "--mc-depth-stress": String(marketStress) } as CSSProperties;
  return (
    <div className="mc-depth" style={style} aria-hidden>
      <span className="mc-depth__void" />
      <span className="mc-depth__gradient" />
      <span className="mc-depth__haze" />
      <span className="mc-depth__mid" />
      <span className="mc-depth__nebula" />
      <span className="mc-depth__shadow" />
      <span className="mc-depth__lens" />
      <span className="mc-depth__dust" />
      <span className="mc-depth__grain" />
      <span className="mc-depth__grid" />
    </div>
  );
}
