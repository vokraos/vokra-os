import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type ExecutiveSurfaceTone = "mission" | "dashboard" | "orchestrator";

type Props = { tone: ExecutiveSurfaceTone };

/**
 * Single executive band: next move, risk, forbidden, bottleneck, impact, readiness.
 * Uses `useExecutiveDecisionBoard` + regime from cognitive OS — no extra engines.
 */
export function ExecutiveSurface({ tone }: Props) {
  const { t } = useI18n();
  const edc = useExecutiveDecisionBoard();
  const { regime } = useCognitiveOs();

  return (
    <>
      <section className={`exs exs--${tone}`} aria-label={t("execSurface.aria")}>
        <header className="exs__head">
          <span className="exs__title">{t("execSurface.title")}</span>
          <span className="exs__regime" title={t("execSurface.regimeHint")}>
            {regime}
          </span>
        </header>
        <div className="exs__grid">
          <div className="exs__cell exs__cell--accent">
            <span className="exs__k">{t("execSurface.next")}</span>
            <p className="exs__v">{clip(edc.bestNext, 128)}</p>
          </div>
          <div className="exs__cell exs__cell--risk">
            <span className="exs__k">{t("execSurface.risk")}</span>
            <p className="exs__v">{clip(edc.risks[0] ?? "", 112)}</p>
          </div>
          <div className="exs__cell exs__cell--warn">
            <span className="exs__k">{t("execSurface.forbidden")}</span>
            <p className="exs__v">{clip(edc.forbidden[0] ?? "", 112)}</p>
          </div>
          <div className="exs__cell exs__cell--block">
            <span className="exs__k">{t("execSurface.bottleneck")}</span>
            <p className="exs__v">{edc.bottleneck}</p>
          </div>
          <div className="exs__cell">
            <span className="exs__k">{t("execSurface.impact")}</span>
            <p className="exs__v">{clip(edc.expectedImpact, 112)}</p>
          </div>
          <div className="exs__cell exs__cell--ready">
            <span className="exs__k">{t("execSurface.readiness")}</span>
            <p className="exs__v exs__v--nums">{clip(edc.readinessLine, 132)}</p>
          </div>
        </div>
      </section>
      <style>{`
        .exs {
          position: relative;
          z-index: 4;
          max-height: min(25vh, 320px);
          box-sizing: border-box;
          padding: 12px 14px 14px;
          margin: 0 0 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(4, 7, 14, 0.72);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .exs--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .exs--orchestrator {
          z-index: 2;
          border-color: rgba(118, 138, 210, 0.22);
          background: rgba(0, 0, 0, 0.45);
        }
        .exs--dashboard {
          margin-bottom: 18px;
        }
        .exs__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .exs__title {
          font-size: 0.52rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(150, 162, 190, 0.75);
        }
        .exs__regime {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(123, 143, 255, 0.85);
          white-space: nowrap;
        }
        .exs__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px 14px;
        }
        @media (max-width: 900px) {
          .exs__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .exs__grid {
            grid-template-columns: 1fr;
          }
        }
        .exs__cell {
          min-width: 0;
        }
        .exs__k {
          display: block;
          margin-bottom: 5px;
          font-size: 0.52rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.65);
        }
        .exs__v {
          margin: 0;
          font-size: 0.76rem;
          line-height: 1.38;
          color: rgba(210, 218, 238, 0.94);
        }
        .exs__v--nums {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
        }
        .exs__cell--accent .exs__v {
          font-weight: 600;
          color: rgba(238, 242, 255, 0.98);
        }
        .exs__cell--risk .exs__v {
          color: rgba(255, 210, 195, 0.92);
        }
        .exs__cell--block .exs__v {
          color: rgba(255, 205, 185, 0.9);
        }
        .exs__cell--warn .exs__v {
          color: rgba(255, 188, 188, 0.9);
        }
        .exs__cell--ready .exs__v {
          color: rgba(185, 205, 235, 0.92);
        }
      `}</style>
    </>
  );
}
