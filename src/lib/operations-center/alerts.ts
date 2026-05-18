import type { ManualOperationalBrief, MemoryDerivedSignals, OperationalAlert } from "./types";

const now = () => Date.now();

export function buildOperationalAlerts(mem: MemoryDerivedSignals, manual: ManualOperationalBrief): OperationalAlert[] {
  const out: OperationalAlert[] = [];

  if (mem.skuCount.value === 0) {
    out.push({
      id: "al_sku_empty",
      severity: "watch",
      domain: "sku",
      titleKey: "operations.alert.skuEmpty.title",
      bodyKey: "operations.alert.skuEmpty.body",
      provenance: "memory-derived",
      createdAt: now(),
    });
  }

  if (mem.generationCount30d.value === 0 && mem.visualAnalysisCount.value === 0) {
    out.push({
      id: "al_velocity_stall",
      severity: "risk",
      domain: "kpi",
      titleKey: "operations.alert.velocityStall.title",
      bodyKey: "operations.alert.velocityStall.body",
      provenance: "memory-derived",
      createdAt: now(),
    });
  }

  if (mem.uniqueCategories.value > 6) {
    out.push({
      id: "al_category_spray",
      severity: "watch",
      domain: "category",
      titleKey: "operations.alert.categorySpray.title",
      bodyKey: "operations.alert.categorySpray.body",
      provenance: "inferred",
      params: { n: mem.uniqueCategories.value },
      createdAt: now(),
    });
  }

  if (manual.productionPressureManual != null && manual.productionPressureManual >= 75) {
    out.push({
      id: "al_prod_hot",
      severity: "risk",
      domain: "production",
      titleKey: "operations.alert.prodHot.title",
      bodyKey: "operations.alert.prodHot.body",
      provenance: "manual",
      params: { pct: manual.productionPressureManual },
      createdAt: now(),
    });
  }

  /** Offline scenario templates — explicit estimated provenance (not live feeds). */
  const scenarios: OperationalAlert[] = [
    {
      id: "sc_ad_ctr_watch",
      severity: "watch",
      domain: "ads",
      titleKey: "operations.scenario.adCtr.title",
      bodyKey: "operations.scenario.adCtr.body",
      provenance: "estimated",
      scenarioId: "demo_ad_ctr",
      createdAt: now(),
    },
    {
      id: "sc_card_decay",
      severity: "watch",
      domain: "cards",
      titleKey: "operations.scenario.cardDecay.title",
      bodyKey: "operations.scenario.cardDecay.body",
      provenance: "estimated",
      scenarioId: "demo_card_decay",
      createdAt: now(),
    },
    {
      id: "sc_season_shift",
      severity: "info",
      domain: "seasonality",
      titleKey: "operations.scenario.season.title",
      bodyKey: "operations.scenario.season.body",
      provenance: "estimated",
      scenarioId: "demo_season",
      createdAt: now(),
    },
  ];

  return [...out, ...scenarios];
}
