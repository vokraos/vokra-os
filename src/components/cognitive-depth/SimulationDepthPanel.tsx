import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { empireLaunchWaves } from "../../lib/cognitive-depth/sku-empire";
import { simulationChamberProjections } from "../../lib/cognitive-depth/strategic-organism";
import { entityCoreSimulationProjections } from "../../lib/entity-core";
import { useCognitiveDepth } from "../../lib/cognitive-depth";

export function SimulationDepthPanel({ variant }: { variant: "dashboard" | "mission" | "orchestrator" }) {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();
  const snap = useExecutionOrchestrator();
  const waves = useMemo(() => empireLaunchWaves(snap.pulseGeneration), [snap.pulseGeneration]);
  const projections = useMemo(() => {
    const legacy = simulationChamberProjections(snap.pulseGeneration);
    const next = entityCoreSimulationProjections(snap.pulseGeneration);
    return [...next.slice(0, 4), ...legacy.slice(0, 1)];
  }, [snap.pulseGeneration]);

  if (mode === "command") {
    return null;
  }

  return (
    <>
      <div className={`sim-depth sim-depth--${variant}`} aria-label={t("depth.sim.aria")}>
        <header className="sim-depth__head">
          <span className="sim-depth__title">{t("depth.sim.title")}</span>
          <span className="sim-depth__sub">{t("depth.sim4.sub")}</span>
        </header>
        <div className="sim-depth__waves" aria-label={t("depth.sim.wavesAria")}>
          {waves.map((w) => (
            <span key={w.wave} className="sim-depth__wave-pill">
              {t("depth.ops.wave.label", { n: String(w.wave) })} · {t(`depth.ops.wave.${w.state}`)}
            </span>
          ))}
        </div>
        <ol className="sim-depth__ol sim-depth__ol--chamber">
          {projections.map((p, i) => (
            <li key={`${p.ifKey}-${i}`} className="sim-depth__li sim-depth__li--proj">
              <p className="sim-depth__if">{t(p.ifKey)}</p>
              <p className="sim-depth__then">{t(p.thenKey, p.vars)}</p>
            </li>
          ))}
        </ol>
      </div>
      <style>{`
        .sim-depth {
          margin: 0 0 16px;
          padding: 14px 16px 16px;
          border-radius: 10px 18px 14px 12px;
          border: 1px solid rgba(255, 195, 150, 0.12);
          background: radial-gradient(120% 80% at 10% 0%, rgba(48, 32, 22, 0.45) 0%, transparent 50%),
            linear-gradient(168deg, rgba(14, 10, 8, 0.94) 0%, rgba(4, 3, 2, 0.98) 100%);
          box-shadow: inset 0 0 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 220, 180, 0.04), 0 10px 36px rgba(0, 0, 0, 0.35);
        }
        .sim-depth--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .sim-depth__head {
          margin-bottom: 10px;
        }
        .sim-depth__title {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(220, 190, 150, 0.88);
        }
        .sim-depth__sub {
          display: block;
          margin-top: 4px;
          font-size: 0.7rem;
          line-height: 1.4;
          color: rgba(155, 140, 125, 0.62);
        }
        .sim-depth__waves {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .sim-depth__wave-pill {
          font-size: 0.52rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 200, 140, 0.18);
          color: rgba(230, 205, 175, 0.85);
          background: rgba(0, 0, 0, 0.35);
        }
        .sim-depth__ol {
          margin: 0;
          padding: 0 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sim-depth__li {
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .sim-depth__li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .sim-depth__if {
          margin: 0 0 6px;
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(200, 165, 130, 0.72);
        }
        .sim-depth__then {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.42;
          color: rgba(238, 230, 218, 0.94);
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
