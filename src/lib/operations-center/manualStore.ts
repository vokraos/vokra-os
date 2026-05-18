import { lsGet, lsSet } from "../storage";
import type { ManualOperationalBrief } from "./types";
import { OPERATIONS_CENTER_SCHEMA_VERSION } from "./types";
import { OPERATIONS_MANUAL_STORAGE_KEY } from "./keys";

const DEFAULT: ManualOperationalBrief = {
  schemaVersion: OPERATIONS_CENTER_SCHEMA_VERSION,
  prioritySkus: "",
  runwayNotes: "",
  productionBottleneckNote: "",
  productionPressureManual: null,
  categoryOverloadManual: null,
  adLoadManual: null,
  updatedAt: 0,
};

function clamp01(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function loadManualBrief(): ManualOperationalBrief {
  try {
    const raw = lsGet(OPERATIONS_MANUAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const p = JSON.parse(raw) as Partial<ManualOperationalBrief>;
    if (p.schemaVersion !== OPERATIONS_CENTER_SCHEMA_VERSION) return { ...DEFAULT };
    return {
      schemaVersion: OPERATIONS_CENTER_SCHEMA_VERSION,
      prioritySkus: typeof p.prioritySkus === "string" ? p.prioritySkus : "",
      runwayNotes: typeof p.runwayNotes === "string" ? p.runwayNotes : "",
      productionBottleneckNote: typeof p.productionBottleneckNote === "string" ? p.productionBottleneckNote : "",
      productionPressureManual:
        typeof p.productionPressureManual === "number" && Number.isFinite(p.productionPressureManual)
          ? clamp01(p.productionPressureManual)
          : null,
      categoryOverloadManual:
        typeof p.categoryOverloadManual === "number" && Number.isFinite(p.categoryOverloadManual)
          ? clamp01(p.categoryOverloadManual)
          : null,
      adLoadManual:
        typeof p.adLoadManual === "number" && Number.isFinite(p.adLoadManual) ? clamp01(p.adLoadManual) : null,
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : 0,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveManualBrief(brief: Omit<ManualOperationalBrief, "schemaVersion" | "updatedAt">) {
  const next: ManualOperationalBrief = {
    schemaVersion: OPERATIONS_CENTER_SCHEMA_VERSION,
    ...brief,
    updatedAt: Date.now(),
  };
  lsSet(OPERATIONS_MANUAL_STORAGE_KEY, JSON.stringify(next));
  return next;
}
