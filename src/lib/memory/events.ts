export const MEMORY_CHANGED_EVENT = "vokra-memory-changed";

export function emitMemoryChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MEMORY_CHANGED_EVENT));
}
