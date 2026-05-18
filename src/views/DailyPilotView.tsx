import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import type {
  DailyOperationsPilot,
  DailyPilotScreenKey,
  DailyPilotStepId,
  DailyPilotVerdict,
} from "../lib/daily-operations-pilot";
import {
  consumeDailyPilotRestore,
  createEmptyDailyOperationsPilot,
  DAILY_PILOT_SCREEN_KEYS,
  DAILY_PILOT_STEPS,
  loadDailyPilotDraft,
  notifyDailyPilotSaved,
  parseDailyOperationsPilotPayload,
  saveDailyPilotDraft,
} from "../lib/daily-operations-pilot";
import {
  deriveDailyPilotDebrief,
  DAILY_PILOT_DEBRIEF_CHANGED_EVENT,
  loadPilotDebriefDraft,
  notifyPilotDebriefChanged,
  savePilotDebriefDraft,
} from "../lib/daily-pilot-debrief";

type Props = { onNavigate: (id: NavId) => void };

const PAGE_STYLES = `
  .dop-page { max-width: 920px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
  .dop-head { padding: 14px 16px; }
  .dop-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .dop-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
  .dop-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
  .dop-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .dop-sec { padding: 14px 16px; }
  .dop-label { display: block; font-size: 0.78rem; opacity: 0.75; margin-bottom: 6px; }
  .dop-input, .dop-select, .dop-textarea {
    width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.25); color: inherit; font: inherit; padding: 8px 10px;
  }
  .dop-meta { margin: 8px 0 0; font-size: 0.82rem; opacity: 0.75; }
  .dop-checklist { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .dop-checklist__row { border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px; background: rgba(0,0,0,0.12); }
  .dop-checklist__main { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
  .dop-checklist__label { font-size: 0.88rem; flex: 1 1 200px; }
  .dop-linkish { font-size: 0.72rem; border: none; background: transparent; color: #9fd4a8; cursor: pointer; text-decoration: underline; padding: 0; font: inherit; }
  .dop-checklist__actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .dop-pill { padding: 4px 10px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; font: inherit; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.06em; }
  .dop-pill.is-active-pass { border-color: rgba(159,212,168,0.45); background: rgba(159,212,168,0.12); }
  .dop-pill.is-fail.is-active-fail { border-color: rgba(232,144,144,0.45); background: rgba(232,144,144,0.12); }
  .dop-pill.ghost { opacity: 0.65; }
  .dop-grid-2 { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .dop-screen-grid { display: flex; flex-wrap: wrap; gap: 8px 16px; }
  .dop-screen-grid label { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; }
  .dop-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
`;

export function DailyPilotView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [pilot, setPilot] = useState<DailyOperationsPilot>(() => {
    const restored = consumeDailyPilotRestore();
    if (restored) {
      const p = parseDailyOperationsPilotPayload(restored);
      if (p) {
        saveDailyPilotDraft(p);
        return p;
      }
    }
    return loadDailyPilotDraft() ?? createEmptyDailyOperationsPilot();
  });
  const [toast, setToast] = useState<string | null>(null);
  const [debriefTick, setDebriefTick] = useState(0);

  useEffect(() => {
    const bump = () => setDebriefTick((x) => x + 1);
    window.addEventListener(DAILY_PILOT_DEBRIEF_CHANGED_EVENT, bump);
    return () => window.removeEventListener(DAILY_PILOT_DEBRIEF_CHANGED_EVENT, bump);
  }, []);

  const linkedDebriefPilotId = useMemo(() => {
    const d = loadPilotDebriefDraft();
    return d?.sourcePilotId === pilot.id ? d.id : null;
  }, [pilot.id, debriefTick]);

  useEffect(() => {
    saveDailyPilotDraft(pilot);
  }, [pilot]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const total = DAILY_PILOT_STEPS.length;
  const doneCount = pilot.completedSteps.length;
  const blockedCount = pilot.blockedSteps.length;

  const setStepStatus = useCallback((id: DailyPilotStepId, status: "pass" | "fail" | "clear") => {
    setPilot((p) => {
      const completed = p.completedSteps.filter((x) => x !== id);
      const blocked = p.blockedSteps.filter((x) => x !== id);
      if (status === "pass") return { ...p, completedSteps: [...completed, id], blockedSteps: blocked };
      if (status === "fail") return { ...p, completedSteps: completed, blockedSteps: [...blocked, id] };
      return { ...p, completedSteps: completed, blockedSteps: blocked };
    });
  }, []);

  const toggleScreen = useCallback((field: "usefulScreens" | "confusingScreens", key: DailyPilotScreenKey) => {
    setPilot((p) => {
      const arr = p[field];
      const has = arr.includes(key);
      const next = has ? arr.filter((k) => k !== key) : [...arr, key];
      return { ...p, [field]: next };
    });
  }, []);

  const saveMemory = useCallback(() => {
    const label = pilot.dateLabel.trim() || t("dopilot.memory.unlabeled");
    recordGeneration({
      module: "daily_operations_pilot",
      title: t("dopilot.memory.title", { label }),
      content: JSON.stringify(pilot),
      mime: "application/json",
      previewText: t("dopilot.verdict." + pilot.finalVerdict),
    });
    showToast(t("dopilot.toast.saved"));
    notifyDailyPilotSaved();
  }, [pilot, showToast, t]);

  const createDebrief = useCallback(() => {
    const d = deriveDailyPilotDebrief(pilot, t);
    savePilotDebriefDraft(d);
    notifyPilotDebriefChanged();
    onNavigate("pilotDebrief");
    showToast(t("dopilot.toast.debriefCreated"));
  }, [onNavigate, pilot, showToast, t]);

  const newSheet = useCallback(() => {
    setPilot(createEmptyDailyOperationsPilot());
    showToast(t("dopilot.toast.new"));
  }, [showToast, t]);

  const verdictOptions: DailyPilotVerdict[] = [
    "ready_for_daily_use",
    "usable_with_friction",
    "too_complex",
    "blocked",
  ];

  const statusInputs = useMemo(
    () =>
      [
        { key: "morningStatus" as const, labelKey: "dopilot.status.morning" },
        { key: "operatorStatus" as const, labelKey: "dopilot.status.operator" },
        { key: "productionStatus" as const, labelKey: "dopilot.status.production" },
        { key: "feedbackStatus" as const, labelKey: "dopilot.status.feedback" },
        { key: "eveningCloseStatus" as const, labelKey: "dopilot.status.evening" },
      ] as const,
    [],
  );

  return (
    <div className="dop-page">
      <header className="glass-panel dop-head">
        <p className="dop-eyebrow">{t("dopilot.eyebrow")}</p>
        <h1>{t("dopilot.title")}</h1>
        <p className="dop-lede">{t("dopilot.lede")}</p>
        <p className="dop-manual-tag">{t("dopilot.manualTag")}</p>
        <div className="dop-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("dopilot.action.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={createDebrief}>
            {t("dopilot.action.createDebrief")}
          </button>
          {linkedDebriefPilotId ? (
            <button type="button" className="ghost-btn" onClick={() => onNavigate("pilotDebrief")}>
              {t("dopilot.action.openDebrief")}
            </button>
          ) : null}
          <button type="button" className="ghost-btn" onClick={newSheet}>
            {t("dopilot.action.new")}
          </button>
        </div>
      </header>

      {toast ? <p className="dop-toast">{toast}</p> : null}

      <section className="glass-panel dop-sec">
        <label className="dop-label" htmlFor="dop-date">
          {t("dopilot.field.dateLabel")}
        </label>
        <input
          id="dop-date"
          className="dop-input"
          value={pilot.dateLabel}
          onChange={(e) => setPilot((p) => ({ ...p, dateLabel: e.target.value }))}
          placeholder={t("dopilot.placeholder.date")}
        />
        <p className="dop-meta">
          {t("dopilot.meta.progress", {
            done: String(doneCount),
            blocked: String(blockedCount),
            total: String(total),
          })}
        </p>
      </section>

      <section className="glass-panel dop-sec">
        <label className="dop-label" htmlFor="dop-current">
          {t("dopilot.field.currentStep")}
        </label>
        <select
          id="dop-current"
          className="dop-select"
          value={pilot.currentStep}
          onChange={(e) =>
            setPilot((p) => ({ ...p, currentStep: e.target.value as DailyPilotStepId }))
          }
        >
          {DAILY_PILOT_STEPS.map((row) => (
            <option key={row.id} value={row.id}>
              {t("dopilot.step." + row.id)}
            </option>
          ))}
        </select>
      </section>

      <section className="glass-panel dop-sec">
        <h2>{t("dopilot.section.steps")}</h2>
        <ul className="dop-checklist">
          {DAILY_PILOT_STEPS.map((row) => {
            const pass = pilot.completedSteps.includes(row.id);
            const fail = pilot.blockedSteps.includes(row.id);
            const nav = row.nav;
            return (
              <li key={row.id} className="dop-checklist__row">
                <div className="dop-checklist__main">
                  <span className="dop-checklist__label">{t("dopilot.step." + row.id)}</span>
                  {nav ? (
                    <button type="button" className="dop-linkish" onClick={() => onNavigate(nav)}>
                      {t("dopilot.action.openModule")}
                    </button>
                  ) : null}
                </div>
                <div className="dop-checklist__actions">
                  <button
                    type="button"
                    className={pass ? "dop-pill is-active-pass" : "dop-pill"}
                    onClick={() => setStepStatus(row.id, "pass")}
                  >
                    {t("dopilot.status.done")}
                  </button>
                  <button
                    type="button"
                    className={fail ? "dop-pill is-fail is-active-fail" : "dop-pill is-fail"}
                    onClick={() => setStepStatus(row.id, "fail")}
                  >
                    {t("dopilot.status.blocked")}
                  </button>
                  <button type="button" className="dop-pill ghost" onClick={() => setStepStatus(row.id, "clear")}>
                    {t("dopilot.status.clear")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="glass-panel dop-sec">
        <h2>{t("dopilot.section.areaNotes")}</h2>
        <div className="dop-grid-2">
          {statusInputs.map((row) => (
            <div key={row.key}>
              <label className="dop-label" htmlFor={`dop-${row.key}`}>
                {t(row.labelKey)}
              </label>
              <input
                id={`dop-${row.key}`}
                className="dop-input"
                value={pilot[row.key]}
                onChange={(e) => setPilot((p) => ({ ...p, [row.key]: e.target.value }))}
                placeholder={t("dopilot.placeholder.short")}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel dop-sec">
        <h2>{t("dopilot.section.useful")}</h2>
        <div className="dop-screen-grid">
          {DAILY_PILOT_SCREEN_KEYS.map((key) => (
            <label key={"u-" + key}>
              <input
                type="checkbox"
                checked={pilot.usefulScreens.includes(key)}
                onChange={() => toggleScreen("usefulScreens", key)}
              />
              {t("dopilot.screen." + key)}
            </label>
          ))}
        </div>
      </section>

      <section className="glass-panel dop-sec">
        <h2>{t("dopilot.section.confusing")}</h2>
        <div className="dop-screen-grid">
          {DAILY_PILOT_SCREEN_KEYS.map((key) => (
            <label key={"c-" + key}>
              <input
                type="checkbox"
                checked={pilot.confusingScreens.includes(key)}
                onChange={() => toggleScreen("confusingScreens", key)}
              />
              {t("dopilot.screen." + key)}
            </label>
          ))}
        </div>
      </section>

      <section className="glass-panel dop-sec">
        <label className="dop-label" htmlFor="dop-friction">
          {t("dopilot.field.friction")}
        </label>
        <textarea
          id="dop-friction"
          className="dop-textarea"
          rows={3}
          value={pilot.frictionNotes}
          onChange={(e) => setPilot((p) => ({ ...p, frictionNotes: e.target.value }))}
          placeholder={t("dopilot.placeholder.friction")}
        />
      </section>

      <section className="glass-panel dop-sec">
        <label className="dop-label" htmlFor="dop-missing">
          {t("dopilot.field.missing")}
        </label>
        <textarea
          id="dop-missing"
          className="dop-textarea"
          rows={3}
          value={pilot.missingData}
          onChange={(e) => setPilot((p) => ({ ...p, missingData: e.target.value }))}
          placeholder={t("dopilot.placeholder.missing")}
        />
      </section>

      <section className="glass-panel dop-sec">
        <h2>{t("dopilot.section.verdict")}</h2>
        <select
          className="dop-select"
          value={pilot.finalVerdict}
          onChange={(e) =>
            setPilot((p) => ({ ...p, finalVerdict: e.target.value as DailyPilotVerdict }))
          }
        >
          {verdictOptions.map((v) => (
            <option key={v} value={v}>
              {t("dopilot.verdict." + v)}
            </option>
          ))}
        </select>
      </section>

      <section className="glass-panel dop-sec">
        <label className="dop-label" htmlFor="dop-fixes">
          {t("dopilot.field.fixes")}
        </label>
        <textarea
          id="dop-fixes"
          className="dop-textarea"
          rows={3}
          value={pilot.recommendedFixes}
          onChange={(e) => setPilot((p) => ({ ...p, recommendedFixes: e.target.value }))}
          placeholder={t("dopilot.placeholder.fixes")}
        />
      </section>

      <section className="glass-panel dop-sec">
        <label className="dop-label" htmlFor="dop-conf">
          {t("dopilot.field.confidence")}
        </label>
        <textarea
          id="dop-conf"
          className="dop-textarea"
          rows={2}
          value={pilot.confidenceNote}
          onChange={(e) => setPilot((p) => ({ ...p, confidenceNote: e.target.value }))}
          placeholder={t("dopilot.placeholder.confidence")}
        />
      </section>

      <style>{PAGE_STYLES}</style>
    </div>
  );
}
