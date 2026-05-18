import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { EXECUTION_FEEDBACK_EVENT } from "../lib/execution-feedback";
import { FOUNDER_BRIEF_EVENT } from "../lib/founder-brief";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { OPERATOR_BRIEF_EVENT } from "../lib/operator-brief";
import { PRODUCTION_PRESSURE_EVENT } from "../lib/production-pressure";
import { SCALING_SAFETY_EVENT } from "../lib/scaling-safety";
import { CONTROL_TOWER_EVENT } from "../lib/strategic-control-tower";
import { DAILY_WAR_ROOM_EVENT } from "../lib/daily-war-room";
import {
  buildEveningCloseMarkdown,
  buildEveningCloseMemoryPayload,
  buildEveningClosePlain,
  buildEveningCloseSnapshot,
  EVENING_CLOSE_EVENT,
  notifyEveningCloseUpdated,
  saveEveningCloseSession,
  saveLastEveningClose,
  type CloseLine,
} from "../lib/evening-close";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function LineList({ items, empty }: { items: CloseLine[]; empty?: string }) {
  if (!items.length) return <p className="eclose-empty">{empty ?? "—"}</p>;
  return (
    <ul className="eclose-list">
      {items.map((item) => (
        <li key={item.text}>{item.text}</li>
      ))}
    </ul>
  );
}

function Section({ title, items, empty }: { title: string; items: CloseLine[]; empty?: string }) {
  return (
    <section className="glass-panel eclose-sec">
      <h2>{title}</h2>
      <LineList items={items} empty={empty} />
    </section>
  );
}

export function EveningCloseView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    const events = [
      ENTITY_SNAPSHOT_EVENT,
      ASSORTMENT_ACTIONS_EVENT,
      HERO_COMMAND_EVENT,
      LAUNCH_OPS_EVENT,
      FOUNDER_BRIEF_EVENT,
      CONTROL_TOWER_EVENT,
      OPERATOR_BRIEF_EVENT,
      EXECUTION_FEEDBACK_EVENT,
      PRODUCTION_PRESSURE_EVENT,
      SCALING_SAFETY_EVENT,
      DAILY_WAR_ROOM_EVENT,
      EVENING_CLOSE_EVENT,
    ];
    for (const e of events) window.addEventListener(e, bump);
    return () => {
      for (const e of events) window.removeEventListener(e, bump);
    };
  }, []);

  const snapshot = useMemo(() => buildEveningCloseSnapshot(t, locale), [tick, t, locale]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveClose = useCallback(() => {
    saveLastEveningClose(snapshot);
    const payload = buildEveningCloseMemoryPayload(snapshot);
    saveEveningCloseSession(payload);
    recordGeneration({
      module: "evening_close",
      title: t("eclose.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`eclose.tomorrow.${snapshot.tomorrowReadiness}`),
    });
    notifyEveningCloseUpdated();
    showToast(t("eclose.toast.saved"));
  }, [showToast, snapshot, t]);

  const preloadMorning = useCallback(() => {
    saveClose();
    onNavigate("morningStart");
    showToast(t("eclose.toast.preload"));
  }, [onNavigate, saveClose, showToast, t]);

  return (
    <div className="eclose-page">
      <header className="glass-panel eclose-head">
        <p className="eclose-eyebrow">{t("eclose.eyebrow")}</p>
        <h1>{t("nav.eveningClose")}</h1>
        <p className="eclose-lede">{t("eclose.lede")}</p>
        <p className="eclose-date">{snapshot.dateLabel}</p>
        <div className="eclose-head__meta">
          <span className={`eclose-pill eclose-pill--today`}>{t(`dwr.state.${snapshot.dailyState}`)}</span>
          <span className={`eclose-pill eclose-pill--tomorrow eclose-pill--${snapshot.tomorrowReadiness}`}>
            {t("eclose.label.tomorrow")}: {t(`eclose.tomorrow.${snapshot.tomorrowReadiness}`)}
          </span>
        </div>
        <p className="eclose-conf">{t(snapshot.confidenceNote)}</p>
        <div className="eclose-head__actions">
          <button type="button" className="primary-btn" onClick={saveClose}>
            {t("eclose.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={preloadMorning}>
            {t("eclose.action.preloadMorning")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(buildEveningClosePlain(snapshot, t))}>
            {t("eclose.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadText(`evening-close-${snapshot.id}.md`, buildEveningCloseMarkdown(snapshot, t))}>
            {t("eclose.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`evening-close-${snapshot.id}.json`, snapshot)}>
            {t("eclose.action.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dailyPilot")}>
            {t("eclose.action.backToPilot")}
          </button>
        </div>
      </header>

      {toast ? <p className="eclose-toast">{toast}</p> : null}

      <div className="eclose-grid">
        <Section title={t("eclose.section.completed")} items={snapshot.completedToday} empty={t("eclose.empty.none")} />
        <Section title={t("eclose.section.delayed")} items={snapshot.delayedToday} empty={t("eclose.empty.none")} />
        <Section title={t("eclose.section.blocked")} items={snapshot.blockedToday} empty={t("eclose.empty.none")} />
        <Section title={t("eclose.section.overload")} items={snapshot.overloadedAreas} empty={t("eclose.empty.none")} />
      </div>

      <div className="eclose-grid">
        <Section title={t("eclose.section.production")} items={snapshot.productionIssues} />
        <Section title={t("eclose.section.launch")} items={snapshot.launchIssues} />
        <Section title={t("eclose.section.hero")} items={snapshot.heroIssues} />
        <Section title={t("eclose.section.operator")} items={snapshot.operatorIssues} />
      </div>

      <Section title={t("eclose.section.decisions")} items={snapshot.founderDecisionsForTomorrow} empty={t("eclose.empty.decisions")} />

      <div className="eclose-grid eclose-grid--tomorrow">
        <Section title={t("eclose.section.carry")} items={snapshot.tomorrowCarryForward} />
        <Section title={t("eclose.section.warnings")} items={snapshot.tomorrowWarnings} />
        <Section title={t("eclose.section.preload")} items={snapshot.preloadMorningFocus} />
      </div>

      <style>{`
        .eclose-page { max-width: 820px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .eclose-head { padding: 20px; }
        .eclose-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin: 0 0 6px; }
        .eclose-lede { margin: 8px 0; opacity: 0.85; font-size: 14px; }
        .eclose-date { font-size: 12px; opacity: 0.65; margin: 0 0 10px; }
        .eclose-head__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .eclose-pill { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
        .eclose-pill--tomorrow { background: rgba(140, 100, 220, 0.15); color: #c9a0ff; }
        .eclose-pill--pressured, .eclose-pill--unstable { background: rgba(255, 200, 80, 0.12); color: #e8c46a; }
        .eclose-pill--blocked { background: rgba(255, 90, 90, 0.15); color: #ff8a8a; }
        .eclose-conf { font-size: 12px; opacity: 0.65; margin: 8px 0 0; }
        .eclose-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .eclose-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        .eclose-grid--tomorrow { grid-template-columns: 1fr; }
        .eclose-sec { padding: 16px 18px; }
        .eclose-sec h2 { margin: 0 0 10px; font-size: 14px; }
        .eclose-list { margin: 0; padding-left: 18px; font-size: 13px; }
        .eclose-list li { margin-bottom: 6px; }
        .eclose-empty { font-size: 12px; opacity: 0.55; margin: 0; }
        .eclose-toast { text-align: center; font-size: 13px; opacity: 0.85; }
      `}</style>
    </div>
  );
}
