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
import { useOperatingRoleMode } from "../lib/operating-role-mode";
import {
  buildDailyWarRoomMarkdown,
  buildDailyWarRoomMemoryPayload,
  buildDailyWarRoomPlain,
  buildDailyWarRoomSnapshot,
  DAILY_WAR_ROOM_EVENT,
  notifyDailyWarRoomUpdated,
  saveDailyWarRoomSession,
  type DailyWarRoomSnapshot,
  type WarRoomLine,
} from "../lib/daily-war-room";
import {
  buildEveningCloseSnapshot,
  EVENING_CLOSE_EVENT,
  loadTodayEveningCloseSnapshot,
} from "../lib/evening-close";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { ReportWarmupStrip } from "../components/ReportWarmupStrip";
import { useCleanDayMode, cleanDayHiddenSet } from "../lib/clean-day-mode";

type Props = { onNavigate: (id: NavId) => void };

function stateClass(state: DailyWarRoomSnapshot["dailyState"]): string {
  return `dwr-state dwr-state--${state}`;
}

function LineList({
  items,
  onGo,
  empty,
}: {
  items: WarRoomLine[];
  onGo: (navId?: NavId) => void;
  empty?: string;
}) {
  if (!items.length) return <p className="dwr-empty">{empty ?? "—"}</p>;
  return (
    <ul className="dwr-list">
      {items.map((item) => (
        <li key={item.text}>
          {item.navId ? (
            <button type="button" className="dwr-line-btn" onClick={() => onGo(item.navId)}>
              {item.text}
            </button>
          ) : (
            <span>{item.text}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function filterWarRoomLinesByCleanDay(items: WarRoomLine[], hide: ReadonlySet<NavId>): WarRoomLine[] {
  if (!hide.size) return items;
  return items.filter((item) => !item.navId || !hide.has(item.navId));
}

function FocusRow({ label, line, onGo }: { label: string; line: WarRoomLine; onGo: () => void }) {
  return (
    <button type="button" className="dwr-focus" onClick={onGo}>
      <span className="dwr-focus__lab">{label}</span>
      <span className="dwr-focus__txt">{line.text}</span>
    </button>
  );
}

export function DailyWarRoomView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const { mode: roleMode } = useOperatingRoleMode();
  const cleanDay = useCleanDayMode();
  const cleanHide = useMemo(
    () => (cleanDay.enabled ? cleanDayHiddenSet(cleanDay.hiddenNavIds) : new Set<NavId>()),
    [cleanDay.enabled, cleanDay.hiddenNavIds],
  );
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

  const snapshot = useMemo(() => buildDailyWarRoomSnapshot(t, locale), [tick, t, locale]);
  const eveningClose = useMemo(() => {
    return loadTodayEveningCloseSnapshot() ?? buildEveningCloseSnapshot(t, locale);
  }, [tick, t, locale]);

  const teamInstructions = useMemo(
    () => filterWarRoomLinesByCleanDay(snapshot.teamInstructions, cleanHide),
    [snapshot.teamInstructions, cleanHide],
  );
  const watchList = useMemo(
    () => filterWarRoomLinesByCleanDay(snapshot.watchList, cleanHide),
    [snapshot.watchList, cleanHide],
  );
  const blockedItems = useMemo(
    () => filterWarRoomLinesByCleanDay(snapshot.blockedItems, cleanHide),
    [snapshot.blockedItems, cleanHide],
  );
  const postponeItems = useMemo(
    () => filterWarRoomLinesByCleanDay(snapshot.postponeItems, cleanHide),
    [snapshot.postponeItems, cleanHide],
  );
  const founderDecisions = useMemo(
    () => filterWarRoomLinesByCleanDay(snapshot.founderDecisions, cleanHide),
    [snapshot.founderDecisions, cleanHide],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildDailyWarRoomMemoryPayload(snapshot);
    saveDailyWarRoomSession(payload);
    recordGeneration({
      module: "daily_war_room",
      title: t("dwr.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`dwr.state.${snapshot.dailyState}`),
    });
    notifyDailyWarRoomUpdated();
    showToast(t("dwr.toast.saved"));
  }, [showToast, snapshot, t]);

  const copyRoom = useCallback(() => {
    void copyToClipboard(buildDailyWarRoomPlain(snapshot, t));
    showToast(t("dwr.toast.copied"));
  }, [showToast, snapshot, t]);

  const exportMd = useCallback(() => {
    downloadText(`war-room-${snapshot.id}.md`, buildDailyWarRoomMarkdown(snapshot, t));
    showToast(t("dwr.toast.exported"));
  }, [showToast, snapshot, t]);

  const go = useCallback((navId?: NavId) => {
    if (navId) onNavigate(navId);
  }, [onNavigate]);

  return (
    <div className="dwr-page">
      <header className="glass-panel dwr-head">
        <p className="dwr-eyebrow">{t("dwr.eyebrow")}</p>
        <h1>{t("nav.warRoom")}</h1>
        <p className="dwr-lede">{t("dwr.lede")}</p>
        <ReportWarmupStrip className="dwr-warmup-strip" />
        <p className="dwr-date">{snapshot.dateLabel}</p>
        <p className="dwr-mode">{t("orm.currentMode", { mode: t(`orm.mode.${roleMode}`) })}</p>
        {cleanDay.enabled ? (
          <p className="dwr-clean-banner" role="note">
            {t("dwr.cleanDay.banner")}
          </p>
        ) : null}
        <div className="dwr-headline">
          <span className={stateClass(snapshot.dailyState)}>{t(`dwr.state.${snapshot.dailyState}`)}</span>
        </div>
        <p className="dwr-conf">{t(snapshot.confidenceNote)}</p>
        <div className="dwr-head__actions">
          <button type="button" className="primary-btn dwr-start-day" onClick={() => onNavigate("morningStart")}>
            {t("dwr.action.startDay")}
          </button>
          {!cleanHide.has("dailyPilot") ? (
            <button type="button" className="ghost-btn" onClick={() => onNavigate("dailyPilot")}>
              {t("dwr.action.startPilot")}
            </button>
          ) : null}
          <button type="button" className="ghost-btn dwr-close-day" onClick={() => onNavigate("eveningClose")}>
            {t("dwr.action.closeDay")}
          </button>
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("dwr.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyRoom}>
            {t("dwr.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("dwr.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`war-room-${snapshot.id}.json`, snapshot)}>
            {t("dwr.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="dwr-toast">{toast}</p> : null}

      <section className="glass-panel dwr-sec">
        <h2>{t("dwr.section.focus")}</h2>
        <div className="dwr-focus-grid">
          <FocusRow label={t("dwr.focus.founder")} line={snapshot.founderFocus} onGo={() => go(snapshot.founderFocus.navId)} />
          <FocusRow label={t("dwr.focus.operator")} line={snapshot.operatorFocus} onGo={() => go(snapshot.operatorFocus.navId)} />
          <FocusRow label={t("dwr.focus.production")} line={snapshot.productionFocus} onGo={() => go(snapshot.productionFocus.navId)} />
          <FocusRow label={t("dwr.focus.launch")} line={snapshot.launchFocus} onGo={() => go(snapshot.launchFocus.navId)} />
          <FocusRow label={t("dwr.focus.hero")} line={snapshot.heroFocus} onGo={() => go(snapshot.heroFocus.navId)} />
          <FocusRow label={t("dwr.focus.scaling")} line={snapshot.scalingFocus} onGo={() => go(snapshot.scalingFocus.navId)} />
        </div>
      </section>

      <div className="dwr-grid">
        <section className="glass-panel dwr-sec">
          <h2>{t("dwr.section.team")}</h2>
          <LineList items={teamInstructions} onGo={go} empty={t("dwr.empty.team")} />
        </section>
        <section className="glass-panel dwr-sec">
          <h2>{t("dwr.section.watch")}</h2>
          <LineList items={watchList} onGo={go} empty={t("dwr.empty.watch")} />
        </section>
        <section className="glass-panel dwr-sec dwr-sec--warn">
          <h2>{t("dwr.section.blocked")}</h2>
          <LineList items={blockedItems} onGo={go} empty={t("dwr.empty.blocked")} />
        </section>
        <section className="glass-panel dwr-sec dwr-sec--muted">
          <h2>{t("dwr.section.postpone")}</h2>
          <LineList items={postponeItems} onGo={go} empty={t("dwr.empty.postpone")} />
        </section>
      </div>

      <section className="glass-panel dwr-sec dwr-sec--decision">
        <h2>{t("dwr.section.decisions")}</h2>
        <LineList items={founderDecisions} onGo={go} empty={t("dwr.empty.decisions")} />
      </section>

      <section className="glass-panel dwr-sec dwr-sec--evening">
        <h2>{t("dwr.section.tomorrow")}</h2>
        <p className="dwr-tomorrow-pill">
          {t("dwr.tomorrow.readiness", { state: t(`eclose.tomorrow.${eveningClose.tomorrowReadiness}`) })}
        </p>
        <h3 className="dwr-sub-h">{t("dwr.section.carryPressure")}</h3>
        <LineList
          items={eveningClose.tomorrowCarryForward.map((x) => ({ text: x.text }))}
          onGo={go}
          empty={t("dwr.empty.carry")}
        />
        <h3 className="dwr-sub-h">{t("dwr.section.decisionsTomorrow")}</h3>
        <LineList
          items={eveningClose.founderDecisionsForTomorrow.map((x) => ({ text: x.text }))}
          onGo={go}
          empty={t("dwr.empty.decisionsTomorrow")}
        />
      </section>

      <section className="glass-panel dwr-sec dwr-sec--route">
        <h2>{t("dwr.section.route")}</h2>
        <button type="button" className="dwr-route" onClick={() => go(snapshot.nextRoute.navId)}>
          {snapshot.nextRoute.text}
        </button>
      </section>

      <style>{`
        .dwr-page { max-width: 820px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .dwr-head { padding: 20px; }
        .dwr-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin: 0 0 6px; }
        .dwr-lede { margin: 8px 0; opacity: 0.85; font-size: 14px; }
        .dwr-date { font-size: 12px; opacity: 0.65; margin: 0 0 6px; }
        .dwr-mode { font-size: 11px; opacity: 0.7; margin: 0 0 10px; letter-spacing: 0.04em; }
        .dwr-clean-banner {
          font-size: 12px;
          line-height: 1.45;
          margin: 0 0 12px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(123, 143, 255, 0.08);
          border: 1px solid rgba(123, 143, 255, 0.2);
          color: rgba(210, 220, 255, 0.88);
        }
        .dwr-headline { margin: 8px 0; }
        .dwr-state { font-weight: 600; padding: 4px 12px; border-radius: 999px; font-size: 13px; }
        .dwr-state--clear { background: rgba(80, 200, 120, 0.15); color: #6fd89a; }
        .dwr-state--focused { background: rgba(120, 180, 255, 0.15); color: #9ec8ff; }
        .dwr-state--pressured { background: rgba(255, 200, 80, 0.12); color: #e8c46a; }
        .dwr-state--overloaded { background: rgba(255, 140, 80, 0.15); color: #f0a070; }
        .dwr-state--blocked { background: rgba(255, 90, 90, 0.15); color: #ff8a8a; }
        .dwr-conf { font-size: 12px; opacity: 0.65; margin: 8px 0 0; }
        .dwr-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .dwr-sec { padding: 16px 18px; }
        .dwr-sec h2 { margin: 0 0 10px; font-size: 14px; }
        .dwr-focus-grid { display: grid; gap: 8px; }
        .dwr-focus { display: block; width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: inherit; cursor: pointer; }
        .dwr-focus:hover { border-color: rgba(120, 180, 255, 0.35); }
        .dwr-focus__lab { display: block; font-size: 11px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .dwr-focus__txt { font-size: 13px; }
        .dwr-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        .dwr-list { margin: 0; padding-left: 0; list-style: none; }
        .dwr-list li { margin-bottom: 6px; font-size: 13px; }
        .dwr-line-btn { background: none; border: none; color: #9ec8ff; text-align: left; padding: 0; cursor: pointer; font-size: 13px; }
        .dwr-line-btn:hover { text-decoration: underline; }
        .dwr-empty { font-size: 12px; opacity: 0.55; margin: 0; }
        .dwr-sec--warn h2 { color: #e8c46a; }
        .dwr-sec--decision h2 { color: #c9a0ff; }
        .dwr-sec--evening h2 { color: #9ec8ff; }
        .dwr-tomorrow-pill { font-size: 13px; font-weight: 600; margin: 0 0 12px; opacity: 0.9; }
        .dwr-sub-h { font-size: 12px; margin: 12px 0 6px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.06em; }
        .dwr-route { width: 100%; text-align: left; padding: 12px; font-size: 14px; font-weight: 600; border-radius: 10px; border: 1px solid rgba(180, 140, 255, 0.35); background: rgba(140, 100, 220, 0.12); color: inherit; cursor: pointer; }
        .dwr-toast { text-align: center; font-size: 13px; opacity: 0.85; }
      `}</style>
    </div>
  );
}
