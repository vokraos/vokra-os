import { useCallback, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import {
  buildIntegrationReadinessMarkdown,
  buildIntegrationReadinessMemoryPayload,
  buildIntegrationReadinessPlain,
  buildIntegrationReadinessReport,
  saveIntegrationReadinessSession,
} from "../lib/marketplace-integration-prep";

type Props = { onNavigate: (id: NavId) => void };

export function IntegrationReadinessView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [toast, setToast] = useState<string | null>(null);

  const report = useMemo(() => buildIntegrationReadinessReport(t, locale), [t, locale]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    const payload = buildIntegrationReadinessMemoryPayload(report);
    saveIntegrationReadinessSession(payload);
    recordGeneration({
      module: "integration_readiness",
      title: t("iready.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`iready.level.${report.readinessLevel}`),
    });
    showToast(t("iready.toast.saved"));
  }, [report, showToast, t]);

  return (
    <div className="iready-page">
      <header className="glass-panel iready-head">
        <p className="iready-eyebrow">{t("iready.eyebrow")}</p>
        <h1>{t("nav.integrationReadiness")}</h1>
        <p className="iready-lede">{t("iready.lede")}</p>
        <p className="iready-date">{report.dateLabel}</p>
        <p className={`iready-pill iready-pill--${report.readinessLevel}`}>
          {t("iready.field.readiness")}: {t(`iready.level.${report.readinessLevel}`)}
        </p>
        <p className="iready-conf">{t(report.confidenceNote)}</p>
        <p className="iready-arch">{t("iready.archNotice")}</p>
        <div className="iready-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("iready.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(buildIntegrationReadinessPlain(report, t))}>
            {t("iready.action.copy")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadText(`integration-readiness-${report.id}.md`, buildIntegrationReadinessMarkdown(report, t))}
          >
            {t("iready.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`integration-readiness-${report.id}.json`, report)}>
            {t("iready.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="iready-toast">{toast}</p> : null}

      <section className="glass-panel iready-sec">
        <h2>{t("iready.section.connections")}</h2>
        <div className="iready-conn-grid">
          {report.connections.map((c) => (
            <article key={c.id} className="iready-conn">
              <h3>{t(`iready.marketplace.${c.marketplace}`)}</h3>
              <p className="iready-meta">
                {t(`iready.state.${c.connectionState}`)} · {t(`iready.purpose.${c.connectionPurpose}`)}
              </p>
              <p className="iready-notes">{c.notes}</p>
              <p className="iready-domains">
                {c.supportedDomains.map((d) => t(`iready.domain.${d}`)).join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel iready-sec">
        <h2>{t("iready.section.checks")}</h2>
        <ul className="iready-checks">
          {report.readinessChecks.map((ch) => (
            <li key={ch.id} className={ch.passed ? "iready-check--ok" : "iready-check--fail"}>
              <span>{t(ch.labelKey)}</span>
              <span className="iready-check__detail">{t(ch.detailKey)}</span>
              {ch.navId ? (
                <button type="button" className="ghost-btn iready-check__go" onClick={() => onNavigate(ch.navId!)}>
                  {t("iready.action.open")}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {report.readinessBlockers.length ? (
        <section className="glass-panel iready-sec iready-sec--warn">
          <h2>{t("iready.section.blockers")}</h2>
          <ul className="iready-list">
            {report.readinessBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="iready-split">
        <section className="glass-panel iready-sec">
          <h2>{t("iready.section.syncRisks")}</h2>
          <ul className="iready-list">
            {report.syncRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
        <section className="glass-panel iready-sec">
          <h2>{t("iready.section.opRisks")}</h2>
          <ul className="iready-list">
            {report.operationalRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass-panel iready-sec">
        <h2>{t("iready.section.roadmap")}</h2>
        <ol className="iready-roadmap">
          {report.roadmap.map((p) => (
            <li key={p.domain} className={p.blocked ? "iready-roadmap--blocked" : ""}>
              <span className="iready-roadmap__n">{p.order}</span>
              <div>
                <strong>{t(p.titleKey)}</strong>
                <p>{t(p.whyKey)}</p>
                {p.blocked ? <em>{t("iready.roadmap.blocked")}</em> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass-panel iready-sec">
        <h2>{t("iready.section.domains")}</h2>
        <table className="iready-table">
          <thead>
            <tr>
              <th>{t("iready.col.domain")}</th>
              <th>{t("iready.col.source")}</th>
              <th>{t("iready.col.direction")}</th>
              <th>{t("iready.col.risk")}</th>
            </tr>
          </thead>
          <tbody>
            {report.domains.map((d) => (
              <tr key={d.id}>
                <td>
                  {t(`iready.domain.${d.id}`)}
                  {d.navHint ? (
                    <button type="button" className="iready-link" onClick={() => onNavigate(d.navHint!)}>
                      →
                    </button>
                  ) : null}
                </td>
                <td>{t(`iready.source.${d.sourceOfTruth}`)}</td>
                <td>{t(`iready.direction.${d.syncDirection}`)}</td>
                <td>{t(`iready.syncRisk.${d.syncRisk}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="glass-panel iready-sec">
        <h2>{t("iready.section.imports")}</h2>
        <ul className="iready-list iready-list--compact">
          {report.importSources.map((s) => (
            <li key={s.id}>
              <strong>{t(s.importTypeKey)}</strong> → {t(s.targetModuleKey)} (
              {t(`iready.importStatus.${s.status}`)})
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel iready-sec">
        <h2>{t("iready.section.conflicts")}</h2>
        <ul className="iready-list">
          {report.conflictRules.map((r) => (
            <li key={r.id}>
              <strong>{t(`iready.domain.${r.domain}`)}</strong>: {t(r.conflictKey)} — {t(r.resolutionKey)}
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        .iready-page { max-width: 900px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .iready-head { padding: 20px; }
        .iready-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin: 0 0 6px; }
        .iready-lede { margin: 8px 0; opacity: 0.85; font-size: 14px; }
        .iready-date { font-size: 12px; opacity: 0.65; margin: 0 0 8px; }
        .iready-pill { display: inline-block; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin: 0 0 8px; }
        .iready-pill--ready_for_api_phase { background: rgba(80, 200, 120, 0.15); color: #6fd89a; }
        .iready-pill--stable_for_partial_sync { background: rgba(120, 180, 255, 0.15); color: #9ec8ff; }
        .iready-pill--risky { background: rgba(255, 200, 80, 0.12); color: #e8c46a; }
        .iready-pill--not_ready { background: rgba(255, 90, 90, 0.15); color: #ff8a8a; }
        .iready-conf, .iready-arch { font-size: 12px; opacity: 0.7; margin: 6px 0; }
        .iready-arch { color: #e8c46a; }
        .iready-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .iready-sec { padding: 16px 18px; }
        .iready-sec h2 { margin: 0 0 12px; font-size: 14px; }
        .iready-sec--warn { border-color: rgba(255, 200, 80, 0.3); }
        .iready-conn-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
        .iready-conn { padding: 12px; border-radius: 8px; border: 1px solid var(--stroke); }
        .iready-conn h3 { margin: 0 0 6px; font-size: 14px; }
        .iready-meta, .iready-notes, .iready-domains { font-size: 12px; opacity: 0.8; margin: 4px 0; }
        .iready-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .iready-checks li { display: grid; gap: 4px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--stroke); font-size: 13px; }
        .iready-check--ok { border-color: rgba(80, 200, 120, 0.35); }
        .iready-check--fail { border-color: rgba(255, 90, 90, 0.35); }
        .iready-check__detail { font-size: 12px; opacity: 0.75; }
        .iready-check__go { justify-self: start; font-size: 11px; padding: 4px 8px; }
        .iready-split { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        .iready-list { margin: 0; padding-left: 18px; font-size: 13px; }
        .iready-list--compact li { margin-bottom: 8px; }
        .iready-roadmap { margin: 0; padding-left: 0; list-style: none; display: grid; gap: 10px; }
        .iready-roadmap li { display: flex; gap: 12px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--stroke); font-size: 13px; }
        .iready-roadmap--blocked { opacity: 0.65; border-color: rgba(255, 90, 90, 0.25); }
        .iready-roadmap__n { font-weight: 700; opacity: 0.5; min-width: 20px; }
        .iready-roadmap p { margin: 4px 0 0; opacity: 0.8; font-size: 12px; }
        .iready-roadmap em { font-size: 11px; color: #ff8a8a; font-style: normal; }
        .iready-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .iready-table th, .iready-table td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--stroke); }
        .iready-link { margin-left: 6px; background: none; border: none; color: #9ec8ff; cursor: pointer; }
        .iready-toast { text-align: center; font-size: 13px; opacity: 0.85; }
      `}</style>
    </div>
  );
}
