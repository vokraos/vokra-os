import { lsGet, lsSet } from "../storage";
import type {
  ReleaseChecklistItemId,
  ReleaseChecklistLastSummary,
  StabilityReleaseChecklist,
} from "./types";
import { RELEASE_CHECKLIST_ITEM_IDS } from "./items";

export const RELEASE_CHECKLIST_DRAFT_KEY = "vokra.releaseChecklist.draft.v1" as const;
export const RELEASE_CHECKLIST_LAST_SUMMARY_KEY = "vokra.releaseChecklist.lastSummary.v1" as const;
export const RELEASE_CHECKLIST_RESTORE_SESSION_KEY = "vokra.releaseChecklist.restore.v1" as const;
export const RELEASE_CHECKLIST_CHANGED_EVENT = "vokra.releaseChecklist.changed" as const;

function isItemId(x: unknown): x is ReleaseChecklistItemId {
  return typeof x === "string" && (RELEASE_CHECKLIST_ITEM_IDS as string[]).includes(x);
}

function sanitizeItemList(raw: unknown): ReleaseChecklistItemId[] {
  if (!Array.isArray(raw)) return [];
  const out: ReleaseChecklistItemId[] = [];
  for (const v of raw) {
    if (isItemId(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

function sanitizeVerdict(x: unknown): StabilityReleaseChecklist["verdict"] {
  if (x === "ready" || x === "usable_with_warnings" || x === "needs_fix" || x === "blocked") return x;
  return "usable_with_warnings";
}

export function createEmptyStabilityReleaseChecklist(): StabilityReleaseChecklist {
  const now = Date.now();
  return {
    id: `rel_${now}`,
    createdAt: now,
    releaseLabel: "",
    checkedItems: [],
    failedItems: [],
    warnings: [],
    verdict: "usable_with_warnings",
    notes: "",
    confidenceNote: "",
  };
}

export function parseReleaseChecklistMemoryPayload(raw: string): StabilityReleaseChecklist | null {
  try {
    const o = JSON.parse(raw) as Partial<StabilityReleaseChecklist>;
    if (!o || typeof o !== "object") return null;
    if (typeof o.id !== "string" || !o.id.trim()) return null;
    if (typeof o.createdAt !== "number" || !Number.isFinite(o.createdAt)) return null;

    const checkedItems = sanitizeItemList(o.checkedItems);
    const failedItems = sanitizeItemList(o.failedItems);
    const overlap = checkedItems.filter((id) => failedItems.includes(id));
    const checked = checkedItems.filter((id) => !overlap.includes(id));
    const failed = failedItems.filter((id) => !overlap.includes(id));

    const rawWarn: unknown = o.warnings;
    let warnings: string[] = [];
    if (Array.isArray(rawWarn)) {
      warnings = rawWarn.filter((w): w is string => typeof w === "string").map((w) => w.trim()).filter(Boolean);
    } else if (typeof rawWarn === "string" && rawWarn.trim()) {
      warnings = rawWarn.split(/\n+/).map((w: string) => w.trim()).filter(Boolean);
    }

    return {
      id: o.id.trim(),
      createdAt: o.createdAt,
      releaseLabel: typeof o.releaseLabel === "string" ? o.releaseLabel : "",
      checkedItems: checked,
      failedItems: failed,
      warnings,
      verdict: sanitizeVerdict(o.verdict),
      notes: typeof o.notes === "string" ? o.notes : "",
      confidenceNote: typeof o.confidenceNote === "string" ? o.confidenceNote : "",
    };
  } catch {
    return null;
  }
}

export function loadReleaseChecklistDraft(): StabilityReleaseChecklist | null {
  const raw = lsGet(RELEASE_CHECKLIST_DRAFT_KEY);
  if (!raw?.trim()) return null;
  return parseReleaseChecklistMemoryPayload(raw);
}

export function saveReleaseChecklistDraft(c: StabilityReleaseChecklist) {
  lsSet(RELEASE_CHECKLIST_DRAFT_KEY, JSON.stringify(c));
}

export function loadLastReleaseChecklistSummary(): ReleaseChecklistLastSummary | null {
  const raw = lsGet(RELEASE_CHECKLIST_LAST_SUMMARY_KEY);
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as Partial<ReleaseChecklistLastSummary>;
    if (!o || typeof o !== "object") return null;
    if (typeof o.updatedAt !== "number") return null;
    if (typeof o.checklistId !== "string" || !o.checklistId.trim()) return null;
    if (typeof o.releaseLabel !== "string") return null;
    return {
      updatedAt: o.updatedAt,
      checklistId: o.checklistId.trim(),
      releaseLabel: o.releaseLabel,
      verdict: sanitizeVerdict(o.verdict),
      failedItems: sanitizeItemList(o.failedItems),
      notesExcerpt: typeof o.notesExcerpt === "string" ? o.notesExcerpt : "",
    };
  } catch {
    return null;
  }
}

export function saveLastReleaseChecklistSummary(summary: ReleaseChecklistLastSummary) {
  lsSet(RELEASE_CHECKLIST_LAST_SUMMARY_KEY, JSON.stringify(summary));
}

export function persistLastSummaryFromChecklist(c: StabilityReleaseChecklist) {
  const excerpt = c.notes.replace(/\s+/g, " ").trim().slice(0, 200);
  saveLastReleaseChecklistSummary({
    updatedAt: Date.now(),
    checklistId: c.id,
    releaseLabel: c.releaseLabel.trim() || "—",
    verdict: c.verdict,
    failedItems: [...c.failedItems],
    notesExcerpt: excerpt,
  });
  try {
    window.dispatchEvent(new CustomEvent(RELEASE_CHECKLIST_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function queueReleaseChecklistRestore(serialized: string) {
  try {
    sessionStorage.setItem(RELEASE_CHECKLIST_RESTORE_SESSION_KEY, serialized);
  } catch {
    /* ignore quota */
  }
}

export function consumeReleaseChecklistRestore(): string | null {
  try {
    const v = sessionStorage.getItem(RELEASE_CHECKLIST_RESTORE_SESSION_KEY);
    sessionStorage.removeItem(RELEASE_CHECKLIST_RESTORE_SESSION_KEY);
    return v;
  } catch {
    return null;
  }
}
