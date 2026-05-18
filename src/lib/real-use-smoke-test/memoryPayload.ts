import { REAL_USE_TEST_MEMORY_SCHEMA, type RealUseSmokeTest, type RealUseTestMemoryPayload } from "./types";
import type { StoredSmokeTestState } from "./store";

export function buildRealUseTestMemoryPayload(
  test: RealUseSmokeTest,
  state: StoredSmokeTestState,
): RealUseTestMemoryPayload {
  return {
    schema: REAL_USE_TEST_MEMORY_SCHEMA,
    savedAt: Date.now(),
    test,
    founderNotes: {
      observedFriction: state.observedFriction,
      usefulScreens: state.usefulScreens,
      confusingScreens: state.confusingScreens,
      missingData: state.missingData,
      finalVerdict: state.finalVerdict,
    },
  };
}

export function parseRealUseTestMemoryPayload(raw: string): RealUseTestMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const p = o as RealUseTestMemoryPayload;
    if (p.schema !== REAL_USE_TEST_MEMORY_SCHEMA || !p.test?.id) return null;
    return p;
  } catch {
    return null;
  }
}
