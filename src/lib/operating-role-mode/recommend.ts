import type { StrategicControlTowerSnapshot } from "../strategic-control-tower";
import { buildProductionPressureReport } from "../production-pressure";
import type { OperatingRoleMode } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

/** Suggest operating mode when OS is overloaded — no new intelligence engine. */
export function deriveRecommendedOperatingMode(
  tower: StrategicControlTowerSnapshot,
  t: TFn,
): { mode: OperatingRoleMode; reasonKey: string } | null {
  const prod = buildProductionPressureReport(t);

  if (
    prod.productionState === "overloaded" ||
    prod.productionState === "blocked" ||
    prod.productionState === "pressured"
  ) {
    return { mode: "production", reasonKey: "orm.recommend.production" };
  }

  if (tower.overallState === "blocked" || tower.overallState === "fragile") {
    return { mode: "founder", reasonKey: "orm.recommend.founder" };
  }

  const heroLaunchPressured = tower.tiles.some(
    (x) => (x.id === "hero" || x.id === "launch" || x.id === "timing" || x.id === "corridor") &&
      (x.health === "pressured" || x.health === "blocked"),
  );
  if (heroLaunchPressured && tower.overallState === "pressured") {
    return { mode: "strategy", reasonKey: "orm.recommend.strategy" };
  }

  const operatorHeavy = tower.tiles.find((x) => x.id === "execution");
  if (operatorHeavy?.health === "pressured" || operatorHeavy?.health === "blocked") {
    return { mode: "operator", reasonKey: "orm.recommend.operator" };
  }

  return null;
}
