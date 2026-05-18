/**
 * Live State System — executive cognition in motion (not decorative).
 * Drives rhythm, tension, and shell variables; keep motion subtle and cheap.
 */

import type { NavId } from "../../types";

/** UX-facing regime (maps from market synthesis + contour pressure). */
export type ExecutiveRegimeProfile =
  | "expansion"
  | "recovery"
  | "premium_defense"
  | "observation"
  | "silent_accumulation";

/** Per-module nervous-system posture for chrome only. */
export type ModuleLiveActivity = "active" | "overloaded" | "stable" | "learning" | "blocked" | "dormant";

/** Slow inhale/exhale of the executive layer (0–1 phase). */
export type ExecutiveBreath = {
  phase01: number;
  periodSec: number;
  microcopyRu: string;
};

/** Single contour pulse — edge energy and propagation tempo. */
export type CognitivePulse = {
  edgeGlow01: number;
  propagationSec: number;
};

/** Global tempo (CSS / SVG durations derive from this). */
export type SystemRhythm = {
  periodSec: number;
  tempoLabelRu: "спокойный" | "средний" | "напряжённый";
};

/** Pressure as a slow wave (amplitude + direction of change). */
export type PressureWave = {
  amplitude01: number;
  velocitySigned: number;
};

/** Where attention is pulled in the contour (synthetic vector). */
export type AttentionShift = {
  focusX01: number;
  focusY01: number;
  captionRu: string;
};

/** Confidence settling vs drift toward risk. */
export type ConfidenceDrift = {
  deltaSigned: number;
  settling01: number;
  captionRu: string;
};

/** Strategic pull between opportunity and risk surfaces. */
export type StrategicTension = {
  index01: number;
  driversRu: readonly string[];
};

/** Stability inertia vs recovery pull. */
export type StabilityFlow = {
  inertia01: number;
  recoveryBias01: number;
  captionRu: string;
};

/** How the executive profile sits in motion space. */
export type RegimeTransition = {
  profile: ExecutiveRegimeProfile;
  motionIntensity01: number;
  labelRu: string;
};

/** Aggregated live snapshot for one cognitive pulse. */
export type LiveState = {
  pulseGeneration: number;
  executiveBreath: ExecutiveBreath;
  cognitivePulse: CognitivePulse;
  systemRhythm: SystemRhythm;
  pressureWave: PressureWave;
  attentionShift: AttentionShift;
  confidenceDrift: ConfidenceDrift;
  strategicTension: StrategicTension;
  stabilityFlow: StabilityFlow;
  regimeTransition: RegimeTransition;
  /** Strip: secondary intelligence line (temporal / fatigue / directive drift). */
  stripSecondaryRu: string;
  /** Strip: micro warning when tension or overload is elevated. */
  stripWarningRu: string | null;
  /** Multipliers / durations for SVG + CSS (no heavy effects). */
  signalMotionSec: number;
  fabricHazeOpacityMul: number;
  fabricPathOpacityMul: number;
  /** Phase 4 — ambient organism + market weather (chrome only). */
  strategicOrganism: {
    weatherId: string;
    /** Phase 8 — weather 3.0 (topology / silence / sharpness driver). */
    weather3Id: string;
    pulseMessageKey: string;
  };
  /** Phase 8 — expensive quiet zones in chrome (0–1, higher = more restraint). */
  executiveSilence01: number;
};

export type LiveShellCssVars = {
  "--live-breath": string;
  "--live-tension": string;
  "--live-pressure": string;
  "--live-confidence": string;
  "--live-fatigue": string;
  "--live-haze-sec": string;
  "--live-field-opacity": string;
  "--live-spine-pulse-sec": string;
  "--live-strip-shimmer": string;
  /** Phase 4 — organism layer (0–1 glow, contrast / sat multipliers for shell). */
  "--live-organism-glow": string;
  "--live-weather-contrast": string;
  "--live-weather-sat": string;
  /** Phase 8 — weather 3.0 shell scalars (no extra widgets). */
  "--live-topology-emphasis": string;
  "--live-signal-sharpness": string;
  "--live-executive-silence": string;
  "--live-motion-cadence": string;
};

export type ModuleLiveMap = Record<NavId, ModuleLiveActivity>;
