import type { NavId } from "../../types";
import type { GenerationModule } from "../memory/types";
import type { OperatingRoleMode } from "./types";

/** Always visible regardless of mode. */
export const ROLE_MODE_GLOBAL_NAV_IDS: readonly NavId[] = ["memory", "settings"] as const;

/** Primary nav per mode — order is sidebar priority. */
export const ROLE_MODE_NAV_ORDER: Record<OperatingRoleMode, readonly NavId[]> = {
  founder: [
    "warRoom",
    "morningStart",
    "eveningClose",
    "realUseTest",
    "integrationReadiness",
    "founderBrief",
    "controlTower",
    "missionControl",
    "dashboard",
    "scalingSafety",
    "economicPressure",
    "productionPressure",
    "launchOperations",
  ],
  operator: [
    "operatorMode",
    "productionPressure",
    "assortmentActions",
    "cardProduction",
    "visualProduction",
  ],
  production: [
    "productionPressure",
    "launchOperations",
    "marketplaceOperations",
  ],
  strategy: [
    "competitiveMap",
    "heroCommand",
    "corridorStrategy",
    "marketTiming",
    "launchOperations",
    "collectionBuilder",
    "assortmentActions",
  ],
};

export const ROLE_MODE_PRIORITY_NAV: Record<OperatingRoleMode, readonly NavId[]> = {
  founder: ["warRoom", "morningStart", "founderBrief", "controlTower"],
  operator: ["operatorMode", "productionPressure"],
  production: ["productionPressure"],
  strategy: ["competitiveMap"],
};

export const ROLE_MODE_DEFAULT_LANDING: Record<OperatingRoleMode, NavId> = {
  founder: "warRoom",
  operator: "operatorMode",
  production: "productionPressure",
  strategy: "competitiveMap",
};

const NAV_TO_MODE = new Map<NavId, OperatingRoleMode>();

function register(mode: OperatingRoleMode, ids: readonly NavId[]): void {
  for (const id of ids) {
    if (!NAV_TO_MODE.has(id)) NAV_TO_MODE.set(id, mode);
  }
}

for (const mode of Object.keys(ROLE_MODE_NAV_ORDER) as OperatingRoleMode[]) {
  register(mode, ROLE_MODE_NAV_ORDER[mode]);
}

/** Nav ids that belong to a mode (for filtering). */
export function getRoleModeNavSet(mode: OperatingRoleMode): ReadonlySet<NavId> {
  return new Set(ROLE_MODE_NAV_ORDER[mode]);
}

export function getRoleModeForNavId(navId: NavId): OperatingRoleMode | null {
  return NAV_TO_MODE.get(navId) ?? null;
}

export function isNavVisibleInRoleMode(navId: NavId, mode: OperatingRoleMode, active?: NavId): boolean {
  if ((ROLE_MODE_GLOBAL_NAV_IDS as readonly NavId[]).includes(navId)) return true;
  if (active && navId === active) return true;
  return getRoleModeNavSet(mode).has(navId);
}

const MODULE_TO_MODE = new Map<GenerationModule, OperatingRoleMode>();

function regModules(mode: OperatingRoleMode, modules: GenerationModule[]): void {
  for (const m of modules) MODULE_TO_MODE.set(m, mode);
}

regModules("founder", [
  "founder_brief",
  "daily_war_room",
  "morning_flow",
  "evening_close",
  "real_use_test",
  "integration_readiness",
  "control_tower",
  "economic_pressure",
  "unit_economics",
  "advertising_pressure",
  "scaling_safety",
  "fbo_fbs_decision",
  "os_health_audit",
  "guided_setup",
  "runtime_smoke_test",
  "release_check",
  "daily_operations_pilot",
  "daily_pilot_debrief",
  "simplification_backlog",
  "clean_day_mode",
]);

regModules("operator", [
  "operator_brief",
  "execution_feedback",
  "production_daily_plan",
  "assortment_actions",
  "card_production",
  "visual_production",
]);

regModules("production", [
  "production_pressure",
  "production_shift_feedback",
  "launch_operations",
  "launch_review",
  "marketplace_operations",
]);

regModules("strategy", [
  "competitive_map",
  "competitor_serp",
  "hero_improvement_plan",
  "competitive_gap_analysis",
  "hero_archetype_intelligence",
  "hero_readability_intelligence",
  "hero_fatigue_intelligence",
  "hero_battle_plan",
  "hero_test_matrix",
  "hero_test_results",
  "hero_launch_package",
  "hero_post_launch_observation",
  "hero_command",
  "corridor_strategy",
  "market_timing",
  "collection_builder",
]);

export function getRoleModeForModule(module: GenerationModule): OperatingRoleMode | null {
  return MODULE_TO_MODE.get(module) ?? null;
}

export function getRoleModeForModuleNav(navId: NavId): OperatingRoleMode | null {
  return getRoleModeForNavId(navId);
}
