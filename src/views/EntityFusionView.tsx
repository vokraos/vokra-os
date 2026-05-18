import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import {
  buildFusionPreviewEntityFromSession,
  buildMergeIntents,
  strategicEntityKindLabelKey,
  type FusionPreviewEntity,
} from "../lib/entity-fusion";
import { loadManualImportForFusion } from "../lib/import-core/manualImportSession";
import {
  ENTITY_SNAPSHOT_EVENT,
  activateEntitySnapshotFromImport,
  buildEntitySnapshotMemorySummary,
  clearActiveEntitySnapshot,
  deriveSnapshotIntelligence,
  getActiveEntitySnapshot,
  saveActiveEntitySnapshot,
} from "../lib/entity-snapshot";

type Props = { onNavigate: (id: NavId) => void };

function pctBar(label: string, pct: number): ReactNode {
  return (
    <div className="ef-bar">
      <div className="ef-bar__head">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="ef-bar__track">
        <div className="ef-bar__fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

function impactCell(label: string, value: number): ReactNode {
  return (
    <div className="ef-impact__cell">
      <span className="ef-impact__n">{value}</span>
      <span className="ef-impact__l">{label}</span>
    </div>
  );
}

export function EntityFusionView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [toast, setToast] = useState<string | null>(null);
  const [snapTick, setSnapTick] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    const onSnap = () => setSnapTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, onSnap);
    return () => window.removeEventListener(ENTITY_SNAPSHOT_EVENT, onSnap);
  }, []);

  const preview = useMemo<FusionPreviewEntity>(() => buildFusionPreviewEntityFromSession(), [snapTick]);
  const mergeIntents = useMemo(() => buildMergeIntents(preview.importedRowsSample, preview.matchedEntities), [preview]);
  const manualImport = useMemo(() => loadManualImportForFusion(), [snapTick]);
  const activeSnapshot = useMemo(() => getActiveEntitySnapshot(), [snapTick]);

  const canActivateSnapshot = Boolean(manualImport && manualImport.normalizedRows.length > 0);

  const activateSnapshot = useCallback(() => {
    if (!manualImport || manualImport.normalizedRows.length === 0) return;
    const snap = activateEntitySnapshotFromImport({
      normalizedRows: manualImport.normalizedRows,
      importType: manualImport.importType,
      sourceImportId: `manual:${manualImport.storedAt}`,
    });
    saveActiveEntitySnapshot(snap);
    const intel = deriveSnapshotIntelligence(snap);
    const memSummary = buildEntitySnapshotMemorySummary(snap, intel);
    recordGeneration({
      module: "entity_snapshot",
      title: t("entitySnap.memoryTitle", { id: snap.id.slice(-8) }),
      content: JSON.stringify(snap),
      mime: "application/json",
      tags: ["entity_snapshot", "import", snap.importType],
      meta: {
        snapshotId: snap.id,
        sourceImportId: snap.sourceImportId,
        skuCount: String(memSummary.skuCount),
        cardCount: String(memSummary.cardCount),
        corridors: memSummary.corridors.slice(0, 12).join(","),
        intelTopCorridors: (memSummary.intelTopCorridors ?? []).join("|"),
        intelTopActionKey: memSummary.intelTopActionKey ?? "",
        intelMissingDataSlots: String(memSummary.intelMissingDataSlots ?? 0),
        intelNextStepKey: memSummary.intelNextStepKey ?? "",
      },
    });
    showToast(t("entitySnap.toastActivated"));
  }, [manualImport, showToast, t]);

  const resetSnapshot = useCallback(() => {
    clearActiveEntitySnapshot();
    showToast(t("entitySnap.toastCleared"));
  }, [showToast, t]);

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "entity_fusion",
      title: t("fusion.memoryTitle", { ts: String(preview.derivedAt) }),
      content: JSON.stringify(preview),
      mime: "application/json",
      tags: ["entity_fusion", "fusion", "architecture"],
      meta: {
        readiness: String(preview.fusionReadiness),
        conflicts: String(preview.conflictCount),
        imported: String(preview.importedRows),
      },
    });
    showToast(t("fusion.toastSavedMemory"));
  }, [preview, showToast, t]);

  return (
    <div className="cb-lab ef-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("fusion.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.entityFusion")}</h1>
        <p className="cb-lab__lede">{t("fusion.lede")}</p>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("fusion.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dataImport")}>
            {t("fusion.openDataImport")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("ingestionReadiness")}>
            {t("fusion.openIngestion")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("fusion.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("fusion.openMops")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("fusion.openMemory")}
          </button>
        </div>
      </header>

      <section className="cb-lab__panel glass-panel ef-sec ef-sec--snap">
        <h2 className="ef-sec__h">{t("fusion.section.entitySnapshot")}</h2>
        {activeSnapshot ? (
          <>
            <p className="cb-lab__prose cb-lab__prose--tight">
              {t("entitySnap.fusion.activeLine", {
                sku: String(activeSnapshot.skuEntities.length),
                cards: String(activeSnapshot.cardEntities.length),
                rows: String(activeSnapshot.rowCountIncluded),
                ts: new Date(activeSnapshot.updatedAt).toLocaleString(),
              })}
            </p>
            {activeSnapshot.warnings.length > 0 ? (
              <ul className="ef-warn">
                {activeSnapshot.warnings.map((w) => (
                  <li key={w.id}>
                    {t(w.labelKey)}
                    {w.detail ? <span className="ef-muted"> · {w.detail}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cb-lab__prose ef-muted">{t("entitySnap.fusion.noWarnings")}</p>
            )}
          </>
        ) : (
          <p className="cb-lab__prose">{t("entitySnap.fusion.none")}</p>
        )}
        <div className="ef-snap-actions">
          <button type="button" className="ghost-btn" disabled={!canActivateSnapshot} onClick={activateSnapshot}>
            {t("entitySnap.activate")}
          </button>
          <button type="button" className="ghost-btn" disabled={!activeSnapshot} onClick={resetSnapshot}>
            {t("entitySnap.clear")}
          </button>
        </div>
        {canActivateSnapshot ? (
          <p className="cb-lab__prose ef-muted">
            {t("entitySnap.fusion.manualRowsHint", { n: String(manualImport?.normalizedRows.length ?? 0) })}
          </p>
        ) : (
          <p className="cb-lab__prose ef-muted">{t("entitySnap.fusion.noManualRows")}</p>
        )}
        {activeSnapshot ? (
          <p className="cb-lab__prose ef-muted">
            {t("entitySnap.postActivateLinks")}
            <button type="button" className="ghost-btn ef-inline-btn" onClick={() => onNavigate("skuIntelligence")}>
              {t("fusion.openSkuIntel")}
            </button>
            <button type="button" className="ghost-btn ef-inline-btn" onClick={() => onNavigate("marketplaceOperations")}>
              {t("fusion.openMops")}
            </button>
            <button type="button" className="ghost-btn ef-inline-btn" onClick={() => onNavigate("dataCleanup")}>
              {t("entitySnap.openDataCleanup")}
            </button>
          </p>
        ) : null}
      </section>

      <section className="cb-lab__panel glass-panel ef-sec ef-sec--pulse">
        <h2 className="ef-sec__h">{t("fusion.section.readiness")}</h2>
        {pctBar(t("fusion.readinessLabel"), preview.fusionReadiness)}
        <p className="cb-lab__prose ef-meta">
          {t("fusion.avgConfidence", { v: String(preview.confidenceAverage) })}
        </p>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.strategicImpact")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("fusion.strategicImpactHint")}</p>
        <div className="ef-impact">
          {impactCell(t("fusion.impact.skus"), preview.strategicImpact.skusUpdated)}
          {impactCell(t("fusion.impact.corridors"), preview.strategicImpact.heroCorridorsAffected)}
          {impactCell(t("fusion.impact.waves"), preview.strategicImpact.launchWavesImpacted)}
          {impactCell(t("fusion.impact.visuals"), preview.strategicImpact.visualAssetsLinked)}
          {impactCell(t("fusion.impact.conflicts"), preview.strategicImpact.unresolvedConflicts)}
        </div>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.imported")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("fusion.importedHint", { n: String(preview.importedRows) })}</p>
        <ul className="ef-src">
          {preview.importedRowsSample.map((r) => (
            <li key={r.rowKey}>
              <code>{r.rowKey}</code> · {r.source} · <strong>{r.articleOrOffer}</strong>
              {r.corridorHint ? <span className="ef-muted"> · {r.corridorHint}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.matched")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("fusion.matchedHint")}</p>
        <div className="ef-table-wrap">
          <table className="ef-table">
            <thead>
              <tr>
                <th>{t("fusion.th.entity")}</th>
                <th>{t("fusion.th.kind")}</th>
                <th>{t("fusion.th.confidence")}</th>
                <th>{t("fusion.th.score")}</th>
              </tr>
            </thead>
            <tbody>
              {preview.matchedEntities.map((m) => (
                <tr key={`${m.kind}-${m.id}`}>
                  <td>
                    <code>{m.id}</code>
                    <p className="ef-sub">{m.label}</p>
                  </td>
                  <td>{t(strategicEntityKindLabelKey(m.kind))}</td>
                  <td>
                    <span className={`ef-lvl ef-lvl--${m.confidence}`}>{t(`fusion.level.${m.confidence}`)}</span>
                  </td>
                  <td>{m.score01.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.unresolved")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("fusion.unresolvedHint", { n: String(preview.unresolvedRows) })}</p>
        {preview.unresolvedSamples.length === 0 ? (
          <p className="cb-lab__prose">{t("fusion.unresolvedNone")}</p>
        ) : (
          <ul className="ef-src">
            {preview.unresolvedSamples.map((r) => (
              <li key={`u-${r.rowKey}`}>
                <code>{r.rowKey}</code> · {r.articleOrOffer}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.confidence")}</h2>
        <p className="cb-lab__prose">{t("fusion.confidenceBody", { v: String(preview.confidenceAverage) })}</p>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.conflicts")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("fusion.conflictsHint", { n: String(preview.conflictCount) })}</p>
        <ul className="ef-conf">
          {preview.conflicts.map((c) => (
            <li key={c.id}>
              <span className={`ef-sev ef-sev--${c.severity}`}>{c.severity}</span> {t(c.labelKey)}
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.corridors")}</h2>
        {preview.affectedCorridors.length === 0 ? (
          <p className="cb-lab__prose">{t("fusion.emptyCorridors")}</p>
        ) : (
          <ul className="ef-chip">
            {preview.affectedCorridors.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.waves")}</h2>
        {preview.affectedWaves.length === 0 ? (
          <p className="cb-lab__prose">{t("fusion.emptyWaves")}</p>
        ) : (
          <ul className="ef-src">
            {preview.affectedWaves.map((w) => (
              <li key={w.id}>
                <code>{w.id}</code> · {w.corridor}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.skus")}</h2>
        {preview.affectedSkus.length === 0 ? (
          <p className="cb-lab__prose">{t("fusion.emptySkus")}</p>
        ) : (
          <ul className="ef-chip">
            {preview.affectedSkus.map((s) => (
              <li key={s}>
                <code>{s}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel ef-sec">
        <h2 className="ef-sec__h">{t("fusion.section.systems")}</h2>
        <ul className="ef-sys">
          {preview.affectedSystems.map((s) => (
            <li key={s.id}>
              <strong>{t(s.labelKey)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ef-sec ef-sec--foot">
        <h2 className="ef-sec__h">{t("fusion.section.mergeQueue")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("fusion.mergeQueueHint")}</p>
        <ol className="ef-merge">
          {mergeIntents.map((mi) => (
            <li key={mi.id}>
              {t(mi.labelKey)} · <code>{mi.sourceRowKey}</code> → <code>{mi.targetEntityId}</code> ·{" "}
              {t(`fusion.level.${mi.proposedConfidence}`)}
            </li>
          ))}
        </ol>
      </section>

      <style>{`
        .ef-lab .ef-sec { margin-bottom: 16px; }
        .ef-sec__h { font-size: 0.82rem; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 12px; color: var(--muted); }
        .ef-sec--pulse { border-color: rgba(160, 190, 255, 0.22); max-width: 520px; }
        .ef-sec--foot { border-color: rgba(200, 210, 240, 0.15); }
        .ef-bar__head { display: flex; justify-content: space-between; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .ef-bar__track { height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .ef-bar__fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, rgba(110, 150, 255, 0.5), rgba(210, 225, 255, 0.95)); }
        .ef-meta { margin-top: 10px; font-size: 0.78rem; color: var(--muted); }
        .ef-impact { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 12px; }
        .ef-impact__cell { padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); background: rgba(0,0,0,0.2); text-align: center; }
        .ef-impact__n { display: block; font-size: 1.35rem; font-variant-numeric: tabular-nums; font-weight: 600; }
        .ef-impact__l { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .ef-src, .ef-conf, .ef-chip, .ef-sys, .ef-merge { list-style: none; padding: 0; margin: 0; }
        .ef-src li { padding: 6px 0; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ef-muted { color: var(--muted); font-size: 0.78rem; }
        .ef-table-wrap { overflow-x: auto; margin-top: 10px; }
        .ef-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
        .ef-table th, .ef-table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; vertical-align: top; }
        .ef-table th { color: var(--muted); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .ef-sub { margin: 4px 0 0; font-size: 0.7rem; color: var(--muted); }
        .ef-lvl { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; }
        .ef-lvl--exact { color: rgba(160, 255, 200, 0.95); }
        .ef-lvl--high { color: rgba(180, 230, 255, 0.95); }
        .ef-lvl--medium { color: rgba(230, 220, 160, 0.95); }
        .ef-lvl--weak { color: rgba(255, 200, 160, 0.9); }
        .ef-lvl--unresolved { color: rgba(255, 160, 160, 0.85); }
        .ef-conf li { padding: 8px 0; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ef-sev { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; margin-right: 8px; opacity: 0.85; }
        .ef-sev--high { color: rgba(255, 170, 170, 0.95); }
        .ef-sev--mid { color: rgba(255, 220, 160, 0.95); }
        .ef-sev--low { color: var(--muted); }
        .ef-chip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .ef-chip li { padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-size: 0.75rem; }
        .ef-sys li { padding: 8px 0; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ef-merge { margin-top: 10px; padding-left: 18px; list-style: decimal; }
        .ef-merge li { margin-bottom: 8px; font-size: 0.78rem; color: rgba(210, 218, 235, 0.92); }
        .ef-sec--snap { border-color: rgba(140, 200, 255, 0.2); max-width: 640px; }
        .ef-snap-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
        .ef-warn { list-style: none; padding: 0; margin: 8px 0 0; font-size: 0.78rem; color: rgba(255, 210, 170, 0.95); }
        .ef-warn li { padding: 4px 0; }
        .ef-inline-btn { margin-left: 8px; display: inline-flex; vertical-align: middle; }
      `}</style>
    </div>
  );
}
