import type { NavId } from "../../types";
import type { MarketRegime } from "../../lib/cognitive-os";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useLiveState } from "../../lib/live-state";
import { useI18n } from "../../lib/i18n/I18nContext";
import { navMessageKey } from "../../lib/i18n/navLabels";

type Props = { active: NavId };

const REGIME_KEYS: Record<MarketRegime, string> = {
  opportunity: "shell.regime.opportunity",
  saturation: "shell.regime.saturation",
  production_load: "shell.regime.production_load",
  balanced: "shell.regime.balanced",
};

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function SystemStrip({ active }: Props) {
  const { t } = useI18n();
  const { regime, synthesis, decision } = useCognitiveOs();
  const { live } = useLiveState();

  if (active === "home") return null;

  const priority = clip(decision.priorityHeadlineRu || synthesis.topOpportunityRu, 160);

  return (
    <div className="os-strip">
      <div className="workspace os-strip__inner">
        <div className="os-strip__cluster">
          <span className="os-strip__pill os-strip__pill--mode">{t(REGIME_KEYS[regime])}</span>
          <span className="os-strip__module">
            <span className="os-strip__module-k">{t("shell.stripActive")}</span>
            {t(navMessageKey(active))}
          </span>
        </div>

        {priority ? (
          <div className="os-strip__priority">
            <span className="os-strip__priority-k">{t("shell.stripPriority")}</span>
            <span className="os-strip__priority-v">{priority}</span>
          </div>
        ) : null}

        {live.stripWarningRu ? (
          <p className="os-strip__live os-strip__live--warn">{live.stripWarningRu}</p>
        ) : null}
      </div>
    </div>
  );
}
