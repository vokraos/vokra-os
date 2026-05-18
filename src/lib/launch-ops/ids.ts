export function newLaunchPlanId(): string {
  return `lops_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
