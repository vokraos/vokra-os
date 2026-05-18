import { useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = { onNavigate: (id: NavId) => void };

type AgentStatus = "active" | "standby" | "routing";

type AgentDef = {
  id: string;
  sector: "trend" | "competitor" | "seo" | "visual" | "production" | "profit";
  nameKey: string;
  taskKey: string;
  status: AgentStatus;
  confidence: number;
};

const AGENT_BASE: AgentDef[] = [
  { id: "trend", sector: "trend", nameKey: "aiOps.agent.trend.name", taskKey: "aiOps.agent.trend.task", status: "active", confidence: 91 },
  { id: "competitor", sector: "competitor", nameKey: "aiOps.agent.competitor.name", taskKey: "aiOps.agent.competitor.task", status: "routing", confidence: 76 },
  { id: "seo", sector: "seo", nameKey: "aiOps.agent.seo.name", taskKey: "aiOps.agent.seo.task", status: "standby", confidence: 62 },
  { id: "visual", sector: "visual", nameKey: "aiOps.agent.visual.name", taskKey: "aiOps.agent.visual.task", status: "active", confidence: 84 },
  { id: "production", sector: "production", nameKey: "aiOps.agent.production.name", taskKey: "aiOps.agent.production.task", status: "routing", confidence: 58 },
  { id: "profit", sector: "profit", nameKey: "aiOps.agent.profit.name", taskKey: "aiOps.agent.profit.task", status: "active", confidence: 88 },
];

const STATUS_CYCLE: AgentStatus[] = ["active", "routing", "standby"];

const PIPELINE_KEYS = [
  "aiOps.pipeline.radar",
  "aiOps.pipeline.competitors",
  "aiOps.pipeline.command",
  "aiOps.pipeline.seo",
  "aiOps.pipeline.visuals",
  "aiOps.pipeline.campaign",
  "aiOps.pipeline.production",
] as const;

const PIPELINE_CURRENT_INDEX = 2;

const MARKET_BASE: { key: string; value: number }[] = [
  { key: "aiOps.market.wb", value: 72 },
  { key: "aiOps.market.ozon", value: 54 },
  { key: "aiOps.market.premium", value: 81 },
  { key: "aiOps.market.visual", value: 44 },
  { key: "aiOps.market.trend", value: 67 },
];

const SIGNAL_KEYS = ["aiOps.signal.1", "aiOps.signal.2", "aiOps.signal.3", "aiOps.signal.4", "aiOps.signal.5"] as const;

const DEPT_ROWS: { wing: "intel" | "signal" | "ops"; agentIds: string[] }[] = [
  { wing: "intel", agentIds: ["trend", "competitor"] },
  { wing: "signal", agentIds: ["seo", "visual"] },
  { wing: "ops", agentIds: ["production", "profit"] },
];

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function AiOperationsCenterView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 16000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const liveAgents = useMemo(() => {
    return AGENT_BASE.map((a, i) => {
      const wave = Math.sin(tick * 0.55 + i * 0.9) * 4;
      const conf = clamp(Math.round(a.confidence + wave + ((tick + i) % 3) - 1), 52, 96);
      const status = reduceMotion ? a.status : STATUS_CYCLE[(STATUS_CYCLE.indexOf(a.status) + tick + i) % 3];
      return { ...a, confidence: conf, status };
    });
  }, [tick, reduceMotion]);

  const liveMarket = useMemo(() => {
    return MARKET_BASE.map((m, i) => {
      const nudge = Math.round(Math.sin(tick * 0.4 + i * 1.1) * 5 + ((tick + i * 2) % 4) - 2);
      return { ...m, value: clamp(m.value + (reduceMotion ? 0 : nudge), 18, 94) };
    });
  }, [tick, reduceMotion]);

  const agentById = useMemo(() => Object.fromEntries(liveAgents.map((a) => [a.id, a])), [liveAgents]);

  return (
    <div className="opsv1 opsv1--hq">
      <div className="opsv1__vault" aria-hidden />
      <div className="opsv1__ambient" aria-hidden>
        <span className="opsv1__ambient-bloom" />
        <span className="opsv1__ambient-cool" />
        <span className="opsv1__ambient-drift" />
        <span className="opsv1__ambient-pulse" />
        <span className="opsv1__ambient-radar" />
        <span className="opsv1__ambient-radar opsv1__ambient-radar--slow" />
        <span className="opsv1__ambient-floor" />
        <span className="opsv1__ambient-grain" />
      </div>

      <div className="opsv1__holo" aria-hidden>
        <span className="opsv1__holo-grid" />
        <span className="opsv1__holo-scan" />
        <span className="opsv1__holo-float" />
        <span className="opsv1__holo-fog" />
        <span className="opsv1__holo-dust" />
      </div>

      <div className="opsv1__content">
        <header className="opsv1__head opsv1__panel">
          <div className="opsv1__head-main">
            <p className="opsv1__eyebrow">{t("aiOps.eyebrow")}</p>
            <h2 className="opsv1__title">{t("aiOps.title")}</h2>
            <p className="opsv1__sub">{t("aiOps.subtitle")}</p>
          </div>
          <div className="opsv1__head-aside">
            <div className="opsv1__live">
              <span className="opsv1__live-dot" aria-hidden />
              <span>{t("aiOps.live")}</span>
            </div>
            <button type="button" className="ghost-btn opsv1__brief-btn" onClick={() => onNavigate("operationsBrief")}>
              {t("aiOps.linkBrief")}
            </button>
          </div>
        </header>

        <section className="opsv1__pipeline opsv1__panel opsv1__panel--primary" aria-label={t("aiOps.section.execution")}>
          <p className="opsv1__pipeline-cap">{t("aiOps.section.execution")}</p>
          <ol className="opsv1__pipeline-track">
            {PIPELINE_KEYS.map((key, i) => {
              const state = i < PIPELINE_CURRENT_INDEX ? "complete" : i === PIPELINE_CURRENT_INDEX ? "current" : "pending";
              return (
                <li key={key} className={`opsv1__pipe-step opsv1__pipe-step--${state}`}>
                  <span className="opsv1__pipe-node" aria-hidden>
                    {state === "complete" ? <span className="opsv1__pipe-check" /> : null}
                  </span>
                  <span className="opsv1__pipe-label">{t(key)}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="opsv1__grid opsv1__grid--neural">
          <section className="opsv1__agents opsv1__panel opsv1__panel--secondary" aria-labelledby="opsv1-agents-heading">
            <div className="opsv1__section-head">
              <h3 id="opsv1-agents-heading" className="opsv1__section-title">
                {t("aiOps.section.agents")}
              </h3>
              <p className="opsv1__section-hint">{t("aiOps.deptHint")}</p>
            </div>

            <div className="opsv1__deck">
              {DEPT_ROWS.map((row) => (
                <div key={row.wing} className={`opsv1__dept opsv1__dept--${row.wing}`}>
                  <div className="opsv1__dept-rib" aria-hidden />
                  <ul className="opsv1__dept-grid">
                    {row.agentIds.map((id) => {
                      const a = agentById[id];
                      if (!a) return null;
                      return (
                        <li key={a.id} className={`opsv1__sector opsv1__sector--${a.sector}`}>
                          <span className="opsv1__sector-chamber" aria-hidden />
                          <span className="opsv1__sector-room" aria-hidden />
                          <span className={`opsv1__sector-fx opsv1__sector-fx--${a.sector}`} aria-hidden />
                          <span className="opsv1__sector-presence" aria-hidden>
                            <span className="opsv1__sector-presence__mass" />
                            <span className="opsv1__sector-presence__halo" />
                          </span>
                          <span className="opsv1__sector-sig" aria-hidden />
                          <span className="opsv1__sector-glass" aria-hidden />
                          {a.sector === "seo" ? (
                            <span className="opsv1__seo-stream" aria-hidden>
                              <span className="opsv1__seo-frag opsv1__seo-frag--1">{t("aiOps.seoFx1")}</span>
                              <span className="opsv1__seo-frag opsv1__seo-frag--2">{t("aiOps.seoFx2")}</span>
                              <span className="opsv1__seo-frag opsv1__seo-frag--3">{t("aiOps.seoFx3")}</span>
                            </span>
                          ) : null}
                          <div className="opsv1__sector-inner">
                            <div className="opsv1__agent-top">
                              <span className={`opsv1__agent-pulse ${a.status === "active" ? "opsv1__agent-pulse--on" : ""}`} aria-hidden />
                              <span className="opsv1__agent-name">{t(a.nameKey)}</span>
                              <span className={`opsv1__agent-status opsv1__agent-status--${a.status}`}>{t(`aiOps.status.${a.status}`)}</span>
                            </div>
                            <p className="opsv1__agent-task">{t(a.taskKey)}</p>
                            <div className="opsv1__agent-meter" aria-label={`${t(a.nameKey)} · ${t("aiOps.confidence")}`}>
                              <span className="opsv1__agent-meter-cap">{t("aiOps.confidence")}</span>
                              <div className="opsv1__agent-meter-rail">
                                <span className="opsv1__agent-meter-fill" style={{ width: `${a.confidence}%` }} />
                              </div>
                              <span className="opsv1__agent-meter-val">{a.confidence}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <div className="opsv1__neural-wrap">
            <div className="opsv1__neural" role="region" aria-label={t("aiOps.neuralAria")}>
              <span className="opsv1__neural-gravity" aria-hidden />
              <span className="opsv1__neural-volumetric" aria-hidden />
              <svg className="opsv1__neural-links opsv1__neural-links--left" viewBox="0 0 100 320" preserveAspectRatio="none" aria-hidden>
                <path
                  className="opsv1__neural-path"
                  d="M100 48 C 72 48, 52 42, 0 38"
                />
                <path
                  className="opsv1__neural-path"
                  d="M100 108 C 70 112, 48 108, 0 104"
                />
                <path
                  className="opsv1__neural-path"
                  d="M100 168 C 68 170, 45 172, 0 168"
                />
                <path
                  className="opsv1__neural-path"
                  d="M100 228 C 72 224, 50 230, 0 232"
                />
                <path
                  className="opsv1__neural-path"
                  d="M100 288 C 74 290, 52 286, 0 282"
                />
              </svg>
              <svg className="opsv1__neural-links opsv1__neural-links--right" viewBox="0 0 100 320" preserveAspectRatio="none" aria-hidden>
                <path className="opsv1__neural-path" d="M0 72 C 32 76, 58 70, 100 68" />
                <path className="opsv1__neural-path" d="M0 200 C 36 198, 62 205, 100 202" />
                <path className="opsv1__neural-path" d="M0 268 C 34 272, 60 264, 100 262" />
              </svg>
              <div className="opsv1__neural-ringstack" aria-hidden>
                <span className="opsv1__neural-ring opsv1__neural-ring--a" />
                <span className="opsv1__neural-ring opsv1__neural-ring--b" />
                <span className="opsv1__neural-ring opsv1__neural-ring--c" />
              </div>
              <span className="opsv1__neural-sphere" aria-hidden />
              <span className="opsv1__neural-coreglow" aria-hidden />
              <span className="opsv1__neural-flow" aria-hidden />
              <span className="opsv1__neural-wave" aria-hidden />
              <span className="opsv1__neural-spec" aria-hidden />
              <span className="opsv1__neural-ghost" aria-hidden />
            </div>
            <p className="opsv1__neural-cap">{t("aiOps.neuralCap")}</p>
          </div>

          <div className="opsv1__rail">
            <span className="opsv1__corridor" aria-hidden />
            <section className="opsv1__queue opsv1__panel opsv1__panel--secondary" aria-labelledby="opsv1-queue-heading">
              <h3 id="opsv1-queue-heading" className="opsv1__section-title">
                {t("aiOps.section.queue")}
              </h3>
              <div className="opsv1__queue-group">
                <p className="opsv1__pri opsv1__pri--high">{t("aiOps.priority.high")}</p>
                <ul>
                  <li>{t("aiOps.mission.porsche")}</li>
                  <li>{t("aiOps.mission.anime")}</li>
                </ul>
              </div>
              <div className="opsv1__queue-group">
                <p className="opsv1__pri opsv1__pri--mid">{t("aiOps.priority.medium")}</p>
                <ul>
                  <li>{t("aiOps.mission.gift")}</li>
                </ul>
              </div>
              <div className="opsv1__queue-group">
                <p className="opsv1__pri opsv1__pri--low">{t("aiOps.priority.low")}</p>
                <ul>
                  <li>{t("aiOps.mission.cinematic")}</li>
                </ul>
              </div>
            </section>

            <section className="opsv1__pressure opsv1__panel opsv1__panel--secondary" aria-labelledby="opsv1-pressure-heading">
              <h3 id="opsv1-pressure-heading" className="opsv1__section-title">
                {t("aiOps.section.pressure")}
              </h3>
              <ul className="opsv1__pressure-list">
                {liveMarket.map((m) => (
                  <li key={m.key} className="opsv1__pressure-row">
                    <span className="opsv1__pressure-label">{t(m.key)}</span>
                    <div className="opsv1__pressure-rail" aria-hidden>
                      <span className="opsv1__pressure-fill" style={{ width: `${m.value}%` }} />
                    </div>
                    <span className="opsv1__pressure-val">{m.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="opsv1__feed opsv1__panel opsv1__panel--secondary" aria-labelledby="opsv1-feed-heading">
            <div className="opsv1__feed-head">
              <h3 id="opsv1-feed-heading" className="opsv1__section-title">
                {t("aiOps.section.feed")}
              </h3>
              <span className="opsv1__feed-mark" aria-hidden>
                SIG
              </span>
            </div>
            <div className="opsv1__feed-viewport" aria-hidden="true">
              {SIGNAL_KEYS.map((key, i) => (
                <p key={key} className={`opsv1__feed-line opsv1__feed-line--${i}`}>
                  {t(key)}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .opsv1--hq {
          --ops-ice: rgba(165, 185, 235, 0.12);
          --ops-deep: rgba(4, 6, 12, 0.94);
          --ops-bloom: rgba(110, 130, 200, 0.09);
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-xl);
          padding: clamp(22px, 3.2vw, 36px);
          min-height: min(760px, 86vh);
          background: linear-gradient(168deg, rgba(255, 255, 255, 0.035) 0%, transparent 45%), linear-gradient(195deg, #0a0b11 0%, #030408 55%, #020306 100%);
          border: 1px solid rgba(255, 255, 255, 0.085);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            inset 0 -48px 96px rgba(0, 0, 0, 0.55),
            0 40px 100px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(0, 0, 0, 0.5);
        }
        .opsv1__vault {
          pointer-events: none;
          position: absolute;
          inset: 14px;
          border-radius: calc(var(--radius-xl) - 10px);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 28px 80px rgba(0, 0, 0, 0.35),
            0 0 120px rgba(60, 75, 130, 0.06);
        }
        .opsv1__ambient {
          pointer-events: none;
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
        }
        .opsv1__ambient-bloom {
          position: absolute;
          inset: -5%;
          background: radial-gradient(ellipse 55% 42% at 50% -8%, var(--ops-bloom), transparent 62%);
          opacity: 0.85;
          animation: opsv1-bloom 22s ease-in-out infinite alternate;
        }
        .opsv1__ambient-cool {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 50% 40% at 8% 30%, rgba(100, 125, 195, 0.07), transparent 55%),
            radial-gradient(ellipse 45% 38% at 92% 65%, rgba(130, 155, 210, 0.05), transparent 50%);
          opacity: 0.9;
          mix-blend-mode: soft-light;
        }
        .opsv1__ambient-drift {
          position: absolute;
          inset: -22%;
          background:
            radial-gradient(ellipse 72% 48% at 18% 8%, rgba(110, 128, 200, 0.07), transparent 58%),
            radial-gradient(ellipse 58% 42% at 88% 18%, rgba(255, 255, 255, 0.035), transparent 52%);
          opacity: 0.88;
          animation: opsv1-drift 56s ease-in-out infinite alternate;
        }
        .opsv1__ambient-pulse {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 95% 72% at 50% 88%, rgba(85, 105, 175, 0.055), transparent 58%);
          animation: opsv1-pulse 18s ease-in-out infinite;
        }
        .opsv1__ambient-radar {
          position: absolute;
          right: -20%;
          top: 6%;
          width: min(460px, 58vw);
          height: min(460px, 58vw);
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 248deg,
            rgba(115, 135, 195, 0.045) 276deg,
            rgba(185, 198, 235, 0.065) 294deg,
            rgba(115, 135, 195, 0.035) 312deg,
            transparent 360deg
          );
          opacity: 0.28;
          filter: blur(1.5px);
          animation: opsv1-spin 64s linear infinite;
        }
        .opsv1__ambient-radar--slow {
          right: auto;
          left: -24%;
          top: 38%;
          width: min(380px, 50vw);
          height: min(380px, 50vw);
          opacity: 0.18;
          animation: opsv1-spinrev 88s linear infinite;
        }
        .opsv1__ambient-floor {
          position: absolute;
          inset: auto 0 0 0;
          height: 38%;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.55), transparent);
          opacity: 0.75;
        }
        .opsv1__ambient-grain {
          position: absolute;
          inset: 0;
          opacity: 0.032;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }
        .opsv1__holo {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          overflow: hidden;
        }
        .opsv1__holo-grid {
          position: absolute;
          inset: -1px;
          opacity: 0.045;
          background-image:
            linear-gradient(rgba(200, 210, 245, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 210, 245, 0.1) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 65% at 50% 45%, black 20%, transparent 75%);
        }
        .opsv1__holo-scan {
          position: absolute;
          left: 0;
          right: 0;
          top: -20%;
          height: 28%;
          background: linear-gradient(180deg, transparent, rgba(200, 210, 245, 0.04), transparent);
          opacity: 0.5;
          animation: opsv1-holoscan 22s ease-in-out infinite;
        }
        .opsv1__holo-float {
          position: absolute;
          width: 120%;
          height: 40%;
          left: -10%;
          bottom: 8%;
          background: radial-gradient(ellipse 50% 35% at 50% 50%, rgba(130, 150, 210, 0.04), transparent 70%);
          opacity: 0.35;
          animation: opsv1-holofloat 34s ease-in-out infinite alternate;
        }
        .opsv1__holo-fog {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 85% 70% at 50% 48%, transparent 25%, rgba(3, 5, 12, 0.42) 100%);
          opacity: 0.45;
          animation: opsv1-fogdrift 52s ease-in-out infinite alternate;
        }
        .opsv1__holo-dust {
          position: absolute;
          inset: -5%;
          opacity: 0.028;
          background-image:
            radial-gradient(circle at 8% 12%, rgba(220, 225, 245, 0.9) 0.45px, transparent 0.55px),
            radial-gradient(circle at 22% 78%, rgba(200, 210, 235, 0.75) 0.35px, transparent 0.45px),
            radial-gradient(circle at 55% 18%, rgba(210, 218, 248, 0.65) 0.4px, transparent 0.5px),
            radial-gradient(circle at 88% 42%, rgba(190, 200, 230, 0.7) 0.38px, transparent 0.48px),
            radial-gradient(circle at 72% 88%, rgba(205, 215, 240, 0.55) 0.42px, transparent 0.52px),
            radial-gradient(circle at 38% 52%, rgba(195, 205, 235, 0.6) 0.36px, transparent 0.46px);
          animation: opsv1-dustdrift 40s linear infinite;
        }
        .opsv1__content {
          position: relative;
          z-index: 1;
        }
        .opsv1__panel {
          position: relative;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background:
            linear-gradient(165deg, rgba(255, 255, 255, 0.055) 0%, transparent 42%),
            linear-gradient(0deg, rgba(8, 9, 15, 0.72), rgba(10, 11, 18, 0.45));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -28px 60px rgba(0, 0, 0, 0.38),
            0 18px 48px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(10px);
        }
        .opsv1__panel--primary {
          border-color: rgba(255, 255, 255, 0.095);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -32px 72px rgba(0, 0, 0, 0.42),
            0 22px 56px rgba(0, 0, 0, 0.38),
            0 0 80px rgba(70, 88, 150, 0.05);
        }
        .opsv1__panel--secondary {
          opacity: 0.96;
          border-color: rgba(255, 255, 255, 0.055);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -24px 52px rgba(0, 0, 0, 0.4),
            0 14px 36px rgba(0, 0, 0, 0.32);
        }
        .opsv1__head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 22px;
          margin-bottom: 28px;
          padding: 22px 24px 24px;
        }
        .opsv1__eyebrow {
          margin: 0 0 8px;
          font-size: 0.66rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.34);
        }
        .opsv1__title {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: clamp(1.7rem, 3.3vw, 2.45rem);
          font-weight: 800;
          letter-spacing: 0.055em;
          color: rgba(244, 243, 239, 0.97);
          text-shadow: 0 2px 48px rgba(0, 0, 0, 0.45);
        }
        .opsv1__sub {
          margin: 0;
          max-width: 58ch;
          font-size: 0.9rem;
          line-height: 1.55;
          color: rgba(244, 243, 239, 0.38);
        }
        .opsv1__head-aside {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        .opsv1__live {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.32);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.48);
        }
        .opsv1__live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(155, 175, 230, 0.85);
          box-shadow: 0 0 0 3px rgba(120, 140, 210, 0.1), 0 0 16px rgba(120, 140, 210, 0.22);
          animation: opsv1-live 3.2s ease-in-out infinite;
        }
        .opsv1__brief-btn {
          font-size: 0.7rem;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }
        .opsv1__pipeline {
          margin-bottom: 26px;
          padding: 20px 22px 22px;
        }
        .opsv1__pipeline-cap {
          margin: 0 0 18px;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.3);
        }
        .opsv1__pipeline-track {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 0;
          row-gap: 12px;
        }
        .opsv1__pipe-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1 1 0;
          min-width: 72px;
          position: relative;
        }
        .opsv1__pipe-step:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 11px;
          left: calc(50% + 14px);
          width: calc(100% - 28px);
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
        }
        .opsv1__pipe-step--current:not(:last-child)::after,
        .opsv1__pipe-step--complete:not(:last-child)::after {
          background: linear-gradient(90deg, rgba(130, 150, 210, 0.28), rgba(130, 150, 210, 0.06));
        }
        .opsv1__pipe-node {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          margin-bottom: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.38);
          display: grid;
          place-items: center;
        }
        .opsv1__pipe-step--complete .opsv1__pipe-node {
          border-color: rgba(130, 150, 210, 0.38);
          background: rgba(100, 118, 180, 0.1);
        }
        .opsv1__pipe-step--current .opsv1__pipe-node {
          border-color: rgba(195, 205, 240, 0.45);
          box-shadow: 0 0 0 4px rgba(120, 140, 210, 0.1), 0 0 26px rgba(95, 115, 185, 0.14);
          animation: opsv1-node 4.5s ease-in-out infinite;
        }
        .opsv1__pipe-check {
          width: 6px;
          height: 10px;
          border: solid rgba(215, 220, 248, 0.75);
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(40deg) translate(-0.5px, -1px);
        }
        .opsv1__pipe-label {
          font-size: 0.64rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          line-height: 1.35;
          color: rgba(244, 243, 239, 0.34);
          max-width: 11ch;
        }
        .opsv1__pipe-step--complete .opsv1__pipe-label {
          color: rgba(190, 200, 235, 0.5);
        }
        .opsv1__pipe-step--current .opsv1__pipe-label {
          color: rgba(244, 243, 239, 0.88);
          font-weight: 600;
        }
        .opsv1__grid {
          display: grid;
          gap: 22px;
        }
        .opsv1__grid--neural {
          grid-template-columns: minmax(0, 1.12fr) clamp(168px, 20vw, 248px) minmax(212px, 0.52fr);
          grid-template-rows: auto auto;
          align-items: stretch;
        }
        .opsv1__agents {
          grid-column: 1;
          grid-row: 1 / span 2;
          padding: 22px 22px 26px;
          z-index: 1;
        }
        .opsv1__neural-wrap {
          grid-column: 2;
          grid-row: 1 / span 2;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: min(420px, 52vh);
          padding: 12px 6px 18px;
        }
        .opsv1__neural {
          position: relative;
          width: min(100%, 220px);
          aspect-ratio: 1;
          flex-shrink: 0;
          isolation: isolate;
          perspective: 520px;
          perspective-origin: 50% 44%;
        }
        .opsv1__neural-gravity {
          position: absolute;
          inset: -55%;
          z-index: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 46%, rgba(55, 68, 110, 0.22) 0%, rgba(12, 14, 24, 0.55) 42%, transparent 68%);
          opacity: 0.85;
          filter: blur(2px);
          animation: opsv1-neural-gravity 18s ease-in-out infinite;
        }
        .opsv1__neural-volumetric {
          position: absolute;
          inset: -8%;
          z-index: 1;
          border-radius: 50%;
          pointer-events: none;
          background:
            radial-gradient(ellipse 80% 55% at 50% 0%, rgba(130, 145, 195, 0.07), transparent 58%),
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(8, 10, 20, 0.5), transparent 55%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 35%, transparent 65%, rgba(0, 0, 0, 0.35));
          mix-blend-mode: soft-light;
          opacity: 0.55;
        }
        .opsv1__neural-links {
          position: absolute;
          top: 6%;
          bottom: 6%;
          width: 38%;
          z-index: 2;
          overflow: visible;
          opacity: 0.38;
        }
        .opsv1__neural-links--left {
          left: -34%;
        }
        .opsv1__neural-links--right {
          right: -34%;
        }
        .opsv1__neural-path {
          fill: none;
          stroke: rgba(175, 188, 228, 0.14);
          stroke-width: 0.55;
          stroke-linecap: round;
          vector-effect: non-scaling-stroke;
          stroke-dasharray: 3.2 7;
          animation: opsv1-neural-dash 28s linear infinite;
        }
        .opsv1__neural-links--left .opsv1__neural-path:nth-child(odd) {
          animation-duration: 32s;
          animation-direction: reverse;
        }
        .opsv1__neural-links--left .opsv1__neural-path:nth-child(2) {
          animation-delay: -4s;
        }
        .opsv1__neural-links--left .opsv1__neural-path:nth-child(3) {
          animation-delay: -9s;
        }
        .opsv1__neural-links--left .opsv1__neural-path:nth-child(4) {
          animation-delay: -14s;
        }
        .opsv1__neural-links--left .opsv1__neural-path:nth-child(5) {
          animation-delay: -20s;
        }
        .opsv1__neural-links--right .opsv1__neural-path:nth-child(2) {
          animation-delay: -7s;
        }
        .opsv1__neural-links--right .opsv1__neural-path:nth-child(3) {
          animation-delay: -16s;
        }
        .opsv1__neural-ringstack {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 92%;
          height: 92%;
          z-index: 3;
          transform: translate(-50%, -50%) rotateX(56deg);
          transform-style: preserve-3d;
          animation: opsv1-neural-ring-tilt 72s ease-in-out infinite alternate;
        }
        .opsv1__neural-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(165, 180, 225, 0.1);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.02),
            0 0 24px rgba(80, 95, 150, 0.04);
          opacity: 0.55;
        }
        .opsv1__neural-ring--a {
          transform: scale(1);
          animation: opsv1-neural-ring-a 96s linear infinite;
        }
        .opsv1__neural-ring--b {
          transform: scale(0.88);
          border-color: rgba(140, 158, 210, 0.09);
          opacity: 0.42;
          animation: opsv1-neural-ring-b 120s linear infinite reverse;
        }
        .opsv1__neural-ring--c {
          transform: scale(0.74);
          border-color: rgba(120, 138, 195, 0.07);
          opacity: 0.32;
          animation: opsv1-neural-ring-c 140s linear infinite;
        }
        .opsv1__neural-sphere {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 5;
          width: 56%;
          height: 56%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background:
            radial-gradient(circle at 32% 28%, rgba(210, 218, 245, 0.12), transparent 42%),
            radial-gradient(circle at 70% 72%, rgba(4, 6, 14, 0.85), transparent 52%),
            radial-gradient(circle at 50% 50%, #141824 0%, #0a0c12 48%, #05060a 100%);
          box-shadow:
            inset 0 -18px 36px rgba(0, 0, 0, 0.75),
            inset 0 10px 22px rgba(255, 255, 255, 0.04),
            inset 0 0 0 1px rgba(255, 255, 255, 0.06),
            0 12px 40px rgba(0, 0, 0, 0.55),
            0 0 60px rgba(60, 75, 120, 0.12);
          animation: opsv1-neural-sphere-pulse 10s ease-in-out infinite;
        }
        .opsv1__neural-coreglow {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 4;
          width: 62%;
          height: 62%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(95, 115, 175, 0.16) 0%, rgba(40, 50, 85, 0.08) 45%, transparent 70%);
          filter: blur(12px);
          opacity: 0.65;
          animation: opsv1-neural-coreglow 9s ease-in-out infinite;
        }
        .opsv1__neural-flow {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 6;
          width: 50%;
          height: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: conic-gradient(from 220deg, transparent 0deg, rgba(130, 150, 205, 0.07) 58deg, transparent 120deg, rgba(100, 120, 180, 0.05) 220deg, transparent 300deg);
          mix-blend-mode: soft-light;
          opacity: 0.35;
          animation: opsv1-neural-flow 84s linear infinite;
        }
        .opsv1__neural-wave {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 7;
          width: 58%;
          height: 58%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(185, 198, 235, 0.06);
          opacity: 0;
          animation: opsv1-neural-wave 11s ease-out infinite;
        }
        .opsv1__neural-spec {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 8;
          width: 72%;
          height: 38%;
          transform: translate(-50%, -72%) rotate(-18deg);
          border-radius: 50%;
          background: linear-gradient(105deg, transparent 38%, rgba(255, 255, 255, 0.06) 50%, transparent 62%);
          opacity: 0.35;
          filter: blur(1.2px);
          pointer-events: none;
          animation: opsv1-neural-spec 22s ease-in-out infinite;
        }
        .opsv1__neural-ghost {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 9;
          width: 52%;
          height: 52%;
          transform: translate(calc(-50% + 5%), calc(-50% + 4%));
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, rgba(25, 30, 48, 0.25), transparent 62%);
          filter: blur(10px);
          opacity: 0.22;
          mix-blend-mode: plus-lighter;
          pointer-events: none;
          animation: opsv1-neural-ghost 16s ease-in-out infinite alternate;
        }
        .opsv1__neural-cap {
          margin: 14px 0 0;
          padding: 0 8px;
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          text-align: center;
          color: rgba(195, 205, 235, 0.28);
        }
        .opsv1__section-head {
          margin-bottom: 18px;
        }
        .opsv1__section-title {
          margin: 0 0 6px;
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.48);
        }
        .opsv1__section-hint {
          margin: 0;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          color: rgba(244, 243, 239, 0.26);
        }
        .opsv1__deck {
          display: flex;
          flex-direction: column;
          gap: 0;
          perspective: 1280px;
        }
        .opsv1__dept {
          position: relative;
          padding: 16px 0 18px;
          transform-style: preserve-3d;
        }
        .opsv1__dept:first-child {
          padding-top: 4px;
        }
        .opsv1__dept-rib {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          opacity: 0.85;
        }
        .opsv1__dept:first-child .opsv1__dept-rib {
          opacity: 0;
        }
        .opsv1__dept-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .opsv1__dept--intel .opsv1__dept-grid {
          padding-top: 4px;
        }
        .opsv1__dept--intel .opsv1__sector {
          transform: translateY(-4px) translateZ(8px);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 -28px 56px rgba(0, 0, 0, 0.42),
            0 18px 36px rgba(0, 0, 0, 0.38),
            0 0 0 1px rgba(0, 0, 0, 0.35);
        }
        .opsv1__dept--signal .opsv1__sector {
          transform: translateZ(2px);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.055),
            inset 0 -32px 64px rgba(0, 0, 0, 0.48),
            0 22px 44px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(0, 0, 0, 0.4);
        }
        .opsv1__dept--ops .opsv1__sector {
          transform: translateY(6px) translateZ(-6px);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 -40px 72px rgba(0, 0, 0, 0.55),
            0 28px 52px rgba(0, 0, 0, 0.48),
            0 0 0 1px rgba(0, 0, 0, 0.45);
        }
        .opsv1__sector {
          position: relative;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.065);
          min-height: 152px;
          overflow: hidden;
          isolation: isolate;
          transition: box-shadow 0.6s ease, transform 0.6s ease;
        }
        .opsv1__sector-chamber {
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          pointer-events: none;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            inset 0 22px 56px rgba(0, 0, 0, 0.5),
            inset 0 0 80px rgba(0, 0, 0, 0.25);
        }
        .opsv1__sector-room {
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.65;
          mix-blend-mode: soft-light;
        }
        .opsv1__sector--trend .opsv1__sector-room {
          background: radial-gradient(ellipse 75% 60% at 88% 100%, rgba(95, 135, 185, 0.18), transparent 62%),
            radial-gradient(ellipse 50% 45% at 8% 0%, rgba(120, 155, 205, 0.1), transparent 55%);
        }
        .opsv1__sector--competitor .opsv1__sector-room {
          background: radial-gradient(ellipse 70% 55% at 12% 100%, rgba(125, 105, 165, 0.16), transparent 58%),
            radial-gradient(ellipse 45% 40% at 92% 8%, rgba(150, 130, 175, 0.09), transparent 52%);
        }
        .opsv1__sector--seo .opsv1__sector-room {
          background: radial-gradient(ellipse 68% 58% at 50% 0%, rgba(90, 125, 165, 0.16), transparent 55%),
            radial-gradient(ellipse 55% 50% at 80% 100%, rgba(75, 110, 150, 0.12), transparent 58%);
        }
        .opsv1__sector--visual .opsv1__sector-room {
          background: radial-gradient(ellipse 80% 55% at 70% 15%, rgba(145, 130, 185, 0.14), transparent 58%),
            radial-gradient(ellipse 50% 70% at 10% 90%, rgba(110, 95, 150, 0.1), transparent 55%);
        }
        .opsv1__sector--production .opsv1__sector-room {
          background: radial-gradient(ellipse 65% 50% at 50% 100%, rgba(100, 125, 140, 0.14), transparent 60%),
            radial-gradient(ellipse 40% 35% at 15% 12%, rgba(130, 145, 155, 0.08), transparent 50%);
        }
        .opsv1__sector--profit .opsv1__sector-room {
          background: radial-gradient(ellipse 72% 52% at 85% 85%, rgba(145, 125, 110, 0.14), transparent 58%),
            radial-gradient(ellipse 48% 42% at 10% 20%, rgba(160, 140, 125, 0.08), transparent 52%);
        }
        .opsv1__sector-fx {
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          pointer-events: none;
          overflow: hidden;
          opacity: 0.55;
        }
        .opsv1__sector-fx--trend {
          background: conic-gradient(from 210deg at 92% 8%, transparent 0deg, transparent 258deg, rgba(140, 165, 210, 0.09) 292deg, rgba(185, 200, 235, 0.06) 308deg, transparent 338deg);
          animation: opsv1-chamber-radar 48s linear infinite;
        }
        .opsv1__sector-fx--trend::before {
          content: "";
          position: absolute;
          inset: 8% 12% 18% 18%;
          border-radius: 8px;
          opacity: 0.45;
          background: radial-gradient(circle at 25% 35%, rgba(130, 175, 210, 0.07), transparent 42%),
            radial-gradient(circle at 70% 60%, rgba(110, 150, 195, 0.05), transparent 38%),
            radial-gradient(circle at 48% 80%, rgba(100, 140, 180, 0.045), transparent 35%);
          animation: opsv1-heatpulse 16s ease-in-out infinite;
        }
        .opsv1__sector-fx--trend::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.35;
          background: repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(200, 210, 245, 0.035) 11px, rgba(200, 210, 245, 0.035) 12px);
          mask-image: linear-gradient(180deg, black 0%, transparent 35%, transparent 70%, black 100%);
          animation: opsv1-telrise 22s ease-in-out infinite;
        }
        .opsv1__sector-fx--competitor {
          background-image:
            linear-gradient(rgba(200, 205, 235, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 205, 235, 0.035) 1px, transparent 1px);
          background-size: 13px 13px;
          opacity: 0.4;
        }
        .opsv1__sector-fx--competitor::before {
          content: "";
          position: absolute;
          left: -10%;
          right: -10%;
          top: 18%;
          height: 42%;
          background: linear-gradient(180deg, transparent, rgba(210, 215, 245, 0.045), transparent);
          transform: skewX(-6deg);
          animation: opsv1-compscan 19s ease-in-out infinite;
        }
        .opsv1__sector-fx--competitor::after {
          content: "";
          position: absolute;
          width: 38%;
          height: 38%;
          left: 48%;
          top: 42%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(175, 165, 210, 0.07), transparent 68%);
          animation: opsv1-clusterpulse 11s ease-in-out infinite;
        }
        .opsv1__sector-fx--seo {
          background: repeating-linear-gradient(
            125deg,
            transparent,
            transparent 18px,
            rgba(175, 195, 225, 0.02) 18px,
            rgba(175, 195, 225, 0.02) 19px
          );
          opacity: 0.32;
          animation: opsv1-seofade 26s ease-in-out infinite;
        }
        .opsv1__sector-fx--seo::before {
          content: "";
          position: absolute;
          inset: 12% 8% 20% 8%;
          background: radial-gradient(circle at 20% 30%, rgba(160, 185, 220, 0.05), transparent 25%),
            radial-gradient(circle at 75% 70%, rgba(150, 175, 210, 0.045), transparent 28%);
          animation: opsv1-clusterpulse 14s ease-in-out infinite reverse;
        }
        .opsv1__sector-fx--visual {
          background: radial-gradient(ellipse 90% 70% at 75% 18%, rgba(190, 180, 230, 0.1), transparent 55%);
          animation: opsv1-cinelight 20s ease-in-out infinite alternate;
        }
        .opsv1__sector-fx--visual::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(125deg, transparent 40%, rgba(255, 255, 255, 0.05) 48%, rgba(255, 255, 255, 0.07) 50%, rgba(255, 255, 255, 0.04) 52%, transparent 62%);
          opacity: 0.4;
          animation: opsv1-reflectsweep 28s ease-in-out infinite;
        }
        .opsv1__sector-fx--visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 45% at 30% 85%, rgba(80, 70, 120, 0.08), transparent 55%);
          animation: opsv1-moodgrad 18s ease-in-out infinite alternate;
        }
        .opsv1__sector-fx--production {
          background: repeating-linear-gradient(
            180deg,
            transparent,
            transparent 5px,
            rgba(175, 190, 205, 0.04) 5px,
            rgba(175, 190, 205, 0.04) 6px
          );
          background-size: 100% 6px;
          opacity: 0.38;
          animation: opsv1-routeslide 24s linear infinite;
        }
        .opsv1__sector-fx--production::before {
          content: "";
          position: absolute;
          inset: auto 8% 8% 8%;
          height: 28%;
          border-radius: 6px;
          background: linear-gradient(0deg, rgba(95, 110, 125, 0.12), transparent);
          animation: opsv1-warehousepulse 13s ease-in-out infinite;
        }
        .opsv1__sector-fx--production::after {
          content: "";
          position: absolute;
          left: 6%;
          right: 6%;
          top: 22%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(185, 198, 210, 0.12), transparent);
          animation: opsv1-logisticsflicker 9s ease-in-out infinite;
        }
        .opsv1__sector-fx--profit {
          background: linear-gradient(105deg, transparent 35%, rgba(175, 155, 140, 0.06) 50%, transparent 65%);
          background-size: 200% 100%;
          opacity: 0.42;
          animation: opsv1-stratflow 31s ease-in-out infinite;
        }
        .opsv1__sector-fx--profit::before {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          top: 10%;
          height: 2px;
          border-radius: 99px;
          background: linear-gradient(90deg, transparent, rgba(200, 175, 155, 0.15), transparent);
          animation: opsv1-marginpulse 8s ease-in-out infinite;
        }
        .opsv1__sector-fx--profit::after {
          content: "";
          position: absolute;
          right: 10%;
          bottom: 14%;
          width: 1px;
          height: 40%;
          background: linear-gradient(180deg, rgba(210, 185, 165, 0.1), transparent);
          opacity: 0.6;
          animation: opsv1-pressureticks 12s ease-in-out infinite;
        }
        .opsv1__sector-glass {
          position: absolute;
          inset: 0;
          z-index: 3;
          border-radius: inherit;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, transparent 46%);
          opacity: 0.5;
          pointer-events: none;
        }
        .opsv1__seo-stream {
          position: absolute;
          inset: 0;
          z-index: 4;
          border-radius: inherit;
          pointer-events: none;
          overflow: hidden;
        }
        .opsv1__seo-frag {
          position: absolute;
          font-size: 0.58rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(210, 220, 245, 0.14);
          white-space: nowrap;
          filter: blur(0.35px);
        }
        .opsv1__seo-frag--1 {
          left: 8%;
          top: 22%;
          animation: opsv1-seodrift 22s ease-in-out infinite alternate;
        }
        .opsv1__seo-frag--2 {
          right: 6%;
          top: 48%;
          animation: opsv1-seodrift 28s ease-in-out infinite alternate-reverse;
        }
        .opsv1__seo-frag--3 {
          left: 18%;
          bottom: 16%;
          animation: opsv1-seodrift 18s ease-in-out infinite;
        }
        .opsv1__sector-inner {
          position: relative;
          z-index: 5;
          padding: 15px 15px 16px;
        }
        .opsv1__sector-presence {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
          border-radius: inherit;
        }
        .opsv1__sector-presence__mass {
          position: absolute;
          right: 6%;
          bottom: 0;
          width: 38%;
          height: 78%;
          border-radius: 50% 50% 40% 40%;
          background: radial-gradient(ellipse at 50% 100%, rgba(175, 190, 230, 0.09), transparent 62%);
          filter: blur(18px);
          opacity: 0.55;
          transform: translateY(8%);
          animation: opsv1-presence 14s ease-in-out infinite alternate;
        }
        .opsv1__sector-presence__halo {
          position: absolute;
          right: 4%;
          bottom: 10%;
          width: 42%;
          height: 55%;
          border-radius: 40%;
          border: 1px solid rgba(200, 210, 245, 0.05);
          opacity: 0.35;
          filter: blur(0.5px);
          animation: opsv1-presencehalo 18s ease-in-out infinite alternate;
        }
        .opsv1__sector--trend {
          background: linear-gradient(165deg, rgba(110, 145, 195, 0.09) 0%, rgba(0, 0, 0, 0.32) 55%);
          box-shadow: inset 0 0 40px rgba(80, 110, 160, 0.06);
        }
        .opsv1__sector--competitor {
          background: linear-gradient(165deg, rgba(130, 115, 175, 0.08) 0%, rgba(0, 0, 0, 0.32) 55%);
          box-shadow: inset 0 0 40px rgba(110, 95, 150, 0.05);
        }
        .opsv1__sector--seo {
          background: linear-gradient(165deg, rgba(95, 125, 165, 0.1) 0%, rgba(0, 0, 0, 0.32) 55%);
          box-shadow: inset 0 0 48px rgba(70, 100, 140, 0.07);
        }
        .opsv1__sector--visual {
          background: linear-gradient(165deg, rgba(140, 130, 185, 0.09) 0%, rgba(0, 0, 0, 0.32) 55%);
          box-shadow: inset 0 0 44px rgba(120, 110, 170, 0.06);
        }
        .opsv1__sector--production {
          background: linear-gradient(165deg, rgba(120, 140, 155, 0.08) 0%, rgba(0, 0, 0, 0.32) 55%);
          box-shadow: inset 0 0 40px rgba(90, 110, 125, 0.06);
        }
        .opsv1__sector--profit {
          background: linear-gradient(165deg, rgba(155, 135, 120, 0.07) 0%, rgba(0, 0, 0, 0.32) 55%);
          box-shadow: inset 0 0 40px rgba(130, 110, 95, 0.05);
        }
        .opsv1__sector--trend .opsv1__sector-presence__mass {
          width: 32%;
          height: 88%;
          right: 10%;
        }
        .opsv1__sector--competitor .opsv1__sector-presence__mass {
          width: 44%;
          height: 68%;
          filter: blur(22px);
        }
        .opsv1__sector--seo .opsv1__sector-presence__mass {
          opacity: 0.42;
          right: 14%;
        }
        .opsv1__sector--visual .opsv1__sector-presence__mass {
          height: 92%;
          opacity: 0.48;
        }
        .opsv1__sector--production .opsv1__sector-presence__mass {
          width: 36%;
          height: 72%;
        }
        .opsv1__sector--profit .opsv1__sector-presence__mass {
          width: 48%;
          height: 62%;
          right: 5%;
        }
        .opsv1__sector-sig {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          opacity: 0.32;
        }
        .opsv1__sector--trend .opsv1__sector-sig {
          background: repeating-linear-gradient(
            -8deg,
            transparent,
            transparent 10px,
            rgba(200, 210, 245, 0.04) 10px,
            rgba(200, 210, 245, 0.04) 11px
          );
          mask-image: linear-gradient(90deg, transparent 50%, black 100%);
          animation: opsv1-sigslide 32s linear infinite;
        }
        .opsv1__sector--competitor .opsv1__sector-sig {
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 7px,
            rgba(210, 200, 235, 0.035) 7px,
            rgba(210, 200, 235, 0.035) 8px
          );
          mask-image: linear-gradient(90deg, black 0%, transparent 45%);
          animation: opsv1-sigslide 44s linear infinite reverse;
        }
        .opsv1__sector--seo .opsv1__sector-sig {
          background-image: radial-gradient(circle, rgba(190, 200, 235, 0.06) 0.5px, transparent 0.6px);
          background-size: 14px 14px;
          opacity: 0.28;
        }
        .opsv1__sector--visual .opsv1__sector-sig {
          background: radial-gradient(ellipse 80% 50% at 80% 20%, rgba(200, 195, 240, 0.06), transparent 55%);
          animation: opsv1-sigpulse 11s ease-in-out infinite;
        }
        .opsv1__sector--production .opsv1__sector-sig {
          background: linear-gradient(180deg, transparent 60%, rgba(180, 195, 210, 0.05) 100%);
          animation: opsv1-sigpulse 15s ease-in-out infinite reverse;
        }
        .opsv1__sector--profit .opsv1__sector-sig {
          background: conic-gradient(from 200deg at 90% 80%, transparent 0deg, rgba(210, 185, 160, 0.035) 40deg, transparent 80deg);
          opacity: 0.32;
          animation: opsv1-sigpulse 26s ease-in-out infinite;
        }
        .opsv1__agent-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .opsv1__agent-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .opsv1__agent-pulse--on {
          background: rgba(165, 185, 230, 0.9);
          box-shadow: 0 0 12px rgba(130, 150, 210, 0.22);
          animation: opsv1-live 2.8s ease-in-out infinite;
        }
        .opsv1__agent-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.07em;
          color: rgba(244, 243, 239, 0.92);
          flex: 1;
          min-width: 0;
        }
        .opsv1__agent-status {
          font-size: 0.56rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: rgba(244, 243, 239, 0.36);
          transition: border-color 0.8s ease, color 0.8s ease;
        }
        .opsv1__agent-status--active {
          border-color: rgba(140, 160, 215, 0.32);
          color: rgba(200, 210, 240, 0.68);
        }
        .opsv1__agent-status--routing {
          border-color: rgba(255, 255, 255, 0.09);
          color: rgba(244, 243, 239, 0.44);
        }
        .opsv1__agent-task {
          margin: 0 0 12px;
          font-size: 0.74rem;
          line-height: 1.45;
          color: rgba(244, 243, 239, 0.34);
        }
        .opsv1__agent-meter {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 10px;
        }
        .opsv1__agent-meter-cap {
          font-size: 0.56rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.26);
        }
        .opsv1__agent-meter-rail {
          height: 4px;
          border-radius: 99px;
          background: rgba(0, 0, 0, 0.42);
          overflow: hidden;
        }
        .opsv1__agent-meter-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(105, 125, 185, 0.35), rgba(175, 188, 230, 0.65));
          transition: width 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
          animation: opsv1-meter 6.5s ease-in-out infinite;
        }
        .opsv1__agent-meter-val {
          font-size: 0.66rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: rgba(195, 205, 235, 0.52);
          min-width: 2ch;
          text-align: right;
          transition: color 0.6s ease;
        }
        .opsv1__rail {
          grid-column: 3;
          grid-row: 1 / span 2;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
          padding-left: 8px;
        }
        .opsv1__corridor {
          position: absolute;
          left: 0;
          top: 6%;
          bottom: 6%;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(130, 150, 210, 0.12), transparent);
          opacity: 0.7;
        }
        .opsv1__queue,
        .opsv1__pressure {
          padding: 19px 19px 21px;
          flex: 0 0 auto;
        }
        .opsv1__feed {
          grid-column: 1 / -1;
          grid-row: 3;
          padding: 17px 22px 19px;
        }
        .opsv1__queue .opsv1__section-title {
          margin-bottom: 14px;
        }
        .opsv1__queue-group {
          margin-bottom: 13px;
        }
        .opsv1__queue-group:last-child {
          margin-bottom: 0;
        }
        .opsv1__pri {
          margin: 0 0 8px;
          font-size: 0.56rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .opsv1__pri--high {
          color: rgba(215, 195, 165, 0.48);
        }
        .opsv1__pri--mid {
          color: rgba(195, 205, 235, 0.4);
        }
        .opsv1__pri--low {
          color: rgba(244, 243, 239, 0.28);
        }
        .opsv1__queue ul {
          margin: 0;
          padding: 0 0 0 14px;
          font-size: 0.76rem;
          line-height: 1.5;
          color: rgba(244, 243, 239, 0.42);
        }
        .opsv1__pressure .opsv1__section-title {
          margin-bottom: 13px;
        }
        .opsv1__pressure-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .opsv1__pressure-row {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          gap: 6px 10px;
          align-items: center;
        }
        .opsv1__pressure-label {
          font-size: 0.7rem;
          color: rgba(244, 243, 239, 0.38);
          grid-column: 1;
        }
        .opsv1__pressure-val {
          font-size: 0.7rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: rgba(195, 205, 230, 0.46);
          grid-column: 2;
          grid-row: 1;
          transition: color 0.5s ease;
        }
        .opsv1__pressure-rail {
          grid-column: 1 / -1;
          height: 3px;
          border-radius: 99px;
          background: rgba(0, 0, 0, 0.38);
          overflow: hidden;
        }
        .opsv1__pressure-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(95, 115, 175, 0.22), rgba(155, 172, 220, 0.48));
          transform-origin: left;
          transition: width 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
          animation: opsv1-meter 8s ease-in-out infinite;
        }
        .opsv1__feed-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .opsv1__feed-mark {
          font-size: 0.52rem;
          font-weight: 700;
          letter-spacing: 0.3em;
          color: rgba(185, 195, 225, 0.22);
        }
        .opsv1__feed-viewport {
          position: relative;
          min-height: 2.4em;
        }
        .opsv1__feed-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          margin: 0;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(210, 218, 245, 0.34);
          opacity: 0;
          animation: opsv1-feed 22s ease-in-out infinite;
        }
        .opsv1__feed-line--0 {
          animation-delay: 0s;
        }
        .opsv1__feed-line--1 {
          animation-delay: 4.4s;
        }
        .opsv1__feed-line--2 {
          animation-delay: 8.8s;
        }
        .opsv1__feed-line--3 {
          animation-delay: 13.2s;
        }
        .opsv1__feed-line--4 {
          animation-delay: 17.6s;
        }
        @keyframes opsv1-bloom {
          0% {
            opacity: 0.65;
            transform: scale(1);
          }
          100% {
            opacity: 0.92;
            transform: scale(1.02);
          }
        }
        @keyframes opsv1-drift {
          0% {
            transform: translate(0, 0) scale(1);
          }
          100% {
            transform: translate(-1.5%, 1.2%) scale(1.025);
          }
        }
        @keyframes opsv1-pulse {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.82;
          }
        }
        @keyframes opsv1-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes opsv1-spinrev {
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes opsv1-holoscan {
          0% {
            transform: translateY(-10%);
            opacity: 0.25;
          }
          50% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(320%);
            opacity: 0.2;
          }
        }
        @keyframes opsv1-holofloat {
          0% {
            transform: translateX(-2%) translateY(0);
          }
          100% {
            transform: translateX(2%) translateY(-4%);
          }
        }
        @keyframes opsv1-fogdrift {
          0% {
            opacity: 0.38;
            transform: scale(1);
          }
          100% {
            opacity: 0.52;
            transform: scale(1.03) translate(1%, -0.5%);
          }
        }
        @keyframes opsv1-dustdrift {
          to {
            transform: translate(-1.8%, -1.2%);
          }
        }
        @keyframes opsv1-chamber-radar {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes opsv1-heatpulse {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.55;
          }
        }
        @keyframes opsv1-telrise {
          0%,
          100% {
            opacity: 0.22;
            transform: translateY(4px);
          }
          50% {
            opacity: 0.38;
            transform: translateY(-3px);
          }
        }
        @keyframes opsv1-compscan {
          0%,
          100% {
            transform: skewX(-6deg) translateY(-6%);
            opacity: 0.2;
          }
          50% {
            transform: skewX(-6deg) translateY(8%);
            opacity: 0.42;
          }
        }
        @keyframes opsv1-clusterpulse {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.48;
          }
        }
        @keyframes opsv1-seofade {
          0%,
          100% {
            opacity: 0.26;
          }
          50% {
            opacity: 0.4;
          }
        }
        @keyframes opsv1-cinelight {
          0% {
            opacity: 0.4;
            transform: scale(1) translate(0, 0);
          }
          100% {
            opacity: 0.55;
            transform: scale(1.04) translate(-1%, 2%);
          }
        }
        @keyframes opsv1-reflectsweep {
          0%,
          100% {
            opacity: 0.28;
            transform: translateX(-6%);
          }
          50% {
            opacity: 0.45;
            transform: translateX(6%);
          }
        }
        @keyframes opsv1-moodgrad {
          0% {
            opacity: 0.35;
          }
          100% {
            opacity: 0.55;
          }
        }
        @keyframes opsv1-routeslide {
          to {
            background-position: 0 80px;
          }
        }
        @keyframes opsv1-warehousepulse {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.55;
          }
        }
        @keyframes opsv1-logisticsflicker {
          0%,
          100% {
            opacity: 0.15;
          }
          40% {
            opacity: 0.38;
          }
          55% {
            opacity: 0.22;
          }
        }
        @keyframes opsv1-stratflow {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes opsv1-marginpulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scaleX(0.88);
          }
          50% {
            opacity: 0.75;
            transform: scaleX(1);
          }
        }
        @keyframes opsv1-pressureticks {
          0%,
          100% {
            opacity: 0.35;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.65;
            transform: scaleY(1.06);
          }
        }
        @keyframes opsv1-seodrift {
          0% {
            transform: translate(0, 0);
            opacity: 0.1;
          }
          100% {
            transform: translate(6px, -5px);
            opacity: 0.18;
          }
        }
        @keyframes opsv1-live {
          0%,
          100% {
            opacity: 0.62;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }
        @keyframes opsv1-node {
          0%,
          100% {
            box-shadow: 0 0 0 4px rgba(120, 140, 210, 0.08), 0 0 20px rgba(95, 115, 185, 0.1);
          }
          50% {
            box-shadow: 0 0 0 5px rgba(120, 140, 210, 0.12), 0 0 30px rgba(95, 115, 185, 0.14);
          }
        }
        @keyframes opsv1-meter {
          0%,
          100% {
            opacity: 0.85;
            filter: brightness(1);
          }
          50% {
            opacity: 1;
            filter: brightness(1.05);
          }
        }
        @keyframes opsv1-feed {
          0%,
          6% {
            opacity: 0;
            transform: translateY(5px);
          }
          12%,
          22% {
            opacity: 0.55;
            transform: translateY(0);
          }
          28%,
          100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }
        @keyframes opsv1-presence {
          0% {
            transform: translateY(10%) scale(1);
            opacity: 0.45;
          }
          100% {
            transform: translateY(4%) scale(1.03);
            opacity: 0.62;
          }
        }
        @keyframes opsv1-presencehalo {
          0% {
            opacity: 0.22;
            transform: translateX(0);
          }
          100% {
            opacity: 0.38;
            transform: translateX(-3%);
          }
        }
        @keyframes opsv1-sigslide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-18px);
          }
        }
        @keyframes opsv1-sigpulse {
          0%,
          100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.42;
          }
        }
        @keyframes opsv1-neural-gravity {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.78;
          }
          50% {
            transform: scale(1.04);
            opacity: 0.92;
          }
        }
        @keyframes opsv1-neural-dash {
          to {
            stroke-dashoffset: -120;
          }
        }
        @keyframes opsv1-neural-ring-tilt {
          0% {
            transform: translate(-50%, -50%) rotateX(54deg) rotateZ(-1.2deg);
          }
          100% {
            transform: translate(-50%, -50%) rotateX(60deg) rotateZ(1.8deg);
          }
        }
        @keyframes opsv1-neural-ring-a {
          from {
            transform: scale(1) rotate(0deg);
          }
          to {
            transform: scale(1) rotate(360deg);
          }
        }
        @keyframes opsv1-neural-ring-b {
          from {
            transform: scale(0.88) rotate(0deg);
          }
          to {
            transform: scale(0.88) rotate(-360deg);
          }
        }
        @keyframes opsv1-neural-ring-c {
          from {
            transform: scale(0.74) rotate(0deg);
          }
          to {
            transform: scale(0.74) rotate(360deg);
          }
        }
        @keyframes opsv1-neural-sphere-pulse {
          0%,
          100% {
            box-shadow:
              inset 0 -18px 36px rgba(0, 0, 0, 0.75),
              inset 0 10px 22px rgba(255, 255, 255, 0.035),
              inset 0 0 0 1px rgba(255, 255, 255, 0.055),
              0 12px 40px rgba(0, 0, 0, 0.55),
              0 0 52px rgba(60, 75, 120, 0.1);
          }
          50% {
            box-shadow:
              inset 0 -18px 36px rgba(0, 0, 0, 0.78),
              inset 0 10px 24px rgba(255, 255, 255, 0.045),
              inset 0 0 0 1px rgba(255, 255, 255, 0.07),
              0 14px 44px rgba(0, 0, 0, 0.52),
              0 0 72px rgba(70, 88, 140, 0.14);
          }
        }
        @keyframes opsv1-neural-coreglow {
          0%,
          100% {
            opacity: 0.52;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.78;
            transform: translate(-50%, -50%) scale(1.06);
          }
        }
        @keyframes opsv1-neural-flow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes opsv1-neural-wave {
          0% {
            transform: translate(-50%, -50%) scale(0.92);
            opacity: 0;
          }
          12% {
            opacity: 0.35;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.22);
            opacity: 0;
          }
        }
        @keyframes opsv1-neural-spec {
          0%,
          100% {
            opacity: 0.22;
            transform: translate(-50%, -72%) rotate(-18deg);
          }
          50% {
            opacity: 0.42;
            transform: translate(-50%, -70%) rotate(-14deg);
          }
        }
        @keyframes opsv1-neural-ghost {
          0% {
            opacity: 0.14;
            transform: translate(calc(-50% + 5%), calc(-50% + 4%)) scale(1);
          }
          100% {
            opacity: 0.26;
            transform: translate(calc(-50% + 3%), calc(-50% + 6%)) scale(1.03);
          }
        }
        @media (max-width: 1020px) {
          .opsv1__grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }
          .opsv1__grid--neural {
            grid-template-columns: 1fr;
          }
          .opsv1__agents {
            grid-column: 1;
            grid-row: auto;
          }
          .opsv1__neural-wrap {
            grid-column: 1;
            grid-row: auto;
            min-height: 220px;
            padding: 4px 0 8px;
          }
          .opsv1__rail {
            grid-column: 1;
            grid-row: auto;
            padding-left: 0;
          }
          .opsv1__corridor {
            display: none;
          }
          .opsv1__feed {
            grid-column: 1;
            grid-row: auto;
          }
          .opsv1__dept-grid {
            grid-template-columns: 1fr;
          }
          .opsv1__pipe-step:not(:last-child)::after {
            display: none;
          }
          .opsv1__pipeline-track {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
          .opsv1__deck {
            perspective: none;
          }
          .opsv1__dept--intel .opsv1__sector,
          .opsv1__dept--signal .opsv1__sector,
          .opsv1__dept--ops .opsv1__sector {
            transform: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .opsv1__ambient-bloom,
          .opsv1__ambient-drift,
          .opsv1__ambient-pulse,
          .opsv1__ambient-radar,
          .opsv1__ambient-radar--slow,
          .opsv1__holo-scan,
          .opsv1__holo-float,
          .opsv1__holo-fog,
          .opsv1__holo-dust,
          .opsv1__live-dot,
          .opsv1__agent-pulse--on,
          .opsv1__agent-meter-fill,
          .opsv1__pressure-fill,
          .opsv1__pipe-step--current .opsv1__pipe-node,
          .opsv1__feed-line,
          .opsv1__sector-presence__mass,
          .opsv1__sector-presence__halo,
          .opsv1__sector-sig,
          .opsv1__sector-fx,
          .opsv1__seo-frag,
          .opsv1__neural-gravity,
          .opsv1__neural-path,
          .opsv1__neural-ringstack,
          .opsv1__neural-ring--a,
          .opsv1__neural-ring--b,
          .opsv1__neural-ring--c,
          .opsv1__neural-sphere,
          .opsv1__neural-coreglow,
          .opsv1__neural-flow,
          .opsv1__neural-wave,
          .opsv1__neural-spec,
          .opsv1__neural-ghost {
            animation: none !important;
          }
          .opsv1__sector-fx::before,
          .opsv1__sector-fx::after {
            animation: none !important;
          }
          .opsv1__ambient-radar,
          .opsv1__ambient-radar--slow {
            opacity: 0.12;
          }
          .opsv1__feed-line:not(:first-of-type) {
            display: none;
          }
          .opsv1__feed-line:first-of-type {
            opacity: 0.42;
            transform: none;
            position: relative;
          }
        }
      `}</style>
    </div>
  );
}
