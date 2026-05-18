import type { ProductionBottleneck, ProductionPressureGatherContext } from "./types";

function packagingLoad(ctx: ProductionPressureGatherContext): number {
  return Math.min(100, ctx.orchestrationPackaging + ctx.cardDraftCount * 8);
}

export function deriveOperatorBottlenecks(ctx: ProductionPressureGatherContext): ProductionBottleneck[] {
  const out: ProductionBottleneck[] = [];

  if (ctx.feedbackSignals.delayedCount >= 2) {
    out.push({
      id: "operator-delays",
      labelKey: "prod.bottleneck.operatorDelays",
      labelVars: { n: String(ctx.feedbackSignals.delayedCount) },
      severity: ctx.feedbackSignals.delayedCount >= 4 ? "high" : "medium",
    });
  }

  if (ctx.feedbackSignals.blockedCount >= 2) {
    out.push({
      id: "operator-blocks",
      labelKey: "prod.bottleneck.operatorBlocks",
      labelVars: { n: String(ctx.feedbackSignals.blockedCount) },
      severity: "high",
    });
  }

  if (packagingLoad(ctx) >= 55) {
    out.push({
      id: "packaging",
      labelKey: "prod.bottleneck.packaging",
      labelVars: { n: String(ctx.cardDraftCount) },
      severity: "high",
    });
  }

  if (ctx.visualQueueCount >= 4) {
    out.push({
      id: "print-queue",
      labelKey: "prod.bottleneck.printQueue",
      labelVars: { n: String(ctx.visualQueueCount) },
      severity: ctx.visualQueueCount >= 8 ? "high" : "medium",
    });
  }

  return out.slice(0, 5);
}
