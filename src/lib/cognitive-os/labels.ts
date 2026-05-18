import type { ActivityMode, BrandGate, SyncMode } from "./types";

export const ACTIVITY_RU: Record<ActivityMode, string> = {
  steady: "КОНТУР",
  active: "АКТИВЕН",
  priority: "ПРИОРИТЕТ",
  sync: "СИНХРОНИЗАЦИЯ",
};

export const SYNC_RU: Record<SyncMode, string> = {
  synced: "СИНХРОН",
  catchup: "ДОГОН",
  drift: "ДРЕЙФ",
};

export const BRAND_GATE_RU: Record<BrandGate, string> = {
  ok: "DNA: норма",
  watch: "DNA: надзор",
  hold: "DNA: удержание",
};
