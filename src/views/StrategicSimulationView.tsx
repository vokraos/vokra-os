import { useId, useMemo, useState, type CSSProperties } from "react";
import type {
  ExecutiveForesightMetrics,
  ScenarioId,
  ScenarioOutcomeVector,
  TimeHorizonId,
} from "../lib/predictive-engine/types";
import { usePredictiveEngine } from "../lib/predictive-engine";
import { useSignalFabricOptional } from "../lib/signal-fabric/context";
import { useI18n } from "../lib/i18n/I18nContext";
import { ExecutiveSurface } from "../components/executive-surface/ExecutiveSurface";

function clipSim(s: string, max: number): string {
  const x = s.replace(/\s+/g, " ").trim();
  if (x.length <= max) return x;
  return `${x.slice(0, max - 1).trimEnd()}…`;
}

const HORIZONS: TimeHorizonId[] = ["d7", "d30", "d90", "seasonal", "longTail"];

const FORESIGHT_ROWS: { key: keyof ExecutiveForesightMetrics; msg: string }[] = [
  { key: "futureRiskHorizon", msg: "sim.metric.futureRiskHorizon" },
  { key: "momentumStability", msg: "sim.metric.momentumStability" },
  { key: "opportunityHalfLife", msg: "sim.metric.opportunityHalfLife" },
  { key: "brandIntegrityForecast", msg: "sim.metric.brandIntegrityForecast" },
  { key: "saturationProbability", msg: "sim.metric.saturationProbability" },
  { key: "emotionalRetentionWindow", msg: "sim.metric.emotionalRetentionWindow" },
  { key: "launchSurvivability", msg: "sim.metric.launchSurvivability" },
  { key: "longTermMarginStability", msg: "sim.metric.longTermMarginStability" },
];

const VECTOR_KEYS: { key: keyof ScenarioOutcomeVector; msg: string }[] = [
  { key: "revenuePace", msg: "sim.vector.revenuePace" },
  { key: "saturationRisk", msg: "sim.vector.saturationRisk" },
  { key: "brandMemory", msg: "sim.vector.brandMemory" },
  { key: "loyaltyDepth", msg: "sim.vector.loyaltyDepth" },
  { key: "ctrErosion", msg: "sim.vector.ctrErosion" },
  { key: "longTailSeoMomentum", msg: "sim.vector.longTailSeo" },
  { key: "premiumPerception", msg: "sim.vector.premiumPerception" },
  { key: "exclusivityLongRun", msg: "sim.vector.exclusivityLongRun" },
];

function branchPath(scenario: ScenarioId, idx: number): string {
  const base = 100 + idx * 18;
  if (scenario === "A") return `M 24 ${base} Q 120 ${base - 40} 220 ${base - 22} T 380 ${base - 8}`;
  if (scenario === "B") return `M 24 ${base} Q 130 ${base + 8} 240 ${base + 4} T 380 ${base - 2}`;
  return `M 24 ${base} Q 110 ${base + 36} 230 ${base + 28} T 380 ${base + 14}`;
}

export function StrategicSimulationView() {
  const { t, locale } = useI18n();
  const { horizon, setHorizon, snapshot } = usePredictiveEngine();
  const fabric = useSignalFabricOptional();
  const [focus, setFocus] = useState<ScenarioId>("B");
  const gid = useId().replace(/:/g, "");
  const en = locale === "en";

  const activeScenario = snapshot.scenarios.find((s) => s.id === focus) ?? snapshot.scenarios[1]!;

  const ranked = useMemo(
    () => [...snapshot.scenarios].sort((a, b) => b.probabilityMass - a.probabilityMass),
    [snapshot.scenarios],
  );
  const recommended = ranked[0]!;
  const rejected = ranked[ranked.length - 1]!;

  const scenarioThesis = (sc: (typeof snapshot.scenarios)[number]) => (en ? sc.thesisEn : sc.thesisRu);
  const scenarioName = (sc: (typeof snapshot.scenarios)[number]) => (en ? sc.nameEn : sc.nameRu);
  const firstChainLine = (sc: (typeof snapshot.scenarios)[number]) => {
    const arr = en ? sc.consequenceChainEn : sc.consequenceChainRu;
    return arr[0] ?? "—";
  };

  return (
    <div className="sim-lab" data-sim-horizon={horizon} data-sim-pulse={snapshot.pulseGeneration % 1000}>
      <header className="sim-lab__head">
        <p className="sim-lab__eyebrow">{t("sim.eyebrow")}</p>
        <h1 className="sim-lab__title">{t("sim.title")}</h1>
        <p className="sim-lab__lede">{t("sim.subtitle")}</p>
      </header>

      <ExecutiveSurface tone="dashboard" />

      <section className="sim-lab__pick glass-panel" aria-label={t("sim.pickAria")}>
        <p className="sim-lab__pick-eyebrow">{t("sim.pickEyebrow")}</p>
        <div className="sim-lab__pick-grid">
          <div>
            <span className="sim-lab__pick-k">{t("sim.recommend")}</span>
            <p className="sim-lab__pick-v">
              {recommended.id} · {scenarioName(recommended)} · {(recommended.probabilityMass * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <span className="sim-lab__pick-k">{t("sim.reject")}</span>
            <p className="sim-lab__pick-v">
              {rejected.id} · {scenarioName(rejected)} · {(rejected.probabilityMass * 100).toFixed(0)}%
            </p>
          </div>
          <div className="sim-lab__pick-span">
            <span className="sim-lab__pick-k">{t("sim.pickWhy")}</span>
            <p className="sim-lab__pick-p">{clipSim(scenarioThesis(recommended), 220)}</p>
          </div>
          <div>
            <span className="sim-lab__pick-k">{t("sim.pickOutcome")}</span>
            <p className="sim-lab__pick-p">{clipSim(firstChainLine(recommended), 240)}</p>
          </div>
          <div>
            <span className="sim-lab__pick-k">{t("sim.pickRisk")}</span>
            <p className="sim-lab__pick-p">{clipSim(scenarioThesis(rejected), 240)}</p>
          </div>
        </div>
      </section>

      <div className="sim-lab__horizons" role="tablist" aria-label={t("sim.horizon")}>
        {HORIZONS.map((h) => (
          <button
            key={h}
            type="button"
            role="tab"
            aria-selected={horizon === h}
            className={`sim-lab__horizon-pill ${horizon === h ? "sim-lab__horizon-pill--on" : ""}`}
            onClick={() => setHorizon(h)}
          >
            {t(`sim.horizon.${h}`)}
          </button>
        ))}
      </div>

      <details className="sim-lab__details">
        <summary className="sim-lab__details-sum">{t("sim.detailField")}</summary>
        <section className="sim-lab__grid" aria-labelledby="sim-canvas-title">
        <div className="sim-lab__field glass-panel" aria-labelledby="sim-canvas-title">
          <h2 id="sim-canvas-title" className="sim-lab__h2">
            {t("sim.canvasTitle")}
          </h2>
          <div className="sim-lab__field-inner">
            {snapshot.probabilityLayers.map((layer, i) => (
              <span
                key={layer.id}
                className="sim-lab__orb"
                style={
                  {
                    "--sim-i": i,
                    "--sim-h": layer.hue,
                    "--sim-w": layer.weight,
                  } as CSSProperties
                }
                title={en ? layer.labelEn : layer.labelRu}
              />
            ))}
            <div className="sim-lab__field-caption">
              {snapshot.probabilityLayers.map((layer) => (
                <span key={`${layer.id}-cap`} className="sim-lab__field-chip">
                  {t("sim.layerPrefix")} · {en ? layer.labelEn : layer.labelRu}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sim-lab__branch glass-panel">
          <h2 className="sim-lab__h2">{t("sim.branchTitle")}</h2>
          <svg className="sim-lab__svg" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${gid}-sim-stem-faint`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            {(["A", "B", "C"] as ScenarioId[]).map((sid, idx) => {
              const on = focus === sid;
              return (
                <path
                  key={sid}
                  d={branchPath(sid, idx)}
                  fill="none"
                  strokeWidth={on ? 1.35 : 0.9}
                  stroke={on ? "rgba(180, 195, 235, 0.35)" : "rgba(110, 120, 150, 0.12)"}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  strokeDasharray={on ? "1 0" : "0.06 0.04"}
                  opacity={on ? 1 : 0.55}
                />
              );
            })}
            <line x1="12" y1="110" x2="388" y2="110" stroke={`url(#${gid}-sim-stem-faint)`} strokeWidth="0.35" opacity="0.2" />
          </svg>
          <p className="sim-lab__branch-note">{en ? activeScenario.thesisEn : activeScenario.thesisRu}</p>
        </div>
        </section>
      </details>

      <section className="sim-lab__scenarios" aria-labelledby="sim-sc-title">
        <h2 id="sim-sc-title" className="sim-lab__h2">
          {t("sim.compareTitle")}
        </h2>
        <div className="sim-lab__scenario-row">
          {snapshot.scenarios.map((sc) => (
            <article
              key={sc.id}
              className={`sim-lab__scenario glass-panel ${focus === sc.id ? "sim-lab__scenario--focus" : ""}`}
            >
              <button type="button" className="sim-lab__scenario-hit" onClick={() => setFocus(sc.id)}>
                <span className="sim-lab__scenario-id">{sc.id}</span>
                <span className="sim-lab__scenario-mass">{(sc.probabilityMass * 100).toFixed(0)}%</span>
              </button>
              <h3 className="sim-lab__scenario-name">{en ? sc.nameEn : sc.nameRu}</h3>
              <ol className="sim-lab__chain">
                {(en ? sc.consequenceChainEn : sc.consequenceChainRu).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <details className="sim-lab__details">
        <summary className="sim-lab__details-sum">{t("sim.detailMetrics")}</summary>
        {fabric ? (
          <section className="sim-lab__fabric glass-panel" aria-label={t("sf.fabricSimAria")}>
            <div className="sim-lab__fabric-row">
              <span className="sim-lab__fabric-k">{t("sf.fabricSimTitle")}</span>
              <span className="sim-lab__fabric-v">{fabric.cascades[0]?.headIntensity ?? 0}%</span>
            </div>
            <p className="sim-lab__fabric-body">{fabric.cascades[0]?.stepsRu[0] ?? "—"}</p>
            <p className="sim-lab__fabric-meta">
              {t("sf.fabricSimPressure")}: {fabric.pressures.market}% / {fabric.pressures.brand}% / {fabric.pressures.production}%
            </p>
          </section>
        ) : null}

        <div className="sim-lab__meta glass-panel">
          <div className="sim-lab__meta-cell">
            <span className="sim-lab__meta-k">{t("sim.pulseMeta")}</span>
            <span className="sim-lab__meta-v">#{snapshot.pulseGeneration}</span>
          </div>
          <div className="sim-lab__meta-cell">
            <span className="sim-lab__meta-k">{t("sim.meta.volatility")}</span>
            <span className="sim-lab__diffusion" style={{ "--sim-v": snapshot.volatilityIndex } as CSSProperties} />
          </div>
          <div className="sim-lab__meta-cell">
            <span className="sim-lab__meta-k">{t("sim.meta.signalLongevity")}</span>
            <span className="sim-lab__diffusion" style={{ "--sim-v": snapshot.signalLongevity } as CSSProperties} />
          </div>
          <div className="sim-lab__meta-cell">
            <span className="sim-lab__meta-k">{t("sim.meta.expansionBias")}</span>
            <span className="sim-lab__diffusion" style={{ "--sim-v": snapshot.expansionBias } as CSSProperties} />
          </div>
          <div className="sim-lab__meta-cell">
            <span className="sim-lab__meta-k">{t("sim.meta.decayPressure")}</span>
            <span className="sim-lab__diffusion sim-lab__diffusion--warn" style={{ "--sim-v": snapshot.decayPressure } as CSSProperties} />
          </div>
        </div>

      <section className="sim-lab__vectors glass-panel" aria-labelledby="sim-vec-title">
        <h2 id="sim-vec-title" className="sim-lab__h2 sim-lab__h2--inline">
          {t("sim.scenarioFocus")} · {focus}
        </h2>
        <div className="sim-lab__vector-grid">
          {VECTOR_KEYS.map(({ key, msg }) => (
            <div key={key} className="sim-lab__vector-cell">
              <span className="sim-lab__vector-k">{t(msg)}</span>
              <span className="sim-lab__vector-diff" style={{ "--sim-v": activeScenario.outcome[key] } as CSSProperties} />
            </div>
          ))}
        </div>
      </section>

      <div className="sim-lab__split">
        <section className="sim-lab__foresight glass-panel" aria-labelledby="sim-fr-title">
          <h2 id="sim-fr-title" className="sim-lab__h2">
            {t("sim.foresightTitle")}
          </h2>
          <ul className="sim-lab__foresight-list">
            {FORESIGHT_ROWS.map(({ key, msg }) => (
              <li key={key} className="sim-lab__foresight-row">
                <span className="sim-lab__foresight-k">{t(msg)}</span>
                <span className="sim-lab__diffusion" style={{ "--sim-v": snapshot.foresight[key] } as CSSProperties} />
              </li>
            ))}
          </ul>
        </section>

        <section className="sim-lab__pressure glass-panel" aria-labelledby="sim-pr-title">
          <h2 id="sim-pr-title" className="sim-lab__h2">
            {t("sim.pressureTitle")}
          </h2>
          <ul className="sim-lab__pressure-list">
            {snapshot.marketPressure.map((p) => (
              <li key={p.id} className="sim-lab__pressure-row">
                <div className="sim-lab__pressure-head">
                  <span>{en ? p.labelEn : p.labelRu}</span>
                  <span className="sim-lab__pressure-win">{en ? p.windowEn : p.windowRu}</span>
                </div>
                <span className="sim-lab__pressure-field" style={{ "--sim-p": p.intensity } as CSSProperties} />
              </li>
            ))}
          </ul>
        </section>
      </div>
      </details>

      <details className="sim-lab__details">
        <summary className="sim-lab__details-sum">{t("sim.detailOps")}</summary>
      <section className="sim-lab__resource glass-panel" aria-labelledby="sim-res-title">
        <h2 id="sim-res-title" className="sim-lab__h2">
          {t("sim.resourceTitle")}
        </h2>
        <p className="sim-lab__resource-summary">{en ? snapshot.resourceImpact.summaryEn : snapshot.resourceImpact.summaryRu}</p>
        <div className="sim-lab__resource-grid">
          {(
            [
              ["dtf", snapshot.resourceImpact.dtfQueueLoad],
              ["fbo", snapshot.resourceImpact.fboPressure],
              ["packaging", snapshot.resourceImpact.packagingBottleneck],
              ["content", snapshot.resourceImpact.contentProductionStrain],
              ["sku", snapshot.resourceImpact.skuManagementComplexity],
            ] as const
          ).map(([k, val]) => (
            <div key={k} className="sim-lab__resource-cell">
              <span className="sim-lab__resource-k">{t(`sim.resource.${k}`)}</span>
              <span className="sim-lab__diffusion" style={{ "--sim-v": val } as CSSProperties} />
            </div>
          ))}
        </div>
      </section>

      <section className="sim-lab__memory glass-panel" aria-labelledby="sim-mem-title">
        <h2 id="sim-mem-title" className="sim-lab__h2">
          {t("sim.memoryTitle")}
        </h2>
        <ul className="sim-lab__memory-list">
          {(en ? snapshot.adaptiveMemoryEn : snapshot.adaptiveMemoryRu).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
      </details>

      <p className="sim-lab__disclaimer">{t("sim.disclaimer")}</p>

      <style>{`
        .sim-lab {
          padding: 8px 4px 48px;
          max-width: 1180px;
          margin: 0 auto;
          position: relative;
        }
        .sim-lab__head {
          margin-bottom: 28px;
        }
        .sim-lab__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 12px;
        }
        .sim-lab__title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.65rem, 3.2vw, 2.35rem);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 14px;
          line-height: 1.05;
        }
        .sim-lab__lede {
          margin: 0;
          max-width: 52rem;
          color: var(--muted);
          font-size: 0.95rem;
          line-height: 1.55;
        }
        .sim-lab__pick {
          margin-bottom: 18px;
          padding: 16px 18px 18px;
          border-radius: var(--radius-xl);
        }
        .sim-lab__pick-eyebrow {
          margin: 0 0 12px;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(150, 162, 190, 0.78);
        }
        .sim-lab__pick-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }
        @media (max-width: 720px) {
          .sim-lab__pick-grid {
            grid-template-columns: 1fr;
          }
        }
        .sim-lab__pick-span {
          grid-column: 1 / -1;
        }
        .sim-lab__pick-k {
          display: block;
          font-size: 0.52rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(130, 142, 168, 0.72);
          margin-bottom: 6px;
        }
        .sim-lab__pick-v {
          margin: 0;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(220, 226, 242, 0.95);
        }
        .sim-lab__pick-p {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.45;
          color: rgba(175, 186, 212, 0.9);
        }
        .sim-lab__details {
          margin-bottom: 18px;
          border-radius: var(--radius-xl);
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.18);
          padding: 0 14px 14px;
        }
        .sim-lab__details-sum {
          list-style: none;
          cursor: pointer;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(145, 158, 188, 0.75);
          padding: 12px 4px 10px;
        }
        .sim-lab__details-sum::-webkit-details-marker {
          display: none;
        }
        .sim-lab__details[open] .sim-lab__details-sum {
          margin-bottom: 10px;
          color: rgba(185, 198, 225, 0.9);
        }
        .sim-lab__details .sim-lab__fabric,
        .sim-lab__details .sim-lab__meta,
        .sim-lab__details .sim-lab__vectors,
        .sim-lab__details .sim-lab__split {
          margin-bottom: 14px;
        }
        .sim-lab__fabric {
          margin-bottom: 18px;
          padding: 14px 18px;
          border-radius: var(--radius-xl);
        }
        .sim-lab__fabric-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }
        .sim-lab__fabric-k {
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .sim-lab__fabric-v {
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: rgba(160, 175, 210, 0.65);
        }
        .sim-lab__fabric-body {
          margin: 0 0 8px;
          font-size: 0.8rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .sim-lab__fabric-meta {
          margin: 0;
          font-size: 0.68rem;
          color: rgba(140, 155, 185, 0.55);
        }
        .sim-lab__horizons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }
        .sim-lab__horizon-pill {
          border-radius: 99px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.25);
          color: var(--muted);
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 10px 16px;
          cursor: pointer;
          transition: border-color 0.2s var(--ease-out), color 0.2s var(--ease-out), background 0.2s var(--ease-out);
        }
        .sim-lab__horizon-pill--on {
          border-color: rgba(123, 143, 255, 0.45);
          color: var(--text);
          background: rgba(123, 143, 255, 0.08);
        }
        .sim-lab__meta {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          padding: 16px 18px;
          margin-bottom: 22px;
        }
        @media (max-width: 900px) {
          .sim-lab__meta {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .sim-lab__meta-cell {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .sim-lab__meta-k {
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .sim-lab__meta-v {
          font-family: var(--font-display);
          font-size: 1.1rem;
          letter-spacing: 0.08em;
        }
        .sim-lab__diffusion {
          display: block;
          height: 3px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }
        .sim-lab__diffusion::after {
          content: "";
          position: absolute;
          inset: 0;
          width: calc(var(--sim-v, 50) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(123, 143, 255, 0.15), rgba(200, 210, 245, 0.45));
          box-shadow: 0 0 18px rgba(123, 143, 255, 0.12);
        }
        .sim-lab__diffusion--warn::after {
          background: linear-gradient(90deg, rgba(180, 140, 110, 0.2), rgba(220, 160, 120, 0.38));
          box-shadow: 0 0 14px rgba(200, 140, 100, 0.1);
        }
        .sim-lab__grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          margin-bottom: 22px;
        }
        @media (max-width: 960px) {
          .sim-lab__grid {
            grid-template-columns: 1fr;
          }
        }
        .sim-lab__field,
        .sim-lab__branch,
        .sim-lab__vectors,
        .sim-lab__foresight,
        .sim-lab__pressure,
        .sim-lab__resource,
        .sim-lab__memory {
          padding: 20px 22px;
          border-radius: var(--radius-xl);
        }
        .sim-lab__h2 {
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 16px;
          font-weight: 500;
        }
        .sim-lab__h2--inline {
          margin-bottom: 14px;
        }
        .sim-lab__field-inner {
          position: relative;
          min-height: 220px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: radial-gradient(ellipse 70% 55% at 50% 100%, rgba(30, 32, 42, 0.9), rgba(8, 8, 10, 0.96));
        }
        .sim-lab__orb {
          position: absolute;
          width: clamp(120px, 42%, 220px);
          height: clamp(120px, 42%, 220px);
          left: calc(8% + var(--sim-i) * 11%);
          top: calc(12% + var(--sim-i) * 7%);
          border-radius: 50%;
          opacity: calc(0.12 + var(--sim-w) * 1.1);
          background: radial-gradient(
            circle at 40% 35%,
            hsla(var(--sim-h), 28%, 62%, 0.22),
            hsla(var(--sim-h), 18%, 20%, 0.04) 62%,
            transparent 72%
          );
          filter: blur(0.5px);
          animation: sim-orb-drift ${18 + 6}s ease-in-out infinite alternate;
          animation-delay: calc(var(--sim-i) * -2.2s);
        }
        @keyframes sim-orb-drift {
          from {
            transform: translate(0, 0) scale(1);
          }
          to {
            transform: translate(12px, -10px) scale(1.06);
          }
        }
        .sim-lab__field-caption {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .sim-lab__field-chip {
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.42);
          padding: 5px 9px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.35);
        }
        .sim-lab__branch {
          display: flex;
          flex-direction: column;
        }
        .sim-lab__svg {
          width: 100%;
          height: auto;
          flex: 1;
          min-height: 160px;
        }
        .sim-lab__branch-note {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .sim-lab__scenarios {
          margin-bottom: 22px;
        }
        .sim-lab__scenario-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 900px) {
          .sim-lab__scenario-row {
            grid-template-columns: 1fr;
          }
        }
        .sim-lab__scenario {
          padding: 0;
          overflow: hidden;
          border-radius: var(--radius-xl);
          transition: box-shadow 0.25s var(--ease-out), border-color 0.25s var(--ease-out);
        }
        .sim-lab__scenario--focus {
          box-shadow: 0 0 0 1px rgba(123, 143, 255, 0.35), 0 24px 60px rgba(0, 0, 0, 0.45);
        }
        .sim-lab__scenario-hit {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border: none;
          border-bottom: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.2);
          color: var(--text);
          cursor: pointer;
          font-family: var(--font-body);
        }
        .sim-lab__scenario-id {
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: 0.2em;
          font-size: 0.85rem;
        }
        .sim-lab__scenario-mass {
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          color: var(--muted);
        }
        .sim-lab__scenario-name {
          margin: 14px 16px 10px;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .sim-lab__chain {
          margin: 0 16px 18px;
          padding-left: 1.1rem;
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.55;
        }
        .sim-lab__vectors {
          margin-bottom: 22px;
        }
        .sim-lab__vector-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px 18px;
        }
        @media (max-width: 900px) {
          .sim-lab__vector-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .sim-lab__vector-cell {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .sim-lab__vector-k {
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .sim-lab__vector-diff {
          display: block;
          height: 2px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }
        .sim-lab__vector-diff::after {
          content: "";
          position: absolute;
          inset: 0;
          width: calc(var(--sim-v, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(90, 100, 130, 0.2), rgba(160, 175, 220, 0.35));
        }
        .sim-lab__split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }
        @media (max-width: 900px) {
          .sim-lab__split {
            grid-template-columns: 1fr;
          }
        }
        .sim-lab__foresight-list,
        .sim-lab__pressure-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sim-lab__foresight-row {
          display: grid;
          grid-template-columns: 1fr minmax(80px, 38%);
          gap: 12px;
          align-items: center;
        }
        .sim-lab__foresight-k {
          font-size: 0.78rem;
          color: var(--muted);
        }
        .sim-lab__pressure-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sim-lab__pressure-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .sim-lab__pressure-win {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
          white-space: nowrap;
        }
        .sim-lab__pressure-field {
          display: block;
          height: 5px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.04);
          position: relative;
          overflow: hidden;
        }
        .sim-lab__pressure-field::after {
          content: "";
          position: absolute;
          inset: 0;
          width: calc(var(--sim-p, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            rgba(70, 78, 100, 0.15),
            rgba(123, 143, 255, 0.18),
            rgba(200, 205, 225, 0.12)
          );
          opacity: 0.85;
        }
        .sim-lab__resource-summary {
          margin: 0 0 16px;
          font-size: 0.84rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .sim-lab__resource-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 900px) {
          .sim-lab__resource-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .sim-lab__resource-cell {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .sim-lab__resource-k {
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .sim-lab__memory-list {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--muted);
          font-size: 0.84rem;
          line-height: 1.65;
        }
        .sim-lab__disclaimer {
          margin: 28px 0 0;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: var(--faint);
        }
      `}</style>
    </div>
  );
}
