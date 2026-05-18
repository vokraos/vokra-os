import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { ExecutionStage } from "../../lib/execution-orchestrator/types";
import { SYSTEM_LABEL_RU } from "../../lib/execution-orchestrator/types";
import { deriveStageOperationalTiming } from "../../lib/operational-timing";

type Props = {
  stages: readonly ExecutionStage[];
  expectedImpactRu: string;
  risksRu: string;
  consequenceKey: string;
};

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function ExecutionChain({ stages, expectedImpactRu, risksRu, consequenceKey }: Props) {
  const { t } = useI18n();

  const impactFoot = useMemo(() => clip(expectedImpactRu, 140), [expectedImpactRu]);
  const riskFoot = useMemo(() => clip(risksRu, 120), [risksRu]);
  const consFoot = useMemo(() => clip(t(consequenceKey), 130), [t, consequenceKey]);

  return (
    <>
      <div className="exchain" aria-label={t("orch.chainAria")}>
        <div className="exchain__track">
          {stages.map((st, i) => {
            const posture = deriveStageOperationalTiming(st);
            return (
              <div key={st.index} className="exchain__step">
                {i > 0 ? <span className="exchain__arrow" aria-hidden /> : null}
                <article className={`exchain__node exchain__node--${posture}`}>
                  <span className="exchain__badge">{t(`timing.posture.${posture}`)}</span>
                  <p className="exchain__name">{st.nameRu}</p>
                  <p className="exchain__meta">
                    <span className="exchain__owner">{SYSTEM_LABEL_RU[st.owner]}</span>
                    <span className="exchain__sep">·</span>
                    <span className="exchain__dep">{clip(st.dependencyRu, 64)}</span>
                  </p>
                  <p className="exchain__touch">
                    {st.tasks[0]?.labelRu ? `${t("orch.chain.touch")} ${clip(st.tasks[0].labelRu, 52)}` : clip(st.dependencyRu, 52)}
                  </p>
                  <p className="exchain__risk">
                    {t("orch.chain.opsRisk")} {st.pressure}% · {t("orch.chain.conf")} {st.confidence}%
                  </p>
                </article>
              </div>
            );
          })}
        </div>
        <footer className="exchain__foot">
          <p>
            <span className="exchain__fk">{t("orch.chainOpsConsequence")}</span> {consFoot}
          </p>
          <p>
            <span className="exchain__fk">{t("orch.chain.routeImpact")}</span> {impactFoot}
          </p>
          <p>
            <span className="exchain__fk">{t("orch.chain.routeRisk")}</span> {riskFoot}
          </p>
        </footer>
      </div>
      <style>{`
        .exchain {
          margin-bottom: 4px;
        }
        .exchain__track {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          gap: 0 4px;
          padding: 4px 0 10px;
        }
        .exchain__step {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
        }
        .exchain__arrow {
          width: 18px;
          height: 1px;
          margin: 0 2px;
          background: linear-gradient(90deg, transparent, rgba(130, 150, 200, 0.35), transparent);
          flex-shrink: 0;
        }
        .exchain__node {
          width: min(148px, 38vw);
          padding: 8px 8px 9px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(0, 0, 0, 0.32);
        }
        .exchain__node--active {
          border-color: rgba(120, 145, 220, 0.35);
        }
        .exchain__node--waiting {
          border-color: rgba(130, 145, 170, 0.22);
          opacity: 0.92;
        }
        .exchain__node--cooling {
          opacity: 0.88;
          border-color: rgba(120, 140, 165, 0.2);
        }
        .exchain__node--stale {
          border-color: rgba(200, 160, 90, 0.32);
        }
        .exchain__node--overloaded {
          border-color: rgba(220, 140, 90, 0.35);
        }
        .exchain__node--synchronized {
          border-color: rgba(100, 180, 140, 0.28);
        }
        .exchain__node--delayed {
          border-color: rgba(180, 100, 100, 0.35);
        }
        .exchain__node--expired {
          border-color: rgba(110, 120, 140, 0.25);
          opacity: 0.78;
        }
        .exchain__badge {
          display: inline-block;
          font-size: 0.48rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(175, 188, 215, 0.85);
          margin-bottom: 5px;
        }
        .exchain__name {
          margin: 0 0 4px;
          font-size: 0.68rem;
          font-weight: 600;
          line-height: 1.25;
          color: rgba(220, 226, 240, 0.95);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .exchain__meta {
          margin: 0 0 4px;
          font-size: 0.55rem;
          line-height: 1.3;
          color: rgba(145, 158, 185, 0.75);
        }
        .exchain__owner {
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .exchain__sep {
          margin: 0 3px;
          opacity: 0.5;
        }
        .exchain__touch {
          margin: 0 0 3px;
          font-size: 0.55rem;
          line-height: 1.3;
          color: rgba(165, 178, 205, 0.78);
        }
        .exchain__risk {
          margin: 0;
          font-size: 0.52rem;
          line-height: 1.3;
          color: rgba(130, 142, 168, 0.65);
        }
        .exchain__foot {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .exchain__foot p {
          margin: 0 0 4px;
          font-size: 0.62rem;
          line-height: 1.4;
          color: rgba(175, 186, 210, 0.82);
        }
        .exchain__fk {
          font-size: 0.48rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(120, 132, 158, 0.65);
          margin-right: 6px;
        }
      `}</style>
    </>
  );
}
