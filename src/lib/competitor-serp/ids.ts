export function newSerpSnapshotId(): string {
  return `serp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function serpItemId(snapshotId: string, position: number, title: string): string {
  const s = `${snapshotId}|${position}|${title}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `si_${(h >>> 0).toString(36)}`;
}
