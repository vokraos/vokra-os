import type { ObservationLabel } from "./types";

export const OBSERVATION_LABELS: readonly ObservationLabel[] = [
  "improved",
  "stable",
  "weakened",
  "uncertain",
] as const;

export function formatObservationField(
  label: ObservationLabel,
  detail: string,
  t: (key: string) => string,
): string {
  const base = t(`hplo.label.${label}`);
  const d = detail.trim();
  return d ? `${base} · ${d}` : base;
}

export function parseObservationLabel(value: string): ObservationLabel {
  const v = value.trim().toLowerCase();
  if (v === "improved" || v === "stable" || v === "weakened" || v === "uncertain") return v;
  return "uncertain";
}
