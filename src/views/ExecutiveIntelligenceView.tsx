import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  EXECUTIVE_REGIME_RU,
  executiveIntelligenceToJson,
  executiveIntelligenceToMarkdown,
  useExecutiveIntelligence,
} from "../lib/executive-intelligence";
import { useCognitiveOs } from "../lib/cognitive-os";
import { useExecutionOrchestrator } from "../lib/execution-orchestrator";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";
import { PageHeaderCompact } from "../components/shell/PageHeaderCompact";
import { CollapsibleSection } from "../components/shell/CollapsibleSection";
import { ExecutiveSurface } from "../components/executive-surface/ExecutiveSurface";
import { useLiveState, deriveExecutiveMicrostate } from "../lib/live-state";

type Props = { onNavigate: (id: NavId) => void };

function clipRu(s: string, max: number): string {
  const x = s.trim();
  if (x.length <= max) return x;
  return `${x.slice(0, max - 1).trimEnd()}…`;
}

export function ExecutiveIntelligenceView({ onNavigate }: Props) {
  const { t } = useI18n();
  const snap = useExecutiveIntelligence();
  const { synthesis, decision } = useCognitiveOs();
  const orchestration = useExecutionOrchestrator();
  const { live } = useLiveState();
  const [toast, setToast] = useState<string | null>(null);

  const eicMicro = useMemo(() => {
    const maxSev =
      snap.strategicContradictions.length > 0 ? Math.max(...snap.strategicContradictions.map((c) => c.severity)) : 0;
    return deriveExecutiveMicrostate({
      live,
      maxContradictionSeverity: maxSev,
      stabilityIndex: snap.stabilityIndex,
      cognitiveConflictCount: snap.cognitiveConflicts.length,
    });
  }, [live, snap]);

  const contradictionsTop = useMemo(
    () => [...snap.strategicContradictions].sort((a, b) => b.severity - a.severity).slice(0, 3),
    [snap.strategicContradictions],
  );
  const contradictionsRest = useMemo(
    () => [...snap.strategicContradictions].sort((a, b) => b.severity - a.severity).slice(3),
    [snap.strategicContradictions],
  );
  const conflictsTop = useMemo(
    () => [...snap.cognitiveConflicts].sort((a, b) => b.severity - a.severity).slice(0, 3),
    [snap.cognitiveConflicts],
  );
  const conflictsRest = useMemo(
    () => [...snap.cognitiveConflicts].sort((a, b) => b.severity - a.severity).slice(3),
    [snap.cognitiveConflicts],
  );
  const directivesHead = snap.directives.slice(0, 2);
  const directivesTail = snap.directives.slice(2);

  const eicShellStyle = useMemo(
    () =>
      ({
        "--eic-live-tension": String(live.strategicTension.index01),
        "--eic-live-settling": String(live.confidenceDrift.settling01),
        "--eic-live-coh": String(snap.stabilityIndex / 100),
        "--eic-live-pulse-sec": `${live.executiveBreath.periodSec}s`,
      }) as CSSProperties,
    [live, snap.stabilityIndex],
  );

  const saveToMemory = useCallback(() => {
    recordGeneration({
      module: "executive_intelligence",
      title: `${t("eic.title")} · пульс ${snap.pulseGeneration}`,
      content: executiveIntelligenceToJson(snap),
      mime: "application/json",
      tags: ["executive_intelligence", "core", `pulse:${snap.pulseGeneration}`],
    });
    setToast(t("eic.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [snap, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-executive-intelligence-${snap.pulseGeneration}.json`, snap);
  }, [snap]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-executive-intelligence-${snap.pulseGeneration}.md`, executiveIntelligenceToMarkdown(snap));
  }, [snap]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(executiveIntelligenceToJson(snap));
    setToast(t("eic.toastCopied"));
    window.setTimeout(() => setToast(null), 2200);
  }, [snap, t]);

  const ec = snap.executiveConfidence;

  return (
    <div
      className="eic"
      data-eic-pulse={snap.pulseGeneration % 1000}
      data-eic-live-microstate={eicMicro}
      data-eic-live-profile={live.regimeTransition.profile}
      style={eicShellStyle}
    >
      <PageHeaderCompact
        eyebrow={t("eic.eyebrow")}
        title={t("eic.title")}
        purpose={t("eic.subtitle")}
        actions={
          <>
            <button type="button" className="eic__btn" onClick={exportJson}>
              {t("eic.exportJson")}
            </button>
            <button type="button" className="eic__btn" onClick={exportMd}>
              {t("eic.exportMd")}
            </button>
            <button type="button" className="eic__btn" onClick={() => void copyJson()}>
              {t("eic.copyJson")}
            </button>
            <button type="button" className="eic__btn eic__btn--pri" onClick={saveToMemory}>
              {t("eic.saveMemory")}
            </button>
          </>
        }
        meta={
          <CollapsibleSection title={t("eic.related")}>
            <nav className="eic__links eic__links--compact" aria-label={t("eic.related")}>
              <button type="button" className="eic__link" onClick={() => onNavigate("missionControl")}>
                {t("nav.missionControl")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("signalFabric")}>
                {t("nav.signalFabric")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("temporalStrategy")}>
                {t("nav.temporalStrategy")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("strategicSimulation")}>
                {t("nav.strategicSimulation")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("executionOrchestrator")}>
                {t("nav.executionOrchestrator")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("feedbackLoop")}>
                {t("nav.feedbackLoop")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("brandEvolution")}>
                {t("nav.brandEvolution")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("trends")}>
                {t("nav.trends")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("command")}>
                {t("nav.command")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("dna")}>
                {t("nav.dna")}
              </button>
              <button type="button" className="eic__link" onClick={() => onNavigate("memory")}>
                {t("nav.memory")}
              </button>
            </nav>
          </CollapsibleSection>
        }
      />

      <ExecutiveSurface tone="dashboard" />

      <section className="eic__lead glass-panel">
        <span className="eic__verdict-field" aria-hidden />
        <p className="eic__lead-eyebrow">{t("eic.mainDecisionQ")}</p>
        <p className="eic__lead-headline">{decision.priorityHeadlineRu}</p>
        <p className="eic__lead-regime">{EXECUTIVE_REGIME_RU[snap.regime]}</p>
        {contradictionsTop.length ? (
          <ul className="eic__lead-tensions">
            {contradictionsTop.slice(0, 3).map((c) => (
              <li key={c.id}>
                <span className="eic__lead-sev">{c.severity}%</span> {c.summaryRu}
              </li>
            ))}
          </ul>
        ) : null}
        <details className="eic__lead-more">
          <summary className="eic__lead-more-sum">{t("eic.regimeContextDetail")}</summary>
          <p className="eic__lead-exp">{clipRu(snap.regimeExplanationRu, 260)}</p>
          <div className="eic__verdict-stack">
            <p className="eic__verdict-line">
              <span className="eic__verdict-pr">{t("eic.verdictRisk")}</span>
              {clipRu(synthesis.biggestRiskRu, 220)}
            </p>
            <p className="eic__verdict-line">
              <span className="eic__verdict-pr">{t("eic.verdictStep")}</span>
              {clipRu(orchestration.nextBestActionRu, 240)}
            </p>
          </div>
          <p className="eic__ambient">
            {t("eic.ambientLine")
              .replace("{s}", String(snap.stabilityIndex))
              .replace("{e}", String(ec.expansionConfidence))
              .replace("{n}", String(ec.narrativeCoherence))}
          </p>
        </details>
      </section>

      <div className="eic__grid">
        <section className="eic__panel glass-panel">
          <h2 className="eic__h2">{t("eic.tensionsTitle")}</h2>
          <ul className="eic__list">
            {contradictionsTop.map((c) => (
              <li
                key={c.id}
                className="eic__card"
                data-eic-severity-band={c.severity > 58 ? "high" : c.severity > 38 ? "mid" : "low"}
              >
                <span className="eic__sev">{c.severity}%</span>
                <p className="eic__card-h">{c.summaryRu}</p>
                <p className="eic__card-b">{clipRu(c.tensionRu, 220)}</p>
              </li>
            ))}
          </ul>
          {conflictsTop.length > 0 ? (
            <>
              <h3 className="eic__h3">{t("eic.conflicts")}</h3>
              <ul className="eic__list">
                {conflictsTop.map((c) => (
                  <li key={c.id} className="eic__card eic__card--conf" data-eic-conflict-live="1">
                    <p className="eic__card-h">{c.titleRu}</p>
                    <p className="eic__poles">
                      <span>{c.poleARu}</span>
                      <span className="eic__vs">↔</span>
                      <span>{c.poleBRu}</span>
                    </p>
                    <p className="eic__hint">{clipRu(c.resolutionHintRu, 200)}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className="eic__panel glass-panel">
          <h2 className="eic__h2">{t("eic.s4")}</h2>
          <ol className="eic__dirs">
            {directivesHead.map((d, i) => (
              <li key={d.id} className="eic__dir">
                <span className="eic__dir-idx">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="eic__dir-t">{d.directiveRu}</p>
                  <p className="eic__dir-r">{clipRu(d.rationaleRu, 200)}</p>
                  <p className="eic__dir-fi">
                    <span className="eic__k">{t("eic.feedsInto")}</span> {d.feedsIntoRu.join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <CollapsibleSection title={t("eic.diagnosticsDepth")} className="eic__archive eic__archive--span">
          <div className="eic__diag">
            {directivesTail.length > 0 ? (
              <div className="eic__diag-block">
                <h3 className="eic__h3">{t("eic.moreDirectives")}</h3>
                <ol className="eic__dirs">
                  {directivesTail.map((d, i) => (
                    <li key={d.id} className="eic__dir">
                      <span className="eic__dir-idx">{String(i + 1 + directivesHead.length).padStart(2, "0")}</span>
                      <div>
                        <p className="eic__dir-t">{d.directiveRu}</p>
                        <p className="eic__dir-r">{d.rationaleRu}</p>
                        <p className="eic__dir-fi">
                          <span className="eic__k">{t("eic.feedsInto")}</span> {d.feedsIntoRu.join(" · ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {contradictionsRest.length + conflictsRest.length > 0 ? (
              <div className="eic__diag-block">
                <h3 className="eic__h3">{t("eic.moreTensions")}</h3>
                <ul className="eic__list">
                  {contradictionsRest.map((c) => (
                    <li
                      key={c.id}
                      className="eic__card"
                      data-eic-severity-band={c.severity > 58 ? "high" : c.severity > 38 ? "mid" : "low"}
                    >
                      <span className="eic__sev">{c.severity}%</span>
                      <p className="eic__card-h">{c.summaryRu}</p>
                      <p className="eic__card-b">{c.tensionRu}</p>
                    </li>
                  ))}
                  {conflictsRest.map((c) => (
                    <li key={c.id} className="eic__card eic__card--conf" data-eic-conflict-live="1">
                      <p className="eic__card-h">{c.titleRu}</p>
                      <p className="eic__poles">
                        <span>{c.poleARu}</span>
                        <span className="eic__vs">↔</span>
                        <span>{c.poleBRu}</span>
                      </p>
                      <p className="eic__hint">{c.resolutionHintRu}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="eic__diag-block">
              <h3 className="eic__h3">{t("eic.s3")}</h3>
              <div className="eic__pressure">
                {snap.pressureMap.cells.map((cell) => (
                  <div
                    key={cell.id}
                    className="eic__cell"
                    data-eic-cell-band={cell.value > 72 ? "high" : cell.value > 48 ? "mid" : "low"}
                  >
                    <div className="eic__cell-top">
                      <span className="eic__cell-axis">{cell.axisRu}</span>
                      <span className="eic__cell-v">{cell.value}%</span>
                    </div>
                    <div className="eic__bar" style={{ "--eic-v": clampPct(cell.value) } as CSSProperties} aria-hidden />
                    <p className="eic__cell-note">{cell.noteRu}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="eic__diag-block">
              <h3 className="eic__h3">{t("eic.s6")}</h3>
              <ul className="eic__list">
                {snap.priorityShifts.map((p) => (
                  <li key={p.id} className="eic__shift">
                    <span className="eic__urg">{p.urgency}%</span>
                    <p className="eic__shift-h">{p.labelRu}</p>
                    <p className="eic__shift-flow">
                      {p.fromRu} → {p.toRu}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="eic__diag-block">
              <h3 className="eic__h3">{t("eic.s7")}</h3>
              <ul className="eic__risk">
                {snap.riskConcentration.map((r) => (
                  <li key={r.id} className="eic__risk-row">
                    <span className="eic__risk-m">{r.magnitude}%</span>
                    <div>
                      <p className="eic__risk-d">{r.domainRu}</p>
                      <p className="eic__risk-c">{r.concentrationRu}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="eic__diag-block">
              <h3 className="eic__h3">{t("eic.s8")}</h3>
              <ul className="eic__list">
                {snap.consensus.map((c) => (
                  <li key={c.id} className="eic__cons">
                    <span className="eic__coh">{c.cohesion}%</span>
                    <p>{c.statementRu}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="eic__diag-block">
              <h3 className="eic__h3">
                {t("eic.s5")} · {t("eic.s9")}
              </h3>
              <p className="eic__diag-prose">{snap.stabilityCaptionRu}</p>
              <p className="eic__diag-prose">{ec.summaryRu}</p>
              <p className="eic__diag-prose">{snap.expansionConfidenceExplanationRu}</p>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t("eic.s10")} className="eic__archive eic__archive--span">
          <section className="eic__panel glass-panel eic__panel--full">
            <ul className="eic__long">
              {snap.longHorizonAlignmentRu.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        </CollapsibleSection>

        <CollapsibleSection title={t("eic.meta")} className="eic__archive eic__archive--span">
          <section className="eic__panel glass-panel eic__panel--full eic__panel--meta">
            <ul className="eic__meta">
              {snap.metaSignals.map((m) => (
                <li key={m.id} className="eic__meta-row">
                  <span className="eic__meta-s">{m.source}</span>
                  <span className="eic__meta-w">{m.weight}%</span>
                  <p className="eic__meta-d">{m.digestRu}</p>
                </li>
              ))}
            </ul>
          </section>
        </CollapsibleSection>
      </div>

      {toast ? (
        <div className="eic__toast" role="status">
          {toast}
        </div>
      ) : null}

      <style>{`
        .eic {
          padding: 0 0 56px;
          max-width: none;
          margin: 0;
        }
        .eic__archive {
          margin-bottom: var(--os-section-gap, 16px);
        }
        .eic__archive .eic__panel {
          margin-top: 0;
        }
        .eic__links--compact {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .eic__btn {
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: transparent;
          color: rgba(210, 215, 232, 0.85);
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 10px 14px;
          cursor: pointer;
        }
        .eic__btn:hover {
          border-color: rgba(200, 210, 235, 0.35);
          color: var(--text);
        }
        .eic__btn--pri {
          border-color: rgba(200, 210, 235, 0.45);
        }
        .eic__links {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
        }
        .eic__link {
          border: none;
          background: transparent;
          color: rgba(150, 160, 185, 0.75);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
        }
        .eic__link:hover {
          color: rgba(220, 225, 240, 0.95);
        }
        .eic__lead {
          position: relative;
          overflow: hidden;
          padding: 20px 24px 18px;
          margin-bottom: 18px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: none;
        }
        .eic__lead .eic__verdict-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: calc(0.04 + var(--eic-live-tension, 0.35) * 0.07);
          background: radial-gradient(ellipse 85% 65% at 50% 0%, rgba(115, 135, 185, 0.2), transparent 58%);
          animation: eic-field-breathe var(--eic-live-pulse-sec, 96s) ease-in-out infinite;
        }
        .eic__lead-eyebrow,
        .eic__lead-headline,
        .eic__lead-regime,
        .eic__lead-tensions,
        .eic__lead-more {
          position: relative;
          z-index: 1;
        }
        .eic__lead-eyebrow {
          margin: 0 0 10px;
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(140, 150, 175, 0.72);
        }
        .eic__lead-headline {
          margin: 0 0 10px;
          font-size: 1.02rem;
          font-weight: 600;
          line-height: 1.4;
          color: rgba(225, 228, 242, 0.96);
          max-width: 68ch;
        }
        .eic__lead-regime {
          margin: 0 0 12px;
          font-family: var(--font-display);
          font-size: 0.95rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(210, 215, 235, 0.88);
        }
        .eic__lead-tensions {
          margin: 0 0 12px;
          padding: 0 0 0 1rem;
          max-width: 72ch;
          color: rgba(200, 208, 228, 0.9);
          font-size: 0.82rem;
          line-height: 1.45;
        }
        .eic__lead-sev {
          font-variant-numeric: tabular-nums;
          color: rgba(255, 200, 175, 0.85);
          margin-right: 6px;
        }
        .eic__lead-more {
          margin-top: 4px;
        }
        .eic__lead-more-sum {
          list-style: none;
          cursor: pointer;
          font-size: 0.54rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(140, 152, 178, 0.7);
          padding: 8px 0;
        }
        .eic__lead-more-sum::-webkit-details-marker {
          display: none;
        }
        .eic__lead-more[open] .eic__lead-more-sum {
          margin-bottom: 10px;
          color: rgba(175, 188, 215, 0.88);
        }
        .eic__lead-exp {
          margin: 0 0 12px;
          font-size: 0.82rem;
          line-height: 1.55;
          color: rgba(175, 185, 208, 0.82);
          max-width: 72ch;
        }
        .eic__lead-more .eic__verdict-stack,
        .eic__lead-more .eic__ambient {
          position: relative;
          z-index: 1;
        }
        @keyframes eic-field-breathe {
          0%,
          100% {
            opacity: calc(0.035 + var(--eic-live-tension, 0.35) * 0.06);
            transform: translate3d(0, 0, 0);
          }
          50% {
            opacity: calc(0.055 + var(--eic-live-tension, 0.35) * 0.08);
            transform: translate3d(0.25%, 0.1%, 0);
          }
        }
        .eic[data-eic-live-profile="premium_defense"] .eic__lead .eic__verdict-field {
          opacity: calc(0.03 + var(--eic-live-tension, 0.35) * 0.05);
        }
        .eic[data-eic-live-profile="expansion"] .eic__lead .eic__verdict-field {
          opacity: calc(0.045 + var(--eic-live-tension, 0.35) * 0.09);
        }
        .eic[data-eic-live-microstate="overloaded"] .eic__card[data-eic-severity-band="high"] {
          border-left-color: rgba(210, 165, 135, 0.38);
        }
        .eic[data-eic-live-microstate="stabilizing"] .eic__card[data-eic-severity-band="low"] {
          border-left-color: rgba(175, 195, 225, 0.28);
        }
        .eic[data-eic-live-microstate="recovering"] .eic__panel {
          border-color: rgba(255, 255, 255, 0.055);
        }
        .eic[data-eic-live-microstate="escalating"] .eic__lead {
          box-shadow: inset 0 0 0 1px rgba(130, 155, 210, 0.1);
        }
        .eic__card[data-eic-conflict-live="1"] {
          animation: eic-conflict-edge 22s ease-in-out infinite;
        }
        @keyframes eic-conflict-edge {
          0%,
          100% {
            border-left-color: rgba(200, 175, 150, 0.22);
          }
          50% {
            border-left-color: rgba(210, 175, 145, 0.32);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .eic__lead .eic__verdict-field,
          .eic__card[data-eic-conflict-live="1"] {
            animation: none !important;
          }
        }
        .eic__h2 {
          font-size: 0.58rem;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: rgba(140, 150, 175, 0.65);
          margin: 0 0 14px;
        }
        .eic__h3 {
          font-size: 0.54rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(140, 150, 175, 0.55);
          margin: 22px 0 12px;
        }
        .eic__regime {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: 1.25rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(230, 232, 242, 0.92);
        }
        .eic__regime-ex {
          margin: 0;
          font-size: 0.86rem;
          line-height: 1.6;
          color: rgba(175, 185, 208, 0.82);
        }
        .eic__verdict-eyebrow {
          margin: 0 0 10px;
          font-size: 0.58rem;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: rgba(140, 150, 175, 0.65);
        }
        .eic__verdict-regime-ex {
          margin: 0 0 16px;
          font-size: 0.84rem;
          line-height: 1.55;
          color: rgba(175, 185, 208, 0.78);
          max-width: 72ch;
        }
        .eic__verdict-focus {
          margin: 0 0 18px;
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1.45;
          color: rgba(220, 224, 238, 0.94);
          max-width: 68ch;
        }
        .eic__verdict-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
          max-width: 72ch;
        }
        .eic__verdict-line {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.5;
          color: rgba(175, 185, 208, 0.88);
        }
        .eic__verdict-pr {
          display: inline-block;
          min-width: 4.5rem;
          margin-right: 8px;
          font-size: 0.52rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(130, 140, 165, 0.7);
          vertical-align: top;
        }
        .eic__ambient {
          margin: 0;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(120, 130, 155, 0.55);
        }
        .eic__archive--span {
          grid-column: 1 / -1;
        }
        .eic__diag {
          display: flex;
          flex-direction: column;
          gap: 22px;
          padding: 4px 0 8px;
        }
        .eic__diag-block {
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .eic__diag-block:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .eic__diag-prose {
          margin: 0 0 10px;
          font-size: 0.8rem;
          line-height: 1.55;
          color: rgba(160, 170, 195, 0.86);
        }
        .eic__diag-prose:last-child {
          margin-bottom: 0;
        }
        .eic__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 880px) {
          .eic__grid {
            grid-template-columns: 1fr;
          }
        }
        .eic__panel {
          padding: 18px 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: none;
        }
        .eic__panel--wide,
        .eic__panel--full {
          grid-column: 1 / -1;
        }
        .eic__panel--meta {
          opacity: 0.92;
        }
        .eic__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .eic__card {
          padding: 14px 16px;
          border-left: 1px solid rgba(200, 210, 235, 0.2);
          background: rgba(0, 0, 0, 0.2);
        }
        .eic__card--conf {
          border-left-color: rgba(200, 175, 150, 0.25);
        }
        .eic__sev {
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          color: rgba(160, 170, 195, 0.65);
        }
        .eic__card-h {
          margin: 8px 0 6px;
          font-weight: 600;
          font-size: 0.84rem;
        }
        .eic__card-b,
        .eic__hint {
          margin: 0;
          font-size: 0.78rem;
          color: rgba(165, 175, 200, 0.85);
          line-height: 1.45;
        }
        .eic__poles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          font-size: 0.76rem;
          color: rgba(185, 195, 218, 0.88);
          margin: 8px 0;
        }
        .eic__vs {
          opacity: 0.45;
        }
        .eic__pressure {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .eic__cell {
          position: relative;
          padding-left: 2px;
        }
        .eic[data-eic-live-microstate="overloaded"] .eic__cell[data-eic-cell-band="high"]::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          border-radius: 1px;
          background: rgba(200, 160, 130, 0.35);
          opacity: 0.85;
        }
        .eic[data-eic-live-microstate="stabilizing"] .eic__cell[data-eic-cell-band="low"]::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          border-radius: 1px;
          background: rgba(140, 165, 210, 0.22);
        }
        .eic__cell-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .eic__cell-axis {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(145, 155, 180, 0.7);
        }
        .eic__cell-v {
          font-size: 0.72rem;
          color: rgba(210, 218, 238, 0.9);
        }
        .eic__bar {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          margin-bottom: 8px;
        }
        .eic__bar::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: calc(var(--eic-v, 50) * 1%);
          max-width: 100%;
          background: rgba(200, 210, 235, 0.35);
        }
        .eic__cell-note {
          margin: 0;
          font-size: 0.74rem;
          color: rgba(155, 165, 190, 0.8);
          line-height: 1.4;
        }
        .eic__dirs {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .eic__dir {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 14px;
        }
        .eic__dir-idx {
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          color: rgba(130, 140, 165, 0.65);
          padding-top: 2px;
        }
        .eic__dir-t {
          margin: 0 0 8px;
          font-weight: 600;
          font-size: 0.88rem;
          line-height: 1.35;
        }
        .eic__dir-r {
          margin: 0 0 8px;
          font-size: 0.8rem;
          color: rgba(165, 175, 200, 0.88);
          line-height: 1.45;
        }
        .eic__dir-fi {
          margin: 0;
          font-size: 0.72rem;
          color: rgba(140, 150, 175, 0.75);
        }
        .eic__k {
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 0.55rem;
          margin-right: 8px;
          color: rgba(120, 130, 155, 0.75);
        }
        .eic__stab-val {
          font-family: var(--font-display);
          font-size: 2.4rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          margin: 0 0 10px;
          color: rgba(225, 228, 240, 0.95);
        }
        .eic__stab-bar {
          height: 2px;
          background: rgba(255, 255, 255, 0.05);
          position: relative;
          margin-bottom: 14px;
        }
        .eic__stab-bar::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: calc(var(--eic-v, 50) * 1%);
          max-width: 100%;
          background: rgba(200, 210, 235, 0.4);
        }
        .eic__stab-cap {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.5;
          color: rgba(165, 175, 200, 0.85);
        }
        .eic__shift {
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .eic__urg {
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          color: rgba(150, 160, 185, 0.65);
        }
        .eic__shift-h {
          margin: 6px 0 4px;
          font-weight: 600;
          font-size: 0.82rem;
        }
        .eic__shift-flow {
          margin: 0;
          font-size: 0.76rem;
          color: rgba(160, 170, 195, 0.85);
        }
        .eic__risk {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .eic__risk-row {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.22);
        }
        .eic__risk-m {
          font-family: var(--font-display);
          font-size: 0.95rem;
          color: rgba(215, 210, 200, 0.9);
        }
        .eic__risk-d {
          margin: 0 0 6px;
          font-weight: 600;
          font-size: 0.82rem;
        }
        .eic__risk-c {
          margin: 0;
          font-size: 0.76rem;
          color: rgba(155, 165, 190, 0.85);
          line-height: 1.4;
        }
        .eic__cons {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 12px;
          font-size: 0.8rem;
          color: rgba(175, 185, 208, 0.88);
          line-height: 1.45;
        }
        .eic__coh {
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          color: rgba(140, 150, 175, 0.65);
        }
        .eic__exp-val {
          font-family: var(--font-display);
          font-size: 1.8rem;
          margin: 0 0 8px;
          letter-spacing: 0.08em;
        }
        .eic__exp-sub {
          margin: 0 0 12px;
          font-size: 0.78rem;
          color: rgba(160, 170, 195, 0.85);
        }
        .eic__exp-body {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.55;
          color: rgba(150, 160, 185, 0.82);
        }
        .eic__long {
          margin: 0;
          padding-left: 1.1rem;
          color: rgba(165, 175, 200, 0.88);
          line-height: 1.55;
          font-size: 0.82rem;
        }
        .eic__meta {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .eic__meta-row {
          display: grid;
          grid-template-columns: 140px 44px 1fr;
          gap: 12px;
          align-items: start;
          font-size: 0.72rem;
          color: rgba(140, 150, 175, 0.85);
        }
        .eic__meta-s {
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .eic__meta-w {
          text-align: right;
          opacity: 0.8;
        }
        .eic__meta-d {
          margin: 0;
          line-height: 1.4;
        }
        .eic__toast {
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

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}
