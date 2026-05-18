import { useCallback, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { PageHeaderCompact } from "../components/shell/PageHeaderCompact";
import { CollapsibleSection } from "../components/shell/CollapsibleSection";
import { useSelfEvolvingStrategy } from "../lib/self-evolving-strategy";
import { selfEvolvingToJson, selfEvolvingToMarkdown } from "../lib/self-evolving-strategy/export";
import {
  evolutionTrendLabelRu,
  selectDegradedLoops,
  selectReinforcedLoops,
  selectStrongestLoops,
} from "../lib/self-evolving-strategy/selectors";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadText } from "../lib/markdown";

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

type Props = { onNavigate: (id: NavId) => void };

export function StrategyEvolutionView({ onNavigate }: Props) {
  const { t } = useI18n();
  const { snapshot: snap } = useSelfEvolvingStrategy();
  const [toast, setToast] = useState<string | null>(null);

  const exportMd = useCallback(() => {
    downloadText(`vokra-strategy-evolution-${snap.pulseGeneration}.md`, selfEvolvingToMarkdown(snap));
  }, [snap]);

  const exportJson = useCallback(() => {
    downloadText(`vokra-strategy-evolution-${snap.pulseGeneration}.json`, selfEvolvingToJson(snap));
  }, [snap]);

  const copyMd = useCallback(async () => {
    await copyToClipboard(selfEvolvingToMarkdown(snap));
    setToast(t("ev.toastCopied"));
    window.setTimeout(() => setToast(null), 2400);
  }, [snap, t]);

  const saveToMemory = useCallback(() => {
    recordGeneration({
      module: "strategy_evolution",
      title: `Strategy evolution · pulse ${snap.pulseGeneration}`,
      content: selfEvolvingToMarkdown(snap),
      mime: "text/markdown",
      tags: ["strategy_evolution", "vokra_os"],
    });
    setToast(t("ev.savedMemory"));
    window.setTimeout(() => setToast(null), 2400);
  }, [snap, t]);

  const strongest = selectStrongestLoops(snap, 6);
  const degraded = selectDegradedLoops(snap);
  const reinforced = selectReinforcedLoops(snap);
  const trend = evolutionTrendLabelRu(snap);

  const weightEntries = Object.entries(snap.weights) as [keyof typeof snap.weights, number][];

  return (
    <div className="ev">
      <PageHeaderCompact
        eyebrow={t("ev.eyebrow")}
        title={t("ev.title")}
        purpose={t("ev.subtitle")}
        actions={
          <>
            <button type="button" className="ev__btn" onClick={exportMd}>
              {t("ev.exportMd")}
            </button>
            <button type="button" className="ev__btn" onClick={exportJson}>
              {t("ev.exportJson")}
            </button>
            <button type="button" className="ev__btn" onClick={() => void copyMd()}>
              {t("ev.copyMd")}
            </button>
            <button type="button" className="ev__btn ev__btn--pri" onClick={saveToMemory}>
              {t("ev.saveMemory")}
            </button>
          </>
        }
        meta={
          <CollapsibleSection title={t("ev.related")}>
            <nav className="ev__links" aria-label={t("ev.related")}>
              <button type="button" className="ev__link" onClick={() => onNavigate("executiveMemory")}>
                {t("nav.executiveMemory")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("memory")}>
                {t("nav.memory")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("missionControl")}>
                {t("nav.missionControl")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("strategicSimulation")}>
                {t("nav.strategicSimulation")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("temporalStrategy")}>
                {t("nav.temporalStrategy")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("executionOrchestrator")}>
                {t("nav.executionOrchestrator")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("signalFabric")}>
                {t("nav.signalFabric")}
              </button>
              <button type="button" className="ev__link" onClick={() => onNavigate("organismModel")}>
                {t("nav.organismModel")}
              </button>
            </nav>
          </CollapsibleSection>
        }
      />

      <section className="ev__atmos glass-panel">
        <p className="ev__summary">{snap.summaryRu}</p>
        <p className="ev__trend">{t("ev.trend")} {trend}</p>
        <div className="ev__row">
          <span className="ev__k">{t("ev.maturity")}</span>
          <span className="ev__v">{Math.round(snap.maturity01 * 100)}%</span>
          <span className="ev__k">{t("ev.adaptationPressure")}</span>
          <span className="ev__v">{Math.round(snap.adaptationPressure01 * 100)}%</span>
          <span className="ev__k">{t("ev.evolvingConfidence")}</span>
          <span className="ev__v">{Math.round(snap.evolvingConfidence01 * 100)}%</span>
        </div>
      </section>

      <div className="ev__grid">
        <section className="ev__panel glass-panel">
          <h2 className="ev__h2">{t("ev.weightShifts")}</h2>
          <ul className="ev__weights">
            {weightEntries.map(([k, v]) => (
              <li key={k} className="ev__w-row">
                <span className="ev__w-k">{k}</span>
                <span className="ev__w-v">{v.toFixed(3)}</span>
                <span className="ev__w-d" data-ev-d={(snap.weightDeltas[k] ?? 0) >= 0 ? "up" : "down"}>
                  {(snap.weightDeltas[k] ?? 0) >= 0 ? "+" : ""}
                  {(snap.weightDeltas[k] ?? 0).toFixed(3)}
                </span>
                <div className="ev__w-bar" style={{ "--ev-p": clamp01(v) } as CSSProperties} aria-hidden />
              </li>
            ))}
          </ul>
        </section>

        <section className="ev__panel glass-panel">
          <h2 className="ev__h2">{t("ev.strongLoops")}</h2>
          <ul className="ev__loops">
            {strongest.map((l) => (
              <li key={l.id} className="ev__loop" data-ev-w={l.memoryWeight}>
                <div className="ev__loop-top">
                  <span className="ev__loop-id">{l.id}</span>
                  <span className="ev__loop-stat">
                    r{l.recurrence} · c{(l.confidence01 * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="ev__loop-body">{l.labelRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ev__panel glass-panel">
          <h2 className="ev__h2">{t("ev.degraded")}</h2>
          <ul className="ev__list-plain">
            {degraded.length ? degraded.map((l) => <li key={l.id}>{l.labelRu}</li>) : <li>{t("ev.emptyDegraded")}</li>}
          </ul>
          <h2 className="ev__h2 ev__h2--sub">{t("ev.reinforced")}</h2>
          <ul className="ev__list-plain">
            {reinforced.length ? reinforced.map((l) => <li key={l.id}>{l.labelRu}</li>) : <li>{t("ev.emptyReinforced")}</li>}
          </ul>
        </section>

        <section className="ev__panel glass-panel">
          <h2 className="ev__h2">{t("ev.unstable")}</h2>
          <ul className="ev__list-plain">
            {snap.unstableBehaviorsRu.length ? snap.unstableBehaviorsRu.map((x, i) => <li key={i}>{x}</li>) : <li>{t("ev.emptyUnstable")}</li>}
          </ul>
          <h2 className="ev__h2 ev__h2--sub">{t("ev.recovered")}</h2>
          <ul className="ev__list-plain">
            {snap.recoveredSystemsRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className="ev__panel glass-panel ev__panel--wide">
          <h2 className="ev__h2">{t("ev.futureVectors")}</h2>
          <ul className="ev__list-plain">
            {snap.futureVectorsRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className="ev__panel glass-panel ev__panel--wide">
          <h2 className="ev__h2">{t("ev.trajectory")}</h2>
          {snap.trajectory.length === 0 ? (
            <p className="ev__muted">{t("ev.emptyTrajectory")}</p>
          ) : (
            <ul className="ev__traj">
              {snap.trajectory.slice(-10).map((p) => (
                <li key={p.pulse} className="ev__traj-row">
                  <span className="ev__traj-p">p{p.pulse}</span>
                  <span className="ev__traj-m">m{(p.strategicMaturity01 * 100).toFixed(0)}%</span>
                  <span className="ev__traj-a">adapt {(p.adaptationQuality01 * 100).toFixed(0)}%</span>
                  <span className="ev__traj-n">narr {(p.narrativeCoherence01 * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {toast ? (
        <div className="ev__toast" role="status">
          {toast}
        </div>
      ) : null}

      <style>{`
        .ev { padding: 0 0 56px; }
        .ev__btn {
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: transparent;
          color: rgba(210, 215, 232, 0.85);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 9px 12px;
          cursor: pointer;
        }
        .ev__btn:hover { border-color: rgba(200, 210, 235, 0.35); color: var(--text); }
        .ev__btn--pri { border-color: rgba(200, 210, 235, 0.42); }
        .ev__links { display: flex; flex-wrap: wrap; gap: 8px 12px; }
        .ev__link {
          border: none; background: transparent; color: rgba(150, 160, 185, 0.75);
          font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; padding: 0;
        }
        .ev__link:hover { color: rgba(220, 225, 240, 0.95); }
        .ev__atmos {
          padding: 20px 22px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.06);
          position: relative; overflow: hidden;
        }
        .ev__atmos::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.05;
          background: radial-gradient(ellipse 80% 55% at 80% 0%, rgba(140, 160, 200, 0.35), transparent 55%);
        }
        .ev__summary, .ev__trend { position: relative; z-index: 1; margin: 0 0 10px; font-size: 0.82rem; line-height: 1.55; color: rgba(170, 182, 208, 0.88); }
        .ev__trend { font-size: 0.76rem; color: rgba(150, 165, 190, 0.78); }
        .ev__row { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 0.72rem; color: rgba(195, 205, 225, 0.9); }
        .ev__k { letter-spacing: 0.2em; text-transform: uppercase; font-size: 0.52rem; color: var(--faint); }
        .ev__v { font-family: var(--font-display); letter-spacing: 0.1em; }
        .ev__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        @media (max-width: 900px) { .ev__grid { grid-template-columns: 1fr; } }
        .ev__panel { padding: 16px 18px; border: 1px solid rgba(255, 255, 255, 0.05); }
        .ev__panel--wide { grid-column: 1 / -1; }
        .ev__h2 { font-size: 0.55rem; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(130, 145, 170, 0.65); margin: 0 0 12px; }
        .ev__h2--sub { margin-top: 16px; }
        .ev__weights { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .ev__w-row { display: grid; grid-template-columns: 1fr auto auto; gap: 6px 10px; align-items: center; font-size: 0.68rem; color: rgba(165, 178, 200, 0.85); }
        .ev__w-k { font-size: 0.58rem; letter-spacing: 0.08em; color: rgba(130, 145, 170, 0.65); word-break: break-all; }
        .ev__w-v { font-variant-numeric: tabular-nums; }
        .ev__w-d { font-size: 0.58rem; opacity: 0.75; }
        .ev__w-d[data-ev-d="up"] { color: rgba(170, 200, 185, 0.75); }
        .ev__w-d[data-ev-d="down"] { color: rgba(200, 175, 165, 0.75); }
        .ev__w-bar { grid-column: 1 / -1; height: 2px; background: rgba(255,255,255,0.05); position: relative; }
        .ev__w-bar::after {
          content: ""; position: absolute; left: 0; top: 0; height: 100%;
          width: calc(var(--ev-p, 0.5) * 100%); max-width: 100%;
          background: rgba(150, 175, 210, 0.28);
        }
        .ev__loops { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .ev__loop { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.16); }
        .ev__loop-top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .ev__loop-id { font-size: 0.55rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(190, 200, 220, 0.75); }
        .ev__loop-stat { font-size: 0.55rem; color: rgba(130, 145, 170, 0.55); }
        .ev__loop-body { margin: 0; font-size: 0.76rem; line-height: 1.45; color: rgba(175, 188, 210, 0.88); }
        .ev__list-plain { margin: 0; padding-left: 1rem; font-size: 0.74rem; line-height: 1.5; color: rgba(165, 178, 200, 0.85); }
        .ev__muted { margin: 0; font-size: 0.76rem; color: rgba(130, 145, 170, 0.65); }
        .ev__traj { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .ev__traj-row { display: flex; flex-wrap: wrap; gap: 10px 14px; font-size: 0.7rem; color: rgba(175, 188, 208, 0.85); }
        .ev__traj-p { letter-spacing: 0.14em; text-transform: uppercase; font-size: 0.55rem; color: rgba(140, 155, 180, 0.55); }
        .ev__toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 50;
          padding: 10px 14px; border: 1px solid rgba(200, 210, 235, 0.22);
          background: rgba(8, 10, 16, 0.95); font-size: 0.76rem;
        }
      `}</style>
    </div>
  );
}
