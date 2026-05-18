import type { ManualOperationalBrief, MemoryDerivedSignals, OperationalRecommendation } from "./types";

export function buildRecommendations(
  mem: MemoryDerivedSignals,
  manual: ManualOperationalBrief,
): OperationalRecommendation[] {
  const r: OperationalRecommendation[] = [];

  if (mem.skuCount.value > 0 && mem.visualAnalysisCount.value < mem.skuCount.value) {
    r.push({
      id: "rec_visual_gap",
      priority: "p1",
      actionKey: "operations.rec.visualGap.action",
      rationaleKey: "operations.rec.visualGap.rationale",
      provenance: "inferred",
      relatedDomain: "visual",
      params: { skus: mem.skuCount.value, vis: mem.visualAnalysisCount.value },
    });
  }

  if (mem.generationCount30d.value < 3) {
    r.push({
      id: "rec_content_pulse",
      priority: "p1",
      actionKey: "operations.rec.contentPulse.action",
      rationaleKey: "operations.rec.contentPulse.rationale",
      provenance: "memory-derived",
      relatedDomain: "kpi",
    });
  }

  if (manual.prioritySkus.trim()) {
    r.push({
      id: "rec_manual_sku",
      priority: "p0",
      actionKey: "operations.rec.manualSku.action",
      rationaleKey: "operations.rec.manualSku.rationale",
      provenance: "manual",
      relatedDomain: "sku",
    });
  }

  r.push({
    id: "rec_api_future",
    priority: "p2",
    actionKey: "operations.rec.apiFuture.action",
    rationaleKey: "operations.rec.apiFuture.rationale",
    provenance: "estimated",
    relatedDomain: "integrations",
  });

  return r;
}
