import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { PageHeaderCompact } from "../components/shell/PageHeaderCompact";
import { CollapsibleSection } from "../components/shell/CollapsibleSection";
import { useExecutiveMemory } from "../lib/executive-memory";
import { executiveMemoryToMarkdown, executiveMemoryToJson } from "../lib/executive-memory/export";
import { selectCoherenceLabel, selectOpenEpoch, selectRecentEpochs, selectTopPatterns } from "../lib/executive-memory/selectors";
import { groupPatternsByTemporalCategory } from "../lib/operational-timing";
import { groupPatternsByImpactMemory } from "../lib/business-impact";
import { copyToClipboard, downloadText } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

export function ExecutiveMemoryView({ onNavigate }: Props) {
  const { t } = useI18n();
  const { snapshot: snap } = useExecutiveMemory();
  const [toast, setToast] = useState<string | null>(null);

  const exportMd = useCallback(() => {
    downloadText(`vokra-executive-memory-${snap.pulseGeneration}.md`, executiveMemoryToMarkdown(snap));
  }, [snap]);

  const exportJson = useCallback(() => {
    downloadText(`vokra-executive-memory-${snap.pulseGeneration}.json`, executiveMemoryToJson(snap));
  }, [snap]);

  const copyMd = useCallback(async () => {
    await copyToClipboard(executiveMemoryToMarkdown(snap));
    setToast(t("em.toastCopied"));
    window.setTimeout(() => setToast(null), 2400);
  }, [snap, t]);

  const epochs = selectRecentEpochs(snap, 14);
  const patterns = selectTopPatterns(snap, 10);
  const temporalPatternGroups = useMemo(() => groupPatternsByTemporalCategory(patterns), [patterns]);
  const hasTemporalLens = useMemo(
    () =>
      (["timing_mistake", "early_scale", "late_reaction", "promo_overextension", "launch_decay"] as const).some(
        (k) => temporalPatternGroups[k].length > 0,
      ),
    [temporalPatternGroups],
  );
  const impactPatternGroups = useMemo(() => groupPatternsByImpactMemory(patterns), [patterns]);
  const hasImpactLens = useMemo(
    () =>
      (["leverage_structures", "drag_patterns", "scaling_erosion", "stabilization_successes"] as const).some(
        (k) => impactPatternGroups[k].length > 0,
      ),
    [impactPatternGroups],
  );
  const openEp = selectOpenEpoch(snap);

  return (
    <div className="em">
      <PageHeaderCompact
        eyebrow={t("em.eyebrow")}
        title={t("em.title")}
        purpose={t("em.subtitle")}
        actions={
          <>
            <button type="button" className="em__btn" onClick={exportMd}>
              {t("em.exportMd")}
            </button>
            <button type="button" className="em__btn" onClick={exportJson}>
              {t("em.exportJson")}
            </button>
            <button type="button" className="em__btn em__btn--pri" onClick={() => void copyMd()}>
              {t("em.copyMd")}
            </button>
          </>
        }
        meta={
          <CollapsibleSection title={t("em.related")}>
            <nav className="em__links" aria-label={t("em.related")}>
              <button type="button" className="em__link em__link--pri" onClick={() => onNavigate("memory")}>
                {t("em.openProjectMemory")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("strategyEvolution")}>
                {t("nav.strategyEvolution")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("missionControl")}>
                {t("nav.missionControl")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("temporalStrategy")}>
                {t("nav.temporalStrategy")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("strategicSimulation")}>
                {t("nav.strategicSimulation")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("executionOrchestrator")}>
                {t("nav.executionOrchestrator")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("signalFabric")}>
                {t("nav.signalFabric")}
              </button>
              <button type="button" className="em__link" onClick={() => onNavigate("organismModel")}>
                {t("nav.organismModel")}
              </button>
            </nav>
          </CollapsibleSection>
        }
      />

      <section className="em__sources glass-panel" aria-labelledby="em-sources-title">
        <h2 id="em-sources-title" className="em__h2 em__h2--sources">
          {t("em.sourcesTitle")}
        </h2>
        <p className="em__sources-intro">{t("em.architectureBridge")}</p>
        <p className="em__sources-sub">{t("em.sourcesIntro")}</p>
        <ul className="em__sources-list">
          <li>{t("em.sourceProjectRecords")}</li>
          <li>{t("em.sourceCognitivePulses")}</li>
          <li>{t("em.sourceExecutionRoutes")}</li>
          <li>{t("em.sourceFeedbackOutcomes")}</li>
          <li>{t("em.sourceSignalFabric")}</li>
        </ul>
        <p className="em__sources-foot">
          {t("em.projectRecordsInfluence", { n: String(snap.projectMemoryInfluenceCount) })}
        </p>
        <button type="button" className="em__sources-btn" onClick={() => onNavigate("memory")}>
          {t("em.openProjectMemory")}
        </button>
      </section>

      <section className="em__atmos glass-panel">
        <p className="em__narrative">{snap.narrativeStateRu}</p>
        <p className="em__summary">{snap.executiveSummaryRu}</p>
        <div className="em__coh">
          <span className="em__coh-k">{t("em.coherence")}</span>
          <span className="em__coh-v">{selectCoherenceLabel(snap)}</span>
          <span className="em__coh-n">{Math.round(snap.longTermCoherence01 * 100)}%</span>
        </div>
      </section>

      <div className="em__grid">
        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.epochs")}</h2>
          {openEp ? (
            <p className="em__open">
              <span className="em__tag">{t("em.openEpoch")}</span> {openEp.kind} · {openEp.narrativeStateRu}
            </p>
          ) : null}
          <ol className="em__timeline">
            {epochs.map((e) => (
              <li key={e.id} className="em__epoch" data-em-weight={e.memoryWeight}>
                <div className="em__epoch-top">
                  <span className="em__epoch-kind">{e.kind}</span>
                  <span className="em__epoch-pulse">
                    {e.startPulse}→{e.endPulse ?? "…"}
                  </span>
                </div>
                <p className="em__epoch-body">{e.executiveSummaryRu}</p>
                <p className="em__epoch-meta">
                  {t("em.tension")} {Math.round(e.strategicTension01 * 100)}% · {e.dominantRegime} · {e.memoryWeight}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.patterns")}</h2>
          <p className="em__panel-intro">{t("em.opPatternsIntro")}</p>
          <ul className="em__list">
            {patterns.map((p) => (
              <li key={p.id} className="em__pattern" data-em-weight={p.weightCategory}>
                <span className="em__pattern-stat">
                  {t("em.patternLine", {
                    n: String(p.recurrence),
                    lev: (p.historicalLeverage01 * 100).toFixed(0),
                    conf: (p.confidence01 * 100).toFixed(0),
                    w: p.weightCategory,
                  })}
                </span>
                <p className="em__pattern-t">{p.labelRu}</p>
              </li>
            ))}
          </ul>
        </section>

        {hasTemporalLens ? (
        <section className="em__panel glass-panel em__panel--wide">
          <h2 className="em__h2">{t("em.temporalPatternsTitle")}</h2>
          <p className="em__panel-intro">{t("em.temporalPatternsIntro")}</p>
          {(
            ["timing_mistake", "early_scale", "late_reaction", "promo_overextension", "launch_decay"] as const
          ).map((cat) => {
            const list = temporalPatternGroups[cat];
            if (!list.length) return null;
            return (
              <div key={cat} className="em__tpc">
                <h3 className="em__tpc-h">{t(`em.temporalCat.${cat}`)}</h3>
                <ul className="em__list em__list--tight">
                  {list.map((p) => (
                    <li key={p.id} className="em__pattern" data-em-weight={p.weightCategory}>
                      <span className="em__pattern-stat">
                        {t("em.patternLine", {
                          n: String(p.recurrence),
                          lev: (p.historicalLeverage01 * 100).toFixed(0),
                          conf: (p.confidence01 * 100).toFixed(0),
                          w: p.weightCategory,
                        })}
                      </span>
                      <p className="em__pattern-t">{p.labelRu}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
        ) : null}

        {hasImpactLens ? (
          <section className="em__panel glass-panel em__panel--wide">
            <h2 className="em__h2">{t("em.impactMemoryTitle")}</h2>
            <p className="em__panel-intro">{t("em.impactMemoryIntro")}</p>
            {(
              ["leverage_structures", "drag_patterns", "scaling_erosion", "stabilization_successes"] as const
            ).map((cat) => {
              const list = impactPatternGroups[cat];
              if (!list.length) return null;
              return (
                <div key={cat} className="em__tpc">
                  <h3 className="em__tpc-h">{t(`em.impactCat.${cat}`)}</h3>
                  <ul className="em__list em__list--tight">
                    {list.map((p) => (
                      <li key={p.id} className="em__pattern" data-em-weight={p.weightCategory}>
                        <span className="em__pattern-stat">
                          {t("em.patternLine", {
                            n: String(p.recurrence),
                            lev: (p.historicalLeverage01 * 100).toFixed(0),
                            conf: (p.confidence01 * 100).toFixed(0),
                            w: p.weightCategory,
                          })}
                        </span>
                        <p className="em__pattern-t">{p.labelRu}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ) : null}

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.drift")}</h2>
          <p className="em__drift-cap">{snap.drift.captionRu}</p>
          <ul className="em__drift-grid">
            <li>
              <span className="em__dk">DNA drift</span>
              <span className="em__dv">{(snap.drift.brandDnaDrift01 * 100).toFixed(0)}%</span>
            </li>
            <li>
              <span className="em__dk">Narrative dilution</span>
              <span className="em__dv">{(snap.drift.narrativeDilution01 * 100).toFixed(0)}%</span>
            </li>
            <li>
              <span className="em__dk">Executive fragmentation</span>
              <span className="em__dv">{(snap.drift.executiveFragmentation01 * 100).toFixed(0)}%</span>
            </li>
            <li>
              <span className="em__dk">Operational drag acc.</span>
              <span className="em__dv">{(snap.drift.operationalDragAcc01 * 100).toFixed(0)}%</span>
            </li>
            <li>
              <span className="em__dk">SEO saturation</span>
              <span className="em__dv">{(snap.drift.seoSaturationGrowth01 * 100).toFixed(0)}%</span>
            </li>
            <li>
              <span className="em__dk">Visual fatigue</span>
              <span className="em__dv">{(snap.drift.visualFatigueAcc01 * 100).toFixed(0)}%</span>
            </li>
            <li>
              <span className="em__dk">Premium erosion</span>
              <span className="em__dv">{(snap.drift.premiumPerceptionErosion01 * 100).toFixed(0)}%</span>
            </li>
          </ul>
        </section>

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.pressureMap")}</h2>
          <ul className="em__pressure">
            {snap.historicalPressureMap.map((row, i) => (
              <li key={i}>
                <div className="em__pressure-row">
                  <span>{row.labelRu}</span>
                  <span>{Math.round(row.value01 * 100)}%</span>
                </div>
                <div className="em__pressure-bar" style={{ "--em-p": row.value01 } as CSSProperties} aria-hidden />
              </li>
            ))}
          </ul>
        </section>

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.canonical")}</h2>
          <ul className="em__list">
            {snap.canonicalMemories.map((m) => (
              <li key={m.id} className="em__canon" data-em-weight={m.weight}>
                <p className="em__canon-t">{m.titleRu}</p>
                <p className="em__canon-b">{m.bodyRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.scars")}</h2>
          <ul className="em__list">
            {snap.strategicScars.map((s) => (
              <li key={s.id} className="em__scar">
                <span className="em__scar-sev">{(s.severity01 * 100).toFixed(0)}%</span>
                <p className="em__scar-t">{s.labelRu}</p>
                <p className="em__scar-l">{s.lessonRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.recoveries")}</h2>
          <ul className="em__list">
            {snap.recoveredStates.map((r) => (
              <li key={r.id} className="em__rec">
                <span className="em__rec-p">пульс {r.pulse}</span>
                <p className="em__rec-t">{r.labelRu}</p>
                <p className="em__rec-n">{r.noteRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="em__panel glass-panel">
          <h2 className="em__h2">{t("em.launchMistakes")}</h2>
          <p className="em__panel-intro">{t("em.launchMistakesSub")}</p>
          <ul className="em__list">
            {snap.launchMistakes.map((lm) => (
              <li key={lm.id} className="em__lm">
                <span className="em__lm-n">×{lm.recurrence}</span>
                <p>{lm.labelRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="em__panel glass-panel em__panel--wide">
          <h2 className="em__h2">{t("em.hints")}</h2>
          <p className="em__hints">
            {t("em.hintsBody", {
              tb: snap.hints.tensionBias.toFixed(3),
              cb: snap.hints.confidenceBias.toFixed(3),
              sb: snap.hints.stabilityBias.toFixed(3),
              im: snap.hints.initiativeWeightMul.toFixed(3),
            })}
          </p>
        </section>
      </div>

      {toast ? (
        <div className="em__toast" role="status">
          {toast}
        </div>
      ) : null}

      <style>{`
        .em { padding: 0 0 56px; }
        .em__btn {
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: transparent;
          color: rgba(210, 215, 232, 0.85);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 10px 14px;
          cursor: pointer;
        }
        .em__btn:hover {
          border-color: rgba(200, 210, 235, 0.35);
          color: var(--text);
        }
        .em__btn--pri { border-color: rgba(200, 210, 235, 0.45); }
        .em__links { display: flex; flex-wrap: wrap; gap: 8px 12px; }
        .em__link {
          border: none;
          background: transparent;
          color: rgba(150, 160, 185, 0.75);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
        }
        .em__link:hover { color: rgba(220, 225, 240, 0.95); }
        .em__link--pri { color: rgba(200, 210, 235, 0.92); }
        .em__sources {
          padding: 18px 22px;
          margin-bottom: 18px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .em__h2--sources { margin-bottom: 10px; }
        .em__sources-intro,
        .em__sources-sub {
          margin: 0 0 10px;
          font-size: 0.78rem;
          line-height: 1.55;
          color: rgba(165, 178, 205, 0.88);
          max-width: 48rem;
        }
        .em__sources-sub {
          font-size: 0.72rem;
          color: rgba(140, 155, 180, 0.72);
          margin-bottom: 12px;
        }
        .em__sources-list {
          margin: 0 0 14px;
          padding-left: 1.1rem;
          font-size: 0.74rem;
          line-height: 1.55;
          color: rgba(175, 188, 212, 0.85);
        }
        .em__sources-list li { margin-bottom: 4px; }
        .em__sources-foot {
          margin: 0 0 14px;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          color: rgba(190, 200, 220, 0.9);
        }
        .em__sources-btn {
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(200, 210, 232, 0.88);
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 9px 14px;
          cursor: pointer;
        }
        .em__sources-btn:hover {
          border-color: rgba(200, 210, 235, 0.35);
          color: var(--text);
        }
        .em__atmos {
          padding: 22px 24px;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .em__atmos::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.06;
          background: radial-gradient(ellipse 90% 60% at 20% 0%, rgba(130, 150, 200, 0.35), transparent 55%);
        }
        .em__narrative, .em__summary {
          position: relative;
          z-index: 1;
          margin: 0 0 12px;
          font-size: 0.88rem;
          line-height: 1.55;
          color: rgba(175, 185, 210, 0.88);
        }
        .em__summary { font-size: 0.8rem; color: rgba(155, 168, 195, 0.75); }
        .em__coh {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          align-items: baseline;
          font-size: 0.72rem;
          color: rgba(190, 200, 220, 0.85);
        }
        .em__coh-k {
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 0.55rem;
          color: var(--faint);
        }
        .em__coh-v { flex: 1 1 auto; }
        .em__coh-n { font-family: var(--font-display); letter-spacing: 0.12em; }
        .em__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 900px) { .em__grid { grid-template-columns: 1fr; } }
        .em__panel {
          padding: 18px 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .em__panel--wide { grid-column: 1 / -1; }
        .em__h2 {
          font-size: 0.58rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(135, 148, 175, 0.65);
          margin: 0 0 14px;
        }
        .em__panel-intro {
          margin: -8px 0 14px;
          font-size: 0.72rem;
          line-height: 1.45;
          color: rgba(140, 152, 178, 0.72);
          max-width: 42rem;
        }
        .em__open { font-size: 0.76rem; color: rgba(200, 210, 230, 0.88); margin: 0 0 12px; }
        .em__tag {
          font-size: 0.52rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 8px;
        }
        .em__timeline {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .em__epoch {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.18);
        }
        .em__epoch-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .em__epoch-kind {
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(200, 210, 235, 0.85);
        }
        .em__epoch-pulse { font-size: 0.58rem; color: rgba(140, 155, 180, 0.55); }
        .em__epoch-body {
          margin: 0 0 8px;
          font-size: 0.78rem;
          line-height: 1.45;
          color: rgba(165, 175, 200, 0.85);
        }
        .em__epoch-meta {
          margin: 0;
          font-size: 0.65rem;
          color: rgba(130, 145, 170, 0.55);
        }
        .em__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .em__list--tight {
          gap: 8px;
        }
        .em__tpc {
          margin-bottom: 14px;
        }
        .em__tpc:last-child {
          margin-bottom: 0;
        }
        .em__tpc-h {
          margin: 0 0 8px;
          font-size: 0.52rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(145, 158, 185, 0.72);
        }
        .em__pattern-stat {
          font-size: 0.58rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(140, 155, 180, 0.55);
        }
        .em__pattern-t {
          margin: 6px 0 4px;
          font-size: 0.82rem;
          line-height: 1.45;
          color: rgba(210, 218, 238, 0.9);
        }
        .em__pattern-sub {
          margin: 0;
          font-size: 0.7rem;
          color: rgba(150, 165, 190, 0.7);
        }
        .em__drift-cap {
          margin: 0 0 14px;
          font-size: 0.8rem;
          line-height: 1.5;
          color: rgba(175, 188, 212, 0.88);
        }
        .em__drift-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 12px;
          font-size: 0.72rem;
        }
        .em__dk {
          display: block;
          color: rgba(130, 145, 170, 0.55);
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .em__dv { color: rgba(210, 218, 235, 0.88); }
        .em__pressure li { margin-bottom: 12px; }
        .em__pressure-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          margin-bottom: 4px;
          color: rgba(175, 188, 210, 0.85);
        }
        .em__pressure-bar {
          height: 2px;
          background: rgba(255, 255, 255, 0.05);
          position: relative;
        }
        .em__pressure-bar::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: calc(var(--em-p, 0.3) * 100%);
          max-width: 100%;
          background: rgba(160, 180, 220, 0.35);
        }
        .em__canon-t { margin: 0 0 6px; font-weight: 600; font-size: 0.8rem; }
        .em__canon-b {
          margin: 0;
          font-size: 0.74rem;
          line-height: 1.45;
          color: rgba(155, 168, 195, 0.82);
        }
        .em__scar-sev {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          color: rgba(200, 170, 150, 0.75);
        }
        .em__scar-t { margin: 6px 0 4px; font-size: 0.8rem; }
        .em__scar-l {
          margin: 0;
          font-size: 0.74rem;
          color: rgba(165, 175, 200, 0.8);
          line-height: 1.45;
        }
        .em__rec-p {
          font-size: 0.55rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(140, 160, 190, 0.55);
        }
        .em__rec-t { margin: 4px 0; font-weight: 600; font-size: 0.8rem; }
        .em__rec-n {
          margin: 0;
          font-size: 0.74rem;
          color: rgba(155, 170, 195, 0.82);
          line-height: 1.45;
        }
        .em__lm-n {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          color: rgba(200, 175, 155, 0.75);
          margin-right: 8px;
        }
        .em__hints {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.55;
          color: rgba(160, 172, 198, 0.85);
        }
        .em__toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 50;
          padding: 10px 14px;
          border: 1px solid rgba(200, 210, 235, 0.25);
          background: rgba(8, 10, 16, 0.95);
          font-size: 0.78rem;
        }
      `}</style>
    </div>
  );
}
