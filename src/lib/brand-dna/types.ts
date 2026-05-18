/** Структура Brand DNA как операционной конституции VOKRA OS (источник правды для модулей). */

export type RiskFlagLevel = "low" | "med" | "high";

export interface BrandCoreBlock {
  mission: string;
  philosophy: string;
  enemy: string;
  promise: string;
  mantra: string;
  /** Краткое определение: что такое VOKRA */
  whatIs: string;
}

export interface ProductDnaBlock {
  intro: string;
  currentEngine: string;
  currentLaunchBase: string;
  futureExpansion: string[];
  rules: string[];
}

export interface VisualDnaBlock {
  pillars: string[];
  forbidden: string[];
  accents: string[];
}

export interface VoiceDnaBlock {
  toneBullets: string[];
  goodExamples: string[];
  badExamples: string[];
}

export interface CustomerDnaBlock {
  audienceBullets: string[];
  tension: string;
}

export interface MarketplaceDnaBlock {
  rules: string[];
}

export interface ProductionDnaBlock {
  constraints: string[];
  scoringDimensions: string[];
}

export interface FashionGenomeDimension {
  id: string;
  label: string;
  value: number;
  hint?: string;
}

export interface BrandLaw {
  id: string;
  text: string;
}

export interface AiGovernanceRule {
  id: string;
  text: string;
}

export interface DnaFitRiskFlag {
  label: string;
  level: RiskFlagLevel;
}

export interface DnaFitCheckerSnapshot {
  /** Демо-значения; позже заменить на расчёт */
  brandFit: number;
  marketplaceFit: number;
  productionFit: number;
  premiumSignal: number;
  riskFlags: DnaFitRiskFlag[];
}

export interface SystemFlowBlock {
  title: string;
  steps: string[];
}

export interface DesignTokens {
  colors: { name: string; hex: string; usage: string }[];
  typography: { role: string; font: string; note: string }[];
}

export interface VokraBrandConstitution {
  version: string;
  /** ISO или произвольная метка для будущего edit/save */
  revisionNote?: string;
  core: BrandCoreBlock;
  product: ProductDnaBlock;
  visual: VisualDnaBlock;
  voice: VoiceDnaBlock;
  customer: CustomerDnaBlock;
  marketplace: MarketplaceDnaBlock;
  production: ProductionDnaBlock;
  genome: FashionGenomeDimension[];
  laws: BrandLaw[];
  aiGovernance: AiGovernanceRule[];
  fitChecker: DnaFitCheckerSnapshot;
  systemFlow: SystemFlowBlock;
  designTokens: DesignTokens;
}
