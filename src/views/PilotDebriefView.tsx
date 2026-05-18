import { useCallback, useEffect, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import type { DailyPilotDebrief } from "../lib/daily-pilot-debrief";
import {
  consumeDailyPilotDebriefRestore,
  loadPilotDebriefDraft,
  notifyPilotDebriefChanged,
  parseDailyPilotDebriefPayload,
  savePilotDebriefDraft,
} from "../lib/daily-pilot-debrief";
import { mergeDerivedSimplificationItemsFromDebrief } from "../lib/simplification-backlog";

type Props = { onNavigate: (id: NavId) => void };

const PAGE_STYLES = `
  .dpdeb-page { max-width: 920px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
  .dpdeb-head { padding: 14px 16px; }
  .dpdeb-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .dpdeb-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
  .dpdeb-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .dpdeb-sec { padding: 14px 16px; }
  .dpdeb-sec h2 { margin: 0 0 8px; font-size: 0.95rem; }
  .dpdeb-label { display: block; font-size: 0.78rem; opacity: 0.75; margin-bottom: 6px; }
  .dpdeb-textarea, .dpdeb-input {
    width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.25); color: inherit; font: inherit; padding: 8px 10px; font-size: 0.88rem;
  }
  .dpdeb-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
  .dpdeb-chips li { font-size: 0.75rem; padding: 4px 10px; border-radius: 99px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
  .dpdeb-empty { opacity: 0.75; font-size: 0.9rem; }
  .dpdeb-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
  .dpdeb-verdict { font-weight: 700; font-size: 1rem; }
  .dpdeb-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
  .dpdeb-meta { font-size: 0.8rem; opacity: 0.7; margin: 8px 0 0; }
  .dpdeb-hint { font-size: 0.78rem; opacity: 0.65; margin: 10px 0 0; }
`;

export function PilotDebriefView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [debrief, setDebrief] = useState<DailyPilotDebrief | null>(() => {
    const restored = consumeDailyPilotDebriefRestore();
    if (restored) {
      const p = parseDailyPilotDebriefPayload(restored);
      if (p) {
        savePilotDebriefDraft(p);
        return p;
      }
    }
    return loadPilotDebriefDraft();
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (debrief) savePilotDebriefDraft(debrief);
  }, [debrief]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    if (!debrief) return;
    const label = debrief.dateLabel.trim() || t("debrief.memory.unlabeled");
    recordGeneration({
      module: "daily_pilot_debrief",
      title: t("debrief.memory.title", { label }),
      content: JSON.stringify(debrief),
      mime: "application/json",
      previewText: t("dopilot.verdict." + debrief.pilotVerdict),
    });
    notifyPilotDebriefChanged();
    showToast(t("debrief.toast.saved"));
  }, [debrief, showToast, t]);

  const createSimplificationBacklog = useCallback(() => {
    if (!debrief) return;
    const added = mergeDerivedSimplificationItemsFromDebrief(debrief, t);
    showToast(t("debrief.toast.simplificationBacklog", { n: String(added) }));
    onNavigate("osSimplification");
  }, [debrief, onNavigate, showToast, t]);

  const update = useCallback(<K extends keyof DailyPilotDebrief>(key: K, value: DailyPilotDebrief[K]) => {
    setDebrief((d) => (d ? { ...d, [key]: value } : d));
  }, []);

  if (!debrief) {
    return (
      <div className="dpdeb-page">
        <header className="glass-panel dpdeb-head">
          <p className="dpdeb-eyebrow">{t("debrief.eyebrow")}</p>
          <h1>{t("debrief.title")}</h1>
          <p className="dpdeb-lede">{t("debrief.empty.lede")}</p>
          <button type="button" className="primary-btn" onClick={() => onNavigate("dailyPilot")}>
            {t("debrief.action.openPilot")}
          </button>
        </header>
        <style>{PAGE_STYLES}</style>
      </div>
    );
  }

  return (
    <div className="dpdeb-page">
      <header className="glass-panel dpdeb-head">
        <p className="dpdeb-eyebrow">{t("debrief.eyebrow")}</p>
        <h1>{t("debrief.title")}</h1>
        <p className="dpdeb-lede">{t("debrief.lede")}</p>
        <p className="dpdeb-manual-tag">{t("debrief.manualTag")}</p>
        <div className="dpdeb-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("debrief.action.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={createSimplificationBacklog}>
            {t("debrief.action.createSimplificationBacklog")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dailyPilot")}>
            {t("debrief.action.backPilot")}
          </button>
        </div>
      </header>

      {toast ? <p className="dpdeb-toast">{toast}</p> : null}

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.verdict")}</h2>
        <p className="dpdeb-verdict">{t("dopilot.verdict." + debrief.pilotVerdict)}</p>
        <p className="dpdeb-meta">
          {t("debrief.meta.source", { id: debrief.sourcePilotId, date: debrief.dateLabel || "—" })}
        </p>
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.worked")}</h2>
        <label className="dpdeb-label" htmlFor="dpdeb-worked">
          {t("debrief.field.worked")}
        </label>
        <textarea
          id="dpdeb-worked"
          className="dpdeb-textarea"
          rows={5}
          value={debrief.workedWell}
          onChange={(e) => update("workedWell", e.target.value)}
        />
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.friction")}</h2>
        <label className="dpdeb-label" htmlFor="dpdeb-friction">
          {t("debrief.field.friction")}
        </label>
        <textarea
          id="dpdeb-friction"
          className="dpdeb-textarea"
          rows={4}
          value={debrief.causedFriction}
          onChange={(e) => update("causedFriction", e.target.value)}
        />
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.skipped")}</h2>
        {debrief.skippedScreens.length ? (
          <ul className="dpdeb-chips">
            {debrief.skippedScreens.map((id) => (
              <li key={id}>{t("dopilot.step." + id)}</li>
            ))}
          </ul>
        ) : (
          <p className="dpdeb-empty">{t("debrief.empty.skipped")}</p>
        )}
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.confusing")}</h2>
        {debrief.confusingScreens.length ? (
          <ul className="dpdeb-chips">
            {debrief.confusingScreens.map((k) => (
              <li key={k}>{t("dopilot.screen." + k)}</li>
            ))}
          </ul>
        ) : (
          <p className="dpdeb-empty">{t("debrief.empty.none")}</p>
        )}
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.missing")}</h2>
        <textarea
          className="dpdeb-textarea"
          rows={3}
          value={debrief.missingData}
          onChange={(e) => update("missingData", e.target.value)}
        />
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.simplify")}</h2>
        <textarea
          className="dpdeb-textarea"
          rows={4}
          value={debrief.recommendedSimplifications}
          onChange={(e) => update("recommendedSimplifications", e.target.value)}
        />
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.fixes")}</h2>
        <textarea
          className="dpdeb-textarea"
          rows={4}
          value={debrief.recommendedFixes}
          onChange={(e) => update("recommendedFixes", e.target.value)}
        />
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.hide")}</h2>
        {debrief.hideFromDailyUseCandidates.length ? (
          <ul className="dpdeb-chips">
            {debrief.hideFromDailyUseCandidates.map((k) => (
              <li key={k}>{t("dopilot.screen." + k)}</li>
            ))}
          </ul>
        ) : (
          <p className="dpdeb-empty">{t("debrief.empty.hide")}</p>
        )}
        <p className="dpdeb-hint">{t("debrief.hint.hide")}</p>
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.keep")}</h2>
        {debrief.keepInDailyUse.length ? (
          <ul className="dpdeb-chips">
            {debrief.keepInDailyUse.map((k) => (
              <li key={k}>{t("dopilot.screen." + k)}</li>
            ))}
          </ul>
        ) : (
          <p className="dpdeb-empty">{t("debrief.empty.keep")}</p>
        )}
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.next")}</h2>
        <textarea
          className="dpdeb-textarea"
          rows={3}
          value={debrief.nextPilotRecommendation}
          onChange={(e) => update("nextPilotRecommendation", e.target.value)}
        />
      </section>

      <section className="glass-panel dpdeb-sec">
        <h2>{t("debrief.section.confidence")}</h2>
        <textarea
          className="dpdeb-textarea"
          rows={2}
          value={debrief.confidenceNote}
          onChange={(e) => update("confidenceNote", e.target.value)}
        />
      </section>

      <style>{PAGE_STYLES}</style>
    </div>
  );
}
