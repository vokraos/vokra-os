import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  organismModelToJson,
  organismModelToMarkdown,
  useOrganismModel,
  type OrganismState,
} from "../lib/organism-model";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";
import type { AppLocale } from "../lib/i18n/messages";
import { PageHeaderCompact } from "../components/shell/PageHeaderCompact";
import { CollapsibleSection } from "../components/shell/CollapsibleSection";
import { ExecutiveSurface } from "../components/executive-surface/ExecutiveSurface";

type Props = { onNavigate: (id: NavId) => void };

function clipRu(s: string, max: number): string {
  const x = s.trim();
  if (x.length <= max) return x;
  return `${x.slice(0, max - 1).trimEnd()}…`;
}

function healthRead(locale: AppLocale, overall: number): string {
  if (locale === "en") {
    if (overall >= 62) return "Business health supports scaling if execution stays disciplined.";
    if (overall >= 48) return "Health is steady — keep runway, avoid over-committing.";
    return "Health is soft — reduce load and narrow priorities.";
  }
  if (overall >= 62) return "Сводное состояние позволяет масштаб при дисциплине исполнения.";
  if (overall >= 48) return "Состояние ровное — держать запас, не перегружать обязательствами.";
  return "Состояние слабее — снизить нагрузку и сузить приоритеты.";
}

function growthSafetyAnswer(locale: AppLocale, s: OrganismState): string {
  const ok = s.expansionCapacity.index >= 52 && s.overheatingRisk.index < 58 && s.operationalStress.index < 56 && s.executionFatigue.index < 56;
  const stressBlock = s.operationalStress.index >= 58 || s.overheatingRisk.index >= 58;
  const fatigueBlock = s.executionFatigue.index >= 58;
  if (locale === "en") {
    if (ok && !stressBlock && !fatigueBlock) return "Yes — you can push growth without splintering resources.";
    if ((stressBlock || fatigueBlock) && s.expansionCapacity.index < 46) return "No — clear overload first, then revisit scale.";
    return "Partly — only focused growth with strict load control.";
  }
  if (ok && !stressBlock && !fatigueBlock) return "Да — можно усиливать рост, не распыляя ресурс.";
  if ((stressBlock || fatigueBlock) && s.expansionCapacity.index < 46) return "Нет — сначала снять нагрузку, затем снова смотреть на масштаб.";
  return "Частично — только прицельный рост с жёстким контролем нагрузки.";
}

function underusedHeadroom(s: OrganismState): number {
  return Math.round(Math.max(0, Math.min(100, 100 - s.operationalStress.index * 0.5 - s.executionFatigue.index * 0.32)));
}

function organismCondition(s: OrganismState, locale: AppLocale): { headline: string; sub: string } {
  const stress = s.operationalStress.index;
  const exp = s.expansionCapacity.index;
  const heat = s.overheatingRisk.index;
  const fat = s.executionFatigue.index;
  const res = s.growthResilience;
  const health = s.systemHealth.overall;

  const firstSentence = () => {
    const m = s.systemSummaryRu.match(/^[^.!?]+[.!?]?/);
    if (m) return m[0].trim();
    return clipRu(s.systemSummaryRu, 160);
  };

  let headline = firstSentence();
  if (locale === "en") {
    if (heat > 62 && stress > 52) headline = "Overload risk while operations stay hot.";
    else if (fat > 58 && stress > 48) headline = "Execution fatigue building under steady load.";
    else if (exp >= 62 && stress <= 48 && res >= 50) headline = "Room for safe expansion is holding.";
    else if (stress > 58 && exp < 48) headline = "Load eats growth headroom — scaling unprepared is risky.";
    else if (health >= 58 && stress < 48) headline = "Stable growth with moderate business load.";
    else if (health < 50 && stress > 55) headline = "Split focus and overload — coherence at risk.";
    const sub = clipRu(`${s.expansionCapacity.verdictRu} ${s.stabilityIndex.interpretationRu}`, 280);
    return { headline, sub };
  }

  if (heat > 62 && stress > 52) headline = "Высокая нагрузка и риск перегрева операций.";
  else if (fat > 58 && stress > 48) headline = "Накапливается усталость команды и процессов при стабильной нагрузке.";
  else if (exp >= 62 && stress <= 48 && res >= 50) headline = "Сохраняется коридор безопасного расширения.";
  else if (stress > 58 && exp < 48) headline = "Нагрузка съедает запас на рост: масштаб без подготовки опасен.";
  else if (health >= 58 && stress < 48) headline = "Стабильный рост при умеренной нагрузке бизнеса.";
  else if (health < 50 && stress > 55) headline = "Размытый фокус и перегруз — страдает целостность решений.";

  const sub = clipRu(`${s.expansionCapacity.verdictRu} ${s.stabilityIndex.interpretationRu}`, 280);
  return { headline, sub };
}

export function OrganismModelView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const s = useOrganismModel();
  const [toast, setToast] = useState<string | null>(null);

  const saveToMemory = useCallback(() => {
    recordGeneration({
      module: "organism_model",
      title: `${t("org.title")} · пульс ${s.pulseGeneration}`,
      content: organismModelToJson(s),
      mime: "application/json",
      tags: ["organism_model", "physiology", `pulse:${s.pulseGeneration}`],
    });
    setToast(t("org.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [s, t]);

  const exportJsonFile = useCallback(() => {
    downloadJson(`vokra-organism-model-${s.pulseGeneration}.json`, s);
  }, [s]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-organism-model-${s.pulseGeneration}.md`, organismModelToMarkdown(s));
  }, [s]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(organismModelToJson(s));
    setToast(t("org.toastCopied"));
    window.setTimeout(() => setToast(null), 2200);
  }, [s, t]);

  const h = s.systemHealth;

  const condition = useMemo(() => organismCondition(s, locale), [s, locale]);
  const growthAnswer = useMemo(() => growthSafetyAnswer(locale, s), [locale, s]);
  const headroom = useMemo(() => underusedHeadroom(s), [s]);
  const healthLine = useMemo(() => healthRead(locale, h.overall), [locale, h.overall]);

  return (
    <div className="org" data-org-pulse={s.pulseGeneration % 1000}>
      <div className="org__ambient" aria-hidden />
      <PageHeaderCompact
        eyebrow={t("org.eyebrow")}
        title={t("org.title")}
        purpose={t("org.subtitle")}
        actions={
          <>
            <button type="button" className="org__btn" onClick={exportJsonFile}>
              {t("org.exportJson")}
            </button>
            <button type="button" className="org__btn" onClick={exportMd}>
              {t("org.exportMd")}
            </button>
            <button type="button" className="org__btn" onClick={() => void copyJson()}>
              {t("org.copyJson")}
            </button>
            <button type="button" className="org__btn org__btn--pri" onClick={saveToMemory}>
              {t("org.saveMemory")}
            </button>
          </>
        }
        meta={
          <CollapsibleSection title={t("org.related")}>
            <nav className="org__links org__links--compact" aria-label={t("org.related")}>
              <button type="button" className="org__link" onClick={() => onNavigate("executiveIntelligence")}>
                {t("nav.executiveIntelligence")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("executionOrchestrator")}>
                {t("nav.executionOrchestrator")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("signalFabric")}>
                {t("nav.signalFabric")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("feedbackLoop")}>
                {t("nav.feedbackLoop")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("brandEvolution")}>
                {t("nav.brandEvolution")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("temporalStrategy")}>
                {t("nav.temporalStrategy")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("strategicSimulation")}>
                {t("nav.strategicSimulation")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("memory")}>
                {t("nav.memory")}
              </button>
              <button type="button" className="org__link" onClick={() => onNavigate("missionControl")}>
                {t("nav.missionControl")}
              </button>
            </nav>
          </CollapsibleSection>
        }
      />

      <ExecutiveSurface tone="dashboard" />

      <section className="org__lead glass-panel">
        <p className="org__lead-eyebrow">{t("org.growthSafetyQ")}</p>
        <p className="org__lead-answer">{growthAnswer}</p>
        <p className="org__lead-hint">{condition.headline}</p>
        <p className="org__lead-sub">{condition.sub}</p>
        <p className="org__lead-health">{healthLine}</p>
        <div className="org__lead-metrics" aria-label={t("org.leadMetricsAria")}>
          <div className="org__lead-m">
            <span className="org__lead-mk">{t("org.overloadK")}</span>
            <span className="org__lead-mv">{s.operationalStress.index}</span>
          </div>
          <div className="org__lead-m">
            <span className="org__lead-mk">{t("org.underusedK")}</span>
            <span className="org__lead-mv">{headroom}</span>
          </div>
          <div className="org__lead-m">
            <span className="org__lead-mk">{t("org.expansionK")}</span>
            <span className="org__lead-mv">{s.expansionCapacity.index}</span>
          </div>
          <div className="org__lead-m">
            <span className="org__lead-mk">{t("org.fatigueK")}</span>
            <span className="org__lead-mv">{s.executionFatigue.index}</span>
          </div>
          <div className="org__lead-m">
            <span className="org__lead-mk">{t("org.stabilityK")}</span>
            <span className="org__lead-mv">{s.stabilityIndex.value}</span>
          </div>
        </div>
      </section>

      <details className="org__details">
        <summary className="org__details-sum">{t("org.opsDetail")}</summary>
        <section className="org__panel glass-panel">
          <h2 className="org__h2">{t("org.s1")}</h2>
          <p className="org__prose">{s.systemSummaryRu}</p>
          <p className="org__prose org__prose--dim">{s.executiveAlignmentRu}</p>
          <CollapsibleSection title={t("org.axesDetail")} className="org__collap">
            <div className="org__axes">
              {h.axes.map((a) => (
                <div key={a.axis} className="org__axis">
                  <div className="org__axis-top">
                    <span className="org__axis-label">{a.labelRu}</span>
                    <span className="org__axis-score org__axis-score--sub">{a.score}</span>
                  </div>
                  <div className="org__axis-bar" style={{ "--org-v": clampPct(a.score) } as CSSProperties} aria-hidden />
                  <p className="org__axis-pulse">{a.pulseRu}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          <h3 className="org__h3">{t("org.s2")}</h3>
          <p className="org__prose">{s.operationalStress.summaryRu}</p>
          <ul className="org__map">
            {s.loadMapRu.map((z, i) => (
              <li key={`${z.zoneRu}-${i}`} className="org__map-row">
                <span className="org__map-zone">{z.zoneRu}</span>
                <span className="org__map-meter">
                  <span className="org__map-fill" style={{ width: `${clampPct(z.load)}%` }} aria-hidden />
                </span>
                <span className="org__map-load">{z.load}%</span>
                <p className="org__map-note">{z.noteRu}</p>
              </li>
            ))}
          </ul>
          <ul className="org__bullets org__bullets--warn">
            {s.operationalStress.driversRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <div className="org__split">
          <section className="org__panel glass-panel">
            <h2 className="org__h2">{t("org.s3")}</h2>
            <ul className="org__flows">
              {s.resourceFlows.map((f) => (
                <li key={f.id} className="org__flow org__flow--live">
                  <div className="org__flow-head">
                    <span>{f.channelRu}</span>
                    <span className="org__flow-share">
                      {t("org.flowShare")} {f.share}%
                    </span>
                  </div>
                  <div className="org__flow-bar">
                    <span className="org__flow-fill" style={{ width: `${clampPct(f.share)}%` }} aria-hidden />
                  </div>
                  <p className="org__flow-state">{f.stateRu}</p>
                </li>
              ))}
            </ul>
            <div className="org__subblock">
              <h3 className="org__h3">{t("org.attentionH2")}</h3>
              <p className="org__prose">{s.attentionAllocation.summaryRu}</p>
              <ul className="org__bullets">
                {s.attentionAllocation.hotspotsRu.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <p className="org__tag">
                {t("org.dilutionTag")
                  .replace("{d}", String(s.attentionAllocation.dilutionRisk))
                  .replace("{c}", String(s.cognitiveLoad.index))}
              </p>
            </div>
          </section>

          <section className="org__panel glass-panel org__panel--glow">
            <h2 className="org__h2">{t("org.s4")}</h2>
            <p className="org__prose">{s.brandEnergyRu}</p>
            <div className="org__energy">
              <div>
                <p className="org__energy-k">{t("org.strategicEnergyK")}</p>
                <p className="org__energy-v org__energy-v--inline">{s.strategicEnergy.reserve}%</p>
              </div>
              <p className="org__prose org__prose--tight">{s.strategicEnergy.spendRateRu}</p>
              <p className="org__prose org__prose--tight">{s.strategicEnergy.recoveryWindowRu}</p>
            </div>
          </section>
        </div>
      </details>

      <section className="org__panel glass-panel org__panel--expanse">
        <h2 className="org__h2">{t("org.s9")}</h2>
        <p className="org__exp-lead">{s.expansionCapacity.verdictRu}</p>
        <p className="org__exp-question">{t("org.expansionQuestion")}</p>
        <div className="org__exp org__exp--compact">
          <div className="org__exp-cell">
            <span className="org__exp-k">{t("org.expIdx")}</span>
            <span className="org__exp-v">{s.expansionCapacity.index}</span>
          </div>
          <div className="org__exp-cell">
            <span className="org__exp-k">{t("org.expSku")}</span>
            <span className="org__exp-v">{s.expansionCapacity.skuScale}</span>
          </div>
          <div className="org__exp-cell">
            <span className="org__exp-k">{t("org.expCat")}</span>
            <span className="org__exp-v">{s.expansionCapacity.categoryExpand}</span>
          </div>
          <div className="org__exp-cell">
            <span className="org__exp-k">{t("org.expFbo")}</span>
            <span className="org__exp-v">{s.expansionCapacity.fboIncrease}</span>
          </div>
          <div className="org__exp-cell">
            <span className="org__exp-k">{t("org.expCap")}</span>
            <span className="org__exp-v">{s.expansionCapacity.capsules}</span>
          </div>
          <div className="org__exp-cell">
            <span className="org__exp-k">{t("org.expNiche")}</span>
            <span className="org__exp-v">{s.expansionCapacity.newNiches}</span>
          </div>
        </div>
        <div className="org__split org__split--tight">
          <div>
            <h3 className="org__h3">{t("org.overload")}</h3>
            <ul className="org__bullets org__bullets--warn">
              {s.overloadSignalsRu.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="org__h3">{t("org.underuse")}</h3>
            <ul className="org__bullets org__bullets--cool">
              {s.underutilizationRu.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <details className="org__details org__details--phys">
        <summary className="org__details-sum">{t("org.physiologyDepth")}</summary>
        <div className="org__depth-block">
          <h3 className="org__h3">{t("org.s5")}</h3>
          <p className="org__prose">{s.overheatingRisk.captionRu}</p>
          <p className="org__micro-metric">
            <span>{s.overheatingRisk.index}%</span>
          </p>
          <ul className="org__bullets org__bullets--warn">
            {s.overheatingRisk.factorsRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="org__depth-block">
          <h3 className="org__h3">{t("org.s6")}</h3>
          <p className="org__prose">{s.growthPressure.vectorRu}</p>
          <p className="org__prose">{s.growthPressure.safeGrowthRu}</p>
          <p className="org__micro-metric">
            <span>{s.growthResilience}%</span>
          </p>
        </div>
        <div className="org__depth-block">
          <h3 className="org__h3">{t("org.s7")}</h3>
          <p className="org__relief">{s.executionFatigue.reliefRu}</p>
          <ul className="org__bullets">
            {s.executionFatigue.sourcesRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <p className="org__micro-metric">
            <span>{s.executionFatigue.index}%</span>
          </p>
        </div>
        <div className="org__depth-block org__depth-block--last">
          <h3 className="org__h3">{t("org.s8")}</h3>
          <ul className="org__loss">
            {s.lossZonesRu.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </details>

      <details className="org__details org__details--arc">
        <summary className="org__details-sum">{t("org.arcStability")}</summary>
        <div className="org__depth-block">
          <h3 className="org__h3">{t("org.s10")}</h3>
          <p className="org__prose">{s.stabilityIndex.interpretationRu}</p>
          <p className="org__prose org__prose--dim">{s.stabilityNarrativeRu}</p>
          <p className="org__micro-metric">
            <span>{s.stabilityIndex.value}%</span>
          </p>
        </div>
        <div className="org__depth-block org__depth-block--last">
          <h3 className="org__h3">{t("org.integrations")}</h3>
          <p className="org__prose org__prose--dim">
            {t("org.narrativeLine")} {s.cognitiveLoad.narrativeCoherence}% · {s.cognitiveLoad.focusRu}
          </p>
          <ul className="org__lattice">
            {s.integrationTies.map((tie) => (
              <li key={tie.id} className="org__lattice-cell">
                <p className="org__lattice-layer">{tie.layerRu}</p>
                <p className="org__lattice-tie">{tie.tieRu}</p>
              </li>
            ))}
          </ul>
        </div>
      </details>

      {toast ? (
        <div className="org__toast" role="status">
          {toast}
        </div>
      ) : null}

      <style>{`
        .org {
          position: relative;
          max-width: none;
          margin: 0;
          padding: 8px 0 80px;
          color: var(--text);
        }
        .org__ambient {
          pointer-events: none;
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(160, 175, 255, 0.09), transparent 55%),
            radial-gradient(ellipse 60% 40% at 100% 40%, rgba(255, 120, 80, 0.04), transparent 50%);
          opacity: 0.85;
          z-index: 0;
        }
        .org > *:not(.org__ambient) {
          position: relative;
          z-index: 1;
        }
        .org__links--compact {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .org__btn {
          border-radius: 999px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.35);
          color: var(--text);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 10px 16px;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .org__btn:hover {
          border-color: rgba(140, 160, 255, 0.45);
          box-shadow: 0 0 18px rgba(100, 120, 255, 0.12);
        }
        .org__btn--pri {
          border-color: rgba(140, 160, 255, 0.55);
          background: linear-gradient(135deg, rgba(80, 90, 160, 0.35), rgba(20, 22, 40, 0.85));
        }
        .org__links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .org__link {
          border: none;
          background: rgba(255, 255, 255, 0.04);
          color: var(--muted);
          font-size: 0.78rem;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          letter-spacing: 0.06em;
        }
        .org__link:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.07);
        }
        .org__details {
          margin-bottom: 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
          padding: 0 18px 16px;
        }
        .org__details-sum {
          list-style: none;
          cursor: pointer;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(150, 162, 188, 0.78);
          padding: 14px 0 12px;
        }
        .org__details-sum::-webkit-details-marker {
          display: none;
        }
        .org__details[open] .org__details-sum {
          margin-bottom: 8px;
          color: rgba(185, 198, 228, 0.92);
        }
        .org__details .org__panel {
          margin-bottom: 14px;
        }
        .org__details .org__split {
          margin-top: 0;
        }
        .org__lead {
          padding: 20px 22px 22px;
          margin-bottom: 16px;
          border-radius: 18px;
          border: 1px solid rgba(130, 150, 255, 0.14);
        }
        .org__lead-eyebrow {
          margin: 0 0 8px;
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .org__lead-answer {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(235, 238, 252, 0.98);
          max-width: 52ch;
        }
        .org__lead-hint {
          margin: 0 0 8px;
          font-size: 0.92rem;
          font-weight: 600;
          line-height: 1.45;
          color: rgba(215, 220, 238, 0.95);
          max-width: 58ch;
        }
        .org__lead-sub {
          margin: 0 0 10px;
          font-size: 0.84rem;
          line-height: 1.55;
          color: var(--muted);
          max-width: 62ch;
        }
        .org__lead-health {
          margin: 0 0 14px;
          font-size: 0.8rem;
          line-height: 1.45;
          color: rgba(175, 188, 215, 0.88);
          max-width: 58ch;
        }
        .org__lead-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 10px 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .org__lead-m {
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .org__lead-mk {
          display: block;
          font-size: 0.52rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(140, 152, 178, 0.72);
          margin-bottom: 6px;
        }
        .org__lead-mv {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .org__collap {
          margin-bottom: 16px;
        }
        .org__depth-block {
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .org__depth-block--last {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .org__micro-metric {
          margin: 10px 0 0;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160, 170, 195, 0.75);
        }
        .org__panel {
          padding: 22px 22px 24px;
          margin-bottom: 18px;
          border-radius: 18px;
        }
        .org__panel--glow {
          box-shadow: 0 0 40px rgba(120, 130, 255, 0.08);
        }
        .org__panel--fin {
          border: 1px solid rgba(140, 160, 255, 0.22);
        }
        .org__panel--expanse {
          border: 1px solid rgba(130, 150, 255, 0.28);
          box-shadow: 0 0 48px rgba(90, 100, 200, 0.07);
        }
        .org__h2 {
          font-size: 0.72rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 14px;
        }
        .org__h3 {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 16px 0 8px;
        }
        .org__prose {
          margin: 0 0 12px;
          line-height: 1.65;
          color: var(--text);
          font-size: 0.92rem;
        }
        .org__prose--dim {
          color: var(--muted);
          font-size: 0.86rem;
        }
        .org__prose--tight {
          font-size: 0.86rem;
          margin-bottom: 8px;
        }
        .org__axes {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
          margin-top: 8px;
        }
        .org__axis {
          padding: 14px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .org__axis-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .org__axis-label {
          font-size: 0.82rem;
          font-weight: 600;
        }
        .org__axis-score {
          font-family: var(--font-display);
          font-size: 1.25rem;
        }
        .org__axis-score--sub {
          font-size: 0.95rem;
          opacity: 0.85;
        }
        .org__axis-bar {
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
          margin-bottom: 8px;
        }
        .org__axis-bar::after {
          content: "";
          display: block;
          height: 100%;
          width: calc(var(--org-v, 50) * 1%);
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(100, 110, 200, 0.4), rgba(190, 200, 255, 0.95));
        }
        .org__axis-pulse {
          margin: 0;
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .org__map {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .org__map-row {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) 120px 48px;
          gap: 10px 14px;
          align-items: center;
        }
        .org__map-zone {
          font-size: 0.84rem;
          font-weight: 600;
        }
        .org__map-meter {
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .org__map-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(255, 120, 90, 0.35), rgba(255, 200, 160, 0.85));
        }
        .org__map-load {
          font-size: 0.78rem;
          color: var(--muted);
          text-align: right;
        }
        .org__map-note {
          grid-column: 1 / -1;
          margin: 0;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .org__bullets {
          margin: 12px 0 0;
          padding-left: 1.1rem;
          color: var(--muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        .org__bullets--warn {
          color: rgba(255, 200, 180, 0.92);
        }
        .org__bullets--cool {
          color: rgba(180, 240, 230, 0.9);
        }
        .org__split {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 18px;
        }
        .org__split--tight {
          margin-top: 16px;
        }
        .org__flows {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .org__flow--live {
          position: relative;
          padding-left: 14px;
          border-left: 1px solid rgba(130, 150, 255, 0.25);
        }
        .org__flow--live::before {
          content: "→";
          position: absolute;
          left: 0;
          top: 2px;
          font-size: 0.65rem;
          letter-spacing: 0;
          color: rgba(160, 175, 255, 0.55);
        }
        .org__flow-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.84rem;
          margin-bottom: 6px;
        }
        .org__flow-share {
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .org__flow-bar {
          height: 8px;
          border-radius: 99px;
          background: rgba(0, 0, 0, 0.35);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .org__flow-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(80, 100, 200, 0.5), rgba(180, 195, 255, 0.95));
        }
        .org__flow-state {
          margin: 6px 0 0;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .org__subblock {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .org__tag {
          margin: 10px 0 0;
          font-size: 0.75rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .org__energy-k {
          margin: 0;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .org__energy-v {
          margin: 4px 0 12px;
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
        }
        .org__energy-v--inline {
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .org__heat {
          font-family: var(--font-display);
          font-size: 2.4rem;
          font-weight: 700;
          margin: 0 0 8px;
          color: rgba(255, 190, 170, 0.95);
        }
        .org__metric {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 10px;
        }
        .org__relief {
          margin: 12px 0 0;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(90, 200, 180, 0.08);
          border: 1px solid rgba(90, 200, 180, 0.2);
          font-size: 0.88rem;
          line-height: 1.55;
        }
        .org__loss {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .org__loss li {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-left: 3px solid rgba(255, 140, 100, 0.55);
          font-size: 0.88rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .org__exp {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 10px;
          margin: 12px 0 8px;
        }
        .org__exp-cell {
          padding: 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }
        .org__exp-k {
          display: block;
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .org__exp-v {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
        }
        .org__exp-lead {
          margin: 0 0 10px;
          font-size: 1.02rem;
          font-weight: 600;
          line-height: 1.45;
          color: rgba(230, 232, 245, 0.95);
          max-width: 58ch;
        }
        .org__exp-question {
          margin: 0 0 16px;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(160, 175, 210, 0.75);
        }
        .org__exp--compact .org__exp-v {
          font-size: 1.05rem;
        }
        .org__exp--compact .org__exp-cell {
          padding: 10px;
        }
        .org__stability {
          font-family: var(--font-display);
          font-size: 2.75rem;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: 0.04em;
        }
        .org__lattice {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        .org__lattice-cell {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(130, 150, 255, 0.12);
        }
        .org__lattice-layer {
          margin: 0 0 6px;
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(200, 210, 255, 0.85);
        }
        .org__lattice-tie {
          margin: 0;
          font-size: 0.84rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .org__toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 80;
          padding: 12px 20px;
          border-radius: 999px;
          background: rgba(10, 12, 24, 0.92);
          border: 1px solid rgba(140, 160, 255, 0.35);
          font-size: 0.82rem;
          letter-spacing: 0.06em;
        }
        @media (max-width: 640px) {
          .org__map-row {
            grid-template-columns: 1fr;
          }
          .org__map-load {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}
