import type { VisualAnalysisMeta } from "../../lib/visual/types";
import { useI18n } from "../../lib/i18n/I18nContext";

type Props = { meta: VisualAnalysisMeta };

export function VisualMetaPanel({ meta }: Props) {
  const { t } = useI18n();
  return (
    <div className="vmeta glass-panel">
      <div className="vmeta__grid">
        <div>
          <p className="vmeta__k">{t("visual.metaScene")}</p>
          <p className="vmeta__v">{meta.detectedScene || "—"}</p>
        </div>
        <div>
          <p className="vmeta__k">{t("visual.metaLikelihood")}</p>
          <p className="vmeta__v vmeta__v--score">{meta.wbOzonScreenshotLikelihood}</p>
        </div>
        <div className="vmeta__full">
          <p className="vmeta__k">{t("visual.metaRoles")}</p>
          <div className="vmeta__chips">
            {meta.inferredAssetRoles.length ? (
              meta.inferredAssetRoles.map((r, i) => (
                <span key={i} className="vmeta__chip">
                  {r}
                </span>
              ))
            ) : (
              <span className="vmeta__muted">—</span>
            )}
          </div>
        </div>
        <div className="vmeta__full">
          <p className="vmeta__k">{t("visual.metaNote")}</p>
          <p className="vmeta__note">{meta.notesForCreativeDirector}</p>
        </div>
      </div>
      <style>{`
        .vmeta {
          padding: 20px 22px;
        }
        .vmeta__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px 24px;
        }
        .vmeta__full {
          grid-column: 1 / -1;
        }
        @media (max-width: 640px) {
          .vmeta__grid {
            grid-template-columns: 1fr;
          }
        }
        .vmeta__k {
          margin: 0 0 6px;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .vmeta__v {
          margin: 0;
          font-size: 1rem;
          color: var(--text);
        }
        .vmeta__v--score {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--accent);
        }
        .vmeta__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .vmeta__chip {
          font-size: 0.78rem;
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid var(--stroke);
          color: var(--muted);
        }
        .vmeta__muted {
          color: var(--faint);
          font-size: 0.88rem;
        }
        .vmeta__note {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.6;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
