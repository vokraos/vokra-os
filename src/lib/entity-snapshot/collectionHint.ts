export const SNAPSHOT_COLLECTION_HINT_KEY = "vokra.snapshotCollectionHint.v1" as const;

export type SnapshotCollectionHintKind = "largest_corridor" | "refresh_seo_wave" | "fbo_capsule";

export type SnapshotCollectionHint = {
  kind: SnapshotCollectionHintKind;
  corridor?: string;
  noteKey?: string;
  savedAt: number;
};

export function writeSnapshotCollectionHint(input: Omit<SnapshotCollectionHint, "savedAt">): void {
  try {
    const full: SnapshotCollectionHint = { ...input, savedAt: Date.now() };
    sessionStorage.setItem(SNAPSHOT_COLLECTION_HINT_KEY, JSON.stringify(full));
  } catch {
    /* quota */
  }
}

export function readSnapshotCollectionHint(): SnapshotCollectionHint | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_COLLECTION_HINT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as SnapshotCollectionHint;
    if (!o || typeof o !== "object") return null;
    if (o.kind !== "largest_corridor" && o.kind !== "refresh_seo_wave" && o.kind !== "fbo_capsule") return null;
    return o;
  } catch {
    return null;
  }
}

export function clearSnapshotCollectionHint(): void {
  try {
    sessionStorage.removeItem(SNAPSHOT_COLLECTION_HINT_KEY);
  } catch {
    /* ignore */
  }
}
