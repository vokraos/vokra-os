/**
 * Derived business effect posture — not accounting, not ERP metrics.
 */

export type BusinessImpactState =
  | "leverage"
  | "drag"
  | "saturation"
  | "recovery"
  | "decay"
  | "stabilization"
  | "acceleration"
  | "erosion";

export type ImpactMemoryCategory =
  | "leverage_structures"
  | "drag_patterns"
  | "scaling_erosion"
  | "stabilization_successes";
