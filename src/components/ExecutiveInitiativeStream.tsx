import type { NavId } from "../types";
import type { InitiativePriority, StrategicInitiative } from "../lib/initiative-engine/types";
import { useCognitiveOs } from "../lib/cognitive-os";
import { useI18n } from "../lib/i18n/I18nContext";
import { useCollectionBuilderEntity } from "../lib/collection-builder";
import { useVisualStrategySnapshot } from "../lib/visual-intelligence";

type Props = { active: NavId; onNavigate?: (id: NavId) => void };

function priorityKey(p: InitiativePriority): string {
  return `initiative.priority.${p}`;
}

export function ExecutiveInitiativeStream({ active, onNavigate }: Props) {
  const { t, locale } = useI18n();
  const { initiatives, initiativeUrgency, dismissInitiative, initiativeScanGeneration } = useCognitiveOs();
  const collectionEntity = useCollectionBuilderEntity();
  const vsSnap = useVisualStrategySnapshot();
  const en = locale === "en";
  const compact = active === "home";

  if (compact) return null;

  return (
    <section
      className={`cog-initiative ${initiativeUrgency !== "calm" ? `cog-initiative--${initiativeUrgency}` : ""}`}
      aria-label={t("initiative.streamTitle")}
      data-init-scan={initiativeScanGeneration % 1000}
    >
      <div className="cog-initiative__head">
        <span className="cog-initiative__label">{t("initiative.streamTitle")}</span>
        <span className="cog-initiative__badge" title={t("initiative.scanMeta")}>
          {t("initiative.streamBadge")} · {initiativeScanGeneration % 10000}
        </span>
      </div>
      <div className="cog-initiative__track" role="list">
        {onNavigate && active !== "collectionBuilder" ? (
          <article className="cog-initiative__card cog-initiative__card--observe" role="listitem" data-cog-collection-bridge="1">
            <div className="cog-initiative__card-top">
              <span className="cog-initiative__pri cog-initiative__pri--observe">{t("collectionBuilder.bridge.badge")}</span>
            </div>
            <p className="cog-initiative__headline">{collectionEntity.name}</p>
            <p className="cog-initiative__body">{collectionEntity.opportunityReason.length > 220 ? `${collectionEntity.opportunityReason.slice(0, 217)}…` : collectionEntity.opportunityReason}</p>
            <button type="button" className="cog-initiative__open-cb" onClick={() => onNavigate("collectionBuilder")}>
              {t("collectionBuilder.bridge.cta")}
            </button>
          </article>
        ) : null}
        {onNavigate && active !== "visualStrategy" ? (
          <article className="cog-initiative__card cog-initiative__card--observe" role="listitem" data-cog-visual-bridge="1">
            <div className="cog-initiative__card-top">
              <span className="cog-initiative__pri cog-initiative__pri--observe">{t("nav.visualStrategy")}</span>
            </div>
            <p className="cog-initiative__headline">{vsSnap.heroVisual.compositionType}</p>
            <p className="cog-initiative__body">
              {(en ? vsSnap.integrationDigestEn : vsSnap.integrationDigestRu)[0] ?? ""}
            </p>
            <button type="button" className="cog-initiative__open-cb" onClick={() => onNavigate("visualStrategy")}>
              {t("visualStrategy.open")}
            </button>
          </article>
        ) : null}
        {initiatives.map((it: StrategicInitiative) => (
          <article key={it.id} className={`cog-initiative__card cog-initiative__card--${it.priority}`} role="listitem">
            <div className="cog-initiative__card-top">
              <span className={`cog-initiative__pri cog-initiative__pri--${it.priority}`}>{t(priorityKey(it.priority))}</span>
              <button
                type="button"
                className="cog-initiative__dismiss"
                onClick={() => dismissInitiative(it.id)}
                aria-label={t("initiative.dismiss")}
              >
                ×
              </button>
            </div>
            <p className="cog-initiative__headline">{en ? it.headlineEn : it.headlineRu}</p>
            <p className="cog-initiative__body">{en ? it.bodyEn : it.bodyRu}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
