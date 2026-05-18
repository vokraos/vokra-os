import { lsGet, lsSet } from "../storage";
import {
  UNIT_ECONOMICS_ASSIGNMENTS_STORAGE_KEY,
  UNIT_ECONOMICS_PROFILES_STORAGE_KEY,
  UNIT_ECONOMICS_TEMPLATES_STORAGE_KEY,
  type UnitEconomicsAssignment,
  type UnitEconomicsBundle,
  type UnitEconomicsProfile,
  type UnitEconomicsTemplate,
} from "./types";

function parseArray<T>(raw: string | null, guard: (v: unknown) => v is T): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter(guard) : [];
  } catch {
    return [];
  }
}

const isProfile = (v: unknown): v is UnitEconomicsProfile =>
  typeof v === "object" && v !== null && typeof (v as UnitEconomicsProfile).id === "string";

const isTemplate = (v: unknown): v is UnitEconomicsTemplate =>
  typeof v === "object" && v !== null && typeof (v as UnitEconomicsTemplate).id === "string";

const isAssignment = (v: unknown): v is UnitEconomicsAssignment =>
  typeof v === "object" && v !== null && typeof (v as UnitEconomicsAssignment).id === "string";

export function loadUnitEconomicsProfiles(): UnitEconomicsProfile[] {
  return parseArray(lsGet(UNIT_ECONOMICS_PROFILES_STORAGE_KEY), isProfile);
}

export function saveUnitEconomicsProfiles(profiles: UnitEconomicsProfile[]): void {
  try {
    lsSet(UNIT_ECONOMICS_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    /* quota */
  }
}

export function loadUnitEconomicsTemplates(): UnitEconomicsTemplate[] {
  return parseArray(lsGet(UNIT_ECONOMICS_TEMPLATES_STORAGE_KEY), isTemplate);
}

export function saveUnitEconomicsTemplates(templates: UnitEconomicsTemplate[]): void {
  try {
    lsSet(UNIT_ECONOMICS_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    /* quota */
  }
}

export function loadUnitEconomicsAssignments(): UnitEconomicsAssignment[] {
  return parseArray(lsGet(UNIT_ECONOMICS_ASSIGNMENTS_STORAGE_KEY), isAssignment);
}

export function saveUnitEconomicsAssignments(assignments: UnitEconomicsAssignment[]): void {
  try {
    lsSet(UNIT_ECONOMICS_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    /* quota */
  }
}

export function loadUnitEconomicsBundle(): UnitEconomicsBundle {
  return {
    profiles: loadUnitEconomicsProfiles(),
    templates: loadUnitEconomicsTemplates(),
    assignments: loadUnitEconomicsAssignments(),
  };
}

export function saveUnitEconomicsBundle(bundle: UnitEconomicsBundle): void {
  saveUnitEconomicsProfiles(bundle.profiles);
  saveUnitEconomicsTemplates(bundle.templates);
  saveUnitEconomicsAssignments(bundle.assignments);
}
