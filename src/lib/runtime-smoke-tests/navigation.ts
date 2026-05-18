import { flattenSidebarNavIds } from "../../components/sidebarNavStructure";
import type { NavId } from "../../types";
import { ALL_GENERATION_MODULES } from "../memory/types";
import { moduleNavTarget } from "../memory/service";
import { ROLE_MODE_NAV_ORDER } from "../operating-role-mode/navMap";
import type { OperatingRoleMode } from "../operating-role-mode/types";

const ALL_NAV_SET: ReadonlySet<NavId> = new Set(flattenSidebarNavIds());

export function assertRoleNavMapsReferenceKnownNavIds(): void {
  const modes = Object.keys(ROLE_MODE_NAV_ORDER) as OperatingRoleMode[];
  for (const mode of modes) {
    for (const id of ROLE_MODE_NAV_ORDER[mode]) {
      if (!ALL_NAV_SET.has(id)) {
        throw new Error(`ROLE_MODE_NAV_ORDER[${mode}] references unknown NavId: ${id}`);
      }
    }
  }
}

export function assertMemoryModuleNavTargetsResolve(): void {
  const seen = new Set<NavId>();
  for (const mod of ALL_GENERATION_MODULES) {
    const target = moduleNavTarget(mod);
    if (!ALL_NAV_SET.has(target)) {
      throw new Error(`moduleNavTarget(${mod}) → ${target} is not in sidebar nav`);
    }
    seen.add(target);
  }
  void seen;
}
