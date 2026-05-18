import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  buildCollectionEntity,
  buildLaunchPackV1,
  buildProductionBriefRu,
  buildSeoBriefRu,
  buildVisualBriefRu,
  buildWorkshopSkuStructure,
  collectionEntityToMarkdown,
  collectionPipelineBundleToJson,
  collectionPipelineBundleToMarkdown,
  compareWorkshopCandidates,
  launchPackSummaryRu,
  launchPackToJson,
  launchPackToMarkdown,
  mergeWorkshopEntity,
  useCollectionDeriveInput,
  useCollectionPipelineForEntity,
  useCollectionPipelineInputWithoutEntity,
} from "../lib/collection-builder";
import type { CollectionEntity, WorkshopDraft } from "../lib/collection-builder";
import { useExecutiveDecisionBoard } from "../lib/executive-decision-compression";
import { useLiveState } from "../lib/live-state";
import { buildCollectionPromptPack, promptBundleCopyBlock } from "../lib/prompt-composer";
import {
  buildPromptPackEntity,
  savePromptPackToSession,
  type PromptPackKind,
  type PromptPackMarketplaceCode,
} from "../lib/prompt-pack";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import {
  ENTITY_SNAPSHOT_EVENT,
  deriveSnapshotIntelligence,
  getActiveEntitySnapshot,
  readSnapshotCollectionHint,
  writeSnapshotCollectionHint,
  clearSnapshotCollectionHint,
} from "../lib/entity-snapshot";
import { consumeCollectionBuilderSerpHint } from "../lib/competitor-serp";
import { setAssortmentActionStatus } from "../lib/assortment-actions";
import { addCollectionExecutionActionsToAssortmentPlan } from "../lib/collection-assortment-bridge";
import { loadPromptPackFromSession } from "../lib/prompt-pack/sessionStorage";
import { getCollectionGuardrailHint, loadEconomicGuardrails } from "../lib/economic-guardrails";
import { buildLaunchPriceReport, getCollectionPricePressureHint } from "../lib/price-positioning";
import { buildPrimaryMarketTimingReport, getCollectionMarketTimingHint } from "../lib/market-timing";
import { buildPrimaryCorridorStrategyReport, getCollectionCorridorStrategyHint } from "../lib/corridor-strategy";
import { buildFboFbsDecisionReport, getCollectionFboFbsHint } from "../lib/fbo-fbs-decision";
import { buildScalingSafetyReport, getCollectionScalingSafetyHint } from "../lib/scaling-safety";
import {
  assignTemplateToCollection,
  findAssignmentForTarget,
  getCollectionEconomicsAssignmentLine,
  getCollectionUnitEconomicsHint,
  loadUnitEconomicsBundle,
  notifyUnitEconomicsUpdated,
  UNIT_ECONOMICS_EVENT,
} from "../lib/unit-economics";

type Props = { onNavigate: (id: NavId) => void };

const CANDIDATE_SALTS = [0, 1, 2, 3, 4] as const;

function kindKey(k: string): string {
  return `collectionBuilder.kind.${k}`;
}

function clusterCount(entity: CollectionEntity, role: "hero" | "support"): number {
  const c = entity.skuClusters.find((x) => x.role === role);
  return c?.count ?? (role === "hero" ? 2 : 6);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function excerpt(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function CollectionWorkshop({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const baseInput = useCollectionDeriveInput();
  const pipelineInput = useCollectionPipelineInputWithoutEntity();
  const edc = useExecutiveDecisionBoard();
  const { live } = useLiveState();

  const candidates = useMemo(
    () => CANDIDATE_SALTS.map((salt) => buildCollectionEntity({ ...baseInput, candidateSalt: salt })),
    [baseInput],
  );

  const { rows: compareRows, recommendedId } = useMemo(
    () => compareWorkshopCandidates(candidates, pipelineInput),
    [candidates, pipelineInput],
  );

  const rowById = useMemo(() => {
    const m = new Map<string, (typeof compareRows)[0]>();
    for (const r of compareRows) m.set(r.collectionId, r);
    return m;
  }, [compareRows]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [draftsById, setDraftsById] = useState<Record<string, WorkshopDraft>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [snapTick, setSnapTick] = useState(0);
  const [packWizardOpen, setPackWizardOpen] = useState(false);
  const [packKindDraft, setPackKindDraft] = useState<PromptPackKind>("marketplace_launch");
  const [packMpDraft, setPackMpDraft] = useState<PromptPackMarketplaceCode>("wb");
  const [assignTplId, setAssignTplId] = useState("");

  useEffect(() => {
    const fn = () => setSnapTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, fn);
    window.addEventListener(UNIT_ECONOMICS_EVENT, fn);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, fn);
      window.removeEventListener(UNIT_ECONOMICS_EVENT, fn);
    };
  }, []);

  useEffect(() => {
    const hint = consumeCollectionBuilderSerpHint();
    if (!hint) return;
    const arch = hint.archetypeOpportunity?.trim();
    const read = hint.readabilityOpportunity?.trim();
    const bits = [arch, read].filter(Boolean);
    setToast(bits.length ? `${t("serp.collectionContextToast", { query: hint.query })} · ${bits.join(" · ")}` : t("serp.collectionContextToast", { query: hint.query }));
    window.setTimeout(() => setToast(null), 4200);
  }, [t]);

  const snapshotHint = useMemo(() => readSnapshotCollectionHint(), [snapTick]);
  const snapEntity = useMemo(() => getActiveEntitySnapshot(), [snapTick]);
  const snapIntel = useMemo(() => (snapEntity ? deriveSnapshotIntelligence(snapEntity) : null), [snapEntity]);

  useEffect(() => {
    const first = candidates[0]?.id;
    if (!first) return;
    if (!activeId || !candidates.some((c) => c.id === activeId)) setActiveId(first);
  }, [activeId, candidates]);

  const activeRaw = useMemo(
    () => candidates.find((c) => c.id === activeId) ?? candidates[0]!,
    [activeId, candidates],
  );

  const draft = draftsById[activeRaw.id] ?? {};
  const merged = useMemo(() => mergeWorkshopEntity(activeRaw, draft), [activeRaw, draft]);
  const pipeline = useCollectionPipelineForEntity(merged);

  const heroSlots = clamp(draft.heroCount ?? clusterCount(merged, "hero"), 1, 3);
  const supportSlots = clamp(draft.supportCount ?? clusterCount(merged, "support"), 4, 12);
  const ampSlots = draft.amplifiersOn ? 2 : 0;
  const holdSlots = clamp(draft.holdArchiveOn ?? 0, 0, 4);

  const skuStructure = useMemo(
    () => buildWorkshopSkuStructure(merged, heroSlots, supportSlots, ampSlots, holdSlots),
    [ampSlots, heroSlots, holdSlots, merged, supportSlots],
  );

  const visualBrief = useMemo(() => buildVisualBriefRu(merged, draft), [draft, merged]);
  const seoBrief = useMemo(() => buildSeoBriefRu(merged, draft), [draft, merged]);
  const productionBrief = useMemo(() => buildProductionBriefRu(merged, draft), [draft, merged]);

  const launchPack = useMemo(
    () => buildLaunchPackV1(merged, skuStructure, visualBrief, seoBrief, productionBrief, pipeline),
    [merged, pipeline, productionBrief, seoBrief, skuStructure, visualBrief],
  );

  const collectionPromptPack = useMemo(
    () => buildCollectionPromptPack(merged, merged.pulseSeed, live.strategicTension.index01, live.pressureWave.amplitude01),
    [live.pressureWave.amplitude01, live.strategicTension.index01, merged],
  );

  const mdFull = useMemo(
    () => `${collectionEntityToMarkdown(merged)}\n\n${collectionPipelineBundleToMarkdown(pipeline, t)}`,
    [merged, pipeline, t],
  );

  const jsonBundle = useMemo(() => collectionPipelineBundleToJson(pipeline), [pipeline]);

  const patchDraft = useCallback((id: string, patch: Partial<WorkshopDraft>) => {
    setDraftsById((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }, []);

  const compareFiltered = useMemo(
    () => (compareIds.length >= 2 ? compareRows.filter((r) => compareIds.includes(r.collectionId)) : []),
    [compareIds, compareRows],
  );

  const recommendedName = compareRows.find((r) => r.collectionId === recommendedId)?.name ?? recommendedId;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const onAddToAssortmentPlan = useCallback(() => {
    const entitySnap = getActiveEntitySnapshot();
    if (!entitySnap) {
      showToast(t("cab.needSnapshot"));
      return;
    }
    const derived = addCollectionExecutionActionsToAssortmentPlan(
      entitySnap.id,
      {
        collection: merged,
        pipeline,
        skuStructure,
        promptPackInSession: Boolean(loadPromptPackFromSession()),
      },
      t,
    );
    if (!derived.length) {
      showToast(t("cab.noActions"));
      return;
    }
    for (const row of derived) {
      setAssortmentActionStatus(entitySnap.id, row.id, "new");
    }
    showToast(t("cab.added", { n: String(derived.length) }));
    onNavigate("assortmentActions");
  }, [merged, onNavigate, pipeline, showToast, skuStructure, t]);

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "collection_builder",
      title: `${merged.name} · execution · ${merged.id}`,
      content: jsonBundle,
      mime: "application/json",
      tags: ["collection", "execution_route", merged.kind, merged.corridorId],
      meta: {
        corridorNameKey: merged.corridorNameKey,
        pulseSeed: merged.pulseSeed,
        routeId: pipeline.executionRoute.routeId,
        readiness: pipeline.readiness.collectionLaunchReadiness,
      },
    });
    showToast(t("collectionBuilder.toastSaved"));
  }, [
    jsonBundle,
    merged.corridorId,
    merged.corridorNameKey,
    merged.id,
    merged.kind,
    merged.name,
    merged.pulseSeed,
    pipeline.executionRoute.routeId,
    pipeline.readiness.collectionLaunchReadiness,
    showToast,
    t,
  ]);

  const saveLaunchPackMemory = useCallback(() => {
    const raw = launchPackToJson(launchPack);
    recordGeneration({
      module: "collection_builder",
      title: `${merged.name} · Launch Pack · ${merged.id}`,
      content: raw,
      mime: "application/json",
      tags: ["collection", "launch_pack", merged.kind, merged.corridorId],
      meta: {
        routeId: launchPack.executionRoute.routeId,
        readiness: launchPack.executionRoute.readiness,
        pulseSeed: merged.pulseSeed,
      },
    });
    showToast(t("collectionWorkshop.toastLaunchSaved"));
  }, [launchPack, merged.corridorId, merged.id, merged.kind, merged.name, merged.pulseSeed, showToast, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-collection-pipeline-${merged.pulseSeed}.json`, JSON.parse(jsonBundle) as object);
  }, [jsonBundle, merged.pulseSeed]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-collection-pipeline-${merged.pulseSeed}.md`, mdFull);
  }, [mdFull, merged.pulseSeed]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(jsonBundle);
    showToast(t("collectionBuilder.toastCopiedJson"));
  }, [jsonBundle, showToast, t]);

  const exportLaunchJson = useCallback(() => {
    downloadJson(`vokra-launch-pack-${merged.pulseSeed}.json`, JSON.parse(launchPackToJson(launchPack)) as object);
  }, [launchPack, merged.pulseSeed]);

  const exportLaunchMd = useCallback(() => {
    downloadText(`vokra-launch-pack-${merged.pulseSeed}.md`, launchPackToMarkdown(launchPack));
  }, [launchPack, merged.pulseSeed]);

  const copyLaunchSummary = useCallback(async () => {
    await copyToClipboard(launchPackSummaryRu(launchPack));
    showToast(t("collectionWorkshop.toastLaunchCopied"));
  }, [launchPack, showToast, t]);

  const copyPromptHero = useCallback(async () => {
    await copyToClipboard(promptBundleCopyBlock(collectionPromptPack.hero, "marketplaceOptimized"));
    showToast(t("collectionWorkshop.toastPromptCopied"));
  }, [collectionPromptPack.hero, showToast, t]);

  const copyPromptSupport = useCallback(async () => {
    await copyToClipboard(promptBundleCopyBlock(collectionPromptPack.support, "marketplaceOptimized"));
    showToast(t("collectionWorkshop.toastPromptCopied"));
  }, [collectionPromptPack.support, showToast, t]);

  const copyPromptReels = useCallback(async () => {
    await copyToClipboard(promptBundleCopyBlock(collectionPromptPack.reels, "reelsDirection"));
    showToast(t("collectionWorkshop.toastPromptCopied"));
  }, [collectionPromptPack.reels, showToast, t]);

  const copyPromptCampaign = useCallback(async () => {
    await copyToClipboard(promptBundleCopyBlock(collectionPromptPack.campaign, "marketplaceOptimized"));
    showToast(t("collectionWorkshop.toastPromptCopied"));
  }, [collectionPromptPack.campaign, showToast, t]);

  const copyPromptLaunch = useCallback(async () => {
    await copyToClipboard(promptBundleCopyBlock(collectionPromptPack.launch, "short"));
    showToast(t("collectionWorkshop.toastPromptCopied"));
  }, [collectionPromptPack.launch, showToast, t]);

  const savePromptPackMemory = useCallback(() => {
    recordGeneration({
      module: "prompt_composer",
      title: `${merged.name} · collection prompts · ${merged.id}`,
      content: JSON.stringify(collectionPromptPack, null, 2),
      mime: "application/json",
      tags: ["prompt_composer", "collection", merged.corridorId],
      meta: { collectionId: merged.id, pulseSeed: merged.pulseSeed },
    });
    showToast(t("collectionWorkshop.toastPromptsSaved"));
  }, [collectionPromptPack, merged.corridorId, merged.id, merged.name, merged.pulseSeed, showToast, t]);

  const corridorLabel = t(merged.corridorNameKey);

  const unitBundle = useMemo(() => loadUnitEconomicsBundle(), [snapTick]);
  const collectionAssignment = useMemo(
    () => findAssignmentForTarget("collection", merged.id),
    [merged.id, snapTick],
  );
  const collectionEconLine = useMemo(
    () => getCollectionEconomicsAssignmentLine(unitBundle, merged.id, t),
    [merged.id, unitBundle, t],
  );

  const collectionPriceReport = useMemo(
    () =>
      buildLaunchPriceReport({
        collectionId: merged.id,
        corridor: corridorLabel || merged.corridorId,
        marketplace: "WB/Ozon",
      }),
    [corridorLabel, merged.corridorId, merged.id],
  );

  const unitEconHint = useMemo(() => {
    const ctx = {
      corridor: corridorLabel || merged.corridorId,
      marketplace: "WB/Ozon",
      collectionId: merged.id,
    };
    const mtm = getCollectionMarketTimingHint(buildPrimaryMarketTimingReport(t), t);
    if (mtm) return mtm;
    const cst = getCollectionCorridorStrategyHint(buildPrimaryCorridorStrategyReport(t), t);
    if (cst) return cst;
    const ffd = getCollectionFboFbsHint(buildFboFbsDecisionReport(t), t);
    if (ffd) return ffd;
    const ssf = getCollectionScalingSafetyHint(buildScalingSafetyReport(t), t);
    if (ssf) return ssf;
    const ppr = getCollectionPricePressureHint(collectionPriceReport, t);
    if (ppr) return ppr;
    const guardrails = loadEconomicGuardrails();
    const gr = getCollectionGuardrailHint(guardrails, ctx, t);
    if (gr) return gr;
    return getCollectionUnitEconomicsHint(unitBundle, ctx, t);
  }, [collectionPriceReport, corridorLabel, merged.corridorId, merged.id, unitBundle, t]);

  useEffect(() => {
    if (collectionAssignment?.templateId) setAssignTplId(collectionAssignment.templateId);
  }, [collectionAssignment?.templateId]);

  const assignEconomicsTemplate = useCallback(() => {
    if (!assignTplId) return;
    assignTemplateToCollection(assignTplId, merged.id, merged.name, "WB/Ozon", "");
    notifyUnitEconomicsUpdated();
    setSnapTick((x) => x + 1);
    showToast(t("ue.collection.assignOk"));
  }, [assignTplId, merged.id, merged.name, showToast, t]);

  const finalizeVisualPromptPack = useCallback(() => {
    const entity = buildPromptPackEntity({
      entity: merged,
      corridorLabel,
      pulse: merged.pulseSeed,
      tension01: live.strategicTension.index01,
      pressure01: live.pressureWave.amplitude01,
      packKind: packKindDraft,
      marketplaceCode: packKindDraft === "marketplace_launch" ? packMpDraft : "wb",
      locale: locale === "en" ? "en" : "ru",
    });
    savePromptPackToSession(entity);
    setPackWizardOpen(false);
    onNavigate("promptPack");
  }, [
    corridorLabel,
    live.pressureWave.amplitude01,
    live.strategicTension.index01,
    merged,
    onNavigate,
    packKindDraft,
    packMpDraft,
    locale,
  ]);

  const er = pipeline.executionRoute;
  const r = pipeline.readiness;

  return (
    <div className="cb-lab cb-ws" data-cb-pulse={merged.pulseSeed % 1000}>
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("collectionBuilder.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("collectionBuilder.title")}</h1>
        <p className="cb-lab__lede">{t("collectionBuilder.subtitle")}</p>
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={() => setPackWizardOpen(true)}>
            {t("collectionWorkshop.createPromptPack")}
          </button>
          <button type="button" className="ghost-btn" onClick={onAddToAssortmentPlan}>
            {t("cab.action.addPlan")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("collectionBuilder.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportJson}>
            {t("collectionBuilder.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("collectionBuilder.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyJson}>
            {t("collectionBuilder.copyJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportLaunchJson}>
            {t("collectionWorkshop.exportLaunchJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportLaunchMd}>
            {t("collectionWorkshop.exportLaunchMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyLaunchSummary}>
            {t("collectionWorkshop.copyLaunchSummary")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveLaunchPackMemory}>
            {t("collectionWorkshop.saveLaunchMemory")}
          </button>
        </div>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
      </header>

      {snapshotHint ? (
        <section className="cb-lab__panel glass-panel cw-snap-hint">
          <p className="cb-lab__prose">
            {t(`collectionBuilder.snapshotHint.${snapshotHint.kind}`, { corridor: snapshotHint.corridor ?? "—" })}
          </p>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              clearSnapshotCollectionHint();
              setSnapTick((x) => x + 1);
              showToast(t("collectionBuilder.snapshotHint.cleared"));
            }}
          >
            {t("collectionBuilder.snapshotHint.dismiss")}
          </button>
        </section>
      ) : null}

      <section className="cb-lab__panel glass-panel cw-ue-hint">
        <h2 className="cb-lab__h2">{t("ue.collection.assignTitle")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("ue.collection.assignSub")}</p>
        {collectionEconLine ? <p className="cb-lab__prose">{collectionEconLine}</p> : null}
        <div className="cw-ue-assign">
          <select
            className="cw-ue-select"
            value={assignTplId}
            onChange={(e) => setAssignTplId(e.target.value)}
          >
            <option value="">{t("ue.collection.pickTemplate")}</option>
            {unitBundle.templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name || tpl.productType}
              </option>
            ))}
          </select>
          <button type="button" className="primary-btn" onClick={assignEconomicsTemplate} disabled={!assignTplId}>
            {t("ue.collection.assignBtn")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("unitEconomics")}>
            {t("nav.unitEconomics")}
          </button>
        </div>
        {unitEconHint ? <p className="cb-lab__prose">{unitEconHint}</p> : null}
      </section>

      {snapIntel && snapIntel.corridorSummary.length > 0 ? (
        <section className="cb-lab__panel glass-panel cw-snap-suggest">
          <h2 className="cb-lab__h2">{t("collectionBuilder.snapSuggest.title")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("collectionBuilder.snapSuggest.body")}</p>
          <div className="cw-snap-btns">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                const c = snapIntel.corridorSummary[0]!.corridor;
                writeSnapshotCollectionHint({ kind: "largest_corridor", corridor: c });
                showToast(t("collectionBuilder.snapSuggest.toastCorridor", { c }));
              }}
            >
              {t("collectionBuilder.snapSuggest.corridorBtn", { c: snapIntel.corridorSummary[0]!.corridor })}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                const c = snapIntel.seoGapSummary.topGapCorridor ?? snapIntel.corridorSummary[0]!.corridor;
                writeSnapshotCollectionHint({ kind: "refresh_seo_wave", corridor: c });
                showToast(t("collectionBuilder.snapSuggest.toastSeo"));
              }}
            >
              {t("collectionBuilder.snapSuggest.seoWaveBtn")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                writeSnapshotCollectionHint({
                  kind: "fbo_capsule",
                  corridor: snapIntel.corridorSummary[0]?.corridor,
                });
                showToast(t("collectionBuilder.snapSuggest.toastFbo"));
              }}
            >
              {t("collectionBuilder.snapSuggest.fboBtn")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="cb-lab__panel glass-panel cb-lab__integration">
        <h2 className="cb-lab__h2">{t("collectionBuilder.integration")}</h2>
        <p className="cb-lab__prose">
          <strong>{t("collectionBuilder.execNext")}</strong> {edc.bestNext}
        </p>
        <p className="cb-lab__prose">
          <strong>{t("collectionBuilder.execWhy")}</strong> {edc.whyNow}
        </p>
        <div className="cb-lab__links">
          <button type="button" className="linkish" onClick={() => onNavigate("executionOrchestrator")}>
            {t("collectionBuilder.linkOrchestrator")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("signalFabric")}>
            {t("collectionBuilder.linkFabric")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("temporalStrategy")}>
            {t("collectionBuilder.linkTemporal")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("dna")}>
            {t("collectionBuilder.linkDna")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("visualStrategy")}>
            {t("nav.visualStrategy")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("promptComposer")}>
            {t("nav.promptComposer")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("marketplaceOperations")}>
            {t("nav.marketplaceOperations")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("skuIntelligence")}>
            {t("nav.skuIntelligence")}
          </button>
        </div>
      </section>

      <section className="cb-lab__panel glass-panel cb-ws__block">
        <h2 className="cb-lab__h2">{t("collectionWorkshop.workspace")}</h2>
        <div className="cb-ws__active-bar">
          <div>
            <p className="cb-ws__label">{t("collectionWorkshop.active")}</p>
            <p className="cb-ws__active-name">{merged.name}</p>
            <p className="cb-ws__meta">
              {t("collectionBuilder.corridor")}: {t(merged.corridorNameKey)} · {t("collectionBuilder.kindLabel")}:{" "}
              {t(kindKey(merged.kind))}
            </p>
            <p className="cb-ws__meta cb-ws__meta--rec">
              <strong>{t("collectionWorkshop.recommended")}:</strong> {recommendedName}
            </p>
          </div>
          <div className="cb-ws__readiness-block">
            <p className="cb-ws__label">{t("collectionWorkshop.readiness")}</p>
            <p className="cb-ws__mega">
              <strong>{r.collectionLaunchReadiness}%</strong>
            </p>
            <div className="cb-lab__diff cb-lab__diff--launch" style={{ "--cb-v": r.collectionLaunchReadiness } as CSSProperties} />
          </div>
          <div className="cb-ws__route-block">
            <p className="cb-ws__label">{t("collectionWorkshop.route")}</p>
            <p className="cb-ws__mono">
              {er.routeId} · {er.readiness}%
            </p>
            <p className="cb-ws__next">{er.nextAction}</p>
          </div>
        </div>
      </section>

      <section className="cb-lab__panel glass-panel cb-ws__block">
        <h2 className="cb-lab__h2">{t("collectionWorkshop.candidates")}</h2>
        <p className="cb-ws__hint">{t("collectionWorkshop.compareHint")}</p>
        <div className="cb-ws__candidates">
          {candidates.map((c) => {
            const row = rowById.get(c.id);
            const selected = c.id === activeRaw.id;
            const inCompare = compareIds.includes(c.id);
            return (
              <article key={c.id} className="cb-ws__card" data-selected={selected ? "1" : "0"}>
                <header className="cb-ws__card-head">
                  <strong>{c.name}</strong>
                  {row?.collectionId === recommendedId ? <span className="cb-ws__badge">★</span> : null}
                </header>
                <p className="cb-ws__card-corridor">{t(c.corridorNameKey)}</p>
                <p className="cb-ws__card-concept">{excerpt(c.concept, 140)}</p>
                <ul className="cb-ws__card-kv">
                  <li>
                    <span>{t("collectionWorkshop.whyNow")}</span> {excerpt(c.opportunityReason, 100)}
                  </li>
                  <li>
                    <span>{t("collectionBuilder.skuTarget")}</span> {c.skuCountTarget.min}–{c.skuCountTarget.max}
                  </li>
                  <li>
                    <span>Hero / Support</span> {clusterCount(c, "hero")} / {clusterCount(c, "support")}
                  </li>
                  <li>
                    <span>{t("collectionWorkshop.productionFitShort")}</span> {excerpt(c.productionFit.launchSpeed, 80)}
                  </li>
                  <li>
                    <span>Readiness</span> {row?.launchReadiness ?? "—"}%
                  </li>
                  <li>
                    <span>{t("collectionWorkshop.riskShort")}</span> {excerpt(c.risk, 90)}
                  </li>
                  <li>
                    <span>{t("collectionBuilder.expectedImpact")}</span> {excerpt(c.expectedImpact, 80)}
                  </li>
                </ul>
                <footer className="cb-ws__card-actions">
                  <label className="cb-ws__chk">
                    <input type="checkbox" checked={inCompare} onChange={() => toggleCompare(c.id)} />
                    {t("collectionWorkshop.compare")}
                  </label>
                  <button
                    type="button"
                    className="ghost-btn ghost-btn--sm"
                    onClick={() => setActiveId(c.id)}
                    disabled={c.id === activeRaw.id}
                  >
                    {c.id === activeRaw.id ? t("collectionWorkshop.active") : t("collectionWorkshop.promote")}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {compareFiltered.length >= 2 ? (
        <section className="cb-lab__panel glass-panel cb-ws__block">
          <h2 className="cb-lab__h2">{t("collectionWorkshop.compare")}</h2>
          <div className="cb-ws__table-wrap">
            <table className="cb-ws__table">
              <thead>
                <tr>
                  <th />
                  <th>{t("collectionWorkshop.cmp.brandFit")}</th>
                  <th>{t("collectionWorkshop.cmp.marketplaceFit")}</th>
                  <th>{t("collectionWorkshop.cmp.productionFit")}</th>
                  <th>{t("collectionWorkshop.cmp.timingFit")}</th>
                  <th>{t("collectionWorkshop.cmp.seoOpportunity")}</th>
                  <th>{t("collectionWorkshop.cmp.fboRisk")}</th>
                  <th>{t("collectionWorkshop.cmp.visualFreshness")}</th>
                  <th>{t("collectionWorkshop.cmp.expectedImpact")}</th>
                  <th>{t("collectionWorkshop.cmp.executionDifficulty")}</th>
                  <th>{t("collectionWorkshop.cmp.launchReadiness")}</th>
                  <th>{t("collectionWorkshop.cmp.score")}</th>
                </tr>
              </thead>
              <tbody>
                {compareFiltered.map((row) => (
                  <tr key={row.collectionId} data-rec={row.collectionId === recommendedId ? "1" : "0"}>
                    <td>
                      <strong>{row.name}</strong>
                      {row.collectionId === recommendedId ? (
                        <span className="cb-ws__rec">{locale === "en" ? " pick" : " выбор"}</span>
                      ) : null}
                    </td>
                    <td>{row.brandFit}</td>
                    <td>{row.marketplaceFit}</td>
                    <td>{row.productionFit}</td>
                    <td>{row.timingFit}</td>
                    <td>{row.seoOpportunity}</td>
                    <td>{row.fboRisk}</td>
                    <td>{row.visualFreshness}</td>
                    <td>{row.expectedImpactScore}</td>
                    <td>{row.executionDifficulty}</td>
                    <td>{row.launchReadiness}</td>
                    <td>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cb-ws__recommend">
            <strong>{t("collectionWorkshop.recommended")}:</strong> {recommendedName}
          </p>
        </section>
      ) : null}

      <div className="cb-ws__grid2">
        <section className="cb-lab__panel glass-panel">
          <h2 className="cb-lab__h2">{t("collectionWorkshop.editor")}</h2>
          <label className="cb-ws__field">
            <span>{locale === "en" ? "Name" : "Название"}</span>
            <input
              className="cb-ws__input"
              value={draft.name ?? merged.name}
              onChange={(e) => patchDraft(activeRaw.id, { name: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.sec.concept")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={4}
              value={draft.concept ?? merged.concept}
              onChange={(e) => patchDraft(activeRaw.id, { concept: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.targetBuyer")}</span>
            <input
              className="cb-ws__input"
              value={draft.targetBuyer ?? merged.targetBuyer}
              onChange={(e) => patchDraft(activeRaw.id, { targetBuyer: e.target.value })}
            />
          </label>
          <div className="cb-ws__row2">
            <label className="cb-ws__field">
              <span>{t("collectionWorkshop.heroSlots")} (1–3)</span>
              <input
                type="number"
                min={1}
                max={3}
                className="cb-ws__input"
                value={heroSlots}
                onChange={(e) => patchDraft(activeRaw.id, { heroCount: clamp(Number(e.target.value) || 1, 1, 3) })}
              />
            </label>
            <label className="cb-ws__field">
              <span>{t("collectionWorkshop.supportSlots")} (4–12)</span>
              <input
                type="number"
                min={4}
                max={12}
                className="cb-ws__input"
                value={supportSlots}
                onChange={(e) => patchDraft(activeRaw.id, { supportCount: clamp(Number(e.target.value) || 4, 4, 12) })}
              />
            </label>
          </div>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.mood")} / {t("collectionBuilder.sec.visual")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.visualMood ?? merged.visualDirection.mood}
              onChange={(e) => patchDraft(activeRaw.id, { visualMood: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.heroCard")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.visualHeroCard ?? merged.visualDirection.heroCardDirection}
              onChange={(e) => patchDraft(activeRaw.id, { visualHeroCard: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.modelBg")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.visualModelBg ?? merged.visualDirection.modelBackgroundStyle}
              onChange={(e) => patchDraft(activeRaw.id, { visualModelBg: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.reels")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.visualReels ?? merged.visualDirection.reelsDirection}
              onChange={(e) => patchDraft(activeRaw.id, { visualReels: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.mainPhoto")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.visualThumb ?? merged.visualDirection.marketplaceMainPhotoLogic}
              onChange={(e) => patchDraft(activeRaw.id, { visualThumb: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.sec.print")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.printDirection ?? merged.visualDirection.printDirection}
              onChange={(e) => patchDraft(activeRaw.id, { printDirection: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.seoPrimary")}</span>
            <input
              className="cb-ws__input"
              value={draft.seoPrimary ?? merged.seoPlan.primaryCluster}
              onChange={(e) => patchDraft(activeRaw.id, { seoPrimary: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.seoSecondary")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.seoSecondary ?? merged.seoPlan.secondaryClusters.join(", ")}
              onChange={(e) => patchDraft(activeRaw.id, { seoSecondary: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.wave.test")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.launchTestWave ?? merged.launchPlan.testWave}
              onChange={(e) => patchDraft(activeRaw.id, { launchTestWave: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.wave.refresh")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.launchRefreshWave ?? merged.launchPlan.refreshWave}
              onChange={(e) => patchDraft(activeRaw.id, { launchRefreshWave: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.wave.amp")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.launchAmpWave ?? merged.launchPlan.amplificationWave}
              onChange={(e) => patchDraft(activeRaw.id, { launchAmpWave: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.wave.fbo")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.launchFboWave ?? merged.launchPlan.fboWave}
              onChange={(e) => patchDraft(activeRaw.id, { launchFboWave: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.wave.hold")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={2}
              value={draft.launchHoldStop ?? merged.launchPlan.holdStopCondition}
              onChange={(e) => patchDraft(activeRaw.id, { launchHoldStop: e.target.value })}
            />
          </label>
          <label className="cb-ws__field">
            <span>{t("collectionBuilder.pipe.stops")}</span>
            <textarea
              className="cb-ws__textarea"
              rows={4}
              value={draft.stopLines !== undefined ? draft.stopLines : merged.stopConditions.join("\n")}
              onChange={(e) => patchDraft(activeRaw.id, { stopLines: e.target.value })}
            />
          </label>
        </section>

        <section className="cb-lab__panel glass-panel">
          <h2 className="cb-lab__h2">{t("collectionWorkshop.skuStructure")}</h2>
          <div className="cb-ws__row2">
            <label className="cb-ws__chk">
              <input
                type="checkbox"
                checked={!!draft.amplifiersOn}
                onChange={(e) => patchDraft(activeRaw.id, { amplifiersOn: e.target.checked })}
              />
              {t("collectionWorkshop.amplifiers")} (×2)
            </label>
            <label className="cb-ws__field">
              <span>{t("collectionWorkshop.holdArchive")} (0–4)</span>
              <input
                type="number"
                min={0}
                max={4}
                className="cb-ws__input"
                value={holdSlots}
                onChange={(e) => patchDraft(activeRaw.id, { holdArchiveOn: clamp(Number(e.target.value) || 0, 0, 4) })}
              />
            </label>
          </div>
          <div className="cb-ws__sku-cols">
            <div>
              <p className="cb-ws__sku-h">Hero</p>
              <ul className="cb-ws__sku-list">
                {skuStructure.heroes.map((h) => (
                  <li key={h.slotId}>
                    <code>{h.entityRef}</code>
                    <span>
                      {h.wbStyleId} — {h.noteRu}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="cb-ws__sku-h">Support</p>
              <ul className="cb-ws__sku-list cb-ws__sku-list--scroll">
                {skuStructure.support.map((h) => (
                  <li key={h.slotId}>
                    <code>{h.entityRef}</code>
                    <span>
                      {h.wbStyleId} — {h.noteRu}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {skuStructure.amplifiers.length ? (
            <div>
              <p className="cb-ws__sku-h">Amplifiers</p>
              <ul className="cb-ws__sku-list">
                {skuStructure.amplifiers.map((h) => (
                  <li key={h.slotId}>
                    <code>{h.entityRef}</code> {h.wbStyleId}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {skuStructure.holdArchive.length ? (
            <div>
              <p className="cb-ws__sku-h">Hold / archive</p>
              <ul className="cb-ws__sku-list">
                {skuStructure.holdArchive.map((h) => (
                  <li key={h.slotId}>
                    <code>{h.entityRef}</code> {h.wbStyleId}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <div className="cb-ws__grid3">
        <section className="cb-lab__panel glass-panel">
          <h2 className="cb-lab__h2">{t("collectionWorkshop.briefVisual")}</h2>
          <ul className="cb-lab__kv cb-lab__kv--dense">
            <li>
              <span>Hero card</span> {visualBrief.heroCardPhotoBriefRu}
            </li>
            <li>
              <span>Модель</span> {visualBrief.modelStyleRu}
            </li>
            <li>
              <span>Фон</span> {visualBrief.backgroundStyleRu}
            </li>
            <li>
              <span>Принт</span> {visualBrief.printPlacementLogicRu}
            </li>
            <li>
              <span>Запреты</span> {visualBrief.forbiddenPatternsRu}
            </li>
            <li>
              <span>Reels</span> {visualBrief.reelsDirectionRu}
            </li>
            <li>
              <span>Миниатюра</span> {visualBrief.marketplaceThumbnailRuleRu}
            </li>
          </ul>
        </section>
        <section className="cb-lab__panel glass-panel">
          <h2 className="cb-lab__h2">{t("collectionWorkshop.briefSeo")}</h2>
          <ul className="cb-lab__kv cb-lab__kv--dense">
            <li>
              <span>WB</span> {seoBrief.wbTitleFormulaRu}
            </li>
            <li>
              <span>Ozon</span> {seoBrief.ozonTitleFormulaRu}
            </li>
            <li>
              <span>Primary</span> {seoBrief.primaryKeywordsRu}
            </li>
            <li>
              <span>Secondary</span> {seoBrief.secondaryKeywordsRu}
            </li>
            <li>
              <span>Rich</span> {seoBrief.richContentAngleRu}
            </li>
            <li>
              <span>Drift</span> {seoBrief.semanticDriftWarningRu}
            </li>
          </ul>
        </section>
        <section className="cb-lab__panel glass-panel">
          <h2 className="cb-lab__h2">{t("collectionWorkshop.briefProduction")}</h2>
          <ul className="cb-lab__kv cb-lab__kv--dense">
            <li>
              <span>DTF</span> {productionBrief.dtfSuitabilityRu}
            </li>
            <li>
              <span>Принт</span> {productionBrief.printComplexityRu}
            </li>
            <li>
              <span>Blank</span> {productionBrief.blankAvailabilityRu}
            </li>
            <li>
              <span>Упаковка</span> {productionBrief.packagingImpactRu}
            </li>
            <li>
              <span>FBO prep</span> {productionBrief.fboPrepPressureRu}
            </li>
            <li>
              <span>Сложность</span> {productionBrief.estimatedLaunchDifficultyRu}
            </li>
            <li>
              <span>Bottleneck</span> {productionBrief.bottleneckWarningRu}
            </li>
          </ul>
        </section>
      </div>

      <section className="cb-lab__panel glass-panel cb-ws__block">
        <h2 className="cb-lab__h2">{t("collectionWorkshop.pipeCondensed")}</h2>
        <div className="cb-ws__pipe-row">
          <ul className="cb-lab__readiness-grid">
            <li>
              <span>{t("collectionBuilder.readiness.brand")}</span> {r.brandReadiness}%
            </li>
            <li>
              <span>{t("collectionBuilder.readiness.visual")}</span> {r.visualReadiness}%
            </li>
            <li>
              <span>{t("collectionBuilder.readiness.seo")}</span> {r.seoReadiness}%
            </li>
            <li>
              <span>{t("collectionBuilder.readiness.production")}</span> {r.productionReadiness}%
            </li>
            <li>
              <span>{t("collectionBuilder.readiness.marketplace")}</span> {r.marketplaceReadiness}%
            </li>
            <li>
              <span>{t("collectionBuilder.readiness.timing")}</span> {r.timingReadiness}%
            </li>
            <li>
              <span>{t("collectionBuilder.readiness.execution")}</span> {r.executionReadiness}%
            </li>
          </ul>
          <div className="cb-ws__pipe-side">
            <p className="cb-ws__label">{t("collectionBuilder.pipe.stops")}</p>
            <ul className="cb-lab__stops">
              {pipeline.structuredStops.slice(0, 6).map((s) => (
                <li key={s.id} data-active={s.active ? "1" : "0"}>
                  {s.active ? "● " : "○ "}
                  {s.label}
                </li>
              ))}
            </ul>
            <p className="cb-ws__label">{t("collectionWorkshop.commandsPreview")}</p>
            <ul className="cb-ws__cmd-mini">
              {pipeline.collectionCommands.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <strong>{c.titleRu}</strong> <em>{c.statusLabelRu}</em>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="cb-lab__panel glass-panel">
        <h2 className="cb-lab__h2">{t("collectionWorkshop.promptPack")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("collectionWorkshop.promptPackHint")}</p>
        <div className="cb-ws__prompt-row">
          <button type="button" className="ghost-btn" onClick={() => setPackWizardOpen(true)}>
            {t("collectionWorkshop.createPromptPack")}
          </button>
        </div>
        <div className="cb-ws__prompt-row">
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={copyPromptHero}>
            {t("collectionWorkshop.copyPromptHero")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={copyPromptSupport}>
            {t("collectionWorkshop.copyPromptSupport")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={copyPromptReels}>
            {t("collectionWorkshop.copyPromptReels")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={copyPromptCampaign}>
            {t("collectionWorkshop.copyPromptCampaign")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={copyPromptLaunch}>
            {t("collectionWorkshop.copyPromptLaunch")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={savePromptPackMemory}>
            {t("collectionWorkshop.savePromptPack")}
          </button>
        </div>
      </section>

      <section className="cb-lab__panel glass-panel">
        <h2 className="cb-lab__h2">{t("collectionWorkshop.launchPack")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">
          {locale === "en"
            ? "Bundle: concept, SKU slots, RU briefs, execution route, commands, stops. Export JSON / MD or copy the short RU summary."
            : "Пакет: концепт, SKU-слоты, RU-брифы, маршрут, команды, стопы. Экспорт JSON / MD или короткий summary."}
        </p>
        <pre className="cb-ws__summary">{launchPackSummaryRu(launchPack)}</pre>
      </section>

      {packWizardOpen ? (
        <div
          className="cb-ppwiz-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cb-ppwiz-title"
          onClick={() => setPackWizardOpen(false)}
        >
          <div className="cb-ppwiz glass-panel" role="document" onClick={(e) => e.stopPropagation()}>
            <h2 id="cb-ppwiz-title" className="cb-lab__h2">
              {t("packWizard.title")}
            </h2>
            <p className="cb-lab__prose cb-lab__prose--tight">{t("packWizard.lede")}</p>
            <ul className="cb-lab__kv cb-lab__kv--dense">
              <li>
                <span>{t("packWizard.collection")}</span> {merged.name}
              </li>
              <li>
                <span>{t("packWizard.corridor")}</span> {corridorLabel}
              </li>
              <li>
                <span>{t("packWizard.visual")}</span>{" "}
                {excerpt(`${merged.visualDirection.mood} · ${merged.visualDirection.heroCardDirection}`, 200)}
              </li>
              <li>
                <span>{t("packWizard.heroes")}</span> {heroSlots} · {t("packWizard.support")} {supportSlots}
              </li>
            </ul>
            <label className="cb-ws__field">
              <span>{t("packWizard.packType")}</span>
              <select
                className="cb-ws__input"
                value={packKindDraft}
                onChange={(e) => setPackKindDraft(e.target.value as PromptPackKind)}
              >
                <option value="marketplace_launch">{t("promptPack.kind.marketplace_launch")}</option>
                <option value="campaign">{t("promptPack.kind.campaign")}</option>
                <option value="reels">{t("promptPack.kind.reels")}</option>
                <option value="exhibition_capsule">{t("promptPack.kind.exhibition_capsule")}</option>
                <option value="corporate_merch">{t("promptPack.kind.corporate_merch")}</option>
              </select>
            </label>
            {packKindDraft === "marketplace_launch" ? (
              <fieldset className="cb-ppwiz-mp">
                <legend className="cb-ws__label">{t("packWizard.marketplace")}</legend>
                <label className="cb-ws__chk">
                  <input type="radio" name="ppmp" checked={packMpDraft === "wb"} onChange={() => setPackMpDraft("wb")} />
                  Wildberries
                </label>
                <label className="cb-ws__chk">
                  <input type="radio" name="ppmp" checked={packMpDraft === "ozon"} onChange={() => setPackMpDraft("ozon")} />
                  Ozon
                </label>
                <label className="cb-ws__chk">
                  <input type="radio" name="ppmp" checked={packMpDraft === "both"} onChange={() => setPackMpDraft("both")} />
                  {t("packWizard.mpBoth")}
                </label>
              </fieldset>
            ) : null}
            <div className="cb-ppwiz-actions">
              <button type="button" className="ghost-btn" onClick={() => setPackWizardOpen(false)}>
                {t("packWizard.cancel")}
              </button>
              <button type="button" className="ghost-btn" onClick={finalizeVisualPromptPack}>
                {t("packWizard.openPack")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .cw-snap-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .cw-ue-assign { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
        .cw-ue-select { min-width: 200px; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); color: inherit; }
        .cw-snap-hint { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .cb-ppwiz-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .cb-ppwiz {
          max-width: 520px;
          width: 100%;
          padding: 20px;
          max-height: min(88vh, 720px);
          overflow: auto;
        }
        .cb-ppwiz-mp {
          border: none;
          margin: 12px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .cb-ppwiz-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }
        .cb-ws__prompt-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .cb-ws__hint { font-size: 0.78rem; color: var(--muted); margin: 0 0 10px; }
        .cb-ws__active-bar {
          display: grid;
          grid-template-columns: 1.4fr 0.5fr 1fr;
          gap: 14px;
          align-items: start;
        }
        @media (max-width: 820px) {
          .cb-ws__active-bar { grid-template-columns: 1fr; }
        }
        .cb-ws__label {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 4px;
        }
        .cb-ws__active-name { font-weight: 600; margin: 0 0 4px; font-size: 1rem; }
        .cb-ws__meta--rec { margin-top: 8px; font-size: 0.76rem; }
        .cb-ws__mega { margin: 0; font-size: 1.1rem; }
        .cb-ws__mono { font-family: ui-monospace, monospace; font-size: 0.82rem; margin: 0 0 6px; }
        .cb-ws__next { font-size: 0.78rem; line-height: 1.4; margin: 0; color: rgba(185, 200, 230, 0.92); }
        .cb-ws__candidates {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
          scroll-snap-type: x mandatory;
        }
        .cb-ws__card {
          flex: 0 0 min(280px, 88vw);
          scroll-snap-align: start;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.22);
          padding: 12px;
          font-size: 0.78rem;
        }
        .cb-ws__card[data-selected="1"] {
          border-color: rgba(120, 170, 255, 0.45);
          box-shadow: 0 0 0 1px rgba(120, 170, 255, 0.12);
        }
        .cb-ws__card-head {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 6px;
        }
        .cb-ws__card-head strong { font-size: 0.85rem; }
        .cb-ws__badge {
          font-size: 0.65rem;
          color: rgba(255, 210, 140, 0.95);
        }
        .cb-ws__card-corridor {
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(150, 165, 200, 0.85);
          margin: 0 0 6px;
        }
        .cb-ws__card-concept {
          margin: 0 0 8px;
          line-height: 1.35;
          color: rgba(195, 205, 230, 0.92);
        }
        .cb-ws__card-kv {
          list-style: none;
          padding: 0;
          margin: 0 0 10px;
        }
        .cb-ws__card-kv li {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 6px;
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .cb-ws__card-kv span {
          color: var(--muted);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cb-ws__card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .cb-ws__chk {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: rgba(175, 190, 220, 0.9);
        }
        .ghost-btn--sm {
          font-size: 0.68rem !important;
          padding: 4px 8px !important;
        }
        .cb-ws__table-wrap {
          overflow-x: auto;
          margin-top: 8px;
        }
        .cb-ws__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.72rem;
        }
        .cb-ws__table th,
        .cb-ws__table td {
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 6px 8px;
          text-align: right;
        }
        .cb-ws__table th:first-child,
        .cb-ws__table td:first-child {
          text-align: left;
          min-width: 120px;
        }
        .cb-ws__table thead {
          background: rgba(0, 0, 0, 0.35);
        }
        .cb-ws__table tr[data-rec="1"] td {
          background: rgba(80, 120, 200, 0.12);
        }
        .cb-ws__rec {
          display: block;
          font-size: 0.62rem;
          color: rgba(160, 200, 255, 0.9);
          margin-top: 2px;
        }
        .cb-ws__recommend {
          margin: 12px 0 0;
          font-size: 0.84rem;
        }
        .cb-ws__grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        @media (max-width: 960px) {
          .cb-ws__grid2 { grid-template-columns: 1fr; }
        }
        .cb-ws__field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
          font-size: 0.72rem;
        }
        .cb-ws__field span {
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .cb-ws__input,
        .cb-ws__textarea {
          width: 100%;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.35);
          color: inherit;
          font: inherit;
          padding: 8px 10px;
          font-size: 0.82rem;
        }
        .cb-ws__textarea { resize: vertical; min-height: 52px; }
        .cb-ws__row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .cb-ws__grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        @media (max-width: 1024px) {
          .cb-ws__grid3 { grid-template-columns: 1fr; }
        }
        .cb-ws__sku-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 8px;
        }
        @media (max-width: 700px) {
          .cb-ws__sku-cols { grid-template-columns: 1fr; }
        }
        .cb-ws__sku-h {
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(160, 175, 210, 0.9);
          margin: 0 0 6px;
        }
        .cb-ws__sku-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.72rem;
        }
        .cb-ws__sku-list--scroll {
          max-height: 200px;
          overflow-y: auto;
        }
        .cb-ws__sku-list li {
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cb-ws__sku-list code {
          font-size: 0.62rem;
          color: rgba(150, 185, 255, 0.85);
        }
        .cb-ws__pipe-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 14px;
        }
        @media (max-width: 860px) {
          .cb-ws__pipe-row { grid-template-columns: 1fr; }
        }
        .cb-ws__cmd-mini {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.72rem;
        }
        .cb-ws__cmd-mini li {
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .cb-ws__cmd-mini em {
          font-style: normal;
          font-size: 0.62rem;
          color: rgba(160, 175, 210, 0.8);
          margin-left: 6px;
        }
        .cb-ws__summary {
          margin: 10px 0 0;
          padding: 12px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.78rem;
          line-height: 1.45;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
