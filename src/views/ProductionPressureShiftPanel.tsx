import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  createShiftScenarioFromType,
  deleteShiftScenario,
  duplicateShiftScenario,
  loadCapacityProfilesState,
  loadShiftScenariosState,
  notifyProductionPressureUpdated,
  resetShiftScenariosToStarter,
  setActiveShiftScenario,
  upsertShiftScenario,
  type CapacityMetricComparison,
  type ProductionLoadSnapshot,
  type ProductionShiftScenario,
  type ResolvedCapacitySnapshot,
  type ShiftScenarioType,
} from "../lib/production-pressure";

const SCENARIO_TYPES: ShiftScenarioType[] = [
  "small_shift",
  "normal_shift",
  "strong_shift",
  "weekend_catchup",
  "launch_day",
  "fbo_prep_day",
  "visual_content_day",
];

type Props = {
  loadSnapshot: ProductionLoadSnapshot;
  comparisons: CapacityMetricComparison[];
  resolvedCapacity: ResolvedCapacitySnapshot | null;
  onChange: () => void;
};

export function ProductionPressureShiftPanel({
  loadSnapshot,
  comparisons,
  resolvedCapacity,
  onChange,
}: Props) {
  const { t } = useI18n();
  const [shiftState, setShiftState] = useState(() => loadShiftScenariosState());
  const [editId, setEditId] = useState<string | null>(shiftState.activeScenarioId);
  const [draft, setDraft] = useState<ProductionShiftScenario | null>(null);

  const refresh = useCallback(() => {
    setShiftState(loadShiftScenariosState());
    onChange();
  }, [onChange]);

  useEffect(() => {
    const s = editId ? shiftState.scenarios.find((x) => x.id === editId) : null;
    setDraft(s ? { ...s, capacityMultipliers: { ...s.capacityMultipliers } } : null);
  }, [editId, shiftState.scenarios]);

  const saveDraft = useCallback(() => {
    if (!draft) return;
    upsertShiftScenario(draft);
    notifyProductionPressureUpdated();
    refresh();
  }, [draft, refresh]);

  const resetStarter = useCallback(() => {
    const cap = loadCapacityProfilesState();
    resetShiftScenariosToStarter(cap.activeProfileId, t);
    notifyProductionPressureUpdated();
    refresh();
  }, [refresh, t]);

  const newScenario = useCallback(
    (type: ShiftScenarioType) => {
      const cap = loadCapacityProfilesState();
      const s = createShiftScenarioFromType(type, t(`prod.shift.type.${type}`), cap.activeProfileId);
      upsertShiftScenario(s);
      notifyProductionPressureUpdated();
      refresh();
      setEditId(s.id);
    },
    [refresh, t],
  );

  return (
    <section className="glass-panel ppr-sec ppr-sec--shift">
      <h2>{t("prod.section.shiftScenarios")}</h2>
      <p className="ppr-shift-hint">{t("prod.shift.hint")}</p>

      {resolvedCapacity?.scenarioName ? (
        <p className="ppr-shift-active">
          {t("prod.shift.activeScenario", {
            name: resolvedCapacity.scenarioName,
            type: t(`prod.shift.type.${resolvedCapacity.scenarioType ?? "normal_shift"}`),
          })}
        </p>
      ) : (
        <p className="ppr-shift-warn">{t("prod.shift.noScenario")}</p>
      )}

      <div className="ppr-shift-toolbar">
        <button type="button" className="ghost-btn" onClick={resetStarter}>
          {t("prod.shift.action.resetStarter")}
        </button>
        <select
          className="ppr-shift-select"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value as ShiftScenarioType;
            if (v) newScenario(v);
            e.target.value = "";
          }}
        >
          <option value="">{t("prod.shift.action.new")}</option>
          {SCENARIO_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`prod.shift.type.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {shiftState.scenarios.length > 0 ? (
        <div className="ppr-shift-pills">
          {shiftState.scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ppr-shift-pill${s.id === shiftState.activeScenarioId ? " ppr-shift-pill--on" : ""}`}
              onClick={() => setEditId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      {draft ? (
        <div className="ppr-shift-form">
          <label className="ppr-shift-field ppr-shift-field--wide">
            <span>{t("prod.shift.field.name")}</span>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="ppr-shift-field">
            <span>{t("prod.shift.field.type")}</span>
            <select
              value={draft.scenarioType}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  scenarioType: e.target.value as ShiftScenarioType,
                  capacityMultipliers: {},
                })
              }
            >
              {SCENARIO_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`prod.shift.type.${type}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="ppr-shift-field">
            <span>{t("prod.shift.field.baseProfile")}</span>
            <select
              value={draft.baseCapacityProfileId ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  baseCapacityProfileId: e.target.value || null,
                })
              }
            >
              <option value="">{t("prod.shift.field.baseProfileActive")}</option>
              {loadCapacityProfilesState().profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ppr-shift-field ppr-shift-field--wide">
            <span>{t("prod.shift.field.notes")}</span>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
          <div className="ppr-shift-form-actions">
            <button type="button" className="primary-btn" onClick={saveDraft}>
              {t("prod.shift.action.save")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setActiveShiftScenario(draft.id);
                notifyProductionPressureUpdated();
                refresh();
              }}
            >
              {t("prod.shift.action.setActive")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                duplicateShiftScenario(draft.id);
                notifyProductionPressureUpdated();
                refresh();
              }}
            >
              {t("prod.shift.action.duplicate")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                deleteShiftScenario(draft.id);
                notifyProductionPressureUpdated();
                refresh();
              }}
            >
              {t("prod.shift.action.delete")}
            </button>
          </div>
        </div>
      ) : null}

      {resolvedCapacity ? (
        <>
          <h3 className="ppr-shift-sub">{t("prod.shift.resolvedTitle")}</h3>
          <table className="ppr-shift-table">
            <thead>
              <tr>
                <th>{t("prod.capacity.col.metric")}</th>
                <th>{t("prod.shift.col.base")}</th>
                <th>{t("prod.shift.col.resolved")}</th>
                <th>{t("prod.capacity.col.current")}</th>
                <th>{t("prod.capacity.col.state")}</th>
              </tr>
            </thead>
            <tbody>
              {resolvedCapacity.limits.map((lim) => {
                const cmp = comparisons.find((c) => c.metricId === lim.metricId);
                return (
                  <tr key={lim.metricId}>
                    <td>{t(lim.labelKey)}</td>
                    <td>
                      {lim.baseSafe}/{lim.baseMax}
                    </td>
                    <td>
                      {lim.resolvedSafe}/{lim.resolvedMax}
                    </td>
                    <td>{cmp?.current ?? loadSnapshot[metricToLoadKey(lim.metricId)]}</td>
                    <td>{cmp ? t(`prod.capacity.state.${cmp.state}`) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}

function metricToLoadKey(
  id: ResolvedCapacitySnapshot["limits"][0]["metricId"],
): keyof ProductionLoadSnapshot {
  const map = {
    activeLaunches: "activeLaunches",
    refreshTasks: "refreshTasks",
    fboPrepTasks: "fboPrepTasks",
    visualJobs: "visualJobs",
    cardJobs: "cardJobs",
    packagingLoad: "packagingLoad",
    blockedTasks: "blockedTasks",
  } as const;
  return map[id];
}
