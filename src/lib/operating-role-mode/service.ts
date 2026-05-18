import type { NavId } from "../../types";
import type { GenerationModule } from "../memory/types";
import { flattenSidebarNavIds } from "../../components/sidebarNavStructure";
import {
  getRoleModeForModule,
  getRoleModeForNavId,
  ROLE_MODE_GLOBAL_NAV_IDS,
  ROLE_MODE_NAV_ORDER,
} from "./navMap";
import { scheduleOsReportWarmup } from "../os-report-warmup";
import { loadOperatingRoleMode, saveOperatingRoleMode } from "./storage";
import { OPERATING_ROLE_MODE_EVENT, type OperatingRoleMode } from "./types";

export function getOperatingRoleMode(): OperatingRoleMode {
  return loadOperatingRoleMode();
}

export function setOperatingRoleMode(mode: OperatingRoleMode): void {
  if (loadOperatingRoleMode() === mode) return;
  saveOperatingRoleMode(mode);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPERATING_ROLE_MODE_EVENT));
    scheduleOsReportWarmup({ reason: "role_switch" });
  }
}

/** Switch mode when navigating to a module outside current focus (memory reopen, goNav). */
export function alignRoleModeForNav(navId: NavId): void {
  const target = getRoleModeForNavId(navId);
  if (target && target !== getOperatingRoleMode()) {
    setOperatingRoleMode(target);
  }
}

export function alignRoleModeForModule(module: GenerationModule): void {
  const target = getRoleModeForModule(module);
  if (target && target !== getOperatingRoleMode()) {
    setOperatingRoleMode(target);
  }
}

export type SidebarNavLayout = {
  primaryIds: NavId[];
  moreIds: NavId[];
};

export function buildSidebarNavLayout(mode: OperatingRoleMode, active: NavId): SidebarNavLayout {
  const all = flattenSidebarNavIds();
  const roleOrder = ROLE_MODE_NAV_ORDER[mode];
  const globalSet = new Set(ROLE_MODE_GLOBAL_NAV_IDS);

  const primaryIds: NavId[] = [];
  for (const id of roleOrder) {
    if (all.includes(id)) primaryIds.push(id);
  }
  if (active !== "home" && all.includes(active) && !primaryIds.includes(active) && !globalSet.has(active)) {
    primaryIds.push(active);
  }

  const primarySet = new Set(primaryIds);
  const moreIds = all.filter((id) => !primarySet.has(id) && !globalSet.has(id));

  return { primaryIds, moreIds };
}

export function subscribeOperatingRoleMode(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const fn = () => listener();
  window.addEventListener(OPERATING_ROLE_MODE_EVENT, fn);
  return () => window.removeEventListener(OPERATING_ROLE_MODE_EVENT, fn);
}
