import type { NavId } from "../types";
import { CommandCenterView } from "./CommandCenterView";
import { SafeModeRestrictedModule } from "../components/SafeModeRestrictedModule";
import { isCommandCompositionRestricted } from "../lib/safe-mode";
import { DashboardView } from "./DashboardView";
import { SEOView } from "./SEOView";
import { RichContentView } from "./RichContentView";
import { PromptLabView } from "./PromptLabView";
import { PromptComposerLabView } from "./PromptComposerLabView";
import { ReelsView } from "./ReelsView";
import { CampaignView } from "./CampaignView";
import { BrandDNAView } from "./BrandDNAView";
import { AnalyticsView } from "./AnalyticsView";
import { SettingsView } from "./SettingsView";
import { VisualIntelligenceLabView } from "./VisualIntelligenceLabView";
import { VisualStrategyView } from "./VisualStrategyView";
import { CompetitorIntelligenceView } from "./CompetitorIntelligenceView";
import { TrendRadarView } from "./TrendRadarView";
import { StrategicCommandCenterView } from "./StrategicCommandCenterView";
import { OperationsCenterView } from "./OperationsCenterView";
import { AiOperationsCenterView } from "./AiOperationsCenterView";
import { ProjectMemoryView } from "./ProjectMemoryView";
import MissionControlView from "./mission-control/MissionControlView";
import { StrategicSimulationView } from "./StrategicSimulationView";
import { TemporalStrategyView } from "./TemporalStrategyView";
import { ExecutionPlannerView } from "./ExecutionPlannerView";
import { ExecutionOrchestratorView } from "./ExecutionOrchestratorView";
import { SignalFabricView } from "./SignalFabricView";
import { FeedbackLoopView } from "./FeedbackLoopView";
import { BrandEvolutionView } from "./BrandEvolutionView";
import { OrganismModelView } from "./OrganismModelView";
import { ExecutiveIntelligenceView } from "./ExecutiveIntelligenceView";
import { ExecutiveMemoryView } from "./ExecutiveMemoryView";
import { StrategyEvolutionView } from "./StrategyEvolutionView";
import { CollectionBuilderView } from "./CollectionBuilderView";
import { PromptPackView } from "./PromptPackView";
import { VisualProductionView } from "./VisualProductionView";
import { VisualAssetRegistryView } from "./VisualAssetRegistryView";
import { CardProductionView } from "./CardProductionView";
import { MarketplaceOperationsView } from "./MarketplaceOperationsView";
import { SkuIntelligenceView } from "./SkuIntelligenceView";
import { IngestionReadinessView } from "./IngestionReadinessView";
import { DataImportView } from "./DataImportView";
import { EntityFusionView } from "./EntityFusionView";
import { DataCleanupView } from "./DataCleanupView";
import { AssortmentActionsView } from "./AssortmentActionsView";
import { CompetitiveMapView } from "./CompetitiveMapView";
import { HeroCommandView } from "./HeroCommandView";
import { LaunchOperationsView } from "./LaunchOperationsView";
import { FounderBriefView } from "./FounderBriefView";
import { DailyWarRoomView } from "./DailyWarRoomView";
import { MorningStartView } from "./MorningStartView";
import { EveningCloseView } from "./EveningCloseView";
import { RealUseSmokeTestView } from "./RealUseSmokeTestView";
import { IntegrationReadinessView } from "./IntegrationReadinessView";
import { EconomicPressureView } from "./EconomicPressureView";
import { UnitEconomicsView } from "./UnitEconomicsView";
import { AdvertisingPressureView } from "./AdvertisingPressureView";
import { ScalingSafetyView } from "./ScalingSafetyView";
import { ProductionPressureView } from "./ProductionPressureView";
import { FboFbsDecisionView } from "./FboFbsDecisionView";
import { CorridorStrategyView } from "./CorridorStrategyView";
import { MarketTimingView } from "./MarketTimingView";
import { ControlTowerView } from "./ControlTowerView";
import { OsHealthAuditView } from "./OsHealthAuditView";
import { GuidedSetupView } from "./GuidedSetupView";
import { OperatorModeView } from "./OperatorModeView";
import { SafeModeView } from "./SafeModeView";
import { ReleaseCheckView } from "./ReleaseCheckView";
import { DailyPilotView } from "./DailyPilotView";
import { PilotDebriefView } from "./PilotDebriefView";
import { OsSimplificationView } from "./OsSimplificationView";
import { SystemSmokeTestView } from "./SystemSmokeTestView";

type Nav = (id: NavId) => void;
type NavRenderer = (onNavigate: Nav) => React.ReactNode;

export const VIEW_REGISTRY: Partial<Record<NavId, NavRenderer>> = {
  home:                  (nav) => <CommandCenterView onNavigate={nav} />,
  dashboard:             (nav) => <DashboardView onNavigate={nav} />,
  founderBrief:          (nav) => isCommandCompositionRestricted()
    ? <SafeModeRestrictedModule moduleLabelKey="nav.founderBrief" onNavigate={nav} />
    : <FounderBriefView onNavigate={nav} />,
  warRoom:               (nav) => isCommandCompositionRestricted()
    ? <SafeModeRestrictedModule moduleLabelKey="nav.warRoom" onNavigate={nav} />
    : <DailyWarRoomView onNavigate={nav} />,
  morningStart:          (nav) => <MorningStartView onNavigate={nav} />,
  eveningClose:          (nav) => <EveningCloseView onNavigate={nav} />,
  realUseTest:           (nav) => <RealUseSmokeTestView onNavigate={nav} />,
  integrationReadiness:  (nav) => <IntegrationReadinessView onNavigate={nav} />,
  economicPressure:      (nav) => <EconomicPressureView onNavigate={nav} />,
  unitEconomics:         (nav) => <UnitEconomicsView onNavigate={nav} />,
  advertisingPressure:   (nav) => <AdvertisingPressureView onNavigate={nav} />,
  scalingSafety:         (nav) => <ScalingSafetyView onNavigate={nav} />,
  productionPressure:    (nav) => <ProductionPressureView onNavigate={nav} />,
  fboFbsDecision:        (nav) => <FboFbsDecisionView onNavigate={nav} />,
  corridorStrategy:      (nav) => <CorridorStrategyView onNavigate={nav} />,
  marketTiming:          (nav) => <MarketTimingView onNavigate={nav} />,
  controlTower:          (nav) => isCommandCompositionRestricted()
    ? <SafeModeRestrictedModule moduleLabelKey="nav.controlTower" onNavigate={nav} />
    : <ControlTowerView onNavigate={nav} />,
  osHealthAudit:         (nav) => <OsHealthAuditView onNavigate={nav} />,
  guidedSetup:           (nav) => <GuidedSetupView onNavigate={nav} />,
  releaseCheck:          (nav) => <ReleaseCheckView onNavigate={nav} />,
  dailyPilot:            (nav) => <DailyPilotView onNavigate={nav} />,
  pilotDebrief:          (nav) => <PilotDebriefView onNavigate={nav} />,
  osSimplification:      (nav) => <OsSimplificationView onNavigate={nav} />,
  safeMode:              (nav) => <SafeModeView onNavigate={nav} />,
  systemSmokeTest:       (nav) => <SystemSmokeTestView onNavigate={nav} />,
  operatorMode:          (nav) => <OperatorModeView onNavigate={nav} />,
  missionControl:        ()    => <MissionControlView />,
  executiveIntelligence: (nav) => <ExecutiveIntelligenceView onNavigate={nav} />,
  executiveMemory:       (nav) => <ExecutiveMemoryView onNavigate={nav} />,
  strategyEvolution:     (nav) => <StrategyEvolutionView onNavigate={nav} />,
  organismModel:         (nav) => <OrganismModelView onNavigate={nav} />,
  strategicSimulation:   ()    => <StrategicSimulationView />,
  temporalStrategy:      (nav) => <TemporalStrategyView onNavigate={nav} />,
  executionPlanner:      (nav) => <ExecutionPlannerView onNavigate={nav} />,
  executionOrchestrator: (nav) => <ExecutionOrchestratorView onNavigate={nav} />,
  signalFabric:          (nav) => <SignalFabricView onNavigate={nav} />,
  feedbackLoop:          (nav) => <FeedbackLoopView onNavigate={nav} />,
  command:               ()    => <StrategicCommandCenterView />,
  operations:            (nav) => <AiOperationsCenterView onNavigate={nav} />,
  operationsBrief:       (nav) => <OperationsCenterView onNavigate={nav} />,
  seo:                   ()    => <SEOView />,
  rich:                  ()    => <RichContentView />,
  prompts:               ()    => <PromptLabView />,
  promptComposer:        (nav) => <PromptComposerLabView onNavigate={nav} />,
  promptPack:            (nav) => <PromptPackView onNavigate={nav} />,
  visualProduction:      (nav) => <VisualProductionView onNavigate={nav} />,
  visualAssets:          (nav) => <VisualAssetRegistryView onNavigate={nav} />,
  cardProduction:        (nav) => <CardProductionView onNavigate={nav} />,
  marketplaceOperations: (nav) => <MarketplaceOperationsView onNavigate={nav} />,
  skuIntelligence:       (nav) => <SkuIntelligenceView onNavigate={nav} />,
  competitiveMap:        (nav) => <CompetitiveMapView onNavigate={nav} />,
  heroCommand:           (nav) => <HeroCommandView onNavigate={nav} />,
  launchOperations:      (nav) => <LaunchOperationsView onNavigate={nav} />,
  ingestionReadiness:    (nav) => <IngestionReadinessView onNavigate={nav} />,
  dataImport:            (nav) => <DataImportView onNavigate={nav} />,
  entityFusion:          (nav) => <EntityFusionView onNavigate={nav} />,
  dataCleanup:           (nav) => <DataCleanupView onNavigate={nav} />,
  assortmentActions:     (nav) => <AssortmentActionsView onNavigate={nav} />,
  reels:                 ()    => <ReelsView />,
  campaign:              ()    => <CampaignView />,
  collectionBuilder:     (nav) => <CollectionBuilderView onNavigate={nav} />,
  dna:                   (nav) => <BrandDNAView onNavigate={nav} />,
  brandEvolution:        (nav) => <BrandEvolutionView onNavigate={nav} />,
  visualStrategy:        (nav) => <VisualStrategyView onNavigate={nav} />,
  visual:                ()    => <VisualIntelligenceLabView />,
  competitors:           ()    => <CompetitorIntelligenceView />,
  trends:                ()    => <TrendRadarView />,
  memory:                (nav) => <ProjectMemoryView onNavigate={nav} />,
  analytics:             ()    => <AnalyticsView />,
  settings:              ()    => <SettingsView />,
};
