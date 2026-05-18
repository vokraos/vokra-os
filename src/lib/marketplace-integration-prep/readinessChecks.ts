import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import { gatherEconomicPressureContext } from "../economic-pressure";
import { gatherFboFbsDecisionContext } from "../fbo-fbs-decision/gather";
import { deriveFboFbsDecision } from "../fbo-fbs-decision/derive";
import { gatherFounderBriefContext } from "../founder-brief";
import { getOperatingRoleMode } from "../operating-role-mode";
import { buildProductionPressureReport } from "../production-pressure";
import { loadBundleForIntegrations } from "../unit-economics";
import type { ReadinessCheck, SyncReadinessLevel } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function runIntegrationReadinessChecks(t: TFn): ReadinessCheck[] {
  const snapshot = getActiveEntitySnapshot();
  const econCtx = gatherEconomicPressureContext();
  const ueBundle = loadBundleForIntegrations();
  const hasEconomics =
    Boolean(econCtx.snapshot) && (ueBundle.profiles.length > 0 || ueBundle.assignments.length > 0);

  let assortmentStable = false;
  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    const plan = buildAssortmentExecutionPlan(snapshot.id, merged);
    assortmentStable = plan.todayActions.length > 0 && plan.holdActions.length <= 2;
  }

  const fboCtx = gatherFboFbsDecisionContext(t);
  const fbo = deriveFboFbsDecision(fboCtx);
  const fboStable = fbo.readiness !== "blocked" && fbo.readiness !== "fragile" && fbo.decisionConfidence !== "low";

  const launchCtx = gatherFounderBriefContext();
  const launchStable =
    Boolean(launchCtx.launchPlan) &&
    launchCtx.launchPlan!.launchReadiness !== "blocked" &&
    launchCtx.launchPlan!.launchReadiness !== "fragile";

  const prod = buildProductionPressureReport(t);
  const prodConfigured =
    prod.productionState !== "blocked" && Boolean(prod.shiftRequirement?.reasonKey);

  const roleStable = Boolean(getOperatingRoleMode());

  return [
    {
      id: "snapshot_discipline",
      labelKey: "iready.check.snapshot",
      passed: Boolean(snapshot),
      detailKey: snapshot ? "iready.check.snapshot.ok" : "iready.check.snapshot.fail",
      navId: "dataImport",
    },
    {
      id: "economics_assigned",
      labelKey: "iready.check.economics",
      passed: hasEconomics,
      detailKey: hasEconomics ? "iready.check.economics.ok" : "iready.check.economics.fail",
      navId: "unitEconomics",
    },
    {
      id: "assortment_stable",
      labelKey: "iready.check.assortment",
      passed: assortmentStable,
      detailKey: assortmentStable ? "iready.check.assortment.ok" : "iready.check.assortment.fail",
      navId: "assortmentActions",
    },
    {
      id: "fbo_fbs_stable",
      labelKey: "iready.check.fbo",
      passed: fboStable,
      detailKey: fboStable ? "iready.check.fbo.ok" : "iready.check.fbo.fail",
      navId: "fboFbsDecision",
    },
    {
      id: "launch_workflows",
      labelKey: "iready.check.launch",
      passed: launchStable,
      detailKey: launchStable ? "iready.check.launch.ok" : "iready.check.launch.fail",
      navId: "launchOperations",
    },
    {
      id: "production_capacity",
      labelKey: "iready.check.production",
      passed: prodConfigured,
      detailKey: prodConfigured ? "iready.check.production.ok" : "iready.check.production.fail",
      navId: "productionPressure",
    },
    {
      id: "role_modes",
      labelKey: "iready.check.roles",
      passed: roleStable,
      detailKey: "iready.check.roles.ok",
      navId: "warRoom",
    },
  ];
}

export function deriveSyncReadinessLevel(checks: ReadinessCheck[]): SyncReadinessLevel {
  const passed = checks.filter((c) => c.passed).length;
  if (passed >= 7) return "ready_for_api_phase";
  if (passed >= 5) return "stable_for_partial_sync";
  if (passed >= 3) return "risky";
  return "not_ready";
}
