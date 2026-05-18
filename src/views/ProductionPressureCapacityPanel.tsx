import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  createStarterCapacityProfile,
  deleteCapacityProfile,
  duplicateCapacityProfile,
  loadCapacityProfilesState,
  newCapacityProfileId,
  notifyProductionPressureUpdated,
  resetCapacityProfilesToStarter,
  setActiveCapacityProfile,
  upsertCapacityProfile,
  type CapacityInterpretState,
  type ProductionCapacityProfile,
  type ProductionLoadSnapshot,
  type CapacityMetricComparison,
} from "../lib/production-pressure";

type Props = {
  loadSnapshot: ProductionLoadSnapshot;
  comparisons: CapacityMetricComparison[];
  hasProfile: boolean;
  profileName: string | null;
  onProfilesChange: () => void;
};

function capStateClass(s: CapacityInterpretState): string {
  return `ppr-cap ppr-cap--${s}`;
}

const LIMIT_FIELDS: {
  key: keyof ProductionCapacityProfile;
  labelKey: string;
  group: "team" | "limits";
}[] = [
  { key: "teamSize", labelKey: "prod.capacity.field.teamSize", group: "team" },
  { key: "printersAvailable", labelKey: "prod.capacity.field.printers", group: "team" },
  { key: "pressOperators", labelKey: "prod.capacity.field.pressOps", group: "team" },
  { key: "packers", labelKey: "prod.capacity.field.packers", group: "team" },
  { key: "shiftHours", labelKey: "prod.capacity.field.shiftHours", group: "team" },
  { key: "safeConcurrentLaunches", labelKey: "prod.capacity.field.safeLaunches", group: "limits" },
  { key: "maxConcurrentLaunches", labelKey: "prod.capacity.field.maxLaunches", group: "limits" },
  { key: "safeDailyRefreshes", labelKey: "prod.capacity.field.safeRefresh", group: "limits" },
  { key: "maxDailyRefreshes", labelKey: "prod.capacity.field.maxRefresh", group: "limits" },
  { key: "safeFboPrepTasks", labelKey: "prod.capacity.field.safeFbo", group: "limits" },
  { key: "maxFboPrepTasks", labelKey: "prod.capacity.field.maxFbo", group: "limits" },
  { key: "safeVisualJobs", labelKey: "prod.capacity.field.safeVisual", group: "limits" },
  { key: "maxVisualJobs", labelKey: "prod.capacity.field.maxVisual", group: "limits" },
  { key: "safeCardJobs", labelKey: "prod.capacity.field.safeCards", group: "limits" },
  { key: "maxCardJobs", labelKey: "prod.capacity.field.maxCards", group: "limits" },
  { key: "safePackagingLoad", labelKey: "prod.capacity.field.safePack", group: "limits" },
  { key: "maxPackagingLoad", labelKey: "prod.capacity.field.maxPack", group: "limits" },
  { key: "safeBlockedTasks", labelKey: "prod.capacity.field.safeBlocked", group: "limits" },
  { key: "maxBlockedTasks", labelKey: "prod.capacity.field.maxBlocked", group: "limits" },
];

export function ProductionPressureCapacityPanel({
  loadSnapshot,
  comparisons,
  hasProfile,
  profileName,
  onProfilesChange,
}: Props) {
  const { t } = useI18n();
  const [profileState, setProfileState] = useState(() => loadCapacityProfilesState());
  const [editId, setEditId] = useState<string | null>(profileState.activeProfileId);
  const [draft, setDraft] = useState<ProductionCapacityProfile | null>(null);

  const refresh = useCallback(() => {
    const s = loadCapacityProfilesState();
    setProfileState(s);
    setEditId(s.activeProfileId);
    onProfilesChange();
  }, [onProfilesChange]);

  useEffect(() => {
    const p = editId ? profileState.profiles.find((x) => x.id === editId) : null;
    setDraft(p ? { ...p } : null);
  }, [editId, profileState.profiles]);

  const saveDraft = useCallback(() => {
    if (!draft) return;
    upsertCapacityProfile(draft);
    notifyProductionPressureUpdated();
    refresh();
  }, [draft, refresh]);

  const newProfile = useCallback(() => {
    const base = createStarterCapacityProfile();
    base.id = newCapacityProfileId();
    base.name = t("prod.capacity.defaultName");
    base.active = profileState.profiles.length === 0;
    upsertCapacityProfile(base);
    if (profileState.profiles.length === 0) setActiveCapacityProfile(base.id);
    notifyProductionPressureUpdated();
    refresh();
    setEditId(base.id);
  }, [profileState.profiles.length, refresh, t]);

  const loadRows = useMemo(
    () =>
      [
        ["activeLaunches", loadSnapshot.activeLaunches],
        ["refreshTasks", loadSnapshot.refreshTasks],
        ["fboPrepTasks", loadSnapshot.fboPrepTasks],
        ["visualJobs", loadSnapshot.visualJobs],
        ["cardJobs", loadSnapshot.cardJobs],
        ["packagingLoad", loadSnapshot.packagingLoad],
        ["blockedTasks", loadSnapshot.blockedTasks],
      ] as const,
    [loadSnapshot],
  );

  return (
    <section className="glass-panel ppr-sec ppr-sec--capacity">
      <h2>{t("prod.section.capacityProfile")}</h2>
      <p className="ppr-cap-hint">{t("prod.capacity.hint")}</p>

      {!hasProfile ? (
        <p className="ppr-cap-warn" role="status">
          {t("prod.capacity.noProfile")}
        </p>
      ) : (
        <p className="ppr-cap-active">
          {t("prod.capacity.activeProfile", { name: profileName ?? "—" })}
        </p>
      )}

      <div className="ppr-cap-toolbar">
        <button type="button" className="ghost-btn" onClick={newProfile}>
          {t("prod.capacity.action.new")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => { resetCapacityProfilesToStarter(); notifyProductionPressureUpdated(); refresh(); }}>
          {t("prod.capacity.action.resetStarter")}
        </button>
      </div>

      {profileState.profiles.length > 0 ? (
        <div className="ppr-cap-profiles">
          {profileState.profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ppr-cap-pill${p.id === profileState.activeProfileId ? " ppr-cap-pill--on" : ""}`}
              onClick={() => setEditId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : null}

      {draft ? (
        <div className="ppr-cap-form">
          <label className="ppr-cap-field ppr-cap-field--wide">
            <span>{t("prod.capacity.field.name")}</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <div className="ppr-cap-form-grid">
            {LIMIT_FIELDS.map(({ key, labelKey }) => (
              <label key={key} className="ppr-cap-field">
                <span>{t(labelKey)}</span>
                <input
                  type="number"
                  min={0}
                  value={draft[key] as number}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </label>
            ))}
          </div>
          <label className="ppr-cap-field ppr-cap-field--wide">
            <span>{t("prod.capacity.field.notes")}</span>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
          <div className="ppr-cap-form-actions">
            <button type="button" className="primary-btn" onClick={saveDraft}>
              {t("prod.capacity.action.save")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setActiveCapacityProfile(draft.id);
                notifyProductionPressureUpdated();
                refresh();
              }}
            >
              {t("prod.capacity.action.setActive")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                duplicateCapacityProfile(draft.id);
                notifyProductionPressureUpdated();
                refresh();
              }}
            >
              {t("prod.capacity.action.duplicate")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                deleteCapacityProfile(draft.id);
                notifyProductionPressureUpdated();
                refresh();
              }}
            >
              {t("prod.capacity.action.delete")}
            </button>
          </div>
        </div>
      ) : null}

      <h3 className="ppr-cap-sub">{t("prod.capacity.loadTitle")}</h3>
      <ul className="ppr-cap-load">
        {loadRows.map(([id, n]) => (
          <li key={id}>
            <span>{t(`prod.capacity.metric.${id}`)}</span>
            <strong>{n}</strong>
          </li>
        ))}
      </ul>
      {loadSnapshot.sourceNotes.length > 0 ? (
        <p className="ppr-cap-sources">
          {loadSnapshot.sourceNotes.map((k) => t(k)).join(" · ")}
        </p>
      ) : null}

      <h3 className="ppr-cap-sub">{t("prod.capacity.compareTitle")}</h3>
      <table className="ppr-cap-table">
        <thead>
          <tr>
            <th>{t("prod.capacity.col.metric")}</th>
            <th>{t("prod.capacity.col.current")}</th>
            <th>{t("prod.capacity.col.safe")}</th>
            <th>{t("prod.capacity.col.max")}</th>
            <th>{t("prod.capacity.col.state")}</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((c) => (
            <tr key={c.metricId}>
              <td>{t(c.labelKey)}</td>
              <td>{c.current}</td>
              <td>{c.safe ?? "—"}</td>
              <td>{c.max ?? "—"}</td>
              <td>
                <span className={capStateClass(c.state)}>{t(`prod.capacity.state.${c.state}`)}</span>
                {c.usagePercent !== null ? (
                  <span className="ppr-cap-usage">
                    {t("prod.capacity.usage", { pct: String(c.usagePercent) })}
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="ppr-cap-summaries">
        {comparisons.map((c) => (
          <li key={`${c.metricId}-sum`}>{t(c.summaryKey, c.summaryVars)}</li>
        ))}
      </ul>
    </section>
  );
}
