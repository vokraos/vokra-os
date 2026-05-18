import { useCallback, useId, useMemo, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  EXECUTION_STATE_RU,
  SYSTEM_OWNER_RU,
  executionPlanToJson,
  executionPlanToMarkdown,
  useExecutionPlanner,
} from "../lib/execution-planner";
import type { ExecutionState, MissionUrgency, SystemOwner } from "../lib/execution-planner/types";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = { onNavigate: (id: NavId) => void };

const ROUTE_POS: Record<SystemOwner, [number, number]> = {
  trend_radar: [10, 34],
  brand_dna: [26, 14],
  strategic_command: [48, 10],
  visual_lab: [72, 20],
  seo_core: [92, 36],
  production_core: [78, 52],
  marketplace_routing: [48, 56],
  campaigns: [22, 48],
  mission_control: [48, 32],
};

function urgencyLabel(t: (k: string) => string, u: MissionUrgency): string {
  return t(`exec.urgency.${u}`);
}

function statePillClass(st: ExecutionState): string {
  return `ep-pill ep-pill--${st}`;
}

export function ExecutionPlannerView({ onNavigate }: Props) {
  const { t } = useI18n();
  const plan = useExecutionPlanner();
  const [toast, setToast] = useState<string | null>(null);
  const gid = useId().replace(/:/g, "");

  const primaryMission = plan.missions[0] ?? null;

  const graphStages = useMemo(() => {
    if (!primaryMission) return [];
    return primaryMission.stages.slice(0, 8);
  }, [primaryMission]);

  const saveToMemory = useCallback(() => {
    const json = executionPlanToJson(plan);
    const titleBase = primaryMission?.objectiveRu ?? "План исполнения";
    recordGeneration({
      module: "execution_planner",
      title: `${titleBase.slice(0, 96)}${titleBase.length > 96 ? "…" : ""} · пульс ${plan.pulseGeneration}`,
      content: json,
      mime: "application/json",
      tags: ["execution", "planner", `pulse-${plan.pulseGeneration}`],
    });
    setToast(t("exec.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [plan, primaryMission, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-execution-plan-${plan.pulseGeneration}.json`, plan);
  }, [plan]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-execution-plan-${plan.pulseGeneration}.md`, executionPlanToMarkdown(plan));
  }, [plan]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(executionPlanToJson(plan));
    setToast("JSON скопирован");
    window.setTimeout(() => setToast(null), 2200);
  }, [plan]);

  const ra = plan.resourceAllocation;

  return (
    <div className="ep-lab" data-ep-pulse={plan.pulseGeneration % 1000}>
      <header className="ep-lab__head">
        <p className="ep-lab__eyebrow">{t("exec.eyebrow")}</p>
        <h1 className="ep-lab__title">{t("exec.title")}</h1>
        <p className="ep-lab__lede">{t("exec.subtitle")}</p>
      </header>

      <div className="ep-lab__grid2">
        <section className="ep-lab__panel glass-panel ep-lab__routing" aria-labelledby="ep-routing-title">
          <h2 id="ep-routing-title" className="ep-lab__h2">
            {t("exec.routing")}
          </h2>
          <p className="ep-lab__hint">Активные линии маршрутизации · интенсивность потока</p>
          <svg className="ep-lab__svg" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${gid}-ep-flow`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(90, 108, 150, 0.04)" />
                <stop offset="50%" stopColor="rgba(130, 150, 200, 0.22)" />
                <stop offset="100%" stopColor="rgba(90, 108, 150, 0.04)" />
              </linearGradient>
            </defs>
            {plan.routing.map((e, i) => {
              const a = ROUTE_POS[e.from];
              const b = ROUTE_POS[e.to];
              if (!a || !b) return null;
              const mx = (a[0] + b[0]) / 2;
              const my = (a[1] + b[1]) / 2 - 4;
              const d = `M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`;
              const op = 0.08 + (e.intensity / 100) * 0.38;
              return (
                <g key={`${e.from}-${e.to}-${i}`}>
                  <path
                    className="ep-lab__route"
                    d={d}
                    fill="none"
                    stroke={`url(#${gid}-ep-flow)`}
                    strokeWidth={0.35 + (e.intensity / 100) * 0.55}
                    strokeOpacity={op}
                    strokeDasharray="1.2 0.9"
                    pathLength={100}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-40" dur={`${96 + (i % 5) * 12}s`} repeatCount="indefinite" />
                  </path>
                </g>
              );
            })}
            {Object.entries(ROUTE_POS).map(([sys, [x, y]]) => {
              const s = sys as SystemOwner;
              const inRoute = plan.routing.some((e) => e.from === s || e.to === s);
              if (!inRoute && s !== "mission_control") return null;
              return (
                <g key={sys}>
                  <circle className="ep-lab__node" cx={x} cy={y} r={1.6} />
                  <text x={x} y={y - 2.8} className="ep-lab__node-label" textAnchor="middle">
                    {SYSTEM_OWNER_RU[s].length > 16 ? `${SYSTEM_OWNER_RU[s].slice(0, 14)}…` : SYSTEM_OWNER_RU[s]}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>

        <section className="ep-lab__panel glass-panel" aria-labelledby="ep-pressure-title">
          <h2 id="ep-pressure-title" className="ep-lab__h2">
            {t("exec.pressureMap")}
          </h2>
          <ul className="ep-lab__bars">
            {(
              [
                ["productionPressure", ra.productionPressure, "Production"],
                ["contentLoad", ra.contentLoad, "Content"],
                ["seoBandwidth", ra.seoBandwidth, "SEO"],
                ["skuComplexity", ra.skuComplexity, "SKU"],
                ["launchDensity", ra.launchDensity, "Launch"],
                ["overloadRisk", ra.overloadRisk, "Overload risk"],
              ] as const
            ).map(([k, v, lab]) => (
              <li key={k} className="ep-lab__bar-row">
                <span className="ep-lab__bar-k">{lab}</span>
                <span className="ep-lab__bar-track">
                  <span className="ep-lab__bar-fill" style={{ "--ep-v": v } as CSSProperties} />
                </span>
                <span className="ep-lab__bar-v">{v}%</span>
              </li>
            ))}
          </ul>
          <p className="ep-lab__redist">{ra.redistributionRu}</p>
        </section>
      </div>

      <section className="ep-lab__panel glass-panel" aria-labelledby="ep-missions-title">
        <h2 id="ep-missions-title" className="ep-lab__h2">
          {t("exec.activeMissions")}
        </h2>
        <div className="ep-lab__missions">
          {plan.missions.map((m) => (
            <article key={m.id} className="ep-lab__mission">
              <header className="ep-lab__mission-head">
                <h3 className="ep-lab__mission-title">{m.objectiveRu}</h3>
                <div className="ep-lab__mission-meta">
                  <span
                    className={statePillClass(
                      m.urgency === "critical" ? "risk" : m.urgency === "high" ? "active" : m.urgency === "observe" ? "waiting" : "synchronized",
                    )}
                  >
                    {urgencyLabel(t, m.urgency)}
                  </span>
                  <span className="ep-lab__meta-muted">
                    {t("exec.missionMeta")}: {m.difficulty}% · {m.timelineRu}
                  </span>
                </div>
              </header>
              <p className="ep-lab__prose">{m.reasonRu}</p>
              <dl className="ep-lab__dl">
                <div>
                  <dt>Влияние</dt>
                  <dd>{m.expectedImpactRu}</dd>
                </div>
                <div>
                  <dt>Системы</dt>
                  <dd>{m.systems.map((s) => SYSTEM_OWNER_RU[s]).join(" · ")}</dd>
                </div>
                <div>
                  <dt>Зависимости</dt>
                  <dd>{m.dependenciesRu}</dd>
                </div>
                <div>
                  <dt>Риски</dt>
                  <dd>{m.risksRu}</dd>
                </div>
                <div>
                  <dt>Успех</dt>
                  <dd>{m.successRu}</dd>
                </div>
              </dl>
              {m.adaptationsRu.length ? (
                <ul className="ep-lab__adapt">
                  {m.adaptationsRu.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : null}
              <h4 className="ep-lab__h4">{t("exec.stages")}</h4>
              <ol className="ep-lab__stages">
                {m.stages.map((st) => (
                  <li key={st.index} className={`ep-lab__stage ep-lab__stage--${st.state}`}>
                    <div className="ep-lab__stage-head">
                      <span className="ep-lab__stage-idx">{st.index + 1}</span>
                      <span className="ep-lab__stage-name">{st.nameRu}</span>
                      <span className={statePillClass(st.state)}>{EXECUTION_STATE_RU[st.state]}</span>
                    </div>
                    <ul className="ep-lab__tasks">
                      {st.tasks.map((tk) => (
                        <li key={tk.id} className={`ep-lab__task ep-lab__task--${tk.state}`}>
                          <span className="ep-lab__task-owner">{SYSTEM_OWNER_RU[tk.owner]}</span>
                          <span className="ep-lab__task-label">{tk.labelRu}</span>
                          <span className={statePillClass(tk.state)}>{EXECUTION_STATE_RU[tk.state]}</span>
                          <span className="ep-lab__task-meta">
                            P{tk.priority} · усилие {tk.effortScore} · {tk.timelineRu} · давл. {tk.pressure}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <div className="ep-lab__grid2">
        <section className="ep-lab__panel glass-panel" aria-labelledby="ep-graph-title">
          <h2 id="ep-graph-title" className="ep-lab__h2">
            {t("exec.graph")}
          </h2>
          <p className="ep-lab__hint">Первичная миссия · цепочка стадий (синхронизация и блокировки)</p>
          <div className="ep-lab__graph">
            {graphStages.map((st, i) => (
              <div key={st.index} className="ep-lab__graph-col">
                {i > 0 ? <span className="ep-lab__graph-edge" aria-hidden /> : null}
                <div className={`ep-lab__graph-node ep-lab__graph-node--${st.state}`}>
                  <span className="ep-lab__graph-idx">{st.index + 1}</span>
                  <span className="ep-lab__graph-name">{st.nameRu}</span>
                  <span className={statePillClass(st.state)}>{EXECUTION_STATE_RU[st.state]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ep-lab__panel glass-panel" aria-labelledby="ep-launch-title">
          <h2 id="ep-launch-title" className="ep-lab__h2">
            {t("exec.launchQueue")}
          </h2>
          <ul className="ep-lab__queue">
            {plan.launchQueue.map((q) => (
              <li key={q.id} className="ep-lab__queue-item">
                <div className="ep-lab__queue-head">
                  <span className="ep-lab__queue-label">{q.labelRu}</span>
                  <span className={statePillClass(q.urgency === "critical" ? "risk" : q.urgency === "high" ? "active" : "synchronized")}>
                    {urgencyLabel(t, q.urgency)}
                  </span>
                </div>
                <p className="ep-lab__queue-win">{q.windowRu}</p>
              </li>
            ))}
          </ul>
          <h3 className="ep-lab__h3">{t("exec.upcoming")}</h3>
          <ul className="ep-lab__upcoming">
            {plan.upcomingLaunchesRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ep-lab__grid2">
        <section className="ep-lab__panel glass-panel" aria-labelledby="ep-bn-title">
          <h2 id="ep-bn-title" className="ep-lab__h2">
            {t("exec.bottlenecks")}
          </h2>
          <ul className="ep-lab__bn">
            {plan.bottlenecks.map((b) => (
              <li key={b.id} className="ep-lab__bn-item">
                <div className="ep-lab__bn-track">
                  <span className="ep-lab__bn-fill" style={{ "--ep-v": b.severity } as CSSProperties} />
                </div>
                <div>
                  <p className="ep-lab__bn-label">{b.labelRu}</p>
                  <p className="ep-lab__bn-sys">{SYSTEM_OWNER_RU[b.relatedSystem]} · {b.severity}%</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ep-lab__panel glass-panel" aria-labelledby="ep-load-title">
          <h2 id="ep-load-title" className="ep-lab__h2">
            {t("exec.systemLoad")}
          </h2>
          <ul className="ep-lab__loads">
            {plan.systemLoads.map((s) => (
              <li key={s.system} className="ep-lab__load-row">
                <span className="ep-lab__load-name">{SYSTEM_OWNER_RU[s.system]}</span>
                <span className="ep-lab__load-track">
                  <span className="ep-lab__load-fill" style={{ "--ep-v": s.load } as CSSProperties} />
                </span>
                <span className="ep-lab__load-meta">
                  {s.load}% — {s.statusRu}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ep-lab__panel glass-panel" aria-labelledby="ep-seq-title">
        <h2 id="ep-seq-title" className="ep-lab__h2">
          {t("exec.sequencing")}
        </h2>
        <p className="ep-lab__prose ep-lab__prose--wide">{plan.sequencingNoteRu}</p>
      </section>

      <section className="ep-lab__panel glass-panel" aria-labelledby="ep-int-title">
        <h2 id="ep-int-title" className="ep-lab__h2">
          {t("exec.integration")}
        </h2>
        <ul className="ep-lab__int">
          {plan.integrationRu.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <div className="ep-lab__actions">
        <button type="button" className="ep-lab__btn ep-lab__btn--primary" onClick={saveToMemory}>
          {t("exec.saveMemory")}
        </button>
        <button type="button" className="ep-lab__btn" onClick={exportJson}>
          {t("exec.exportJson")}
        </button>
        <button type="button" className="ep-lab__btn" onClick={exportMd}>
          {t("exec.exportMd")}
        </button>
        <button type="button" className="ep-lab__btn" onClick={() => void copyJson()}>
          {t("exec.copyJson")}
        </button>
      </div>

      <div className="ep-lab__links">
        <span className="ep-lab__links-k">{t("exec.links")}</span>
        <button type="button" className="ep-lab__link" onClick={() => onNavigate("temporalStrategy")}>
          {t("exec.linkTemporal")}
        </button>
        <button type="button" className="ep-lab__link" onClick={() => onNavigate("executionOrchestrator")}>
          {t("exec.linkOrchestrator")}
        </button>
        <button type="button" className="ep-lab__link" onClick={() => onNavigate("missionControl")}>
          {t("exec.linkMission")}
        </button>
        <button type="button" className="ep-lab__link" onClick={() => onNavigate("command")}>
          {t("exec.linkCommand")}
        </button>
        <button type="button" className="ep-lab__link" onClick={() => onNavigate("trends")}>
          {t("exec.linkTrends")}
        </button>
        <button type="button" className="ep-lab__link" onClick={() => onNavigate("memory")}>
          {t("exec.linkMemory")}
        </button>
      </div>

      {toast ? <p className="ep-lab__toast">{toast}</p> : null}

      <style>{`
        .ep-lab {
          max-width: 1120px;
          margin: 0 auto;
          padding: 8px 4px 48px;
        }
        .ep-lab__head {
          margin-bottom: 22px;
        }
        .ep-lab__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 10px;
        }
        .ep-lab__title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.45rem, 2.8vw, 2.05rem);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .ep-lab__lede {
          margin: 0;
          max-width: 52rem;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .ep-lab__grid2 {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px) {
          .ep-lab__grid2 {
            grid-template-columns: 1fr;
          }
        }
        .ep-lab__panel {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
        }
        .ep-lab__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 8px;
          font-weight: 500;
        }
        .ep-lab__h3 {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 16px 0 8px;
        }
        .ep-lab__h4 {
          font-size: 0.58rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 14px 0 8px;
        }
        .ep-lab__hint {
          margin: 0 0 10px;
          font-size: 0.72rem;
          color: rgba(150, 165, 195, 0.55);
        }
        .ep-lab__routing .ep-lab__svg {
          width: 100%;
          height: auto;
          min-height: 200px;
          display: block;
        }
        .ep-lab__route {
          vector-effect: non-scaling-stroke;
        }
        .ep-lab__node {
          fill: rgba(130, 145, 185, 0.35);
          stroke: rgba(255, 255, 255, 0.12);
          stroke-width: 0.15;
        }
        .ep-lab__node-label {
          font-size: 2.1px;
          fill: rgba(175, 188, 218, 0.55);
          letter-spacing: 0.02em;
        }
        .ep-lab__bars {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ep-lab__bar-row {
          display: grid;
          grid-template-columns: 88px 1fr 36px;
          gap: 8px;
          align-items: center;
        }
        .ep-lab__bar-k {
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: var(--faint);
        }
        .ep-lab__bar-track {
          display: block;
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .ep-lab__bar-fill {
          display: block;
          height: 100%;
          width: calc(var(--ep-v, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(100, 115, 160, 0.25), rgba(155, 175, 220, 0.5));
        }
        .ep-lab__bar-v {
          font-size: 0.65rem;
          color: rgba(150, 165, 195, 0.5);
          text-align: right;
        }
        .ep-lab__redist {
          margin: 14px 0 0;
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .ep-lab__missions {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .ep-lab__mission {
          padding: 14px 0 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ep-lab__mission:first-child {
          border-top: none;
          padding-top: 0;
        }
        .ep-lab__mission-head {
          margin-bottom: 8px;
        }
        .ep-lab__mission-title {
          margin: 0 0 8px;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: rgba(220, 225, 238, 0.92);
        }
        .ep-lab__mission-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
        }
        .ep-lab__meta-muted {
          font-size: 0.68rem;
          color: var(--faint);
          letter-spacing: 0.06em;
        }
        .ep-lab__prose {
          margin: 0 0 10px;
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .ep-lab__prose--wide {
          max-width: 60rem;
        }
        .ep-lab__dl {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px 16px;
          margin: 10px 0 0;
        }
        .ep-lab__dl dt {
          font-size: 0.52rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 4px;
        }
        .ep-lab__dl dd {
          margin: 0;
          font-size: 0.76rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .ep-lab__adapt {
          margin: 10px 0 0;
          padding-left: 1rem;
          font-size: 0.76rem;
          color: rgba(185, 200, 225, 0.78);
          line-height: 1.45;
        }
        .ep-lab__stages {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ep-lab__stage {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }
        .ep-lab__stage--blocked,
        .ep-lab__stage--risk {
          border-color: rgba(180, 120, 120, 0.2);
        }
        .ep-lab__stage-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .ep-lab__stage-idx {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          color: var(--faint);
          min-width: 1.4rem;
        }
        .ep-lab__stage-name {
          flex: 1;
          font-size: 0.8rem;
          color: rgba(210, 218, 235, 0.88);
        }
        .ep-lab__tasks {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ep-lab__task {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 4px 10px;
          font-size: 0.72rem;
          color: var(--muted);
          padding: 6px 8px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.18);
        }
        .ep-lab__task-owner {
          grid-column: 1 / -1;
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ep-lab__task-label {
          grid-column: 1 / 2;
        }
        .ep-lab__task .ep-pill {
          grid-column: 2 / 3;
          align-self: start;
        }
        .ep-lab__task-meta {
          grid-column: 1 / -1;
          font-size: 0.62rem;
          color: rgba(140, 155, 185, 0.55);
        }
        .ep-pill {
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(175, 190, 220, 0.75);
          white-space: nowrap;
        }
        .ep-pill--active,
        .ep-pill--synchronized {
          border-color: rgba(123, 143, 255, 0.28);
          color: rgba(200, 210, 235, 0.9);
        }
        .ep-pill--blocked,
        .ep-pill--risk {
          border-color: rgba(200, 130, 130, 0.35);
          color: rgba(230, 190, 190, 0.85);
        }
        .ep-pill--delayed,
        .ep-pill--waiting {
          color: rgba(160, 170, 195, 0.65);
        }
        .ep-pill--queued,
        .ep-pill--completed {
          color: rgba(150, 165, 190, 0.55);
        }
        .ep-lab__graph {
          display: flex;
          align-items: stretch;
          gap: 0;
          overflow-x: auto;
          padding: 8px 0 4px;
        }
        .ep-lab__graph-col {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .ep-lab__graph-edge {
          width: 22px;
          height: 1px;
          margin: 0 2px;
          background: linear-gradient(90deg, rgba(123, 143, 255, 0.1), rgba(160, 175, 220, 0.35));
          position: relative;
        }
        .ep-lab__graph-edge::after {
          content: "";
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          border: 4px solid transparent;
          border-left-color: rgba(160, 175, 220, 0.35);
        }
        .ep-lab__graph-node {
          min-width: 112px;
          padding: 10px 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.26);
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
        }
        .ep-lab__graph-node--blocked {
          border-color: rgba(200, 140, 140, 0.28);
        }
        .ep-lab__graph-idx {
          font-size: 0.55rem;
          letter-spacing: 0.16em;
          color: var(--faint);
        }
        .ep-lab__graph-name {
          font-size: 0.72rem;
          line-height: 1.35;
          color: rgba(210, 218, 235, 0.88);
        }
        .ep-lab__queue {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ep-lab__queue-item {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
        }
        .ep-lab__queue-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .ep-lab__queue-label {
          font-size: 0.8rem;
          color: rgba(215, 222, 238, 0.9);
        }
        .ep-lab__queue-win {
          margin: 8px 0 0;
          font-size: 0.74rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .ep-lab__upcoming {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .ep-lab__bn {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ep-lab__bn-item {
          display: grid;
          grid-template-columns: 6px 1fr;
          gap: 12px;
        }
        .ep-lab__bn-track {
          width: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
          align-self: stretch;
          min-height: 44px;
        }
        .ep-lab__bn-fill {
          display: block;
          width: 100%;
          height: calc(var(--ep-v, 30) * 1%);
          max-height: 100%;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(200, 160, 160, 0.15), rgba(200, 140, 140, 0.55));
        }
        .ep-lab__bn-label {
          margin: 0 0 4px;
          font-size: 0.8rem;
          color: rgba(220, 225, 238, 0.88);
        }
        .ep-lab__bn-sys {
          margin: 0;
          font-size: 0.72rem;
          color: var(--muted);
        }
        .ep-lab__loads {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ep-lab__load-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
        }
        .ep-lab__load-name {
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ep-lab__load-track {
          display: block;
          height: 3px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .ep-lab__load-fill {
          display: block;
          height: 100%;
          width: calc(var(--ep-v, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(95, 115, 165, 0.2), rgba(140, 160, 210, 0.45));
        }
        .ep-lab__load-meta {
          font-size: 0.72rem;
          color: var(--muted);
        }
        .ep-lab__int {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--muted);
          font-size: 0.8rem;
          line-height: 1.55;
        }
        .ep-lab__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 18px 0;
        }
        .ep-lab__btn {
          border-radius: 99px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.3);
          color: var(--muted);
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 16px;
          cursor: pointer;
        }
        .ep-lab__btn:hover {
          border-color: rgba(123, 143, 255, 0.35);
          color: var(--text);
        }
        .ep-lab__btn--primary {
          border-color: rgba(123, 143, 255, 0.45);
          color: var(--text);
          background: rgba(123, 143, 255, 0.08);
        }
        .ep-lab__links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 14px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ep-lab__links-k {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 8px;
        }
        .ep-lab__link {
          border: none;
          background: none;
          color: rgba(160, 175, 215, 0.75);
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .ep-lab__link:hover {
          color: var(--text);
        }
        .ep-lab__toast {
          margin: 12px 0 0;
          font-size: 0.78rem;
          color: rgba(160, 200, 160, 0.85);
        }
      `}</style>
    </div>
  );
}
