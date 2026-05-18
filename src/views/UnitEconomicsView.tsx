import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  buildGuardrailSummaryForMemory,
  buildEconomicGuardrails,
  profileRowsFromStorage,
  resolveGuardrail,
  sortGuardrails,
} from "../lib/economic-guardrails";
import {
  buildAllPricePositioningReports,
  buildPricePositioningReport,
  reportToResolvedLines,
} from "../lib/price-positioning";
import {
  applyTemplateToProfile,
  buildUnitEconomicsMemoryPayload,
  calculateUnitEconomics,
  formatResolvedSourceLine,
  loadUnitEconomicsBundle,
  newUnitEconomicsProfileId,
  newUnitEconomicsTemplateId,
  notifyUnitEconomicsUpdated,
  presetTemplateDefaults,
  profileFromTemplate,
  resolveUnitEconomics,
  saveUnitEconomicsBundle,
  saveUnitEconomicsSession,
  templateFromProfile,
  TEMPLATE_PRODUCT_TYPES,
  templateDisplayName,
  type MarginPressureLevel,
  type TemplateProductType,
  type UnitEconomicsProfile,
  type UnitEconomicsTemplate,
} from "../lib/unit-economics";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

const EMPTY_PROFILE = (): UnitEconomicsProfile => ({
  id: newUnitEconomicsProfileId(),
  name: "",
  corridor: "",
  productFamily: "",
  marketplace: "",
  stockMode: "",
  salePrice: 0,
  blankCost: 0,
  printCost: 0,
  packagingCost: 0,
  commissionPercent: 15,
  logisticsCost: 0,
  fboCost: 0,
  adCostEstimate: 0,
  returnRiskPercent: 8,
  targetMarginPercent: 25,
  notes: "",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

function levelClass(level: MarginPressureLevel): string {
  return `ue-lvl ue-lvl--${level}`;
}

function priceLevelClass(level: string): string {
  return `ppr-lvl ppr-lvl--${level}`;
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="ue-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <label className="ue-field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const EMPTY_TEMPLATE = (productType: TemplateProductType = "regular_tshirt_fbs"): UnitEconomicsTemplate => {
  const base = presetTemplateDefaults(productType);
  return {
    id: newUnitEconomicsTemplateId(),
    name: "",
    ...base,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export function UnitEconomicsView({ onNavigate }: Props) {
  const { t } = useI18n();
  const initial = loadUnitEconomicsBundle();
  const [profiles, setProfiles] = useState<UnitEconomicsProfile[]>(() => initial.profiles);
  const [templates, setTemplates] = useState<UnitEconomicsTemplate[]>(() => initial.templates);
  const [assignments, setAssignments] = useState(() => initial.assignments);
  const [selectedId, setSelectedId] = useState<string | null>(() => initial.profiles[0]?.id ?? null);
  const [selectedTplId, setSelectedTplId] = useState<string | null>(() => initial.templates[0]?.id ?? null);
  const [draft, setDraft] = useState<UnitEconomicsProfile | null>(null);
  const [tplDraft, setTplDraft] = useState<UnitEconomicsTemplate | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = profiles.find((p) => p.id === selectedId) ?? null;
  const working = draft ?? selected ?? null;

  useEffect(() => {
    if (!selectedId && profiles[0]) setSelectedId(profiles[0].id);
  }, [profiles, selectedId]);

  useEffect(() => {
    setDraft(null);
  }, [selectedId]);

  useEffect(() => {
    setTplDraft(null);
  }, [selectedTplId]);

  const calculated = useMemo(
    () => (working ? calculateUnitEconomics(working) : null),
    [working],
  );

  const selectedTpl = templates.find((x) => x.id === selectedTplId) ?? null;
  const workingTpl = tplDraft ?? selectedTpl ?? null;
  const tplCalculated = useMemo(
    () => (workingTpl ? calculateUnitEconomics(profileFromTemplate(workingTpl, workingTpl.id)) : null),
    [workingTpl],
  );

  const resolvedForWorking = useMemo(() => {
    if (!working) return null;
    return resolveUnitEconomics(
      { corridor: working.corridor, productFamily: working.productFamily, marketplace: working.marketplace, stockMode: working.stockMode },
      { profiles, templates, assignments },
    );
  }, [assignments, profiles, templates, working]);

  const priceReport = useMemo(() => {
    if (!resolvedForWorking) return null;
    return buildPricePositioningReport(resolvedForWorking, {
      corridor: working?.corridor,
      productFamily: working?.productFamily,
      economicsNotes: working?.notes,
    });
  }, [resolvedForWorking, working?.corridor, working?.notes, working?.productFamily]);

  const allGuardrails = useMemo(
    () => buildEconomicGuardrails(profileRowsFromStorage(), {}),
    [profiles],
  );

  const profileGuardrails = useMemo(() => {
    if (!working) return [];
    return sortGuardrails(allGuardrails.filter((g) => g.sourceProfileId === working.id));
  }, [allGuardrails, working]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const persistBundle = useCallback(
    (next: { profiles: UnitEconomicsProfile[]; templates: UnitEconomicsTemplate[]; assignments: typeof assignments }) => {
      setProfiles(next.profiles);
      setTemplates(next.templates);
      setAssignments(next.assignments);
      saveUnitEconomicsBundle(next);
      notifyUnitEconomicsUpdated();
    },
    [],
  );

  const persist = useCallback(
    (next: UnitEconomicsProfile[]) => {
      persistBundle({ profiles: next, templates, assignments });
    },
    [assignments, persistBundle, templates],
  );

  const persistTemplates = useCallback(
    (next: UnitEconomicsTemplate[]) => {
      persistBundle({ profiles, templates: next, assignments });
    },
    [assignments, persistBundle, profiles],
  );

  const patchWorking = useCallback((patch: Partial<UnitEconomicsProfile>) => {
    if (!working) return;
    setDraft({ ...working, ...patch, updatedAt: Date.now() });
  }, [working]);

  const patchWorkingTpl = useCallback((patch: Partial<UnitEconomicsTemplate>) => {
    if (!workingTpl) return;
    setTplDraft({ ...workingTpl, ...patch, updatedAt: Date.now() });
  }, [workingTpl]);

  const saveProfile = useCallback(() => {
    if (!working) return;
    const row = { ...working, updatedAt: Date.now() };
    const exists = profiles.some((p) => p.id === row.id);
    const next = exists ? profiles.map((p) => (p.id === row.id ? row : p)) : [...profiles, row];
    persist(next);
    setSelectedId(row.id);
    setDraft(null);
    showToast(t("ue.toast.saved"));
  }, [persist, profiles, showToast, t, working]);

  const addProfile = useCallback(() => {
    const row = EMPTY_PROFILE();
    persist([...profiles, row]);
    setSelectedId(row.id);
    setDraft(row);
  }, [persist, profiles]);

  const removeProfile = useCallback(() => {
    if (!selectedId) return;
    const next = profiles.filter((p) => p.id !== selectedId);
    persist(next);
    setSelectedId(next[0]?.id ?? null);
    setDraft(null);
    showToast(t("ue.toast.removed"));
  }, [persist, profiles, selectedId, showToast, t]);

  const saveMemory = useCallback(() => {
    const guardrails = buildEconomicGuardrails(profileRowsFromStorage(), {});
    const guardrailSummary = buildGuardrailSummaryForMemory(guardrails, t);
    const priceReports = buildAllPricePositioningReports();
    const payload = buildUnitEconomicsMemoryPayload(
      { profiles, templates, assignments },
      { guardrails, guardrailSummary, priceReports },
    );
    saveUnitEconomicsSession(payload);
    recordGeneration({
      module: "unit_economics",
      title: t("ue.memory.title"),
      content: JSON.stringify(payload, null, 2),
      mime: "application/json",
      previewText: t("ue.memory.preview", { n: String(profiles.length) }),
    });
    notifyUnitEconomicsUpdated();
    showToast(t("ue.toast.memory"));
  }, [assignments, profiles, showToast, t, templates]);

  const saveTemplate = useCallback(() => {
    if (!workingTpl) return;
    const row = { ...workingTpl, updatedAt: Date.now() };
    const next = templates.some((x) => x.id === row.id)
      ? templates.map((x) => (x.id === row.id ? row : x))
      : [...templates, row];
    persistTemplates(next);
    setSelectedTplId(row.id);
    setTplDraft(null);
    showToast(t("ue.tpl.toast.saved"));
  }, [persistTemplates, showToast, t, templates, workingTpl]);

  const addTemplate = useCallback(
    (productType: TemplateProductType) => {
      const row = { ...EMPTY_TEMPLATE(productType), name: templateDisplayName(productType, t) };
      persistTemplates([...templates, row]);
      setSelectedTplId(row.id);
      setTplDraft(row);
    },
    [persistTemplates, t, templates],
  );

  const duplicateTemplate = useCallback(() => {
    if (!workingTpl) return;
    const row = { ...workingTpl, id: newUnitEconomicsTemplateId(), name: `${workingTpl.name} copy`, createdAt: Date.now(), updatedAt: Date.now() };
    persistTemplates([...templates, row]);
    setSelectedTplId(row.id);
    setTplDraft(row);
  }, [persistTemplates, templates, workingTpl]);

  const removeTemplate = useCallback(() => {
    if (!selectedTplId) return;
    persistTemplates(templates.filter((x) => x.id !== selectedTplId));
    setSelectedTplId(templates[0]?.id ?? null);
    setTplDraft(null);
    showToast(t("ue.tpl.toast.removed"));
  }, [persistTemplates, selectedTplId, showToast, t, templates]);

  const createTemplateFromProfile = useCallback(() => {
    if (!working) return;
    const row = templateFromProfile(working, newUnitEconomicsTemplateId(), working.name || t("ue.tpl.fromProfile"));
    persistTemplates([...templates, row]);
    setSelectedTplId(row.id);
    showToast(t("ue.tpl.toast.fromProfile"));
  }, [persistTemplates, showToast, t, working]);

  const applyTemplateToCurrentProfile = useCallback(() => {
    if (!working || !workingTpl) return;
    const next = applyTemplateToProfile(working, workingTpl, true);
    setDraft(next);
    showToast(t("ue.tpl.toast.applied"));
  }, [showToast, t, working, workingTpl]);

  return (
    <div className="ue-page">
      <header className="glass-panel ue-head">
        <p className="ue-eyebrow">{t("ue.eyebrow")}</p>
        <h1>{t("nav.unitEconomics")}</h1>
        <p className="ue-lede">{t("ue.lede")}</p>
        <p className="ue-disclaimer">{t("ue.disclaimer")}</p>
        <div className="ue-head__actions">
          <button type="button" className="primary-btn" onClick={addProfile}>
            {t("ue.action.add")}
          </button>
          <button type="button" className="primary-btn" onClick={saveProfile} disabled={!working}>
            {t("ue.action.saveProfile")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveMemory} disabled={!profiles.length}>
            {t("ue.action.saveMemory")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(JSON.stringify({ profiles, calculated }, null, 2))}
            disabled={!working}
          >
            {t("ue.action.copyJson")}
          </button>
          {working ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => downloadJson(`unit-economics-${working.id}.json`, working)}
            >
              {t("ue.action.exportJson")}
            </button>
          ) : null}
        </div>
      </header>

      {toast ? <p className="ue-toast">{toast}</p> : null}

      <div className="ue-layout">
        <aside className="glass-panel ue-list">
          <h2>{t("ue.section.profiles")}</h2>
          <ul>
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={p.id === selectedId ? "ue-list__btn ue-list__btn--on" : "ue-list__btn"}
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.name || p.corridor || t("ue.profile.unnamed")}
                </button>
              </li>
            ))}
          </ul>
          {profiles.length ? (
            <button type="button" className="ghost-btn ue-list__del" onClick={removeProfile}>
              {t("ue.action.remove")}
            </button>
          ) : (
            <p className="ue-empty">{t("ue.empty")}</p>
          )}
        </aside>

        {working && calculated ? (
          <>
            <section className="glass-panel ue-sec">
              <h2>{t("ue.section.input")}</h2>
              <p className="ue-manual-tag">{t("ue.manualTag")}</p>
              <div className="ue-grid">
                <TextField label={t("ue.field.name")} value={working.name} onChange={(name) => patchWorking({ name })} />
                <TextField label={t("ue.field.corridor")} value={working.corridor} onChange={(corridor) => patchWorking({ corridor })} />
                <TextField
                  label={t("ue.field.productFamily")}
                  value={working.productFamily}
                  onChange={(productFamily) => patchWorking({ productFamily })}
                />
                <TextField
                  label={t("ue.field.marketplace")}
                  value={working.marketplace}
                  onChange={(marketplace) => patchWorking({ marketplace })}
                />
                <TextField label={t("ue.field.stockMode")} value={working.stockMode} onChange={(stockMode) => patchWorking({ stockMode })} />
                <NumField label={t("ue.field.salePrice")} value={working.salePrice} onChange={(salePrice) => patchWorking({ salePrice })} />
                <NumField label={t("ue.field.blankCost")} value={working.blankCost} onChange={(blankCost) => patchWorking({ blankCost })} />
                <NumField label={t("ue.field.printCost")} value={working.printCost} onChange={(printCost) => patchWorking({ printCost })} />
                <NumField
                  label={t("ue.field.packagingCost")}
                  value={working.packagingCost}
                  onChange={(packagingCost) => patchWorking({ packagingCost })}
                />
                <NumField
                  label={t("ue.field.commissionPercent")}
                  value={working.commissionPercent}
                  onChange={(commissionPercent) => patchWorking({ commissionPercent })}
                  step={0.1}
                />
                <NumField
                  label={t("ue.field.logisticsCost")}
                  value={working.logisticsCost}
                  onChange={(logisticsCost) => patchWorking({ logisticsCost })}
                />
                <NumField label={t("ue.field.fboCost")} value={working.fboCost} onChange={(fboCost) => patchWorking({ fboCost })} />
                <NumField
                  label={t("ue.field.adCostEstimate")}
                  value={working.adCostEstimate}
                  onChange={(adCostEstimate) => patchWorking({ adCostEstimate })}
                />
                <NumField
                  label={t("ue.field.returnRiskPercent")}
                  value={working.returnRiskPercent}
                  onChange={(returnRiskPercent) => patchWorking({ returnRiskPercent })}
                  step={0.1}
                />
                <NumField
                  label={t("ue.field.targetMarginPercent")}
                  value={working.targetMarginPercent}
                  onChange={(targetMarginPercent) => patchWorking({ targetMarginPercent })}
                  step={0.1}
                />
              </div>
              <label className="ue-field ue-field--full">
                <span>{t("ue.field.notes")}</span>
                <textarea value={working.notes} onChange={(e) => patchWorking({ notes: e.target.value })} rows={3} />
              </label>
            </section>

            {resolvedForWorking ? (
              <p className="ue-match-line">
                {t("ue.match.source", { source: formatResolvedSourceLine(resolvedForWorking, t) })}
              </p>
            ) : (
              <p className="ue-match-line ue-match-line--none">{t("ue.match.none")}</p>
            )}

            <section className="glass-panel ue-sec">
              <h2>{t("ue.section.calculated")}</h2>
              <p className="ue-manual-tag">{t("ue.estimateTag")}</p>
              <dl className="ue-metrics">
                <div>
                  <dt>{t("ue.metric.grossProfit")}</dt>
                  <dd>{calculated.estimatedGrossProfit} ₽</dd>
                </div>
                <div>
                  <dt>{t("ue.metric.marginPercent")}</dt>
                  <dd className={levelClass(calculated.marginPressureLevel)}>
                    {calculated.estimatedMarginPercent}% · {t(`ue.level.${calculated.marginPressureLevel}`)}
                  </dd>
                </div>
                <div>
                  <dt>{t("ue.metric.breakEven")}</dt>
                  <dd>{calculated.breakEvenPrice} ₽</dd>
                </div>
                <div>
                  <dt>{t("ue.metric.maxAd")}</dt>
                  <dd>{calculated.maxAdCostBeforeTargetBreak} ₽</dd>
                </div>
                <div>
                  <dt>{t("ue.metric.targetGap")}</dt>
                  <dd>
                    {calculated.targetMarginGapPercent > 0 ? "+" : ""}
                    {calculated.targetMarginGapPercent} pp
                  </dd>
                </div>
                <div>
                  <dt>{t("ue.metric.safetyBand")}</dt>
                  <dd>{t(calculated.safetyBandKey, calculated.safetyBandVars)}</dd>
                </div>
              </dl>
            </section>

            {priceReport ? (
              <section className="glass-panel ue-sec">
                <h2>{t("ppr.section.title")}</h2>
                <p className="ue-manual-tag">{t("ppr.section.sub")}</p>
                <dl className="ue-metrics">
                  <div>
                    <dt>{t("ppr.metric.salePrice")}</dt>
                    <dd>{priceReport.salePrice} ₽</dd>
                  </div>
                  <div>
                    <dt>{t("ppr.metric.breakEven")}</dt>
                    <dd>{priceReport.breakEvenPrice} ₽</dd>
                  </div>
                  <div>
                    <dt>{t("ppr.metric.targetPrice")}</dt>
                    <dd>{priceReport.targetPrice} ₽</dd>
                  </div>
                  <div>
                    <dt>{t("ppr.metric.marginGap")}</dt>
                    <dd>
                      {priceReport.marginGap > 0 ? "+" : ""}
                      {priceReport.marginGap} pp
                    </dd>
                  </div>
                  <div>
                    <dt>{t("ppr.metric.adGap")}</dt>
                    <dd>{priceReport.adSafetyGap} ₽</dd>
                  </div>
                  <div>
                    <dt>{t("ppr.metric.level")}</dt>
                    <dd className={priceLevelClass(priceReport.pricePressureLevel)}>
                      {t(`ppr.level.${priceReport.pricePressureLevel}`)}
                    </dd>
                  </div>
                </dl>
                <p className="ue-ppr-action">
                  {reportToResolvedLines(priceReport, t).recommendedAction}
                </p>
                {priceReport.premiumProofRequired ? (
                  <p className="ue-ppr-warn">{t("ppr.warn.premiumProofRequired", priceReport.recommendedPriceActionVars)}</p>
                ) : null}
                <ul className="ue-ppr-warns">
                  {reportToResolvedLines(priceReport, t).warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
                <p className="ue-manual-tag">{reportToResolvedLines(priceReport, t).confidenceNote}</p>
              </section>
            ) : null}

            <section className="glass-panel ue-sec">
              <h2>{t("egr.section.title")}</h2>
              <p className="ue-manual-tag">{t("egr.section.sub")}</p>
              {profileGuardrails.length ? (
                <ul className="ue-guardrails">
                  {profileGuardrails.map((g) => {
                    const r = resolveGuardrail(g, t);
                    return (
                      <li key={g.id} className={`ue-gr ue-gr--${g.severity}`}>
                        <p className="ue-gr__type">{t(`egr.type.${g.guardrailType}`)} · {t(`egr.severity.${g.severity}`)}</p>
                        <p className="ue-gr__title">{r.title}</p>
                        <p className="ue-gr__reason">{r.reason}</p>
                        <p className="ue-gr__action">{r.recommendedAction}</p>
                        <p className="ue-gr__systems">
                          {g.affectedSystems.map((s) => t(`egr.system.${s}`)).join(" · ")}
                        </p>
                        <p className="ue-gr__conf">{r.confidenceNote}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="ue-empty">{t("egr.empty")}</p>
              )}
            </section>

            <section className="glass-panel ue-sec ue-sec--actions">
              <h2>{t("ue.section.integrations")}</h2>
              <div className="ue-actions">
                <button type="button" className="ghost-btn" onClick={() => onNavigate("economicPressure")}>
                  {t("ue.action.economicPressure")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("launchOperations")}>
                  {t("ue.action.launchOps")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
                  {t("ue.action.assortment")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
                  {t("ue.action.collection")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("founderBrief")}>
                  {t("ue.action.founderBrief")}
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="glass-panel ue-sec">
            <p className="ue-empty">{t("ue.empty")}</p>
          </section>
        )}
      </div>

      <section className="glass-panel ue-tpl-sec">
        <h2>{t("ue.tpl.section.title")}</h2>
        <p className="ue-manual-tag">{t("ue.tpl.section.sub")}</p>
        <div className="ue-tpl-actions">
          {TEMPLATE_PRODUCT_TYPES.map((pt) => (
            <button key={pt} type="button" className="ghost-btn" onClick={() => addTemplate(pt)}>
              {t(`ue.tpl.preset.${pt}`)}
            </button>
          ))}
          <button type="button" className="ghost-btn" onClick={createTemplateFromProfile} disabled={!working}>
            {t("ue.tpl.action.fromProfile")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void copyToClipboard(JSON.stringify(templates, null, 2))}>
            {t("ue.tpl.action.exportJson")}
          </button>
        </div>
        <div className="ue-tpl-layout">
          <aside className="ue-list">
            <ul>
              {templates.map((tpl) => (
                <li key={tpl.id}>
                  <button
                    type="button"
                    className={tpl.id === selectedTplId ? "ue-list__btn ue-list__btn--on" : "ue-list__btn"}
                    onClick={() => setSelectedTplId(tpl.id)}
                  >
                    {tpl.name || tpl.productType}
                  </button>
                </li>
              ))}
            </ul>
            {templates.length ? (
              <button type="button" className="ghost-btn ue-list__del" onClick={removeTemplate}>
                {t("ue.tpl.action.remove")}
              </button>
            ) : (
              <p className="ue-empty">{t("ue.tpl.empty")}</p>
            )}
          </aside>
          {workingTpl && tplCalculated ? (
            <div className="ue-tpl-editor">
              <div className="ue-tpl-editor__actions">
                <button type="button" className="primary-btn" onClick={saveTemplate}>
                  {t("ue.tpl.action.save")}
                </button>
                <button type="button" className="ghost-btn" onClick={duplicateTemplate}>
                  {t("ue.tpl.action.duplicate")}
                </button>
                <button type="button" className="ghost-btn" onClick={applyTemplateToCurrentProfile} disabled={!working}>
                  {t("ue.tpl.action.applyToProfile")}
                </button>
              </div>
              <div className="ue-grid">
                <TextField label={t("ue.field.name")} value={workingTpl.name} onChange={(name) => patchWorkingTpl({ name })} />
                <TextField label={t("ue.tpl.field.productType")} value={workingTpl.productType} onChange={(productType) => patchWorkingTpl({ productType })} />
                <TextField label={t("ue.tpl.field.fitType")} value={workingTpl.fitType} onChange={(fitType) => patchWorkingTpl({ fitType })} />
                <TextField label={t("ue.field.marketplace")} value={workingTpl.marketplace} onChange={(marketplace) => patchWorkingTpl({ marketplace })} />
                <TextField label={t("ue.field.stockMode")} value={workingTpl.stockMode} onChange={(stockMode) => patchWorkingTpl({ stockMode })} />
                <NumField label={t("ue.field.salePrice")} value={workingTpl.salePrice} onChange={(salePrice) => patchWorkingTpl({ salePrice })} />
                <NumField label={t("ue.field.blankCost")} value={workingTpl.blankCost} onChange={(blankCost) => patchWorkingTpl({ blankCost })} />
                <NumField label={t("ue.field.printCost")} value={workingTpl.printCost} onChange={(printCost) => patchWorkingTpl({ printCost })} />
                <NumField label={t("ue.field.packagingCost")} value={workingTpl.packagingCost} onChange={(packagingCost) => patchWorkingTpl({ packagingCost })} />
                <NumField label={t("ue.field.commissionPercent")} value={workingTpl.commissionPercent} onChange={(commissionPercent) => patchWorkingTpl({ commissionPercent })} step={0.1} />
                <NumField label={t("ue.field.logisticsCost")} value={workingTpl.logisticsCost} onChange={(logisticsCost) => patchWorkingTpl({ logisticsCost })} />
                <NumField label={t("ue.field.fboCost")} value={workingTpl.fboCost} onChange={(fboCost) => patchWorkingTpl({ fboCost })} />
                <NumField label={t("ue.field.adCostEstimate")} value={workingTpl.adCostEstimate} onChange={(adCostEstimate) => patchWorkingTpl({ adCostEstimate })} />
                <NumField label={t("ue.field.returnRiskPercent")} value={workingTpl.returnRiskPercent} onChange={(returnRiskPercent) => patchWorkingTpl({ returnRiskPercent })} step={0.1} />
                <NumField label={t("ue.field.targetMarginPercent")} value={workingTpl.targetMarginPercent} onChange={(targetMarginPercent) => patchWorkingTpl({ targetMarginPercent })} step={0.1} />
              </div>
              <p className="ue-tpl-preview">
                {t("ue.tpl.previewMargin", {
                  margin: String(tplCalculated.estimatedMarginPercent),
                  level: t(`ue.level.${tplCalculated.marginPressureLevel}`),
                })}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <style>{`
        .ue-page { max-width: 1100px; margin: 0 auto; padding: 0 0 48px; }
        .ue-head { padding: 20px 22px; margin-bottom: 16px; }
        .ue-eyebrow { opacity: 0.65; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
        .ue-lede { margin: 8px 0 0; opacity: 0.88; max-width: 62ch; }
        .ue-disclaimer { margin: 10px 0 0; font-size: 13px; opacity: 0.72; font-style: italic; }
        .ue-manual-tag { font-size: 12px; opacity: 0.7; margin: 0 0 12px; }
        .ue-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .ue-layout { display: grid; grid-template-columns: 220px 1fr; gap: 14px; }
        @media (max-width: 860px) { .ue-layout { grid-template-columns: 1fr; } }
        .ue-list { padding: 14px; }
        .ue-list ul { list-style: none; margin: 0; padding: 0; }
        .ue-list__btn { width: 100%; text-align: left; background: none; border: none; padding: 8px 6px; cursor: pointer; font: inherit; opacity: 0.85; }
        .ue-list__btn--on { opacity: 1; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .ue-list__del { margin-top: 12px; width: 100%; }
        .ue-sec { padding: 16px 18px; margin-bottom: 14px; }
        .ue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
        .ue-field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
        .ue-field input, .ue-field textarea { padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); color: inherit; }
        .ue-field--full { margin-top: 12px; }
        .ue-metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin: 0; }
        .ue-metrics dt { font-size: 12px; opacity: 0.65; }
        .ue-metrics dd { margin: 4px 0 0; font-size: 15px; }
        .ue-lvl--healthy { color: #8fd4a8; }
        .ue-lvl--acceptable { color: #a8c8e8; }
        .ue-lvl--tight { color: #e8c890; }
        .ue-lvl--dangerous { color: #e8a090; }
        .ue-lvl--negative { color: #e87870; }
        .ue-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .ue-empty { opacity: 0.75; }
        .ue-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
        .ue-guardrails { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .ue-gr { padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
        .ue-gr--critical { border-color: rgba(232,120,112,0.45); }
        .ue-gr--elevated { border-color: rgba(232,160,144,0.35); }
        .ue-gr--caution { border-color: rgba(232,200,144,0.3); }
        .ue-gr__type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; margin: 0 0 6px; }
        .ue-gr__title { font-weight: 600; margin: 0 0 6px; }
        .ue-gr__reason, .ue-gr__action, .ue-gr__systems, .ue-gr__conf { margin: 4px 0 0; font-size: 13px; opacity: 0.88; }
        .ue-gr__conf { font-style: italic; opacity: 0.65; }
        .ue-match-line { font-size: 13px; margin: 0 0 12px; padding: 8px 12px; border-radius: 8px; background: rgba(255,255,255,0.04); }
        .ue-match-line--none { opacity: 0.7; font-style: italic; }
        .ue-tpl-sec { padding: 16px 18px; margin-top: 18px; }
        .ue-tpl-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .ue-tpl-layout { display: grid; grid-template-columns: 220px 1fr; gap: 14px; }
        .ue-tpl-editor__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .ue-tpl-preview { margin-top: 10px; font-size: 13px; opacity: 0.85; }
        .ppr-lvl--safe { color: #8fd4a8; }
        .ppr-lvl--watch { color: #a8c8e8; }
        .ppr-lvl--tight { color: #e8c890; }
        .ppr-lvl--dangerous { color: #e8a090; }
        .ppr-lvl--negative { color: #e87870; }
        .ue-ppr-action { margin: 12px 0 8px; font-weight: 600; }
        .ue-ppr-warns { margin: 8px 0 0; padding-left: 18px; opacity: 0.9; font-size: 13px; }
        .ue-ppr-warn { margin: 8px 0; font-size: 13px; opacity: 0.88; }
      `}</style>
    </div>
  );
}
