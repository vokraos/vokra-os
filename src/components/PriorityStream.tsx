import type { NavId } from "../types";
import { useCognitiveOs } from "../lib/cognitive-os";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = { active: NavId };

/** Нервная система ОС: приоритеты и давление на всех экранах */
export function PriorityStream({ active }: Props) {
  const { t } = useI18n();
  const { synthesis } = useCognitiveOs();
  const s = synthesis;
  const compact = active === "home";

  return (
    <div className={`cog-priority ${compact ? "cog-priority--compact" : ""}`} role="status" aria-live="polite">
      <div className="cog-priority__label">{t("initiative.synthesisStrip")}</div>
      <div className="cog-priority__row">
        <div className="cog-priority__cell">
          <span className="cog-priority__k">Окно</span>
          <span className="cog-priority__v">{s.topOpportunityRu}</span>
        </div>
        {!compact ? (
          <div className="cog-priority__cell">
            <span className="cog-priority__k">Риск</span>
            <span className="cog-priority__v">{s.biggestRiskRu}</span>
          </div>
        ) : null}
        <div className="cog-priority__cell">
          <span className="cog-priority__k">Миссия</span>
          <span className="cog-priority__v">{s.activeMissionRu}</span>
        </div>
        <div className="cog-priority__cell cog-priority__cell--metric">
          <span className="cog-priority__k">Давление</span>
          <span className="cog-priority__metric">{s.pressureIndex}%</span>
        </div>
        <div className="cog-priority__cell cog-priority__cell--metric">
          <span className="cog-priority__k">Запуск</span>
          <span className="cog-priority__metric">{s.launchReadiness}%</span>
        </div>
        {!compact ? (
          <div className="cog-priority__cell">
            <span className="cog-priority__k">Кластер</span>
            <span className="cog-priority__v">{s.dominantClusterRu}</span>
          </div>
        ) : null}
      </div>
      <p className="cog-priority__memory">{s.memoryEchoRu}</p>
    </div>
  );
}
