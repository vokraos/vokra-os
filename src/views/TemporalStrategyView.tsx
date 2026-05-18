import { useCallback, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  temporalStrategyToJson,
  temporalStrategyToMarkdown,
  TEMPORAL_PHASE_RU,
  TIMING_RECOMMENDATION_RU,
  useTemporalStrategy,
} from "../lib/temporal-strategy";
import type { TemporalHorizonKey } from "../lib/temporal-strategy/types";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = {
  onNavigate: (id: NavId) => void;
};

function horizonLabel(t: (k: string) => string, h: TemporalHorizonKey): string {
  if (h === "seasonal") return t("sim.horizon.seasonal");
  if (h === "longTail") return t("sim.horizon.longTail");
  return t(`sim.horizon.${h}`);
}

function pickHorizon(s: ReturnType<typeof useTemporalStrategy>, key: TemporalHorizonKey) {
  return s.horizons.find((x) => x.horizon === key);
}

export function TemporalStrategyView({ onNavigate }: Props) {
  const { t } = useI18n();
  const snapshot = useTemporalStrategy();
  const [toast, setToast] = useState<string | null>(null);

  const h7 = pickHorizon(snapshot, "d7");
  const h30 = pickHorizon(snapshot, "d30");
  const h90 = pickHorizon(snapshot, "d90");

  const saveToMemory = useCallback(() => {
    const json = temporalStrategyToJson(snapshot);
    recordGeneration({
      module: "temporal_strategy",
      title: `Временная стратегия · пульс ${snapshot.pulseGeneration}`,
      content: json,
      mime: "application/json",
      tags: ["temporal", "strategy", TEMPORAL_PHASE_RU[snapshot.phase]],
    });
    setToast(t("temporal.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [snapshot, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-temporal-strategy-${snapshot.pulseGeneration}.json`, snapshot);
  }, [snapshot]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-temporal-strategy-${snapshot.pulseGeneration}.md`, temporalStrategyToMarkdown(snapshot));
  }, [snapshot]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(temporalStrategyToJson(snapshot));
    setToast("JSON скопирован");
    window.setTimeout(() => setToast(null), 2200);
  }, [snapshot]);

  const d = snapshot.decay;

  return (
    <div className="ts-lab" data-ts-pulse={snapshot.pulseGeneration % 1000}>
      <header className="ts-lab__head">
        <p className="ts-lab__eyebrow">{t("temporal.eyebrow")}</p>
        <h1 className="ts-lab__title">{t("temporal.title")}</h1>
        <p className="ts-lab__lede">{t("temporal.subtitle")}</p>
      </header>

      <div className="ts-lab__grid">
        <section className="ts-lab__panel glass-panel ts-lab__phase">
          <h2 className="ts-lab__h2">{t("temporal.phase")}</h2>
          <p className="ts-lab__phase-name">{TEMPORAL_PHASE_RU[snapshot.phase]}</p>
          <p className="ts-lab__meta">
            {t("temporal.phaseConfidence")}: {Math.round(snapshot.phaseConfidence)}%
          </p>
          <div className="ts-lab__diff" style={{ "--ts-v": snapshot.phaseConfidence } as CSSProperties} />
        </section>

        <section className="ts-lab__panel glass-panel">
          <h2 className="ts-lab__h2">{t("temporal.nextRisk")}</h2>
          <p className="ts-lab__prose">{snapshot.nextRiskWindowRu}</p>
          <h2 className="ts-lab__h2 ts-lab__h2--sp">{t("temporal.bestLaunch")}</h2>
          <p className="ts-lab__prose">{snapshot.bestLaunchWindowRu}</p>
        </section>

        <section className="ts-lab__panel glass-panel">
          <h2 className="ts-lab__h2">{t("temporal.fatigue")}</h2>
          <p className="ts-lab__prose">{snapshot.fatigueForecastRu}</p>
          <h2 className="ts-lab__h2 ts-lab__h2--sp">{t("temporal.patience")}</h2>
          <div className="ts-lab__diff" style={{ "--ts-v": snapshot.patienceScore } as CSSProperties} />
          <p className="ts-lab__score">{snapshot.patienceScore}/100</p>
        </section>
      </div>

      <section className="ts-lab__panel glass-panel ts-lab__trajectory">
        <h2 className="ts-lab__h2">{t("temporal.trajectory")}</h2>
        <div className="ts-lab__tri">
          {[h7, h30, h90].map((h, i) =>
            h ? (
              <div key={h.horizon} className="ts-lab__tri-cell">
                <span className="ts-lab__tri-k">{horizonLabel(t, h.horizon)}</span>
                <p className="ts-lab__tri-body">{h.trajectoryRu}</p>
                <span className="ts-lab__tri-int">{h.intensity}%</span>
              </div>
            ) : (
              <div key={i} className="ts-lab__tri-cell" />
            ),
          )}
        </div>
      </section>

      <section className="ts-lab__panel glass-panel">
        <h2 className="ts-lab__h2">{t("temporal.decay")}</h2>
        <div className="ts-lab__decay">
          {(
            [
              ["decayCtr", d.ctrFatigue],
              ["decayVisual", d.visualFatigue],
              ["decayEmotion", d.emotionalNoveltyDecay],
              ["decaySeo", d.seoSaturation],
              ["decayComp", d.competitorImitation],
              ["decayProd", d.productionOverload],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="ts-lab__decay-cell">
              <span className="ts-lab__decay-k">{t(`temporal.${k}`)}</span>
              <div className="ts-lab__diff ts-lab__diff--thin" style={{ "--ts-v": v } as CSSProperties} />
            </div>
          ))}
        </div>
      </section>

      <div className="ts-lab__split">
        <section className="ts-lab__panel glass-panel">
          <h2 className="ts-lab__h2">{t("temporal.recommend")}</h2>
          <p className="ts-lab__timing">{TIMING_RECOMMENDATION_RU[snapshot.recommendedTiming]}</p>
        </section>
        <section className="ts-lab__panel glass-panel">
          <h2 className="ts-lab__h2">{t("temporal.horizons")}</h2>
          <ul className="ts-lab__hor-list">
            {snapshot.horizons.map((h) => (
              <li key={h.horizon}>
                <span className="ts-lab__hor-k">{horizonLabel(t, h.horizon)}</span>
                <span className="ts-lab__hor-body">{h.opportunityRu}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ts-lab__panel glass-panel">
        <h2 className="ts-lab__h2">{t("temporal.narrative")}</h2>
        <div className="ts-lab__nar">
          <p>{snapshot.narrative.themeEvolutionRu}</p>
          <p>{snapshot.narrative.visualLanguageChangeRu}</p>
          <p>{snapshot.narrative.consistencyAnchorRu}</p>
          <p>{snapshot.narrative.nextDropTimingRu}</p>
        </div>
      </section>

      <section className="ts-lab__panel glass-panel">
        <h2 className="ts-lab__h2">{t("temporal.integrations")}</h2>
        <ul className="ts-lab__int">
          <li>{snapshot.integration.initiativeSummaryRu}</li>
          <li>{snapshot.integration.memorySummaryRu}</li>
          <li>{snapshot.integration.missionControlRu}</li>
          <li>{snapshot.integration.trendRadarRu}</li>
          <li>{snapshot.integration.strategicCommandRu}</li>
        </ul>
      </section>

      <section className="ts-lab__timeline glass-panel" aria-labelledby="ts-tl-title">
        <h2 id="ts-tl-title" className="ts-lab__h2">
          {t("temporal.timeline")}
        </h2>
        <div className="ts-lab__tl">
          <span className="ts-lab__tl-line" aria-hidden />
          {snapshot.timelineCards.map((c) => (
            <div key={c.id} className={`ts-lab__tl-node ts-lab__tl-node--${c.emphasis}`}>
              <span className="ts-lab__tl-dot" aria-hidden />
              <div className="ts-lab__tl-card">
                <span className="ts-lab__tl-hor">{horizonLabel(t, c.horizon)}</span>
                <h3 className="ts-lab__tl-title">{c.titleRu}</h3>
                <p className="ts-lab__tl-body">{c.bodyRu}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ts-lab__actions">
        <button type="button" className="ts-lab__btn ts-lab__btn--primary" onClick={saveToMemory}>
          {t("temporal.saveMemory")}
        </button>
        <button type="button" className="ts-lab__btn" onClick={exportJson}>
          {t("temporal.exportJson")}
        </button>
        <button type="button" className="ts-lab__btn" onClick={exportMd}>
          {t("temporal.exportMd")}
        </button>
        <button type="button" className="ts-lab__btn" onClick={() => void copyJson()}>
          {t("temporal.copyJson")}
        </button>
      </div>

      <div className="ts-lab__links">
        <span className="ts-lab__links-k">{t("temporal.links")}</span>
        <button type="button" className="ts-lab__link" onClick={() => onNavigate("missionControl")}>
          {t("temporal.linkMission")}
        </button>
        <button type="button" className="ts-lab__link" onClick={() => onNavigate("trends")}>
          {t("temporal.linkTrends")}
        </button>
        <button type="button" className="ts-lab__link" onClick={() => onNavigate("command")}>
          {t("temporal.linkCommand")}
        </button>
        <button type="button" className="ts-lab__link" onClick={() => onNavigate("memory")}>
          {t("temporal.linkMemory")}
        </button>
      </div>

      {toast ? <p className="ts-lab__toast">{toast}</p> : null}

      <style>{`
        .ts-lab {
          max-width: 1120px;
          margin: 0 auto;
          padding: 8px 4px 48px;
        }
        .ts-lab__head {
          margin-bottom: 24px;
        }
        .ts-lab__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 10px;
        }
        .ts-lab__title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.55rem, 3vw, 2.2rem);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .ts-lab__lede {
          margin: 0;
          max-width: 52rem;
          color: var(--muted);
          font-size: 0.92rem;
          line-height: 1.55;
        }
        .ts-lab__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px) {
          .ts-lab__grid {
            grid-template-columns: 1fr;
          }
        }
        .ts-lab__panel {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
        }
        .ts-lab__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 10px;
          font-weight: 500;
        }
        .ts-lab__h2--sp {
          margin-top: 14px;
        }
        .ts-lab__phase-name {
          font-family: var(--font-display);
          font-size: 1.35rem;
          letter-spacing: 0.04em;
          margin: 0 0 8px;
          text-transform: lowercase;
        }
        .ts-lab__meta {
          margin: 0 0 10px;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .ts-lab__prose,
        .ts-lab__nar p,
        .ts-lab__int li {
          margin: 0 0 8px;
          font-size: 0.82rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .ts-lab__nar p:last-child,
        .ts-lab__int li:last-child {
          margin-bottom: 0;
        }
        .ts-lab__diff {
          display: block;
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }
        .ts-lab__diff--thin {
          height: 3px;
        }
        .ts-lab__diff::after {
          content: "";
          position: absolute;
          inset: 0;
          width: calc(var(--ts-v, 50) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(100, 115, 160, 0.2), rgba(160, 175, 220, 0.45));
        }
        .ts-lab__score {
          margin: 8px 0 0;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          color: var(--faint);
        }
        .ts-lab__trajectory {
          margin-bottom: 16px;
        }
        .ts-lab__tri {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 720px) {
          .ts-lab__tri {
            grid-template-columns: 1fr;
          }
        }
        .ts-lab__tri-cell {
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
        }
        .ts-lab__tri-k {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ts-lab__tri-body {
          margin: 8px 0 0;
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .ts-lab__tri-int {
          display: block;
          margin-top: 8px;
          font-size: 0.65rem;
          color: rgba(150, 165, 195, 0.45);
          letter-spacing: 0.1em;
        }
        .ts-lab__decay {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px 16px;
        }
        @media (max-width: 720px) {
          .ts-lab__decay {
            grid-template-columns: 1fr 1fr;
          }
        }
        .ts-lab__decay-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ts-lab__decay-k {
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--faint);
        }
        .ts-lab__split {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px) {
          .ts-lab__split {
            grid-template-columns: 1fr;
          }
        }
        .ts-lab__timing {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.03em;
          color: rgba(220, 225, 238, 0.9);
        }
        .ts-lab__hor-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ts-lab__hor-k {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 4px;
        }
        .ts-lab__hor-body {
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .ts-lab__int {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--muted);
          font-size: 0.82rem;
          line-height: 1.55;
        }
        .ts-lab__timeline {
          margin-bottom: 20px;
          padding: 20px 22px 24px;
          border-radius: var(--radius-xl);
        }
        .ts-lab__tl {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding-left: 20px;
        }
        .ts-lab__tl-line {
          position: absolute;
          left: 5px;
          top: 8px;
          bottom: 8px;
          width: 1px;
          background: linear-gradient(180deg, rgba(123, 143, 255, 0.15), rgba(255, 255, 255, 0.06), rgba(123, 143, 255, 0.1));
        }
        .ts-lab__tl-node {
          position: relative;
          padding: 12px 0 12px 16px;
        }
        .ts-lab__tl-dot {
          position: absolute;
          left: -15px;
          top: 22px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(130, 145, 185, 0.35);
          box-shadow: 0 0 14px rgba(123, 143, 255, 0.15);
        }
        .ts-lab__tl-node--high .ts-lab__tl-dot {
          background: rgba(180, 195, 235, 0.55);
        }
        .ts-lab__tl-card {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(0, 0, 0, 0.28);
        }
        .ts-lab__tl-hor {
          font-size: 0.52rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ts-lab__tl-title {
          margin: 6px 0 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(220, 225, 238, 0.88);
        }
        .ts-lab__tl-body {
          margin: 0;
          font-size: 0.76rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .ts-lab__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }
        .ts-lab__btn {
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
        .ts-lab__btn:hover {
          border-color: rgba(123, 143, 255, 0.35);
          color: var(--text);
        }
        .ts-lab__btn--primary {
          border-color: rgba(123, 143, 255, 0.45);
          color: var(--text);
          background: rgba(123, 143, 255, 0.08);
        }
        .ts-lab__links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 14px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ts-lab__links-k {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 8px;
        }
        .ts-lab__link {
          border: none;
          background: none;
          color: rgba(160, 175, 215, 0.75);
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .ts-lab__link:hover {
          color: var(--text);
        }
        .ts-lab__toast {
          margin: 12px 0 0;
          font-size: 0.78rem;
          color: rgba(160, 200, 160, 0.85);
        }
      `}</style>
    </div>
  );
}
