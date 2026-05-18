import { loadProductionShiftFeedbackState } from "./shift-feedback-store";
import type {
  CapacityMismatchType,
  ProductionShiftLearningSummary,
} from "./shift-feedback-types";

const REPEAT_THRESHOLD = 2;

const MISMATCH_TO_DIGEST: Record<
  Exclude<CapacityMismatchType, "none">,
  { key: string; metricKey: string }
> = {
  packaging_underestimated: {
    key: "prod.learn.digest.packaging",
    metricKey: "prod.learn.metric.packaging",
  },
  fbo_prep_underestimated: {
    key: "prod.learn.digest.fbo",
    metricKey: "prod.learn.metric.fbo",
  },
  visual_jobs_underestimated: {
    key: "prod.learn.digest.visual",
    metricKey: "prod.learn.metric.visual",
  },
  card_jobs_underestimated: {
    key: "prod.learn.digest.cards",
    metricKey: "prod.learn.metric.cards",
  },
  launch_load_underestimated: {
    key: "prod.learn.digest.launch",
    metricKey: "prod.learn.metric.launch",
  },
  blocked_tasks_underestimated: {
    key: "prod.learn.digest.blocked",
    metricKey: "prod.learn.metric.blocked",
  },
};

const MISMATCH_TO_RECO: Record<Exclude<CapacityMismatchType, "none">, string[]> = {
  packaging_underestimated: [
    "prod.learn.reco.packagingSafe",
    "prod.learn.reco.reduceLaunchPack",
  ],
  fbo_prep_underestimated: ["prod.learn.reco.fboSafe", "prod.learn.reco.fboPrepDayEarlier"],
  visual_jobs_underestimated: ["prod.learn.reco.visualSafe", "prod.learn.reco.visualContentDay"],
  card_jobs_underestimated: ["prod.learn.reco.cardSafe", "prod.learn.reco.trimCardDrafts"],
  launch_load_underestimated: ["prod.learn.reco.launchSafe", "prod.learn.reco.launchDayEarlier"],
  blocked_tasks_underestimated: ["prod.learn.reco.unblockFirst", "prod.learn.reco.blockedBuffer"],
};

const MISMATCH_TO_SHIFT_HINT: Record<Exclude<CapacityMismatchType, "none">, string> = {
  packaging_underestimated: "prod.learn.shift.launchDay",
  fbo_prep_underestimated: "prod.learn.shift.fboPrepDay",
  visual_jobs_underestimated: "prod.learn.shift.visualDay",
  card_jobs_underestimated: "prod.learn.shift.strongOrVisual",
  launch_load_underestimated: "prod.learn.shift.launchDay",
  blocked_tasks_underestimated: "prod.learn.shift.reduceBatch",
};

const MISMATCH_TO_RELIABILITY: Record<Exclude<CapacityMismatchType, "none">, string> = {
  packaging_underestimated: "prod.learn.reliability.packaging",
  fbo_prep_underestimated: "prod.learn.reliability.fbo",
  visual_jobs_underestimated: "prod.learn.reliability.visual",
  card_jobs_underestimated: "prod.learn.reliability.cards",
  launch_load_underestimated: "prod.learn.reliability.launch",
  blocked_tasks_underestimated: "prod.learn.reliability.blocked",
};

function countMismatches(): Map<CapacityMismatchType, number> {
  const counts = new Map<CapacityMismatchType, number>();
  const entries = loadProductionShiftFeedbackState().entries;
  for (const e of entries) {
    if (e.capacityMismatch === "none") continue;
    counts.set(e.capacityMismatch, (counts.get(e.capacityMismatch) ?? 0) + 1);
  }
  return counts;
}

export function getProductionShiftLearning(): ProductionShiftLearningSummary {
  const counts = countMismatches();
  let top: CapacityMismatchType | null = null;
  let topCount = 0;
  for (const [k, v] of counts) {
    if (v > topCount) {
      top = k;
      topCount = v;
    }
  }

  if (!top || top === "none" || topCount < REPEAT_THRESHOLD) {
    return {
      repeatedMismatch: null,
      repeatCount: 0,
      digestLineKey: null,
      digestLineVars: {},
      recommendationKeys: [],
      reliabilityNoteKey: null,
      nextShiftHintKey: null,
    };
  }

  const digest = MISMATCH_TO_DIGEST[top];
  return {
    repeatedMismatch: top,
    repeatCount: topCount,
    digestLineKey: digest.key,
    digestLineVars: { metric: digest.metricKey, count: String(topCount) },
    recommendationKeys: MISMATCH_TO_RECO[top] ?? [],
    reliabilityNoteKey: MISMATCH_TO_RELIABILITY[top] ?? null,
    nextShiftHintKey: MISMATCH_TO_SHIFT_HINT[top] ?? null,
  };
}

export function learningBiasesMismatch(mismatch: CapacityMismatchType): boolean {
  const learning = getProductionShiftLearning();
  return learning.repeatedMismatch === mismatch && learning.repeatCount >= REPEAT_THRESHOLD;
}
