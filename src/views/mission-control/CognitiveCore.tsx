import { COG_TELEMETRY_TAG, MODE_CORE_LABEL, type CognitiveLayerId, type MissionSystemMode } from "./mcConstants";

export type CognitiveCoreProps = {
  systemMode: MissionSystemMode;
  cognitiveLayer: CognitiveLayerId;
  marketStress: number;
  coreProcessing: boolean;
  routeAwake: boolean;
};

export function CognitiveCore({
  systemMode,
  cognitiveLayer,
  marketStress,
  coreProcessing,
  routeAwake,
}: CognitiveCoreProps) {
  const stressPct = Math.round(marketStress * 100);
  return (
    <section
      className="mc-ego__core mc-cognitive"
      data-mc-core-processing={coreProcessing ? "1" : ""}
      data-mc-core-route-awake={routeAwake ? "1" : ""}
    >
      <div className="mc-ego__core-field mc-cognitive__field" aria-hidden>
        <div className="mc-cognitive__shell mc-cognitive__shell--a" />
        <div className="mc-cognitive__shell mc-cognitive__shell--b" />
        <div className="mc-cognitive__shockwaves">
          <span className="mc-cognitive__shock mc-cognitive__shock--1" />
          <span className="mc-cognitive__shock mc-cognitive__shock--2" />
          <span className="mc-cognitive__shock mc-cognitive__shock--3" />
        </div>
        <div className="mc-cognitive__comp-waves">
          <span className="mc-cognitive__comp mc-cognitive__comp--a" />
          <span className="mc-cognitive__comp mc-cognitive__comp--b" />
        </div>
        <span className="mc-ego__core-fog" />
        <span className="mc-ego__core-telemetry" />
        <div className="mc-cognitive__orbit-outer">
          <span className="mc-cognitive__orbit-ticks" />
        </div>
        <div className="mc-ego__core-rings">
          <span className="mc-ego__core-ring mc-ego__core-ring--a" />
          <span className="mc-ego__core-ring mc-ego__core-ring--b" />
          <span className="mc-ego__core-ring mc-ego__core-ring--c" />
          <span className="mc-cognitive__ring-d" />
        </div>
        <div className="mc-cognitive__orbit-particles" aria-hidden>
          <span className="mc-cognitive__orb-dot mc-cognitive__orb-dot--1" />
          <span className="mc-cognitive__orb-dot mc-cognitive__orb-dot--2" />
          <span className="mc-cognitive__orb-dot mc-cognitive__orb-dot--3" />
        </div>
        <div className="mc-ego__core-sats" aria-hidden>
          <span className="mc-ego__core-sat mc-ego__core-sat--1" />
          <span className="mc-ego__core-sat mc-ego__core-sat--2" />
          <span className="mc-ego__core-sat mc-ego__core-sat--3" />
        </div>
        <div className="mc-ego__core-nucleus">
          <span className="mc-cognitive__darkmass" />
          <span className="mc-cognitive__topology" />
          <span className="mc-ego__core-energy" />
          <span className="mc-cognitive__spectral" />
          <span className="mc-cognitive__flicker" />
          <span className="mc-ego__core-shade" />
        </div>
        <span className="mc-ego__core-glow" />
        <span className="mc-ego__core-vignette" />
        <span className="mc-cognitive__lens" />
      </div>
      <div className="mc-ego__core-copy">
        <span className="mc-ego__core-label">Когнитивный процессор</span>
        <span className="mc-ego__core-state">{MODE_CORE_LABEL[systemMode]}</span>
        <span className="mc-ego__core-layer">Слой {COG_TELEMETRY_TAG[cognitiveLayer]}</span>
        <span className="mc-cognitive__stress" aria-live="polite">
          Давление контура {stressPct}%
        </span>
      </div>
    </section>
  );
}
