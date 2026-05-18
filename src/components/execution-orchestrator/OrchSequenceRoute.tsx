import type { CSSProperties } from "react";
import type { ExecutionStage } from "../../lib/execution-orchestrator/types";
import { ROUTE_STATE_RU, SYSTEM_LABEL_RU } from "../../lib/execution-orchestrator/types";

function pickActiveStageIndex(stages: readonly ExecutionStage[]): number {
  const ai = stages.findIndex((s) => s.status === "active");
  if (ai >= 0) return ai;
  const pr = stages.findIndex((s) => s.status === "production_ready");
  if (pr >= 0) return pr;
  const sy = stages.findIndex((s) => s.status === "synchronized");
  if (sy >= 0) return sy;
  return stages.findIndex((s) => s.status !== "completed" && s.status !== "exhausted");
}

function stageDim(status: ExecutionStage["status"], activeIdx: number, idx: number): number {
  if (idx === activeIdx) return 1;
  if (status === "blocked") return 0.38;
  if (status === "completed" || status === "exhausted") return 0.48;
  if (status === "waiting" || status === "paused") return 0.58;
  return 0.72;
}

type Props = {
  stages: readonly ExecutionStage[];
};

export function OrchSequenceRoute({ stages }: Props) {
  const activeIdx = pickActiveStageIndex(stages);
  return (
    <div className="orch-seq">
      <div className="orch-seq__track">
        {stages.map((st, i) => {
          const dim = stageDim(st.status, activeIdx, i);
          const hot = st.index === activeIdx;
          return (
            <div key={st.index} className="orch-seq__cell">
              {i > 0 ? <span className="orch-seq__arc" aria-hidden /> : null}
              <div
                className={`orch-seq__node${hot ? " orch-seq__node--hot" : ""}${st.status === "blocked" ? " orch-seq__node--blocked" : ""}`}
                style={{ opacity: dim }}
              >
                <span className="orch-seq__num">{String(st.index + 1).padStart(2, "0")}</span>
                <span className="orch-seq__badge">{ROUTE_STATE_RU[st.status]}</span>
                <p className="orch-seq__name">{st.nameRu}</p>
                <p className="orch-seq__owner">{SYSTEM_LABEL_RU[st.owner]}</p>
                <p className="orch-seq__dep">{st.dependencyRu}</p>
                <div className="orch-seq__meters">
                  <span className="orch-seq__m">
                    <em>нагрузка</em> {st.pressure}%
                  </span>
                  <span className="orch-seq__m">
                    <em>уверенность</em> {st.confidence}%
                  </span>
                </div>
                <div className="orch-seq__bar" style={{ "--orch-p": st.pressure } as CSSProperties} />
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .orch-seq {
          position: relative;
        }
        .orch-seq__track {
          display: flex;
          gap: 0;
          overflow-x: auto;
          padding: 8px 4px 14px;
          scroll-snap-type: x mandatory;
          scrollbar-width: thin;
        }
        .orch-seq__cell {
          display: flex;
          align-items: stretch;
          flex: 0 0 auto;
          scroll-snap-align: start;
        }
        .orch-seq__arc {
          width: 28px;
          align-self: center;
          height: 1px;
          background: linear-gradient(90deg, rgba(110, 125, 175, 0.05), rgba(140, 158, 205, 0.28), rgba(110, 125, 175, 0.05));
          flex-shrink: 0;
        }
        .orch-seq__node {
          width: min(168px, 44vw);
          min-height: 168px;
          padding: 10px 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: linear-gradient(165deg, rgba(22, 26, 38, 0.9), rgba(8, 10, 14, 0.96));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          transition: opacity 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .orch-seq__node--hot {
          border-color: rgba(125, 145, 210, 0.38);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 0 0 1px rgba(125, 145, 210, 0.12),
            0 12px 40px rgba(0, 0, 0, 0.45);
        }
        .orch-seq__node--blocked {
          border-color: rgba(160, 100, 100, 0.25);
        }
        .orch-seq__num {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          color: rgba(130, 140, 165, 0.55);
          margin-bottom: 6px;
        }
        .orch-seq__badge {
          display: inline-block;
          font-size: 0.52rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(175, 188, 215, 0.75);
          margin-bottom: 8px;
        }
        .orch-seq__name {
          margin: 0 0 6px;
          font-size: 0.72rem;
          line-height: 1.35;
          color: rgba(215, 222, 238, 0.92);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .orch-seq__owner {
          margin: 0 0 6px;
          font-size: 0.62rem;
          color: rgba(150, 162, 190, 0.65);
        }
        .orch-seq__dep {
          margin: 0 0 8px;
          font-size: 0.6rem;
          line-height: 1.35;
          color: rgba(130, 142, 168, 0.55);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .orch-seq__meters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 10px;
          margin-bottom: 6px;
        }
        .orch-seq__m {
          font-size: 0.58rem;
          color: rgba(155, 168, 195, 0.55);
        }
        .orch-seq__m em {
          font-style: normal;
          font-size: 0.5rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(120, 130, 155, 0.45);
          margin-right: 4px;
        }
        .orch-seq__bar {
          height: 3px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .orch-seq__bar::after {
          content: "";
          display: block;
          height: 100%;
          width: calc(var(--orch-p, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(95, 110, 155, 0.2), rgba(145, 162, 205, 0.42));
        }
      `}</style>
    </div>
  );
}
