export function newHeroCommandId(): string {
  return `hcmd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
