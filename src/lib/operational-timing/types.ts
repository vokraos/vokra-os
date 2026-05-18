/**
 * Derived operational timing posture — no calendar, no autonomous planning.
 * Composed from route/stage state, initiative contour, temporal decay, and resource pressure.
 */

export type OperationalTimingState =
  | "active"
  | "waiting"
  | "cooling"
  | "stale"
  | "overloaded"
  | "synchronized"
  | "delayed"
  | "expired";

/** Buckets for surfacing Executive Memory patterns as timing-relevant truths (static map only). */
export type TemporalPatternCategory =
  | "timing_mistake"
  | "early_scale"
  | "late_reaction"
  | "promo_overextension"
  | "launch_decay";
