export type NavId =
  | "home"
  | "dashboard"
  | "founderBrief"
  | "warRoom"
  | "morningStart"
  | "eveningClose"
  | "realUseTest"
  | "integrationReadiness"
  | "economicPressure"
  | "unitEconomics"
  | "advertisingPressure"
  | "scalingSafety"
  | "productionPressure"
  | "fboFbsDecision"
  | "corridorStrategy"
  | "marketTiming"
  | "controlTower"
  | "osHealthAudit"
  | "guidedSetup"
  | "operatorMode"
  | "missionControl"
  | "executiveIntelligence"
  | "organismModel"
  | "strategicSimulation"
  | "temporalStrategy"
  | "executionPlanner"
  | "executionOrchestrator"
  | "signalFabric"
  | "feedbackLoop"
  | "command"
  | "operations"
  | "operationsBrief"
  | "seo"
  | "rich"
  | "prompts"
  | "promptComposer"
  | "promptPack"
  | "visualProduction"
  | "visualAssets"
  | "cardProduction"
  | "marketplaceOperations"
  | "skuIntelligence"
  | "competitiveMap"
  | "heroCommand"
  | "ingestionReadiness"
  | "dataImport"
  | "entityFusion"
  | "dataCleanup"
  | "assortmentActions"
  | "reels"
  | "campaign"
  | "collectionBuilder"
  | "launchOperations"
  | "dna"
  | "brandEvolution"
  | "visual"
  | "visualStrategy"
  | "competitors"
  | "trends"
  | "memory"
  | "executiveMemory"
  | "strategyEvolution"
  | "analytics"
  | "settings"
  | "safeMode"
  | "releaseCheck"
  | "dailyPilot"
  | "pilotDebrief"
  | "osSimplification"
  | "systemSmokeTest";

export type PromptStyle =
  | "luxury"
  | "minimal"
  | "cyberpunk"
  | "streetwear"
  | "monochrome"
  | "futuristic";

export interface SeoInput {
  productName: string;
  keywords: string;
  category: string;
  style: string;
}

export interface SeoOutput {
  seoTitle: string;
  seoDescription: string;
  marketplaceText: string;
  keywords: string[];
  hashtags: string[];
  shortDescription: string;
  longDescription: string;
}

export interface RichBlock {
  id: string;
  title: string;
  headline: string;
  body: string;
  visualIdea: string;
  imagePrompt: string;
  microCopy: string;
  composition: string;
  lighting: string;
  modelStyling: string;
  colorGrading: string;
}

export interface PromptPack {
  fashionPhoto: string;
  midjourney: string;
  flux: string;
  kling: string;
  grok: string;
  lifestyle: string;
  campaign: string;
}

export interface ReelShot {
  id: string;
  beat: string;
  shot: string;
  camera: string;
  transition: string;
}

export interface ReelsOutput {
  title: string;
  hook: string;
  idea: string;
  script: string;
  shots: ReelShot[];
  musicMood: string;
  campaignConcept: string;
}

export interface RichContentInput {
  printName: string;
  theme: string;
  style: string;
  idea: string;
}

export interface PromptLabInput {
  printName: string;
  theme: string;
  style: PromptStyle;
  idea: string;
}

export interface ReelsInput {
  printName: string;
  theme: string;
  style: string;
  idea: string;
}
