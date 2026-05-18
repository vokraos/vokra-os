import { useI18n } from "../lib/i18n/I18nContext";

export function AnalyticsView() {
  const { t } = useI18n();
  return (
    <div className="view">
      <header className="view__header">
        <p className="eyebrow">{t("analytics.eyebrow")}</p>
        <h2 className="view__title">{t("analytics.title")}</h2>
        <p className="view__desc">{t("analytics.desc")}</p>
      </header>
      <div className="analytics-grid">
        <article className="glass-panel glass-panel--hover analytics-chart">
          <div className="chart-head">
            <h3 className="chart-title">{t("analytics.sources")}</h3>
            <span className="chart-pill">{t("analytics.offline")}</span>
          </div>
          <div className="empty">
            <p className="empty__title">{t("analytics.emptyTitle")}</p>
            <p className="empty__hint">{t("analytics.emptyHint")}</p>
          </div>
        </article>
      </div>
      <style>{`
        .view__header {
          margin-bottom: 22px;
        }
        .view__title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          margin-bottom: 8px;
        }
        .view__desc {
          max-width: 560px;
          margin: 0;
        }
        .analytics-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .analytics-chart {
          grid-column: span 3;
          padding: 22px;
        }
        .chart-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .chart-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
        }
        .chart-pill {
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 99px;
          border: 1px solid var(--stroke);
          color: var(--muted);
        }
        .empty {
          border-radius: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.22);
          padding: 18px;
        }
        .empty__title {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: var(--text);
        }
        .empty__hint {
          margin: 0;
          color: var(--muted);
          font-size: 0.92rem;
          max-width: 760px;
        }
        @media (max-width: 960px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          .analytics-chart {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
