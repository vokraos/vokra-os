import type { EconomicPressureReport } from "../economic-pressure/types";
import { listProfilesByPressure, profileLabel } from "./match";
import { loadUnitEconomicsBundle } from "./storage";
import type { UnitEconomicsBundle, UnitEconomicsProfile, UnitEconomicsProfileRow } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function mergeUnitEconomicsHintsIntoLaunchRecommendations(
  lines: string[],
  profiles: UnitEconomicsProfile[],
  t: TFn,
): string[] {
  const dangerous = listProfilesByPressure(profiles, ["negative", "dangerous"]);
  if (!dangerous.length) return lines;
  const out = [...lines];
  const top = dangerous[0]!;
  const add = (key: string, vars?: Record<string, string>) => {
    const line = t(key, vars);
    if (!out.includes(line)) out.push(line);
  };
  add("ue.hint.launchExpansionDanger", {
    label: profileLabel(top.profile),
    level: t(`ue.level.${top.calculated.marginPressureLevel}`),
  });
  if (top.calculated.marginPressureLevel === "negative" || top.calculated.marginPressureLevel === "dangerous") {
    add("ue.hint.launchHoldUntilMargin", { label: profileLabel(top.profile) });
  }
  const tight = listProfilesByPressure(profiles, ["tight"]);
  if (tight[0] && top.profile.id !== tight[0].profile.id) {
    add("ue.hint.launchTightMargin", { label: profileLabel(tight[0].profile) });
  }
  return out.slice(0, 12);
}

export function appendUnitEconomicsToEconomicWarnings(
  report: EconomicPressureReport,
  profiles: UnitEconomicsProfile[],
  t: TFn,
): string[] {
  const warnings = [...report.operationalWarnings];
  const push = (key: string, vars?: Record<string, string>) => {
    const line = t(key, vars);
    if (!warnings.includes(line)) warnings.push(line);
  };
  const bad = listProfilesByPressure(profiles, ["negative", "dangerous", "tight"]);
  for (const row of bad.slice(0, 3)) {
    push("ue.warn.economicPressure", {
      label: profileLabel(row.profile),
      margin: String(row.calculated.estimatedMarginPercent),
      level: t(`ue.level.${row.calculated.marginPressureLevel}`),
    });
  }
  if (
    (report.expansionLevel === "dangerous" || report.expansionLevel === "critical") &&
    bad.length > 0
  ) {
    push("ue.warn.expansionWithMargin", { label: profileLabel(bad[0]!.profile) });
  }
  return warnings.slice(0, 8);
}

export function formatUnitEconomicsDigestLine(profiles: UnitEconomicsProfile[], t: TFn): string | null {
  const dangerous = listProfilesByPressure(profiles, ["negative", "dangerous"]);
  if (!dangerous.length) return null;
  const top = dangerous[0]!;
  return t("ue.digest.marginPressure", {
    label: profileLabel(top.profile),
    mode: top.profile.stockMode || "—",
  });
}

export function formatUnitEconomicsFounderLine(profiles: UnitEconomicsProfile[], t: TFn): string | null {
  return formatUnitEconomicsDigestLine(profiles, t);
}

export function getUnitEconomicsAdRiskLine(row: UnitEconomicsProfileRow, t: TFn): string | null {
  const { profile, calculated } = row;
  if (calculated.marginPressureLevel !== "dangerous" && calculated.marginPressureLevel !== "negative") {
    if (calculated.marginPressureLevel === "tight" && profile.adCostEstimate > calculated.maxAdCostBeforeTargetBreak) {
      return t("ue.hint.adsUnsafe", {
        max: String(Math.round(calculated.maxAdCostBeforeTargetBreak)),
        current: String(Math.round(profile.adCostEstimate)),
      });
    }
    return null;
  }
  return t("ue.hint.adsUnsafe", {
    max: String(Math.round(calculated.maxAdCostBeforeTargetBreak)),
    current: String(Math.round(profile.adCostEstimate)),
  });
}

export function loadProfilesForIntegrations(): UnitEconomicsProfile[] {
  return loadUnitEconomicsBundle().profiles;
}

export function loadBundleForIntegrations(): UnitEconomicsBundle {
  return loadUnitEconomicsBundle();
}
