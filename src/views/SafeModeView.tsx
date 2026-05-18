import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { useSafeMode } from "../hooks/useSafeMode";
import { loadLastRuntimeSmokeReport } from "../lib/runtime-smoke-tests";
import {
  exitSafeModeFully,
  enterSafeModeManual,
  exitSafeMode,
  clearAllOsSessionExceptEntityAndEconomics,
  clearCommandCaches,
  clearReportCaches,
  clearSessionCaches,
  clearWarmupState,
} from "../lib/safe-mode";

type Props = { onNavigate: (id: NavId) => void };

export function SafeModeView({ onNavigate }: Props) {
  const { t } = useI18n();
  const safe = useSafeMode();
  const lastSmoke = loadLastRuntimeSmokeReport();

  const exitFull = () => {
    exitSafeModeFully();
    onNavigate("home");
  };

  const retryNormal = () => {
    exitSafeMode(true);
    onNavigate("home");
  };

  const enterManual = () => {
    enterSafeModeManual();
  };

  return (
    <div className="safe-mode-page">
      <header className="glass-panel safe-mode-head">
        <p className="safe-mode-eyebrow">{t("safe.page.eyebrow")}</p>
        <h1>{t("safe.page.title")}</h1>
        <p className="safe-mode-lede">{t("safe.page.lede")}</p>
      </header>

      <section className="glass-panel safe-mode-sec">
        <h2>{t("safe.page.status")}</h2>
        <p>{safe.enabled ? t("safe.page.enabled") : t("safe.page.disabled")}</p>
        {safe.lastErrorMessage ? (
          <>
            <h3>{t("safe.page.lastError")}</h3>
            <pre className="safe-mode-pre">{safe.lastErrorMessage}</pre>
            {safe.lastErrorStack ? <pre className="safe-mode-pre">{safe.lastErrorStack.slice(0, 4000)}</pre> : null}
          </>
        ) : null}
        <h3>{t("safe.page.disabledFeatures")}</h3>
        <ul className="safe-mode-list">
          {(safe.enabled ? safe.disabledFeatures : []).map((f) => (
            <li key={f}>{f}</li>
          ))}
          {!safe.enabled ? <li className="safe-mode-muted">—</li> : null}
        </ul>
      </section>

      <section className="glass-panel safe-mode-sec">
        <h2>{t("safe.page.smoke")}</h2>
        <p className="safe-mode-lede">{t("safe.page.smokeLede")}</p>
        <div className="safe-mode-actions">
          <button type="button" className="primary-btn" onClick={() => onNavigate("systemSmokeTest")}>
            {t("safe.action.runSmokeTest")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("releaseCheck")}>
            {t("safe.action.openReleaseCheck")}
          </button>
        </div>
        {lastSmoke?.status === "failed" ? (
          <div className="safe-mode-smoke-fail">
            <h3>{t("safe.smoke.failedTitle")}</h3>
            <ul className="safe-mode-list">
              {lastSmoke.failedChecks.map((c) => (
                <li key={c.id}>
                  <strong>{c.id}</strong>
                  {c.detail ? ` — ${c.detail}` : ""}
                </li>
              ))}
            </ul>
            <p className="safe-mode-muted">{t("safe.smoke.recoveryHint")}</p>
            <div className="safe-mode-actions">
              <button type="button" className="ghost-btn" onClick={() => clearReportCaches()}>
                {t("safe.action.clearReports")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => clearWarmupState()}>
                {t("safe.action.clearWarmup")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => onNavigate("osHealthAudit")}>
                {t("nav.osHealthAudit")}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="glass-panel safe-mode-sec">
        <h2>{t("safe.page.recovery")}</h2>
        <div className="safe-mode-actions">
          <button type="button" className="ghost-btn" onClick={() => clearReportCaches()}>
            {t("safe.action.clearReports")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => clearWarmupState()}>
            {t("safe.action.clearWarmup")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => clearCommandCaches()}>
            {t("safe.action.clearCommands")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => clearSessionCaches("full_os_session")}>
            {t("safe.action.clearSessions")}
          </button>
          <button
            type="button"
            className="ghost-btn ghost-btn--danger"
            onClick={() => {
              if (window.confirm(t("safe.recovery.confirmNuclear"))) clearAllOsSessionExceptEntityAndEconomics();
            }}
          >
            {t("safe.action.clearOsSessions")}
          </button>
          <button type="button" className="primary-btn" onClick={() => window.location.reload()}>
            {t("safe.action.reload")}
          </button>
          {safe.enabled ? (
            <>
              <button type="button" className="primary-btn" onClick={retryNormal}>
                {t("safe.action.retryNormal")}
              </button>
              <button type="button" className="ghost-btn" onClick={exitFull}>
                {t("safe.action.clearIncidentLog")}
              </button>
            </>
          ) : (
            <button type="button" className="ghost-btn" onClick={enterManual}>
              {t("safe.action.enterSafeMode")}
            </button>
          )}
        </div>
      </section>

      <section className="glass-panel safe-mode-sec">
        <h2>{t("safe.page.safeNav")}</h2>
        <div className="safe-mode-nav-grid">
          {(
            [
              "guidedSetup",
              "releaseCheck",
              "osHealthAudit",
              "memory",
              "dataImport",
              "unitEconomics",
              "productionPressure",
            ] as const
          ).map((id) => (
            <button key={id} type="button" className="safe-mode-nav-btn" onClick={() => onNavigate(id)}>
              {t(`nav.${id}`)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
