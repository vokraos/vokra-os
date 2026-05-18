import type { VisualRecommendation } from "../../lib/visual/types";
import { useI18n } from "../../lib/i18n/I18nContext";

type Props = { items: VisualRecommendation[] };

function priClass(p: VisualRecommendation["priority"]) {
  if (p === "high") return "vr-pill--high";
  if (p === "medium") return "vr-pill--mid";
  return "vr-pill--low";
}

export function VisualRecommendations({ items }: Props) {
  const { t } = useI18n();
  return (
    <div className="vr glass-panel">
      <header className="vr__head">
        <h3 className="vr__title">{t("visual.recTitle")}</h3>
        <p className="vr__hint">{t("visual.recHint")}</p>
      </header>
      <ul className="vr__list">
        {items.map((r, i) => (
          <li key={i} className="vr__item glass-panel--hover">
            <div className="vr__row">
              <span className={`vr-pill ${priClass(r.priority)}`}>{r.priority}</span>
              <p className="vr__action">{r.action}</p>
            </div>
            <p className="vr__why">{r.rationale}</p>
          </li>
        ))}
      </ul>
      <style>{`
        .vr {
          padding: 22px 24px;
        }
        .vr__head {
          margin-bottom: 18px;
        }
        .vr__title {
          margin: 0 0 6px;
          font-family: var(--font-display);
          font-size: 1.05rem;
        }
        .vr__hint {
          margin: 0;
          font-size: 0.82rem;
          color: var(--muted);
        }
        .vr__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vr__item {
          border: 1px solid var(--stroke);
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.2);
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        .vr__item:hover {
          border-color: rgba(123, 143, 255, 0.25);
          transform: translateY(-1px);
        }
        .vr__row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        .vr-pill {
          flex-shrink: 0;
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 99px;
          border: 1px solid var(--stroke);
        }
        .vr-pill--high {
          border-color: rgba(255, 120, 120, 0.45);
          color: rgba(255, 200, 200, 0.95);
        }
        .vr-pill--mid {
          border-color: rgba(123, 143, 255, 0.35);
          color: var(--muted);
        }
        .vr-pill--low {
          color: var(--faint);
        }
        .vr__action {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text);
          font-weight: 600;
        }
        .vr__why {
          margin: 0;
          font-size: 0.86rem;
          line-height: 1.5;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
