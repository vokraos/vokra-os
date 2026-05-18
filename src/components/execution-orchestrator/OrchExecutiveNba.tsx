import { useI18n } from "../../lib/i18n/I18nContext";
import type { Blocker, ExecutionRoute } from "../../lib/execution-orchestrator/types";

function parseAction(str: string): { headline: string; firstStep: string } {
  const re = /(?:Следующий шаг|следующий шаг)\s*:\s*([\s\S]+)/;
  const m = re.exec(str);
  if (m && m.index != null) {
    const head = str.slice(0, m.index).replace(/\s+/g, " ").trim().replace(/[.;:]+$/g, "").trim();
    return { headline: head || str.trim(), firstStep: m[1]!.trim() };
  }
  const dot = str.indexOf(". ");
  if (dot > 24 && dot < str.length - 8) {
    return { headline: str.slice(0, dot).trim(), firstStep: str.slice(dot + 2).trim() };
  }
  return { headline: str.trim(), firstStep: "" };
}

type Props = {
  primary: ExecutionRoute;
  nextGlobalRu: string;
  blockers: readonly Blocker[];
};

export function OrchExecutiveNba({ primary, nextGlobalRu, blockers }: Props) {
  const { t } = useI18n();
  const text = nextGlobalRu || primary.nextActionRu;
  const { headline, firstStep } = parseAction(text);
  const blockLines = [...primary.blockersRu, ...blockers.map((b) => b.labelRu)].filter(Boolean).slice(0, 3);

  return (
    <section className="orch-nba glass-panel" aria-label={t("orch.nbaAria")}>
      <div className="orch-nba__grid">
        <div className="orch-nba__main">
          <p className="orch-nba__k">{t("orch.nbaDirective")}</p>
          <p className="orch-nba__action">{headline || text}</p>
          {firstStep ? (
            <div className="orch-nba__step">
              <span className="orch-nba__sk">{t("orch.nbaFirstStep")}</span>
              <p>{firstStep}</p>
            </div>
          ) : null}
        </div>
        <div className="orch-nba__side">
          <div className="orch-nba__cell">
            <span className="orch-nba__sk">{t("orch.nbaWhyNow")}</span>
            <p>{primary.reasonRu.length > 140 ? `${primary.reasonRu.slice(0, 137)}…` : primary.reasonRu}</p>
          </div>
          <div className="orch-nba__cell">
            <span className="orch-nba__sk">{t("orch.nbaBlocks")}</span>
            <p>{blockLines.length ? blockLines.join(" · ") : "—"}</p>
          </div>
          <div className="orch-nba__cell">
            <span className="orch-nba__sk">{t("orch.nbaImpact")}</span>
            <p>{primary.expectedImpactRu.length > 120 ? `${primary.expectedImpactRu.slice(0, 117)}…` : primary.expectedImpactRu}</p>
          </div>
        </div>
      </div>
      <style>{`
        .orch-nba {
          padding: 20px 22px 22px;
          margin-bottom: 16px;
          border-radius: var(--radius-xl, 14px);
          border: 1px solid rgba(125, 145, 210, 0.18);
          background: radial-gradient(120% 90% at 12% 0%, rgba(72, 82, 118, 0.35), rgba(6, 8, 12, 0.94));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .orch-nba__grid {
          display: grid;
          grid-template-columns: 1.25fr 0.95fr;
          gap: 20px;
        }
        @media (max-width: 820px) {
          .orch-nba__grid {
            grid-template-columns: 1fr;
          }
        }
        .orch-nba__k {
          margin: 0 0 10px;
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(140, 152, 180, 0.55);
        }
        .orch-nba__action {
          margin: 0 0 14px;
          font-size: clamp(1rem, 2.2vw, 1.22rem);
          line-height: 1.35;
          font-weight: 600;
          color: rgba(228, 232, 244, 0.96);
        }
        .orch-nba__step {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .orch-nba__step p {
          margin: 6px 0 0;
          font-size: 0.82rem;
          line-height: 1.45;
          color: rgba(175, 186, 212, 0.88);
        }
        .orch-nba__side {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .orch-nba__cell p {
          margin: 6px 0 0;
          font-size: 0.74rem;
          line-height: 1.4;
          color: rgba(155, 166, 192, 0.78);
        }
        .orch-nba__sk {
          display: block;
          font-size: 0.52rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(120, 130, 155, 0.55);
        }
      `}</style>
    </section>
  );
}
