import type { EntityLifecycleState } from "./types";

/** i18n key for corridor alive-state (vars: corridor from caller). */
export function corridorLifecycleMessageKey(state: EntityLifecycleState): string {
  return `depth.entity7.lifecycle.corridor.${state}`;
}

export function skuLifecycleMessageKey(state: EntityLifecycleState): string {
  return `depth.entity7.lifecycle.sku.${state}`;
}
