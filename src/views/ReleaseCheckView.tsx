import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";
import { useSafeMode } from "../hooks/useSafeMode";
import type { ReleaseChecklistItemId, ReleaseVerdict, StabilityReleaseChecklist } from "../lib/release-checklist";
import {
  buildReleaseChecklistMarkdown,
  consumeReleaseChecklistRestore,
  createEmptyStabilityReleaseChecklist,
  loadReleaseChecklistDraft,
  parseReleaseChecklistMemoryPayload,
  persistLastSummaryFromChecklist,
  RELEASE_CHECKLIST_ITEMS,
  saveReleaseChecklistDraft,
} from "../lib/release-checklist";

type Props = { onNavigate: (id: NavId) => void };

const REL_PAGE_STYLES = `
  .rel-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
  .rel-head { padding: 14px 16px; }
  .rel-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .rel-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
  .rel-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
  .rel-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .rel-sec { padding: 14px 16px; }
  .rel-label { display: block; font-size: 0.78rem; opacity: 0.75; margin-bottom: 6px; }
  .rel-input, .rel-select, .rel-textarea {
    width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.25); color: inherit; font: inherit; padding: 8px 10px;
  }
  .rel-meta { margin: 8px 0 0; font-size: 0.82rem; opacity: 0.75; }
  .rel-hint { margin: 6px 0 0; font-size: 0.82rem; opacity: 0.8; color: #a8c8e8; }
  .rel-checklist { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .rel-checklist__row { border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px; background: rgba(0,0,0,0.12); }
  .rel-checklist__main { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
  .rel-checklist__label { font-size: 0.88rem; flex: 1 1 160px; }
  .rel-badge { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 99px; background: rgba(232,160,112,0.2); color: #e8b090; }
  .rel-linkish { font-size: 0.72rem; border: none; background: transparent; color: #9fd4a8; cursor: pointer; text-decoration: underline; padding: 0; font: inherit; }
  .rel-checklist__actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .rel-pill { padding: 4px 10px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; font: inherit; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.06em; }
  .rel-pill.is-active-pass { border-color: rgba(159,212,168,0.45); background: rgba(159,212,168,0.12); }
  .rel-pill.is-fail.is-active-fail { border-color: rgba(232,144,144,0.45); background: rgba(232,144,144,0.12); }
  .rel-pill.ghost { opacity: 0.65; }
  .rel-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
`;

export function ReleaseCheckView({ onNavigate }: Props) {
  const { t } = useI18n();
  const safe = useSafeMode();
  const [checklist, setChecklist] = useState<StabilityReleaseChecklist>(() => {
    const restored = consumeReleaseChecklistRestore();
    if (restored) {
      const p = parseReleaseChecklistMemoryPayload(restored);
      if (p) {
        saveReleaseChecklistDraft(p);
        return p;
      }
    }
    return loadReleaseChecklistDraft() ?? createEmptyStabilityReleaseChecklist();
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveReleaseChecklistDraft(checklist);
  }, [checklist]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const total = RELEASE_CHECKLIST_ITEMS.length;
  const passedCount = checklist.checkedItems.length;
  const failedCount = checklist.failedItems.length;
  const pendingCount = total - passedCount - failedCount;

  const suggestion = useMemo(() => {
    if (failedCount > 0) return t("rel.suggest.needsFix");
    if (pendingCount > 0) return t("rel.suggest.incomplete");
    if (checklist.warnings.length > 0) return t("rel.suggest.warningsOk");
    return t("rel.suggest.ready");
  }, [checklist.warnings.length, failedCount, pendingCount, t]);

  const setItemStatus = useCallback((id: ReleaseChecklistItemId, status: "pass" | "fail" | "clear") => {
    setChecklist((c) => {
      const checked = c.checkedItems.filter((x) => x !== id);
      const failed = c.failedItems.filter((x) => x !== id);
      if (status === "pass") return { ...c, checkedItems: [...checked, id], failedItems: failed };
      if (status === "fail") return { ...c, checkedItems: checked, failedItems: [...failed, id] };
      return { ...c, checkedItems: checked, failedItems: failed };
    });
  }, []);

  const copyMd = useCallback(() => {
    void copyToClipboard(buildReleaseChecklistMarkdown(checklist, t));
    showToast(t("rel.toast.copy"));
  }, [checklist, showToast, t]);

  const saveMemory = useCallback(() => {
    const label = checklist.releaseLabel.trim() || t("rel.memory.unlabeled");
    recordGeneration({
      module: "release_check",
      title: t("rel.memory.title", { label }),
      content: JSON.stringify(checklist),
      mime: "application/json",
      previewText: t("rel.verdict." + checklist.verdict),
    });
    persistLastSummaryFromChecklist(checklist);
    showToast(t("rel.toast.saved"));
  }, [checklist, showToast, t]);

  const publishAudit = useCallback(() => {
    persistLastSummaryFromChecklist(checklist);
    showToast(t("rel.toast.audit"));
  }, [checklist, showToast]);

  const newSheet = useCallback(() => {
    setChecklist(createEmptyStabilityReleaseChecklist());
    showToast(t("rel.toast.new"));
  }, [showToast]);

  const verdictOptions: ReleaseVerdict[] = ["ready", "usable_with_warnings", "needs_fix", "blocked"];

  return (
    <div className="rel-page">
      <header className="glass-panel rel-head">
        <p className="rel-eyebrow">{t("rel.eyebrow")}</p>
        <h1>{t("rel.title")}</h1>
        <p className="rel-lede">{t("rel.lede")}</p>
        <p className="rel-manual-tag">{t("rel.manualTag")}</p>
        <div className="rel-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("rel.action.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={publishAudit}>
            {t("rel.action.publishAudit")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyMd}>
            {t("rel.action.copyMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={newSheet}>
            {t("rel.action.new")}
          </button>
        </div>
      </header>

      {toast ? <p className="rel-toast">{toast}</p> : null}

      <section className="glass-panel rel-sec">
        <label className="rel-label" htmlFor="rel-label-input">
          {t("rel.field.releaseLabel")}
        </label>
        <input
          id="rel-label-input"
          className="rel-input"
          value={checklist.releaseLabel}
          onChange={(e) => setChecklist((c) => ({ ...c, releaseLabel: e.target.value }))}
          placeholder={t("rel.placeholder.label")}
        />
        <p className="rel-meta">
          {t("rel.meta.counts", {
            passed: String(passedCount),
            failed: String(failedCount),
            pending: String(pendingCount),
            total: String(total),
          })}
        </p>
        <p className="rel-hint">{suggestion}</p>
      </section>

      <section className="glass-panel rel-sec">
        <h2>{t("rel.section.verdict")}</h2>
        <select
          className="rel-select"
          value={checklist.verdict}
          onChange={(e) => setChecklist((c) => ({ ...c, verdict: e.target.value as ReleaseVerdict }))}
        >
          {verdictOptions.map((v) => (
            <option key={v} value={v}>
              {t("rel.verdict." + v)}
            </option>
          ))}
        </select>
      </section>

      {(checklist.verdict === "ready" || checklist.verdict === "usable_with_warnings") ? (
        <section className="glass-panel rel-sec">
          <p className="rel-hint">{t("rel.pilotCue.lede")}</p>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dailyPilot")}>
            {t("rel.link.dailyPilot")}
          </button>
        </section>
      ) : null}

      <section className="glass-panel rel-sec">
        <h2>{t("rel.section.checklist")}</h2>
        <ul className="rel-checklist">
          {RELEASE_CHECKLIST_ITEMS.map((row) => {
            const pass = checklist.checkedItems.includes(row.id);
            const fail = checklist.failedItems.includes(row.id);
            const safeHint = row.id === "safe_mode_not_active" && safe.enabled;
            return (
              <li key={row.id} className="rel-checklist__row">
                <div className="rel-checklist__main">
                  <span className="rel-checklist__label">{t("rel.item." + row.id)}</span>
                  {safeHint ? <span className="rel-badge">{t("rel.badge.safeOn")}</span> : null}
                  {row.hintNav ? (
                    <button type="button" className="rel-linkish" onClick={() => onNavigate(row.hintNav!)}>
                      {t("rel.action.openModule")}
                    </button>
                  ) : null}
                </div>
                <div className="rel-checklist__actions">
                  <button
                    type="button"
                    className={pass ? "rel-pill is-active-pass" : "rel-pill"}
                    onClick={() => setItemStatus(row.id, "pass")}
                  >
                    {t("rel.status.pass")}
                  </button>
                  <button
                    type="button"
                    className={fail ? "rel-pill is-fail is-active-fail" : "rel-pill is-fail"}
                    onClick={() => setItemStatus(row.id, "fail")}
                  >
                    {t("rel.status.fail")}
                  </button>
                  <button
                    type="button"
                    className="rel-pill ghost"
                    onClick={() => setItemStatus(row.id, "clear")}
                  >
                    {t("rel.status.clear")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="glass-panel rel-sec">
        <label className="rel-label" htmlFor="rel-warn">
          {t("rel.field.warnings")}
        </label>
        <textarea
          id="rel-warn"
          className="rel-textarea"
          rows={3}
          value={checklist.warnings.join("\n")}
          onChange={(e) => {
            const warnings = e.target.value.split(/\n+/).map((l) => l.trim()).filter(Boolean);
            setChecklist((c) => ({ ...c, warnings }));
          }}
          placeholder={t("rel.placeholder.warnings")}
        />
      </section>

      <section className="glass-panel rel-sec">
        <label className="rel-label" htmlFor="rel-confidence">
          {t("rel.field.confidence")}
        </label>
        <textarea
          id="rel-confidence"
          className="rel-textarea"
          rows={2}
          value={checklist.confidenceNote}
          onChange={(e) => setChecklist((c) => ({ ...c, confidenceNote: e.target.value }))}
          placeholder={t("rel.placeholder.confidence")}
        />
      </section>

      <section className="glass-panel rel-sec">
        <label className="rel-label" htmlFor="rel-notes">
          {t("rel.field.notes")}
        </label>
        <textarea
          id="rel-notes"
          className="rel-textarea"
          rows={4}
          value={checklist.notes}
          onChange={(e) => setChecklist((c) => ({ ...c, notes: e.target.value }))}
          placeholder={t("rel.placeholder.notes")}
        />
      </section>

      <style>{REL_PAGE_STYLES}</style>
    </div>
  );
}
