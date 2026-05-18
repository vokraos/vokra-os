import type { NavId } from "../types";
import { ACTIVITY_RU, BRAND_GATE_RU, SYNC_RU, useCognitiveOs } from "../lib/cognitive-os";

type Props = {
  moduleId: NavId;
  /** `signalsOnly` — secondary module context without duplicating strip chips */
  variant?: "full" | "signalsOnly";
};

export function CognitiveModuleRibbon({ moduleId, variant = "full" }: Props) {
  const { getModule, lastEvent, pulseGeneration, brandDnaSurfaceActive, synthesis } = useCognitiveOs();
  const m = getModule(moduleId);
  const eventForModule =
    lastEvent && (lastEvent.source === moduleId || lastEvent.targets.includes(moduleId)) ? lastEvent : null;

  const showChips = variant === "full";
  const hasSignals = Boolean(m.incomingRu || m.outgoingRu || eventForModule || synthesis.causeEffectRu);
  if (!showChips && !hasSignals) {
    return null;
  }

  return (
    <div className={`cog-ribbon${!showChips ? " cog-ribbon--signals" : ""}`} data-cog-pulse-gen={pulseGeneration % 1000}>
      {showChips ? (
        <>
          <div className="cog-ribbon__chips" role="status" aria-live="polite">
            <span className="cog-ribbon__chip cog-ribbon__chip--act">{ACTIVITY_RU[m.activity]}</span>
            <span className="cog-ribbon__chip">{SYNC_RU[m.sync]}</span>
            <span className="cog-ribbon__chip">Данные {Math.round(m.signalHealth)}%</span>
            <span className="cog-ribbon__chip">Нагрузка {Math.round(m.pressure)}%</span>
            <span className="cog-ribbon__chip">Уверенность {Math.round(m.confidence)}%</span>
            <span className={`cog-ribbon__chip cog-ribbon__chip--dna${m.brandGate !== "ok" ? " cog-ribbon__chip--warn" : ""}`}>
              {BRAND_GATE_RU[m.brandGate]}
              {brandDnaSurfaceActive ? " · поверхность" : ""}
            </span>
          </div>
        </>
      ) : null}
      {(m.incomingRu || m.outgoingRu || eventForModule || synthesis.causeEffectRu) && (
        <div className="cog-ribbon__signals">
          {synthesis.causeEffectRu ? (
            <p className="cog-ribbon__cause">
              <span className="cog-ribbon__k">Связи</span> {synthesis.causeEffectRu}
            </p>
          ) : null}
          {m.incomingRu ? (
            <p className="cog-ribbon__in">
              <span className="cog-ribbon__k">Влияние на раздел</span> {m.incomingRu}
            </p>
          ) : null}
          {m.outgoingRu ? (
            <p className="cog-ribbon__out">
              <span className="cog-ribbon__k">Влияние на другие разделы</span> {m.outgoingRu}
            </p>
          ) : null}
          {eventForModule && eventForModule.source !== moduleId ? (
            <p className="cog-ribbon__net">
              <span className="cog-ribbon__k">Событие</span> {eventForModule.detailRu}
            </p>
          ) : null}
        </div>
      )}
      {showChips ? (
        <div className="cog-ribbon__trace" aria-hidden>
          <span className="cog-ribbon__trace-fill" />
        </div>
      ) : null}
    </div>
  );
}
