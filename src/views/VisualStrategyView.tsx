import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  GENERIC_MARKETPLACE_VISUAL_TRAPS,
  VOKRA_VISUAL_DNA_TRAITS,
  useVisualStrategySnapshot,
} from "../lib/visual-intelligence";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";
import { consumeVisualStrategySerpBanner, type SerpInsight } from "../lib/competitor-serp";
import { consumeHeroArchetypeVisualStrategyLines } from "../lib/hero-archetypes";
import { consumeHeroReadabilityVisualStrategyLines } from "../lib/hero-readability";
import { consumeHeroBattlePlanVisualStrategyLines } from "../lib/hero-battle-plan";

type Props = { onNavigate: (id: NavId) => void };

export function VisualStrategyView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const snap = useVisualStrategySnapshot();
  const [toast, setToast] = useState<string | null>(null);
  const [serpBanner, setSerpBanner] = useState<SerpInsight[] | null>(null);
  const [archetypeBanner, setArchetypeBanner] = useState<{ query: string; lines: string[] } | null>(null);
  const [readabilityBanner, setReadabilityBanner] = useState<{ query: string; lines: string[] } | null>(null);
  const [battlePlanBanner, setBattlePlanBanner] = useState<{ query: string; lines: string[] } | null>(null);
  const en = locale === "en";

  useEffect(() => {
    const b = consumeVisualStrategySerpBanner();
    if (b?.length) setSerpBanner(b);
    const arch = consumeHeroArchetypeVisualStrategyLines();
    if (arch?.lines?.length) setArchetypeBanner(arch);
    const read = consumeHeroReadabilityVisualStrategyLines();
    if (read?.lines?.length) setReadabilityBanner(read);
    const hbp = consumeHeroBattlePlanVisualStrategyLines();
    if (hbp?.lines?.length) setBattlePlanBanner(hbp);
  }, []);

  const packJson = useMemo(() => JSON.stringify(snap, null, 2), [snap]);

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "visual_strategy",
      title: `${en ? "Visual Strategy" : "Визуальная стратегия"} · pulse ${snap.pulseSeed}`,
      content: packJson,
      mime: "application/json",
      tags: ["visual_strategy", "launch_readiness", String(snap.heroVisual.compositionType)],
      meta: {
        fatigueScore: snap.fatigue.score,
        heroComposition: snap.heroVisual.compositionType,
        primaryCorridor: snap.activeDirections[0]?.corridor,
      },
    });
    setToast(t("visualStrategy.toastSaved"));
    window.setTimeout(() => setToast(null), 2400);
  }, [en, packJson, snap, t]);

  const copyDigest = useCallback(async () => {
    const text = (en ? snap.integrationDigestEn : snap.integrationDigestRu).join("\n");
    await copyToClipboard(text);
    setToast(t("visualStrategy.toastCopied"));
    window.setTimeout(() => setToast(null), 2200);
  }, [en, snap.integrationDigestEn, snap.integrationDigestRu, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-visual-strategy-${snap.pulseSeed}.json`, JSON.parse(packJson) as object);
  }, [packJson, snap.pulseSeed]);

  const digest = en ? snap.integrationDigestEn : snap.integrationDigestRu;

  return (
    <div className="vs-ops">
      <header className="vs-ops__head">
        <p className="vs-ops__eyebrow">{t("visualStrategy.eyebrow")}</p>
        <h1 className="vs-ops__title">{t("visualStrategy.title")}</h1>
        <p className="vs-ops__lede">{t("visualStrategy.lede")}</p>
        {serpBanner?.length ? (
          <div className="vs-serp-banner glass-panel" style={{ marginTop: 12, padding: "12px 14px", fontSize: "0.88rem" }}>
            <strong>{t("visualStrategy.serpBannerTitle")}</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: "1.1rem" }}>
              {serpBanner.map((ins) => (
                <li key={ins.id}>{t(ins.messageKey, ins.vars)}</li>
              ))}
            </ul>
            <button type="button" className="ghost-btn" style={{ marginTop: 10 }} onClick={() => setSerpBanner(null)}>
              {t("visualStrategy.serpBannerDismiss")}
            </button>
          </div>
        ) : null}
        {archetypeBanner?.lines?.length ? (
          <div className="vs-serp-banner glass-panel" style={{ marginTop: 12, padding: "12px 14px", fontSize: "0.88rem" }}>
            <strong>{t("visualStrategy.archetypeBannerTitle")}</strong>
            <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{archetypeBanner.query}</p>
            <ul style={{ margin: "8px 0 0", paddingLeft: "1.1rem" }}>
              {archetypeBanner.lines.map((line, i) => (
                <li key={`arch-${i}`}>{line}</li>
              ))}
            </ul>
            <button type="button" className="ghost-btn" style={{ marginTop: 10 }} onClick={() => setArchetypeBanner(null)}>
              {t("visualStrategy.serpBannerDismiss")}
            </button>
          </div>
        ) : null}
        {readabilityBanner?.lines?.length ? (
          <div className="vs-serp-banner glass-panel" style={{ marginTop: 12, padding: "12px 14px", fontSize: "0.88rem" }}>
            <strong>{t("visualStrategy.readabilityBannerTitle")}</strong>
            <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{readabilityBanner.query}</p>
            <ul style={{ margin: "8px 0 0", paddingLeft: "1.1rem" }}>
              {readabilityBanner.lines.map((line, i) => (
                <li key={`read-${i}`}>{line}</li>
              ))}
            </ul>
            <button type="button" className="ghost-btn" style={{ marginTop: 10 }} onClick={() => setReadabilityBanner(null)}>
              {t("visualStrategy.serpBannerDismiss")}
            </button>
          </div>
        ) : null}
        {battlePlanBanner?.lines?.length ? (
          <div className="vs-serp-banner glass-panel" style={{ marginTop: 12, padding: "12px 14px", fontSize: "0.88rem" }}>
            <strong>{t("visualStrategy.battlePlanBannerTitle")}</strong>
            <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{battlePlanBanner.query}</p>
            <ul style={{ margin: "8px 0 0", paddingLeft: "1.1rem" }}>
              {battlePlanBanner.lines.map((line, i) => (
                <li key={`hbp-${i}`}>{line}</li>
              ))}
            </ul>
            <button type="button" className="ghost-btn" style={{ marginTop: 10 }} onClick={() => setBattlePlanBanner(null)}>
              {t("visualStrategy.serpBannerDismiss")}
            </button>
          </div>
        ) : null}
        <div className="vs-ops__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("visualStrategy.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportJson}>
            {t("visualStrategy.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyDigest}>
            {t("visualStrategy.copyDigest")}
          </button>
        </div>
        {toast ? <p className="vs-ops__toast">{toast}</p> : null}
      </header>

      <section className="vs-ops__panel glass-panel">
        <h2 className="vs-ops__h2">{t("visualStrategy.section.integrations")}</h2>
        <div className="vs-ops__links">
          <button type="button" className="linkish" onClick={() => onNavigate("collectionBuilder")}>
            {t("visualStrategy.link.collection")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("dna")}>
            {t("visualStrategy.link.dna")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("dashboard")}>
            {t("visualStrategy.link.topology")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("analytics")}>
            {t("visualStrategy.link.analytics")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("visual")}>
            {t("visualStrategy.link.lab")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("visualAssets")}>
            {t("visualStrategy.link.visualAssets")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("executionOrchestrator")}>
            {t("visualStrategy.link.orchestrator")}
          </button>
        </div>
        <ul className="vs-ops__digest">
          {digest.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="vs-ops__panel glass-panel">
        <h2 className="vs-ops__h2">{t("visualStrategy.section.corridors")}</h2>
        <div className="vs-ops__corridor-grid">
          {snap.corridors.slice(0, 8).map((c) => (
            <article key={c.id} className="vs-ops__corridor">
              <h3>{en ? c.labelEn : c.labelRu}</h3>
              <ul>
                {c.grammarLines.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="vs-ops__grid2">
        <section className="vs-ops__panel glass-panel">
          <h2 className="vs-ops__h2">{t("visualStrategy.section.directions")}</h2>
          {snap.activeDirections.map((d) => (
            <article key={d.id} className="vs-ops__dir">
              <h3>{d.name}</h3>
              <dl className="vs-ops__dl">
                <div>
                  <dt>{t("visualStrategy.k.corridor")}</dt>
                  <dd>{d.corridor}</dd>
                </div>
                <div>
                  <dt>{t("visualStrategy.k.premium")}</dt>
                  <dd>{d.premiumLevel}</dd>
                </div>
                <div>
                  <dt>{t("visualStrategy.k.marketplace")}</dt>
                  <dd>{d.marketplaceFit}</dd>
                </div>
                <div>
                  <dt>{t("visualStrategy.k.dtf")}</dt>
                  <dd>{d.dtfCompatibility}</dd>
                </div>
                <div>
                  <dt>{t("visualStrategy.k.fatigueRisk")}</dt>
                  <dd>{d.fatigueRisk}</dd>
                </div>
                <div>
                  <dt>{t("visualStrategy.k.hero")}</dt>
                  <dd>{d.heroSuitability}</dd>
                </div>
                <div>
                  <dt>{t("visualStrategy.k.role")}</dt>
                  <dd>{d.campaignRole}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="vs-ops__panel glass-panel">
          <h2 className="vs-ops__h2">{t("visualStrategy.section.hero")}</h2>
          <p className="vs-ops__mono">{snap.heroVisual.compositionType}</p>
          <p className="vs-ops__prose">{snap.heroVisual.modelFraming}</p>
          <dl className="vs-ops__dl vs-ops__dl--dense">
            <div>
              <dt>{t("visualStrategy.k.garment")}</dt>
              <dd>{snap.heroVisual.garmentVisibility}</dd>
            </div>
            <div>
              <dt>{t("visualStrategy.k.print")}</dt>
              <dd>{snap.heroVisual.printVisibility}</dd>
            </div>
            <div>
              <dt>{t("visualStrategy.k.readability")}</dt>
              <dd>{snap.heroVisual.readability}</dd>
            </div>
            <div>
              <dt>CTR</dt>
              <dd>{snap.heroVisual.ctrSuitability}</dd>
            </div>
            <div>
              <dt>{t("visualStrategy.k.premiumPerc")}</dt>
              <dd>{snap.heroVisual.premiumPerception}</dd>
            </div>
            <div>
              <dt>{t("visualStrategy.k.refreshAge")}</dt>
              <dd>{snap.heroVisual.refreshAge}</dd>
            </div>
            <div>
              <dt>{t("visualStrategy.k.overlap")}</dt>
              <dd>{snap.heroVisual.overlapRisk}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="vs-ops__grid2">
        <section className="vs-ops__panel glass-panel">
          <h2 className="vs-ops__h2">{t("visualStrategy.section.fatigue")}</h2>
          <p className="vs-ops__mega">
            {t("visualStrategy.fatigueScore")}: <strong>{snap.fatigue.score}</strong>
          </p>
          <ul className="vs-ops__signals">
            {(en ? snap.fatigue.signalsEn : snap.fatigue.signalsRu).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
        <section className="vs-ops__panel glass-panel">
          <h2 className="vs-ops__h2">{t("visualStrategy.section.campaign")}</h2>
          <ul className="vs-ops__kv">
            <li>
              <span>{t("visualStrategy.k.reels")}</span> {snap.campaign.reelsDirection}
            </li>
            <li>
              <span>{t("visualStrategy.k.thumb")}</span> {snap.campaign.thumbnailLogic}
            </li>
            <li>
              <span>{t("visualStrategy.k.bg")}</span> {snap.campaign.backgroundStyle}
            </li>
            <li>
              <span>{t("visualStrategy.k.casting")}</span> {snap.campaign.castingLogic}
            </li>
            <li>
              <span>{t("visualStrategy.k.pacing")}</span> {snap.campaign.visualPacing}
            </li>
          </ul>
        </section>
      </div>

      <section className="vs-ops__panel glass-panel">
        <h2 className="vs-ops__h2">{t("visualStrategy.section.physics")}</h2>
        <div className="vs-ops__phys-grid">
          {(
            [
              ["thumb", snap.physics.thumbnailReadability],
              ["contrast", snap.physics.mobileContrast],
              ["heroFocus", snap.physics.heroFocus],
              ["printDom", snap.physics.printDominance],
              ["silhouette", snap.physics.silhouetteRecognition],
              ["noise", snap.physics.visualNoise],
              ["conv", snap.physics.conversionClarity],
              ["vf", snap.physics.visualFatigue],
              ["overlap", snap.physics.overlapSaturation],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="vs-ops__phys-cell">
              <span>{t(`visualStrategy.phys.${k}`)}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <h3 className="vs-ops__h3">{t("visualStrategy.section.diagnostics")}</h3>
        <ul className="vs-ops__diag">
          {snap.physics.diagnosticsRu.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <div className="vs-ops__grid2">
        <section className="vs-ops__panel glass-panel">
          <h2 className="vs-ops__h2">{t("visualStrategy.section.dna")}</h2>
          <ul className="vs-ops__pill-list">
            {VOKRA_VISUAL_DNA_TRAITS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3 className="vs-ops__h3">{t("visualStrategy.section.traps")}</h3>
          <ul className="vs-ops__trap-list">
            {GENERIC_MARKETPLACE_VISUAL_TRAPS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="vs-ops__panel glass-panel">
          <h2 className="vs-ops__h2">{t("visualStrategy.section.refresh")}</h2>
          <ul className="vs-ops__signals">
            {(en ? snap.integrationDigestEn : snap.integrationDigestRu).slice(-2).map((s, i) => (
              <li key={`${i}-${s.slice(0, 20)}`}>{s}</li>
            ))}
          </ul>
          <h3 className="vs-ops__h3">{t("visualStrategy.section.memory")}</h3>
          <ul className="vs-ops__mem">
            {snap.memoryLedger.map((m) => (
              <li key={m.id} data-sev={m.severity}>
                <strong>{en ? m.labelEn : m.labelRu}</strong>
                <span>{en ? m.noteEn : m.noteRu}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="vs-ops__panel glass-panel">
        <h2 className="vs-ops__h2">{t("visualStrategy.section.promptFoundation")}</h2>
        <p className="vs-ops__small">{t("visualStrategy.promptHint")}</p>
        <ul className="vs-ops__slots">
          {snap.promptFoundation.slotOrder.map((slot) => (
            <li key={slot}>
              <code>{slot}</code>
              <span>{snap.promptFoundation.slots[slot]}</span>
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        .vs-ops {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 4px 48px;
        }
        .vs-ops__head {
          margin-bottom: 18px;
        }
        .vs-ops__eyebrow {
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 8px;
        }
        .vs-ops__title {
          font-family: var(--font-display);
          font-size: clamp(1.35rem, 2.2vw, 1.7rem);
          margin: 0 0 8px;
        }
        .vs-ops__lede {
          color: var(--muted);
          max-width: 62ch;
          line-height: 1.55;
          margin: 0 0 12px;
          font-size: 0.88rem;
        }
        .vs-ops__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .vs-ops__toast {
          margin: 10px 0 0;
          font-size: 0.82rem;
          color: rgba(160, 210, 255, 0.85);
        }
        .vs-ops__panel {
          padding: 14px 16px 16px;
          margin-bottom: 12px;
        }
        .vs-ops__h2 {
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(200, 210, 235, 0.75);
          margin: 0 0 10px;
        }
        .vs-ops__h3 {
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 14px 0 8px;
        }
        .vs-ops__links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          margin-bottom: 12px;
        }
        .linkish {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(140, 175, 255, 0.9);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .vs-ops__digest {
          margin: 0;
          padding-left: 1.1rem;
          font-size: 0.82rem;
          line-height: 1.45;
          color: rgba(195, 205, 230, 0.92);
        }
        .vs-ops__corridor-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
        .vs-ops__corridor {
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
          padding: 10px 12px;
          font-size: 0.78rem;
        }
        .vs-ops__corridor h3 {
          margin: 0 0 8px;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .vs-ops__corridor ul {
          margin: 0;
          padding-left: 1rem;
          color: rgba(175, 188, 215, 0.9);
        }
        .vs-ops__grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 860px) {
          .vs-ops__grid2 {
            grid-template-columns: 1fr;
          }
        }
        .vs-ops__dir {
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vs-ops__dir:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .vs-ops__dir h3 {
          margin: 0 0 8px;
          font-size: 0.9rem;
        }
        .vs-ops__dl {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
          margin: 0;
          font-size: 0.78rem;
        }
        .vs-ops__dl--dense {
          grid-template-columns: 1fr 1fr;
        }
        .vs-ops__dl div {
          display: contents;
        }
        .vs-ops__dl dt {
          color: var(--muted);
          text-transform: uppercase;
          font-size: 0.62rem;
          letter-spacing: 0.08em;
        }
        .vs-ops__dl dd {
          margin: 0;
          text-align: right;
        }
        .vs-ops__mono {
          font-family: ui-monospace, monospace;
          font-size: 0.78rem;
          margin: 0 0 8px;
          color: rgba(160, 190, 255, 0.9);
        }
        .vs-ops__prose {
          font-size: 0.82rem;
          line-height: 1.45;
          margin: 0 0 10px;
        }
        .vs-ops__mega {
          margin: 0 0 8px;
          font-size: 1.05rem;
        }
        .vs-ops__signals {
          margin: 0;
          padding-left: 1.05rem;
          font-size: 0.82rem;
          line-height: 1.45;
          color: rgba(255, 200, 170, 0.88);
        }
        .vs-ops__kv {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.8rem;
        }
        .vs-ops__kv li {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .vs-ops__kv span {
          color: var(--muted);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .vs-ops__phys-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }
        .vs-ops__phys-cell {
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.25);
          padding: 8px 10px;
          font-size: 0.72rem;
        }
        .vs-ops__phys-cell span {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .vs-ops__diag {
          margin: 0;
          padding-left: 1.05rem;
          font-size: 0.82rem;
          color: rgba(230, 200, 170, 0.92);
        }
        .vs-ops__pill-list,
        .vs-ops__trap-list {
          margin: 0;
          padding-left: 1.05rem;
          font-size: 0.78rem;
          line-height: 1.4;
        }
        .vs-ops__trap-list {
          color: rgba(255, 170, 150, 0.85);
        }
        .vs-ops__mem {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.78rem;
        }
        .vs-ops__mem li {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .vs-ops__mem li[data-sev="critical"] strong {
          color: rgba(255, 160, 140, 0.95);
        }
        .vs-ops__small {
          font-size: 0.72rem;
          color: var(--muted);
          margin: 0 0 10px;
        }
        .vs-ops__slots {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.74rem;
        }
        .vs-ops__slots li {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .vs-ops__slots code {
          font-size: 0.65rem;
          color: rgba(150, 185, 255, 0.85);
        }
      `}</style>
    </div>
  );
}
