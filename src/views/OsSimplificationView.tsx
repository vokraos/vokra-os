import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { navMessageKey } from "../lib/i18n/navLabels";
import { recordGeneration } from "../lib/memory";
import type { SimplificationBacklogItem, SimplificationBacklogState, SimplificationItemStatus } from "../lib/simplification-backlog";
import {
  consumeSimplificationBacklogRestore,
  loadSimplificationBacklogState,
  notifySimplificationBacklogChanged,
  parseSimplificationBacklogPayload,
  saveSimplificationBacklogState,
} from "../lib/simplification-backlog";

type Props = { onNavigate: (id: NavId) => void };

const STATUSES: SimplificationItemStatus[] = ["open", "accepted", "done", "deferred", "rejected"];

const STATUS_RANK: Record<SimplificationItemStatus, number> = {
  open: 0,
  accepted: 1,
  deferred: 2,
  done: 3,
  rejected: 4,
};

const PAGE_STYLES = `
  .simback-page { max-width: 960px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
  .simback-head { padding: 14px 16px; }
  .simback-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .simback-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
  .simback-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .simback-card { padding: 12px 14px; display: grid; gap: 8px; }
  .simback-card__top { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; justify-content: space-between; }
  .simback-card__title { margin: 0; font-size: 0.92rem; font-weight: 600; max-width: 72%; }
  .simback-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 0.72rem; opacity: 0.8; }
  .simback-pill { padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
  .simback-pill--open { border-color: rgba(123, 143, 255, 0.35); }
  .simback-pill--crit { border-color: rgba(255, 120, 120, 0.45); }
  .simback-pill--high { border-color: rgba(255, 200, 120, 0.4); }
  .simback-field { margin: 0; font-size: 0.82rem; line-height: 1.45; opacity: 0.92; }
  .simback-label { font-size: 0.72rem; opacity: 0.65; margin-bottom: 2px; display: block; }
  .simback-reason { white-space: pre-wrap; }
  .simback-row-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .simback-select {
    font: inherit; font-size: 0.8rem; padding: 4px 8px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.25); color: inherit;
  }
  .simback-empty { opacity: 0.75; font-size: 0.9rem; }
  .simback-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
  .simback-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
`;

function sortItems(items: SimplificationBacklogItem[]): SimplificationBacklogItem[] {
  return [...items].sort((a, b) => {
    const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (sr !== 0) return sr;
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    const vs = sev[a.severity] - sev[b.severity];
    if (vs !== 0) return vs;
    return b.createdAt - a.createdAt;
  });
}

export function OsSimplificationView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<SimplificationBacklogState | null>(() => {
    const restored = consumeSimplificationBacklogRestore();
    if (restored) {
      const s = parseSimplificationBacklogPayload(restored);
      if (s) {
        saveSimplificationBacklogState(s);
        return s;
      }
    }
    return loadSimplificationBacklogState();
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (state) saveSimplificationBacklogState(state);
  }, [state]);

  const sorted = useMemo(() => (state?.items.length ? sortItems(state.items) : []), [state]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    if (!state?.items.length) return;
    recordGeneration({
      module: "simplification_backlog",
      title: t("simback.memory.title", { n: String(state.items.length) }),
      content: JSON.stringify(state),
      mime: "application/json",
      previewText: t("simback.memory.preview", { open: String(state.items.filter((i) => i.status === "open").length) }),
    });
    notifySimplificationBacklogChanged();
    showToast(t("simback.toast.saved"));
  }, [state, showToast, t]);

  const updateStatus = useCallback((id: string, status: SimplificationItemStatus) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: Date.now(),
        items: prev.items.map((i) => (i.id === id ? { ...i, status } : i)),
      };
    });
    notifySimplificationBacklogChanged();
  }, []);

  const openCount = state?.items.filter((i) => i.status === "open").length ?? 0;

  return (
    <div className="simback-page">
      <header className="glass-panel simback-head">
        <p className="simback-eyebrow">{t("simback.eyebrow")}</p>
        <h1>{t("simback.title")}</h1>
        <p className="simback-lede">{t("simback.lede")}</p>
        <p className="simback-manual-tag">{t("simback.manualTag")}</p>
        <div className="simback-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory} disabled={!state?.items.length}>
            {t("simback.action.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("pilotDebrief")}>
            {t("simback.action.backDebrief")}
          </button>
        </div>
        {openCount > 0 ? (
          <p className="simback-meta" style={{ marginTop: 10 }}>
            {t("simback.summary.open", { n: String(openCount) })}
          </p>
        ) : null}
      </header>

      {toast ? <p className="simback-toast">{toast}</p> : null}

      {!sorted.length ? (
        <section className="glass-panel simback-card">
          <p className="simback-empty">{t("simback.empty.lede")}</p>
          <button type="button" className="primary-btn" onClick={() => onNavigate("pilotDebrief")}>
            {t("simback.action.openDebrief")}
          </button>
        </section>
      ) : (
        sorted.map((item) => (
          <article key={item.id} className="glass-panel simback-card">
            <div className="simback-card__top">
              <h2 className="simback-card__title">{item.title}</h2>
              <div className="simback-row-actions">
                <label className="simback-meta" htmlFor={`simback-st-${item.id}`}>
                  <span className="simback-label">{t("simback.field.status")}</span>
                  <select
                    id={`simback-st-${item.id}`}
                    className="simback-select"
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value as SimplificationItemStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t("simback.status." + s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="simback-meta">
              <span
                className={`simback-pill${item.status === "open" ? " simback-pill--open" : ""}${
                  item.severity === "critical" ? " simback-pill--crit" : item.severity === "high" ? " simback-pill--high" : ""
                }`}
              >
                {t("simback.field.type")}: {t("simback.type." + item.itemType)}
              </span>
              <span className="simback-pill">{t("simback.field.severity")}: {t("simback.severity." + item.severity)}</span>
              <span className="simback-pill">{t("simback.field.effort")}: {t("simback.effort." + item.effort)}</span>
              {item.affectedModule ? (
                <span className="simback-pill">
                  {t("simback.field.module")}: {t(navMessageKey(item.affectedModule))}
                </span>
              ) : null}
            </div>
            {item.reason ? (
              <div>
                <span className="simback-label">{t("simback.field.reason")}</span>
                <p className="simback-field simback-reason">{item.reason}</p>
              </div>
            ) : null}
            {item.suggestedFix ? (
              <div>
                <span className="simback-label">{t("simback.field.suggestedFix")}</span>
                <p className="simback-field simback-reason">{item.suggestedFix}</p>
              </div>
            ) : null}
            {item.confidenceNote ? (
              <div>
                <span className="simback-label">{t("simback.field.confidence")}</span>
                <p className="simback-field">{item.confidenceNote}</p>
              </div>
            ) : null}
            <p className="simback-meta">
              {t("simback.meta.refs", { debrief: item.sourceDebriefId, pilot: item.sourcePilotId })}
            </p>
          </article>
        ))
      )}

      <style>{PAGE_STYLES}</style>
    </div>
  );
}
