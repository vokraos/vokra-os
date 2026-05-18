import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { demoCorridor, demoSkuId } from "../../lib/cognitive-depth/sku-demo";
import { empireMemoryWarfare } from "../../lib/cognitive-depth/sku-empire";
import { strategicMemoryClassKey } from "../../lib/cognitive-depth/entity-consciousness";
import { marketMemoryScars, memoryCampaignMarkers } from "../../lib/cognitive-depth/market-war-os";
import { memoryArchiveDepth, memoryStrategicEchoes } from "../../lib/cognitive-depth/strategic-organism";
import { memoryVaultClassifiedLines } from "../../lib/entity-core";
import { useCognitiveDepth } from "../../lib/cognitive-depth";

type RowTone = "failure" | "win" | "scar" | "echo" | "corridor" | "timing" | "marker";

type ArchiveLine = { microKey: string; text: string };

function archiveRowTone(classKey: string): RowTone {
  if (classKey === "successful_amplification" || classKey === "hero_recovery") return "win";
  if (classKey === "fulfillment_failure" || classKey === "failed_expansion") return "failure";
  if (classKey === "campaign_marker") return "marker";
  if (classKey === "pulse_echo" || classKey === "launch_echo") return "echo";
  if (classKey === "corridor_collapse" || classKey === "corridor_pattern") return "corridor";
  if (classKey === "timing_scar") return "timing";
  if (classKey === "classified_vault" || classKey === "classified_event") return "scar";
  return "scar";
}

export function MemoryArchivePanel({ variant }: { variant: "dashboard" | "mission" | "orchestrator" }) {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();
  const edc = useExecutiveDecisionBoard();
  const orch = useExecutionOrchestrator();

  const lines = useMemo<ArchiveLine[]>(() => {
    const seed = orch.pulseGeneration;
    const sku = demoSkuId(seed);
    const corridor = demoCorridor(seed + 3);
    const warfare = empireMemoryWarfare(orch.pulseGeneration);
    const scars = marketMemoryScars(orch.pulseGeneration, 3);
    const markers = memoryCampaignMarkers(orch.pulseGeneration, 2);
    const depthLines = memoryArchiveDepth(orch.pulseGeneration, 2);
    const echoes = memoryStrategicEchoes(orch.pulseGeneration, 1);
    const vault = memoryVaultClassifiedLines(orch.pulseGeneration, 2);
    return [
      ...vault.map((v): ArchiveLine => ({ microKey: v.key, text: t(v.key, v.vars) })),
      ...echoes.map((sig): ArchiveLine => ({ microKey: sig.key, text: t(sig.key, sig.vars) })),
      ...depthLines.map((sig): ArchiveLine => ({ microKey: sig.key, text: t(sig.key, sig.vars) })),
      ...markers.map((sig): ArchiveLine => ({ microKey: sig.key, text: t(sig.key, sig.vars) })),
      ...scars.map((sig): ArchiveLine => ({ microKey: sig.key, text: t(sig.key, sig.vars) })),
      ...warfare.map((sig): ArchiveLine => ({ microKey: sig.key, text: t(sig.key, sig.vars) })),
      { microKey: "depth.mem.line.failure", text: t("depth.mem.line.failure", { sku }) },
      { microKey: "depth.mem.line.win", text: t("depth.mem.line.win", { corridor }) },
      { microKey: "depth.mem.line.timing", text: t("depth.mem.line.timing") },
      { microKey: "depth.mem.line.corridor", text: t("depth.mem.line.corridor", { corridor }) },
      { microKey: "depth.mem.line.scar", text: t("depth.mem.line.scar", { leak: edc.leakLine.slice(0, 72) }) },
      { microKey: "depth.mem.line.echo", text: t("depth.mem.line.echo", { pulse: String(orch.pulseGeneration % 1000) }) },
    ];
  }, [t, edc.leakLine, orch.pulseGeneration]);

  if (mode === "command") {
    return null;
  }

  return (
    <>
      <div className={`mem-arch mem-arch--${variant}`} aria-label={t("depth.mem.aria")}>
        <header className="mem-arch__head">
          <span className="mem-arch__title">{t("depth.mem.title")}</span>
          <span className="mem-arch__sub">{t("depth.mem.sub")}</span>
        </header>
        <ul className="mem-arch__list">
          {lines.map((line, i) => {
            const classKey = strategicMemoryClassKey(line.microKey);
            const tone = archiveRowTone(classKey);
            return (
              <li
                key={`${line.microKey}-${i}`}
                className={`mem-arch__li mem-arch__li--${tone}`}
                data-mem-class={classKey}
              >
                <span className="mem-arch__tag">{t(`depth.mem.classLabel.${classKey}`)}</span>
                <span className="mem-arch__text">{line.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <style>{`
        .mem-arch {
          margin: 0 0 16px;
          padding: 14px 16px 16px;
          border-radius: 12px 18px 14px 10px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          background: radial-gradient(90% 50% at 50% 0%, rgba(48, 36, 52, 0.25) 0%, transparent 55%),
            linear-gradient(180deg, rgba(8, 7, 10, 0.94) 0%, rgba(2, 2, 4, 0.98) 100%);
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }
        .mem-arch--mission {
          max-width: min(920px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .mem-arch__head {
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .mem-arch__title {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(150, 155, 168, 0.78);
        }
        .mem-arch__sub {
          display: block;
          margin-top: 6px;
          font-size: 0.78rem;
          line-height: 1.45;
          color: rgba(120, 125, 140, 0.85);
        }
        .mem-arch__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mem-arch__li {
          display: grid;
          grid-template-columns: minmax(120px, 32%) 1fr;
          gap: 10px 14px;
          align-items: start;
        }
        @media (max-width: 560px) {
          .mem-arch__li {
            grid-template-columns: 1fr;
          }
        }
        .mem-arch__tag {
          font-size: 0.5rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(110, 118, 135, 0.82);
          line-height: 1.35;
        }
        .mem-arch__text {
          font-size: 0.78rem;
          line-height: 1.45;
          color: rgba(185, 190, 205, 0.88);
        }
        .mem-arch__li--win .mem-arch__text {
          color: rgba(175, 200, 175, 0.78);
        }
        .mem-arch__li--failure .mem-arch__text {
          color: rgba(200, 175, 175, 0.78);
        }
        .mem-arch__li--marker .mem-arch__text {
          color: rgba(175, 165, 195, 0.62);
          font-style: italic;
        }
      `}</style>
    </>
  );
}
