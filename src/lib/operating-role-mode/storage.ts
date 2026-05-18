import { lsGet, lsSet } from "../storage";
import {
  OPERATING_ROLE_MODE_STORAGE_KEY,
  type OperatingRoleMode,
  OPERATING_ROLE_MODES,
} from "./types";

const DEFAULT_MODE: OperatingRoleMode = "founder";

export function loadOperatingRoleMode(): OperatingRoleMode {
  const raw = lsGet(OPERATING_ROLE_MODE_STORAGE_KEY);
  if (raw && (OPERATING_ROLE_MODES as readonly string[]).includes(raw)) {
    return raw as OperatingRoleMode;
  }
  return DEFAULT_MODE;
}

export function saveOperatingRoleMode(mode: OperatingRoleMode): void {
  lsSet(OPERATING_ROLE_MODE_STORAGE_KEY, mode);
}
