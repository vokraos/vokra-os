import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import type { MemoryAssetFilter, GenerationRecord } from "../lib/memory";
import {
  createProject,
  createSku,
  deleteGeneration,
  deleteProject,
  deleteSku,
  deleteVisualAnalysis,
  duplicateGeneration,
  exportGenerationJsonRecord,
  exportGenerationMarkdown,
  exportGenerationPlain,
  exportVisualAnalysisJson,
  getGeneration,
  getProject,
  getProjectTimeline,
  getVisualAnalysis,
  listProjectSummaries,
  listSkusForProject,
  moduleNavTarget,
  renameProject,
  scheduleRerunFromGeneration,
  scheduleRerunFromVisual,
  searchProjects,
  setActiveProjectId,
  updateProject,
  useMemorySnapshot,
} from "../lib/memory";
import { useI18n } from "../lib/i18n/I18nContext";
import { MemoryQuickActions } from "../components/memory/MemoryQuickActions";
import { parsePromptPackEntity, savePromptPackToSession } from "../lib/prompt-pack";
import { parseVisualProductionQueueEnvelope, saveVisualProductionQueueToSession } from "../lib/visual-production";
import { parseVisualAssetRegistryEnvelope, saveVisualAssetRegistryToSession, consumeMemoryPrefilter } from "../lib/visual-assets";
import { parseCardProductionBoardEnvelope, saveCardProductionBoardToSession } from "../lib/card-production";
import { mergeWavePatchesFromMemory, parseMarketplaceOperationsMemoryPayload } from "../lib/marketplace-operations";
import { parseSkuIntelligenceMemoryPayload } from "../lib/sku-intelligence";
import { parseMarketIngestionMemoryPayload } from "../lib/market-ingestion";
import { parseDataImportMemoryPayload } from "../lib/import-core";
import { parseEntityFusionMemoryPayload } from "../lib/entity-fusion";
import { parseEntitySnapshotPayload, restoreEnrichedSnapshotFromCleanupPayload, saveActiveEntitySnapshot } from "../lib/entity-snapshot";
import {
  bulkSetAssortmentStatuses,
  mergeAssortmentChecklistFromMemory,
  mergeLearningSignalsFromMemory,
  parseAssortmentActionsMemoryPayload,
} from "../lib/assortment-actions";
import {
  parseCompetitiveMapMemoryPayload,
  saveCompetitiveMapMemoryToSession,
} from "../lib/search-clusters";
import { parseCompetitorSerpMemoryPayload, saveCompetitorSerpToSession } from "../lib/competitor-serp";
import { parseHeroImprovementPlanMemoryPayload, primeSessionsFromHeroPlanMemoryPayload } from "../lib/hero-improvement-plan";
import {
  parseCompetitiveGapAnalysisMemoryPayload,
  primeSessionsFromGapMemoryPayload,
} from "../lib/competitive-gap";
import {
  parseHeroArchetypeIntelligenceMemoryPayload,
  primeSessionsFromHeroArchetypeMemoryPayload,
} from "../lib/hero-archetypes";
import {
  parseHeroReadabilityIntelligenceMemoryPayload,
  primeSessionsFromHeroReadabilityMemoryPayload,
} from "../lib/hero-readability";
import {
  parseHeroFatigueIntelligenceMemoryPayload,
  primeSessionsFromHeroFatigueMemoryPayload,
} from "../lib/hero-fatigue";
import {
  parseHeroBattlePlanMemoryPayload,
  primeSessionsFromHeroBattlePlanMemoryPayload,
} from "../lib/hero-battle-plan";
import {
  parseHeroTestMatrixMemoryPayload,
  primeSessionsFromHeroTestMatrixMemoryPayload,
  primeSessionsFromHeroTestResultsMemoryPayload,
  primeSessionsFromHeroLaunchPackageMemoryPayload,
  primeSessionsFromHeroPostLaunchObservationMemoryPayload,
} from "../lib/hero-test-matrix";
import { parseHeroTestResultsMemoryPayload } from "../lib/hero-test-results";
import { parseHeroPostLaunchObservationMemoryPayload } from "../lib/hero-post-launch-observation";
import { parseHeroLaunchPackageMemoryPayload } from "../lib/hero-launch-package";
import { parseHeroCommandMemoryPayload, primeSessionsFromHeroCommandMemoryPayload } from "../lib/hero-command";
import { bulkMergeHeroExecutionActions } from "../lib/hero-assortment-bridge";
import { bulkMergeCollectionExecutionActions } from "../lib/collection-assortment-bridge";
import {
  bulkMergeLaunchExecutionActions,
  parseLaunchOpsMemoryPayload,
  parseLaunchReviewMemoryPayload,
  primeSessionsFromLaunchOpsMemoryPayload,
  primeSessionsFromLaunchReviewMemoryPayload,
  saveLaunchReview,
} from "../lib/launch-ops";
import {
  parseFounderBriefMemoryPayload,
  saveLastFounderBrief,
} from "../lib/founder-brief";
import {
  parseEconomicPressureMemoryPayload,
  primeSessionsFromEconomicPressureMemoryPayload,
} from "../lib/economic-pressure";
import {
  parseUnitEconomicsMemoryPayload,
  primeSessionsFromUnitEconomicsMemoryPayload,
} from "../lib/unit-economics";
import { parseAdPressureMemoryPayload, primeSessionsFromAdPressureMemoryPayload } from "../lib/ad-pressure";
import {
  parseOsHealthAuditMemoryPayload,
  primeSessionsFromOsHealthAuditMemoryPayload,
} from "../lib/os-health-audit";
import {
  parseReleaseChecklistMemoryPayload,
  queueReleaseChecklistRestore,
} from "../lib/release-checklist";
import {
  parseDailyOperationsPilotPayload,
  queueDailyPilotRestore,
} from "../lib/daily-operations-pilot";
import {
  parseDailyPilotDebriefPayload,
  queueDailyPilotDebriefRestore,
} from "../lib/daily-pilot-debrief";
import {
  parseSimplificationBacklogPayload,
  queueSimplificationBacklogRestore,
} from "../lib/simplification-backlog";
import { applyCleanDayModeRestorePayload } from "../lib/clean-day-mode";
import {
  parseGuidedSetupMemoryPayload,
  primeSessionsFromGuidedSetupMemoryPayload,
} from "../lib/guided-setup";
import {
  mergeOperatorOverlayFromMemory,
  parseOperatorBriefMemoryPayload,
  primeSessionsFromOperatorBriefMemoryPayload,
} from "../lib/operator-brief";
import {
  mergeExecutionFeedbackOverlayFromMemory,
  parseExecutionFeedbackMemoryPayload,
  primeSessionsFromExecutionFeedbackMemoryPayload,
} from "../lib/execution-feedback";
import {
  parseControlTowerMemoryPayload,
  primeSessionsFromControlTowerMemoryPayload,
} from "../lib/strategic-control-tower";
import {
  parseMarketTimingMemoryPayload,
  primeSessionsFromMarketTimingMemoryPayload,
} from "../lib/market-timing";
import {
  parseCorridorStrategyMemoryPayload,
  primeSessionsFromCorridorStrategyMemoryPayload,
} from "../lib/corridor-strategy";
import { parseFboFbsDecisionMemoryPayload, primeSessionsFromFboFbsDecisionMemoryPayload } from "../lib/fbo-fbs-decision";
import { parseScalingSafetyMemoryPayload, primeSessionsFromScalingSafetyMemoryPayload } from "../lib/scaling-safety";
import {
  parseProductionDailyPlanMemoryPayload,
  parseProductionPressureMemoryPayload,
  parseProductionShiftFeedbackMemoryPayload,
  primeSessionsFromProductionDailyPlanMemoryPayload,
  primeSessionsFromProductionPressureMemoryPayload,
  primeSessionsFromProductionShiftFeedbackMemoryPayload,
} from "../lib/production-pressure";
import {
  parseDailyWarRoomMemoryPayload,
  primeSessionsFromDailyWarRoomMemoryPayload,
} from "../lib/daily-war-room";
import {
  parseMorningFlowMemoryPayload,
  primeSessionsFromMorningFlowMemoryPayload,
} from "../lib/morning-operating-flow";
import {
  parseEveningCloseMemoryPayload,
  primeSessionsFromEveningCloseMemoryPayload,
} from "../lib/evening-close";
import {
  parseRealUseTestMemoryPayload,
  primeSessionsFromRealUseTestMemoryPayload,
} from "../lib/real-use-smoke-test";
import {
  parseIntegrationReadinessMemoryPayload,
  primeSessionsFromIntegrationReadinessMemoryPayload,
} from "../lib/marketplace-integration-prep";
import { scheduleWarmupAfterMemoryReopen } from "../lib/os-report-warmup";
import { queueRuntimeSmokeReportRestore } from "../lib/runtime-smoke-tests";

const FILTER_DEF: { id: MemoryAssetFilter; labelKey: string }[] = [
  { id: "all", labelKey: "memory.filterAll" },
  { id: "visual", labelKey: "memory.filterVisual" },
  { id: "seo", labelKey: "memory.filterSeo" },
  { id: "rich", labelKey: "memory.filterRich" },
  { id: "prompt_pack", labelKey: "memory.filterPromptPack" },
  { id: "visual_production", labelKey: "memory.filterVisualProduction" },
  { id: "visual_asset_registry", labelKey: "memory.filterVisualAssets" },
  { id: "card_production", labelKey: "memory.filterCardProduction" },
  { id: "marketplace_operations", labelKey: "memory.filterMarketplaceOperations" },
  { id: "sku_intelligence", labelKey: "memory.filterSkuIntelligence" },
  { id: "market_ingestion", labelKey: "memory.filterMarketIngestion" },
  { id: "data_import", labelKey: "memory.filterDataImport" },
  { id: "entity_fusion", labelKey: "memory.filterEntityFusion" },
  { id: "entity_snapshot", labelKey: "memory.filterEntitySnapshot" },
  { id: "data_cleanup", labelKey: "memory.filterDataCleanup" },
  { id: "assortment_actions", labelKey: "memory.filterAssortmentActions" },
  { id: "competitive_map", labelKey: "memory.filterCompetitiveMap" },
  { id: "competitor_serp", labelKey: "memory.filterCompetitorSerp" },
  { id: "hero_improvement_plan", labelKey: "memory.filterHeroImprovementPlan" },
  { id: "competitive_gap_analysis", labelKey: "memory.filterCompetitiveGapAnalysis" },
  { id: "hero_archetype_intelligence", labelKey: "memory.filterHeroArchetypeIntelligence" },
  { id: "hero_readability_intelligence", labelKey: "memory.filterHeroReadabilityIntelligence" },
  { id: "hero_fatigue_intelligence", labelKey: "memory.filterHeroFatigueIntelligence" },
  { id: "hero_battle_plan", labelKey: "memory.filterHeroBattlePlan" },
  { id: "hero_test_matrix", labelKey: "memory.filterHeroTestMatrix" },
  { id: "hero_test_results", labelKey: "memory.filterHeroTestResults" },
  { id: "hero_launch_package", labelKey: "memory.filterHeroLaunchPackage" },
  { id: "hero_post_launch_observation", labelKey: "memory.filterHeroPostLaunchObservation" },
  { id: "hero_command", labelKey: "memory.filterHeroCommand" },
  { id: "launch_operations", labelKey: "memory.filterLaunchOperations" },
  { id: "launch_review", labelKey: "memory.filterLaunchReview" },
  { id: "founder_brief", labelKey: "memory.filterFounderBrief" },
  { id: "daily_war_room", labelKey: "memory.filterDailyWarRoom" },
  { id: "morning_flow", labelKey: "memory.filterMorningFlow" },
  { id: "evening_close", labelKey: "memory.filterEveningClose" },
  { id: "real_use_test", labelKey: "memory.filterRealUseTest" },
  { id: "integration_readiness", labelKey: "memory.filterIntegrationReadiness" },
  { id: "economic_pressure", labelKey: "memory.filterEconomicPressure" },
  { id: "unit_economics", labelKey: "memory.filterUnitEconomics" },
  { id: "advertising_pressure", labelKey: "memory.filterAdvertisingPressure" },
  { id: "scaling_safety", labelKey: "memory.filterScalingSafety" },
  { id: "production_pressure", labelKey: "memory.filterProductionPressure" },
  { id: "fbo_fbs_decision", labelKey: "memory.filterFboFbsDecision" },
  { id: "corridor_strategy", labelKey: "memory.filterCorridorStrategy" },
  { id: "market_timing", labelKey: "memory.filterMarketTiming" },
  { id: "control_tower", labelKey: "memory.filterControlTower" },
  { id: "os_health_audit", labelKey: "memory.filterOsHealthAudit" },
  { id: "guided_setup", labelKey: "memory.filterGuidedSetup" },
    { id: "runtime_smoke_test", labelKey: "memory.filterRuntimeSmokeTest" },
    { id: "release_check", labelKey: "memory.filterReleaseCheck" },
    { id: "daily_operations_pilot", labelKey: "memory.filterDailyPilot" },
    { id: "daily_pilot_debrief", labelKey: "memory.filterPilotDebrief" },
    { id: "simplification_backlog", labelKey: "memory.filterSimplificationBacklog" },
    { id: "clean_day_mode", labelKey: "memory.filterCleanDay" },
    { id: "operator_brief", labelKey: "memory.filterOperatorBrief" },
  { id: "execution_feedback", labelKey: "memory.filterExecutionFeedback" },
  { id: "reels", labelKey: "memory.filterReels" },
  { id: "campaign", labelKey: "memory.filterCampaign" },
  { id: "competitor_analysis", labelKey: "memory.filterCompetitor" },
  { id: "trend_radar", labelKey: "memory.filterTrends" },
  { id: "strategic_command", labelKey: "memory.filterCommand" },
  { id: "temporal_strategy", labelKey: "memory.filterTemporal" },
  { id: "execution_planner", labelKey: "memory.filterExecutionPlanner" },
  { id: "execution_orchestrator", labelKey: "memory.filterOrchestrator" },
  { id: "action_command", labelKey: "memory.filterActionCommand" },
  { id: "feedback_loop", labelKey: "memory.filterFeedbackLoop" },
  { id: "brand_evolution", labelKey: "memory.filterBrandEvolution" },
  { id: "executive_intelligence", labelKey: "memory.filterExecutiveIntelligence" },
  { id: "organism_model", labelKey: "memory.filterOrganismModel" },
  { id: "strategy_evolution", labelKey: "memory.filterStrategyEvolution" },
  { id: "collection_builder", labelKey: "memory.filterCollectionBuilder" },
  { id: "visual_strategy", labelKey: "memory.filterVisualStrategy" },
  { id: "prompt_composer", labelKey: "memory.filterPromptComposer" },
];

function parseTags(s: string): string[] {
  return s
    .split(/[,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

type Props = {
  onNavigate: (id: NavId) => void;
};

export function ProjectMemoryView({ onNavigate }: Props) {
  const { t } = useI18n();
  const snap = useMemorySnapshot();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<MemoryAssetFilter>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [descInput, setDescInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [skuName, setSkuName] = useState("");
  const [skuMarket, setSkuMarket] = useState("");
  const [skuCat, setSkuCat] = useState("");
  const [detail, setDetail] = useState<{ kind: "generation" | "visual"; id: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = consumeMemoryPrefilter();
    if (!raw) return;
    if (FILTER_DEF.some((f) => f.id === raw)) setFilter(raw as MemoryAssetFilter);
  }, []);

  const summaries = useMemo(() => {
    const all = listProjectSummaries();
    const q = searchQuery.trim();
    if (!q) return all;
    const hit = new Set(searchProjects(q));
    return all.filter((s) => hit.has(s.id));
  }, [snap, searchQuery]);

  useEffect(() => {
    if (summaries.length === 0) {
      setSelectedProjectId(null);
      return;
    }
    if (!selectedProjectId || !summaries.some((s) => s.id === selectedProjectId)) {
      setSelectedProjectId(summaries[0]!.id);
    }
  }, [summaries, selectedProjectId]);

  const selected = useMemo(
    () => summaries.find((s) => s.id === selectedProjectId) ?? null,
    [summaries, selectedProjectId],
  );

  useEffect(() => {
    const p = selectedProjectId ? getProject(selectedProjectId) : undefined;
    if (!p) return;
    setDescInput(p.description);
    setTagInput(p.tags.join(", "));
    setRenameDraft(p.title);
  }, [selectedProjectId, snap]);

  const timeline = useMemo(
    () => (selectedProjectId ? getProjectTimeline(selectedProjectId, filter) : []),
    [selectedProjectId, filter, snap],
  );

  const skus = useMemo(() => (selectedProjectId ? listSkusForProject(selectedProjectId) : []), [selectedProjectId, snap]);

  const detailGen = detail?.kind === "generation" ? getGeneration(detail.id) : undefined;
  const detailVis = detail?.kind === "visual" ? getVisualAnalysis(detail.id) : undefined;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const reopenGenerationFromMemory = useCallback(
    (g: GenerationRecord) => {
      if (g.module === "prompt_pack") {
        const entity = parsePromptPackEntity(g.content);
        if (entity) {
          savePromptPackToSession(entity, "project_memory");
          onNavigate("promptPack");
          showToast(t("memory.reopenPromptPackOk"));
        } else {
          showToast(t("memory.reopenPromptPackFail"));
        }
        return;
      }
      if (g.module === "visual_production") {
        const env = parseVisualProductionQueueEnvelope(g.content);
        if (env) {
          saveVisualProductionQueueToSession(env);
          onNavigate("visualProduction");
          showToast(t("memory.reopenVisualProductionOk"));
        } else {
          showToast(t("memory.reopenVisualProductionFail"));
        }
        return;
      }
      if (g.module === "visual_asset_registry") {
        const reg = parseVisualAssetRegistryEnvelope(g.content);
        if (reg) {
          saveVisualAssetRegistryToSession(reg);
          onNavigate("visualAssets");
          showToast(t("memory.reopenVisualAssetRegistryOk"));
        } else {
          showToast(t("memory.reopenVisualAssetRegistryFail"));
        }
        return;
      }
      if (g.module === "card_production") {
        const board = parseCardProductionBoardEnvelope(g.content);
        if (board) {
          saveCardProductionBoardToSession(board);
          onNavigate("cardProduction");
          showToast(t("memory.reopenCardProductionOk"));
        } else {
          showToast(t("memory.reopenCardProductionFail"));
        }
        return;
      }
      if (g.module === "marketplace_operations") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenMarketplaceOperationsFail"));
            return;
          }
        }
        const payload = parseMarketplaceOperationsMemoryPayload(raw);
        if (payload) {
          mergeWavePatchesFromMemory(payload.wavePatches);
          onNavigate("marketplaceOperations");
          showToast(t("memory.reopenMarketplaceOperationsOk"));
        } else {
          showToast(t("memory.reopenMarketplaceOperationsFail"));
        }
        return;
      }
      if (g.module === "sku_intelligence") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenSkuIntelligenceFail"));
            return;
          }
        }
        const payload = parseSkuIntelligenceMemoryPayload(raw);
        if (payload) {
          onNavigate("skuIntelligence");
          showToast(t("memory.reopenSkuIntelligenceOk"));
        } else {
          showToast(t("memory.reopenSkuIntelligenceFail"));
        }
        return;
      }
      if (g.module === "competitive_map") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseCompetitiveMapMemoryPayload(rawStr);
        if (payload) {
          saveCompetitiveMapMemoryToSession(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenCompetitiveMapOk"));
        } else {
          showToast(t("memory.reopenCompetitiveMapFail"));
        }
        return;
      }
      if (g.module === "competitor_serp") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseCompetitorSerpMemoryPayload(rawStr);
        if (payload) {
          saveCompetitorSerpToSession(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenCompetitorSerpOk"));
        } else {
          showToast(t("memory.reopenCompetitorSerpFail"));
        }
        return;
      }
      if (g.module === "hero_improvement_plan") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroImprovementPlanMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroPlanMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroImprovementPlanOk"));
        } else {
          showToast(t("memory.reopenHeroImprovementPlanFail"));
        }
        return;
      }
      if (g.module === "competitive_gap_analysis") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseCompetitiveGapAnalysisMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromGapMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenCompetitiveGapAnalysisOk"));
        } else {
          showToast(t("memory.reopenCompetitiveGapAnalysisFail"));
        }
        return;
      }
      if (g.module === "hero_archetype_intelligence") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroArchetypeIntelligenceMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroArchetypeMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroArchetypeIntelligenceOk"));
        } else {
          showToast(t("memory.reopenHeroArchetypeIntelligenceFail"));
        }
        return;
      }
      if (g.module === "hero_readability_intelligence") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroReadabilityIntelligenceMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroReadabilityMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroReadabilityIntelligenceOk"));
        } else {
          showToast(t("memory.reopenHeroReadabilityIntelligenceFail"));
        }
        return;
      }
      if (g.module === "hero_fatigue_intelligence") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroFatigueIntelligenceMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroFatigueMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroFatigueIntelligenceOk"));
        } else {
          showToast(t("memory.reopenHeroFatigueIntelligenceFail"));
        }
        return;
      }
      if (g.module === "hero_battle_plan") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroBattlePlanMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroBattlePlanMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroBattlePlanOk"));
        } else {
          showToast(t("memory.reopenHeroBattlePlanFail"));
        }
        return;
      }
      if (g.module === "hero_test_matrix") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroTestMatrixMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroTestMatrixMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroTestMatrixOk"));
        } else {
          showToast(t("memory.reopenHeroTestMatrixFail"));
        }
        return;
      }
      if (g.module === "hero_test_results") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroTestResultsMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroTestResultsMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroTestResultsOk"));
        } else {
          showToast(t("memory.reopenHeroTestResultsFail"));
        }
        return;
      }
      if (g.module === "hero_launch_package") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroLaunchPackageMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroLaunchPackageMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroLaunchPackageOk"));
        } else {
          showToast(t("memory.reopenHeroLaunchPackageFail"));
        }
        return;
      }
      if (g.module === "hero_post_launch_observation") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroPostLaunchObservationMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroPostLaunchObservationMemoryPayload(payload);
          onNavigate("competitiveMap");
          showToast(t("memory.reopenHeroPostLaunchObservationOk"));
        } else {
          showToast(t("memory.reopenHeroPostLaunchObservationFail"));
        }
        return;
      }
      if (g.module === "hero_command") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseHeroCommandMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromHeroCommandMemoryPayload(payload);
          onNavigate("heroCommand");
          showToast(t("memory.reopenHeroCommandOk"));
        } else {
          showToast(t("memory.reopenHeroCommandFail"));
        }
        return;
      }
      if (g.module === "launch_operations") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseLaunchOpsMemoryPayload(rawStr);
        if (payload) {
          if (payload.review) saveLaunchReview(payload.review);
          primeSessionsFromLaunchOpsMemoryPayload(payload);
          onNavigate("launchOperations");
          showToast(t("memory.reopenLaunchOperationsOk"));
        } else {
          showToast(t("memory.reopenLaunchOperationsFail"));
        }
        return;
      }
      if (g.module === "launch_review") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseLaunchReviewMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromLaunchReviewMemoryPayload(payload);
          onNavigate("launchOperations");
          showToast(t("memory.reopenLaunchReviewOk"));
        } else {
          showToast(t("memory.reopenLaunchReviewFail"));
        }
        return;
      }
      if (g.module === "founder_brief") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseFounderBriefMemoryPayload(rawStr);
        if (payload) {
          saveLastFounderBrief(payload.brief);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("founderBrief");
          showToast(t("memory.reopenFounderBriefOk"));
        } else {
          showToast(t("memory.reopenFounderBriefFail"));
        }
        return;
      }
      if (g.module === "economic_pressure") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseEconomicPressureMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromEconomicPressureMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("economicPressure");
          showToast(t("memory.reopenEconomicPressureOk"));
        } else {
          showToast(t("memory.reopenEconomicPressureFail"));
        }
        return;
      }
      if (g.module === "unit_economics") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseUnitEconomicsMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromUnitEconomicsMemoryPayload(payload);
          onNavigate("unitEconomics");
          showToast(t("memory.reopenUnitEconomicsOk"));
        } else {
          showToast(t("memory.reopenUnitEconomicsFail"));
        }
        return;
      }
      if (g.module === "advertising_pressure") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseAdPressureMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromAdPressureMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("advertisingPressure");
          showToast(t("memory.reopenAdvertisingPressureOk"));
        } else {
          showToast(t("memory.reopenAdvertisingPressureFail"));
        }
        return;
      }
      if (g.module === "scaling_safety") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseScalingSafetyMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromScalingSafetyMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("scalingSafety");
          showToast(t("memory.reopenScalingSafetyOk"));
        } else {
          showToast(t("memory.reopenScalingSafetyFail"));
        }
        return;
      }
      if (g.module === "production_pressure") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseProductionPressureMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromProductionPressureMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("productionPressure");
          showToast(t("memory.reopenProductionPressureOk"));
        } else {
          showToast(t("memory.reopenProductionPressureFail"));
        }
        return;
      }
      if (g.module === "production_daily_plan") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseProductionDailyPlanMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromProductionDailyPlanMemoryPayload(payload);
          onNavigate("productionPressure");
          showToast(t("memory.reopenProductionDailyPlanOk"));
        } else {
          showToast(t("memory.reopenProductionDailyPlanFail"));
        }
        return;
      }
      if (g.module === "production_shift_feedback") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseProductionShiftFeedbackMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromProductionShiftFeedbackMemoryPayload(payload);
          onNavigate("productionPressure");
          showToast(t("memory.reopenProductionShiftFeedbackOk"));
        } else {
          showToast(t("memory.reopenProductionShiftFeedbackFail"));
        }
        return;
      }
      if (g.module === "daily_war_room") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseDailyWarRoomMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromDailyWarRoomMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("warRoom");
          showToast(t("memory.reopenDailyWarRoomOk"));
        } else {
          showToast(t("memory.reopenDailyWarRoomFail"));
        }
        return;
      }
      if (g.module === "morning_flow") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseMorningFlowMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromMorningFlowMemoryPayload(payload);
          onNavigate("morningStart");
          showToast(t("memory.reopenMorningFlowOk"));
        } else {
          showToast(t("memory.reopenMorningFlowFail"));
        }
        return;
      }
      if (g.module === "evening_close") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseEveningCloseMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromEveningCloseMemoryPayload(payload);
          onNavigate("eveningClose");
          showToast(t("memory.reopenEveningCloseOk"));
        } else {
          showToast(t("memory.reopenEveningCloseFail"));
        }
        return;
      }
      if (g.module === "real_use_test") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseRealUseTestMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromRealUseTestMemoryPayload(payload);
          onNavigate("realUseTest");
          showToast(t("memory.reopenRealUseTestOk"));
        } else {
          showToast(t("memory.reopenRealUseTestFail"));
        }
        return;
      }
      if (g.module === "integration_readiness") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseIntegrationReadinessMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromIntegrationReadinessMemoryPayload(payload);
          onNavigate("integrationReadiness");
          showToast(t("memory.reopenIntegrationReadinessOk"));
        } else {
          showToast(t("memory.reopenIntegrationReadinessFail"));
        }
        return;
      }
      if (g.module === "fbo_fbs_decision") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseFboFbsDecisionMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromFboFbsDecisionMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("fboFbsDecision");
          showToast(t("memory.reopenFboFbsDecisionOk"));
        } else {
          showToast(t("memory.reopenFboFbsDecisionFail"));
        }
        return;
      }
      if (g.module === "corridor_strategy") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseCorridorStrategyMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromCorridorStrategyMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("corridorStrategy");
          showToast(t("memory.reopenCorridorStrategyOk"));
        } else {
          showToast(t("memory.reopenCorridorStrategyFail"));
        }
        return;
      }
      if (g.module === "market_timing") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseMarketTimingMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromMarketTimingMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("marketTiming");
          showToast(t("memory.reopenMarketTimingOk"));
        } else {
          showToast(t("memory.reopenMarketTimingFail"));
        }
        return;
      }
      if (g.module === "control_tower") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseControlTowerMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromControlTowerMemoryPayload(payload);
          scheduleWarmupAfterMemoryReopen();
          onNavigate("controlTower");
          showToast(t("memory.reopenControlTowerOk"));
        } else {
          showToast(t("memory.reopenControlTowerFail"));
        }
        return;
      }
      if (g.module === "os_health_audit") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseOsHealthAuditMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromOsHealthAuditMemoryPayload(payload);
          onNavigate("osHealthAudit");
          showToast(t("memory.reopenOsHealthAuditOk"));
        } else {
          showToast(t("memory.reopenOsHealthAuditFail"));
        }
        return;
      }
      if (g.module === "guided_setup") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseGuidedSetupMemoryPayload(rawStr);
        if (payload) {
          primeSessionsFromGuidedSetupMemoryPayload(payload);
          onNavigate("guidedSetup");
          showToast(t("memory.reopenGuidedSetupOk"));
        } else {
          showToast(t("memory.reopenGuidedSetupFail"));
        }
        return;
      }
      if (g.module === "runtime_smoke_test") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        try {
          const o = JSON.parse(rawStr) as { checks?: unknown };
          if (!o || !Array.isArray(o.checks)) {
            showToast(t("memory.reopenRuntimeSmokeTestFail"));
            return;
          }
          queueRuntimeSmokeReportRestore(rawStr);
          onNavigate("systemSmokeTest");
          showToast(t("memory.reopenRuntimeSmokeTestOk"));
        } catch {
          showToast(t("memory.reopenRuntimeSmokeTestFail"));
        }
        return;
      }
      if (g.module === "release_check") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseReleaseChecklistMemoryPayload(rawStr);
        if (payload) {
          queueReleaseChecklistRestore(rawStr);
          onNavigate("releaseCheck");
          showToast(t("memory.reopenReleaseCheckOk"));
        } else {
          showToast(t("memory.reopenReleaseCheckFail"));
        }
        return;
      }
      if (g.module === "daily_operations_pilot") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseDailyOperationsPilotPayload(rawStr);
        if (payload) {
          queueDailyPilotRestore(rawStr);
          onNavigate("dailyPilot");
          showToast(t("memory.reopenDailyPilotOk"));
        } else {
          showToast(t("memory.reopenDailyPilotFail"));
        }
        return;
      }
      if (g.module === "daily_pilot_debrief") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseDailyPilotDebriefPayload(rawStr);
        if (payload) {
          queueDailyPilotDebriefRestore(rawStr);
          onNavigate("pilotDebrief");
          showToast(t("memory.reopenPilotDebriefOk"));
        } else {
          showToast(t("memory.reopenPilotDebriefFail"));
        }
        return;
      }
      if (g.module === "simplification_backlog") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseSimplificationBacklogPayload(rawStr);
        if (payload) {
          queueSimplificationBacklogRestore(rawStr);
          onNavigate("osSimplification");
          showToast(t("memory.reopenSimplificationBacklogOk"));
        } else {
          showToast(t("memory.reopenSimplificationBacklogFail"));
        }
        return;
      }
      if (g.module === "clean_day_mode") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        if (applyCleanDayModeRestorePayload(rawStr)) {
          onNavigate("dashboard");
          showToast(t("memory.reopenCleanDayOk"));
        } else {
          showToast(t("memory.reopenCleanDayFail"));
        }
        return;
      }
      if (g.module === "operator_brief") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseOperatorBriefMemoryPayload(rawStr);
        if (payload) {
          mergeOperatorOverlayFromMemory(payload.overlay);
          primeSessionsFromOperatorBriefMemoryPayload(payload);
          onNavigate("operatorMode");
          showToast(t("memory.reopenOperatorBriefOk"));
        } else {
          showToast(t("memory.reopenOperatorBriefFail"));
        }
        return;
      }
      if (g.module === "execution_feedback") {
        const rawStr = typeof g.content === "string" ? g.content : JSON.stringify(g.content);
        const payload = parseExecutionFeedbackMemoryPayload(rawStr);
        if (payload) {
          mergeExecutionFeedbackOverlayFromMemory(payload.overlay);
          primeSessionsFromExecutionFeedbackMemoryPayload(payload);
          onNavigate("operatorMode");
          showToast(t("memory.reopenExecutionFeedbackOk"));
        } else {
          showToast(t("memory.reopenExecutionFeedbackFail"));
        }
        return;
      }
      if (g.module === "market_ingestion") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenMarketIngestionFail"));
            return;
          }
        }
        const payload = parseMarketIngestionMemoryPayload(raw);
        if (payload) {
          onNavigate("ingestionReadiness");
          showToast(t("memory.reopenMarketIngestionOk"));
        } else {
          showToast(t("memory.reopenMarketIngestionFail"));
        }
        return;
      }
      if (g.module === "data_import") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenDataImportFail"));
            return;
          }
        }
        const payload = parseDataImportMemoryPayload(raw);
        if (payload) {
          onNavigate("dataImport");
          showToast(t("memory.reopenDataImportOk"));
        } else {
          showToast(t("memory.reopenDataImportFail"));
        }
        return;
      }
      if (g.module === "entity_snapshot") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenEntitySnapshotFail"));
            return;
          }
        }
        const payload = parseEntitySnapshotPayload(raw);
        if (payload) {
          saveActiveEntitySnapshot(payload);
          onNavigate("skuIntelligence");
          showToast(t("memory.reopenEntitySnapshotOk"));
        } else {
          showToast(t("memory.reopenEntitySnapshotFail"));
        }
        return;
      }
      if (g.module === "data_cleanup") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenDataCleanupFail"));
            return;
          }
        }
        if (restoreEnrichedSnapshotFromCleanupPayload(raw)) {
          onNavigate("dataCleanup");
          showToast(t("memory.reopenDataCleanupOk"));
        } else {
          showToast(t("memory.reopenDataCleanupFail"));
        }
        return;
      }
      if (g.module === "assortment_actions") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenAssortmentActionsFail"));
            return;
          }
        }
        const p = parseAssortmentActionsMemoryPayload(raw);
        if (p) {
          bulkSetAssortmentStatuses(p.sourceSnapshotId, p.statuses);
          mergeAssortmentChecklistFromMemory(p.sourceSnapshotId, p.checklistItems ?? []);
          mergeLearningSignalsFromMemory(p.sourceSnapshotId, p.learningSignals ?? []);
          if (p.heroExecutionActions?.length) {
            bulkMergeHeroExecutionActions(p.sourceSnapshotId, p.heroExecutionActions);
          }
          if (p.collectionExecutionActions?.length) {
            bulkMergeCollectionExecutionActions(p.sourceSnapshotId, p.collectionExecutionActions);
          }
          if (p.launchExecutionActions?.length) {
            bulkMergeLaunchExecutionActions(p.sourceSnapshotId, p.launchExecutionActions);
          }
          onNavigate("assortmentActions");
          showToast(t("memory.reopenAssortmentActionsOk"));
        } else {
          showToast(t("memory.reopenAssortmentActionsFail"));
        }
        return;
      }
      if (g.module === "entity_fusion") {
        let raw: unknown = g.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            showToast(t("memory.reopenEntityFusionFail"));
            return;
          }
        }
        const payload = parseEntityFusionMemoryPayload(raw);
        if (payload) {
          onNavigate("entityFusion");
          showToast(t("memory.reopenEntityFusionOk"));
        } else {
          showToast(t("memory.reopenEntityFusionFail"));
        }
        return;
      }
      scheduleRerunFromGeneration(g.id);
      onNavigate(moduleNavTarget(g.module));
      showToast(t("memory.rerunToast"));
    },
    [onNavigate, showToast, t],
  );

  const onCreateProject = () => {
    const p = createProject(newProjectTitle.trim() || t("memory.projectTitlePh"));
    setNewProjectTitle("");
    setSelectedProjectId(p.id);
    showToast(t("memory.create"));
  };

  const onSaveMeta = () => {
    if (!selectedProjectId) return;
    updateProject(selectedProjectId, { description: descInput, tags: parseTags(tagInput) });
    showToast(t("common.saved"));
  };

  const onApplyRename = () => {
    if (!selectedProjectId || !renameDraft.trim()) return;
    renameProject(selectedProjectId, renameDraft.trim());
    setRenaming(false);
    showToast(t("common.saved"));
  };

  const onAddSku = () => {
    if (!selectedProjectId) return;
    createSku(selectedProjectId, { name: skuName, marketplace: skuMarket, category: skuCat });
    setSkuName("");
    setSkuMarket("");
    setSkuCat("");
    showToast(t("common.saved"));
  };

  return (
    <div className="view pm">
      <header className="view__header">
        <p className="eyebrow">{t("memory.eyebrow")}</p>
        <h2 className="view__title">{t("memory.title")}</h2>
        <p className="view__desc">{t("memory.desc")}</p>
      </header>

      <section className="pm-em-bridge glass-panel" aria-labelledby="pm-em-bridge-title">
        <h3 id="pm-em-bridge-title" className="pm-em-bridge__title">
          {t("memory.emBridgeTitle")}
        </h3>
        <p className="pm-em-bridge__body">{t("memory.emBridgeBody")}</p>
        <button type="button" className="pm-em-bridge__btn" onClick={() => onNavigate("executiveMemory")}>
          {t("memory.emOpenExecutive")}
        </button>
      </section>

      {toast && <div className="pm-toast glass-panel">{toast}</div>}

      <div className="pm__grid">
        <aside className="pm__rail glass-panel">
          <label className="field-label">{t("memory.search")}</label>
          <input
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("memory.searchPh")}
          />
          <div className="pm-filters">
            {FILTER_DEF.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`pm-filter ${filter === f.id ? "pm-filter--on" : ""}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
          <p className="pm-rail__h">{t("memory.recent")}</p>
          <div className="pm-create">
            <input
              className="input"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder={t("memory.projectTitlePh")}
            />
            <button type="button" className="ghost-btn" onClick={onCreateProject}>
              {t("memory.create")}
            </button>
          </div>
          <ul className="pm-proj">
            {summaries.length === 0 ? (
              <li className="pm-proj__empty">{t("memory.noProjects")}</li>
            ) : (
              summaries.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`pm-proj__card glass-panel ${selectedProjectId === s.id ? "pm-proj__card--on" : ""}`}
                    aria-pressed={selectedProjectId === s.id}
                    onClick={() => {
                      setSelectedProjectId(s.id);
                      setActiveProjectId(s.id);
                      setDetail(null);
                    }}
                  >
                    <div className="pm-proj__thumb" aria-hidden>
                      {s.thumbnailDataUrl ? (
                        <img src={s.thumbnailDataUrl} alt="" className="pm-proj__img" />
                      ) : (
                        <span className="pm-proj__ph">V</span>
                      )}
                    </div>
                    <div className="pm-proj__meta">
                      <p className="pm-proj__title">{s.title}</p>
                      <p className="pm-proj__sub">
                        {s.generationCount + s.visualCount} {t("memory.items")}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section className="pm__main">
          {!selected ? (
            <div className="glass-panel pm-empty">{t("memory.noProjects")}</div>
          ) : (
            <>
              <div className="glass-panel pm-head">
                <div className="pm-head__row">
                  {renaming ? (
                    <>
                      <input className="input pm-head__rename" value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} />
                      <button type="button" className="ghost-btn" onClick={onApplyRename}>
                        {t("memory.applyRename")}
                      </button>
                      <button type="button" className="ghost-btn" onClick={() => setRenaming(false)}>
                        {t("common.stop")}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="pm-head__title">{selected.title}</h3>
                      <button type="button" className="ghost-btn" onClick={() => setRenaming(true)}>
                        {t("memory.rename")}
                      </button>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => {
                          setActiveProjectId(selected.id);
                          showToast(t("memory.active"));
                        }}
                      >
                        {t("memory.activate")}
                      </button>
                      <button
                        type="button"
                        className="ghost-btn ghost-btn--danger"
                        onClick={() => {
                          if (window.confirm(t("memory.confirmDeleteProject"))) {
                            deleteProject(selected.id);
                            setDetail(null);
                          }
                        }}
                      >
                        {t("memory.deleteProject")}
                      </button>
                    </>
                  )}
                </div>
                <label className="field-label">{t("memory.descLabel")}</label>
                <textarea className="input pm-textarea" rows={2} value={descInput} onChange={(e) => setDescInput(e.target.value)} />
                <label className="field-label">{t("memory.tags")}</label>
                <input className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                <button type="button" className="ghost-btn" style={{ marginTop: 10 }} onClick={onSaveMeta}>
                  {t("memory.saveProjectMeta")}
                </button>
              </div>

              <div className="glass-panel pm-sku">
                <h4 className="pm-block__h">{t("memory.skuBlock")}</h4>
                <div className="pm-sku__form">
                  <input className="input" placeholder={t("memory.skuName")} value={skuName} onChange={(e) => setSkuName(e.target.value)} />
                  <input
                    className="input"
                    placeholder={t("memory.skuMarket")}
                    value={skuMarket}
                    onChange={(e) => setSkuMarket(e.target.value)}
                  />
                  <input className="input" placeholder={t("memory.skuCat")} value={skuCat} onChange={(e) => setSkuCat(e.target.value)} />
                  <button type="button" className="ghost-btn" onClick={onAddSku}>
                    {t("memory.addSku")}
                  </button>
                </div>
                <ul className="pm-sku__list">
                  {skus.map((sku) => (
                    <li key={sku.id} className="pm-sku__row">
                      <span>
                        <strong>{sku.name}</strong> · {sku.marketplace} · {sku.category}
                      </span>
                      <button type="button" className="ghost-btn ghost-btn--danger" onClick={() => deleteSku(sku.id)}>
                        {t("memory.actionDelete")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel pm-tl">
                <h4 className="pm-block__h">{t("memory.timeline")}</h4>
                {timeline.length === 0 ? (
                  <p className="pm-tl__empty">{t("memory.emptyTimeline")}</p>
                ) : (
                  <ul className="pm-tl__list">
                    {timeline.map((row) => (
                      <TimelineRow
                        key={`${row.kind}-${row.id}`}
                        row={row}
                        selected={detail?.kind === row.kind && detail?.id === row.id}
                        onSelect={() => setDetail({ kind: row.kind, id: row.id })}
                        t={t}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {(detailGen || detailVis) && (
                <div className="glass-panel pm-detail">
                  <h4 className="pm-block__h">{t("memory.detail")}</h4>
                  {detailGen && (
                    <>
                      <p className="pm-detail__meta">
                        {detailGen.module === "competitor_analysis"
                          ? t("memory.module.competitor")
                          : detailGen.module === "trend_radar"
                            ? t("memory.module.trendRadar")
                            : detailGen.module === "strategic_command"
                              ? t("memory.module.command")
                              : detailGen.module === "feedback_loop"
                                ? t("memory.module.feedbackLoop")
                                : detailGen.module === "brand_evolution"
                                  ? t("memory.module.brandEvolution")
                                    : detailGen.module === "executive_intelligence"
                                      ? t("memory.module.executiveIntelligence")
                                      : detailGen.module === "strategy_evolution"
                                        ? t("memory.module.strategyEvolution")
                                        : detailGen.module === "organism_model"
                                      ? t("memory.module.organismModel")
                                      : detailGen.module === "visual_strategy"
                                        ? t("memory.module.visualStrategy")
                                        : detailGen.module === "collection_builder"
                                          ? t("memory.module.collectionBuilder")
                                          : detailGen.module === "prompt_pack"
                                            ? t("memory.module.promptPack")
                                            : detailGen.module === "visual_production"
                                              ? t("memory.module.visualProduction")
                                              : detailGen.module === "visual_asset_registry"
                                              ? t("memory.module.visualAssets")
                                              : detailGen.module === "card_production"
                                                ? t("memory.module.cardProduction")
                                                : detailGen.module === "marketplace_operations"
                                                  ? t("memory.module.marketplaceOperations")
                                                  : detailGen.module === "sku_intelligence"
                                                    ? t("memory.module.skuIntelligence")
                                                    : detailGen.module === "market_ingestion"
                                                      ? t("memory.module.marketIngestion")
                                                      : detailGen.module === "data_import"
                                                        ? t("memory.module.dataImport")
                                                        : detailGen.module === "entity_snapshot"
                                                          ? t("memory.module.entitySnapshot")
                                                          : detailGen.module === "data_cleanup"
                                                            ? t("memory.module.dataCleanup")
                                                            : detailGen.module === "assortment_actions"
                                                              ? t("memory.module.assortmentActions")
                                                              : detailGen.module === "competitive_map"
                                                                ? t("memory.module.competitiveMap")
                                                                : detailGen.module === "competitor_serp"
                                                                  ? t("memory.module.competitorSerp")
                                                                  : detailGen.module === "hero_improvement_plan"
                                                                    ? t("memory.module.heroImprovementPlan")
                                                                    : detailGen.module === "competitive_gap_analysis"
                                                                      ? t("memory.module.competitiveGapAnalysis")
                                                                      : detailGen.module === "hero_archetype_intelligence"
                                                                        ? t("memory.module.heroArchetypeIntelligence")
                                                                        : detailGen.module === "hero_readability_intelligence"
                                                                          ? t("memory.module.heroReadabilityIntelligence")
                                                                          : detailGen.module === "hero_fatigue_intelligence"
                                                                            ? t("memory.module.heroFatigueIntelligence")
                                                                            : detailGen.module === "hero_battle_plan"
                                                                              ? t("memory.module.heroBattlePlan")
                                                                              : detailGen.module === "hero_test_matrix"
                                                                                ? t("memory.module.heroTestMatrix")
                                                                                : detailGen.module === "hero_test_results"
                                                                                  ? t("memory.module.heroTestResults")
                                                                                  : detailGen.module === "hero_launch_package"
                                                                                    ? t("memory.module.heroLaunchPackage")
                                                                                    : detailGen.module === "hero_post_launch_observation"
                                                                                      ? t("memory.module.heroPostLaunchObservation")
                                                                                      : detailGen.module === "hero_command"
                                                                                        ? t("memory.module.heroCommand")
                                                                                        : detailGen.module === "launch_operations"
                                                                                          ? t("memory.module.launchOperations")
                                                                                          : detailGen.module === "launch_review"
                                                                                            ? t("memory.module.launchReview")
                                                                                            : detailGen.module === "founder_brief"
                                                                                              ? t("memory.module.founderBrief")
                                                                                              : detailGen.module === "economic_pressure"
                                                                                                ? t("memory.module.economicPressure")
                                                                                                : detailGen.module === "unit_economics"
                                                                                                  ? t("memory.module.unitEconomics")
                                                                                                  : detailGen.module === "advertising_pressure"
                                                                                                    ? t("memory.module.advertisingPressure")
                                                                                                      : detailGen.module === "scaling_safety"
                                                                                                        ? t("memory.module.scalingSafety")
                                                                                                        : detailGen.module === "production_pressure"
                                                                                                          ? t("memory.module.productionPressure")
                                                                                                          : detailGen.module === "production_daily_plan"
                                                                                                            ? t("memory.module.productionDailyPlan")
                                                                                                            : detailGen.module === "production_shift_feedback"
                                                                                                              ? t("memory.module.productionShiftFeedback")
                                                                                                              : detailGen.module === "daily_war_room"
                                                                                                                ? t("memory.module.dailyWarRoom")
                                                                                                                : detailGen.module === "morning_flow"
                                                                                                                  ? t("memory.module.morningFlow")
                                                                                                                  : detailGen.module === "evening_close"
                                                                                                                    ? t("memory.module.eveningClose")
                                                                                                                      : detailGen.module === "real_use_test"
                                                                                                                        ? t("memory.module.realUseTest")
                                                                                                                        : detailGen.module === "integration_readiness"
                                                                                                                          ? t("memory.module.integrationReadiness")
                                                                                                                          : detailGen.module === "fbo_fbs_decision"
                                                                                                          ? t("memory.module.fboFbsDecision")
                                                                                                          : detailGen.module === "corridor_strategy"
                                                                                                            ? t("memory.module.corridorStrategy")
                                                                                                            : detailGen.module === "market_timing"
                                                                                                              ? t("memory.module.marketTiming")
                                                                                                              : detailGen.module === "control_tower"
                                                                                                                ? t("memory.module.controlTower")
                                                                                                                : detailGen.module === "os_health_audit"
                                                                                                                  ? t("memory.module.osHealthAudit")
                                                                                                                    : detailGen.module === "guided_setup"
                                                                                                                    ? t("memory.module.guidedSetup")
                                                                                                                    : detailGen.module === "release_check"
                                                                                                                      ? t("memory.module.releaseCheck")
                                                                                                                    : detailGen.module === "daily_operations_pilot"
                                                                                                                      ? t("memory.module.dailyOperationsPilot")
                                                                                                                    : detailGen.module === "daily_pilot_debrief"
                                                                                                                      ? t("memory.module.pilotDebrief")
                                                                                                                    : detailGen.module === "simplification_backlog"
                                                                                                                      ? t("memory.module.simplificationBacklog")
                                                                                                                    : detailGen.module === "clean_day_mode"
                                                                                                                      ? t("memory.module.cleanDay")
                                                                                                                    : detailGen.module === "runtime_smoke_test"
                                                                                                                      ? t("memory.module.runtimeSmokeTest")
                                                                                                                      : detailGen.module === "operator_brief"
                                                                                                                        ? t("memory.module.operatorBrief")
                                                                                                                        : detailGen.module === "execution_feedback"
                                                                                                                          ? t("memory.module.executionFeedback")
                                                                                                                  : detailGen.module === "entity_fusion"
                                                                                ? t("memory.module.entityFusion")
                                                                                : detailGen.module === "prompt_composer"
                                                                                  ? t("memory.module.promptComposer")
                                                                                  : `${t("memory.module.gen")} · ${detailGen.module}`}{" "}
                        · {new Date(detailGen.createdAt).toLocaleString()}
                      </p>
                      <p className="pm-detail__title">{detailGen.title}</p>
                      <MemoryQuickActions
                        onOpen={() => reopenGenerationFromMemory(detailGen)}
                        onRerun={() => reopenGenerationFromMemory(detailGen)}
                        onDuplicate={() => {
                          duplicateGeneration(detailGen.id);
                          showToast(t("common.saved"));
                        }}
                        onExportMd={() => exportGenerationMarkdown(detailGen)}
                        onExportTxt={() => exportGenerationPlain(detailGen)}
                        onExportJson={() => exportGenerationJsonRecord(detailGen)}
                        onDelete={() => {
                          deleteGeneration(detailGen.id);
                          setDetail(null);
                        }}
                      />
                      <pre className="pm-detail__pre">{detailGen.previewText}</pre>
                    </>
                  )}
                  {detailVis && (
                    <>
                      <p className="pm-detail__meta">
                        {t("memory.module.visual")} · v{detailVis.schemaVersion} · {new Date(detailVis.createdAt).toLocaleString()}
                      </p>
                      <p className="pm-detail__title">{detailVis.title}</p>
                      {detailVis.previewImageDataUrl && (
                        <img src={detailVis.previewImageDataUrl} alt="" className="pm-detail__img" />
                      )}
                      <MemoryQuickActions
                        onOpen={() => {
                          scheduleRerunFromVisual();
                          onNavigate("visual");
                          showToast(t("memory.rerunToast"));
                        }}
                        onRerun={() => {
                          scheduleRerunFromVisual();
                          onNavigate("visual");
                          showToast(t("memory.rerunToast"));
                        }}
                        onExportJson={() => exportVisualAnalysisJson(detailVis)}
                        onDelete={() => {
                          deleteVisualAnalysis(detailVis.id);
                          setDetail(null);
                        }}
                      />
                      <pre className="pm-detail__pre">{detailVis.previewText}</pre>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <style>{`
        .pm-em-bridge {
          padding: 16px 20px;
          margin-bottom: 18px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }
        .pm-em-bridge__title {
          margin: 0 0 8px;
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(175, 188, 215, 0.75);
        }
        .pm-em-bridge__body {
          margin: 0 0 14px;
          font-size: 0.8rem;
          line-height: 1.5;
          color: rgba(155, 168, 195, 0.88);
          max-width: 52rem;
        }
        .pm-em-bridge__btn {
          border-radius: 0;
          border: 1px solid rgba(200, 210, 235, 0.28);
          background: transparent;
          color: rgba(210, 218, 238, 0.9);
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 10px 16px;
          cursor: pointer;
        }
        .pm-em-bridge__btn:hover {
          border-color: rgba(220, 228, 245, 0.45);
          color: var(--text);
        }
        .pm__grid {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .pm__grid {
            grid-template-columns: 1fr;
          }
        }
        .pm__rail {
          padding: 20px;
          position: sticky;
          top: 18px;
        }
        .pm-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 14px 0 18px;
        }
        .pm-filter {
          border-radius: 99px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.25);
          color: var(--muted);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 7px 12px;
          cursor: pointer;
          transform: translateY(0);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          transition:
            border-color 0.2s var(--ease-out),
            color 0.2s var(--ease-out),
            background 0.2s var(--ease-out),
            box-shadow 0.2s var(--ease-out),
            transform 0.15s var(--ease-out);
        }
        .pm-filter:hover:not([aria-pressed="true"]):not(.pm-filter--on) {
          border-color: var(--stroke-strong);
          color: var(--text);
          background: rgba(255, 255, 255, 0.05);
        }
        .pm-filter:active:not([aria-pressed="true"]):not(.pm-filter--on) {
          transform: translateY(1px);
        }
        .pm-filter:focus-visible {
          outline: 2px solid rgba(123, 143, 255, 0.65);
          outline-offset: 2px;
        }
        .pm-filter--on,
        .pm-filter[aria-pressed="true"] {
          transform: translateY(1px);
          border-color: var(--toggle-on-border);
          color: var(--text);
          background: linear-gradient(180deg, rgba(24, 26, 42, 0.95) 0%, rgba(8, 9, 15, 0.98) 100%);
          box-shadow:
            var(--toggle-pressed-inset),
            0 0 0 1px rgba(123, 143, 255, 0.28),
            0 0 18px var(--toggle-on-glow),
            0 0 38px var(--toggle-on-glow-outer);
        }
        .pm-rail__h {
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 18px 0 10px;
        }
        .pm-create {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }
        .pm-proj {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 48vh;
          overflow: auto;
        }
        .pm-proj__empty {
          color: var(--muted);
          font-size: 0.88rem;
        }
        .pm-proj__card {
          width: 100%;
          text-align: left;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.22);
          padding: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
          cursor: pointer;
          border-radius: 16px;
          transform: translateY(0);
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease,
            transform 0.15s var(--ease-out);
        }
        .pm-proj__card:active:not([aria-pressed="true"]):not(.pm-proj__card--on) {
          transform: translateY(1px);
        }
        .pm-proj__card:focus-visible {
          outline: 2px solid rgba(123, 143, 255, 0.65);
          outline-offset: 2px;
        }
        .pm-proj__card--on,
        .pm-proj__card[aria-pressed="true"] {
          transform: translateY(1px);
          border-color: var(--toggle-on-border);
          background: linear-gradient(180deg, rgba(22, 24, 38, 0.88) 0%, rgba(8, 9, 15, 0.94) 100%);
          box-shadow:
            var(--toggle-pressed-inset),
            0 0 0 1px rgba(123, 143, 255, 0.32),
            0 0 22px var(--toggle-on-glow),
            0 0 48px var(--toggle-on-glow-outer);
        }
        .pm-proj__thumb {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.04);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .pm-proj__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pm-proj__ph {
          font-family: var(--font-display);
          font-size: 0.85rem;
          opacity: 0.35;
        }
        .pm-proj__title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 0.95rem;
        }
        .pm-proj__sub {
          margin: 4px 0 0;
          font-size: 0.75rem;
          color: var(--muted);
        }
        .pm__main {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .pm-head,
        .pm-sku,
        .pm-tl,
        .pm-detail,
        .pm-empty {
          padding: 22px;
        }
        .pm-head__row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 14px;
        }
        .pm-head__title {
          margin: 0;
          flex: 1;
          min-width: 0;
          font-family: var(--font-display);
          font-size: 1.35rem;
        }
        .pm-head__rename {
          flex: 1;
          min-width: 0;
        }
        .pm-textarea {
          resize: vertical;
          min-height: 64px;
        }
        .pm-block__h {
          margin: 0 0 14px;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .pm-sku__form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .pm-sku__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pm-sku__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          color: var(--muted);
        }
        .pm-tl__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pm-tl__empty {
          color: var(--muted);
          margin: 0;
        }
        .pm-tl__btn {
          width: 100%;
          text-align: left;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.2);
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          color: var(--text);
          transform: translateY(0);
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s var(--ease-out);
        }
        .pm-tl__btn:active:not([aria-pressed="true"]):not(.pm-tl__btn--on) {
          transform: translateY(1px);
        }
        .pm-tl__btn:focus-visible {
          outline: 2px solid rgba(123, 143, 255, 0.65);
          outline-offset: 2px;
        }
        .pm-tl__btn--on,
        .pm-tl__btn[aria-pressed="true"] {
          transform: translateY(1px);
          border-color: var(--toggle-on-border);
          background: linear-gradient(180deg, rgba(22, 24, 38, 0.9) 0%, rgba(8, 9, 15, 0.95) 100%);
          box-shadow:
            var(--toggle-pressed-inset),
            0 0 0 1px rgba(123, 143, 255, 0.3),
            0 0 20px var(--toggle-on-glow),
            0 0 42px var(--toggle-on-glow-outer);
        }
        .pm-tl__pill {
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
        }
        .pm-tl__title {
          margin: 0;
          font-size: 0.92rem;
        }
        .pm-tl__time {
          margin: 6px 0 0;
          font-size: 0.75rem;
          color: var(--muted);
        }
        .pm-detail__meta {
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 8px;
        }
        .pm-detail__title {
          margin: 0 0 14px;
          font-family: var(--font-display);
          font-size: 1.1rem;
        }
        .pm-detail__pre {
          margin: 14px 0 0;
          padding: 14px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--stroke);
          font-size: 0.8rem;
          white-space: pre-wrap;
          max-height: 220px;
          overflow: auto;
          color: var(--muted);
        }
        .pm-detail__img {
          max-width: 220px;
          border-radius: 12px;
          margin-bottom: 10px;
        }
        .pm-toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 50;
          padding: 12px 18px;
          font-size: 0.82rem;
          animation: pmFade 0.35s ease;
        }
        @keyframes pmFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function TimelineRow({
  row,
  selected,
  onSelect,
  t,
}: {
  row: { kind: "generation" | "visual"; id: string; createdAt: number };
  selected: boolean;
  onSelect: () => void;
  t: (k: string) => string;
}) {
  const gen = row.kind === "generation" ? getGeneration(row.id) : undefined;
  const vis = row.kind === "visual" ? getVisualAnalysis(row.id) : undefined;
  const title = gen?.title ?? vis?.title ?? row.id;
  const preview = gen?.previewText ?? vis?.previewText ?? "";
  const pill =
    row.kind === "visual"
      ? t("memory.module.visual")
      : gen
        ? gen.module === "competitor_analysis"
          ? t("memory.module.competitor")
          : gen.module === "trend_radar"
            ? t("memory.module.trendRadar")
            : gen.module === "strategic_command"
              ? t("memory.module.command")
              : gen.module === "feedback_loop"
                ? t("memory.module.feedbackLoop")
                : gen.module === "brand_evolution"
                  ? t("memory.module.brandEvolution")
                  : gen.module === "executive_intelligence"
                    ? t("memory.module.executiveIntelligence")
                    : gen.module === "strategy_evolution"
                      ? t("memory.module.strategyEvolution")
                    : gen.module === "organism_model"
                      ? t("memory.module.organismModel")
                      : gen.module === "visual_strategy"
                        ? t("memory.module.visualStrategy")
                        : gen.module === "collection_builder"
                          ? t("memory.module.collectionBuilder")
                          : gen.module === "prompt_pack"
                            ? t("memory.module.promptPack")
                            : gen.module === "visual_production"
                              ? t("memory.module.visualProduction")
                              : gen.module === "visual_asset_registry"
                                ? t("memory.module.visualAssets")
                                : gen.module === "card_production"
                                  ? t("memory.module.cardProduction")
                                  : gen.module === "marketplace_operations"
                                    ? t("memory.module.marketplaceOperations")
                                    : gen.module === "sku_intelligence"
                                      ? t("memory.module.skuIntelligence")
                                      : gen.module === "market_ingestion"
                                        ? t("memory.module.marketIngestion")
                                        : gen.module === "data_import"
                                        ? t("memory.module.dataImport")
                                        : gen.module === "entity_snapshot"
                                          ? t("memory.module.entitySnapshot")
                                          : gen.module === "data_cleanup"
                                            ? t("memory.module.dataCleanup")
                                            : gen.module === "assortment_actions"
                                              ? t("memory.module.assortmentActions")
                                              : gen.module === "competitive_map"
                                                ? t("memory.module.competitiveMap")
                                                : gen.module === "competitor_serp"
                                                  ? t("memory.module.competitorSerp")
                                                  : gen.module === "hero_improvement_plan"
                                                    ? t("memory.module.heroImprovementPlan")
                                                    : gen.module === "competitive_gap_analysis"
                                                      ? t("memory.module.competitiveGapAnalysis")
                                                      : gen.module === "hero_archetype_intelligence"
                                                        ? t("memory.module.heroArchetypeIntelligence")
                                                        : gen.module === "hero_readability_intelligence"
                                                          ? t("memory.module.heroReadabilityIntelligence")
                                                          : gen.module === "hero_fatigue_intelligence"
                                                            ? t("memory.module.heroFatigueIntelligence")
                                                            : gen.module === "hero_battle_plan"
                                                              ? t("memory.module.heroBattlePlan")
                                                              : gen.module === "hero_test_matrix"
                                                                ? t("memory.module.heroTestMatrix")
                                                                : gen.module === "hero_test_results"
                                                                  ? t("memory.module.heroTestResults")
                                                                  : gen.module === "hero_launch_package"
                                                                    ? t("memory.module.heroLaunchPackage")
                                                                    : gen.module === "hero_post_launch_observation"
                                                                      ? t("memory.module.heroPostLaunchObservation")
                                                                      : gen.module === "hero_command"
                                                                        ? t("memory.module.heroCommand")
                                                                        : gen.module === "launch_operations"
                                                                          ? t("memory.module.launchOperations")
                                                                          : gen.module === "launch_review"
                                                                            ? t("memory.module.launchReview")
                                                                            : gen.module === "founder_brief"
                                                                              ? t("memory.module.founderBrief")
                                                                              : gen.module === "economic_pressure"
                                                                                ? t("memory.module.economicPressure")
                                                                                : gen.module === "unit_economics"
                                                                                  ? t("memory.module.unitEconomics")
                                                                                  : gen.module === "advertising_pressure"
                                                                                    ? t("memory.module.advertisingPressure")
                                                                                    : gen.module === "scaling_safety"
                                                                                      ? t("memory.module.scalingSafety")
                                                                                      : gen.module === "production_pressure"
                                                                                        ? t("memory.module.productionPressure")
                                                                                        : gen.module === "production_daily_plan"
                                                                                          ? t("memory.module.productionDailyPlan")
                                                                                          : gen.module === "production_shift_feedback"
                                                                                            ? t("memory.module.productionShiftFeedback")
                                                                                            : gen.module === "daily_war_room"
                                                                                              ? t("memory.module.dailyWarRoom")
                                                                                              : gen.module === "morning_flow"
                                                                                                ? t("memory.module.morningFlow")
                                                                                                : gen.module === "evening_close"
                                                                                                  ? t("memory.module.eveningClose")
                                                                                                    : gen.module === "real_use_test"
                                                                                                      ? t("memory.module.realUseTest")
                                                                                                      : gen.module === "integration_readiness"
                                                                                                        ? t("memory.module.integrationReadiness")
                                                                                                        : gen.module === "fbo_fbs_decision"
                                                                                        ? t("memory.module.fboFbsDecision")
                                                                                        : gen.module === "corridor_strategy"
                                                                                          ? t("memory.module.corridorStrategy")
                                                                                          : gen.module === "market_timing"
                                                                                            ? t("memory.module.marketTiming")
                                                                                            : gen.module === "control_tower"
                                                                                              ? t("memory.module.controlTower")
                                                                                              : gen.module === "os_health_audit"
                                                                                                ? t("memory.module.osHealthAudit")
                                                                                                  : gen.module === "guided_setup"
                                                                                                  ? t("memory.module.guidedSetup")
                                                                                                  : gen.module === "release_check"
                                                                                                    ? t("memory.module.releaseCheck")
                                                                                                  : gen.module === "daily_operations_pilot"
                                                                                                    ? t("memory.module.dailyOperationsPilot")
                                                                                                  : gen.module === "daily_pilot_debrief"
                                                                                                    ? t("memory.module.pilotDebrief")
                                                                                                  : gen.module === "simplification_backlog"
                                                                                                    ? t("memory.module.simplificationBacklog")
                                                                                                  : gen.module === "clean_day_mode"
                                                                                                    ? t("memory.module.cleanDay")
                                                                                                  : gen.module === "runtime_smoke_test"
                                                                                                    ? t("memory.module.runtimeSmokeTest")
                                                                                                    : gen.module === "operator_brief"
                                                                                                      ? t("memory.module.operatorBrief")
                                                                                                      : gen.module === "execution_feedback"
                                                                                                        ? t("memory.module.executionFeedback")
                                                                                                : gen.module === "entity_fusion"
                                                                ? t("memory.module.entityFusion")
                                                                : gen.module === "prompt_composer"
                                                                  ? t("memory.module.promptComposer")
                                                                  : `${t("memory.module.gen")} · ${gen.module}`
        : t("memory.module.gen");
  const thumb = vis?.previewImageDataUrl ?? gen?.previewImageDataUrl;

  return (
    <li>
      <button
        type="button"
        className={`pm-tl__btn glass-panel--hover ${selected ? "pm-tl__btn--on" : ""}`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {thumb && (
            <div className="pm-proj__thumb" style={{ width: 52, height: 52 }}>
              <img src={thumb} alt="" className="pm-proj__img" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p className="pm-tl__pill">{pill}</p>
            <p className="pm-tl__title">{title}</p>
            <p className="pm-tl__time">{new Date(row.createdAt).toLocaleString()}</p>
            <p className="pm-tl__preview">{preview}</p>
          </div>
        </div>
      </button>
      <style>{`
        .pm-tl__preview {
          margin: 8px 0 0;
          font-size: 0.8rem;
          color: var(--muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </li>
  );
}
