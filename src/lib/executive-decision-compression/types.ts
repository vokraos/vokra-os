/** Executive decision compression — presentation layer over existing OS state (no new engines). */

export type ExecutiveDecisionBoard = {
  /** Top 3 concrete moves */
  readonly actions: readonly string[];
  /** Top 3 downside / exposure lines */
  readonly risks: readonly string[];
  /** Top 3 “do not” rules */
  readonly forbidden: readonly string[];
  /** Single best move */
  readonly bestNext: string;
  /** Why this matters now */
  readonly whyNow: string;
  /** Expected upside / outcome */
  readonly expectedImpact: string;
  /** When to act */
  readonly timeWindow: string;
  /** One line: margin / throughput leak (from resource pressure) */
  readonly leakLine: string;
  /** Primary execution bottleneck: route blocker > leak summary */
  readonly bottleneck: string;
  /** Launch / execution confidence / drag — compact for executive surfaces */
  readonly readinessLine: string;
};
