export type OperatingRoleMode = "founder" | "operator" | "production" | "strategy";

export const OPERATING_ROLE_MODES: readonly OperatingRoleMode[] = [
  "founder",
  "operator",
  "production",
  "strategy",
] as const;

export const OPERATING_ROLE_MODE_STORAGE_KEY = "vokra.os.operatingRoleMode.v1" as const;
export const OPERATING_ROLE_MODE_EVENT = "vokra.operatingRoleMode" as const;
