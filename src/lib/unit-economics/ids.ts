export function newUnitEconomicsProfileId(): string {
  return `ue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newUnitEconomicsTemplateId(): string {
  return `uet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newUnitEconomicsAssignmentId(): string {
  return `uea-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
