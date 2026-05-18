import { formatResolvedSourceLine, resolveUnitEconomics } from "./resolve";
import { profileLabel } from "./match";
import type { UnitEconomicsBundle } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function getCollectionUnitEconomicsHint(
  bundle: UnitEconomicsBundle,
  ctx: { corridor?: string; marketplace?: string; stockMode?: string; collectionId?: string },
  t: TFn,
): string | null {
  const resolved = resolveUnitEconomics(
    {
      corridor: ctx.corridor,
      marketplace: ctx.marketplace,
      stockMode: ctx.stockMode,
      collectionId: ctx.collectionId,
    },
    bundle,
  );
  if (!resolved) return null;
  const { calculated, profile } = resolved;
  if (
    calculated.marginPressureLevel !== "dangerous" &&
    calculated.marginPressureLevel !== "negative" &&
    calculated.marginPressureLevel !== "tight"
  ) {
    return null;
  }
  return t("ue.collection.marginNote", {
    label: profileLabel(profile),
    level: t(`ue.level.${calculated.marginPressureLevel}`),
    margin: String(calculated.estimatedMarginPercent),
    source: formatResolvedSourceLine(resolved, t),
  });
}

export function getCollectionEconomicsAssignmentLine(
  bundle: UnitEconomicsBundle,
  collectionId: string,
  t: TFn,
): string | null {
  const resolved = resolveUnitEconomics({ collectionId }, bundle);
  if (!resolved) return null;
  return t("ue.collection.assigned", { source: formatResolvedSourceLine(resolved, t) });
}
