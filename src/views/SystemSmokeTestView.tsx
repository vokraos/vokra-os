import { useCallback, useEffect, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import {
  formatSmokeReportPlain,
  loadLastRuntimeSmokeReport,
  runRuntimeSmokeTests,
  stringifySmokeReport,
  takeRuntimeSmokeReportRestore,
  type RuntimeSmokeTestReport,
} from "../lib/runtime-smoke-tests";

type Props = { onNavigate: (id: NavId) => void };

export function SystemSmokeTestView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [report, setReport] = useState<RuntimeSmokeTestReport | null>(() => loadLastRuntimeSmokeReport());
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = takeRuntimeSmokeReportRestore();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as RuntimeSmokeTestReport;
      if (parsed?.id && Array.isArray(parsed.checks)) {
        setReport(parsed);
        setToast(t("smoke.toast.restored"));
      }
    } catch {
      setToast(t("smoke.toast.restoreFail"));
    }
  }, [t]);

  const run = useCallback(() => {
    setRunning(true);
    setToast(null);
    try {
      const next = runRuntimeSmokeTests({ locale, forceWarmup: true });
      setReport(next);
      setToast(t("smoke.toast.done"));
    } catch (e) {
      console.error("[SystemSmokeTest]", e);
      setToast(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, [locale, t]);

  const copyPlain = useCallback(() => {
    if (!report) return;
    void navigator.clipboard?.writeText(formatSmokeReportPlain(report, t));
    setToast(t("smoke.toast.copied"));
  }, [report, t]);

  const copyJson = useCallback(() => {
    if (!report) return;
    void navigator.clipboard?.writeText(stringifySmokeReport(report));
    setToast(t("smoke.toast.copiedJson"));
  }, [report, t]);

  const saveMemory = useCallback(() => {
    if (!report) return;
    recordGeneration({
      module: "runtime_smoke_test",
      title: `${t("smoke.page.title")} · ${report.status} · ${new Date(report.createdAt).toLocaleString()}`,
      content: stringifySmokeReport(report),
      mime: "application/json",
      tags: ["smoke", report.status],
    });
    setToast(t("smoke.toast.savedMemory"));
  }, [report, t]);

  return (
    <div className="smoke-test-page">
      <header className="glass-panel smoke-test-head">
        <p className="smoke-test-eyebrow">{t("smoke.page.eyebrow")}</p>
        <h1>{t("smoke.page.title")}</h1>
        <p className="smoke-test-lede">{t("smoke.page.lede")}</p>
        <div className="smoke-test-actions">
          <button type="button" className="primary-btn" disabled={running} onClick={run}>
            {running ? t("smoke.action.running") : t("smoke.action.run")}
          </button>
          <button type="button" className="ghost-btn" disabled={!report} onClick={copyPlain}>
            {t("smoke.action.copyPlain")}
          </button>
          <button type="button" className="ghost-btn" disabled={!report} onClick={copyJson}>
            {t("smoke.action.copyJson")}
          </button>
          <button type="button" className="ghost-btn" disabled={!report} onClick={saveMemory}>
            {t("smoke.action.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("osHealthAudit")}>
            {t("nav.osHealthAudit")}
          </button>
        </div>
        {toast ? <p className="smoke-test-toast">{toast}</p> : null}
      </header>

      {report ? (
        <section className="glass-panel smoke-test-summary" data-smoke-status={report.status}>
          <h2>{t("smoke.section.summary")}</h2>
          <p className="smoke-test-confidence">{t(report.confidenceNoteKey)}</p>
          <dl className="smoke-test-stats">
            <div>
              <dt>{t("smoke.stat.passed")}</dt>
              <dd>{report.passedChecks.length}</dd>
            </div>
            <div>
              <dt>{t("smoke.stat.failed")}</dt>
              <dd>{report.failedChecks.length}</dd>
            </div>
            <div>
              <dt>{t("smoke.stat.skipped")}</dt>
              <dd>{report.skippedChecks.length}</dd>
            </div>
            <div>
              <dt>{t("smoke.stat.duration")}</dt>
              <dd>{report.durationMs} ms</dd>
            </div>
          </dl>

          <h3>{t("smoke.section.checks")}</h3>
          <ul className="smoke-test-checks">
            {report.checks.map((c) => (
              <li key={c.id} className={`smoke-test-check smoke-test-check--${c.status}`}>
                <span className="smoke-test-check__id">{t(c.labelKey)}</span>
                <span className="smoke-test-check__st">{c.status}</span>
                <span className="smoke-test-check__ms">{c.durationMs}ms</span>
                {c.detail ? <pre className="smoke-test-check__detail">{c.detail}</pre> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="smoke-test-empty glass-panel">{t("smoke.page.empty")}</p>
      )}
    </div>
  );
}
