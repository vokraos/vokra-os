export function newOurCardSnapshotId(): string {
  return `occ_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newCompetitiveGapAnalysisId(): string {
  return `cga_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
