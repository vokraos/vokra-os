import type { OsReportWarmupState, WarmupReportId } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export type WarmupStripTone = "ok" | "warn" | "error" | "muted";

export function warmupStripTone(state: OsReportWarmupState | null): WarmupStripTone {
  if (!state || state.status === "idle") return "muted";
  if (state.status === "warming") return "muted";
  if (state.status === "failed") return "error";
  if (state.status === "partial" || state.failedReports.length > 0) return "warn";
  return "ok";
}

export function formatWarmupStripMessage(state: OsReportWarmupState | null, t: TFn): string {
  if (!state) return t("warmup.strip.never");
  if (state.confidenceNote === "warmup.confidence.cooldown") {
    return t("warmup.strip.cooldown");
  }
  if (state.status === "warming") return t("warmup.strip.warming");
  if (state.status === "complete") return t("warmup.strip.complete");
  if (state.status === "partial") {
    if (state.failedReports.length) {
      const first = state.failedReports[0]!;
      return t("warmup.strip.partialFailed", { report: t(`warmup.report.${first}`) });
    }
    return t("warmup.strip.partial");
  }
  if (state.status === "failed") {
    const first = state.failedReports[0] ?? "production_pressure";
    return t("warmup.strip.failed", { report: t(`warmup.report.${first}`) });
  }
  return t(state.confidenceNote);
}

export function formatWarmupFailedHint(state: OsReportWarmupState | null, t: TFn): string | null {
  if (!state?.failedReports.length) return null;
  const lines = state.failedReports.slice(0, 3).map((id) => t(`warmup.hint.${id}`));
  return lines.join(" · ");
}

export function listStaleCacheReportIds(maxAgeMs: number): WarmupReportId[] {
  const now = Date.now();
  const stale: WarmupReportId[] = [];
  const checks: { id: WarmupReportId; savedAt: number | undefined }[] = [
    { id: "economic_pressure", savedAt: peekSavedAt("economic") },
    { id: "scaling_safety", savedAt: peekSavedAt("scaling") },
    { id: "production_pressure", savedAt: peekSavedAt("production") },
    { id: "war_room", savedAt: peekSavedAt("war") },
  ];
  for (const c of checks) {
    if (!c.savedAt || now - c.savedAt > maxAgeMs) stale.push(c.id);
  }
  return stale;
}

function peekSavedAt(kind: string): number | undefined {
  try {
    if (kind === "economic") {
      const raw = sessionStorage.getItem("vokra.economicPressure.state");
      return raw ? (JSON.parse(raw) as { savedAt?: number }).savedAt : undefined;
    }
    if (kind === "scaling") {
      const raw = sessionStorage.getItem("vokra.scalingSafety.state");
      return raw ? (JSON.parse(raw) as { savedAt?: number }).savedAt : undefined;
    }
    if (kind === "production") {
      const raw = sessionStorage.getItem("vokra.productionPressure.state");
      return raw ? (JSON.parse(raw) as { savedAt?: number }).savedAt : undefined;
    }
    if (kind === "war") {
      const raw = sessionStorage.getItem("vokra.dailyWarRoom.last.v1");
      return raw ? (JSON.parse(raw) as { savedAt?: number }).savedAt : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
