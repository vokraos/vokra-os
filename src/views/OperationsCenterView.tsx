import { useCallback, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { getActiveProjectId, useMemorySnapshot } from "../lib/memory";
import {
  buildOperationsCenterSnapshot,
  loadManualBrief,
  saveManualBrief,
  operationsCenterToMarkdown,
  operationsCenterToJson,
  type DataProvenance,
  type ManualOperationalBrief,
} from "../lib/operations-center";
import { OpsProvenanceBadge } from "../components/operations/OpsProvenanceBadge";
import { OpsSurfaceCard } from "../components/operations/OpsSurfaceCard";

type Props = { onNavigate: (id: NavId) => void };

function provLabel(t: (k: string) => string, p: DataProvenance) {
  return t(`operations.provenance.${p}`);
}

export function OperationsCenterView({ onNavigate }: Props) {
  const { t } = useI18n();
  const memSnap = useMemorySnapshot();
  const projectId = getActiveProjectId();
  const [manual, setManual] = useState<ManualOperationalBrief>(() => loadManualBrief());
  const [toast, setToast] = useState<string | null>(null);

  const snapshot = useMemo(
    () =>
      buildOperationsCenterSnapshot({
        memorySnapshot: memSnap,
        activeProjectId: projectId,
        manualOverride: manual,
      }),
    [memSnap, projectId, manual],
  );

  const saveBrief = useCallback(() => {
    const next = saveManualBrief({
      prioritySkus: manual.prioritySkus,
      runwayNotes: manual.runwayNotes,
      productionBottleneckNote: manual.productionBottleneckNote,
      productionPressureManual: manual.productionPressureManual,
      categoryOverloadManual: manual.categoryOverloadManual,
      adLoadManual: manual.adLoadManual,
    });
    setManual(next);
    setToast(t("operations.savedBrief"));
    window.setTimeout(() => setToast(null), 2200);
  }, [manual, t]);

  const onExportMd = useCallback(() => {
    const md = operationsCenterToMarkdown(snapshot, t("operations.exportTitle"));
    downloadText(`vokra-operations-center-${snapshot.computedAt}.md`, md);
  }, [snapshot, t]);

  const onExportJson = useCallback(() => {
    downloadJson(`vokra-operations-center-${snapshot.computedAt}.json`, snapshot);
  }, [snapshot]);

  const onCopyJson = useCallback(async () => {
    await copyToClipboard(operationsCenterToJson(snapshot));
    setToast(t("common.copied"));
    window.setTimeout(() => setToast(null), 1800);
  }, [snapshot, t]);

  const interp = (key: string, params?: Record<string, string | number>) => {
    if (!params) return t(key);
    const s: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) s[k] = String(v);
    return t(key, s);
  };

  return (
    <div className="view ops ops--cinema">
      <div className="ops__ambient" aria-hidden />
      <header className="view__header ops__head">
        <p className="eyebrow ops__eyebrow">{t("operations.eyebrow")}</p>
        <h2 className="view__title ops__title">{t("operations.title")}</h2>
        <p className="view__desc ops__sub">{t("operations.subtitle")}</p>
        <p className="ops__disclaimer">{t("operations.disclaimer")}</p>
        <div className="ops__toolbar">
          <button type="button" className="ghost-btn" onClick={saveBrief}>
            {t("operations.saveBrief")}
          </button>
          <button type="button" className="ghost-btn" onClick={onExportMd}>
            {t("common.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={onExportJson}>
            {t("operations.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void onCopyJson()}>
            {t("operations.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("operations")}>
            {t("operations.backOrchestration")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("nav.memory")}
          </button>
        </div>
      </header>

      {toast && <p className="ops__toast">{toast}</p>}

      <div className="ops__grid">
        <OpsSurfaceCard
          title={t("operations.panel.score")}
          subtitle={t("operations.panel.scoreSub")}
          meta={
            <OpsProvenanceBadge
              provenance={snapshot.operationalScore.total.provenance}
              label={provLabel(t, snapshot.operationalScore.total.provenance)}
            />
          }
        >
          <p className="ops__hero-metric">{snapshot.operationalScore.total.value}</p>
          <ul className="ops__breakdown">
            <li>
              <span>{t("operations.score.memory")}</span>
              <strong>{snapshot.operationalScore.memoryCoverage.value}</strong>
              <OpsProvenanceBadge
                provenance={snapshot.operationalScore.memoryCoverage.provenance}
                label={provLabel(t, snapshot.operationalScore.memoryCoverage.provenance)}
              />
            </li>
            <li>
              <span>{t("operations.score.sku")}</span>
              <strong>{snapshot.operationalScore.skuDiscipline.value}</strong>
              <OpsProvenanceBadge
                provenance={snapshot.operationalScore.skuDiscipline.provenance}
                label={provLabel(t, snapshot.operationalScore.skuDiscipline.provenance)}
              />
            </li>
            <li>
              <span>{t("operations.score.velocity")}</span>
              <strong>{snapshot.operationalScore.contentVelocity.value}</strong>
              <OpsProvenanceBadge
                provenance={snapshot.operationalScore.contentVelocity.provenance}
                label={provLabel(t, snapshot.operationalScore.contentVelocity.provenance)}
              />
            </li>
            <li>
              <span>{t("operations.score.manual")}</span>
              <strong>{snapshot.operationalScore.manualAlignment.value}</strong>
              <OpsProvenanceBadge
                provenance={snapshot.operationalScore.manualAlignment.provenance}
                label={provLabel(t, snapshot.operationalScore.manualAlignment.provenance)}
              />
            </li>
          </ul>
        </OpsSurfaceCard>

        <OpsSurfaceCard
          title={t("operations.panel.health")}
          subtitle={t("operations.panel.healthSub")}
          meta={
            <OpsProvenanceBadge
              provenance={snapshot.marketplaceHealth.index.provenance}
              label={provLabel(t, snapshot.marketplaceHealth.index.provenance)}
            />
          }
        >
          <p className="ops__hero-metric ops__hero-metric--sm">{snapshot.marketplaceHealth.index.value}</p>
          <p className="ops__muted">{t(snapshot.marketplaceHealth.ctrCrBandKey)}</p>
          <p className="ops__muted">{t(snapshot.marketplaceHealth.stockDisciplineKey)}</p>
          <p className="ops__muted">{t(snapshot.marketplaceHealth.adEfficiencyKey)}</p>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--span2" title={t("operations.panel.radar")} subtitle={t("operations.panel.radarSub")}>
          <div className="ops__radar">
            {snapshot.kpiRadar.map((axis) => (
              <div key={axis.id} className="ops__radar-cell">
                <div className="ops__radar-top">
                  <span>{t(axis.labelKey)}</span>
                  <OpsProvenanceBadge provenance={axis.score.provenance} label={provLabel(t, axis.score.provenance)} />
                </div>
                <div className="ops__radar-bar">
                  <span style={{ width: `${axis.score.value}%` }} />
                </div>
                <span className="ops__radar-val">{axis.score.value}</span>
              </div>
            ))}
          </div>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--tall" title={t("operations.panel.alerts")} subtitle={t("operations.panel.alertsSub")}>
          <ul className="ops__alerts">
            {snapshot.alerts.map((a) => (
              <li key={a.id} className={`ops__alert ops__alert--${a.severity}`}>
                <div className="ops__alert-top">
                  <span className="ops__alert-sev">{a.severity}</span>
                  <OpsProvenanceBadge provenance={a.provenance} label={provLabel(t, a.provenance)} />
                </div>
                <p className="ops__alert-title">{interp(a.titleKey, a.params)}</p>
                <p className="ops__alert-body">{interp(a.bodyKey, a.params)}</p>
              </li>
            ))}
          </ul>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--tall" title={t("operations.panel.recs")} subtitle={t("operations.panel.recsSub")}>
          <ul className="ops__recs">
            {snapshot.recommendations.map((r) => (
              <li key={r.id} className={`ops__rec ops__rec--${r.priority}`}>
                <span className="ops__rec-p">{r.priority.toUpperCase()}</span>
                <OpsProvenanceBadge provenance={r.provenance} label={provLabel(t, r.provenance)} />
                <p className="ops__rec-action">{interp(r.actionKey, r.params)}</p>
                <p className="ops__rec-rationale">{interp(r.rationaleKey, r.params)}</p>
              </li>
            ))}
          </ul>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--span2" title={t("operations.panel.manual")} subtitle={t("operations.panel.manualSub")}>
          <label className="field-label">{t("operations.manual.prioritySkus")}</label>
          <textarea
            className="input ops__textarea"
            rows={2}
            value={manual.prioritySkus}
            onChange={(e) => setManual((m) => ({ ...m, prioritySkus: e.target.value }))}
            placeholder={t("operations.manual.prioritySkusPh")}
          />
          <label className="field-label">{t("operations.manual.runway")}</label>
          <textarea
            className="input ops__textarea"
            rows={2}
            value={manual.runwayNotes}
            onChange={(e) => setManual((m) => ({ ...m, runwayNotes: e.target.value }))}
            placeholder={t("operations.manual.runwayPh")}
          />
          <label className="field-label">{t("operations.manual.prodNote")}</label>
          <textarea
            className="input ops__textarea"
            rows={2}
            value={manual.productionBottleneckNote}
            onChange={(e) => setManual((m) => ({ ...m, productionBottleneckNote: e.target.value }))}
            placeholder={t("operations.manual.prodNotePh")}
          />
          <div className="ops__sliders">
            <label className="ops__num">
              <span>{t("operations.manual.fieldProd")}</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input ops__num-in"
                value={manual.productionPressureManual ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setManual((m) => ({
                    ...m,
                    productionPressureManual: raw === "" ? null : Math.max(0, Math.min(100, Number(raw) || 0)),
                  }));
                }}
                placeholder="0–100"
              />
            </label>
            <label className="ops__num">
              <span>{t("operations.manual.fieldCat")}</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input ops__num-in"
                value={manual.categoryOverloadManual ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setManual((m) => ({
                    ...m,
                    categoryOverloadManual: raw === "" ? null : Math.max(0, Math.min(100, Number(raw) || 0)),
                  }));
                }}
                placeholder="0–100"
              />
            </label>
            <label className="ops__num">
              <span>{t("operations.manual.fieldAd")}</span>
              <input
                type="number"
                min={0}
                max={100}
                className="input ops__num-in"
                value={manual.adLoadManual ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setManual((m) => ({
                    ...m,
                    adLoadManual: raw === "" ? null : Math.max(0, Math.min(100, Number(raw) || 0)),
                  }));
                }}
                placeholder="0–100"
              />
            </label>
          </div>
          <p className="ops__hint">{t("operations.manual.numHint")}</p>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--span2" title={t("operations.panel.heatmap")} subtitle={t("operations.panel.heatmapSub")}>
          {snapshot.skuHeatmap.length === 0 ? (
            <p className="ops__muted">{t("operations.heatmap.empty")}</p>
          ) : (
            <div className="ops__heatmap">
              {snapshot.skuHeatmap.map((c) => (
                <div
                  key={c.skuId}
                  className={`ops__heat-cell ops__heat-cell--${c.tier}`}
                  title={`${c.label} · ${c.category}`}
                  style={{ opacity: 0.35 + (c.intensity.value / 100) * 0.65 }}
                >
                  <span className="ops__heat-z">{c.label.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          )}
        </OpsSurfaceCard>

        <OpsSurfaceCard title={t("operations.panel.growth")}>
          <ul className="ops__simple-list">
            {snapshot.growthOpportunities.map((g) => (
              <li key={g.id}>
                <strong>{t(g.titleKey)}</strong>
                <p className="ops__muted">{t(g.bodyKey)}</p>
                <OpsProvenanceBadge provenance={g.provenance} label={provLabel(t, g.provenance)} />
              </li>
            ))}
          </ul>
        </OpsSurfaceCard>

        <OpsSurfaceCard title={t("operations.panel.risks")}>
          <ul className="ops__simple-list">
            {snapshot.riskWarnings.map((r) => (
              <li key={r.id} className={`ops__risk ops__risk--${r.severity}`}>
                <strong>{t(r.titleKey)}</strong>
                <p className="ops__muted">{t(r.bodyKey)}</p>
                <OpsProvenanceBadge provenance={r.provenance} label={provLabel(t, r.provenance)} />
              </li>
            ))}
          </ul>
        </OpsSurfaceCard>

        <OpsSurfaceCard title={t("operations.panel.production")}>
          <p className="ops__hero-metric ops__hero-metric--sm">{snapshot.productionPressure.score.value}</p>
          <OpsProvenanceBadge
            provenance={snapshot.productionPressure.score.provenance}
            label={provLabel(t, snapshot.productionPressure.score.provenance)}
          />
          <p className="ops__muted" style={{ marginTop: 12 }}>
            {t(snapshot.productionPressure.bottleneckSummaryKey)}
          </p>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--span2" title={t("operations.panel.pulse")} subtitle={t("operations.panel.pulseSub")}>
          <p className="ops__pulse-lead">{t(snapshot.marketplacePulse.headlineKey)}</p>
          <div className="ops__feeds">
            {snapshot.marketplacePulse.channels.map((ch) => (
              <div key={ch.channel} className="ops__feed">
                <span>{t(ch.labelKey)}</span>
                <span className="ops__feed-st">{ch.status}</span>
                <OpsProvenanceBadge provenance={ch.provenance} label={provLabel(t, ch.provenance)} />
              </div>
            ))}
          </div>
          <p className="ops__muted">
            {t("operations.pulse.visibility")}: {snapshot.marketplacePulse.visibilityBand.value}{" "}
            <OpsProvenanceBadge
              provenance={snapshot.marketplacePulse.visibilityBand.provenance}
              label={provLabel(t, snapshot.marketplacePulse.visibilityBand.provenance)}
            />
          </p>
          <p className="ops__muted">{t(snapshot.marketplacePulse.seasonalityKey)}</p>
          <p className="ops__muted">{t(snapshot.marketplacePulse.trendDriftKey)}</p>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--span2" title={t("operations.panel.priority")}>
          <ol className="ops__priority">
            {snapshot.priorityActions.map((p) => (
              <li key={p.id}>
                <span className="ops__pri-idx">{p.rank}</span>
                <span>{t(p.labelKey)}</span>
                <OpsProvenanceBadge provenance={p.provenance} label={provLabel(t, p.provenance)} />
              </li>
            ))}
          </ol>
        </OpsSurfaceCard>

        <OpsSurfaceCard className="ops-card--span2" title={t("operations.panel.memory")}>
          <ul className="ops__mem">
            <li>
              {t("operations.mem.project")}: <strong>{snapshot.memory.projectTitle ?? "—"}</strong>
            </li>
            <li>
              {t("operations.mem.skus")}: <strong>{snapshot.memory.skuCount.value}</strong>
              <OpsProvenanceBadge provenance={snapshot.memory.skuCount.provenance} label={provLabel(t, "memory-derived")} />
            </li>
            <li>
              {t("operations.mem.gen30")}: <strong>{snapshot.memory.generationCount30d.value}</strong>
              <OpsProvenanceBadge provenance={snapshot.memory.generationCount30d.provenance} label={provLabel(t, "memory-derived")} />
            </li>
            <li>
              {t("operations.mem.vis")}: <strong>{snapshot.memory.visualAnalysisCount.value}</strong>
              <OpsProvenanceBadge provenance={snapshot.memory.visualAnalysisCount.provenance} label={provLabel(t, "memory-derived")} />
            </li>
            <li>
              {t("operations.mem.cats")}: <strong>{snapshot.memory.uniqueCategories.value}</strong>
              <OpsProvenanceBadge provenance={snapshot.memory.uniqueCategories.provenance} label={provLabel(t, "memory-derived")} />
            </li>
          </ul>
        </OpsSurfaceCard>
      </div>

      <style>{`
        .ops--cinema {
          position: relative;
        }
        .ops__ambient {
          pointer-events: none;
          position: absolute;
          inset: -40px -24px auto -24px;
          height: 220px;
          background: radial-gradient(ellipse 70% 80% at 50% 0%, rgba(123, 143, 255, 0.14), transparent 62%);
          opacity: 0.9;
        }
        .ops__head {
          position: relative;
          z-index: 1;
        }
        .ops__eyebrow {
          color: rgba(123, 143, 255, 0.85);
        }
        .ops__title {
          text-shadow: 0 0 42px rgba(123, 143, 255, 0.22);
        }
        .ops__sub {
          max-width: 720px;
        }
        .ops__disclaimer {
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
          max-width: 720px;
          margin: 12px 0 0;
        }
        .ops__toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }
        .ops__toast {
          font-size: 0.85rem;
          color: var(--accent);
          margin: 0 0 12px;
        }
        .ops__grid {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(4, 1fr);
        }
        .ops-card--span2 {
          grid-column: span 2;
        }
        .ops-card--tall {
          grid-row: span 2;
        }
        .ops-card__head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .ops-card__title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .ops-card__sub {
          margin: 6px 0 0;
          font-size: 0.78rem;
          color: var(--muted);
          letter-spacing: 0.08em;
        }
        .ops-card__meta {
          flex-shrink: 0;
        }
        .ops-card {
          padding: 20px 22px;
          border: 1px solid rgba(123, 143, 255, 0.12);
          background: linear-gradient(165deg, rgba(16, 18, 28, 0.92), rgba(8, 9, 14, 0.88));
        }
        .ops-card__body {
          min-width: 0;
        }
        .ops__hero-metric {
          font-family: var(--font-display);
          font-size: 3.2rem;
          font-weight: 800;
          margin: 0 0 12px;
          line-height: 1;
          color: var(--text);
        }
        .ops__hero-metric--sm {
          font-size: 2.2rem;
        }
        .ops__breakdown {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.82rem;
        }
        .ops__breakdown li {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 6px;
        }
        .ops__breakdown strong {
          font-variant-numeric: tabular-nums;
        }
        .ops__muted {
          color: var(--muted);
          font-size: 0.86rem;
          margin: 6px 0 0;
        }
        .ops__radar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .ops__radar-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ops__radar-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ops__radar-bar {
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .ops__radar-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(123, 143, 255, 0.15), rgba(123, 143, 255, 0.85));
        }
        .ops__radar-val {
          font-size: 0.78rem;
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }
        .ops__alerts,
        .ops__recs {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 520px;
          overflow: auto;
        }
        .ops__alert {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
        }
        .ops__alert--critical {
          border-color: rgba(255, 80, 80, 0.45);
        }
        .ops__alert--risk {
          border-color: rgba(255, 160, 60, 0.35);
        }
        .ops__alert--watch {
          border-color: rgba(255, 210, 120, 0.22);
        }
        .ops__alert-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .ops__alert-sev {
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ops__alert-title {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 600;
        }
        .ops__alert-body {
          margin: 6px 0 0;
          font-size: 0.82rem;
          color: var(--muted);
        }
        .ops__rec {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(123, 143, 255, 0.15);
          background: rgba(123, 143, 255, 0.04);
        }
        .ops__rec--p0 {
          box-shadow: 0 0 0 1px rgba(123, 143, 255, 0.35);
        }
        .ops__rec-p {
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          margin-right: 8px;
          color: var(--accent);
        }
        .ops__rec-action {
          margin: 8px 0 4px;
          font-size: 0.9rem;
        }
        .ops__rec-rationale {
          margin: 0;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .ops__textarea {
          width: 100%;
          margin-bottom: 12px;
        }
        .ops__sliders {
          display: grid;
          gap: 12px;
          margin-top: 8px;
        }
        .ops__num {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .ops__num-in {
          max-width: 120px;
        }
        .ops__hint {
          font-size: 0.72rem;
          color: var(--faint);
          margin-top: 10px;
        }
        .ops__heatmap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ops__heat-cell {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .ops__heat-cell--winner {
          border-color: rgba(123, 255, 180, 0.35);
          background: rgba(80, 200, 140, 0.12);
        }
        .ops__heat-cell--loser {
          border-color: rgba(255, 120, 120, 0.25);
          background: rgba(200, 80, 80, 0.1);
        }
        .ops__heat-cell--neutral {
          background: rgba(123, 143, 255, 0.08);
        }
        .ops__heat-z {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 38px;
        }
        .ops__simple-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ops__simple-list li {
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .ops__risk--critical strong {
          color: #ff8a8a;
        }
        .ops__pulse-lead {
          font-size: 0.95rem;
          margin: 0 0 12px;
        }
        .ops__feeds {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }
        .ops__feed {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 12px;
          border: 1px solid var(--stroke);
          font-size: 0.78rem;
        }
        .ops__feed-st {
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .ops__priority {
          margin: 0;
          padding-left: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ops__priority li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.88rem;
        }
        .ops__pri-idx {
          font-family: var(--font-display);
          font-weight: 800;
          color: var(--accent);
          min-width: 22px;
        }
        .ops__mem {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.86rem;
        }
        .ops__mem li {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .ops-prov {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 99px;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.12);
          white-space: nowrap;
        }
        .ops-prov--est {
          color: rgba(200, 200, 255, 0.9);
          border-color: rgba(160, 170, 255, 0.35);
        }
        .ops-prov--inf {
          color: rgba(140, 220, 255, 0.95);
          border-color: rgba(100, 200, 255, 0.35);
        }
        .ops-prov--mem {
          color: rgba(200, 255, 210, 0.95);
          border-color: rgba(120, 220, 160, 0.35);
        }
        .ops-prov--man {
          color: rgba(255, 220, 160, 0.95);
          border-color: rgba(255, 200, 120, 0.35);
        }
        @media (max-width: 1200px) {
          .ops__grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .ops-card--span2 {
            grid-column: span 2;
          }
        }
        @media (max-width: 720px) {
          .ops__grid {
            grid-template-columns: 1fr;
          }
          .ops-card--span2,
          .ops-card--tall {
            grid-column: auto;
            grid-row: auto;
          }
          .ops__radar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
