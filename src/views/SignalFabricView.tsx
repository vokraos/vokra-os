import { useMemo, type CSSProperties } from "react";
import type { NavId } from "../types";
import { useSignalFabric } from "../lib/signal-fabric/context";
import { FABRIC_KEY_TO_NAV } from "../lib/signal-fabric/types";
import { useI18n } from "../lib/i18n/I18nContext";
import { useLiveState, deriveSignalFabricLabMicrostate } from "../lib/live-state";
import { SignalFabricMap } from "../components/signal-fabric/SignalFabricMap";
import { SignalCascadePanel } from "../components/signal-fabric/SignalCascadePanel";
import { SignalStream } from "../components/signal-fabric/SignalStream";
import { PressureMap } from "../components/signal-fabric/PressureMap";

type Props = { onNavigate: (id: NavId) => void };

export function SignalFabricView({ onNavigate }: Props) {
  const { t } = useI18n();
  const fabric = useSignalFabric();
  const { live } = useLiveState();
  const sfMicro = useMemo(() => deriveSignalFabricLabMicrostate(fabric, live), [fabric, live]);

  return (
    <div
      className="sf-lab"
      data-sf-pulse={fabric.pulseGeneration % 1000}
      data-sf-live-microstate={sfMicro}
      data-sf-live-profile={live.regimeTransition.profile}
      style={
        {
          "--sf-live-tension": String(live.strategicTension.index01),
          "--sf-live-conflict": String(fabric.conflicts.length),
        } as CSSProperties
      }
    >
      <header className="sf-lab__head">
        <p className="sf-lab__eyebrow">{t("sf.eyebrow")}</p>
        <h1 className="sf-lab__title">{t("sf.title")}</h1>
        <p className="sf-lab__lede">{t("sf.subtitle")}</p>
      </header>

      <div className="sf-lab__grid2">
        <SignalFabricMap fabric={fabric} activeModule="missionControl" live={live} />
        <PressureMap fabric={fabric} />
      </div>

      <section className="sf-lab__panel glass-panel">
        <h2 className="sf-lab__h2">{t("sf.propagation")}</h2>
        <ul className="sf-lab__prop">
          {fabric.propagations.map((p) => (
            <li key={p.id}>
              <span className="sf-lab__prop-k">{p.headModule}</span>
              <span className="sf-lab__prop-arrow">→</span>
              <span className="sf-lab__prop-k">{p.tailModule}</span>
              <span className="sf-lab__prop-meta">
                {p.intensity}% · {p.labelRu}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="sf-lab__grid2">
        <SignalCascadePanel fabric={fabric} />
        <SignalStream fabric={fabric} />
      </div>

      <section className="sf-lab__panel glass-panel">
        <h2 className="sf-lab__h2">{t("sf.conflicts")}</h2>
        <ul className="sf-lab__conf">
          {fabric.conflicts.map((c) => (
            <li key={c.id}>
              <p className="sf-lab__conf-title">{c.labelRu}</p>
              <p className="sf-lab__conf-meta">
                Конфликт · {c.severity}% · узлы: {c.modules.join(", ")}
              </p>
              <p className="sf-lab__conf-res">{c.resolutionRu}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sf-lab__panel glass-panel">
        <h2 className="sf-lab__h2">{t("sf.causal")}</h2>
        <div className="sf-lab__chains">
          {fabric.causalChains.map((ch) => (
            <article key={ch.id} className="sf-lab__chain">
              <h3 className="sf-lab__chain-title">{ch.titleRu}</h3>
              {ch.links.map((lk, i) => (
                <div key={i} className="sf-lab__link">
                  <p>
                    <span className="sf-lab__tag">Причина</span> {lk.causeRu}
                  </p>
                  <p>
                    <span className="sf-lab__tag">Следствие</span> {lk.effectRu}
                  </p>
                  <p className="sf-lab__mods">{lk.modules.join(" → ")}</p>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="sf-lab__panel glass-panel">
        <h2 className="sf-lab__h2">{t("sf.influence")}</h2>
        <div className="sf-lab__inf-grid">
          {fabric.moduleInfluence
            .filter((m) => m.influenceScore > 38)
            .slice(0, 10)
            .map((m) => {
              const nav = FABRIC_KEY_TO_NAV[m.module];
              return (
                <button
                  key={m.module}
                  type="button"
                  className="sf-lab__inf-cell"
                  disabled={!nav}
                  onClick={() => {
                    if (nav) onNavigate(nav);
                  }}
                >
                  <span className="sf-lab__inf-mod">{m.module}</span>
                  <span className="sf-lab__inf-score">{m.influenceScore}%</span>
                  <p className="sf-lab__inf-note">{m.noteRu}</p>
                </button>
              );
            })}
        </div>
      </section>

      <section className="sf-lab__panel glass-panel">
        <h2 className="sf-lab__h2">{t("sf.log")}</h2>
        <ul className="sf-lab__log">
          {fabric.propagationLogRu.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <div className="sf-lab__links">
        <span className="sf-lab__links-k">{t("sf.links")}</span>
        <button type="button" className="sf-lab__link" onClick={() => onNavigate("missionControl")}>
          Mission Control
        </button>
        <button type="button" className="sf-lab__link" onClick={() => onNavigate("executionPlanner")}>
          {t("nav.executionPlanner")}
        </button>
        <button type="button" className="sf-lab__link" onClick={() => onNavigate("executionOrchestrator")}>
          {t("nav.executionOrchestrator")}
        </button>
        <button type="button" className="sf-lab__link" onClick={() => onNavigate("temporalStrategy")}>
          {t("nav.temporalStrategy")}
        </button>
        <button type="button" className="sf-lab__link" onClick={() => onNavigate("memory")}>
          {t("nav.memory")}
        </button>
      </div>

      <style>{`
        .sf-lab {
          max-width: 1120px;
          margin: 0 auto;
          padding: 8px 4px 48px;
        }
        .sf-lab[data-sf-live-microstate="overloaded"] .sf-map {
          box-shadow: inset 0 0 0 1px rgba(200, 155, 130, 0.1);
        }
        .sf-lab[data-sf-live-microstate="stabilizing"] .sf-map {
          box-shadow: inset 0 0 0 1px rgba(130, 150, 200, 0.06);
        }
        .sf-lab[data-sf-live-profile="premium_defense"] .sf-lab__panel {
          border-color: rgba(255, 255, 255, 0.05);
        }
        .sf-lab__head {
          margin-bottom: 20px;
        }
        .sf-lab__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 10px;
        }
        .sf-lab__title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.45rem, 2.8vw, 2.05rem);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .sf-lab__lede {
          margin: 0;
          max-width: 52rem;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .sf-lab__grid2 {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px) {
          .sf-lab__grid2 {
            grid-template-columns: 1fr;
          }
        }
        .sf-lab__panel {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
          margin-bottom: 16px;
        }
        .sf-lab__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 10px;
        }
        .sf-lab__prop {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.76rem;
          color: var(--muted);
        }
        .sf-lab__prop li {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 10px;
        }
        .sf-lab__prop-k {
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160, 175, 205, 0.65);
        }
        .sf-lab__prop-arrow {
          color: rgba(130, 145, 175, 0.45);
        }
        .sf-lab__prop-meta {
          flex: 1 1 100%;
          font-size: 0.72rem;
          color: rgba(150, 165, 195, 0.55);
        }
        .sf-lab__conf {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sf-lab__conf-title {
          margin: 0 0 4px;
          font-size: 0.82rem;
          color: rgba(220, 225, 238, 0.9);
        }
        .sf-lab__conf-meta {
          margin: 0 0 4px;
          font-size: 0.7rem;
          color: rgba(160, 175, 205, 0.55);
        }
        .sf-lab__conf-res {
          margin: 0;
          font-size: 0.74rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .sf-lab__chains {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .sf-lab__chain {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
        }
        .sf-lab__chain-title {
          margin: 0 0 10px;
          font-size: 0.78rem;
          color: rgba(210, 218, 235, 0.88);
        }
        .sf-lab__link {
          margin-bottom: 10px;
          font-size: 0.74rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .sf-lab__link:last-child {
          margin-bottom: 0;
        }
        .sf-lab__tag {
          font-size: 0.55rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 6px;
        }
        .sf-lab__mods {
          margin: 4px 0 0;
          font-size: 0.65rem;
          color: rgba(130, 145, 175, 0.5);
        }
        .sf-lab__inf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .sf-lab__inf-cell {
          text-align: left;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
          cursor: pointer;
          color: inherit;
        }
        .sf-lab__inf-cell:disabled {
          opacity: 0.45;
          cursor: default;
        }
        .sf-lab__inf-cell:hover {
          border-color: rgba(123, 143, 255, 0.28);
        }
        .sf-lab__inf-mod {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .sf-lab__inf-score {
          display: block;
          margin: 6px 0;
          font-size: 0.85rem;
          color: rgba(210, 218, 235, 0.88);
        }
        .sf-lab__inf-note {
          margin: 0;
          font-size: 0.7rem;
          color: var(--muted);
          line-height: 1.4;
        }
        .sf-lab__log {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.74rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .sf-lab__links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .sf-lab__links-k {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 8px;
        }
        .sf-lab__link {
          border: none;
          background: none;
          color: rgba(160, 175, 215, 0.75);
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .sf-lab__link:hover {
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
