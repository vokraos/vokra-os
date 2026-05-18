import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import {
  ENTITY_SNAPSHOT_EVENT,
  applyEntityCleanup,
  buildEntitySnapshotMemorySummary,
  buildEntityCleanupPlan,
  deriveSnapshotIntelligence,
  getActiveEntitySnapshot,
  saveActiveEntitySnapshot,
} from "../lib/entity-snapshot";
import type { CleanupBatchAction } from "../lib/entity-snapshot";
import { DATA_CLEANUP_MEMORY_SCHEMA } from "../lib/entity-snapshot/cleanup/types";

type Props = { onNavigate: (id: NavId) => void };

function defaultSelected(actions: CleanupBatchAction[]): Set<string> {
  const s = new Set<string>();
  for (const a of actions) {
    if (a.kind === "ignore_defer") continue;
    if (a.confidence === "low" && (a.kind === "mark_refresh_candidate" || a.kind === "assign_marketplace")) continue;
    s.add(a.id);
  }
  if (s.size === 0) {
    for (const a of actions) {
      if (a.kind !== "ignore_defer") s.add(a.id);
    }
  }
  return s;
}

export function DataCleanupView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, fn);
    return () => window.removeEventListener(ENTITY_SNAPSHOT_EVENT, fn);
  }, []);

  const snapshot = useMemo(() => getActiveEntitySnapshot(), [tick]);
  const plan = useMemo(() => (snapshot ? buildEntityCleanupPlan(snapshot) : null), [snapshot]);

  useEffect(() => {
    if (!plan) {
      setSelected(new Set());
      return;
    }
    setSelected(defaultSelected(plan.batchActions));
  }, [plan?.id]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const apply = () => {
    if (!snapshot || !plan) return;
    const ids = [...selected].filter((id) => plan.batchActions.some((a) => a.id === id && a.kind !== "ignore_defer"));
    if (ids.length === 0) {
      showToast(t("dataCleanup.toastNone"));
      return;
    }
    const { next, applied, readinessAfter } = applyEntityCleanup({
      snapshot,
      plan,
      selectedActionIds: ids,
    });
    saveActiveEntitySnapshot(next);
    const intel = deriveSnapshotIntelligence(next);
    const summary = buildEntitySnapshotMemorySummary(next, intel);
    const payload = {
      schema: DATA_CLEANUP_MEMORY_SCHEMA,
      plan,
      appliedActionIds: applied.map((a) => a.id),
      enrichedSnapshot: next,
      readinessAfter,
    };
    recordGeneration({
      module: "data_cleanup",
      title: t("dataCleanup.memoryTitle", { id: next.id.slice(-8) }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["data_cleanup", "entity_snapshot", plan.sourceSnapshotId],
      meta: {
        planId: plan.id,
        sourceSnapshotId: snapshot.id,
        appliedCount: String(applied.length),
        readinessBefore: String(plan.readinessBefore),
        readinessAfter: String(readinessAfter),
        skuCount: String(summary.skuCount),
        cardCount: String(summary.cardCount),
        intelMissingDataSlots: String(intel.missingFieldSummary.totalSlots),
      },
    });
    showToast(t("dataCleanup.toastApplied"));
  };

  if (!snapshot || !plan) {
    return (
      <div className="cb-lab dc-lab">
        <header className="cb-lab__head">
          <p className="cb-lab__eyebrow">{t("dataCleanup.eyebrow")}</p>
          <h1 className="cb-lab__title">{t("nav.dataCleanup")}</h1>
          <p className="cb-lab__lede">{t("dataCleanup.emptyLede")}</p>
          <div className="cb-lab__actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("dataImport")}>
              {t("fusion.openDataImport")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("entityFusion")}>
              {t("nav.entityFusion")}
            </button>
          </div>
        </header>
        <style>{`
          .dc-lab { max-width: 920px; margin: 0 auto; padding: 24px 20px 48px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cb-lab dc-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("dataCleanup.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.dataCleanup")}</h1>
        <p className="cb-lab__lede">{t("dataCleanup.lede")}</p>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("fusion.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("fusion.openMops")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("entityFusion")}>
            {t("nav.entityFusion")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("entitySnap.openAssortmentActions")}
          </button>
        </div>
      </header>

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.summary")}</h2>
        <ul className="dc-sum">
          <li>
            {t("dataCleanup.sum.snapshot")}: <code>{plan.sourceSnapshotId.slice(-12)}</code>
          </li>
          <li>{t("dataCleanup.sum.skus", { n: String(snapshot.skuEntities.length) })}</li>
          <li>{t("dataCleanup.sum.cards", { n: String(snapshot.cardEntities.length) })}</li>
          <li>{t("dataCleanup.sum.affectedSku", { n: String(plan.affectedSkuCount) })}</li>
          <li>{t("dataCleanup.sum.affectedCard", { n: String(plan.affectedCardCount) })}</li>
          {snapshot.previousSnapshotId ? (
            <li>
              {t("dataCleanup.sum.chain")}: <code>{snapshot.previousSnapshotId.slice(-12)}</code>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.readiness")}</h2>
        <div className="dc-ready">
          <div>
            <span className="dc-ready__label">{t("dataCleanup.readiness.before")}</span>
            <span className="dc-ready__n">{plan.readinessBefore}</span>
          </div>
          <div>
            <span className="dc-ready__label">{t("dataCleanup.readiness.afterEst")}</span>
            <span className="dc-ready__n dc-ready__n--est">{plan.readinessAfterEstimate}</span>
          </div>
        </div>
      </section>

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.missing")}</h2>
        {plan.missingFieldGroups.length === 0 ? (
          <p className="cb-lab__prose dc-muted">{t("dataCleanup.missingNone")}</p>
        ) : (
          <ul className="dc-list">
            {plan.missingFieldGroups.map((g) => (
              <li key={g.id}>
                <strong>{t(g.labelKey)}</strong> · SKU {g.affectedSkuCount} · {t("mops.cards")} {g.affectedCardCount}
                {g.sampleCodes.length > 0 ? (
                  <span className="dc-muted">
                    {" "}
                    · <code>{g.sampleCodes.join(", ")}</code>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.corridors")}</h2>
        {plan.suggestedCorridors.length === 0 ? (
          <p className="cb-lab__prose dc-muted">{t("dataCleanup.sgNone")}</p>
        ) : (
          <ul className="dc-sg">
            {plan.suggestedCorridors.map((g) => (
              <li key={g.id}>
                <code>{g.proposedValue}</code> · {g.confidence} · {g.skuCodes.length} SKU
                <p className="dc-muted">{t(g.reasonKey)}</p>
                {g.previewTitles.length > 0 ? <p className="dc-prev">{g.previewTitles.join(" · ")}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.seo")}</h2>
        {plan.suggestedSeoClusters.length === 0 ? (
          <p className="cb-lab__prose dc-muted">{t("dataCleanup.seoNone")}</p>
        ) : (
          <ul className="dc-sg">
            {plan.suggestedSeoClusters.map((g) => (
              <li key={g.id}>
                <code>{g.proposedValue}</code> · {g.confidence}
                <p className="dc-muted">{t(g.reasonKey)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {plan.suggestedProductFamilies.length > 0 ? (
        <section className="glass-panel dc-sec">
          <h2 className="dc-sec__h">{t("dataCleanup.section.families")}</h2>
          <ul className="dc-sg">
            {plan.suggestedProductFamilies.map((g) => (
              <li key={g.id}>
                <code>{g.proposedValue}</code> · {g.confidence}
                <p className="dc-muted">{t(g.reasonKey)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.batch")}</h2>
        <p className="cb-lab__prose dc-muted">{t("dataCleanup.batchHint")}</p>
        <ul className="dc-actions">
          {plan.batchActions.map((a) => (
            <li key={a.id} className={`dc-act dc-act--${a.confidence}`}>
              <label className="dc-act__lab">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  disabled={a.kind === "ignore_defer"}
                  onChange={() => toggle(a.id)}
                />
                <span>
                  <strong>{t(a.titleKey, a.vars ?? {})}</strong>
                  <span className="dc-act__meta">
                    {" "}
                    · {a.confidence} · {a.affectedCount ? t("dataCleanup.rowCount", { n: String(a.affectedCount) }) : "—"}
                  </span>
                </span>
              </label>
              <p className="dc-muted">{t(a.reasonKey, a.vars ?? {})}</p>
              {a.previewExamples.length > 0 ? <p className="dc-prev">{a.previewExamples.slice(0, 4).join(" · ")}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel dc-sec">
        <h2 className="dc-sec__h">{t("dataCleanup.section.warnings")}</h2>
        {plan.warnings.length === 0 ? (
          <p className="cb-lab__prose dc-muted">{t("dataCleanup.warnNone")}</p>
        ) : (
          <ul className="dc-warn">
            {plan.warnings.map((w) => (
              <li key={w.id}>
                {t(w.labelKey)}
                {w.detail ? <span className="dc-muted"> · {w.detail}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-panel dc-sec dc-sec--apply">
        <h2 className="dc-sec__h">{t("dataCleanup.section.apply")}</h2>
        <p className="cb-lab__prose">{t("dataCleanup.applySafe")}</p>
        <button type="button" className="ghost-btn dc-apply-btn" onClick={apply}>
          {t("dataCleanup.applyBtn")}
        </button>
      </section>

      <style>{`
        .dc-lab { max-width: 920px; margin: 0 auto; padding: 24px 20px 48px; }
        .dc-sec { margin-top: 16px; padding: 18px 20px; }
        .dc-sec__h { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 0 0 12px; }
        .dc-sum { margin: 0; padding-left: 18px; font-size: 0.82rem; line-height: 1.6; }
        .dc-ready { display: flex; gap: 28px; flex-wrap: wrap; }
        .dc-ready__label { display: block; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
        .dc-ready__n { font-size: 1.6rem; font-weight: 700; font-family: var(--font-display); }
        .dc-ready__n--est { color: rgba(160, 220, 200, 0.95); }
        .dc-list, .dc-sg, .dc-warn { margin: 0; padding-left: 18px; font-size: 0.82rem; line-height: 1.55; }
        .dc-sg li { margin-bottom: 10px; }
        .dc-muted { color: var(--muted); font-size: 0.78rem; }
        .dc-prev { margin: 4px 0 0; font-size: 0.74rem; color: rgba(220, 210, 255, 0.85); }
        .dc-actions { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 12px; }
        .dc-act { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); }
        .dc-act--low { border-left: 3px solid rgba(255,200,160,0.5); }
        .dc-act--medium { border-left: 3px solid rgba(200,210,255,0.55); }
        .dc-act--high { border-left: 3px solid rgba(160,240,200,0.55); }
        .dc-act__lab { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; font-size: 0.82rem; }
        .dc-act__meta { font-size: 0.72rem; color: var(--muted); }
        .dc-apply-btn { margin-top: 12px; }
        .dc-sec--apply { border-color: rgba(123, 143, 255, 0.25); }
      `}</style>
    </div>
  );
}
