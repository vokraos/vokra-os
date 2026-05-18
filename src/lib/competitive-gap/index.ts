export type {
  OurCardCompetitiveSnapshot,
  CompetitiveGapAnalysis,
  CompetitiveGapAnalysisMemoryPayload,
} from "./types";
export { COMPETITIVE_GAP_ANALYSIS_MEMORY_SCHEMA } from "./types";
export { newOurCardSnapshotId, newCompetitiveGapAnalysisId } from "./ids";
export { deriveCompetitiveGapAnalysis } from "./derive";
export { parseCompetitiveGapAnalysisMemoryPayload, buildCompetitiveGapAnalysisMemoryPayload } from "./memoryPayload";
export { saveGapMapSession, consumeGapMapSession, primeSessionsFromGapMemoryPayload, type GapMapSessionState } from "./mapSession";
export { buildOurCardSnapshot, snapshotToFormFields, type OurCardFormFields } from "./snapshotForm";
export { mergeHeroPlanWithGap } from "./mergeHeroPlan";
export { pushGapAnalysisToComposer } from "./composerBridge";
export { appendGapAnalysisVisualJob } from "./visualBridge";
