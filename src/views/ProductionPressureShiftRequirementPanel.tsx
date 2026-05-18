import { useMemo } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  loadShiftScenariosState,
  type ShiftRequirementRecommendation,
} from "../lib/production-pressure";

type Props = {
  shiftRequirement: ShiftRequirementRecommendation;
};

export function ProductionPressureShiftRequirementPanel({ shiftRequirement }: Props) {
  const { t } = useI18n();
  const sr = shiftRequirement;

  const { currentLabel, recommendedLabel } = useMemo(() => {
    const state = loadShiftScenariosState();
    const current = state.scenarios.find((s) => s.id === sr.currentScenarioId);
    const recommended = state.scenarios.find((s) => s.id === sr.recommendedScenarioId);
    const currentLabel = current
      ? `${current.name} (${t(`prod.shift.type.${current.scenarioType}`)})`
      : t("prod.shiftReq.current.none");
    const recommendedLabel =
      sr.recommendationType === "keep_current"
        ? currentLabel
        : recommended
          ? `${recommended.name} (${t(`prod.shift.type.${recommended.scenarioType}`)})`
          : sr.reasonVars.to
            ? t(`prod.shift.type.${sr.reasonVars.to}`)
            : t(`prod.shiftReq.type.${sr.recommendationType}`);
    return { currentLabel, recommendedLabel };
  }, [sr, t]);

  const typeClass = `ppr-shiftreq-type ppr-shiftreq-type--${sr.recommendationType}`;

  return (
    <section className="glass-panel ppr-sec ppr-sec--shiftreq">
      <h2>{t("prod.section.shiftRequirement")}</h2>
      <p className="ppr-shiftreq-hint">{t("prod.shiftReq.hint")}</p>

      <div className="ppr-shiftreq-head">
        <span className={typeClass}>{t(`prod.shiftReq.type.${sr.recommendationType}`)}</span>
        <span className="ppr-shiftreq-conf">{t(sr.confidenceNoteKey)}</span>
      </div>

      <dl className="ppr-shiftreq-grid">
        <div>
          <dt>{t("prod.shiftReq.current")}</dt>
          <dd>{currentLabel}</dd>
        </div>
        <div>
          <dt>{t("prod.shiftReq.recommended")}</dt>
          <dd>{recommendedLabel}</dd>
        </div>
        <div className="ppr-shiftreq-grid__wide">
          <dt>{t("prod.shiftReq.why")}</dt>
          <dd>{t(sr.reasonKey, sr.reasonVars)}</dd>
        </div>
      </dl>

      {sr.unresolvedOverloads.length > 0 ? (
        <div className="ppr-shiftreq-block ppr-shiftreq-block--warn">
          <h3>{t("prod.shiftReq.unresolved")}</h3>
          <ul className="ppr-shiftreq-list">
            {sr.unresolvedOverloads.map((m) => (
              <li key={m}>{t(`prod.capacity.metric.${m}`)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {sr.workloadReductions.length > 0 ? (
        <div className="ppr-shiftreq-block ppr-shiftreq-block--reduce">
          <h3>{t("prod.shiftReq.reduceTitle")}</h3>
          <ul className="ppr-shiftreq-list">
            {sr.workloadReductions.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <style>{`
        .ppr-sec--shiftreq { margin-top: 0; }
        .ppr-shiftreq-hint { font-size: 12px; opacity: 0.7; margin: 0 0 12px; }
        .ppr-shiftreq-head { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
        .ppr-shiftreq-type { font-weight: 600; font-size: 13px; padding: 4px 12px; border-radius: 999px; }
        .ppr-shiftreq-type--keep_current { background: rgba(80, 200, 120, 0.15); color: #6fd89a; }
        .ppr-shiftreq-type--switch_scenario,
        .ppr-shiftreq-type--use_strong_shift,
        .ppr-shiftreq-type--use_launch_day,
        .ppr-shiftreq-type--use_fbo_prep_day { background: rgba(120, 180, 255, 0.15); color: #9ec8ff; }
        .ppr-shiftreq-type--reduce_workload,
        .ppr-shiftreq-type--split_workload { background: rgba(255, 90, 90, 0.12); color: #ff9a9a; }
        .ppr-shiftreq-conf { font-size: 11px; opacity: 0.6; }
        .ppr-shiftreq-grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; margin: 0; }
        .ppr-shiftreq-grid dt { font-size: 11px; opacity: 0.65; margin: 0; }
        .ppr-shiftreq-grid dd { font-size: 13px; margin: 4px 0 0; }
        .ppr-shiftreq-grid__wide { grid-column: 1 / -1; }
        @media (max-width: 520px) { .ppr-shiftreq-grid { grid-template-columns: 1fr; } }
        .ppr-shiftreq-block { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .ppr-shiftreq-block h3 { font-size: 12px; margin: 0 0 8px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em; }
        .ppr-shiftreq-block--warn h3 { color: #e8c46a; }
        .ppr-shiftreq-block--reduce h3 { color: #ff9a9a; }
        .ppr-shiftreq-list { margin: 0; padding-left: 18px; font-size: 12px; opacity: 0.9; }
      `}</style>
    </section>
  );
}
