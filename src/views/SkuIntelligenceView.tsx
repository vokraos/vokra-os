import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { loadCardProductionBoardFromSession } from "../lib/card-production";
import { loadVisualAssetRegistryFromSession } from "../lib/visual-assets";
import { recordGeneration } from "../lib/memory";
import { ENTITY_SNAPSHOT_EVENT, selectSkuIntelImportPanel } from "../lib/entity-snapshot";
import {
  deriveSkuIntelligenceSnapshot,
  filterEntitiesBySection,
  type SkuIntelligenceEntity,
  type SkuIntelligenceSnapshot,
} from "../lib/sku-intelligence";

type Props = { onNavigate: (id: NavId) => void };

type SiSection = Parameters<typeof filterEntitiesBySection>[1];

const SECTIONS: { id: SiSection; labelKey: string }[] = [
  { id: "hero", labelKey: "skuIntel.section.hero" },
  { id: "support_corridors", labelKey: "skuIntel.section.support" },
  { id: "overheating", labelKey: "skuIntel.section.overheating" },
  { id: "saturation", labelKey: "skuIntel.section.saturation" },
  { id: "expansion", labelKey: "skuIntel.section.expansion" },
  { id: "recovery", labelKey: "skuIntel.section.recovery" },
  { id: "refresh", labelKey: "skuIntel.section.refresh" },
  { id: "archive", labelKey: "skuIntel.section.archive" },
];

function SkuCard({ e, t }: { e: SkuIntelligenceEntity; t: (k: string, v?: Record<string, string>) => string }) {
  return (
    <article className="si-card">
      <p className="si-card__title">
        <code>{e.skuCode}</code> · {e.corridor}
      </p>
      <p className="si-card__meta">
        {t("skuIntel.k.role")}: <strong>{t(`skuIntel.role.${e.role}`)}</strong> · {t("skuIntel.k.lifecycle")}:{" "}
        <strong>{t(`skuIntel.lifecycle.${e.lifecycleStage}`)}</strong> · {t("skuIntel.k.hero")}:{" "}
        <strong>{t(`skuIntel.heroStatus.${e.heroStatus}`)}</strong>
      </p>
      <p className="si-card__notes">{e.operationalNotes}</p>
      <div className="si-card__bars">
        <div className="si-metric">
          <span>{t("skuIntel.metric.saturation")}</span>
          <span>{e.saturationRisk}</span>
        </div>
        <div className="si-metric">
          <span>{t("skuIntel.metric.overlap")}</span>
          <span>{e.overlapRisk}</span>
        </div>
        <div className="si-metric">
          <span>{t("skuIntel.metric.refresh")}</span>
          <span>{e.refreshNeed}</span>
        </div>
        <div className="si-metric">
          <span>{t("skuIntel.metric.visualFatigue")}</span>
          <span>{e.visualFatigue}</span>
        </div>
        <div className="si-metric">
          <span>{t("skuIntel.metric.seoPressure")}</span>
          <span>{e.seoPressure}</span>
        </div>
        <div className="si-metric">
          <span>{t("skuIntel.metric.priority")}</span>
          <span>{e.marketplacePriority}</span>
        </div>
        <div className="si-metric">
          <span>{t("skuIntel.metric.launchReadiness")}</span>
          <span>{e.launchReadiness}</span>
        </div>
      </div>
      <p className="si-card__sub">{t("skuIntel.k.wave")}</p>
      <p className="si-card__mono">
        <code>{e.launchWaveId}</code>
      </p>
      <p className="si-card__sub">{t("skuIntel.k.plans")}</p>
      <p className="si-card__mono">
        {e.linkedCardPlans.map((id) => (
          <code key={id}>{id}</code>
        ))}
      </p>
    </article>
  );
}

export function SkuIntelligenceView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [toast, setToast] = useState<string | null>(null);
  const [esTick, setEsTick] = useState(0);

  useEffect(() => {
    const fn = () => setEsTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, fn);
    return () => window.removeEventListener(ENTITY_SNAPSHOT_EVENT, fn);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const envelope = loadCardProductionBoardFromSession();
  const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];

  const planEmpty = !envelope || envelope.plans.length === 0;

  const snapshot = useMemo<SkuIntelligenceSnapshot>(
    () => deriveSkuIntelligenceSnapshot(envelope, assets),
    [envelope, assets],
  );

  const importPanel = useMemo(() => selectSkuIntelImportPanel(), [esTick]);

  const empty = planEmpty && !importPanel;
  const showPlanTopology = !planEmpty;

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "sku_intelligence",
      title: t("skuIntel.memoryTitle", { n: String(snapshot.entities.length) }),
      content: JSON.stringify(snapshot),
      mime: "application/json",
      tags: ["sku_intelligence", "topology"],
      meta: {
        entityCount: String(snapshot.entities.length),
        eventCount: String(snapshot.events.length),
        commandCount: String(snapshot.commands.length),
      },
    });
    showToast(t("skuIntel.toastSavedMemory"));
  }, [showToast, snapshot, t]);

  const echoLine = useMemo(() => {
    const echo = snapshot.entityCoreEcho;
    if (!echo?.spotlightKey) return null;
    const msg = t(echo.spotlightKey, echo.spotlightVars);
    return msg === echo.spotlightKey ? null : msg;
  }, [snapshot.entityCoreEcho, t]);

  return (
    <div className="cb-lab si-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("skuIntel.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.skuIntelligence")}</h1>
        <p className="cb-lab__lede">{t("skuIntel.lede")}</p>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory} disabled={empty}>
            {t("skuIntel.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("skuIntel.openCardProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("skuIntel.openMarketplaceOps")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("skuIntel.openVisualAssets")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("promptPack")}>
            {t("skuIntel.openPromptPack")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("skuIntel.openCollectionBuilder")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("executionOrchestrator")}>
            {t("skuIntel.openOrchestrator")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("skuIntel.openMemory")}
          </button>
        </div>
      </header>

      {importPanel ? (
        <section className="cb-lab__panel glass-panel si-sec si-sec--import">
          <h2 className="si-sec__h">{t("skuIntel.entitySnap.title")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">
            <span className="si-pill si-pill--manual">{t("skuIntel.entitySnap.badge")}</span>{" "}
            {t("skuIntel.entitySnap.lede", {
              n: String(importPanel.skuCount),
              type: t(`import.type.${importPanel.snapshot.importType}`),
            })}
          </p>
          <div className="si-imp-grid">
            <div>
              <h3 className="si-imp__h">{t("skuIntel.entitySnap.corridors")}</h3>
              <ul className="si-imp-list">
                {importPanel.corridorGroups.slice(0, 10).map((g) => (
                  <li key={g.corridor}>
                    <strong>{g.corridor}</strong> · {g.count}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="si-imp__h">{t("skuIntel.entitySnap.marketplaces")}</h3>
              <ul className="si-imp-chips">
                {Object.entries(importPanel.marketplaceCounts).map(([k, v]) => (
                  <li key={k}>
                    <code>{k}</code> {v}
                  </li>
                ))}
              </ul>
              <h3 className="si-imp__h">{t("skuIntel.entitySnap.stockModes")}</h3>
              <ul className="si-imp-chips">
                {Object.entries(importPanel.stockModeCounts).map(([k, v]) => (
                  <li key={k}>
                    <code>{k || "—"}</code> {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="si-imp-more">
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.seoGaps")}</h3>
            <p className="cb-lab__prose si-imp-meta">
              {t("skuIntel.snapIntel.seoLine", {
                n: String(importPanel.intelligence.seoGapSummary.cardsMissingSeo),
                corridor: importPanel.intelligence.seoGapSummary.topGapCorridor ?? "—",
              })}
            </p>
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.missingTitle")}</h3>
            <ul className="si-imp-issues">
              {importPanel.intelligence.missingFieldSummary.totalSlots === 0 ? (
                <li>{t("skuIntel.snapIntel.missingNone")}</li>
              ) : (
                <>
                  {importPanel.intelligence.missingFieldSummary.skuMissingCorridor > 0 ? (
                    <li>{t("skuIntel.snapIntel.missCorridor", { n: String(importPanel.intelligence.missingFieldSummary.skuMissingCorridor) })}</li>
                  ) : null}
                  {importPanel.intelligence.missingFieldSummary.skuMissingTitle > 0 ? (
                    <li>{t("skuIntel.snapIntel.missTitle", { n: String(importPanel.intelligence.missingFieldSummary.skuMissingTitle) })}</li>
                  ) : null}
                  {importPanel.intelligence.missingFieldSummary.skuMissingWarehouse > 0 ? (
                    <li>{t("skuIntel.snapIntel.missWhSku", { n: String(importPanel.intelligence.missingFieldSummary.skuMissingWarehouse) })}</li>
                  ) : null}
                  {importPanel.intelligence.missingFieldSummary.skuMissingProductFamily > 0 ? (
                    <li>{t("skuIntel.snapIntel.missFamily", { n: String(importPanel.intelligence.missingFieldSummary.skuMissingProductFamily) })}</li>
                  ) : null}
                  {importPanel.intelligence.missingFieldSummary.cardMissingHero > 0 ? (
                    <li>{t("skuIntel.snapIntel.missCardHero", { n: String(importPanel.intelligence.missingFieldSummary.cardMissingHero) })}</li>
                  ) : null}
                  {importPanel.intelligence.missingFieldSummary.cardMissingSeo > 0 ? (
                    <li>{t("skuIntel.snapIntel.missCardSeo", { n: String(importPanel.intelligence.missingFieldSummary.cardMissingSeo) })}</li>
                  ) : null}
                  {importPanel.intelligence.missingFieldSummary.cardMissingWarehouse > 0 ? (
                    <li>{t("skuIntel.snapIntel.missCardWh", { n: String(importPanel.intelligence.missingFieldSummary.cardMissingWarehouse) })}</li>
                  ) : null}
                </>
              )}
            </ul>
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.fboSplit")}</h3>
            <p className="cb-lab__prose si-imp-meta">
              {t("skuIntel.snapIntel.fboLine", {
                fbo: String(importPanel.intelligence.fboExposureSummary.fboLikeRows),
                fbs: String(importPanel.intelligence.fboExposureSummary.fbsLikeRows),
                amb: String(importPanel.intelligence.fboExposureSummary.ambiguousOrEmpty),
              })}
            </p>
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.stockIntel")}</h3>
            <ul className="si-imp-chips">
              {importPanel.intelligence.stockModeSummary.slice(0, 8).map((r) => (
                <li key={r.mode}>
                  <code>{r.mode}</code> {r.count}
                  {r.fboLike ? <span className="si-imp-tag">FBO</span> : null}
                  {r.fbsLike ? <span className="si-imp-tag">FBS</span> : null}
                </li>
              ))}
            </ul>
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.heroCandidates")}</h3>
            <ul className="si-imp-list">
              {importPanel.intelligence.heroCandidateSkus.length === 0 ? (
                <li>{t("skuIntel.snapIntel.heroNone")}</li>
              ) : (
                importPanel.intelligence.heroCandidateSkus.map((h) => (
                  <li key={h.skuCode}>
                    <code>{h.skuCode}</code> · {h.corridor} · <span className={`si-imp-cmp si-imp-cmp--${h.completeness}`}>{h.completeness}</span>
                  </li>
                ))
              )}
            </ul>
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.actionQueue")}</h3>
            <ol className="si-imp-actions">
              {importPanel.intelligence.actionQueue.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <div className="si-imp-act-head">
                    <strong>{t(a.titleKey, a.vars)}</strong>
                    <span className={`si-imp-pri si-imp-pri--${a.priority}`}>{a.priority}</span>
                  </div>
                  <p className="si-imp-act-reason">{t(a.reasonKey, a.vars)}</p>
                  <button type="button" className="ghost-btn si-imp-act-btn" onClick={() => onNavigate(a.destination)}>
                    {t("skuIntel.snapIntel.openTarget")}
                  </button>
                </li>
              ))}
            </ol>
            <p className="si-imp-cleanup">
              <button type="button" className="ghost-btn si-imp-act-btn" onClick={() => onNavigate("dataCleanup")}>
                {t("entitySnap.openDataCleanup")}
              </button>{" "}
              <button type="button" className="ghost-btn si-imp-act-btn" onClick={() => onNavigate("assortmentActions")}>
                {t("entitySnap.openAssortmentActions")}
              </button>
            </p>
            <h3 className="si-imp__h">{t("skuIntel.snapIntel.refreshCandidates")}</h3>
            <p className="cb-lab__prose si-imp-meta">
              {t("skuIntel.snapIntel.refreshLine", {
                weak: String(importPanel.intelligence.refreshCandidateSummary.weakSkuCount),
                thin: String(importPanel.intelligence.refreshCandidateSummary.thinTitleCardCount),
              })}
            </p>
          </div>
          {importPanel.topSample ? (
            <div className="si-imp-sample">
              <h3 className="si-imp__h">{t("skuIntel.entitySnap.topSample")}</h3>
              <p className="si-imp-mono">
                <code>{importPanel.topSample.skuCode}</code> · {importPanel.topSample.corridor || "—"} ·{" "}
                {importPanel.topSample.marketplace} · <span className={`si-imp-cmp si-imp-cmp--${importPanel.topSample.completeness}`}>{importPanel.topSample.completeness}</span>
              </p>
              <p className="cb-lab__prose si-imp-meta">{importPanel.topSample.title || t("skuIntel.entitySnap.noTitle")}</p>
            </div>
          ) : null}
          {importPanel.weakSamples.length > 0 ? (
            <div className="si-imp-weak">
              <h3 className="si-imp__h">{t("skuIntel.entitySnap.weakTitle")}</h3>
              <ul className="si-imp-list">
                {importPanel.weakSamples.map((s) => (
                  <li key={s.id}>
                    <code>{s.skuCode || "—"}</code>{" "}
                    <span className={`si-imp-cmp si-imp-cmp--${s.completeness}`}>{s.completeness}</span>
                    {s.missingFields.length > 0 ? (
                      <span className="si-imp-miss"> · {s.missingFields.slice(0, 5).join(", ")}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {importPanel.snapshot.warnings.length > 0 ? (
            <ul className="si-imp-warn">
              {importPanel.snapshot.warnings.map((w) => (
                <li key={w.id}>{t(w.labelKey)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {empty ? (
        <section className="cb-lab__panel glass-panel si-sec">
          <p className="cb-lab__prose">{t("skuIntel.empty")}</p>
        </section>
      ) : showPlanTopology ? (
        <>
          {echoLine ? (
            <section className="cb-lab__panel glass-panel si-sec si-sec--echo">
              <h2 className="si-sec__h">{t("skuIntel.section.entityCore")}</h2>
              <p className="cb-lab__prose">{echoLine}</p>
            </section>
          ) : null}

          <section className="cb-lab__panel glass-panel si-sec">
            <h2 className="si-sec__h">{t("skuIntel.section.commands")}</h2>
            <ul className="si-cmd-list">
              {snapshot.commands.map((c) => (
                <li key={c}>
                  <span className="si-pill">{t(`skuIntel.cmd.${c}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="cb-lab__panel glass-panel si-sec">
            <h2 className="si-sec__h">{t("skuIntel.section.signals")}</h2>
            <ul className="si-event-list">
              {snapshot.events.length === 0 ? <li>{t("skuIntel.none")}</li> : null}
              {snapshot.events.slice(0, 24).map((ev, i) => (
                <li key={`${ev.code}-${i}`}>
                  <span className="si-ev-kind">{t(`skuIntel.event.${ev.kind}`)}</span> · {ev.corridor} ·{" "}
                  <code>{ev.skuCode}</code> — {ev.detail}
                </li>
              ))}
            </ul>
          </section>

          {SECTIONS.map((sec) => {
            const list = filterEntitiesBySection(snapshot.entities, sec.id);
            return (
              <section key={sec.id} className="cb-lab__panel glass-panel si-sec">
                <h2 className="si-sec__h">{t(sec.labelKey)}</h2>
                {list.length === 0 ? <p className="cb-lab__prose cb-lab__prose--tight">{t("skuIntel.sectionEmpty")}</p> : null}
                <div className="si-grid">
                  {list.map((e) => (
                    <SkuCard key={e.id} e={e} t={t} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : importPanel ? (
        <section className="cb-lab__panel glass-panel si-sec">
          <p className="cb-lab__prose">{t("skuIntel.entitySnap.importOnly")}</p>
        </section>
      ) : null}
      <style>{`
        .si-lab .si-sec { margin-bottom: 16px; }
        .si-sec--echo { border-color: rgba(160, 200, 255, 0.25); }
        .si-sec__h { font-size: 0.82rem; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 12px; color: var(--muted); }
        .si-cmd-list, .si-event-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .si-pill { display: inline-block; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(120, 200, 255, 0.35); font-size: 0.78rem; }
        .si-pill--manual { border-color: rgba(200, 160, 255, 0.45); color: rgba(230, 210, 255, 0.95); }
        .si-sec--import { border-color: rgba(160, 200, 255, 0.22); }
        .si-imp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 12px; }
        .si-imp__h { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin: 12px 0 8px; }
        .si-imp-list { list-style: none; padding: 0; margin: 0; font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px; }
        .si-imp-chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.76rem; }
        .si-imp-chips li { padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); }
        .si-imp-sample { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .si-imp-mono { margin: 0; font-size: 0.82rem; }
        .si-imp-meta { margin: 6px 0 0; font-size: 0.78rem; color: var(--muted); }
        .si-imp-weak { margin-top: 12px; }
        .si-imp-miss { font-size: 0.72rem; color: rgba(255, 200, 160, 0.85); }
        .si-imp-warn { margin: 12px 0 0; padding: 0; list-style: none; font-size: 0.76rem; color: rgba(255, 200, 160, 0.9); }
        .si-imp-warn li { padding: 4px 0; }
        .si-imp-cmp { font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; margin-left: 6px; }
        .si-imp-cmp--strong { color: rgba(160, 240, 200, 0.9); }
        .si-imp-cmp--weak { color: rgba(255, 220, 160, 0.9); }
        .si-imp-cmp--minimal { color: rgba(255, 160, 160, 0.85); }
        .si-imp-more { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }
        .si-imp-issues { list-style: none; padding: 0; margin: 0; font-size: 0.78rem; display: flex; flex-direction: column; gap: 6px; color: rgba(255, 210, 190, 0.92); }
        .si-imp-tag { margin-left: 6px; font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(160, 200, 255, 0.85); }
        .si-imp-actions { margin: 8px 0 0; padding-left: 18px; font-size: 0.78rem; }
        .si-imp-actions li { margin-bottom: 12px; }
        .si-imp-act-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; flex-wrap: wrap; }
        .si-imp-act-reason { margin: 4px 0 6px; color: var(--muted); font-size: 0.74rem; }
        .si-imp-act-btn { font-size: 0.72rem; }
        .si-imp-cleanup { margin: 10px 0 0; }
        .si-imp-pri { font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .si-imp-pri--critical { color: rgba(255, 160, 160, 0.95); }
        .si-imp-pri--high { color: rgba(255, 200, 160, 0.95); }
        .si-imp-pri--medium { color: rgba(200, 220, 255, 0.9); }
        .si-imp-pri--low { color: var(--muted); }
        .si-ev-kind { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .si-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        .si-card { padding: 14px; border-radius: 12px; background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.06); }
        .si-card__title { margin: 0 0 8px; font-size: 0.95rem; }
        .si-card__meta { margin: 0 0 8px; font-size: 0.76rem; color: var(--muted); line-height: 1.45; }
        .si-card__notes { margin: 0 0 10px; font-size: 0.82rem; color: rgba(255,255,255,0.88); }
        .si-card__bars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; margin-bottom: 10px; }
        .si-metric { display: flex; justify-content: space-between; font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
        .si-card__sub { margin: 8px 0 4px; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .si-card__mono { display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.72rem; }
      `}</style>
    </div>
  );
}
