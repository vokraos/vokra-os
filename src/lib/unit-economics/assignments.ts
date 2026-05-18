import { newUnitEconomicsAssignmentId } from "./ids";
import { loadUnitEconomicsAssignments, saveUnitEconomicsAssignments } from "./storage";
import type { UnitEconomicsAssignment, UnitEconomicsAssignmentTargetType } from "./types";

export function upsertUnitEconomicsAssignment(args: {
  templateId?: string | null;
  profileId?: string | null;
  targetType: UnitEconomicsAssignmentTargetType;
  targetId: string;
  targetLabel: string;
  marketplace?: string;
  stockMode?: string;
}): UnitEconomicsAssignment {
  const assignments = loadUnitEconomicsAssignments();
  const existing = assignments.find(
    (a) => a.targetType === args.targetType && a.targetId === args.targetId,
  );
  const row: UnitEconomicsAssignment = {
    id: existing?.id ?? newUnitEconomicsAssignmentId(),
    templateId: args.templateId ?? null,
    profileId: args.profileId ?? null,
    targetType: args.targetType,
    targetId: args.targetId,
    targetLabel: args.targetLabel,
    marketplace: args.marketplace ?? "",
    stockMode: args.stockMode ?? "",
    createdAt: existing?.createdAt ?? Date.now(),
  };
  const next = existing
    ? assignments.map((a) => (a.id === existing.id ? row : a))
    : [...assignments, row];
  saveUnitEconomicsAssignments(next);
  return row;
}

export function removeUnitEconomicsAssignment(targetType: UnitEconomicsAssignmentTargetType, targetId: string): void {
  const next = loadUnitEconomicsAssignments().filter(
    (a) => !(a.targetType === targetType && a.targetId === targetId),
  );
  saveUnitEconomicsAssignments(next);
}

export function findAssignmentForTarget(
  targetType: UnitEconomicsAssignmentTargetType,
  targetId: string,
): UnitEconomicsAssignment | null {
  return loadUnitEconomicsAssignments().find((a) => a.targetType === targetType && a.targetId === targetId) ?? null;
}

export function assignTemplateToCollection(
  templateId: string,
  collectionId: string,
  collectionLabel: string,
  marketplace?: string,
  stockMode?: string,
): UnitEconomicsAssignment {
  return upsertUnitEconomicsAssignment({
    templateId,
    profileId: null,
    targetType: "collection",
    targetId: collectionId,
    targetLabel: collectionLabel,
    marketplace,
    stockMode,
  });
}
