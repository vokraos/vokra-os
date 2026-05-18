import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { CONTROL_TOWER_EVENT } from "../lib/strategic-control-tower";
import {
  buildOsHealthAuditMemoryPayload,
  buildOsHealthAuditReport,
  OS_HEALTH_AUDIT_EVENT,
  notifyOsHealthAuditUpdated,
  saveOsHealthAuditSession,
  type AuditHealthLevel,
  type AuditFinding,
} from "../lib/os-health-audit";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";
import {
  loadLastReleaseChecklistSummary,
  RELEASE_CHECKLIST_CHANGED_EVENT,
} from "../lib/release-checklist";
import {
  DAILY_PILOT_SAVED_EVENT,
  loadDailyPilotDraft,
} from "../lib/daily-operations-pilot";
import {
  DAILY_PILOT_CONFUSING_WARN_THRESHOLD,
  DAILY_PILOT_DEBRIEF_CHANGED_EVENT,
  excerptDebriefFixes,
  loadPilotDebriefDraft,
} from "../lib/daily-pilot-debrief";
import {
  loadSimplificationBacklogState,
  openCriticalHighSimplificationTitles,
  SIMPLIFICATION_BACKLOG_CHANGED_EVENT,
} from "../lib/simplification-backlog";
import { CLEAN_DAY_MODE_CHANGED_EVENT, getEffectiveCleanDayState } from "../lib/clean-day-mode";

type Props = { onNavigate: (id: NavId) => void };

function healthClass(h: AuditHealthLevel): string {
  return `oha-health oha-health--${h}`;
}

function FindingList({
  items,
  t,
  onNavigate,
}: {
  items: AuditFinding[];
  t: (k: string, v?: Record<string, string>) => string;
  onNavigate: (id: NavId) => void;
}) {
  if (!items.length) return <p className="oha-empty">{t("oha.list.none")}</p>;
  return (
    <ul className="oha-list">
      {items.map((f) => (
        <li key={`${f.key}-${f.navId}`}>
          <button type="button" className="oha-list__btn" onClick={() => onNavigate(f.navId)}>
            <span>{t(f.key, f.vars)}</span>
            <span className="oha-list__open">{t("oha.list.open")}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function OsHealthAuditView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(CONTROL_TOWER_EVENT, bump);
    window.addEventListener(OS_HEALTH_AUDIT_EVENT, bump);
    window.addEventListener(RELEASE_CHECKLIST_CHANGED_EVENT, bump);
    window.addEventListener(DAILY_PILOT_SAVED_EVENT, bump);
    window.addEventListener(DAILY_PILOT_DEBRIEF_CHANGED_EVENT, bump);
    window.addEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
    window.addEventListener(CLEAN_DAY_MODE_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(CONTROL_TOWER_EVENT, bump);
      window.removeEventListener(OS_HEALTH_AUDIT_EVENT, bump);
      window.removeEventListener(RELEASE_CHECKLIST_CHANGED_EVENT, bump);
      window.removeEventListener(DAILY_PILOT_SAVED_EVENT, bump);
      window.removeEventListener(DAILY_PILOT_DEBRIEF_CHANGED_EVENT, bump);
      window.removeEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
      window.removeEventListener(CLEAN_DAY_MODE_CHANGED_EVENT, bump);
    };
  }, []);

  const report = useMemo(() => buildOsHealthAuditReport(), [tick]);

  const releaseSummary = useMemo(() => loadLastReleaseChecklistSummary(), [tick]);

  const pilotDraft = useMemo(() => loadDailyPilotDraft(), [tick]);
  const debriefDraft = useMemo(() => loadPilotDebriefDraft(), [tick]);
  const simBack = useMemo(() => loadSimplificationBacklogState(), [tick]);
  const simTitles = useMemo(() => openCriticalHighSimplificationTitles(simBack, 6), [simBack]);
  const cleanDay = useMemo(() => getEffectiveCleanDayState(), [tick]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildOsHealthAuditMemoryPayload(report);
    saveOsHealthAuditSession(payload);
    recordGeneration({
      module: "os_health_audit",
      title: t("oha.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`oha.health.${report.overallHealth}`),
    });
    notifyOsHealthAuditUpdated();
    showToast(t("oha.toast.saved"));
  }, [report, showToast, t]);

  const saveCleanDayMemory = useCallback(() => {
    const s = getEffectiveCleanDayState();
    recordGeneration({
      module: "clean_day_mode",
      title: t("cleanDay.memory.title"),
      content: JSON.stringify(s),
      mime: "application/json",
      previewText: s.enabled
        ? t("cleanDay.memory.previewOn", { n: String(s.hiddenNavIds.length) })
        : t("cleanDay.memory.previewOff"),
    });
    showToast(t("oha.cleanDay.toast.saved"));
  }, [showToast, t]);

  const dimensions: { key: string; level: AuditHealthLevel }[] = [
    { key: "oha.dim.data", level: report.dataCompleteness },
    { key: "oha.dim.workflow", level: report.workflowContinuity },
    { key: "oha.dim.memory", level: report.memoryCoverage },
    { key: "oha.dim.economics", level: report.economicCoverage },
    { key: "oha.dim.hero", level: report.heroWorkflowCoverage },
    { key: "oha.dim.launch", level: report.launchWorkflowCoverage },
    { key: "oha.dim.execution", level: report.executionCoverage },
  ];

  return (
    <div className="oha-page">
      <header className="glass-panel oha-head">
        <p className="oha-eyebrow">{t("oha.eyebrow")}</p>
        <h1>{t("nav.osHealthAudit")}</h1>
        <p className="oha-lede">{t("oha.lede")}</p>
        <p className="oha-manual-tag">{t("oha.manualTag")}</p>
        <div className="oha-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("oha.action.save")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(JSON.stringify(report, null, 2))}
          >
            {t("oha.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("controlTower")}>
            {t("oha.link.controlTower")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("guidedSetup")}>
            {t("oha.link.guidedSetup")}
          </button>
        </div>
      </header>

      {toast ? <p className="oha-toast">{toast}</p> : null}

      <section className="glass-panel oha-sec oha-sec--hero">
        <span className={`oha-overall ${healthClass(report.overallHealth)}`}>
          {t(`oha.health.${report.overallHealth}`)}
        </span>
        <div className="oha-dims">
          {dimensions.map((d) => (
            <p key={d.key}>
              <strong>{t(d.key)}:</strong> <span className={healthClass(d.level)}>{t(`oha.health.${d.level}`)}</span>
            </p>
          ))}
        </div>
        <p className="oha-conf">{t(report.confidenceNoteKey)}</p>
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.warmup")}</h2>
        <p>
          {report.warmupStatus === "never"
            ? t("oha.warmup.never")
            : t("oha.warmup.status", {
                status: t(`oha.warmup.status.${report.warmupStatus}`),
              })}
        </p>
        {report.warmupFailedReports.length > 0 ? (
          <p className="oha-warmup-fail">
            {t("oha.warmup.failed", {
              reports: report.warmupFailedReports.map((id) => t(`warmup.report.${id}`)).join(", "),
            })}
          </p>
        ) : null}
        {report.warmupStaleReports.length > 0 ? (
          <p className="oha-warmup-stale">
            {t("oha.warmup.stale", {
              reports: report.warmupStaleReports.map((id) => t(`warmup.report.${id}`)).join(", "),
            })}
          </p>
        ) : null}
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.releaseCheck")}</h2>
        {!releaseSummary ? (
          <p className="oha-empty">{t("oha.releaseCheck.none")}</p>
        ) : (
          <p className="oha-release-line">
            {t("oha.releaseCheck.line", {
              label: releaseSummary.releaseLabel,
              verdict: t("rel.verdict." + releaseSummary.verdict),
              failed: String(releaseSummary.failedItems.length),
              time: new Date(releaseSummary.updatedAt).toLocaleString(),
            })}
          </p>
        )}
        <div className="oha-head__actions" style={{ marginTop: 10 }}>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("releaseCheck")}>
            {t("nav.releaseCheck")}
          </button>
        </div>
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.dailyPilot")}</h2>
        {!pilotDraft ? (
          <p className="oha-empty">{t("oha.dailyPilot.none")}</p>
        ) : (
          <p className="oha-release-line">
            {t("oha.dailyPilot.verdictLine", {
              verdict: t("dopilot.verdict." + pilotDraft.finalVerdict),
            })}
          </p>
        )}
        {pilotDraft && pilotDraft.confusingScreens.length >= DAILY_PILOT_CONFUSING_WARN_THRESHOLD ? (
          <p className="oha-warns">
            {t("oha.dailyPilot.complexityWarn", { n: String(pilotDraft.confusingScreens.length) })}
          </p>
        ) : null}
        {!debriefDraft ? (
          <p className="oha-empty">{t("oha.dailyPilot.debriefNone")}</p>
        ) : (
          <p className="oha-conf">
            {t("oha.dailyPilot.fixesLine", {
              text: excerptDebriefFixes(debriefDraft.recommendedFixes, 4) || "—",
            })}
          </p>
        )}
        <div className="oha-head__actions" style={{ marginTop: 10 }}>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("dailyPilot")}>
            {t("nav.dailyPilot")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("pilotDebrief")}>
            {t("nav.pilotDebrief")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("osSimplification")}>
            {t("nav.osSimplification")}
          </button>
        </div>
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.simplificationBacklog")}</h2>
        {!simBack?.items.length ? (
          <p className="oha-empty">{t("oha.simplification.none")}</p>
        ) : simTitles.length ? (
          <ul className="oha-warns">
            {simTitles.map((title, i) => (
              <li key={`${title}-${i}`}>{title}</li>
            ))}
          </ul>
        ) : (
          <p className="oha-empty">{t("oha.simplification.noOpenHigh")}</p>
        )}
        <div className="oha-head__actions" style={{ marginTop: 10 }}>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("osSimplification")}>
            {t("nav.osSimplification")}
          </button>
        </div>
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.cleanDay")}</h2>
        <p className="oha-release-line">
          {cleanDay.enabled
            ? t("oha.cleanDay.on", { n: String(cleanDay.hiddenNavIds.length) })
            : t("oha.cleanDay.off")}
        </p>
        <div className="oha-head__actions" style={{ marginTop: 10 }}>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("osSimplification")}>
            {t("oha.cleanDay.linkSimplification")}
          </button>
          <button type="button" className="primary-btn" onClick={saveCleanDayMemory}>
            {t("oha.cleanDay.save")}
          </button>
        </div>
      </section>

      {report.reliabilityWarningKeys.length ? (
        <section className="glass-panel oha-sec">
          <h2>{t("oha.section.warnings")}</h2>
          <ul className="oha-warns">
            {report.reliabilityWarningKeys.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.missing")}</h2>
        <FindingList items={report.missingInputs} t={t} onNavigate={onNavigate} />
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.stale")}</h2>
        <FindingList items={report.staleAreas} t={t} onNavigate={onNavigate} />
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.disconnected")}</h2>
        <FindingList items={report.disconnectedModules} t={t} onNavigate={onNavigate} />
      </section>

      <section className="glass-panel oha-sec">
        <h2>{t("oha.section.fixes")}</h2>
        <ul className="oha-fixes">
          {report.recommendedFixKeys.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>

      {report.manualAssumptionKeys.length ? (
        <section className="glass-panel oha-sec">
          <h2>{t("oha.section.assumptions")}</h2>
          <ul className="oha-assumptions">
            {report.manualAssumptionKeys.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <style>{`
        .oha-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .oha-head { padding: 14px 16px; }
        .oha-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; }
        .oha-lede { margin: 6px 0 8px; opacity: 0.85; font-size: 0.9rem; line-height: 1.45; }
        .oha-manual-tag { margin: 0 0 10px; font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; }
        .oha-head__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .oha-sec { padding: 14px 16px; }
        .oha-overall { display: inline-block; font-weight: 700; font-size: 1.1rem; margin-bottom: 12px; padding: 4px 10px; border-radius: 6px; }
        .oha-dims { display: grid; gap: 4px; font-size: 0.88rem; margin-bottom: 10px; }
        .oha-health--strong { color: #9fd4a8; }
        .oha-health--adequate { color: #a8c8e8; }
        .oha-health--weak { color: #e8c878; }
        .oha-health--fragile { color: #e8a070; }
        .oha-health--incomplete { color: #e89090; }
        .oha-warns, .oha-fixes, .oha-assumptions { margin: 0; padding-left: 18px; font-size: 0.88rem; }
        .oha-warns { color: #e8b090; }
        .oha-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
        .oha-list__btn { width: 100%; display: flex; justify-content: space-between; gap: 8px; padding: 8px 10px; text-align: left; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; color: inherit; font: inherit; }
        .oha-list__open { font-size: 0.72rem; opacity: 0.55; text-transform: uppercase; }
        .oha-empty { margin: 0; opacity: 0.7; font-size: 0.88rem; }
        .oha-conf { margin: 0; font-size: 0.78rem; opacity: 0.7; }
        .oha-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
      `}</style>
    </div>
  );
}
