import { useCallback } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import type { NavId } from "../types";
import {
  clearAllOsSessionExceptEntityAndEconomics,
  clearCommandCaches,
  clearReportCaches,
  clearSessionCaches,
  clearWarmupState,
  patchSafeModeFeatures,
  ALL_SAFE_MODE_DISABLED_FEATURES,
  type SafeModeDisabledFeature,
} from "../lib/safe-mode";

type Props = {
  error: Error;
  componentStack: string | null;
  onContinueInSafeMode: () => void;
};

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n…`;
}

export function ErrorRecoveryPanel({ error, componentStack, onContinueInSafeMode }: Props) {
  const { t } = useI18n();

  const copyReport = useCallback(() => {
    const payload = {
      message: error.message,
      stack: error.stack ?? null,
      componentStack,
      time: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
    void navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  }, [error.message, error.stack, componentStack]);

  const reload = () => {
    window.location.reload();
  };

  const reenableWarmup = () => {
    const next = ALL_SAFE_MODE_DISABLED_FEATURES.filter((x) => x !== "report_warmup") as SafeModeDisabledFeature[];
    patchSafeModeFeatures(next);
  };

  const onClearReports = () => {
    clearReportCaches();
    clearWarmupState();
  };

  const onClearCommands = () => {
    clearCommandCaches();
  };

  const onClearSessions = () => {
    clearSessionCaches("full_os_session");
    clearWarmupState();
  };

  const onNuclearSessions = () => {
    if (window.confirm(t("safe.recovery.confirmNuclear"))) {
      clearAllOsSessionExceptEntityAndEconomics();
      clearWarmupState();
    }
  };

  const go = (id: NavId) => {
    window.dispatchEvent(new CustomEvent("vokra:navigate-request", { detail: { id } }));
  };

  return (
    <div className="error-recovery-root" role="alert">
      <div className="error-recovery-panel glass-panel">
        <p className="error-recovery-eyebrow">{t("safe.recovery.eyebrow")}</p>
        <h1 className="error-recovery-title">{t("safe.recovery.title")}</h1>
        <p className="error-recovery-lede">{t("safe.recovery.lede")}</p>
        <p className="error-recovery-msg">{error.message || String(error)}</p>
        <pre className="error-recovery-stack">{clip(error.stack ?? "", 3500)}</pre>
        {componentStack ? (
          <pre className="error-recovery-stack error-recovery-stack--cmp">{clip(componentStack, 2000)}</pre>
        ) : null}
        <p className="error-recovery-note">{t("safe.recovery.consoleNote")}</p>
        <div className="error-recovery-actions">
          <button type="button" className="primary-btn" onClick={onContinueInSafeMode}>
            {t("safe.recovery.continueSafe")}
          </button>
          <button type="button" className="ghost-btn" onClick={onClearReports}>
            {t("safe.action.clearReports")}
          </button>
          <button type="button" className="ghost-btn" onClick={onClearCommands}>
            {t("safe.action.clearCommands")}
          </button>
          <button type="button" className="ghost-btn" onClick={onClearSessions}>
            {t("safe.action.clearSessions")}
          </button>
          <button type="button" className="ghost-btn" onClick={reenableWarmup}>
            {t("safe.action.reenableWarmup")}
          </button>
          <button type="button" className="ghost-btn" onClick={reload}>
            {t("safe.action.reload")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyReport()}>
            {t("safe.action.copyReport")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--danger" onClick={onNuclearSessions}>
            {t("safe.action.clearOsSessions")}
          </button>
        </div>
        <div className="error-recovery-links">
          <span className="error-recovery-links-label">{t("safe.recovery.safePages")}</span>
          <button type="button" className="link-btn" onClick={() => go("guidedSetup")}>
            {t("nav.guidedSetup")}
          </button>
          <button type="button" className="link-btn" onClick={() => go("osHealthAudit")}>
            {t("nav.osHealthAudit")}
          </button>
          <button type="button" className="link-btn" onClick={() => go("memory")}>
            {t("nav.memory")}
          </button>
          <button type="button" className="link-btn" onClick={() => go("dataImport")}>
            {t("nav.dataImport")}
          </button>
          <button type="button" className="link-btn" onClick={() => go("unitEconomics")}>
            {t("nav.unitEconomics")}
          </button>
          <button type="button" className="link-btn" onClick={() => go("productionPressure")}>
            {t("nav.productionPressure")}
          </button>
          <button type="button" className="link-btn" onClick={() => go("safeMode")}>
            {t("nav.safeMode")}
          </button>
        </div>
      </div>
    </div>
  );
}
