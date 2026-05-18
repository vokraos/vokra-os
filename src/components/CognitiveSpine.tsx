import type { NavId } from "../types";
import { useCognitiveOs } from "../lib/cognitive-os";

/** Тонкий «позвоночник» сигнала между сайдбаром и контентом */
export function CognitiveSpine({ active }: { active: NavId }) {
  const { initiativeUrgency } = useCognitiveOs();
  if (active === "home") return null;
  return (
    <div className="cog-spine" aria-hidden data-cog-init-urgency={initiativeUrgency}>
      <span className="cog-spine__line" />
      <span className="cog-spine__pulse" />
    </div>
  );
}
