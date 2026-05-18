import { useCallback, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  FEEDBACK_EVENT_KIND_RU,
  feedbackLoopToJson,
  feedbackLoopToMarkdown,
  useFeedbackLoop,
  type FeedbackEvent,
} from "../lib/feedback-loop";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = { onNavigate: (id: NavId) => void };

function kindTone(kind: FeedbackEvent["kind"]): string {
  if (kind === "success" || kind === "efficiency_gain" || kind === "margin_improvement" || kind === "brand_fit_improvement")
    return "fb-ev--ok";
  if (kind === "weak_signal" || kind === "drift" || kind === "saturation") return "fb-ev--warn";
  if (kind === "failure" || kind === "bottleneck") return "fb-ev--bad";
  return "fb-ev--neu";
}

export function FeedbackLoopView({ onNavigate }: Props) {
  const { t } = useI18n();
  const snap = useFeedbackLoop();
  const [toast, setToast] = useState<string | null>(null);

  const saveToMemory = useCallback(() => {
    recordGeneration({
      module: "feedback_loop",
      title: `${t("feedLoop.title")} · пульс ${snap.pulseGeneration}`,
      content: feedbackLoopToJson(snap),
      mime: "application/json",
      tags: ["feedback_loop", "learning", `pulse:${snap.pulseGeneration}`],
    });
    setToast(t("feedLoop.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [snap, t]);

  const exportJsonFile = useCallback(() => {
    downloadJson(`vokra-feedback-loop-${snap.pulseGeneration}.json`, snap);
  }, [snap]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-feedback-loop-${snap.pulseGeneration}.md`, feedbackLoopToMarkdown(snap));
  }, [snap]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(feedbackLoopToJson(snap));
    setToast(t("feedLoop.toastCopied"));
    window.setTimeout(() => setToast(null), 2200);
  }, [snap, t]);

  return (
    <div className="fb-loop" data-fb-pulse={snap.pulseGeneration % 1000}>
      <header className="fb-loop__head">
        <p className="fb-loop__eyebrow">{t("feedLoop.eyebrow")}</p>
        <h1 className="fb-loop__title">{t("feedLoop.title")}</h1>
        <p className="fb-loop__lede">{t("feedLoop.subtitle")}</p>
        <p className="fb-loop__mission">{t("feedLoop.mission")}</p>
        <div className="fb-loop__toolbar">
          <button type="button" className="fb-loop__btn" onClick={exportJsonFile}>
            {t("feedLoop.exportJson")}
          </button>
          <button type="button" className="fb-loop__btn" onClick={exportMd}>
            {t("feedLoop.exportMd")}
          </button>
          <button type="button" className="fb-loop__btn" onClick={() => void copyJson()}>
            {t("feedLoop.copyJson")}
          </button>
          <button type="button" className="fb-loop__btn fb-loop__btn--pri" onClick={saveToMemory}>
            {t("feedLoop.saveMemory")}
          </button>
        </div>
        <nav className="fb-loop__links" aria-label="Связанные контуры">
          <span className="fb-loop__links-k">Источники</span>
          <button type="button" className="fb-loop__link" onClick={() => onNavigate("executionOrchestrator")}>
            Оркестратор
          </button>
          <button type="button" className="fb-loop__link" onClick={() => onNavigate("command")}>
            Strategic Command
          </button>
          <button type="button" className="fb-loop__link" onClick={() => onNavigate("temporalStrategy")}>
            Temporal
          </button>
          <button type="button" className="fb-loop__link" onClick={() => onNavigate("signalFabric")}>
            Signal Fabric
          </button>
          <button type="button" className="fb-loop__link" onClick={() => onNavigate("memory")}>
            Память проектов
          </button>
        </nav>
      </header>

      <section className="fb-loop__chain glass-panel" aria-labelledby="fb-chain-title">
        <h2 id="fb-chain-title" className="fb-loop__h2">
          {t("feedLoop.chainTitle")}
        </h2>
        <ol className="fb-loop__chain-list">
          {snap.causalChainRu.map((line, i) => (
            <li key={i} className="fb-loop__chain-item">
              <span className="fb-loop__chain-idx">{i + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="fb-loop__grid">
        <section className="fb-loop__panel glass-panel">
          <h2 className="fb-loop__h2">{t("feedLoop.s1")}</h2>
          <ul className="fb-loop__results">
            {snap.recentResults.map((r) => (
              <li key={r.id} className="fb-loop__card">
                <p className="fb-loop__card-k">{r.labelRu}</p>
                <p className="fb-loop__card-meta">
                  {r.skuOrScopeRu} · {r.metric}
                </p>
                <p className="fb-loop__card-body">{r.outcomeRu}</p>
                <p className="fb-loop__card-foot">{r.learnedRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fb-loop__panel glass-panel">
          <h2 className="fb-loop__h2">{t("feedLoop.s2")}</h2>
          <ul className="fb-loop__bullets">
            {snap.systemLearnedRu.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <h3 className="fb-loop__h3">{t("feedLoop.signals")}</h3>
          <ul className="fb-loop__sig">
            {snap.performanceSignals.map((ps) => (
              <li key={ps.id} className="fb-loop__sig-row">
                <span className="fb-loop__sig-axis">{ps.axis}</span>
                <span
                  className="fb-loop__sig-bar"
                  style={{ "--fb-sv": Math.round(ps.value) } as CSSProperties}
                  aria-hidden
                />
                <span className="fb-loop__sig-meta">
                  {Math.round(ps.value)}% · {ps.trendRu} · {ps.source}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="fb-loop__panel glass-panel">
          <h2 className="fb-loop__h2">{t("feedLoop.s3")}</h2>
          <ul className="fb-loop__patterns">
            {snap.strengthenedPatterns.map((p) => (
              <li key={p.id} className="fb-loop__card fb-loop__card--pattern">
                <p className="fb-loop__card-k">{p.labelRu}</p>
                <p className="fb-loop__card-meta">
                  {t("feedLoop.strength")}: {p.strength}%
                </p>
                <p className="fb-loop__card-body">{p.evidenceRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fb-loop__panel glass-panel">
          <h2 className="fb-loop__h2">{t("feedLoop.s4")}</h2>
          <ul className="fb-loop__patterns">
            {snap.weakenedHypotheses.map((p) => (
              <li key={p.id} className="fb-loop__card fb-loop__card--pattern fb-loop__card--weak">
                <p className="fb-loop__card-k">{p.labelRu}</p>
                <p className="fb-loop__card-meta">
                  {t("feedLoop.strength")}: {p.strength}%
                </p>
                <p className="fb-loop__card-body">{p.evidenceRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fb-loop__panel glass-panel fb-loop__panel--wide">
          <h2 className="fb-loop__h2">{t("feedLoop.s5")}</h2>
          <ol className="fb-loop__rules">
            {snap.strategyCorrections
              .slice()
              .sort((a, b) => b.priority - a.priority)
              .map((c) => (
                <li key={c.id} className="fb-loop__rule">
                  <span className="fb-loop__rule-pri">
                    {t("feedLoop.priority")} {c.priority}
                  </span>
                  <p className="fb-loop__rule-if">
                    <span className="fb-loop__tag">Если</span> {c.conditionRu}
                  </p>
                  <p className="fb-loop__rule-then">
                    <span className="fb-loop__tag">То</span> {c.actionRu}
                  </p>
                </li>
              ))}
          </ol>
        </section>

        <section className="fb-loop__panel glass-panel">
          <h2 className="fb-loop__h2">{t("feedLoop.s6")}</h2>
          <ul className="fb-loop__bullets">
            {snap.futureLaunchImpactRu.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <h3 className="fb-loop__h3">{t("feedLoop.confidence")}</h3>
          <ul className="fb-loop__adj">
            {snap.confidenceAdjustments.map((a, i) => (
              <li key={i} className="fb-loop__adj-row">
                <span className="fb-loop__adj-axis">{a.axisRu}</span>
                <span className={`fb-loop__adj-delta ${a.delta < 0 ? "fb-loop__adj-delta--neg" : ""}`}>
                  {a.delta > 0 ? "+" : ""}
                  {a.delta}
                </span>
                <span className="fb-loop__adj-reason">{a.reasonRu}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="fb-loop__panel glass-panel fb-loop__panel--wide">
          <h2 className="fb-loop__h2">{t("feedLoop.s7")}</h2>
          <p className="fb-loop__prose">{snap.outcomeMemory.summaryRu}</p>
          {snap.outcomeMemory.echoesRu.map((e, i) => (
            <blockquote key={i} className="fb-loop__echo">
              {e}
            </blockquote>
          ))}
          {snap.outcomeMemory.lastCorrectionRu ? (
            <p className="fb-loop__last">
              <span className="fb-loop__tag">Последняя коррекция</span> {snap.outcomeMemory.lastCorrectionRu}
            </p>
          ) : null}
        </section>

        <section className="fb-loop__panel glass-panel fb-loop__panel--full">
          <h2 className="fb-loop__h2">События контура</h2>
          <ul className="fb-loop__events">
            {snap.events.map((ev) => (
              <li key={ev.id} className={`fb-loop__ev ${kindTone(ev.kind)}`}>
                <div className="fb-loop__ev-head">
                  <span className="fb-loop__ev-kind">{FEEDBACK_EVENT_KIND_RU[ev.kind]}</span>
                  <span className="fb-loop__ev-src">{ev.source}</span>
                  <time className="fb-loop__ev-time" dateTime={new Date(ev.createdAt).toISOString()}>
                    {new Date(ev.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="fb-loop__ev-metric">
                  <span className="fb-loop__tag">{t("feedLoop.metric")}</span> {ev.metric}: {ev.beforeValue} → {ev.afterValue}{" "}
                  <span className="fb-loop__ev-conf">
                    ({t("feedLoop.deltaConf")}: {ev.confidenceAdjustment > 0 ? "+" : ""}
                    {ev.confidenceAdjustment})
                  </span>
                </p>
                <p className="fb-loop__ev-body">{ev.interpretationRu}</p>
                <p className="fb-loop__ev-impact">{ev.impactRu}</p>
                <p className="fb-loop__ev-rec">
                  <span className="fb-loop__tag">{t("feedLoop.rec")}</span> {ev.recommendationUpdateRu}
                </p>
                <p className="fb-loop__ev-tags">
                  <span className="fb-loop__mono">{ev.memoryTag}</span>
                  {ev.linkedCommandId ? <span className="fb-loop__mono">cmd:{ev.linkedCommandId}</span> : null}
                  {ev.linkedRouteId ? <span className="fb-loop__mono">route:{ev.linkedRouteId}</span> : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {toast ? (
        <div className="fb-loop__toast" role="status">
          {toast}
        </div>
      ) : null}

      <style>{`
        .fb-loop {
          padding: 0 0 48px;
          max-width: 1180px;
          margin: 0 auto;
        }
        .fb-loop__head {
          margin-bottom: 28px;
        }
        .fb-loop__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 12px;
        }
        .fb-loop__title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(1.65rem, 3.2vw, 2.35rem);
          margin: 0 0 12px;
          letter-spacing: 0.04em;
        }
        .fb-loop__lede {
          margin: 0 0 14px;
          color: var(--muted);
          max-width: 72ch;
          line-height: 1.55;
          font-size: 0.95rem;
        }
        .fb-loop__mission {
          margin: 0 0 22px;
          font-size: 0.88rem;
          letter-spacing: 0.06em;
          color: rgba(200, 210, 235, 0.82);
        }
        .fb-loop__toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }
        .fb-loop__btn {
          border-radius: 12px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.35);
          color: var(--text);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 10px 14px;
          cursor: pointer;
        }
        .fb-loop__btn:hover {
          border-color: rgba(123, 143, 255, 0.45);
        }
        .fb-loop__btn--pri {
          border-color: rgba(123, 143, 255, 0.55);
          box-shadow: 0 0 18px rgba(123, 143, 255, 0.12);
        }
        .fb-loop__links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 14px;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .fb-loop__links-k {
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 0.65rem;
          color: var(--faint);
          margin-right: 6px;
        }
        .fb-loop__link {
          border: none;
          background: transparent;
          color: rgba(180, 195, 230, 0.85);
          cursor: pointer;
          padding: 0;
          border-bottom: 1px solid rgba(180, 195, 230, 0.22);
          font: inherit;
        }
        .fb-loop__link:hover {
          color: var(--text);
          border-bottom-color: rgba(123, 143, 255, 0.5);
        }
        .fb-loop__chain {
          padding: 22px 24px;
          margin-bottom: 22px;
        }
        .fb-loop__h2 {
          font-size: 0.72rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 16px;
        }
        .fb-loop__h3 {
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 22px 0 12px;
        }
        .fb-loop__chain-list {
          list-style: none;
          margin: 0;
          padding: 0 0 0 8px;
          border-left: 1px solid rgba(123, 143, 255, 0.22);
        }
        .fb-loop__chain-item {
          position: relative;
          padding: 10px 0 10px 22px;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.45;
        }
        .fb-loop__chain-idx {
          position: absolute;
          left: -5px;
          top: 12px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          background: rgba(8, 10, 18, 0.9);
          border: 1px solid rgba(123, 143, 255, 0.35);
          color: rgba(220, 226, 255, 0.9);
        }
        .fb-loop__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        @media (max-width: 900px) {
          .fb-loop__grid {
            grid-template-columns: 1fr;
          }
        }
        .fb-loop__panel {
          padding: 20px 22px;
        }
        .fb-loop__panel--wide {
          grid-column: span 2;
        }
        .fb-loop__panel--full {
          grid-column: 1 / -1;
        }
        @media (max-width: 900px) {
          .fb-loop__panel--wide {
            grid-column: span 1;
          }
        }
        .fb-loop__bullets {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--muted);
          line-height: 1.55;
          font-size: 0.9rem;
        }
        .fb-loop__results,
        .fb-loop__patterns,
        .fb-loop__events {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fb-loop__card {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.28);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        .fb-loop__card--pattern {
          background: rgba(10, 14, 26, 0.55);
        }
        .fb-loop__card--weak {
          box-shadow: inset 0 0 0 1px rgba(180, 120, 90, 0.12);
        }
        .fb-loop__card-k {
          margin: 0 0 6px;
          font-weight: 600;
          font-size: 0.92rem;
        }
        .fb-loop__card-meta {
          margin: 0 0 8px;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .fb-loop__card-body {
          margin: 0 0 8px;
          color: var(--muted);
          font-size: 0.88rem;
          line-height: 1.5;
        }
        .fb-loop__card-foot {
          margin: 0;
          font-size: 0.82rem;
          color: rgba(200, 210, 235, 0.75);
        }
        .fb-loop__sig {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fb-loop__sig-row {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 10px 14px;
          align-items: center;
          font-size: 0.82rem;
          color: var(--muted);
        }
        .fb-loop__sig-axis {
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .fb-loop__sig-bar {
          grid-column: 2;
          height: 3px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }
        .fb-loop__sig-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: calc(var(--fb-sv, 50) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(90, 110, 160, 0.35), rgba(123, 143, 255, 0.55));
        }
        .fb-loop__sig-meta {
          grid-column: 2;
          font-size: 0.78rem;
          opacity: 0.92;
        }
        .fb-loop__rules {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .fb-loop__rule {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.3);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        .fb-loop__rule-pri {
          display: inline-block;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 8px;
        }
        .fb-loop__rule-if,
        .fb-loop__rule-then {
          margin: 0 0 8px;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .fb-loop__tag {
          display: inline-block;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 8px;
        }
        .fb-loop__adj {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fb-loop__adj-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 6px 12px;
          font-size: 0.86rem;
          color: var(--muted);
        }
        .fb-loop__adj-axis {
          grid-column: 1 / -1;
          font-weight: 500;
          color: var(--text);
        }
        .fb-loop__adj-delta {
          font-family: var(--font-display);
          font-weight: 700;
          color: rgba(130, 200, 160, 0.95);
        }
        .fb-loop__adj-delta--neg {
          color: rgba(220, 150, 130, 0.95);
        }
        .fb-loop__adj-reason {
          grid-column: 1 / -1;
          font-size: 0.82rem;
          opacity: 0.9;
        }
        .fb-loop__prose {
          margin: 0 0 14px;
          color: var(--muted);
          line-height: 1.55;
          font-size: 0.9rem;
        }
        .fb-loop__echo {
          margin: 0 0 10px;
          padding: 12px 14px;
          border-left: 2px solid rgba(123, 143, 255, 0.35);
          color: rgba(210, 218, 245, 0.88);
          font-size: 0.86rem;
          background: rgba(0, 0, 0, 0.22);
        }
        .fb-loop__last {
          margin: 12px 0 0;
          font-size: 0.86rem;
          color: var(--muted);
        }
        .fb-loop__ev {
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(6, 8, 14, 0.72);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .fb-loop__ev.fb-ev--ok {
          box-shadow: inset 0 0 0 1px rgba(100, 160, 130, 0.12);
        }
        .fb-loop__ev.fb-ev--warn {
          box-shadow: inset 0 0 0 1px rgba(190, 160, 90, 0.14);
        }
        .fb-loop__ev.fb-ev--bad {
          box-shadow: inset 0 0 0 1px rgba(190, 100, 90, 0.16);
        }
        .fb-loop__ev-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px 14px;
          margin-bottom: 10px;
        }
        .fb-loop__ev-kind {
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(200, 210, 235, 0.9);
        }
        .fb-loop__ev-src {
          font-size: 0.72rem;
          color: var(--faint);
        }
        .fb-loop__ev-time {
          margin-left: auto;
          font-size: 0.72rem;
          color: var(--faint);
        }
        .fb-loop__ev-metric {
          margin: 0 0 8px;
          font-size: 0.86rem;
          color: var(--text);
        }
        .fb-loop__ev-conf {
          color: var(--muted);
          font-size: 0.8rem;
        }
        .fb-loop__ev-body,
        .fb-loop__ev-impact,
        .fb-loop__ev-rec {
          margin: 0 0 8px;
          font-size: 0.86rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .fb-loop__ev-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 10px 0 0;
        }
        .fb-loop__mono {
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          color: var(--faint);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .fb-loop__toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 50;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(12, 14, 22, 0.92);
          border: 1px solid rgba(123, 143, 255, 0.35);
          font-size: 0.82rem;
          color: var(--text);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        }
      `}</style>
    </div>
  );
}
