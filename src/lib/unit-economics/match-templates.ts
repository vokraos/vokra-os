import type { UnitEconomicsMatchContext, UnitEconomicsTemplate } from "./types";

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function fieldMatches(templateValue: string, ctxValue: string | undefined): boolean {
  const p = norm(templateValue);
  if (!p) return true;
  const c = norm(ctxValue);
  if (!c) return false;
  return p === c || c.includes(p) || p.includes(c);
}

export function scoreTemplateMatch(template: UnitEconomicsTemplate, ctx: UnitEconomicsMatchContext): number {
  let score = 0;
  if (fieldMatches(template.productType, ctx.productType) || fieldMatches(template.productType, ctx.productFamily)) {
    score += template.productType.trim() ? 5 : 0;
  } else if (template.productType.trim()) return -1;

  if (fieldMatches(template.fitType, ctx.fitType)) score += template.fitType.trim() ? 3 : 0;
  else if (template.fitType.trim() && ctx.fitType?.trim()) return -1;

  if (fieldMatches(template.marketplace, ctx.marketplace)) score += template.marketplace.trim() ? 2 : 0;
  else if (template.marketplace.trim()) return -1;

  if (fieldMatches(template.stockMode, ctx.stockMode)) score += template.stockMode.trim() ? 2 : 0;
  else if (template.stockMode.trim()) return -1;

  return score;
}
