import type { CSSProperties } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { ResourcePressure } from "../../lib/execution-orchestrator/types";

type StressKey = "dtfQueue" | "packagingBottleneck" | "contentLoad" | "skuComplexity" | "seoBandwidth" | "campaignPressure";

type Row = { k: StressKey | "fboReadiness"; labKey: string; invert?: boolean };

type Props = { rp: ResourcePressure };

export function OrchPressureBoard({ rp }: Props) {
  const { t } = useI18n();
  const rows: Row[] = [
    { k: "dtfQueue", labKey: "orch.prDtf" },
    { k: "packagingBottleneck", labKey: "orch.prPackaging" },
    { k: "contentLoad", labKey: "orch.prContent" },
    { k: "skuComplexity", labKey: "orch.prSku" },
    { k: "seoBandwidth", labKey: "orch.prSeo" },
    { k: "campaignPressure", labKey: "orch.prCampaign" },
    { k: "fboReadiness", labKey: "orch.prFbo", invert: true },
  ];

  let maxK: StressKey = "dtfQueue";
  let maxV = -1;
  const stressKeys: StressKey[] = ["dtfQueue", "packagingBottleneck", "contentLoad", "skuComplexity", "seoBandwidth", "campaignPressure"];
  for (const k of stressKeys) {
    const v = rp[k];
    if (v > maxV) {
      maxV = v;
      maxK = k;
    }
  }
  const fboRisk = rp.fboReadiness < 48;
  const bnLabel = rows.find((r) => r.k === maxK)?.labKey ?? "orch.prDtf";

  return (
    <div className="orch-pb">
      <div className="orch-pb__head">
        <span className="orch-pb__bn">{t("orch.bottleneck")}</span>
        <span className="orch-pb__bn-v">{t(bnLabel)}</span>
        {fboRisk ? <span className="orch-pb__tag">{t("orch.fboRisk")}</span> : null}
      </div>
      <ul className="orch-pb__list">
        {rows.map(({ k, labKey, invert }) => {
          const v = rp[k] as number;
          const hot = (!invert && k === maxK) || (Boolean(invert) && k === "fboReadiness" && fboRisk);
          const fill = invert ? Math.max(8, v) : v;
          return (
            <li key={k} className={`orch-pb__row${hot ? " orch-pb__row--hot" : ""}`}>
              <span className="orch-pb__k">{t(labKey)}</span>
              <span className="orch-pb__track">
                <span
                  className={`orch-pb__fill${invert ? " orch-pb__fill--inv" : ""}`}
                  style={{ "--orch-v": fill } as CSSProperties}
                />
              </span>
              <span className="orch-pb__v">{v}%</span>
            </li>
          );
        })}
      </ul>
      <p className="orch-pb__sum">{rp.summaryRu.length > 110 ? `${rp.summaryRu.slice(0, 107)}…` : rp.summaryRu}</p>
      <style>{`
        .orch-pb {
          position: relative;
        }
        .orch-pb__head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          margin-bottom: 12px;
        }
        .orch-pb__bn {
          font-size: 0.52rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(125, 138, 168, 0.55);
        }
        .orch-pb__bn-v {
          font-size: 0.72rem;
          color: rgba(200, 210, 235, 0.88);
        }
        .orch-pb__tag {
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 99px;
          border: 1px solid rgba(160, 120, 100, 0.35);
          color: rgba(200, 170, 155, 0.75);
        }
        .orch-pb__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .orch-pb__row {
          display: grid;
          grid-template-columns: minmax(100px, 120px) 1fr 36px;
          gap: 8px;
          align-items: center;
          padding: 6px 8px;
          margin: 0 -8px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .orch-pb__row--hot {
          background: rgba(125, 145, 210, 0.06);
          box-shadow: inset 0 0 0 1px rgba(125, 145, 210, 0.12);
        }
        .orch-pb__k {
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: rgba(140, 152, 178, 0.72);
        }
        .orch-pb__track {
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }
        .orch-pb__fill {
          display: block;
          height: 100%;
          width: calc(var(--orch-v, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(88, 100, 140, 0.25), rgba(145, 158, 205, 0.48));
        }
        .orch-pb__fill--inv {
          background: linear-gradient(90deg, rgba(90, 120, 100, 0.2), rgba(130, 165, 145, 0.42));
        }
        .orch-pb__row--hot .orch-pb__fill:not(.orch-pb__fill--inv) {
          background: linear-gradient(90deg, rgba(120, 135, 185, 0.35), rgba(175, 190, 230, 0.55));
        }
        .orch-pb__row--hot .orch-pb__fill--inv {
          background: linear-gradient(90deg, rgba(130, 100, 90, 0.25), rgba(190, 140, 120, 0.45));
        }
        .orch-pb__v {
          font-size: 0.65rem;
          color: rgba(150, 162, 190, 0.55);
          text-align: right;
        }
        .orch-pb__sum {
          margin: 12px 0 0;
          font-size: 0.68rem;
          line-height: 1.4;
          color: rgba(130, 142, 168, 0.55);
        }
      `}</style>
    </div>
  );
}
