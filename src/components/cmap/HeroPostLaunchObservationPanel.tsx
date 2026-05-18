import { OBSERVATION_LABELS, formatObservationField } from "../../lib/hero-post-launch-observation/fields";
import type { HeroPostLaunchObservation, ObservationLabel } from "../../lib/hero-post-launch-observation/types";

type FieldKey =
  | "rankingObservation"
  | "competitorMovement"
  | "readabilityObservation"
  | "fatigueObservation"
  | "premiumPerceptionObservation"
  | "customerSignalObservation"
  | "suspectedOutcome"
  | "refreshRisk";

type Props = {
  observation: HeroPostLaunchObservation;
  t: (key: string, vars?: Record<string, string>) => string;
  onPatch: (patch: Partial<HeroPostLaunchObservation>) => void;
  onSave: () => void;
  onRefreshPlan: () => void;
  onNewTestMatrix: () => void;
  onUpdateBattlePlan: () => void;
  onReadabilityPrompt: () => void;
  onMarkFatigue: () => void;
};

function ObservationField({
  labelKey,
  fieldKey,
  labelState,
  detailState,
  onLabel,
  onDetail,
  t,
}: {
  labelKey: string;
  fieldKey: FieldKey;
  labelState: ObservationLabel;
  detailState: string;
  onLabel: (l: ObservationLabel) => void;
  onDetail: (d: string) => void;
  t: Props["t"];
}) {
  return (
    <label className="cmap-hplo__row cmap-hplo__row--full">
      <span>{t(labelKey)}</span>
      <div className="cmap-hplo__field-inline">
        <select
          className="cmap-hplo__sel"
          value={labelState}
          onChange={(e) => {
            const l = e.target.value as ObservationLabel;
            onLabel(l);
            onDetail(formatObservationField(l, detailState, t));
          }}
        >
          {OBSERVATION_LABELS.map((l) => (
            <option key={`${fieldKey}-${l}`} value={l}>
              {t(`hplo.label.${l}`)}
            </option>
          ))}
        </select>
        <input
          className="cmap-hplo__txt"
          value={detailState}
          onChange={(e) => onDetail(e.target.value)}
          placeholder={t(`hplo.placeholder.${fieldKey}`)}
        />
      </div>
    </label>
  );
}

function parseLabelDetail(value: string, fallback: ObservationLabel): { label: ObservationLabel; detail: string } {
  const parts = value.split("·");
  if (parts.length < 2) return { label: fallback, detail: value.trim() };
  const first = parts[0]?.trim().toLowerCase() ?? "";
  const label =
    first === "improved" || first === "stable" || first === "weakened" || first === "uncertain"
      ? (first as ObservationLabel)
      : fallback;
  const detail = parts.slice(1).join("·").trim();
  return { label, detail };
}

export function HeroPostLaunchObservationPanel({
  observation,
  t,
  onPatch,
  onSave,
  onRefreshPlan,
  onNewTestMatrix,
  onUpdateBattlePlan,
  onReadabilityPrompt,
  onMarkFatigue,
}: Props) {
  const rank = parseLabelDetail(observation.rankingObservation, "uncertain");
  const comp = parseLabelDetail(observation.competitorMovement, "uncertain");
  const read = parseLabelDetail(observation.readabilityObservation, "stable");
  const fat = parseLabelDetail(observation.fatigueObservation, "stable");
  const prem = parseLabelDetail(observation.premiumPerceptionObservation, "uncertain");

  return (
    <div className="cmap-hplo">
      <div className="cmap-hplo__timing">
        <label className="cmap-hplo__row">
          <span>{t("hplo.field.launchDate")}</span>
          <input
            type="date"
            className="cmap-hplo__txt"
            value={observation.launchDate}
            onChange={(e) => onPatch({ launchDate: e.target.value })}
          />
        </label>
        <label className="cmap-hplo__row">
          <span>{t("hplo.field.observationDate")}</span>
          <input
            type="date"
            className="cmap-hplo__txt"
            value={observation.observationDate}
            onChange={(e) => onPatch({ observationDate: e.target.value })}
          />
        </label>
        <label className="cmap-hplo__row">
          <span>{t("hplo.field.window")}</span>
          <input
            type="number"
            min={1}
            max={90}
            className="cmap-hplo__num"
            value={observation.observationWindowDays}
            onChange={(e) =>
              onPatch({ observationWindowDays: Math.min(90, Math.max(1, Number.parseInt(e.target.value, 10) || 7)) })
            }
          />
        </label>
      </div>
      <ObservationField
        labelKey="hplo.field.ranking"
        fieldKey="rankingObservation"
        labelState={rank.label}
        detailState={rank.detail}
        onLabel={(l) => onPatch({ rankingObservation: formatObservationField(l, rank.detail, t) })}
        onDetail={(d) => onPatch({ rankingObservation: formatObservationField(rank.label, d, t) })}
        t={t}
      />
      <ObservationField
        labelKey="hplo.field.competitors"
        fieldKey="competitorMovement"
        labelState={comp.label}
        detailState={comp.detail}
        onLabel={(l) => onPatch({ competitorMovement: formatObservationField(l, comp.detail, t) })}
        onDetail={(d) => onPatch({ competitorMovement: formatObservationField(comp.label, d, t) })}
        t={t}
      />
      <ObservationField
        labelKey="hplo.field.readability"
        fieldKey="readabilityObservation"
        labelState={read.label}
        detailState={read.detail}
        onLabel={(l) => onPatch({ readabilityObservation: formatObservationField(l, read.detail, t) })}
        onDetail={(d) => onPatch({ readabilityObservation: formatObservationField(read.label, d, t) })}
        t={t}
      />
      <ObservationField
        labelKey="hplo.field.fatigue"
        fieldKey="fatigueObservation"
        labelState={fat.label}
        detailState={fat.detail}
        onLabel={(l) => onPatch({ fatigueObservation: formatObservationField(l, fat.detail, t) })}
        onDetail={(d) => onPatch({ fatigueObservation: formatObservationField(fat.label, d, t) })}
        t={t}
      />
      <ObservationField
        labelKey="hplo.field.premium"
        fieldKey="premiumPerceptionObservation"
        labelState={prem.label}
        detailState={prem.detail}
        onLabel={(l) => onPatch({ premiumPerceptionObservation: formatObservationField(l, prem.detail, t) })}
        onDetail={(d) => onPatch({ premiumPerceptionObservation: formatObservationField(prem.label, d, t) })}
        t={t}
      />
      <label className="cmap-hplo__row cmap-hplo__row--full">
        <span>{t("hplo.field.customer")}</span>
        <input
          className="cmap-hplo__txt"
          value={observation.customerSignalObservation}
          onChange={(e) => onPatch({ customerSignalObservation: e.target.value })}
        />
      </label>
      <label className="cmap-hplo__row cmap-hplo__row--full">
        <span>{t("hplo.field.operational")}</span>
        <input
          className="cmap-hplo__txt"
          value={observation.operationalIssues}
          onChange={(e) => onPatch({ operationalIssues: e.target.value })}
        />
      </label>
      <label className="cmap-hplo__row cmap-hplo__row--full">
        <span>{t("hplo.field.suspected")}</span>
        <input
          className="cmap-hplo__txt"
          value={observation.suspectedOutcome}
          onChange={(e) => onPatch({ suspectedOutcome: e.target.value })}
        />
      </label>
      <label className="cmap-hplo__row cmap-hplo__row--full">
        <span>{t("hplo.field.nextRec")}</span>
        <input
          className="cmap-hplo__txt"
          value={observation.nextRecommendation}
          onChange={(e) => onPatch({ nextRecommendation: e.target.value })}
          placeholder={t("hplo.placeholder.nextRec")}
        />
      </label>
      <label className="cmap-hplo__row cmap-hplo__row--full">
        <span>{t("hplo.field.refreshRisk")}</span>
        <input
          className="cmap-hplo__txt"
          value={observation.refreshRisk}
          onChange={(e) => onPatch({ refreshRisk: e.target.value })}
        />
      </label>
      <label className="cmap-hplo__row cmap-hplo__row--full">
        <span>{t("hplo.field.notes")}</span>
        <input
          className="cmap-hplo__txt"
          value={observation.notes}
          onChange={(e) => onPatch({ notes: e.target.value })}
        />
      </label>
      {observation.learningReinforcement.length > 0 ? (
        <>
          <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
            {t("hplo.field.learning")}
          </h4>
          <ul className="cmap-mini-list">
            {observation.learningReinforcement.map((line, i) => (
              <li key={`hplo-learn-${i}`}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="cmap-serp__actions cmap-serp__actions--wrap" style={{ marginTop: 8 }}>
        <button type="button" className="ghost-btn" onClick={onSave}>
          {t("hplo.action.save")}
        </button>
        <button type="button" className="ghost-btn" onClick={onRefreshPlan}>
          {t("hplo.action.refreshPlan")}
        </button>
        <button type="button" className="ghost-btn" onClick={onNewTestMatrix}>
          {t("hplo.action.newMatrix")}
        </button>
        <button type="button" className="ghost-btn" onClick={onUpdateBattlePlan}>
          {t("hplo.action.updateBattlePlan")}
        </button>
        <button type="button" className="ghost-btn" onClick={onReadabilityPrompt}>
          {t("hplo.action.readabilityPrompt")}
        </button>
        <button type="button" className="ghost-btn" onClick={onMarkFatigue}>
          {t("hplo.action.markFatigue")}
        </button>
      </div>
    </div>
  );
}
