import type { NavId } from "../types";

/** Product hierarchy: core daily OS → strategic depth → workbench → ops/meta. Order is intentional. */
export const SIDEBAR_GROUPS: readonly {
  readonly key: string;
  readonly labelKey: string;
  /** `<details open>` when true — core + work stay open; strategic + ops start collapsed to reduce load. */
  readonly defaultOpen: boolean;
  readonly ids: readonly NavId[];
}[] = [
  {
    key: "core",
    labelKey: "nav.group.core",
    defaultOpen: true,
    ids: [
      "dashboard",
      "founderBrief",
      "warRoom",
      "morningStart",
      "eveningClose",
      "realUseTest",
      "integrationReadiness",
      "economicPressure",
      "unitEconomics",
      "advertisingPressure",
      "scalingSafety",
      "productionPressure",
      "fboFbsDecision",
      "corridorStrategy",
      "marketTiming",
      "controlTower",
      "osHealthAudit",
      "guidedSetup",
      "operatorMode",
      "missionControl",
      "executiveIntelligence",
      "executionOrchestrator",
      "signalFabric",
      "organismModel",
      "command",
    ],
  },
  {
    key: "strategic",
    labelKey: "nav.group.strategic",
    defaultOpen: false,
    ids: [
      "temporalStrategy",
      "strategicSimulation",
      "trends",
      "brandEvolution",
      "executiveMemory",
      "strategyEvolution",
      "executionPlanner",
      "feedbackLoop",
      "competitors",
    ],
  },
  {
    key: "work",
    labelKey: "nav.group.work",
    defaultOpen: true,
    ids: [
      "seo",
      "rich",
      "prompts",
      "promptComposer",
      "promptPack",
      "visualProduction",
      "visualAssets",
      "cardProduction",
      "marketplaceOperations",
      "skuIntelligence",
      "competitiveMap",
      "heroCommand",
      "launchOperations",
      "ingestionReadiness",
      "dataImport",
      "entityFusion",
      "dataCleanup",
      "assortmentActions",
      "reels",
      "campaign",
      "collectionBuilder",
      "visualStrategy",
      "visual",
      "dna",
      "operations",
      "operationsBrief",
    ],
  },
  {
    key: "ops",
    labelKey: "nav.group.ops",
    defaultOpen: false,
    ids: ["safeMode", "releaseCheck", "dailyPilot", "pilotDebrief", "osSimplification", "systemSmokeTest", "memory", "analytics", "settings"],
  },
] as const;

export function flattenSidebarNavIds(): NavId[] {
  return SIDEBAR_GROUPS.flatMap((g) => [...g.ids]);
}
