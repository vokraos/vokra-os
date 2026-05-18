import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import { ENTITY_SNAPSHOT_EVENT, getActiveEntitySnapshot } from "../lib/entity-snapshot";
import {
  buildCompetitiveMapFoundation,
  buildCompetitiveMapMemoryPayload,
  consumeCompetitiveMapMemoryFromSession,
  type CompetitiveMapFoundation,
} from "../lib/search-clusters";
import {
  COMPETITOR_SERP_MEMORY_SCHEMA,
  analyzeSerpItems,
  buildCompetitorSerpMemoryPayload,
  consumeCompetitorSerpFromSession,
  parseSerpQuickNotes,
  parseSerpTable,
  pushAssortmentSerpHint,
  pushCollectionBuilderSerpHint,
  pushPromptComposerSerpHint,
  pushVisualStrategySerpBanner,
  type CompetitorSerpEnvelope,
} from "../lib/competitor-serp";
import {
  appendGapAnalysisVisualJob,
  buildCompetitiveGapAnalysisMemoryPayload,
  buildOurCardSnapshot,
  consumeGapMapSession,
  deriveCompetitiveGapAnalysis,
  mergeHeroPlanWithGap,
  pushGapAnalysisToComposer,
  snapshotToFormFields,
  type CompetitiveGapAnalysis,
  type OurCardCompetitiveSnapshot,
  type OurCardFormFields,
} from "../lib/competitive-gap";
import {
  appendArchetypeIntelligenceVisualJob,
  buildHeroArchetypeIntelligenceMemoryPayload,
  buildHeroArchetypeIntelligenceReport,
  consumeHeroArchetypeMapSession,
  mergeHeroPlanWithArchetypeIntel,
  pushArchetypeIntelligenceToComposer,
  pushHeroArchetypeVisualStrategyLines,
  suggestedPromptArchFromShares,
  type HeroArchetypeIntelligenceReport,
} from "../lib/hero-archetypes";
import {
  appendReadabilityIntelligenceVisualJob,
  buildHeroReadabilityIntelligenceMemoryPayload,
  buildHeroReadabilityIntelligenceReport,
  consumeHeroReadabilityMapSession,
  mergeHeroPlanWithReadabilityIntel,
  pushReadabilityIntelligenceToComposer,
  pushHeroReadabilityVisualStrategyLines,
  type HeroReadabilityIntelligenceReport,
} from "../lib/hero-readability";
import {
  appendFatigueIntelligenceVisualJob,
  buildHeroFatigueIntelligenceMemoryPayload,
  buildHeroFatigueIntelligenceReport,
  consumeHeroFatigueMapSession,
  markHeroAssetsFatigueRisk,
  mergeHeroPlanWithFatigueIntel,
  pushFatigueIntelligenceToComposer,
  type HeroFatigueIntelligenceReport,
} from "../lib/hero-fatigue";
import {
  appendHeroImprovementPlanVisualJob,
  buildHeroImprovementPlanMemoryPayload,
  consumeHeroPlanMapSession,
  deriveCompetitiveHeroImprovementPlan,
  pushHeroPlanComposerPayload,
  type CompetitiveHeroImprovementPlan,
} from "../lib/hero-improvement-plan";
import {
  appendBattlePlanVisualJob,
  buildHeroBattlePlan,
  buildHeroBattlePlanMemoryPayload,
  consumeHeroBattlePlanMapSession,
  heroBattlePlanToMarkdown,
  heroBattlePlanToPlainText,
  pushBattlePlanToComposer,
  pushHeroBattlePlanVisualStrategyLines,
  type HeroBattlePlan,
} from "../lib/hero-battle-plan";
import {
  appendTestMatrixAllVisualJobs,
  appendTestMatrixVariantVisualJob,
  buildHeroTestMatrix,
  buildHeroTestMatrixMemoryPayload,
  consumeHeroTestMatrixMapSession,
  heroTestMatrixToMarkdown,
  heroTestMatrixToPlainText,
  pushTestMatrixVariantToComposer,
  type HeroTestMatrix,
  type HeroTestVariant,
} from "../lib/hero-test-matrix";
import {
  applyWinnerToBundle,
  buildHeroTestResultsMemoryPayload,
  buildVisualAssetFromTestResult,
  heroTestResultsToMarkdown,
  heroTestResultsToPlainText,
  mergeResultsWithMatrix,
  type HeroTestResult,
  type HeroTestResultsBundle,
} from "../lib/hero-test-results";
import {
  buildHeroLaunchPackage,
  buildHeroLaunchPackageMemoryPayload,
  canBuildLaunchPackage,
  heroLaunchPackageToMarkdown,
  heroLaunchPackageToPlainText,
  type HeroLaunchPackage,
} from "../lib/hero-launch-package";
import {
  buildHeroPostLaunchObservation,
  buildHeroPostLaunchObservationMemoryPayload,
  finalizeObservation,
  heroPostLaunchObservationToMarkdown,
  heroPostLaunchObservationToPlainText,
  type HeroPostLaunchObservation,
} from "../lib/hero-post-launch-observation";
import { appendCardPlan, createCardProductionPlanFromVisualAsset } from "../lib/card-production";
import { loadVisualAssetRegistryFromSession, tryAppendVisualAsset } from "../lib/visual-assets";
import { HeroPostLaunchObservationPanel } from "../components/cmap/HeroPostLaunchObservationPanel";
import { HeroTestVariantReview } from "../components/cmap/HeroTestVariantReview";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import type { HeroPromptArchetype } from "../lib/prompt-composer/types";

type Props = { onNavigate: (id: NavId) => void };

const EMPTY_OUR_CARD: OurCardFormFields = {
  cardTitle: "",
  skuCode: "",
  priceRaw: "",
  heroImageNote: "",
  visualPattern: "",
  colorDominance: "",
  modelPresence: "",
  printReadability: "",
  perceivedPremiumLevel: "",
  brandFit: "",
  differentiationNote: "",
};

function pctBar(label: string, value: number) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="cmap-strip">
      <div className="cmap-strip__lab">
        <span>{label}</span>
        <span>{pct}</span>
      </div>
      <div className="cmap-strip__track">
        <div className="cmap-strip__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CompetitiveMapView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [foundationOverride, setFoundationOverride] = useState<CompetitiveMapFoundation | null>(null);
  const [serpQuery, setSerpQuery] = useState("");
  const [serpMarket, setSerpMarket] = useState("wildberries");
  const [serpMode, setSerpMode] = useState<"table" | "quick">("table");
  const [serpPaste, setSerpPaste] = useState("");
  const [serpEnvelope, setSerpEnvelope] = useState<CompetitorSerpEnvelope | null>(null);
  const [planOverride, setPlanOverride] = useState<CompetitiveHeroImprovementPlan | null>(null);
  const [heroCorridorDraft, setHeroCorridorDraft] = useState("");
  const [ourCardForm, setOurCardForm] = useState<OurCardFormFields>(EMPTY_OUR_CARD);
  const [gapAnalysis, setGapAnalysis] = useState<CompetitiveGapAnalysis | null>(null);
  const [ourCardSnapForGap, setOurCardSnapForGap] = useState<OurCardCompetitiveSnapshot | null>(null);
  const [archetypeReportOverride, setArchetypeReportOverride] = useState<HeroArchetypeIntelligenceReport | null>(null);
  const [readabilityReportOverride, setReadabilityReportOverride] = useState<HeroReadabilityIntelligenceReport | null>(null);
  const [fatigueReportOverride, setFatigueReportOverride] = useState<HeroFatigueIntelligenceReport | null>(null);
  const [battlePlanOverride, setBattlePlanOverride] = useState<HeroBattlePlan | null>(null);
  const [testMatrixOverride, setTestMatrixOverride] = useState<HeroTestMatrix | null>(null);
  const [testResultsBundleOverride, setTestResultsBundleOverride] = useState<HeroTestResultsBundle | null>(null);
  const [launchPackageOverride, setLaunchPackageOverride] = useState<HeroLaunchPackage | null>(null);
  const [postLaunchObservationOverride, setPostLaunchObservationOverride] =
    useState<HeroPostLaunchObservation | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, fn);
    return () => window.removeEventListener(ENTITY_SNAPSHOT_EVENT, fn);
  }, []);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const htmS = consumeHeroTestMatrixMapSession();
    const bbpS = consumeHeroBattlePlanMapSession();
    const archS = consumeHeroArchetypeMapSession();
    const readS = consumeHeroReadabilityMapSession();
    const fatS = consumeHeroFatigueMapSession();
    const gapS = consumeGapMapSession();
    const hip = consumeHeroPlanMapSession();
    const serpOnly =
      !htmS?.serpEnvelope &&
      !bbpS?.serpEnvelope &&
      !archS?.serpEnvelope &&
      !readS?.serpEnvelope &&
      !fatS?.serpEnvelope &&
      !gapS?.serpEnvelope &&
      !hip?.serpEnvelope
        ? consumeCompetitorSerpFromSession()
        : null;
    const serpEnv =
      htmS?.serpEnvelope ??
      bbpS?.serpEnvelope ??
      archS?.serpEnvelope ??
      readS?.serpEnvelope ??
      fatS?.serpEnvelope ??
      gapS?.serpEnvelope ??
      hip?.serpEnvelope ??
      serpOnly ??
      null;
    if (serpEnv) setSerpEnvelope(serpEnv);
    if (bbpS?.plan) {
      setBattlePlanOverride(bbpS.plan);
    }
    if (htmS?.matrix) {
      setTestMatrixOverride(htmS.matrix);
    }
    if (htmS?.resultsBundle) {
      setTestResultsBundleOverride(htmS.resultsBundle);
    }
    if (htmS?.launchPackage) {
      setLaunchPackageOverride(htmS.launchPackage);
    }
    if (htmS?.postLaunchObservation) {
      setPostLaunchObservationOverride(htmS.postLaunchObservation);
    }
    if (archS) {
      setArchetypeReportOverride(archS.report);
    }
    if (readS) {
      setReadabilityReportOverride(readS.report);
    }
    if (fatS) {
      setFatigueReportOverride(fatS.report);
    }
    if (gapS) {
      setOurCardForm(snapshotToFormFields(gapS.ourCard));
      setGapAnalysis(gapS.gap);
      setOurCardSnapForGap(gapS.ourCard);
    }
    if (hip) {
      setPlanOverride(hip.plan);
    }
    const cm = consumeCompetitiveMapMemoryFromSession();
    if (cm?.foundation) setFoundationOverride(cm.foundation);
    if (archS && cm?.foundation) showToast(`${t("ha.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (archS) showToast(t("ha.toastRestoredMap"));
    else if (readS && cm?.foundation) showToast(`${t("hr.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (readS) showToast(t("hr.toastRestoredMap"));
    else if (fatS && cm?.foundation) showToast(`${t("hf.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (fatS) showToast(t("hf.toastRestoredMap"));
    else if (gapS && cm?.foundation) showToast(`${t("gap.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (gapS) showToast(t("gap.toastRestoredMap"));
    else if (hip && cm?.foundation) showToast(`${t("heroPlan.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (hip) showToast(t("heroPlan.toastRestoredMap"));
    else if (bbpS?.plan && cm?.foundation) showToast(`${t("hbp.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (bbpS?.plan) showToast(t("hbp.toastRestoredMap"));
    else if (htmS?.matrix && cm?.foundation) showToast(`${t("htm.toastRestoredMap")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (htmS?.matrix) showToast(t("htm.toastRestoredMap"));
    else if (htmS?.resultsBundle && cm?.foundation) showToast(`${t("memory.reopenHeroTestResultsOk")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (htmS?.resultsBundle) showToast(t("memory.reopenHeroTestResultsOk"));
    else if (htmS?.launchPackage && cm?.foundation) showToast(`${t("memory.reopenHeroLaunchPackageOk")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (htmS?.launchPackage) showToast(t("memory.reopenHeroLaunchPackageOk"));
    else if (htmS?.postLaunchObservation && cm?.foundation)
      showToast(`${t("memory.reopenHeroPostLaunchObservationOk")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (htmS?.postLaunchObservation) showToast(t("memory.reopenHeroPostLaunchObservationOk"));
    else if (serpOnly && cm?.foundation) showToast(`${t("serp.toastRestoredFromMemory")} · ${t("cmap.toastRestoredFromMemory")}`);
    else if (serpOnly) showToast(t("serp.toastRestoredFromMemory"));
    else if (cm?.foundation) showToast(t("cmap.toastRestoredFromMemory"));
  }, [showToast, t]);

  const entitySnap = useMemo(() => getActiveEntitySnapshot(), [tick]);

  const foundation = useMemo(() => {
    if (foundationOverride) return foundationOverride;
    return buildCompetitiveMapFoundation(entitySnap);
  }, [entitySnap, foundationOverride, tick]);

  const clusterById = useMemo(() => {
    const m = new Map<string, (typeof foundation.clusters)[0]>();
    for (const c of foundation.clusters) m.set(c.id, c);
    return m;
  }, [foundation.clusters]);

  const weakPockets = useMemo(
    () => foundation.clusters.filter((c) => c.estimatedCompetition < 42).sort((a, b) => a.estimatedCompetition - b.estimatedCompetition),
    [foundation.clusters],
  );

  const defaultCorridor = useMemo(
    () => foundation.competitorCorridors[0]?.corridor ?? foundation.clusters[0]?.corridor ?? "unassigned",
    [foundation],
  );

  useEffect(() => {
    if (!serpEnvelope) return;
    setHeroCorridorDraft((prev) => (prev.trim() ? prev : defaultCorridor));
  }, [serpEnvelope, defaultCorridor]);

  useEffect(() => {
    if (planOverride) setHeroCorridorDraft(planOverride.corridor);
  }, [planOverride]);

  const liveHeroPlan = useMemo(() => {
    if (!serpEnvelope) return null;
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    return deriveCompetitiveHeroImprovementPlan(serpEnvelope, corridor, t);
  }, [serpEnvelope, heroCorridorDraft, defaultCorridor, t]);

  const heroPlan = planOverride ?? liveHeroPlan;

  const liveArchetypeIntel = useMemo(() => {
    if (!serpEnvelope) return null;
    return buildHeroArchetypeIntelligenceReport(
      serpEnvelope,
      { ourCard: ourCardSnapForGap, gap: gapAnalysis, heroPlan },
      t,
    );
  }, [serpEnvelope, ourCardSnapForGap, gapAnalysis, heroPlan, t]);

  const archetypeIntel = archetypeReportOverride ?? liveArchetypeIntel;

  const liveReadabilityIntel = useMemo(() => {
    if (!serpEnvelope) return null;
    return buildHeroReadabilityIntelligenceReport(
      serpEnvelope,
      {
        ourCard: ourCardSnapForGap,
        gap: gapAnalysis,
        heroPlan,
        archetypeIntel: archetypeIntel ?? undefined,
      },
      t,
    );
  }, [archetypeIntel, gapAnalysis, heroPlan, ourCardSnapForGap, serpEnvelope, t]);

  const readabilityIntel = readabilityReportOverride ?? liveReadabilityIntel;

  const liveFatigueIntel = useMemo(() => {
    if (!serpEnvelope) return null;
    return buildHeroFatigueIntelligenceReport(
      serpEnvelope,
      {
        ourCard: ourCardSnapForGap,
        gap: gapAnalysis,
        heroPlan,
        archetypeIntel: archetypeIntel ?? undefined,
        readabilityIntel: readabilityIntel ?? undefined,
      },
      t,
    );
  }, [archetypeIntel, gapAnalysis, heroPlan, ourCardSnapForGap, readabilityIntel, serpEnvelope, t]);

  const fatigueIntel = fatigueReportOverride ?? liveFatigueIntel;

  const liveBattlePlan = useMemo(() => {
    if (!serpEnvelope) return null;
    return buildHeroBattlePlan(
      serpEnvelope,
      {
        ourCard: ourCardSnapForGap,
        gap: gapAnalysis,
        heroPlan,
        archetype: archetypeIntel,
        readability: readabilityIntel,
        fatigue: fatigueIntel,
      },
      t,
    );
  }, [archetypeIntel, fatigueIntel, gapAnalysis, heroPlan, ourCardSnapForGap, readabilityIntel, serpEnvelope, t]);

  const battlePlan = battlePlanOverride ?? liveBattlePlan;

  const liveTestMatrix = useMemo(() => {
    if (!battlePlan) return null;
    return buildHeroTestMatrix(
      battlePlan,
      {
        gap: gapAnalysis,
        archetype: archetypeIntel,
        readability: readabilityIntel,
        fatigue: fatigueIntel,
      },
      t,
    );
  }, [archetypeIntel, battlePlan, fatigueIntel, gapAnalysis, readabilityIntel, t]);

  const testMatrix = testMatrixOverride ?? liveTestMatrix;

  const testResultsBundle = useMemo(() => {
    if (!testMatrix) return null;
    return mergeResultsWithMatrix(testMatrix, testResultsBundleOverride);
  }, [testMatrix, testResultsBundleOverride]);

  const liveLaunchPackage = useMemo(() => {
    if (!testMatrix || !testResultsBundle || !canBuildLaunchPackage(testResultsBundle)) return null;
    return buildHeroLaunchPackage(
      testMatrix,
      testResultsBundle,
      {
        battlePlan,
        gap: gapAnalysis,
        archetype: archetypeIntel,
        readability: readabilityIntel,
        fatigue: fatigueIntel,
      },
      t,
    );
  }, [archetypeIntel, battlePlan, fatigueIntel, gapAnalysis, readabilityIntel, t, testMatrix, testResultsBundle]);

  const launchPackage = launchPackageOverride ?? liveLaunchPackage;

  const livePostLaunchObservation = useMemo(() => {
    if (!launchPackage) return null;
    return buildHeroPostLaunchObservation(
      launchPackage,
      postLaunchObservationOverride,
      {
        battlePlan,
        archetype: archetypeIntel,
        readability: readabilityIntel,
        fatigue: fatigueIntel,
      },
      t,
    );
  }, [
    archetypeIntel,
    battlePlan,
    fatigueIntel,
    launchPackage,
    postLaunchObservationOverride,
    readabilityIntel,
    t,
  ]);

  const postLaunchObservation = postLaunchObservationOverride ?? livePostLaunchObservation;

  const saveMemory = useCallback(() => {
    const built = buildCompetitiveMapFoundation(entitySnap);
    const payload = buildCompetitiveMapMemoryPayload(built);
    recordGeneration({
      module: "competitive_map",
      title: t("cmap.memoryTitle", { n: String(built.clusters.length) }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["competitive_map", "clusters", "corridors"],
      previewText: t("cmap.previewLine", {
        clusters: String(built.clusters.length),
        corridors: String(built.competitorCorridors.length),
      }),
    });
    showToast(t("cmap.toastSaved"));
  }, [entitySnap, showToast, t]);

  const buildGarmentFocusFromSerp = useCallback((env: CompetitorSerpEnvelope) => {
    const top = env.analysis.dominantVisualPatterns
      .slice(0, 3)
      .map((p) => p.label)
      .join(", ");
    return `${env.snapshot.query} · visual: ${top}`.slice(0, 220);
  }, []);

  const applySerpParse = useCallback(() => {
    const q =
      serpQuery.trim() ||
      foundation.clusters[0]?.query?.split("·")[0]?.trim() ||
      foundation.clusters[0]?.corridor ||
      "query";
    const { snapshot, errors } =
      serpMode === "table" ? parseSerpTable(serpPaste, q, serpMarket) : parseSerpQuickNotes(serpPaste, q, serpMarket);
    if (!snapshot.items.length) {
      const err = errors[0] ?? "empty";
      showToast(`${t("serp.toastParseFail")} (${err})`);
      return;
    }
    const pack = analyzeSerpItems(snapshot.items);
    setSerpEnvelope({
      schema: COMPETITOR_SERP_MEMORY_SCHEMA,
      snapshot,
      analysis: pack.analysis,
      insights: pack.insights,
      crossModuleHints: pack.crossModuleHints,
    });
    setPlanOverride(null);
    setGapAnalysis(null);
    setOurCardSnapForGap(null);
    setArchetypeReportOverride(null);
    setReadabilityReportOverride(null);
    setFatigueReportOverride(null);
    setBattlePlanOverride(null);
    setTestMatrixOverride(null);
    setTestResultsBundleOverride(null);
    setLaunchPackageOverride(null);
    setPostLaunchObservationOverride(null);
    showToast(t("serp.toastParsed", { n: String(snapshot.items.length) }));
  }, [foundation, serpMarket, serpMode, serpPaste, serpQuery, showToast, t]);

  const clearSerp = useCallback(() => {
    setSerpEnvelope(null);
    setSerpPaste("");
    setPlanOverride(null);
    setGapAnalysis(null);
    setOurCardSnapForGap(null);
    setArchetypeReportOverride(null);
    setReadabilityReportOverride(null);
    setFatigueReportOverride(null);
    setBattlePlanOverride(null);
    setTestMatrixOverride(null);
    setTestResultsBundleOverride(null);
    setLaunchPackageOverride(null);
    setPostLaunchObservationOverride(null);
    setHeroCorridorDraft("");
  }, []);

  const goSerpNav = useCallback(
    (nav: NavId) => {
      if (!serpEnvelope) {
        onNavigate(nav);
        return;
      }
      if (nav === "promptComposer") {
        const hint = serpEnvelope.crossModuleHints.find((h) => h.nav === "promptComposer");
        const arch = (hint?.suggestedHeroArch ?? "clean_marketplace_hero") as HeroPromptArchetype;
        pushPromptComposerSerpHint({
          suggestedHeroArch: arch,
          query: serpEnvelope.snapshot.query,
          marketplace: serpEnvelope.snapshot.marketplace,
          garmentFocusLine: buildGarmentFocusFromSerp(serpEnvelope),
        });
      } else if (nav === "visualStrategy") {
        pushVisualStrategySerpBanner(serpEnvelope.insights);
      } else if (nav === "collectionBuilder") {
        const top = serpEnvelope.analysis.dominantVisualPatterns[0]?.label ?? "";
        pushCollectionBuilderSerpHint({
          query: serpEnvelope.snapshot.query,
          weakVisualSharePct: String(serpEnvelope.analysis.weakVisualCompetitorSharePct),
          topPattern: top,
        });
      } else if (nav === "assortmentActions") {
        pushAssortmentSerpHint({
          query: serpEnvelope.snapshot.query,
          saturation: String(serpEnvelope.analysis.saturationSignal),
        });
      }
      onNavigate(nav);
    },
    [buildGarmentFocusFromSerp, onNavigate, serpEnvelope],
  );

  const saveSerpMemory = useCallback(() => {
    if (!serpEnvelope) return;
    const payload = buildCompetitorSerpMemoryPayload(serpEnvelope);
    recordGeneration({
      module: "competitor_serp",
      title: t("serp.memoryTitle", { query: serpEnvelope.snapshot.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["competitor_serp", serpEnvelope.snapshot.marketplace],
      previewText: t("serp.previewLine", {
        n: String(serpEnvelope.snapshot.items.length),
        market: serpEnvelope.snapshot.marketplace,
      }),
    });
    showToast(t("serp.toastSavedSerp"));
  }, [serpEnvelope, showToast, t]);

  const onCreateHeroPrompt = useCallback(() => {
    if (!heroPlan) return;
    pushHeroPlanComposerPayload({
      query: heroPlan.query,
      marketplace: heroPlan.marketplace,
      recommendedHeroDirection: heroPlan.recommendedHeroDirection,
      promptDirection: heroPlan.promptDirection,
      negativeConstraints: heroPlan.negativeConstraints,
      corridor: heroPlan.corridor,
      suggestedHeroArch: heroPlan.suggestedHeroArch,
      garmentFocusLine: `${heroPlan.corridor}: ${heroPlan.promptDirection}`.slice(0, 220),
      printFocusLine: heroPlan.visualWeaknesses.join(" · ").slice(0, 220),
      source: "hero_plan",
    });
    onNavigate("promptComposer");
    showToast(t("heroPlan.toastComposerOpened"));
  }, [heroPlan, onNavigate, showToast, t]);

  const onCreateVisualJob = useCallback(() => {
    if (!heroPlan) return;
    appendHeroImprovementPlanVisualJob(heroPlan);
    onNavigate("visualProduction");
    showToast(t("heroPlan.toastJobQueued"));
  }, [heroPlan, onNavigate, showToast, t]);

  const saveHeroPlanMemory = useCallback(() => {
    if (!heroPlan) return;
    const payload = buildHeroImprovementPlanMemoryPayload(heroPlan, serpEnvelope ?? undefined);
    recordGeneration({
      module: "hero_improvement_plan",
      title: t("heroPlan.memoryTitle", { query: heroPlan.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_improvement_plan", heroPlan.marketplace],
      previewText: t("heroPlan.previewLine", { corridor: heroPlan.corridor }),
    });
    showToast(t("heroPlan.toastSaved"));
  }, [heroPlan, serpEnvelope, showToast, t]);

  const resolveSuggestedHeroArch = useCallback((): HeroPromptArchetype => {
    if (!serpEnvelope) return "clean_marketplace_hero";
    const hint = serpEnvelope.crossModuleHints.find((h) => h.nav === "promptComposer");
    return (hint?.suggestedHeroArch ?? "clean_marketplace_hero") as HeroPromptArchetype;
  }, [serpEnvelope]);

  const onAnalyzeGap = useCallback(() => {
    if (!serpEnvelope) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const q = serpEnvelope.snapshot.query;
    const mp = serpEnvelope.snapshot.marketplace;
    const snap = buildOurCardSnapshot(ourCardForm, q, mp);
    setOurCardSnapForGap(snap);
    setGapAnalysis(deriveCompetitiveGapAnalysis(serpEnvelope, snap, t));
    showToast(t("gap.toastAnalyzed"));
  }, [ourCardForm, serpEnvelope, showToast, t]);

  const saveGapMemory = useCallback(() => {
    if (!serpEnvelope || !gapAnalysis || !ourCardSnapForGap) return;
    const payload = buildCompetitiveGapAnalysisMemoryPayload(ourCardSnapForGap, gapAnalysis, serpEnvelope);
    recordGeneration({
      module: "competitive_gap_analysis",
      title: t("gap.memoryTitle", { query: gapAnalysis.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["competitive_gap_analysis", gapAnalysis.marketplace],
      previewText: t("gap.previewLine", { sku: ourCardSnapForGap.skuCode || "—" }),
    });
    showToast(t("gap.toastSaved"));
  }, [gapAnalysis, ourCardSnapForGap, serpEnvelope, showToast, t]);

  const onGapHeroPlanFromGap = useCallback(() => {
    if (!serpEnvelope || !gapAnalysis) {
      showToast(t("gap.toastNeedGap"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    const base = deriveCompetitiveHeroImprovementPlan(serpEnvelope, corridor, t);
    setPlanOverride(mergeHeroPlanWithGap(base, gapAnalysis, t));
    showToast(t("gap.toastHeroPlanMerged"));
  }, [defaultCorridor, gapAnalysis, heroCorridorDraft, serpEnvelope, showToast, t]);

  const onGapVisualJob = useCallback(() => {
    if (!serpEnvelope || !gapAnalysis) {
      showToast(t("gap.toastNeedGap"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    const our = ourCardSnapForGap ?? buildOurCardSnapshot(ourCardForm, serpEnvelope.snapshot.query, serpEnvelope.snapshot.marketplace);
    appendGapAnalysisVisualJob(gapAnalysis, our, corridor);
    onNavigate("visualProduction");
    showToast(t("gap.toastVisualQueued"));
  }, [defaultCorridor, gapAnalysis, heroCorridorDraft, ourCardForm, ourCardSnapForGap, onNavigate, serpEnvelope, showToast, t]);

  const onGapPromptComposer = useCallback(() => {
    if (!serpEnvelope || !gapAnalysis) {
      showToast(t("gap.toastNeedGap"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    const our = ourCardSnapForGap ?? buildOurCardSnapshot(ourCardForm, serpEnvelope.snapshot.query, serpEnvelope.snapshot.marketplace);
    pushGapAnalysisToComposer(gapAnalysis, our, corridor, resolveSuggestedHeroArch());
    onNavigate("promptComposer");
    showToast(t("gap.toastComposer"));
  }, [defaultCorridor, gapAnalysis, heroCorridorDraft, ourCardForm, ourCardSnapForGap, onNavigate, resolveSuggestedHeroArch, serpEnvelope, showToast, t]);

  const onGapAssortmentRefresh = useCallback(() => {
    if (!serpEnvelope || !gapAnalysis) {
      showToast(t("gap.toastNeedGap"));
      return;
    }
    const summary = gapAnalysis.recommendedChanges.slice(0, 3).join(" · ") || gapAnalysis.readabilityGap;
    pushAssortmentSerpHint({
      query: serpEnvelope.snapshot.query,
      saturation: String(serpEnvelope.analysis.saturationSignal),
      heroRefreshFromGap: true,
      heroRefreshSummary: summary,
    });
    onNavigate("assortmentActions");
    showToast(t("gap.toastAssortmentHint"));
  }, [gapAnalysis, onNavigate, serpEnvelope, showToast, t]);

  const saveHeroArchetypeMemory = useCallback(() => {
    if (!serpEnvelope || !archetypeIntel) return;
    const payload = buildHeroArchetypeIntelligenceMemoryPayload(archetypeIntel, serpEnvelope);
    const top = archetypeIntel.dominantSerpArchetypes[0]?.archetype ?? "—";
    recordGeneration({
      module: "hero_archetype_intelligence",
      title: t("ha.memoryTitle", { query: archetypeIntel.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_archetype_intelligence", archetypeIntel.marketplace],
      previewText: t("ha.previewLine", { top }),
    });
    showToast(t("ha.toastSaved"));
  }, [archetypeIntel, serpEnvelope, showToast, t]);

  const onArchHeroPrompt = useCallback(() => {
    if (!serpEnvelope || !archetypeIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    const arch = suggestedPromptArchFromShares(archetypeIntel.dominantSerpArchetypes);
    pushArchetypeIntelligenceToComposer(archetypeIntel, corridor, arch);
    onNavigate("promptComposer");
    showToast(t("ha.toastComposer"));
  }, [archetypeIntel, defaultCorridor, heroCorridorDraft, onNavigate, serpEnvelope, showToast, t]);

  const onArchVisualJob = useCallback(() => {
    if (!serpEnvelope || !archetypeIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    appendArchetypeIntelligenceVisualJob(archetypeIntel, corridor);
    onNavigate("visualProduction");
    showToast(t("ha.toastVisual"));
  }, [archetypeIntel, defaultCorridor, heroCorridorDraft, onNavigate, serpEnvelope, showToast, t]);

  const onArchMergeHeroPlan = useCallback(() => {
    if (!serpEnvelope || !archetypeIntel || !heroPlan) {
      showToast(!heroPlan ? t("ha.toastNeedHeroPlan") : t("gap.toastNeedSerp"));
      return;
    }
    setPlanOverride(mergeHeroPlanWithArchetypeIntel(heroPlan, archetypeIntel, t));
    showToast(t("ha.toastMergedPlan"));
  }, [archetypeIntel, heroPlan, serpEnvelope, showToast, t]);

  const onArchVisualStrategy = useCallback(() => {
    if (!archetypeIntel || !serpEnvelope) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    pushVisualStrategySerpBanner(serpEnvelope.insights);
    pushHeroArchetypeVisualStrategyLines(serpEnvelope.snapshot.query, [
      archetypeIntel.saturationSummary,
      archetypeIntel.recommendedDirectionLine,
      archetypeIntel.overlapRiskLine,
    ]);
    onNavigate("visualStrategy");
    showToast(t("ha.toastVs"));
  }, [archetypeIntel, onNavigate, serpEnvelope, showToast, t]);

  const onArchCollectionBuilder = useCallback(() => {
    if (!serpEnvelope || !archetypeIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const top = serpEnvelope.analysis.dominantVisualPatterns[0]?.label ?? "";
    pushCollectionBuilderSerpHint({
      query: serpEnvelope.snapshot.query,
      weakVisualSharePct: String(serpEnvelope.analysis.weakVisualCompetitorSharePct),
      topPattern: top,
      archetypeOpportunity: archetypeIntel.underrepresentedLines[0] ?? archetypeIntel.recommendedDirectionLine,
    });
    onNavigate("collectionBuilder");
    showToast(t("ha.toastCollection"));
  }, [archetypeIntel, onNavigate, serpEnvelope, showToast, t]);

  const onArchAssortment = useCallback(() => {
    if (!serpEnvelope || !archetypeIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const summary = archetypeIntel.practicalRecommendations.slice(0, 2).join(" · ") || archetypeIntel.overlapRiskLine;
    pushAssortmentSerpHint({
      query: serpEnvelope.snapshot.query,
      saturation: String(serpEnvelope.analysis.saturationSignal),
      heroRefreshFromGap: true,
      heroRefreshSummary: summary,
    });
    onNavigate("assortmentActions");
    showToast(t("ha.toastAssortment"));
  }, [archetypeIntel, onNavigate, serpEnvelope, showToast, t]);

  const saveHeroReadabilityMemory = useCallback(() => {
    if (!serpEnvelope || !readabilityIntel) return;
    const payload = buildHeroReadabilityIntelligenceMemoryPayload(
      readabilityIntel,
      serpEnvelope,
      gapAnalysis ?? undefined,
      ourCardSnapForGap ?? undefined,
    );
    recordGeneration({
      module: "hero_readability_intelligence",
      title: t("hr.memoryTitle", { query: readabilityIntel.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_readability_intelligence", readabilityIntel.marketplace],
      previewText: t("hr.previewLine", { pressure: String(readabilityIntel.readabilityPressureIndex) }),
    });
    showToast(t("hr.toastSaved"));
  }, [gapAnalysis, ourCardSnapForGap, readabilityIntel, serpEnvelope, showToast, t]);

  const onReadHeroPrompt = useCallback(() => {
    if (!serpEnvelope || !readabilityIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    const arch =
      serpEnvelope.analysis.printReadabilityBuckets[0]!.sharePct >= 38
        ? ("cinematic_movement_hero" as HeroPromptArchetype)
        : resolveSuggestedHeroArch();
    pushReadabilityIntelligenceToComposer(readabilityIntel, corridor, arch);
    onNavigate("promptComposer");
    showToast(t("hr.toastComposer"));
  }, [defaultCorridor, heroCorridorDraft, onNavigate, readabilityIntel, resolveSuggestedHeroArch, serpEnvelope, showToast, t]);

  const onReadVisualJob = useCallback(() => {
    if (!serpEnvelope || !readabilityIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    appendReadabilityIntelligenceVisualJob(readabilityIntel, corridor);
    onNavigate("visualProduction");
    showToast(t("hr.toastVisual"));
  }, [defaultCorridor, heroCorridorDraft, onNavigate, readabilityIntel, serpEnvelope, showToast, t]);

  const onReadMergeHeroPlan = useCallback(() => {
    if (!serpEnvelope || !readabilityIntel || !heroPlan) {
      showToast(!heroPlan ? t("hr.toastNeedHeroPlan") : t("gap.toastNeedSerp"));
      return;
    }
    setPlanOverride(mergeHeroPlanWithReadabilityIntel(heroPlan, readabilityIntel, t));
    showToast(t("hr.toastMergedPlan"));
  }, [heroPlan, readabilityIntel, serpEnvelope, showToast, t]);

  const onReadVisualStrategy = useCallback(() => {
    if (!readabilityIntel || !serpEnvelope) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    pushVisualStrategySerpBanner(serpEnvelope.insights);
    pushHeroReadabilityVisualStrategyLines(serpEnvelope.snapshot.query, [
      readabilityIntel.readabilityPressureSummary,
      readabilityIntel.readabilityGapLine,
      readabilityIntel.mobileClarityLine,
    ]);
    onNavigate("visualStrategy");
    showToast(t("hr.toastVs"));
  }, [readabilityIntel, onNavigate, serpEnvelope, showToast, t]);

  const onReadCollectionBuilder = useCallback(() => {
    if (!serpEnvelope || !readabilityIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const top = serpEnvelope.analysis.dominantVisualPatterns[0]?.label ?? "";
    pushCollectionBuilderSerpHint({
      query: serpEnvelope.snapshot.query,
      weakVisualSharePct: String(serpEnvelope.analysis.weakVisualCompetitorSharePct),
      topPattern: top,
      readabilityOpportunity: readabilityIntel.practicalRecommendations[0] ?? readabilityIntel.readabilityGapLine,
    });
    onNavigate("collectionBuilder");
    showToast(t("hr.toastCollection"));
  }, [readabilityIntel, onNavigate, serpEnvelope, showToast, t]);

  const onReadAssortment = useCallback(() => {
    if (!serpEnvelope || !readabilityIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const summary = readabilityIntel.practicalRecommendations.slice(0, 2).join(" · ") || readabilityIntel.readabilityRiskLine;
    pushAssortmentSerpHint({
      query: serpEnvelope.snapshot.query,
      saturation: String(serpEnvelope.analysis.saturationSignal),
      heroRefreshFromGap: true,
      heroRefreshSummary: summary,
    });
    onNavigate("assortmentActions");
    showToast(t("hr.toastAssortment"));
  }, [readabilityIntel, onNavigate, serpEnvelope, showToast, t]);

  const saveHeroFatigueMemory = useCallback(() => {
    if (!serpEnvelope || !fatigueIntel) return;
    const payload = buildHeroFatigueIntelligenceMemoryPayload(fatigueIntel, serpEnvelope);
    recordGeneration({
      module: "hero_fatigue_intelligence",
      title: t("hf.memoryTitle", { query: fatigueIntel.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_fatigue_intelligence", fatigueIntel.marketplace],
      previewText: t("hf.previewLine", { pressure: String(fatigueIntel.fatiguePressureIndex) }),
    });
    showToast(t("hf.toastSaved"));
  }, [fatigueIntel, serpEnvelope, showToast, t]);

  const onFatigueHeroPrompt = useCallback(() => {
    if (!serpEnvelope || !fatigueIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    pushFatigueIntelligenceToComposer(fatigueIntel, corridor, resolveSuggestedHeroArch());
    onNavigate("promptComposer");
    showToast(t("hf.toastComposer"));
  }, [defaultCorridor, fatigueIntel, heroCorridorDraft, onNavigate, resolveSuggestedHeroArch, serpEnvelope, showToast, t]);

  const onFatigueVisualJob = useCallback(() => {
    if (!serpEnvelope || !fatigueIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    appendFatigueIntelligenceVisualJob(fatigueIntel, corridor);
    onNavigate("visualProduction");
    showToast(t("hf.toastVisual"));
  }, [defaultCorridor, fatigueIntel, heroCorridorDraft, onNavigate, serpEnvelope, showToast, t]);

  const onFatigueMergeHeroPlan = useCallback(() => {
    if (!serpEnvelope || !fatigueIntel || !heroPlan) {
      showToast(!heroPlan ? t("hf.toastNeedHeroPlan") : t("gap.toastNeedSerp"));
      return;
    }
    setPlanOverride(mergeHeroPlanWithFatigueIntel(heroPlan, fatigueIntel, t));
    showToast(t("hf.toastMergedPlan"));
  }, [fatigueIntel, heroPlan, serpEnvelope, showToast, t]);

  const onFatigueAssortment = useCallback(() => {
    if (!serpEnvelope || !fatigueIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const summary = fatigueIntel.practicalRecommendations.slice(0, 2).join(" · ") || fatigueIntel.refreshUrgencyLine;
    pushAssortmentSerpHint({
      query: serpEnvelope.snapshot.query,
      saturation: String(serpEnvelope.analysis.saturationSignal),
      heroRefreshFromGap: true,
      heroRefreshSummary: summary,
      heroFatigueSummary: fatigueIntel.visualBlindnessRiskLine,
    });
    onNavigate("assortmentActions");
    showToast(t("hf.toastAssortment"));
  }, [fatigueIntel, onNavigate, serpEnvelope, showToast, t]);

  const onFatigueMarkAssets = useCallback(() => {
    if (!fatigueIntel) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const sku = ourCardSnapForGap?.skuCode?.trim() || undefined;
    const n = markHeroAssetsFatigueRisk({
      query: fatigueIntel.query,
      skuCode: sku,
      note: fatigueIntel.refreshUrgencyLine,
    });
    showToast(n ? t("hf.toastMarkOk", { n: String(n) }) : t("hf.toastMarkNone"));
  }, [fatigueIntel, ourCardSnapForGap?.skuCode, showToast, t]);

  const onFatigueVisualAssets = useCallback(() => {
    onNavigate("visualAssets");
  }, [onNavigate]);

  const hbpArch = useCallback((): HeroPromptArchetype => {
    if (archetypeIntel?.dominantSerpArchetypes?.length) {
      return suggestedPromptArchFromShares(archetypeIntel.dominantSerpArchetypes);
    }
    return resolveSuggestedHeroArch();
  }, [archetypeIntel, resolveSuggestedHeroArch]);

  const onBattlePlanHeroPrompt = useCallback(() => {
    if (!battlePlan) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    pushBattlePlanToComposer(battlePlan, corridor, hbpArch());
    onNavigate("promptComposer");
    showToast(t("hbp.toastComposer"));
  }, [battlePlan, defaultCorridor, heroCorridorDraft, hbpArch, onNavigate, showToast, t]);

  const onBattlePlanVisualJob = useCallback(() => {
    if (!battlePlan) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    appendBattlePlanVisualJob(battlePlan, corridor);
    onNavigate("visualProduction");
    showToast(t("hbp.toastVisual"));
  }, [battlePlan, defaultCorridor, heroCorridorDraft, onNavigate, showToast, t]);

  const onBattlePlanVisualStrategy = useCallback(() => {
    if (!battlePlan || !serpEnvelope) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    pushVisualStrategySerpBanner(serpEnvelope.insights);
    pushHeroBattlePlanVisualStrategyLines(serpEnvelope.snapshot.query, [
      battlePlan.refreshStrategy,
      battlePlan.recommendedArchetype,
      battlePlan.biggestWeakness,
    ]);
    onNavigate("visualStrategy");
    showToast(t("hbp.toastVs"));
  }, [battlePlan, onNavigate, serpEnvelope, showToast, t]);

  const onBattlePlanAssortment = useCallback(() => {
    if (!battlePlan || !serpEnvelope) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const summary =
      battlePlan.nextActions.slice(0, 3).join(" · ") || battlePlan.refreshStrategy || battlePlan.biggestWeakness;
    pushAssortmentSerpHint({
      query: serpEnvelope.snapshot.query,
      saturation: String(serpEnvelope.analysis.saturationSignal),
      heroRefreshFromGap: true,
      heroRefreshSummary: summary,
      heroFatigueSummary: battlePlan.fatigueDirective.slice(0, 240),
    });
    onNavigate("assortmentActions");
    showToast(t("hbp.toastAssortment"));
  }, [battlePlan, onNavigate, serpEnvelope, showToast, t]);

  const onBattlePlanMarkAssets = useCallback(() => {
    if (!battlePlan) {
      showToast(t("gap.toastNeedSerp"));
      return;
    }
    const sku = ourCardSnapForGap?.skuCode?.trim() || undefined;
    const note = fatigueIntel?.refreshUrgencyLine?.trim() || battlePlan.fatigueDirective || battlePlan.biggestWeakness;
    const n = markHeroAssetsFatigueRisk({
      query: battlePlan.query,
      skuCode: sku,
      note: note.slice(0, 400),
    });
    showToast(n ? t("hf.toastMarkOk", { n: String(n) }) : t("hf.toastMarkNone"));
  }, [battlePlan, fatigueIntel?.refreshUrgencyLine, ourCardSnapForGap?.skuCode, showToast, t]);

  const saveBattlePlanMemory = useCallback(() => {
    if (!battlePlan) return;
    const payload = buildHeroBattlePlanMemoryPayload(battlePlan, serpEnvelope ?? undefined);
    recordGeneration({
      module: "hero_battle_plan",
      title: t("hbp.memoryTitle", { query: battlePlan.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_battle_plan", battlePlan.marketplace],
      previewText: t("hbp.previewLine", { strategy: battlePlan.refreshStrategy.slice(0, 80) }),
    });
    showToast(t("hbp.toastSaved"));
  }, [battlePlan, serpEnvelope, showToast, t]);

  const onBattlePlanCopy = useCallback(async () => {
    if (!battlePlan) return;
    await copyToClipboard(heroBattlePlanToPlainText(battlePlan));
    showToast(t("hbp.toastCopied"));
  }, [battlePlan, showToast, t]);

  const onBattlePlanExportMd = useCallback(() => {
    if (!battlePlan) return;
    const safe = battlePlan.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadText(`hero-battle-plan-${safe}.md`, heroBattlePlanToMarkdown(battlePlan));
    showToast(t("hbp.toastExported"));
  }, [battlePlan, showToast, t]);

  const onBattlePlanExportJson = useCallback(() => {
    if (!battlePlan) return;
    const safe = battlePlan.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadJson(`hero-battle-plan-${safe}.json`, battlePlan);
    showToast(t("hbp.toastExported"));
  }, [battlePlan, showToast, t]);

  const onVariantHeroPrompt = useCallback(
    (variant: HeroTestVariant) => {
      if (!testMatrix) return;
      const corridor = heroCorridorDraft.trim() || defaultCorridor;
      pushTestMatrixVariantToComposer(testMatrix, variant, corridor, hbpArch());
      onNavigate("promptComposer");
      showToast(t("htm.toastComposer"));
    },
    [defaultCorridor, heroCorridorDraft, hbpArch, onNavigate, showToast, t, testMatrix],
  );

  const onVariantVisualJob = useCallback(
    (variant: HeroTestVariant) => {
      if (!testMatrix) return;
      const corridor = heroCorridorDraft.trim() || defaultCorridor;
      appendTestMatrixVariantVisualJob(testMatrix, variant, corridor);
      onNavigate("visualProduction");
      showToast(t("htm.toastVisual"));
    },
    [defaultCorridor, heroCorridorDraft, onNavigate, showToast, t, testMatrix],
  );

  const onTestMatrixQueueAll = useCallback(() => {
    if (!testMatrix) return;
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    const n = appendTestMatrixAllVisualJobs(testMatrix, corridor);
    onNavigate("visualProduction");
    showToast(t("htm.toastVisualAll", { n: String(n) }));
  }, [defaultCorridor, heroCorridorDraft, onNavigate, showToast, t, testMatrix]);

  const saveTestMatrixMemory = useCallback(() => {
    if (!testMatrix) return;
    const payload = buildHeroTestMatrixMemoryPayload(testMatrix, serpEnvelope ?? undefined, battlePlan?.id);
    recordGeneration({
      module: "hero_test_matrix",
      title: t("htm.memoryTitle", { query: testMatrix.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_test_matrix", testMatrix.marketplace],
      previewText: t("htm.previewLine", { focus: testMatrix.testingFocus.slice(0, 80) }),
    });
    showToast(t("htm.toastSaved"));
  }, [battlePlan?.id, serpEnvelope, showToast, t, testMatrix]);

  const onTestMatrixCopy = useCallback(async () => {
    if (!testMatrix) return;
    await copyToClipboard(heroTestMatrixToPlainText(testMatrix));
    showToast(t("htm.toastCopied"));
  }, [showToast, t, testMatrix]);

  const onTestMatrixExportMd = useCallback(() => {
    if (!testMatrix) return;
    const safe = testMatrix.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadText(`hero-test-matrix-${safe}.md`, heroTestMatrixToMarkdown(testMatrix));
    showToast(t("htm.toastExported"));
  }, [showToast, t, testMatrix]);

  const onTestMatrixExportJson = useCallback(() => {
    if (!testMatrix) return;
    const safe = testMatrix.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadJson(`hero-test-matrix-${safe}.json`, testMatrix);
    showToast(t("htm.toastExported"));
  }, [showToast, t, testMatrix]);

  const patchTestResult = useCallback(
    (variantId: string, patch: Partial<HeroTestResult>) => {
      if (!testMatrix) return;
      setTestResultsBundleOverride((prev) => {
        const base = mergeResultsWithMatrix(testMatrix, prev);
        const results = base.results.map((r) =>
          r.sourceVariantId === variantId ? { ...r, ...patch, updatedAt: Date.now() } : r,
        );
        return { ...base, results, updatedAt: Date.now() };
      });
    },
    [testMatrix],
  );

  const onSaveTestResult = useCallback(
    (variantId: string) => {
      if (!testMatrix || !testResultsBundle) return;
      const result = testResultsBundle.results.find((r) => r.sourceVariantId === variantId);
      if (!result) return;
      if (result.resultStatus === "winner") {
        setTestResultsBundleOverride(applyWinnerToBundle(testResultsBundle, testMatrix, variantId, t));
        showToast(t("htr.toastWinner"));
        return;
      }
      showToast(t("htr.toastSaved"));
    },
    [showToast, t, testMatrix, testResultsBundle],
  );

  const onRegisterWinnerAsset = useCallback(
    (variantId: string) => {
      if (!testMatrix || !testResultsBundle) return;
      const variant = testMatrix.testVariants.find((v) => v.id === variantId);
      const result = testResultsBundle.results.find((r) => r.sourceVariantId === variantId);
      if (!variant || !result) return;
      const corridor = heroCorridorDraft.trim() || defaultCorridor;
      const asset = buildVisualAssetFromTestResult({ matrix: testMatrix, variant, result, corridor });
      if (!asset) {
        showToast(t("htr.toastRegisterDiscard"));
        return;
      }
      const res = tryAppendVisualAsset(asset);
      if (!res.ok) {
        showToast(t("htr.toastRegisterDup"));
        return;
      }
      setTestResultsBundleOverride({
        ...testResultsBundle,
        registeredAssetId: asset.id,
        updatedAt: Date.now(),
      });
      showToast(t("htr.toastRegisterOk"));
    },
    [defaultCorridor, heroCorridorDraft, showToast, t, testMatrix, testResultsBundle],
  );

  const onCreateCardPlanFromWinner = useCallback(
    (variantId: string) => {
      if (!testMatrix || !testResultsBundle) return;
      const result = testResultsBundle.results.find((r) => r.sourceVariantId === variantId);
      if (!result || (result.finalUse !== "wb_hero" && result.finalUse !== "ozon_hero")) {
        showToast(t("htr.toastCardPlanHeroOnly"));
        return;
      }
      let assetId = testResultsBundle.registeredAssetId;
      if (!assetId) {
        const variant = testMatrix.testVariants.find((v) => v.id === variantId);
        if (!variant) return;
        const corridor = heroCorridorDraft.trim() || defaultCorridor;
        const asset = buildVisualAssetFromTestResult({ matrix: testMatrix, variant, result, corridor });
        if (!asset) {
          showToast(t("htr.toastRegisterDiscard"));
          return;
        }
        const res = tryAppendVisualAsset(asset);
        if (!res.ok) {
          const reg = loadVisualAssetRegistryFromSession();
          const existing = reg?.assets.find((a) => a.sourceJobId === result.id);
          if (!existing) {
            showToast(t("htr.toastRegisterDup"));
            return;
          }
          assetId = existing.id;
        } else {
          assetId = asset.id;
        }
        setTestResultsBundleOverride({
          ...testResultsBundle,
          registeredAssetId: assetId,
          updatedAt: Date.now(),
        });
      }
      const reg = loadVisualAssetRegistryFromSession();
      const asset = reg?.assets.find((a) => a.id === assetId);
      if (!asset) {
        showToast(t("htr.toastCardPlanNoAsset"));
        return;
      }
      appendCardPlan(createCardProductionPlanFromVisualAsset(asset));
      showToast(t("htr.toastCardPlan"));
      onNavigate("cardProduction");
    },
    [defaultCorridor, heroCorridorDraft, onNavigate, showToast, t, testMatrix, testResultsBundle],
  );

  const onWinnerHeroPrompt = useCallback(() => {
    if (!testMatrix || !testResultsBundle?.winnerVariantId) return;
    const variant = testMatrix.testVariants.find((v) => v.id === testResultsBundle.winnerVariantId);
    if (!variant) return;
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    pushTestMatrixVariantToComposer(testMatrix, variant, corridor, hbpArch());
    onNavigate("promptComposer");
    showToast(t("htr.toastComposerWinner"));
  }, [defaultCorridor, heroCorridorDraft, hbpArch, onNavigate, showToast, t, testMatrix, testResultsBundle]);

  const saveTestResultsMemory = useCallback(() => {
    if (!testMatrix || !testResultsBundle) return;
    const payload = buildHeroTestResultsMemoryPayload(testResultsBundle, testMatrix, serpEnvelope ?? undefined);
    recordGeneration({
      module: "hero_test_results",
      title: t("htr.memoryTitle", { query: testMatrix.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_test_results", testMatrix.marketplace],
      previewText: testResultsBundle.winnerSummary.slice(0, 80) || testMatrix.testingFocus.slice(0, 80),
    });
    showToast(t("htr.toastMemorySaved"));
  }, [serpEnvelope, showToast, t, testMatrix, testResultsBundle]);

  const onTestResultsCopy = useCallback(async () => {
    if (!testMatrix || !testResultsBundle) return;
    await copyToClipboard(heroTestResultsToPlainText(testMatrix, testResultsBundle));
    showToast(t("htr.toastCopied"));
  }, [showToast, t, testMatrix, testResultsBundle]);

  const onTestResultsExportMd = useCallback(() => {
    if (!testMatrix || !testResultsBundle) return;
    const safe = testMatrix.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadText(`hero-test-results-${safe}.md`, heroTestResultsToMarkdown(testMatrix, testResultsBundle));
    showToast(t("htr.toastExported"));
  }, [showToast, t, testMatrix, testResultsBundle]);

  const onTestResultsExportJson = useCallback(() => {
    if (!testMatrix || !testResultsBundle) return;
    const safe = testMatrix.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadJson(`hero-test-results-${safe}.json`, { matrix: testMatrix, bundle: testResultsBundle });
    showToast(t("htr.toastExported"));
  }, [showToast, t, testMatrix, testResultsBundle]);

  const readinessLabel = useCallback(
    (r: HeroLaunchPackage["readiness"]) => {
      if (r === "ready_for_manual_launch") return t("hlp.readiness.ready");
      if (r === "partial") return t("hlp.readiness.partial");
      return t("hlp.readiness.not_ready");
    },
    [t],
  );

  const onLaunchPackageCopy = useCallback(async () => {
    if (!launchPackage) {
      showToast(t("hlp.toastNoWinner"));
      return;
    }
    await copyToClipboard(heroLaunchPackageToPlainText(launchPackage));
    showToast(t("hlp.toastCopied"));
  }, [launchPackage, showToast, t]);

  const onLaunchPackageExportMd = useCallback(() => {
    if (!launchPackage) {
      showToast(t("hlp.toastNoWinner"));
      return;
    }
    const safe = launchPackage.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadText(`hero-launch-package-${safe}.md`, heroLaunchPackageToMarkdown(launchPackage));
    showToast(t("hlp.toastExported"));
  }, [launchPackage, showToast, t]);

  const onLaunchPackageExportJson = useCallback(() => {
    if (!launchPackage) {
      showToast(t("hlp.toastNoWinner"));
      return;
    }
    const safe = launchPackage.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadJson(`hero-launch-package-${safe}.json`, {
      package: launchPackage,
      matrix: testMatrix,
      resultsBundle: testResultsBundle,
    });
    showToast(t("hlp.toastExported"));
  }, [launchPackage, showToast, t, testMatrix, testResultsBundle]);

  const saveLaunchPackageMemory = useCallback(() => {
    if (!launchPackage || !testMatrix || !testResultsBundle) return;
    const payload = buildHeroLaunchPackageMemoryPayload(
      launchPackage,
      testMatrix,
      testResultsBundle,
      serpEnvelope ?? undefined,
    );
    recordGeneration({
      module: "hero_launch_package",
      title: t("hlp.memoryTitle", { query: launchPackage.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_launch_package", launchPackage.marketplace],
      previewText: t("hlp.previewLine", { readiness: readinessLabel(launchPackage.readiness) }),
    });
    showToast(t("hlp.toastSaved"));
  }, [launchPackage, readinessLabel, serpEnvelope, showToast, t, testMatrix, testResultsBundle]);

  const patchPostLaunchObservation = useCallback(
    (patch: Partial<HeroPostLaunchObservation>) => {
      if (!launchPackage) return;
      setPostLaunchObservationOverride((prev) => {
        const base = buildHeroPostLaunchObservation(
          launchPackage,
          prev,
          { battlePlan, archetype: archetypeIntel, readability: readabilityIntel, fatigue: fatigueIntel },
          t,
        );
        return { ...base, ...patch };
      });
    },
    [archetypeIntel, battlePlan, fatigueIntel, launchPackage, readabilityIntel, t],
  );

  const onSavePostLaunchObservation = useCallback(() => {
    if (!launchPackage || !postLaunchObservation) return;
    const finalized = finalizeObservation(
      postLaunchObservation,
      { battlePlan, archetype: archetypeIntel, readability: readabilityIntel, fatigue: fatigueIntel },
      t,
    );
    setPostLaunchObservationOverride(finalized);
    showToast(t("hplo.toastSaved"));
  }, [archetypeIntel, battlePlan, fatigueIntel, launchPackage, postLaunchObservation, readabilityIntel, showToast, t]);

  const onObservationRefreshPlan = useCallback(() => {
    if (!battlePlan || !postLaunchObservation) return;
    setBattlePlanOverride({
      ...battlePlan,
      refreshStrategy: postLaunchObservation.nextRecommendation.slice(0, 500),
      fatigueDirective: postLaunchObservation.fatigueObservation.slice(0, 420),
      readabilityDirective: postLaunchObservation.readabilityObservation.slice(0, 420),
    });
    showToast(t("hplo.toastRefreshPlan"));
  }, [battlePlan, postLaunchObservation, showToast, t]);

  const onObservationNewTestMatrix = useCallback(() => {
    setTestMatrixOverride(null);
    setTestResultsBundleOverride(null);
    setLaunchPackageOverride(null);
    setPostLaunchObservationOverride(null);
    showToast(t("hplo.toastNewMatrix"));
  }, [showToast, t]);

  const onObservationUpdateBattlePlan = useCallback(() => {
    if (!battlePlan || !postLaunchObservation) return;
    const dir = [
      postLaunchObservation.nextRecommendation,
      postLaunchObservation.suspectedOutcome,
      battlePlan.promptDirection,
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 1200);
    setBattlePlanOverride({
      ...battlePlan,
      promptDirection: dir,
      recommendedArchetype: postLaunchObservation.suspectedOutcome.slice(0, 320) || battlePlan.recommendedArchetype,
    });
    showToast(t("hplo.toastBattlePlan"));
  }, [battlePlan, postLaunchObservation, showToast, t]);

  const onObservationReadabilityPrompt = useCallback(() => {
    if (!postLaunchObservation || !launchPackage) return;
    const corridor = heroCorridorDraft.trim() || defaultCorridor;
    pushHeroPlanComposerPayload({
      query: launchPackage.query,
      marketplace: launchPackage.marketplace,
      recommendedHeroDirection: postLaunchObservation.readabilityObservation.slice(0, 600),
      promptDirection: [
        postLaunchObservation.nextRecommendation,
        launchPackage.heroDirection,
        postLaunchObservation.readabilityObservation,
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 1200),
      negativeConstraints: launchPackage.marketplaceWarnings.join(" · ").slice(0, 1200),
      corridor,
      suggestedHeroArch: hbpArch(),
      garmentFocusLine: launchPackage.heroDirection.slice(0, 220),
      printFocusLine: postLaunchObservation.readabilityObservation.slice(0, 220),
      source: "readability",
    });
    onNavigate("promptComposer");
    showToast(t("hplo.toastComposer"));
  }, [
    defaultCorridor,
    heroCorridorDraft,
    hbpArch,
    launchPackage,
    onNavigate,
    postLaunchObservation,
    showToast,
    t,
  ]);

  const onObservationMarkFatigue = useCallback(() => {
    if (!postLaunchObservation) return;
    const n = markHeroAssetsFatigueRisk({
      query: postLaunchObservation.query,
      note: postLaunchObservation.fatigueObservation || postLaunchObservation.refreshRisk,
    });
    showToast(t("hplo.toastFatigue", { n: String(n) }));
  }, [postLaunchObservation, showToast, t]);

  const onPostLaunchCopy = useCallback(async () => {
    if (!postLaunchObservation) {
      showToast(t("hplo.toastNoLaunch"));
      return;
    }
    await copyToClipboard(heroPostLaunchObservationToPlainText(postLaunchObservation));
    showToast(t("hplo.toastCopied"));
  }, [postLaunchObservation, showToast, t]);

  const onPostLaunchExportMd = useCallback(() => {
    if (!postLaunchObservation) return;
    const safe = postLaunchObservation.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadText(`hero-post-launch-${safe}.md`, heroPostLaunchObservationToMarkdown(postLaunchObservation));
    showToast(t("hplo.toastExported"));
  }, [postLaunchObservation, showToast, t]);

  const onPostLaunchExportJson = useCallback(() => {
    if (!postLaunchObservation) return;
    const safe = postLaunchObservation.query.replace(/[^\w\-]+/g, "_").slice(0, 48);
    downloadJson(`hero-post-launch-${safe}.json`, {
      observation: postLaunchObservation,
      launchPackage,
      matrix: testMatrix,
      resultsBundle: testResultsBundle,
    });
    showToast(t("hplo.toastExported"));
  }, [launchPackage, postLaunchObservation, showToast, t, testMatrix, testResultsBundle]);

  const savePostLaunchMemory = useCallback(() => {
    if (!postLaunchObservation) return;
    const payload = buildHeroPostLaunchObservationMemoryPayload(
      postLaunchObservation,
      launchPackage,
      testMatrix,
      testResultsBundle,
      serpEnvelope ?? undefined,
    );
    recordGeneration({
      module: "hero_post_launch_observation",
      title: t("hplo.memoryTitle", { query: postLaunchObservation.query }),
      content: JSON.stringify(payload),
      mime: "application/json",
      tags: ["hero_post_launch_observation", postLaunchObservation.marketplace],
      previewText: postLaunchObservation.nextRecommendation.slice(0, 80),
    });
    showToast(t("hplo.toastMemory"));
  }, [launchPackage, postLaunchObservation, serpEnvelope, showToast, t, testMatrix, testResultsBundle]);

  const usingSample = !entitySnap && !foundationOverride;

  return (
    <div className="cb-lab cmap-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("cmap.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.competitiveMap")}</h1>
        <p className="cb-lab__lede">{t("cmap.lede")}</p>
        {usingSample ? (
          <p className="cb-lab__prose cb-lab__prose--tight">
            <span className="cmap-pill">{t("cmap.sampleBadge")}</span> {t("cmap.sampleLede")}
          </p>
        ) : null}
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("cmap.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setFoundationOverride(null)}>
            {t("cmap.rebuild")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("cmap.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("cmap.openMops")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("promptPack")}>
            {t("cmap.openPromptPack")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("cmap.openVisualAssets")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("cmap.openCollectionBuilder")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("assortmentActions")}>
            {t("cmap.openAssortmentActions")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualProduction")}>
            {t("cmap.openVisualProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("cmap.openMemory")}
          </button>
        </div>
      </header>

      {battlePlan ? (
        <section className="cb-lab__panel glass-panel cmap-sec cmap-hbp">
          <h2 className="cmap-sec__h">{t("hbp.sectionTitle")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("hbp.sectionLede")}</p>
          <div className="cmap-hbp__grid">
            <div>
              <h3 className="cmap-serp__subh">{t("hbp.field.battlefield")}</h3>
              <p className="cmap-hip__prose cmap-ha__tight">{battlePlan.competitorFieldSummary}</p>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("hbp.field.diagnosis")}</h3>
              <p className="cmap-hip__prose cmap-ha__tight">{battlePlan.ourHeroDiagnosis}</p>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("hbp.field.weak")}</h3>
              <p className="cmap-hip__mono cmap-ha__tight">{battlePlan.biggestWeakness}</p>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("hbp.field.adv")}</h3>
              <p className="cmap-hip__mono cmap-ha__tight">{battlePlan.strongestAdvantage}</p>
            </div>
            <div className="cmap-hbp__span2">
              <h3 className="cmap-serp__subh">{t("hbp.field.direction")}</h3>
              <p className="cmap-hip__prose cmap-ha__tight">{battlePlan.recommendedArchetype}</p>
              <p className="cmap-hip__mono cmap-ha__tight" style={{ marginTop: 6 }}>
                <strong>{t("hbp.field.refresh")}</strong> {battlePlan.refreshStrategy}
              </p>
            </div>
            <div className="cmap-hbp__span2">
              <h3 className="cmap-serp__subh">{t("hbp.field.promptDir")}</h3>
              <p className="cmap-hip__mono cmap-ha__tight">{battlePlan.promptDirection}</p>
            </div>
            <div className="cmap-hbp__span2">
              <h3 className="cmap-serp__subh">{t("hbp.field.next")}</h3>
              <ul className="cmap-mini-list">
                {battlePlan.nextActions.slice(0, 8).map((a, i) => (
                  <li key={`hbp-next-${i}`}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("hbp.field.risks")}</h3>
              <ul className="cmap-mini-list">
                {battlePlan.riskFlags.slice(0, 6).map((a, i) => (
                  <li key={`hbp-risk-${i}`}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("hbp.field.confidence")}</h3>
              <p className="cmap-hip__prose cmap-ha__tight">{battlePlan.confidenceNote}</p>
            </div>
          </div>
          <div className="cmap-serp__actions cmap-serp__actions--wrap">
            <button type="button" className="ghost-btn" onClick={onBattlePlanHeroPrompt}>
              {t("hbp.action.prompt")}
            </button>
            <button type="button" className="ghost-btn" onClick={onBattlePlanVisualJob}>
              {t("hbp.action.visualJob")}
            </button>
            <button type="button" className="ghost-btn" onClick={onBattlePlanVisualStrategy}>
              {t("hbp.action.visualStrat")}
            </button>
            <button type="button" className="ghost-btn" onClick={onBattlePlanAssortment}>
              {t("hbp.action.assortment")}
            </button>
            <button type="button" className="ghost-btn" onClick={onBattlePlanMarkAssets}>
              {t("hbp.action.markAssets")}
            </button>
            <button type="button" className="ghost-btn" onClick={saveBattlePlanMemory}>
              {t("hbp.action.saveMemory")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => void onBattlePlanCopy()}>
              {t("hbp.action.copy")}
            </button>
            <button type="button" className="ghost-btn" onClick={onBattlePlanExportMd}>
              {t("hbp.action.exportMd")}
            </button>
            <button type="button" className="ghost-btn" onClick={onBattlePlanExportJson}>
              {t("hbp.action.exportJson")}
            </button>
          </div>
          <style>{`
            .cmap-hbp__grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px 16px;
              margin-top: 10px;
            }
            .cmap-hbp__span2 {
              grid-column: 1 / -1;
            }
            @media (max-width: 720px) {
              .cmap-hbp__grid {
                grid-template-columns: 1fr;
              }
              .cmap-hbp__span2 {
                grid-column: 1;
              }
            }
          `}</style>
        </section>
      ) : null}

      {testMatrix ? (
        <section className="cb-lab__panel glass-panel cmap-sec cmap-htm">
          <h2 className="cmap-sec__h">{t("htm.sectionTitle")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("htm.sectionLede")}</p>
          <div className="cmap-htm__baseline">
            <h3 className="cmap-serp__subh">{t("htm.field.baseline")}</h3>
            <p className="cmap-hip__prose cmap-ha__tight">{testMatrix.baselineHeroDirection}</p>
            <p className="cmap-hip__mono cmap-ha__tight" style={{ marginTop: 6 }}>
              <strong>{t("htm.field.focus")}:</strong> {testMatrix.testingFocus}
            </p>
          </div>
          <div className="cmap-htm__variants">
            {testMatrix.testVariants.map((v) => {
              const result = testResultsBundle?.results.find((r) => r.sourceVariantId === v.id);
              const isWinner =
                testResultsBundle?.winnerVariantId === v.id || result?.resultStatus === "winner";
              if (!result) return null;
              return (
              <article
                key={v.id}
                className={`cmap-htm__card glass-panel--inset${isWinner ? " cmap-htm__card--winner" : ""}`}
              >
                <h3 className="cmap-serp__subh">
                  {v.variantName}
                  {isWinner ? <span className="cmap-htm__winner-badge"> {t("htr.badge.winner")}</span> : null}
                </h3>
                <p className="cmap-hip__mono cmap-ha__tight">
                  <strong>{t("htm.field.changed")}:</strong> {v.changedVariable}
                </p>
                <p className="cmap-hip__prose cmap-ha__tight">
                  <strong>{t("htm.field.hypothesis")}:</strong> {v.hypothesis}
                </p>
                <p className="cmap-hip__prose cmap-ha__tight">
                  <strong>{t("htm.field.readability")}:</strong> {v.readabilityGoal}
                </p>
                <ul className="cmap-mini-list">
                  {v.dangerZones.slice(0, 3).map((d, i) => (
                    <li key={`${v.id}-dz-${i}`}>
                      <strong>{t("htm.field.danger")}:</strong> {d}
                    </li>
                  ))}
                </ul>
                <div className="cmap-serp__actions cmap-serp__actions--wrap" style={{ marginTop: 8 }}>
                  <button type="button" className="ghost-btn" onClick={() => onVariantHeroPrompt(v)}>
                    {t("htm.action.prompt")}
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => onVariantVisualJob(v)}>
                    {t("htm.action.visualJob")}
                  </button>
                </div>
                <HeroTestVariantReview
                  variant={v}
                  result={result}
                  isWinner={isWinner}
                  t={t}
                  onPatch={(patch) => patchTestResult(v.id, patch)}
                  onSave={() => onSaveTestResult(v.id)}
                  onRegisterWinner={() => onRegisterWinnerAsset(v.id)}
                  onCreateCardPlan={() => onCreateCardPlanFromWinner(v.id)}
                  registerDisabled={result.finalUse === "discard" || Boolean(testResultsBundle?.registeredAssetId)}
                  cardPlanDisabled={result.finalUse !== "wb_hero" && result.finalUse !== "ozon_hero"}
                />
              </article>
              );
            })}
          </div>
          {testResultsBundle?.winnerVariantId && testResultsBundle.winnerSummary ? (
            <div className="cmap-htm__winner glass-panel--inset">
              <h3 className="cmap-serp__subh">{t("htr.section.winner")}</h3>
              <p className="cmap-hip__prose cmap-ha__tight">{testResultsBundle.winnerSummary}</p>
              {testResultsBundle.recommendedNextActions.length > 0 ? (
                <>
                  <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                    {t("htr.section.nextActions")}
                  </h4>
                  <ul className="cmap-mini-list">
                    {testResultsBundle.recommendedNextActions.map((a, i) => (
                      <li key={`htr-next-${i}`}>{a}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="cmap-serp__actions cmap-serp__actions--wrap" style={{ marginTop: 8 }}>
                <button type="button" className="ghost-btn" onClick={onWinnerHeroPrompt}>
                  {t("htr.action.winnerPrompt")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
                  {t("htr.action.openAssets")}
                </button>
              </div>
            </div>
          ) : null}
          <div className="cmap-htm__meta">
            <div>
              <h3 className="cmap-serp__subh">{t("htm.field.rollout")}</h3>
              <ul className="cmap-mini-list">
                {testMatrix.rolloutRecommendation.map((r, i) => (
                  <li key={`htm-roll-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("htm.field.safety")}</h3>
              <ul className="cmap-mini-list">
                {testMatrix.marketplaceConstraints.map((c, i) => (
                  <li key={`htm-safe-${i}`}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("htm.field.risks")}</h3>
              <ul className="cmap-mini-list">
                {testMatrix.riskNotes.slice(0, 5).map((r, i) => (
                  <li key={`htm-risk-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="cmap-serp__subh">{t("htm.field.confidence")}</h3>
              <p className="cmap-hip__prose cmap-ha__tight">{testMatrix.confidenceNote}</p>
            </div>
          </div>
          <div className="cmap-serp__actions cmap-serp__actions--wrap">
            <button type="button" className="ghost-btn" onClick={onTestMatrixQueueAll}>
              {t("htm.action.queueAll")}
            </button>
            <button type="button" className="ghost-btn" onClick={saveTestMatrixMemory}>
              {t("htm.action.saveMemory")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => void onTestMatrixCopy()}>
              {t("htm.action.copy")}
            </button>
            <button type="button" className="ghost-btn" onClick={onTestMatrixExportMd}>
              {t("htm.action.exportMd")}
            </button>
            <button type="button" className="ghost-btn" onClick={onTestMatrixExportJson}>
              {t("htm.action.exportJson")}
            </button>
          </div>
          {testResultsBundle ? (
            <>
              <h3 className="cmap-serp__subh" style={{ marginTop: 14 }}>
                {t("htr.section.review")}
              </h3>
              <div className="cmap-serp__actions cmap-serp__actions--wrap">
                <button type="button" className="ghost-btn" onClick={saveTestResultsMemory}>
                  {t("htr.action.saveMemory")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => void onTestResultsCopy()}>
                  {t("htr.action.copy")}
                </button>
                <button type="button" className="ghost-btn" onClick={onTestResultsExportMd}>
                  {t("htr.action.exportMd")}
                </button>
                <button type="button" className="ghost-btn" onClick={onTestResultsExportJson}>
                  {t("htr.action.exportJson")}
                </button>
              </div>
            </>
          ) : null}
          {launchPackage ? (
            <section className="cmap-hlp glass-panel--inset" style={{ marginTop: 14 }}>
              <h3 className="cmap-sec__h">{t("hlp.sectionTitle")}</h3>
              <p className="cb-lab__prose cb-lab__prose--tight">{t("hlp.sectionLede")}</p>
              <p className="cmap-hip__mono cmap-ha__tight" style={{ marginTop: 8 }}>
                <strong>{t("hlp.field.readiness")}:</strong> {readinessLabel(launchPackage.readiness)}
              </p>
              {launchPackage.missingItems.length > 0 ? (
                <>
                  <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                    {t("hlp.field.missing")}
                  </h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.missingItems.map((m, i) => (
                      <li key={`hlp-miss-${i}`}>{m}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                {t("hlp.field.winner")}
              </h4>
              <p className="cmap-hip__prose cmap-ha__tight">{launchPackage.heroDirection}</p>
              <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                {t("hlp.field.why")}
              </h4>
              <p className="cmap-hip__prose cmap-ha__tight">{launchPackage.whyWinner}</p>
              <p className="cmap-hip__mono cmap-ha__tight" style={{ marginTop: 6 }}>
                <strong>{t("hlp.field.usage")}:</strong> {launchPackage.targetUsage}
              </p>
              <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                {t("hlp.field.prompt")}
              </h4>
              <p className="cmap-hip__mono cmap-ha__tight" style={{ whiteSpace: "pre-wrap" }}>
                {launchPackage.sourcePrompt.slice(0, 900)}
                {launchPackage.sourcePrompt.length > 900 ? "…" : ""}
              </p>
              <div className="cmap-hlp__cols">
                <div>
                  <h4 className="cmap-serp__subh">{t("hlp.field.checklist")}</h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.cardUpdateChecklist.map((c, i) => (
                      <li key={`hlp-chk-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="cmap-serp__subh">{t("hlp.field.monitor")}</h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.postLaunchMonitoring.map((c, i) => (
                      <li key={`hlp-mon-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="cmap-serp__subh">{t("hlp.field.seo")}</h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.seoNotes.slice(0, 6).map((c, i) => (
                      <li key={`hlp-seo-${i}`}>{c}</li>
                    ))}
                  </ul>
                  <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                    {t("hlp.field.title")}
                  </h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.titleNotes.slice(0, 5).map((c, i) => (
                      <li key={`hlp-tit-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="cmap-serp__subh">{t("hlp.field.rich")}</h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.richContentNotes.slice(0, 5).map((c, i) => (
                      <li key={`hlp-rich-${i}`}>{c}</li>
                    ))}
                  </ul>
                  <h4 className="cmap-serp__subh" style={{ marginTop: 8 }}>
                    {t("hlp.field.warnings")}
                  </h4>
                  <ul className="cmap-mini-list">
                    {launchPackage.marketplaceWarnings.slice(0, 6).map((c, i) => (
                      <li key={`hlp-warn-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="cmap-serp__actions cmap-serp__actions--wrap" style={{ marginTop: 10 }}>
                <button type="button" className="ghost-btn" onClick={() => void onLaunchPackageCopy()}>
                  {t("hlp.action.copy")}
                </button>
                <button type="button" className="ghost-btn" onClick={onLaunchPackageExportMd}>
                  {t("hlp.action.exportMd")}
                </button>
                <button type="button" className="ghost-btn" onClick={onLaunchPackageExportJson}>
                  {t("hlp.action.exportJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={saveLaunchPackageMemory}>
                  {t("hlp.action.saveMemory")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
                  {t("hlp.action.cardProduction")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
                  {t("hlp.action.visualAssets")}
                </button>
              </div>
            </section>
          ) : testResultsBundle && !canBuildLaunchPackage(testResultsBundle) ? (
            <p className="cb-lab__prose cb-lab__prose--tight" style={{ marginTop: 12 }}>
              {t("hlp.toastNoWinner")}
            </p>
          ) : null}
          {launchPackage && postLaunchObservation ? (
            <section className="cmap-hplo-wrap glass-panel--inset" style={{ marginTop: 14 }}>
              <h3 className="cmap-sec__h">{t("hplo.sectionTitle")}</h3>
              <p className="cb-lab__prose cb-lab__prose--tight">{t("hplo.sectionLede")}</p>
              <p className="cmap-hip__mono cmap-ha__tight" style={{ marginTop: 6 }}>
                {t("hplo.field.launchDate")}: {postLaunchObservation.launchDate || "—"} ·{" "}
                {t("hplo.field.observationDate")}: {postLaunchObservation.observationDate || "—"} ·{" "}
                {t("hplo.field.window")}: {postLaunchObservation.observationWindowDays}
              </p>
              <p className="cmap-hip__prose cmap-ha__tight" style={{ marginTop: 6 }}>
                <strong>{t("hplo.field.nextRec")}:</strong> {postLaunchObservation.nextRecommendation}
              </p>
              <p className="cmap-hip__mono cmap-ha__tight">
                <strong>{t("hplo.field.refreshRisk")}:</strong> {postLaunchObservation.refreshRisk}
              </p>
              <HeroPostLaunchObservationPanel
                observation={postLaunchObservation}
                t={t}
                onPatch={patchPostLaunchObservation}
                onSave={onSavePostLaunchObservation}
                onRefreshPlan={onObservationRefreshPlan}
                onNewTestMatrix={onObservationNewTestMatrix}
                onUpdateBattlePlan={onObservationUpdateBattlePlan}
                onReadabilityPrompt={onObservationReadabilityPrompt}
                onMarkFatigue={onObservationMarkFatigue}
              />
              <div className="cmap-serp__actions cmap-serp__actions--wrap" style={{ marginTop: 8 }}>
                <button type="button" className="ghost-btn" onClick={() => void onPostLaunchCopy()}>
                  {t("hplo.action.copy")}
                </button>
                <button type="button" className="ghost-btn" onClick={onPostLaunchExportMd}>
                  {t("hplo.action.exportMd")}
                </button>
                <button type="button" className="ghost-btn" onClick={onPostLaunchExportJson}>
                  {t("hplo.action.exportJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={savePostLaunchMemory}>
                  {t("hplo.action.saveMemory")}
                </button>
              </div>
            </section>
          ) : null}
          <style>{`
            .cmap-htm__baseline { margin-top: 10px; }
            .cmap-htm__variants {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
              gap: 10px;
              margin-top: 12px;
            }
            .cmap-htm__card { padding: 10px 12px; }
            .cmap-htm__card--winner { outline: 1px solid rgba(120, 200, 140, 0.45); }
            .cmap-htm__winner-badge { font-size: 0.85em; opacity: 0.9; }
            .cmap-htm__winner { margin-top: 12px; padding: 10px 12px; }
            .cmap-htm-review {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid rgba(255,255,255,0.08);
              display: grid;
              gap: 6px;
            }
            .cmap-htm-review--winner { border-top-color: rgba(120, 200, 140, 0.25); }
            .cmap-htm-review__row {
              display: grid;
              grid-template-columns: minmax(88px, 34%) 1fr;
              gap: 6px;
              align-items: center;
              font-size: 0.88rem;
            }
            .cmap-htm-review__row--full { grid-template-columns: 1fr; }
            .cmap-htm-review__row--full span { margin-bottom: 2px; }
            .cmap-htm-review__sel, .cmap-htm-review__txt, .cmap-htm-review__num {
              width: 100%;
              font-size: 0.88rem;
            }
            .cmap-htm-review__scores {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 6px;
            }
            .cmap-htm-review__score {
              display: flex;
              flex-direction: column;
              gap: 2px;
              font-size: 0.8rem;
            }
            .cmap-htm__meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px 16px;
              margin-top: 14px;
            }
            @media (max-width: 720px) {
              .cmap-htm__meta { grid-template-columns: 1fr; }
            }
            .cmap-hlp { padding: 10px 12px; }
            .cmap-hlp__cols {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px 16px;
              margin-top: 10px;
            }
            @media (max-width: 720px) {
              .cmap-hlp__cols { grid-template-columns: 1fr; }
            }
            .cmap-hplo-wrap { padding: 10px 12px; }
            .cmap-hplo { display: grid; gap: 6px; margin-top: 10px; }
            .cmap-hplo__timing {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 8px;
            }
            @media (max-width: 720px) {
              .cmap-hplo__timing { grid-template-columns: 1fr; }
            }
            .cmap-hplo__row {
              display: grid;
              grid-template-columns: minmax(100px, 32%) 1fr;
              gap: 6px;
              align-items: center;
              font-size: 0.88rem;
            }
            .cmap-hplo__row--full { grid-template-columns: 1fr; }
            .cmap-hplo__row--full > span { margin-bottom: 2px; }
            .cmap-hplo__field-inline {
              display: grid;
              grid-template-columns: minmax(88px, 36%) 1fr;
              gap: 6px;
            }
            .cmap-hplo__sel, .cmap-hplo__txt, .cmap-hplo__num {
              width: 100%;
              font-size: 0.88rem;
            }
          `}</style>
        </section>
      ) : null}

      <section className="cb-lab__panel glass-panel cmap-sec">
        <h2 className="cmap-sec__h">{t("cmap.section.links")}</h2>
        <ul className="cmap-hint-list">
          {serpEnvelope?.crossModuleHints.map((h, i) => (
            <li key={`serp-hint-${i}-${h.nav}`}>
              <button type="button" className="cmap-hint-btn" onClick={() => goSerpNav(h.nav as NavId)}>
                {t(h.messageKey, h.vars)}
              </button>
            </li>
          ))}
          {foundation.integrationHints.map((h) => (
            <li key={`${h.nav}-${h.messageKey}`}>
              <button type="button" className="cmap-hint-btn" onClick={() => onNavigate(h.nav as NavId)}>
                {t(h.messageKey, h.vars)}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec cmap-serp">
        <h2 className="cmap-sec__h">{t("serp.section.title")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("serp.section.lede")}</p>
        <div className="cmap-serp__row">
          <label className="cmap-serp__field">
            <span>{t("serp.queryLabel")}</span>
            <input
              className="cmap-serp__input"
              value={serpQuery}
              onChange={(e) => setSerpQuery(e.target.value)}
              placeholder="oversized tee black"
            />
          </label>
          <label className="cmap-serp__field">
            <span>{t("serp.marketLabel")}</span>
            <select className="cmap-serp__input" value={serpMarket} onChange={(e) => setSerpMarket(e.target.value)}>
              <option value="wildberries">Wildberries</option>
              <option value="ozon">Ozon</option>
              <option value="mixed">mixed</option>
            </select>
          </label>
        </div>
        <div className="cmap-serp__modes">
          <button
            type="button"
            className={serpMode === "table" ? "ghost-btn ghost-btn--on" : "ghost-btn"}
            onClick={() => setSerpMode("table")}
          >
            {t("serp.mode.table")}
          </button>
          <button
            type="button"
            className={serpMode === "quick" ? "ghost-btn ghost-btn--on" : "ghost-btn"}
            onClick={() => setSerpMode("quick")}
          >
            {t("serp.mode.quick")}
          </button>
        </div>
        <p className="cb-lab__prose cb-lab__prose--tight cmap-serp__hint">{serpMode === "table" ? t("serp.tableHelp") : t("serp.quickHelp")}</p>
        <label className="cmap-serp__block">
          <span>{t("serp.pasteLabel")}</span>
          <textarea
            className="cmap-serp__ta"
            rows={8}
            value={serpPaste}
            onChange={(e) => setSerpPaste(e.target.value)}
            spellCheck={false}
          />
        </label>
        <div className="cmap-serp__actions">
          <button type="button" className="ghost-btn" onClick={applySerpParse}>
            {t("serp.parse")}
          </button>
          <button type="button" className="ghost-btn" onClick={clearSerp}>
            {t("serp.clearSerp")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveSerpMemory} disabled={!serpEnvelope}>
            {t("serp.saveSerpMemory")}
          </button>
        </div>

        {serpEnvelope ? (
          <div className="cmap-serp__out">
            <h3 className="cmap-serp__subh">{t("serp.sub.analysis")}</h3>
            <p className="cmap-serp__line">
              <strong>{serpEnvelope.snapshot.query}</strong> · {serpEnvelope.snapshot.marketplace} ·{" "}
              {t("serp.positionsCount", { n: String(serpEnvelope.snapshot.items.length) })}
            </p>
            <ul className="cmap-mini-list">
              <li>
                {t("serp.k.avgPrice")}: {serpEnvelope.analysis.averagePrice ?? "—"}
              </li>
              <li>
                {t("serp.k.priceBand")}: {serpEnvelope.analysis.priceBand.low ?? "—"} — {serpEnvelope.analysis.priceBand.high ?? "—"}
              </li>
              <li>{t(serpEnvelope.analysis.modelUsageSummaryKey, serpEnvelope.analysis.modelUsageVars)}</li>
              <li>
                {t("serp.k.premiumIdx")}: {serpEnvelope.analysis.premiumPerceptionIndex}
              </li>
              <li>
                {t("serp.k.saturation")}: {serpEnvelope.analysis.saturationSignal}
              </li>
              <li>
                {t("serp.k.weakShare")}: {serpEnvelope.analysis.weakVisualCompetitorSharePct}% · {t("serp.k.strongShare")}:{" "}
                {serpEnvelope.analysis.strongVisualCompetitorSharePct}%
              </li>
            </ul>
            <p className="cmap-serp__subh2">{t("serp.k.patterns")}</p>
            <ul className="cmap-mini-list">
              {serpEnvelope.analysis.dominantVisualPatterns.slice(0, 8).map((p) => (
                <li key={p.label}>
                  {p.label} — {p.sharePct}% ({p.count})
                </li>
              ))}
            </ul>
            <p className="cmap-serp__subh2">{t("serp.k.colors")}</p>
            <ul className="cmap-mini-list">
              {serpEnvelope.analysis.dominantColors.slice(0, 6).map((c) => (
                <li key={c.label}>
                  {c.label} — {c.sharePct}%
                </li>
              ))}
            </ul>
            <p className="cmap-serp__subh2">{t("serp.k.print")}</p>
            <ul className="cmap-mini-list">
              {serpEnvelope.analysis.printReadabilityBuckets.map((b) => (
                <li key={b.bucket}>
                  {b.bucket}: {b.sharePct}%
                </li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("serp.sub.insights")}</h3>
            <ul className="cmap-pressure-list">
              {serpEnvelope.insights.map((ins) => (
                <li key={ins.id}>
                  <span className="cmap-pressure-sev">{ins.severity}</span> {t(ins.messageKey, ins.vars)}
                </li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("cmap.section.diff")}</h3>
            <ul className="cmap-mini-list">
              {serpEnvelope.analysis.differentiationGapKeys.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("serp.sub.actions")}</h3>
            <div className="cmap-serp__actions cmap-serp__actions--wrap">
              <button type="button" className="ghost-btn" onClick={() => goSerpNav("visualStrategy")}>
                {t("serp.openVisualStrategy")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => goSerpNav("promptComposer")}>
                {t("serp.openPromptComposer")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => goSerpNav("collectionBuilder")}>
                {t("serp.openCollectionBuilder")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => goSerpNav("assortmentActions")}>
                {t("serp.openAssortmentActions")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => goSerpNav("visualProduction")}>
                {t("serp.openVisualProduction")}
              </button>
            </div>
            <details className="cmap-serp__details">
              <summary>{t("serp.sub.items")}</summary>
              <ul className="cmap-mini-list">
                {serpEnvelope.snapshot.items.map((it) => (
                  <li key={it.id}>
                    <strong>{it.position}</strong> · {it.title.slice(0, 72)}
                    {it.brand ? ` · ${it.brand}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : null}
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec cmap-gap">
        <h2 className="cmap-sec__h">{t("gap.sectionTitle")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("gap.sectionLede")}</p>
        <div className="cmap-gap__grid">
          <label className="cmap-serp__field">
            <span>{t("gap.field.title")}</span>
            <input className="cmap-serp__input" value={ourCardForm.cardTitle} onChange={(e) => setOurCardForm((p) => ({ ...p, cardTitle: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.sku")}</span>
            <input className="cmap-serp__input" value={ourCardForm.skuCode} onChange={(e) => setOurCardForm((p) => ({ ...p, skuCode: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.price")}</span>
            <input className="cmap-serp__input" value={ourCardForm.priceRaw} onChange={(e) => setOurCardForm((p) => ({ ...p, priceRaw: e.target.value }))} />
          </label>
          <label className="cmap-serp__field cmap-gap__span2">
            <span>{t("gap.field.heroNote")}</span>
            <input className="cmap-serp__input" value={ourCardForm.heroImageNote} onChange={(e) => setOurCardForm((p) => ({ ...p, heroImageNote: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.visualPattern")}</span>
            <input className="cmap-serp__input" value={ourCardForm.visualPattern} onChange={(e) => setOurCardForm((p) => ({ ...p, visualPattern: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.color")}</span>
            <input className="cmap-serp__input" value={ourCardForm.colorDominance} onChange={(e) => setOurCardForm((p) => ({ ...p, colorDominance: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.model")}</span>
            <input className="cmap-serp__input" value={ourCardForm.modelPresence} onChange={(e) => setOurCardForm((p) => ({ ...p, modelPresence: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.print")}</span>
            <input className="cmap-serp__input" value={ourCardForm.printReadability} onChange={(e) => setOurCardForm((p) => ({ ...p, printReadability: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.premium")}</span>
            <input className="cmap-serp__input" value={ourCardForm.perceivedPremiumLevel} onChange={(e) => setOurCardForm((p) => ({ ...p, perceivedPremiumLevel: e.target.value }))} />
          </label>
          <label className="cmap-serp__field">
            <span>{t("gap.field.brandFit")}</span>
            <input className="cmap-serp__input" value={ourCardForm.brandFit} onChange={(e) => setOurCardForm((p) => ({ ...p, brandFit: e.target.value }))} />
          </label>
          <label className="cmap-serp__field cmap-gap__span2">
            <span>{t("gap.field.diffNote")}</span>
            <input className="cmap-serp__input" value={ourCardForm.differentiationNote} onChange={(e) => setOurCardForm((p) => ({ ...p, differentiationNote: e.target.value }))} />
          </label>
        </div>
        <div className="cmap-serp__actions cmap-serp__actions--wrap">
          <button type="button" className="ghost-btn" onClick={onAnalyzeGap} disabled={!serpEnvelope}>
            {t("gap.analyze")}
          </button>
        </div>
        {gapAnalysis ? (
          <div className="cmap-gap__out">
            <h3 className="cmap-serp__subh">{t("gap.gaps.price")}</h3>
            <p className="cmap-hip__prose">{gapAnalysis.priceGap}</p>
            <h3 className="cmap-serp__subh">{t("gap.gaps.visual")}</h3>
            <p className="cmap-hip__prose">{gapAnalysis.visualGap}</p>
            <h3 className="cmap-serp__subh">{t("gap.gaps.premium")}</h3>
            <p className="cmap-hip__prose">{gapAnalysis.premiumGap}</p>
            <h3 className="cmap-serp__subh">{t("gap.gaps.readability")}</h3>
            <p className="cmap-hip__prose">{gapAnalysis.readabilityGap}</p>
            <h3 className="cmap-serp__subh">{t("gap.gaps.diff")}</h3>
            <p className="cmap-hip__prose">{gapAnalysis.differentiationGap}</p>
            <h3 className="cmap-serp__subh">{t("gap.gaps.sat")}</h3>
            <p className="cmap-hip__prose">{gapAnalysis.saturationFit}</p>
            <h3 className="cmap-serp__subh">{t("gap.sub.strengths")}</h3>
            <ul className="cmap-mini-list">
              {gapAnalysis.advantagePoints.map((x, i) => (
                <li key={`adv-${i}`}>{x}</li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("gap.sub.weaknesses")}</h3>
            <ul className="cmap-mini-list">
              {gapAnalysis.weaknessPoints.map((x, i) => (
                <li key={`weak-${i}`}>{x}</li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("gap.sub.changes")}</h3>
            <ul className="cmap-mini-list">
              {gapAnalysis.recommendedChanges.map((x, i) => (
                <li key={`rec-${i}`}>{x}</li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("gap.sub.keep")}</h3>
            <p className="cmap-hip__prose">{t("gap.keep.no_fake_metrics")}</p>
            <h3 className="cmap-serp__subh">{t("gap.sub.risks")}</h3>
            <ul className="cmap-mini-list">
              {gapAnalysis.riskFlags.map((x, i) => (
                <li key={`risk-${i}`}>{x}</li>
              ))}
            </ul>
            <h3 className="cmap-serp__subh">{t("gap.sub.recs")}</h3>
            <ol className="cmap-mini-list">
              {gapAnalysis.nextActions.map((x, i) => (
                <li key={`next-${i}`}>{x}</li>
              ))}
            </ol>
            <div className="cmap-serp__actions cmap-serp__actions--wrap">
              <button type="button" className="ghost-btn" onClick={onGapHeroPlanFromGap}>
                {t("gap.actions.heroPlanFromGap")}
              </button>
              <button type="button" className="ghost-btn" onClick={onGapVisualJob}>
                {t("gap.actions.visualJob")}
              </button>
              <button type="button" className="ghost-btn" onClick={onGapPromptComposer}>
                {t("gap.actions.promptComposer")}
              </button>
              <button type="button" className="ghost-btn" onClick={onGapAssortmentRefresh}>
                {t("gap.actions.assortmentRefresh")}
              </button>
              <button type="button" className="ghost-btn" onClick={saveGapMemory}>
                {t("gap.saveMemory")}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {archetypeIntel && serpEnvelope ? (
        <section className="cb-lab__panel glass-panel cmap-sec cmap-ha">
          <h2 className="cmap-sec__h">{t("ha.sectionTitle")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("ha.sectionLede")}</p>
          <h3 className="cmap-serp__subh">{t("ha.sub.dominant")}</h3>
          <ul className="cmap-mini-list">
            {archetypeIntel.dominantSerpLines.map((line, i) => (
              <li key={`dom-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("ha.sub.saturation")}</h3>
          <p className="cmap-hip__prose">{archetypeIntel.saturationSummary}</p>
          <p className="cmap-hip__mono">{archetypeIntel.archetypePressureSummary}</p>
          <h3 className="cmap-serp__subh">{t("ha.sub.weak")}</h3>
          <ul className="cmap-mini-list">
            {archetypeIntel.weakArchetypeLines.map((line, i) => (
              <li key={`w-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("ha.sub.under")}</h3>
          <ul className="cmap-mini-list">
            {archetypeIntel.underrepresentedLines.map((line, i) => (
              <li key={`u-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("ha.sub.our")}</h3>
          <ul className="cmap-mini-list">
            {archetypeIntel.ourArchetypeLines.map((line, i) => (
              <li key={`o-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("ha.sub.overlap")}</h3>
          <p className="cmap-hip__prose">{archetypeIntel.overlapSummary}</p>
          <p className="cmap-hip__mono">{archetypeIntel.overlapRiskLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{archetypeIntel.differentiationOpportunityLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{archetypeIntel.premiumMismatchLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{archetypeIntel.emotionalMismatchLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{archetypeIntel.marketplaceFitLine}</p>
          <h3 className="cmap-serp__subh">{t("ha.sub.rec")}</h3>
          <p className="cmap-hip__prose">{archetypeIntel.recommendedDirectionLine}</p>
          <h3 className="cmap-serp__subh">{t("ha.sub.vokra")}</h3>
          <p className="cmap-hip__prose">{archetypeIntel.vokraPrimaryDirectionLine}</p>
          <ul className="cmap-mini-list">
            {archetypeIntel.vokraFitLines.map((line, i) => (
              <li key={`v-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("ha.sub.practical")}</h3>
          <ul className="cmap-mini-list">
            {archetypeIntel.practicalRecommendations.map((line, i) => (
              <li key={`p-${i}`}>{line}</li>
            ))}
          </ul>
          <div className="cmap-serp__actions cmap-serp__actions--wrap">
            <button type="button" className="ghost-btn" onClick={onArchHeroPrompt}>
              {t("ha.actions.heroPrompt")}
            </button>
            <button type="button" className="ghost-btn" onClick={onArchVisualJob}>
              {t("ha.actions.visualJob")}
            </button>
            <button type="button" className="ghost-btn" onClick={onArchMergeHeroPlan}>
              {t("ha.actions.heroPlanMerge")}
            </button>
            <button type="button" className="ghost-btn" onClick={onArchVisualStrategy}>
              {t("ha.actions.visualStrat")}
            </button>
            <button type="button" className="ghost-btn" onClick={onArchCollectionBuilder}>
              {t("ha.actions.collection")}
            </button>
            <button type="button" className="ghost-btn" onClick={onArchAssortment}>
              {t("ha.actions.assortment")}
            </button>
            <button type="button" className="ghost-btn" onClick={saveHeroArchetypeMemory}>
              {t("ha.saveMemory")}
            </button>
          </div>
        </section>
      ) : null}

      {readabilityIntel && serpEnvelope ? (
        <section className="cb-lab__panel glass-panel cmap-sec cmap-hr">
          <h2 className="cmap-sec__h">{t("hr.sectionTitle")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("hr.sectionLede")}</p>
          <h3 className="cmap-serp__subh">{t("hr.sub.dominant")}</h3>
          <ul className="cmap-mini-list">
            {readabilityIntel.dominantSerpReadabilityLines.map((line, i) => (
              <li key={`rdom-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("hr.sub.pressure")}</h3>
          <p className="cmap-hip__prose">{readabilityIntel.readabilityPressureSummary}</p>
          <p className="cmap-hip__mono">{readabilityIntel.visualNoisePressureLine}</p>
          <h3 className="cmap-serp__subh">{t("hr.sub.signals")}</h3>
          <p className="cmap-hip__prose cmap-ha__tight">{readabilityIntel.overloadedHeroLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{readabilityIntel.weakPrintVisibilityLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{readabilityIntel.premiumReadabilityShareLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{readabilityIntel.focalCompetitionLine}</p>
          <h3 className="cmap-serp__subh">{t("hr.sub.weak")}</h3>
          <ul className="cmap-mini-list">
            {readabilityIntel.weakReadabilityCompetitorLines.map((line, i) => (
              <li key={`rw-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("hr.sub.our")}</h3>
          <ul className="cmap-mini-list">
            {readabilityIntel.ourReadabilityLines.map((line, i) => (
              <li key={`ro-${i}`}>{line}</li>
            ))}
          </ul>
          {readabilityIntel.ourReadabilityEntity ? (
            <ul className="cmap-mini-list">
              {readabilityIntel.ourReadabilityEntity.recommendations.map((line, i) => (
                <li key={`rent-${i}`}>{line}</li>
              ))}
            </ul>
          ) : null}
          <h3 className="cmap-serp__subh">{t("hr.sub.gap")}</h3>
          <p className="cmap-hip__mono">{readabilityIntel.readabilityGapLine}</p>
          <h3 className="cmap-serp__subh">{t("hr.sub.mobile")}</h3>
          <p className="cmap-hip__prose">{readabilityIntel.mobileClarityLine}</p>
          <p className="cmap-hip__mono">{readabilityIntel.readabilityRiskLine}</p>
          {readabilityIntel.archetypeReadabilityCrossLine ? (
            <>
              <h3 className="cmap-serp__subh">{t("hr.sub.cross")}</h3>
              <p className="cmap-hip__prose">{readabilityIntel.archetypeReadabilityCrossLine}</p>
            </>
          ) : null}
          <h3 className="cmap-serp__subh">{t("hr.sub.rec")}</h3>
          <ul className="cmap-mini-list">
            {readabilityIntel.practicalRecommendations.map((line, i) => (
              <li key={`rr-${i}`}>{line}</li>
            ))}
          </ul>
          <div className="cmap-serp__actions cmap-serp__actions--wrap">
            <button type="button" className="ghost-btn" onClick={onReadHeroPrompt}>
              {t("hr.actions.heroPrompt")}
            </button>
            <button type="button" className="ghost-btn" onClick={onReadVisualJob}>
              {t("hr.actions.visualJob")}
            </button>
            <button type="button" className="ghost-btn" onClick={onReadMergeHeroPlan}>
              {t("hr.actions.heroPlanMerge")}
            </button>
            <button type="button" className="ghost-btn" onClick={onReadVisualStrategy}>
              {t("hr.actions.visualStrat")}
            </button>
            <button type="button" className="ghost-btn" onClick={onReadCollectionBuilder}>
              {t("hr.actions.collection")}
            </button>
            <button type="button" className="ghost-btn" onClick={onReadAssortment}>
              {t("hr.actions.assortment")}
            </button>
            <button type="button" className="ghost-btn" onClick={saveHeroReadabilityMemory}>
              {t("hr.saveMemory")}
            </button>
          </div>
        </section>
      ) : null}

      {fatigueIntel && serpEnvelope ? (
        <section className="cb-lab__panel glass-panel cmap-sec cmap-hf">
          <h2 className="cmap-sec__h">{t("hf.sectionTitle")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("hf.sectionLede")}</p>
          <h3 className="cmap-serp__subh">{t("hf.sub.hist")}</h3>
          <p className="cmap-hip__mono">{fatigueIntel.refreshHistoryHintLine}</p>
          <h3 className="cmap-serp__subh">{t("hf.sub.dominant")}</h3>
          <ul className="cmap-mini-list">
            {fatigueIntel.dominantFatigueLines.map((line, i) => (
              <li key={`fdom-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("hf.sub.sat")}</h3>
          <p className="cmap-hip__prose">{fatigueIntel.saturationPressureLine}</p>
          <h3 className="cmap-serp__subh">{t("hf.sub.opp")}</h3>
          <ul className="cmap-mini-list">
            {fatigueIntel.refreshOpportunityLines.map((line, i) => (
              <li key={`fopp-${i}`}>{line}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("hf.sub.our")}</h3>
          <ul className="cmap-mini-list">
            {fatigueIntel.ourFatigueLines.map((line, i) => (
              <li key={`four-${i}`}>{line}</li>
            ))}
          </ul>
          {fatigueIntel.ourFatigueEntity ? (
            <ul className="cmap-mini-list">
              {fatigueIntel.ourFatigueEntity.recommendations.map((line, i) => (
                <li key={`fent-${i}`}>{line}</li>
              ))}
            </ul>
          ) : null}
          <h3 className="cmap-serp__subh">{t("hf.sub.lifecycle")}</h3>
          <p className="cmap-hip__prose">{fatigueIntel.lifecycleStageLine}</p>
          <h3 className="cmap-serp__subh">{t("hf.sub.urgency")}</h3>
          <p className="cmap-hip__mono">{fatigueIntel.refreshUrgencyLine}</p>
          <p className="cmap-hip__prose cmap-ha__tight">{fatigueIntel.fieldVsOurFatigueLine}</p>
          <p className="cmap-hip__mono">{fatigueIntel.visualBlindnessRiskLine}</p>
          <h3 className="cmap-serp__subh">{t("hf.sub.rec")}</h3>
          <ul className="cmap-mini-list">
            {fatigueIntel.practicalRecommendations.map((line, i) => (
              <li key={`fpr-${i}`}>{line}</li>
            ))}
          </ul>
          <div className="cmap-serp__actions cmap-serp__actions--wrap">
            <button type="button" className="ghost-btn" onClick={onFatigueHeroPrompt}>
              {t("hf.actions.refreshPrompt")}
            </button>
            <button type="button" className="ghost-btn" onClick={onFatigueVisualJob}>
              {t("hf.actions.refreshJob")}
            </button>
            <button type="button" className="ghost-btn" onClick={onFatigueMergeHeroPlan}>
              {t("hf.actions.heroPlan")}
            </button>
            <button type="button" className="ghost-btn" onClick={onFatigueAssortment}>
              {t("hf.actions.assortment")}
            </button>
            <button type="button" className="ghost-btn" onClick={onFatigueMarkAssets}>
              {t("hf.actions.markAssets")}
            </button>
            <button type="button" className="ghost-btn" onClick={onFatigueVisualAssets}>
              {t("hf.actions.visualAssets")}
            </button>
            <button type="button" className="ghost-btn" onClick={saveHeroFatigueMemory}>
              {t("hf.saveMemory")}
            </button>
          </div>
        </section>
      ) : null}

      {heroPlan ? (
        <section className="cb-lab__panel glass-panel cmap-sec cmap-hip">
          <h2 className="cmap-sec__h">{t("heroPlan.sectionTitle")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("heroPlan.sectionLede")}</p>
          {!planOverride && serpEnvelope ? (
            <label className="cmap-serp__field" style={{ marginTop: 10 }}>
              <span>{t("heroPlan.corridorLabel")}</span>
              <input
                className="cmap-serp__input"
                value={heroCorridorDraft}
                onChange={(e) => setHeroCorridorDraft(e.target.value)}
              />
            </label>
          ) : (
            <p className="cmap-hip__meta">
              {t("heroPlan.corridorLabel")}: <strong>{heroPlan.corridor}</strong>
            </p>
          )}
          <h3 className="cmap-serp__subh">{t("heroPlan.field.summary")}</h3>
          <p className="cmap-hip__prose">{heroPlan.competitorSummary}</p>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.weaknesses")}</h3>
          <ul className="cmap-mini-list">
            {heroPlan.visualWeaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.diff")}</h3>
          <p className="cmap-hip__prose">{heroPlan.differentiationOpportunity}</p>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.direction")}</h3>
          <p className="cmap-hip__prose">{heroPlan.recommendedHeroDirection}</p>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.constraints")}</h3>
          <ul className="cmap-mini-list">
            {heroPlan.marketplaceConstraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.promptDir")}</h3>
          <p className="cmap-hip__mono">{heroPlan.promptDirection}</p>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.avoid")}</h3>
          <p className="cmap-hip__mono">{heroPlan.negativeConstraints}</p>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.risks")}</h3>
          <ul className="cmap-mini-list">
            {heroPlan.riskFlags.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.effect")}</h3>
          <p className="cmap-hip__prose">{heroPlan.expectedEffect}</p>
          <h3 className="cmap-serp__subh">{t("heroPlan.field.next")}</h3>
          <ol className="cmap-mini-list">
            {heroPlan.nextActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
          <div className="cmap-serp__actions cmap-serp__actions--wrap">
            <button type="button" className="ghost-btn" onClick={onCreateHeroPrompt}>
              {t("heroPlan.createHeroPrompt")}
            </button>
            <button type="button" className="ghost-btn" onClick={onCreateVisualJob}>
              {t("heroPlan.createVisualJob")}
            </button>
            <button type="button" className="ghost-btn" onClick={saveHeroPlanMemory}>
              {t("heroPlan.saveMemory")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="cb-lab__panel glass-panel cmap-sec">
        <h2 className="cmap-sec__h">{t("cmap.section.clusters")}</h2>
        <ul className="cmap-cluster-list">
          {foundation.clusters.map((c) => (
            <li key={c.id} className="cmap-cluster-card">
              <p className="cmap-cluster-card__title">{c.query}</p>
              <p className="cmap-cluster-card__meta">
                {c.corridor} · {c.marketplace} · {t(`cmap.clusterType.${c.clusterType}`)}
              </p>
              {pctBar(t("cmap.k.heroDensity"), c.heroDensity)}
              {pctBar(t("cmap.k.overlapRisk"), c.overlapRisk)}
              {pctBar(t("cmap.k.saturation"), c.saturationLevel)}
              {pctBar(t("cmap.k.visualPressure"), c.visualPressure)}
              {pctBar(t("cmap.k.estimatedCompetition"), c.estimatedCompetition)}
              <p className="cmap-cluster-card__sub">{t("cmap.k.patterns")}</p>
              <p className="cmap-cluster-card__mono">{c.heroPatterns.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec">
        <h2 className="cmap-sec__h">{t("cmap.section.corridors")}</h2>
        <ul className="cmap-cc-list">
          {foundation.competitorCorridors.map((cc) => (
            <li key={cc.id} className="cmap-cc-card">
              <p className="cmap-cc-card__title">{cc.corridor}</p>
              <p className="cmap-cc-card__meta">
                {cc.marketplace} · {cc.visualStyle} · {cc.heroApproach}
              </p>
              {pctBar(t("cmap.k.saturationRisk"), cc.saturationRisk)}
              {pctBar(t("cmap.k.overlapRisk"), cc.overlapRisk)}
              {pctBar(t("cmap.k.pressureLevel"), cc.pressureLevel)}
              <p className="cmap-cc-card__gap">{t(cc.differentiationGap)}</p>
              <p className="cmap-cc-card__sub">{t("cmap.k.relatedClusters")}</p>
              <p className="cmap-cc-card__mono">{cc.relatedClusters.length ? cc.relatedClusters.join(", ") : "—"}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec">
        <h2 className="cmap-sec__h">{t("cmap.section.pressure")}</h2>
        {foundation.pressure.length === 0 ? (
          <p className="cb-lab__prose">{t("cmap.pressureEmpty")}</p>
        ) : (
          <ul className="cmap-pressure-list">
            {foundation.pressure.map((p) => (
              <li key={p.id}>
                <span className="cmap-pressure-sev">{p.severity}</span> {t(p.messageKey, p.vars)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec cmap-sec--grid">
        <div>
          <h2 className="cmap-sec__h">{t("cmap.section.saturation")}</h2>
          <ul className="cmap-mini-list">
            {foundation.clusters.map((c) => (
              <li key={`sat-${c.id}`}>
                <strong>{c.corridor}</strong> — {foundation.saturationByClusterId[c.id] ?? c.saturationLevel}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="cmap-sec__h">{t("cmap.section.overlap")}</h2>
          {foundation.overlap.length === 0 ? (
            <p className="cb-lab__prose">{t("cmap.overlapEmpty")}</p>
          ) : (
            <ul className="cmap-mini-list">
              {foundation.overlap.slice(0, 12).map((e) => {
                const a = clusterById.get(e.aId);
                const b = clusterById.get(e.bId);
                return (
                  <li key={`${e.aId}-${e.bId}`}>
                    {(a?.query ?? e.aId).slice(0, 48)} ↔ {(b?.query ?? e.bId).slice(0, 48)} — {e.risk}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec">
        <h2 className="cmap-sec__h">{t("cmap.section.diff")}</h2>
        <ul className="cmap-mini-list">
          {foundation.differentiationNoteKeys.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel cmap-sec">
        <h2 className="cmap-sec__h">{t("cmap.section.pockets")}</h2>
        {weakPockets.length === 0 ? (
          <p className="cb-lab__prose">{t("cmap.pocketsEmpty")}</p>
        ) : (
          <ul className="cmap-mini-list">
            {weakPockets.map((c) => (
              <li key={`wp-${c.id}`}>
                <strong>{c.corridor}</strong> — {t("cmap.pocketLine", { score: String(c.estimatedCompetition) })}
              </li>
            ))}
          </ul>
        )}
      </section>

      <style>{`
        .cmap-lab .cmap-sec {
          margin-top: 16px;
        }
        .cmap-sec__h {
          margin: 0 0 12px;
          font-size: 0.95rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .cmap-sec--grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 900px) {
          .cmap-sec--grid {
            grid-template-columns: 1fr;
          }
        }
        .cmap-pill {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 99px;
          border: 1px solid var(--stroke);
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .cmap-hint-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cmap-hint-btn {
          text-align: left;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--stroke);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text);
          cursor: pointer;
          font-size: 0.82rem;
        }
        .cmap-hint-btn:hover {
          border-color: rgba(255, 255, 255, 0.22);
        }
        .cmap-cluster-list,
        .cmap-cc-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }
        .cmap-cluster-card,
        .cmap-cc-card {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.2);
        }
        .cmap-cluster-card__title,
        .cmap-cc-card__title {
          margin: 0 0 6px;
          font-weight: 600;
        }
        .cmap-cluster-card__meta,
        .cmap-cc-card__meta {
          margin: 0 0 10px;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .cmap-cluster-card__sub,
        .cmap-cc-card__sub {
          margin: 10px 0 4px;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .cmap-cluster-card__mono,
        .cmap-cc-card__mono {
          margin: 0;
          font-size: 0.78rem;
          word-break: break-word;
        }
        .cmap-cc-card__gap {
          margin: 8px 0 0;
          font-size: 0.85rem;
          color: rgba(180, 220, 255, 0.95);
        }
        .cmap-strip {
          margin-bottom: 6px;
        }
        .cmap-strip__lab {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--muted);
          margin-bottom: 2px;
        }
        .cmap-strip__track {
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .cmap-strip__fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, rgba(120, 200, 255, 0.5), rgba(200, 160, 255, 0.75));
        }
        .cmap-pressure-list,
        .cmap-mini-list {
          margin: 0;
          padding-left: 1.1rem;
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .cmap-pressure-sev {
          display: inline-block;
          min-width: 2rem;
          font-variant-numeric: tabular-nums;
          color: var(--muted);
        }
        .cmap-serp__row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
        }
        .cmap-serp__field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.78rem;
          color: var(--muted);
          min-width: 160px;
          flex: 1;
        }
        .cmap-serp__input {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.25);
          color: var(--text);
        }
        .cmap-serp__modes {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .cmap-serp .ghost-btn--on {
          border-color: rgba(140, 200, 255, 0.55);
          color: rgba(200, 230, 255, 0.95);
        }
        .cmap-serp__hint {
          margin-top: 8px;
          font-size: 0.8rem;
        }
        .cmap-serp__block {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .cmap-serp__ta {
          width: 100%;
          min-height: 140px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.28);
          color: var(--text);
          font-family: ui-monospace, monospace;
          font-size: 0.8rem;
        }
        .cmap-serp__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .cmap-serp__actions--wrap {
          margin-top: 10px;
        }
        .cmap-serp__out {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--stroke);
        }
        .cmap-serp__subh {
          margin: 14px 0 8px;
          font-size: 0.88rem;
        }
        .cmap-serp__subh2 {
          margin: 10px 0 4px;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .cmap-serp__line {
          margin: 0 0 8px;
          font-size: 0.88rem;
        }
        .cmap-serp__details {
          margin-top: 12px;
        }
        .cmap-serp__details summary {
          cursor: pointer;
          color: var(--muted);
          font-size: 0.85rem;
        }
        .cmap-hip__prose {
          margin: 0 0 10px;
          font-size: 0.88rem;
          line-height: 1.45;
          color: var(--text);
        }
        .cmap-hip__mono {
          margin: 0 0 10px;
          font-size: 0.82rem;
          line-height: 1.4;
          font-family: ui-monospace, monospace;
          color: rgba(220, 230, 245, 0.92);
          white-space: pre-wrap;
        }
        .cmap-hip__meta {
          margin: 0 0 12px;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .cmap-hip__list {
          margin: 0 0 10px 1rem;
          padding: 0;
          font-size: 0.86rem;
          line-height: 1.4;
        }
        .cmap-hip__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }
        .cmap-gap__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .cmap-gap__span2 {
          grid-column: span 2;
        }
        @media (max-width: 720px) {
          .cmap-gap__span2 {
            grid-column: span 1;
          }
        }
        .cmap-gap__out {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--stroke);
        }
        .cmap-ha__tight {
          margin: 4px 0;
          font-size: 0.84rem;
        }
      `}</style>
    </div>
  );
}
