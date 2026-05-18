import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { loadCardProductionBoardFromSession } from "../lib/card-production";
import type { CardProductionPlan } from "../lib/card-production";
import { loadVisualAssetRegistryFromSession } from "../lib/visual-assets";
import { recordGeneration } from "../lib/memory";
import { ENTITY_SNAPSHOT_EVENT, selectMarketplaceOpsImportPanel } from "../lib/entity-snapshot";
import { getCorridorPrioritySignalsFromIntel } from "../lib/assortment-actions";
import { buildPrimaryMarketTimingReport, getMarketplaceOpsTimingHint } from "../lib/market-timing";
import { buildPrimaryCorridorStrategyReport, getMarketplaceOpsCorridorHint } from "../lib/corridor-strategy";
import { buildFboFbsDecisionReport, getMarketplaceOpsFboHint } from "../lib/fbo-fbs-decision";
import { buildScalingSafetyReport, getMarketplaceOpsScalingHint } from "../lib/scaling-safety";
import {
  applyWavePatches,
  deriveMarketplaceOperationalSnapshot,
  filterWavesByLane,
  loadMarketplaceOperationsSession,
  patchWaveInMarketplaceOperationsSession,
  clearMarketplaceOperationsSession,
  type LaunchWaveOperationalEntity,
  type LaunchWaveStatus,
  type MopsWaveFilterId,
  type MarketplaceOperationsMemoryPayload,
  MOPS_MEMORY_SCHEMA,
} from "../lib/marketplace-operations";

type Props = { onNavigate: (id: NavId) => void };

const FILTERS: { id: MopsWaveFilterId; labelKey: string }[] = [
  { id: "all", labelKey: "mops.filter.all" },
  { id: "ready_wb", labelKey: "mops.filter.ready_wb" },
  { id: "wait_hero", labelKey: "mops.filter.wait_hero" },
  { id: "wait_seo", labelKey: "mops.filter.wait_seo" },
  { id: "rich_incomplete", labelKey: "mops.filter.rich_incomplete" },
  { id: "packaging_risk", labelKey: "mops.filter.packaging_risk" },
  { id: "fbo_risk", labelKey: "mops.filter.fbo_risk" },
];

const STATUSES: LaunchWaveStatus[] = [
  "planning",
  "assembling",
  "ready",
  "blocked",
  "launched",
  "paused",
  "archived",
];

function pctBar(label: string, pct: number): ReactNode {
  return (
    <div className="mops-bar">
      <div className="mops-bar__head">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="mops-bar__track">
        <div className="mops-bar__fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

export function MarketplaceOperationsView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [sessionTick, setSessionTick] = useState(0);
  const [esTick, setEsTick] = useState(0);
  const [filter, setFilter] = useState<MopsWaveFilterId>("all");
  const [toast, setToast] = useState<string | null>(null);

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

  const snapshot = useMemo(() => deriveMarketplaceOperationalSnapshot(envelope, assets), [envelope, assets]);

  const session = useMemo(() => loadMarketplaceOperationsSession(), [sessionTick]);

  const importPanel = useMemo(() => selectMarketplaceOpsImportPanel(), [esTick]);

  const importCorridorEcon = useMemo(
    () => (importPanel ? getCorridorPrioritySignalsFromIntel(importPanel.intelligence) : null),
    [importPanel],
  );

  const waves = useMemo(
    () => applyWavePatches(snapshot, session.wavePatches),
    [snapshot, session.wavePatches],
  );

  const planById = useMemo(() => {
    const m = new Map<string, CardProductionPlan>();
    for (const p of envelope?.plans ?? []) m.set(p.id, p);
    return m;
  }, [envelope]);

  const filteredWaves = useMemo(() => filterWavesByLane(waves, filter, planById), [waves, filter, planById]);

  const executiveLines = useCallback(
    (w: LaunchWaveOperationalEntity): string[] => {
      const raw = t(`mops.brief.${w.executiveScenarioId}`, { corridor: w.corridor, marketplace: w.marketplace });
      return raw.split(" | ").map((s) => s.trim());
    },
    [t],
  );

  const onPatchWave = useCallback((waveId: string, patch: { launchStatus?: LaunchWaveStatus; launchPriority?: number }) => {
    patchWaveInMarketplaceOperationsSession(waveId, patch);
    setSessionTick((x) => x + 1);
  }, []);

  const saveMemory = useCallback(() => {
    const sess = loadMarketplaceOperationsSession();
    const payload: MarketplaceOperationsMemoryPayload = {
      schema: MOPS_MEMORY_SCHEMA,
      savedAt: Date.now(),
      wavePatches: sess.wavePatches,
      frozenSnapshot: snapshot,
    };
    recordGeneration({
      module: "marketplace_operations",
      title: t("mops.memoryTitle", { waves: String(snapshot.stats.waveCount), plans: String(snapshot.stats.planCount) }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["marketplace_operations", "launch_waves"],
      meta: {
        waveCount: String(snapshot.stats.waveCount),
        bottleneckCount: String(snapshot.globalBottlenecks.length),
        commandCount: String(snapshot.globalCommandCodes.length),
      },
    });
    showToast(t("mops.toastSavedMemory"));
  }, [showToast, snapshot, t]);

  const clearOpsSession = useCallback(() => {
    clearMarketplaceOperationsSession();
    setSessionTick((x) => x + 1);
    showToast(t("mops.toastClearedPatches"));
  }, [showToast, t]);

  const planEmpty = !envelope || envelope.plans.length === 0;
  const emptyScreen = planEmpty && !importPanel;

  const scalingHint = useMemo(() => getMarketplaceOpsScalingHint(buildScalingSafetyReport(t), t), [esTick, sessionTick, t]);
  const fboHint = useMemo(() => getMarketplaceOpsFboHint(buildFboFbsDecisionReport(t), t), [esTick, sessionTick, t]);
  const corridorHint = useMemo(
    () => getMarketplaceOpsCorridorHint(buildPrimaryCorridorStrategyReport(t), t),
    [esTick, sessionTick, t],
  );
  const timingHint = useMemo(
    () => getMarketplaceOpsTimingHint(buildPrimaryMarketTimingReport(t), t),
    [esTick, sessionTick, t],
  );

  return (
    <div className="cb-lab mops-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("mops.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.marketplaceOperations")}</h1>
        <p className="cb-lab__lede">{t("mops.lede")}</p>
        {timingHint ? <p className="cb-lab__hint">{timingHint}</p> : null}
        {corridorHint ? <p className="cb-lab__hint">{corridorHint}</p> : null}
        {fboHint ? <p className="cb-lab__hint">{fboHint}</p> : null}
        {scalingHint ? <p className="cb-lab__hint">{scalingHint}</p> : null}
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory} disabled={planEmpty && !importPanel}>
            {t("mops.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("mops.openCardProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("mops.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("ingestionReadiness")}>
            {t("mops.openIngestionReadiness")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("mops.openMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={clearOpsSession} disabled={Object.keys(session.wavePatches).length === 0}>
            {t("mops.clearPatches")}
          </button>
        </div>
      </header>

      {importPanel ? (
        <section className="cb-lab__panel glass-panel mops-sec mops-sec--import">
          <h2 className="mops-sec__h">{t("mops.entitySnap.title")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">
            <span className="mops-imp-badge">{t("mops.entitySnap.badge")}</span>{" "}
            {t("mops.entitySnap.lede", {
              cards: String(importPanel.cardCount),
              corridors: String(importPanel.corridors.length),
            })}
          </p>
          <div className="mops-imp-row">
            <div>
              <h3 className="mops-imp__h">{t("mops.entitySnap.marketSplit")}</h3>
              <ul className="mops-imp-chips">
                {Object.entries(importPanel.marketplaceSplit).map(([k, v]) => (
                  <li key={k}>
                    <code>{k}</code> {v}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mops-imp__h">{t("mops.entitySnap.opsGrouping")}</h3>
              <ul className="mops-imp-chips">
                {importPanel.intelligence.marketplaceSummary.map((r) => (
                  <li key={r.marketplace}>
                    <code>{r.marketplace}</code> · SKU {r.skuCount} · {t("mops.cards")} {r.cardCount}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mops-imp__h">{t("mops.entitySnap.missingFields")}</h3>
              <p className="cb-lab__prose mops-imp-miss">
                {t("mops.entitySnap.missingLine", {
                  hero: String(importPanel.missingFieldSummary.hero),
                  seo: String(importPanel.missingFieldSummary.seo),
                  wh: String(importPanel.missingFieldSummary.warehouse),
                })}
              </p>
            </div>
          </div>
          {importCorridorEcon ? (
            <div className="mops-econ glass-panel--hover">
              <h3 className="mops-imp__h">{t("mops.econ.title")}</h3>
              <p className="cb-lab__prose mops-econ__line">{t("mops.econ.safest", { corridor: importCorridorEcon.safestLaunchCorridor ?? "—" })}</p>
              <p className="cb-lab__prose mops-econ__line">{t("mops.econ.leverage", { corridor: importCorridorEcon.highestLeverageCorridor ?? "—" })}</p>
              <p className="cb-lab__prose mops-econ__line">{t("mops.econ.drag", { corridor: importCorridorEcon.highestDragCorridor ?? "—" })}</p>
            </div>
          ) : null}
          <h3 className="mops-imp__h">{t("mops.entitySnap.corridors")}</h3>
          <ul className="mops-imp-corridors">
            {importPanel.corridors.slice(0, 14).map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
          <h3 className="mops-imp__h">{t("mops.entitySnap.launchCandidates")}</h3>
          <ul className="mops-imp-candidates">
            {importPanel.launchCandidates.length === 0 ? (
              <li className="cb-lab__prose">{t("mops.entitySnap.noCards")}</li>
            ) : (
              importPanel.launchCandidates.map((c) => (
                <li key={c.id}>
                  <strong>{c.cardTitle}</strong>
                  <span className="mops-imp-sub">
                    {" "}
                    · <code>{c.skuCode}</code> · {c.marketplace}
                    {c.missingHero || c.missingSeo || c.missingWarehouse ? (
                      <span className="mops-imp-flags">
                        {" "}
                        ({[
                          c.missingHero ? t("mops.entitySnap.flagHero") : null,
                          c.missingSeo ? t("mops.entitySnap.flagSeo") : null,
                          c.missingWarehouse ? t("mops.entitySnap.flagWh") : null,
                        ]
                          .filter(Boolean)
                          .join(", ")})
                      </span>
                    ) : null}
                  </span>
                </li>
              ))
            )}
          </ul>
          <h3 className="mops-imp__h">{t("mops.entitySnap.launchByCorridor")}</h3>
          <ul className="mops-imp-corridors">
            {importPanel.launchByCorridor.length === 0 ? (
              <li className="cb-lab__prose">—</li>
            ) : (
              importPanel.launchByCorridor.map((r) => (
                <li key={r.corridor}>
                  <code>{r.corridor}</code> · {r.count}
                </li>
              ))
            )}
          </ul>
          <h3 className="mops-imp__h">{t("mops.entitySnap.blockedGroups")}</h3>
          <ul className="mops-imp-blocked">
            {importPanel.blockedGroups.length === 0 ? (
              <li className="cb-lab__prose">{t("mops.entitySnap.blockedNone")}</li>
            ) : (
              importPanel.blockedGroups.map((g) => (
                <li key={g.id}>{t(g.labelKey, g.vars)}</li>
              ))
            )}
          </ul>
          <h3 className="mops-imp__h">{t("mops.entitySnap.fboExposure")}</h3>
          <p className="cb-lab__prose mops-imp-sub">
            {t("mops.entitySnap.fboLine", {
              fbo: String(importPanel.intelligence.fboExposureSummary.fboLikeRows),
              fbs: String(importPanel.intelligence.fboExposureSummary.fbsLikeRows),
              amb: String(importPanel.intelligence.fboExposureSummary.ambiguousOrEmpty),
            })}
          </p>
          {importPanel.recommendedAction ? (
            <div className="mops-imp-next">
              <p className="cb-lab__prose">{t(importPanel.recommendedAction.titleKey, importPanel.recommendedAction.vars)}</p>
              <p className="cb-lab__prose mops-imp-sub">{t(importPanel.recommendedAction.reasonKey, importPanel.recommendedAction.vars)}</p>
              <button type="button" className="ghost-btn" onClick={() => onNavigate(importPanel.recommendedAction!.destination)}>
                {t("mops.entitySnap.openRecommended")}
              </button>
            </div>
          ) : null}
          <div className="mops-imp-next">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("dataCleanup")}>
              {t("entitySnap.openDataCleanup")}
            </button>{" "}
            <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
              {t("entitySnap.openAssortmentActions")}
            </button>
          </div>
        </section>
      ) : null}

      {emptyScreen ? (
        <section className="cb-lab__panel glass-panel mops-sec">
          <p className="cb-lab__prose">{t("mops.empty")}</p>
        </section>
      ) : !planEmpty ? (
        <>
          <section className="cb-lab__panel glass-panel mops-sec mops-sec--pulse">
            <h2 className="mops-sec__h">{t("mops.section.pulse")}</h2>
            <div className="mops-pulse">
              <div className="mops-pulse__cell">
                <span className="mops-pulse__n">{snapshot.stats.planCount}</span>
                <span className="mops-pulse__l">{t("mops.stat.plans")}</span>
              </div>
              <div className="mops-pulse__cell">
                <span className="mops-pulse__n">{snapshot.stats.waveCount}</span>
                <span className="mops-pulse__l">{t("mops.stat.waves")}</span>
              </div>
              <div className="mops-pulse__cell">
                <span className="mops-pulse__n">{snapshot.stats.readyWaves}</span>
                <span className="mops-pulse__l">{t("mops.stat.readyWaves")}</span>
              </div>
              <div className="mops-pulse__cell">
                <span className="mops-pulse__n">{snapshot.stats.blockedWaves}</span>
                <span className="mops-pulse__l">{t("mops.stat.blockedWaves")}</span>
              </div>
              <div className="mops-pulse__cell">
                <span className="mops-pulse__n">{snapshot.stats.globalReadyPlans}</span>
                <span className="mops-pulse__l">{t("mops.stat.readyPlans")}</span>
              </div>
            </div>
          </section>

          <section className="cb-lab__panel glass-panel mops-sec">
            <h2 className="mops-sec__h">{t("mops.section.corridors")}</h2>
            <ul className="mops-corridor-list">
              {Object.entries(snapshot.corridorReadiness).map(([corridor, agg]) => (
                <li key={corridor} className="mops-corridor">
                  <p className="mops-corridor__name">
                    <strong>{corridor}</strong>
                  </p>
                  <div className="mops-corridor__bars">
                    {pctBar(t("mops.lane.visual"), agg.visualPct)}
                    {pctBar(t("mops.lane.seo"), agg.seoPct)}
                    {pctBar(t("mops.lane.upload"), agg.uploadPct)}
                    {pctBar(t("mops.lane.production"), agg.productionPct)}
                    {pctBar(t("mops.lane.packaging"), agg.packagingPct)}
                    {pctBar(t("mops.lane.fbo"), agg.fboPct)}
                    {pctBar(t("mops.lane.launch"), agg.launchPct)}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="cb-lab__panel glass-panel mops-sec">
            <h2 className="mops-sec__h">{t("mops.section.global")}</h2>
            <p className="mops-subh">{t("mops.globalBottlenecks")}</p>
            <ul className="mops-tags">
              {snapshot.globalBottlenecks.length === 0 ? <li>{t("mops.none")}</li> : null}
              {snapshot.globalBottlenecks.map((code) => (
                <li key={code}>
                  <span className="mops-tag mops-tag--risk">{t(`mops.bn.${code}`)}</span>
                </li>
              ))}
            </ul>
            <p className="mops-subh">{t("mops.globalCommands")}</p>
            <ul className="mops-tags">
              {snapshot.globalCommandCodes.map((code) => (
                <li key={code}>
                  <span className="mops-tag mops-tag--cmd">{t(`mops.cmd.${code}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="cb-lab__panel glass-panel mops-sec">
            <h2 className="mops-sec__h">{t("mops.section.waves")}</h2>
            <p className="cb-lab__prose cb-lab__prose--tight">{t("mops.filterHint")}</p>
            <div className="mops-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`ghost-btn ghost-btn--sm${filter === f.id ? " mops-filter--on" : ""}`}
                  onClick={() => setFilter(f.id)}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
            <div className="mops-wave-list">
              {filteredWaves.length === 0 ? <p className="cb-lab__prose">{t("mops.noWavesInFilter")}</p> : null}
              {filteredWaves.map((w) => {
                const lines = executiveLines(w);
                return (
                  <article key={w.id} className="mops-wave">
                    <div className="mops-wave__head">
                      <div>
                        <p className="mops-wave__title">
                          {w.corridor} · {t("mops.coll")} <code>{w.collectionId}</code>
                        </p>
                        <p className="mops-wave__meta">
                          {t("mops.marketplace")}: {w.marketplace} · {w.cardPlanIds.length} {t("mops.cards")}
                        </p>
                      </div>
                      <div className="mops-wave__controls">
                        <label className="mops-field">
                          <span>{t("mops.statusLabel")}</span>
                          <select
                            className="mops-select"
                            value={w.launchStatus}
                            onChange={(e) => onPatchWave(w.id, { launchStatus: e.target.value as LaunchWaveStatus })}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {t(`mops.status.${s}`)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="mops-field">
                          <span>{t("mops.priorityLabel")}</span>
                          <select
                            className="mops-select"
                            value={String(w.launchPriority)}
                            onChange={(e) => onPatchWave(w.id, { launchPriority: Number(e.target.value) })}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={String(n)}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    <p className="mops-wave__readiness">{w.readiness}</p>
                    <div className="mops-wave__riskrow">
                      <span>
                        {t("mops.risk.production")}: <strong>{t(`mops.risk.${w.productionRisk}`)}</strong>
                      </span>
                      <span>
                        {t("mops.risk.packaging")}: <strong>{t(`mops.risk.${w.packagingRisk}`)}</strong>
                      </span>
                      <span>
                        {t("mops.risk.fulfillment")}: <strong>{t(`mops.risk.${w.fulfillmentRisk}`)}</strong>
                      </span>
                      <span>
                        {t("mops.pressure")}: <strong>{w.operationalPressure}</strong>
                      </span>
                    </div>
                    <div className="mops-exec">
                      <p className="mops-exec__label">{t("mops.executiveBrief")}</p>
                      <ol className="mops-exec__list">
                        <li>
                          <span className="mops-exec__k">{t("mops.dim.leverage")}</span> {lines[0] ?? "—"}
                        </li>
                        <li>
                          <span className="mops-exec__k">{t("mops.dim.urgency")}</span> {lines[1] ?? "—"}
                        </li>
                        <li>
                          <span className="mops-exec__k">{t("mops.dim.risk")}</span> {lines[2] ?? "—"}
                        </li>
                        <li>
                          <span className="mops-exec__k">{t("mops.dim.impact")}</span> {lines[3] ?? "—"}
                        </li>
                        <li>
                          <span className="mops-exec__k">{t("mops.dim.path")}</span> {lines[4] ?? "—"}
                        </li>
                      </ol>
                    </div>
                    <p className="mops-subh">{t("mops.waveBottlenecks")}</p>
                    <ul className="mops-tags">
                      {w.bottlenecks.length === 0 ? <li>{t("mops.none")}</li> : null}
                      {w.bottlenecks.map((code) => (
                        <li key={code}>
                          <span className="mops-tag mops-tag--risk">{t(`mops.bn.${code}`)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mops-subh">{t("mops.waveCommands")}</p>
                    <ul className="mops-tags">
                      {w.commandCodes.map((code) => (
                        <li key={code}>
                          <span className="mops-tag mops-tag--cmd">{t(`mops.cmd.${code}`)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mops-subh">{t("mops.planIds")}</p>
                    <p className="mops-ids">
                      {w.cardPlanIds.map((id) => (
                        <code key={id}>{id}</code>
                      ))}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
      <style>{`
        .mops-sec--import { border-color: rgba(160, 200, 255, 0.2); }
        .mops-imp-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(200, 160, 255, 0.4); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(230, 210, 255, 0.95); }
        .mops-imp-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-top: 12px; }
        .mops-econ { margin-top: 12px; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(120, 180, 255, 0.15); background: rgba(0, 0, 0, 0.14); }
        .mops-econ__line { margin: 4px 0 0; font-size: 0.78rem; line-height: 1.45; }
        .mops-imp__h { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin: 12px 0 8px; }
        .mops-imp-chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.78rem; }
        .mops-imp-chips li { padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); }
        .mops-imp-miss { font-size: 0.78rem; margin: 0; color: rgba(255, 200, 160, 0.9); }
        .mops-imp-corridors { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.76rem; }
        .mops-imp-corridors li { padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); }
        .mops-imp-candidates { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem; }
        .mops-imp-sub { color: var(--muted); font-size: 0.76rem; }
        .mops-imp-flags { color: rgba(255, 200, 160, 0.85); font-size: 0.72rem; }
        .mops-imp-blocked { list-style: none; padding: 0; margin: 0; font-size: 0.78rem; display: flex; flex-direction: column; gap: 6px; color: rgba(255, 200, 180, 0.92); }
        .mops-imp-next { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .mops-sec__h { font-size: 0.85rem; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 12px; color: var(--muted); }
        .mops-sec--pulse { border-color: rgba(123, 143, 255, 0.22); }
        .mops-pulse { display: flex; flex-wrap: wrap; gap: 14px 24px; }
        .mops-pulse__cell { min-width: 72px; }
        .mops-pulse__n { display: block; font-size: 1.35rem; font-weight: 700; font-family: var(--font-display); }
        .mops-pulse__l { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .mops-corridor-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
        .mops-corridor__bars { display: grid; gap: 8px; margin-top: 8px; }
        .mops-bar__head { display: flex; justify-content: space-between; font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .mops-bar__track { height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .mops-bar__fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, rgba(123,143,255,0.5), rgba(160, 220, 255, 0.85)); }
        .mops-subh { font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 14px 0 8px; }
        .mops-tags { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .mops-tag { display: inline-block; padding: 6px 10px; border-radius: 8px; font-size: 0.72rem; letter-spacing: 0.04em; border: 1px solid rgba(255,255,255,0.12); }
        .mops-tag--risk { border-color: rgba(255, 160, 120, 0.35); color: rgba(255, 210, 190, 0.95); }
        .mops-tag--cmd { border-color: rgba(120, 200, 255, 0.35); color: rgba(200, 235, 255, 0.95); }
        .mops-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 16px; }
        .mops-filter--on { box-shadow: inset 0 0 0 1px rgba(123, 143, 255, 0.55); }
        .mops-wave-list { display: flex; flex-direction: column; gap: 18px; }
        .mops-wave { padding: 16px; border-radius: 12px; background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.06); }
        .mops-wave__head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .mops-wave__title { margin: 0; font-size: 1rem; }
        .mops-wave__meta { margin: 6px 0 0; font-size: 0.78rem; color: var(--muted); }
        .mops-wave__controls { display: flex; flex-wrap: wrap; gap: 12px; }
        .mops-field { display: flex; flex-direction: column; gap: 4px; font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .mops-select { background: rgba(0,0,0,0.35); color: var(--text); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 10px; font-size: 0.85rem; }
        .mops-wave__readiness { font-size: 0.8rem; color: var(--muted); margin: 10px 0 0; }
        .mops-wave__riskrow { display: flex; flex-wrap: wrap; gap: 12px 18px; margin-top: 10px; font-size: 0.78rem; color: var(--muted); }
        .mops-exec { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .mops-exec__label { font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
        .mops-exec__list { margin: 0; padding-left: 18px; color: rgba(255,255,255,0.88); font-size: 0.88rem; line-height: 1.45; }
        .mops-exec__k { color: var(--muted); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; margin-right: 6px; }
        .mops-ids { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.72rem; }
      `}</style>
    </div>
  );
}
