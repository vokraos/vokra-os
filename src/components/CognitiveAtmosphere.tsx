import type { NavId } from "../types";
import { useCognitiveOs } from "../lib/cognitive-os";
import { useLiveState } from "../lib/live-state";

/** Общий атмосферный слой + адаптация под режим рынка (синтез) */
export function CognitiveAtmosphere({ active }: { active: NavId }) {
  const { regime, pulseGeneration, initiativeUrgency } = useCognitiveOs();
  const { live } = useLiveState();
  if (active === "home") return null;
  return (
    <div
      className="cog-atmos"
      aria-hidden
      data-cog-atmos-regime={regime}
      data-cog-atmos-pulse={String(pulseGeneration % 1000)}
      data-cog-init-urgency={initiativeUrgency}
      data-organism-weather={live.strategicOrganism.weatherId}
      data-market-weather-3={live.strategicOrganism.weather3Id}
      data-executive-silence-band={
        live.executiveSilence01 >= 0.58 ? "deep" : live.executiveSilence01 >= 0.38 ? "mid" : "low"
      }
      data-entity-pulse={String(pulseGeneration % 1440)}
    >
      <span className="cog-atmos__veil" />
      <span className="cog-atmos__haze" />
      <span className="cog-atmos__field" />
      <span className="cog-atmos__fog" />
      <span className="cog-atmos__pressure-glow" />
    </div>
  );
}
