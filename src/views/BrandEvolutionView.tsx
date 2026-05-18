import { useCallback, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  EVOLUTION_STANCE_RU,
  brandEvolutionToJson,
  brandEvolutionToMarkdown,
  useBrandEvolution,
} from "../lib/brand-evolution";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";
import { PageHeaderCompact } from "../components/shell/PageHeaderCompact";
import { CollapsibleSection } from "../components/shell/CollapsibleSection";

type Props = { onNavigate: (id: NavId) => void };

export function BrandEvolutionView({ onNavigate }: Props) {
  const { t } = useI18n();
  const snap = useBrandEvolution();
  const [toast, setToast] = useState<string | null>(null);

  const saveToMemory = useCallback(() => {
    recordGeneration({
      module: "brand_evolution",
      title: `${t("bev.title")} · пульс ${snap.pulseGeneration}`,
      content: brandEvolutionToJson(snap),
      mime: "application/json",
      tags: ["brand_evolution", "dna", "strategy", `pulse:${snap.pulseGeneration}`],
    });
    setToast(t("bev.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [snap, t]);

  const exportJsonFile = useCallback(() => {
    downloadJson(`vokra-brand-evolution-${snap.pulseGeneration}.json`, snap);
  }, [snap]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-brand-evolution-${snap.pulseGeneration}.md`, brandEvolutionToMarkdown(snap));
  }, [snap]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(brandEvolutionToJson(snap));
    setToast(t("bev.toastCopied"));
    window.setTimeout(() => setToast(null), 2200);
  }, [snap, t]);

  return (
    <div className="bev" data-be-pulse={snap.pulseGeneration % 1000}>
      <PageHeaderCompact
        eyebrow={t("bev.eyebrow")}
        title={t("bev.title")}
        purpose={t("bev.subtitle")}
        actions={
          <>
            <button type="button" className="bev__btn" onClick={exportJsonFile}>
              {t("bev.exportJson")}
            </button>
            <button type="button" className="bev__btn" onClick={exportMd}>
              {t("bev.exportMd")}
            </button>
            <button type="button" className="bev__btn" onClick={() => void copyJson()}>
              {t("bev.copyJson")}
            </button>
            <button type="button" className="bev__btn bev__btn--pri" onClick={saveToMemory}>
              {t("bev.saveMemory")}
            </button>
          </>
        }
        meta={
          <CollapsibleSection title={t("bev.related")}>
            <nav className="bev__links bev__links--compact" aria-label={t("bev.related")}>
              <button type="button" className="bev__link" onClick={() => onNavigate("dna")}>
                Brand DNA
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("feedbackLoop")}>
                {t("nav.feedbackLoop")}
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("missionControl")}>
                {t("nav.missionControl")}
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("command")}>
                {t("nav.command")}
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("signalFabric")}>
                {t("nav.signalFabric")}
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("temporalStrategy")}>
                {t("nav.temporalStrategy")}
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("strategicSimulation")}>
                {t("nav.strategicSimulation")}
              </button>
              <button type="button" className="bev__link" onClick={() => onNavigate("memory")}>
                {t("nav.memory")}
              </button>
            </nav>
          </CollapsibleSection>
        }
      />

      {snap.dnaVsMarketWarningRu ? (
        <aside className="bev__warn glass-panel" role="note">
          <p className="bev__warn-k">{t("bev.dnaFilter")}</p>
          <p className="bev__warn-t">{snap.dnaVsMarketWarningRu}</p>
        </aside>
      ) : null}

      <section className="bev__panel glass-panel">
        <h2 className="bev__h2">{t("bev.s1")}</h2>
        <p className="bev__prose">{snap.currentTrajectoryRu}</p>
        <div className="bev__split">
          <div>
            <h3 className="bev__h3">{t("bev.aestheticAxis")}</h3>
            <ul className="bev__ae">
              {snap.aestheticTrajectories.map((a) => (
                <li key={a.id} className="bev__ae-card">
                  <p className="bev__ae-k">{a.aestheticRu}</p>
                  <p className="bev__ae-meta">
                    {t("bev.metaStrength")} {a.strength}% · {t("bev.metaDnaAlign")} {a.dnaAlignment}%
                  </p>
                  <p className="bev__ae-body">{a.trajectoryRu}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="bev__h3">{t("bev.vectors")}</h3>
            <ul className="bev__vec">
              {snap.evolutionVectors.map((v) => (
                <li key={v.id} className="bev__vec-row">
                  <span className="bev__vec-axis">{v.axis}</span>
                  <span
                    className="bev__vec-bar"
                    style={{ "--bev-v": clampPct(v.magnitude) } as CSSProperties}
                    aria-hidden
                  />
                  <p className="bev__vec-label">{v.labelRu}</p>
                  <p className="bev__vec-dir">{v.directionRu}</p>
                  <span className="bev__vec-hor">{v.horizon}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bev__panel glass-panel">
        <h2 className="bev__h2">{t("bev.shortLong")}</h2>
        <ul className="bev__bullets">
          {snap.shortVsLongRu.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      <div className="bev__grid">
        <section className="bev__panel glass-panel">
          <h2 className="bev__h2">{t("bev.s2")}</h2>
          <ul className="bev__dec">
            {snap.strengthen.map((d) => (
              <li key={d.id} className="bev__dec-card">
                <span className="bev__stance">{EVOLUTION_STANCE_RU[d.stance]}</span>
                <p className="bev__dec-h">{d.headlineRu}</p>
                <p className="bev__dec-r">{d.rationaleRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel">
          <h2 className="bev__h2">{t("bev.s3")}</h2>
          <ul className="bev__rules">
            {snap.protectRules.map((r) => (
              <li key={r.id} className="bev__rule">
                <span className="bev__rule-pri">P{r.priority}</span>
                <p className="bev__rule-t">{r.ruleRu}</p>
                <p className="bev__rule-rej">
                  <span className="bev__tag">{t("bev.reject")}</span> {r.whatToRejectRu}
                </p>
              </li>
            ))}
          </ul>
          <ul className="bev__dec bev__dec--tight">
            {snap.protectDecisions.map((d) => (
              <li key={d.id} className="bev__dec-card bev__dec-card--sub">
                <span className="bev__stance">{EVOLUTION_STANCE_RU[d.stance]}</span>
                <p className="bev__dec-h">{d.headlineRu}</p>
                <p className="bev__dec-r">{d.rationaleRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel">
          <h2 className="bev__h2">{t("bev.s4")}</h2>
          <ul className="bev__dec">
            {snap.testDecisions.map((d) => (
              <li key={d.id} className="bev__dec-card">
                <span className="bev__stance">{EVOLUTION_STANCE_RU[d.stance]}</span>
                <p className="bev__dec-h">{d.headlineRu}</p>
                <p className="bev__dec-r">{d.rationaleRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel">
          <h2 className="bev__h2">{t("bev.s5")}</h2>
          <ul className="bev__dec">
            {snap.stopDecisions.map((d) => (
              <li key={d.id} className="bev__dec-card bev__dec-card--stop">
                <span className="bev__stance">{EVOLUTION_STANCE_RU[d.stance]}</span>
                <p className="bev__dec-h">{d.headlineRu}</p>
                <p className="bev__dec-r">{d.rationaleRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel bev__panel--wide">
          <h2 className="bev__h2">{t("bev.s6")}</h2>
          <ul className="bev__cat">
            {snap.categorySignals.map((c) => (
              <li key={c.id} className="bev__cat-card">
                <div className="bev__cat-head">
                  <span className="bev__cat-name">{c.categoryRu}</span>
                  <span className="bev__cat-opp">
                    {t("bev.metaOpportunity")} {c.opportunity}%
                  </span>
                  <span className="bev__cat-fric">
                    {t("bev.metaFriction")} {c.dnaFriction}%
                  </span>
                </div>
                <p className="bev__cat-ev">{c.evidenceRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel bev__panel--wide">
          <h2 className="bev__h2">{t("bev.s7")}</h2>
          <ul className="bev__risk">
            {snap.dilutionRisks.map((r) => (
              <li key={r.id} className="bev__risk-card">
                <div className="bev__risk-head">
                  <span className="bev__risk-sev">{r.severity}%</span>
                  <span className="bev__risk-title">{r.titleRu}</span>
                  {r.rejectBlindFollowing ? <span className="bev__pill">{t("bev.noBlind")}</span> : null}
                </div>
                <p className="bev__risk-body">{r.detailRu}</p>
                <p className="bev__risk-src">{r.source}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel">
          <h2 className="bev__h2">{t("bev.s8")}</h2>
          <ul className="bev__her">
            {snap.heritageAnchors.map((h) => (
              <li key={h.id} className="bev__her-card">
                <p className="bev__her-a">{h.anchorRu}</p>
                <p className="bev__her-w">{h.whyRu}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bev__panel glass-panel bev__panel--full">
          <h2 className="bev__h2">{t("bev.s9")}</h2>
          <div className="bev__horizons">
            {snap.futureDirections.map((f) => (
              <article key={f.horizonDays} className="bev__hor glass-panel">
                <p className="bev__hor-k">{f.horizonDays} {t("bev.days")}</p>
                <p className="bev__hor-h">{f.headlineRu}</p>
                <ul>
                  {f.bulletsRu.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>

      {toast ? (
        <div className="bev__toast" role="status">
          {toast}
        </div>
      ) : null}

      <style>{`
        .bev {
          padding: 8px 0 56px;
          max-width: none;
          margin: 0;
        }
        .bev__links--compact {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
        }
        .bev__btn {
          border-radius: 11px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.4);
          color: var(--text);
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 9px 13px;
          cursor: pointer;
        }
        .bev__btn:hover {
          border-color: rgba(160, 175, 210, 0.35);
        }
        .bev__btn--pri {
          border-color: rgba(160, 175, 210, 0.45);
        }
        .bev__links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 14px;
        }
        .bev__link {
          border: none;
          background: transparent;
          color: rgba(175, 185, 215, 0.88);
          font-size: 0.78rem;
          cursor: pointer;
          padding: 0;
          border-bottom: 1px solid rgba(175, 185, 215, 0.2);
        }
        .bev__link:hover {
          color: var(--text);
        }
        .bev__warn {
          padding: 16px 20px;
          margin-bottom: 20px;
          border-left: 2px solid rgba(200, 175, 140, 0.45);
        }
        .bev__warn-k {
          margin: 0 0 8px;
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .bev__warn-t {
          margin: 0;
          color: rgba(230, 225, 215, 0.92);
          line-height: 1.55;
          font-size: 0.9rem;
        }
        .bev__panel {
          padding: 20px 22px;
          margin-bottom: 18px;
        }
        .bev__h2 {
          font-size: 0.68rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 14px;
        }
        .bev__h3 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 10px;
        }
        .bev__prose {
          margin: 0 0 18px;
          color: var(--muted);
          line-height: 1.6;
          font-size: 0.88rem;
        }
        .bev__split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 860px) {
          .bev__split {
            grid-template-columns: 1fr;
          }
        }
        .bev__ae,
        .bev__vec,
        .bev__bullets,
        .bev__dec,
        .bev__rules,
        .bev__cat,
        .bev__risk,
        .bev__her {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bev__ae {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bev__ae-card {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.28);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        .bev__ae-k {
          margin: 0 0 6px;
          font-weight: 600;
          font-size: 0.86rem;
        }
        .bev__ae-meta {
          margin: 0 0 6px;
          font-size: 0.68rem;
          color: var(--faint);
          letter-spacing: 0.06em;
        }
        .bev__ae-body {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .bev__vec {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bev__vec-row {
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .bev__vec-axis {
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .bev__vec-bar {
          display: block;
          height: 2px;
          margin: 6px 0;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }
        .bev__vec-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          width: calc(var(--bev-v, 50) * 1%);
          max-width: 100%;
          background: linear-gradient(90deg, rgba(90, 95, 120, 0.4), rgba(175, 185, 215, 0.35));
        }
        .bev__vec-label {
          margin: 6px 0 4px;
          font-size: 0.84rem;
          font-weight: 500;
        }
        .bev__vec-dir {
          margin: 0;
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .bev__vec-hor {
          font-size: 0.62rem;
          color: var(--faint);
          letter-spacing: 0.14em;
        }
        .bev__bullets {
          padding-left: 1.1rem;
          color: var(--muted);
          line-height: 1.55;
          font-size: 0.86rem;
        }
        .bev__grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        @media (max-width: 900px) {
          .bev__grid {
            grid-template-columns: 1fr;
          }
        }
        .bev__panel--wide,
        .bev__panel--full {
          grid-column: 1 / -1;
        }
        .bev__dec {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bev__dec--tight {
          margin-top: 14px;
        }
        .bev__dec-card {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(6, 8, 14, 0.55);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .bev__dec-card--sub {
          background: rgba(0, 0, 0, 0.25);
        }
        .bev__dec-card--stop {
          box-shadow: inset 0 0 0 1px rgba(120, 90, 85, 0.2);
        }
        .bev__stance {
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(200, 205, 225, 0.75);
        }
        .bev__dec-h {
          margin: 8px 0 6px;
          font-weight: 600;
          font-size: 0.88rem;
        }
        .bev__dec-r {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .bev__rules {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bev__rule {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
        }
        .bev__rule-pri {
          font-size: 0.58rem;
          color: var(--faint);
          letter-spacing: 0.16em;
        }
        .bev__rule-t {
          margin: 6px 0;
          font-size: 0.84rem;
          color: rgba(225, 228, 238, 0.92);
        }
        .bev__rule-rej {
          margin: 0;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .bev__tag {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 6px;
        }
        .bev__cat {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bev__cat-card {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.28);
        }
        .bev__cat-head {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .bev__cat-name {
          font-weight: 600;
          flex: 1;
          min-width: 0;
        }
        .bev__cat-opp,
        .bev__cat-fric {
          font-size: 0.68rem;
          color: var(--faint);
          letter-spacing: 0.06em;
        }
        .bev__cat-ev {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .bev__risk {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bev__risk-card {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(8, 10, 16, 0.65);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        .bev__risk-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .bev__risk-sev {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.9rem;
          color: rgba(210, 200, 190, 0.9);
        }
        .bev__risk-title {
          flex: 1;
          font-weight: 600;
          font-size: 0.88rem;
        }
        .bev__pill {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 99px;
          border: 1px solid rgba(200, 175, 140, 0.35);
          color: rgba(220, 205, 185, 0.9);
        }
        .bev__risk-body {
          margin: 0 0 8px;
          font-size: 0.84rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .bev__risk-src {
          margin: 0;
          font-size: 0.68rem;
          color: var(--faint);
        }
        .bev__her {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bev__her-card {
          padding: 14px 16px;
          border-left: 2px solid rgba(175, 185, 215, 0.25);
          background: rgba(0, 0, 0, 0.22);
        }
        .bev__her-a {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .bev__her-w {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .bev__horizons {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 900px) {
          .bev__horizons {
            grid-template-columns: 1fr;
          }
        }
        .bev__hor {
          padding: 16px 18px;
        }
        .bev__hor-k {
          margin: 0 0 8px;
          font-size: 0.58rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .bev__hor-h {
          margin: 0 0 10px;
          font-weight: 600;
          font-size: 0.88rem;
          line-height: 1.35;
        }
        .bev__hor ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .bev__toast {
          position: fixed;
          bottom: 26px;
          right: 26px;
          z-index: 50;
          padding: 11px 15px;
          border-radius: 11px;
          background: rgba(10, 12, 18, 0.94);
          border: 1px solid rgba(175, 185, 215, 0.25);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}
