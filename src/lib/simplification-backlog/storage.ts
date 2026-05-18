import { lsGet, lsSet } from "../storage";
import type {
  SimplificationBacklogItem,
  SimplificationBacklogState,
  SimplificationEffort,
  SimplificationItemStatus,
  SimplificationItemType,
  SimplificationSeverity,
} from "./types";
import type { NavId } from "../../types";
import { deriveSimplificationItemsFromDebrief, itemFingerprint } from "./derive";
import type { DailyPilotDebrief } from "../daily-pilot-debrief/types";

export const SIMPLIFICATION_BACKLOG_STORAGE_KEY = "vokra.simplificationBacklog.v1" as const;
export const SIMPLIFICATION_BACKLOG_RESTORE_SESSION_KEY = "vokra.simplificationBacklog.restore.v1" as const;
export const SIMPLIFICATION_BACKLOG_CHANGED_EVENT = "vokra.simplificationBacklog.changed" as const;

const ITEM_TYPES: readonly SimplificationItemType[] = [
  "hide_from_daily",
  "rename",
  "compress",
  "move_up",
  "remove_duplicate",
  "wording",
  "navigation",
  "workflow_fix",
  "data_gap",
] as const;

const SEVERITIES: readonly SimplificationSeverity[] = ["low", "medium", "high", "critical"] as const;
const EFFORTS: readonly SimplificationEffort[] = ["small", "medium", "large"] as const;
const STATUSES: readonly SimplificationItemStatus[] = ["open", "accepted", "done", "deferred", "rejected"] as const;

function sanitizeType(x: unknown): SimplificationItemType {
  return typeof x === "string" && (ITEM_TYPES as readonly string[]).includes(x) ? (x as SimplificationItemType) : "wording";
}

function sanitizeSeverity(x: unknown): SimplificationSeverity {
  return typeof x === "string" && (SEVERITIES as readonly string[]).includes(x) ? (x as SimplificationSeverity) : "medium";
}

function sanitizeEffort(x: unknown): SimplificationEffort {
  return typeof x === "string" && (EFFORTS as readonly string[]).includes(x) ? (x as SimplificationEffort) : "small";
}

function sanitizeStatus(x: unknown): SimplificationItemStatus {
  return typeof x === "string" && (STATUSES as readonly string[]).includes(x) ? (x as SimplificationItemStatus) : "open";
}

function sanitizeItem(raw: unknown): SimplificationBacklogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<SimplificationBacklogItem>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.createdAt !== "number" || !Number.isFinite(o.createdAt)) return null;
  if (typeof o.sourceDebriefId !== "string") return null;
  if (typeof o.sourcePilotId !== "string") return null;
  const affected =
    typeof o.affectedModule === "string" && o.affectedModule.length > 0 ? (o.affectedModule as NavId) : "";
  return {
    id: o.id.trim(),
    createdAt: o.createdAt,
    sourceDebriefId: o.sourceDebriefId,
    sourcePilotId: o.sourcePilotId,
    itemType: sanitizeType(o.itemType),
    title: typeof o.title === "string" ? o.title : "",
    reason: typeof o.reason === "string" ? o.reason : "",
    affectedModule: affected,
    severity: sanitizeSeverity(o.severity),
    effort: sanitizeEffort(o.effort),
    status: sanitizeStatus(o.status),
    suggestedFix: typeof o.suggestedFix === "string" ? o.suggestedFix : "",
    confidenceNote: typeof o.confidenceNote === "string" ? o.confidenceNote : "",
  };
}

export function parseSimplificationBacklogPayload(raw: string): SimplificationBacklogState | null {
  try {
    const o = JSON.parse(raw) as Partial<SimplificationBacklogState>;
    if (!o || typeof o !== "object") return null;
    const itemsIn = Array.isArray(o.items) ? o.items : [];
    const items: SimplificationBacklogItem[] = [];
    for (const row of itemsIn) {
      const it = sanitizeItem(row);
      if (it) items.push(it);
    }
    const updatedAt =
      typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt) ? o.updatedAt : Date.now();
    return { items, updatedAt };
  } catch {
    return null;
  }
}

export function loadSimplificationBacklogState(): SimplificationBacklogState | null {
  const raw = lsGet(SIMPLIFICATION_BACKLOG_STORAGE_KEY);
  if (!raw?.trim()) return null;
  return parseSimplificationBacklogPayload(raw);
}

export function saveSimplificationBacklogState(state: SimplificationBacklogState) {
  lsSet(SIMPLIFICATION_BACKLOG_STORAGE_KEY, JSON.stringify(state));
}

export function notifySimplificationBacklogChanged() {
  try {
    window.dispatchEvent(new Event(SIMPLIFICATION_BACKLOG_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

type TFn = (key: string, vars?: Record<string, string>) => string;

/** Appends derived items; skips fingerprint duplicates unless previous item was rejected. */
export function mergeDerivedSimplificationItemsFromDebrief(debrief: DailyPilotDebrief, t: TFn): number {
  const incoming = deriveSimplificationItemsFromDebrief(debrief, t);
  const prev = loadSimplificationBacklogState();
  const items = prev?.items ? [...prev.items] : [];
  const blocked = new Set(
    items.filter((i) => i.status !== "rejected").map((i) => itemFingerprint(i)),
  );
  let added = 0;
  for (const inc of incoming) {
    const fp = itemFingerprint(inc);
    if (blocked.has(fp)) continue;
    items.push(inc);
    blocked.add(fp);
    added++;
  }
  const state: SimplificationBacklogState = { items, updatedAt: Date.now() };
  saveSimplificationBacklogState(state);
  notifySimplificationBacklogChanged();
  return added;
}

export function queueSimplificationBacklogRestore(serialized: string) {
  try {
    sessionStorage.setItem(SIMPLIFICATION_BACKLOG_RESTORE_SESSION_KEY, serialized);
  } catch {
    /* ignore */
  }
}

export function consumeSimplificationBacklogRestore(): string | null {
  try {
    const v = sessionStorage.getItem(SIMPLIFICATION_BACKLOG_RESTORE_SESSION_KEY);
    sessionStorage.removeItem(SIMPLIFICATION_BACKLOG_RESTORE_SESSION_KEY);
    return v;
  } catch {
    return null;
  }
}

export function openCriticalHighSimplificationTitles(state: SimplificationBacklogState | null, max: number): string[] {
  if (!state) return [];
  const titles = state.items
    .filter((i) => i.status === "open" && (i.severity === "critical" || i.severity === "high"))
    .map((i) => i.title)
    .filter((t) => t.length);
  return titles.slice(0, max);
}

export function hasOpenCriticalSimplifications(state: SimplificationBacklogState | null): boolean {
  if (!state) return false;
  return state.items.some((i) => i.status === "open" && i.severity === "critical");
}
