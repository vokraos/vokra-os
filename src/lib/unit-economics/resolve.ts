import { calculateUnitEconomics } from "./calculate";
import { findBestUnitEconomicsProfile } from "./match";
import { scoreTemplateMatch } from "./match-templates";
import { templateLabel, templateToEffectiveProfile } from "./template-utils";
import type {
  UnitEconomicsAssignment,
  UnitEconomicsBundle,
  UnitEconomicsMatchContext,
  UnitEconomicsProfile,
  UnitEconomicsResolvedMatch,
  UnitEconomicsTemplate,
} from "./types";

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function fieldMatches(a: string, b: string | undefined): boolean {
  const p = norm(a);
  if (!p) return true;
  const c = norm(b);
  if (!c) return false;
  return p === c || c.includes(p) || p.includes(c);
}

function assignmentMatchesTarget(a: UnitEconomicsAssignment, ctx: UnitEconomicsMatchContext): boolean {
  const id = norm(a.targetId);
  const label = norm(a.targetLabel);
  switch (a.targetType) {
    case "corridor":
      return fieldMatches(a.targetId, ctx.corridor) || (label.length > 0 && label === norm(ctx.corridor));
    case "product_family":
      return fieldMatches(a.targetId, ctx.productFamily) || fieldMatches(a.targetLabel, ctx.productFamily);
    case "collection":
      return id === norm(ctx.collectionId) || (label.length > 0 && label === norm(ctx.collectionId));
    case "sku_group":
      return id === norm(ctx.skuGroupId);
    case "launch_wave":
      return id === norm(ctx.launchWaveId);
    default:
      return false;
  }
}

function assignmentMatches(a: UnitEconomicsAssignment, ctx: UnitEconomicsMatchContext): boolean {
  if (!assignmentMatchesTarget(a, ctx)) return false;
  if (a.marketplace.trim() && !fieldMatches(a.marketplace, ctx.marketplace)) return false;
  if (a.stockMode.trim() && !fieldMatches(a.stockMode, ctx.stockMode)) return false;
  return Boolean(a.templateId || a.profileId);
}

function resolveFromAssignment(
  a: UnitEconomicsAssignment,
  bundle: UnitEconomicsBundle,
  ctx: UnitEconomicsMatchContext,
): UnitEconomicsResolvedMatch | null {
  if (a.profileId) {
    const profile = bundle.profiles.find((p) => p.id === a.profileId);
    if (!profile) return null;
    return {
      sourceKind: "assignment",
      sourceId: a.id,
      sourceLabel: a.targetLabel || profile.name,
      sourceLabelKey: "ue.resolve.assignmentProfile",
      sourceLabelVars: { label: profile.name || a.targetLabel, target: a.targetLabel },
      profile,
      calculated: calculateUnitEconomics(profile),
      assignmentId: a.id,
    };
  }
  if (a.templateId) {
    const template = bundle.templates.find((t) => t.id === a.templateId);
    if (!template) return null;
    const profile = templateToEffectiveProfile(template, ctx);
    return {
      sourceKind: "assignment",
      sourceId: a.id,
      sourceLabel: templateLabel(template),
      sourceLabelKey: "ue.resolve.assignmentTemplate",
      sourceLabelVars: { template: templateLabel(template), target: a.targetLabel },
      profile,
      calculated: calculateUnitEconomics(profile),
      assignmentId: a.id,
      templateId: template.id,
    };
  }
  return null;
}

function resolveFromTemplate(
  template: UnitEconomicsTemplate,
  ctx: UnitEconomicsMatchContext,
): UnitEconomicsResolvedMatch {
  const profile = templateToEffectiveProfile(template, ctx);
  return {
    sourceKind: "template",
    sourceId: template.id,
    sourceLabel: templateLabel(template),
    sourceLabelKey: "ue.resolve.template",
    sourceLabelVars: { template: templateLabel(template) },
    profile,
    calculated: calculateUnitEconomics(profile),
    templateId: template.id,
  };
}

function resolveFromProfile(row: { profile: UnitEconomicsProfile; calculated: ReturnType<typeof calculateUnitEconomics> }): UnitEconomicsResolvedMatch {
  return {
    sourceKind: "profile",
    sourceId: row.profile.id,
    sourceLabel: row.profile.name || row.profile.corridor,
    sourceLabelKey: "ue.resolve.profile",
    sourceLabelVars: { label: row.profile.name || row.profile.corridor || row.profile.id },
    profile: row.profile,
    calculated: row.calculated,
  };
}

export function resolveUnitEconomics(
  ctx: UnitEconomicsMatchContext,
  bundle: UnitEconomicsBundle,
): UnitEconomicsResolvedMatch | null {
  const assignments = bundle.assignments.filter((a) => assignmentMatches(a, ctx));
  if (assignments.length) {
    const sorted = [...assignments].sort((a, b) => b.createdAt - a.createdAt);
    for (const a of sorted) {
      const resolved = resolveFromAssignment(a, bundle, ctx);
      if (resolved) return resolved;
    }
  }

  const profileRow = findBestUnitEconomicsProfile(bundle.profiles, ctx);
  if (profileRow) return resolveFromProfile(profileRow);

  let bestTpl: { template: UnitEconomicsTemplate; score: number } | null = null;
  for (const template of bundle.templates) {
    const score = scoreTemplateMatch(template, ctx);
    if (score < 0) continue;
    if (!bestTpl || score > bestTpl.score) bestTpl = { template, score };
  }
  if (bestTpl) return resolveFromTemplate(bestTpl.template, ctx);

  return null;
}

export function formatResolvedSourceLine(
  match: UnitEconomicsResolvedMatch,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  if (match.sourceLabelKey) return t(match.sourceLabelKey, match.sourceLabelVars);
  return match.sourceLabel;
}

export function computeTemplateCoverage(
  corridors: string[],
  bundle: UnitEconomicsBundle,
): { covered: number; total: number; uncovered: string[] } {
  const uncovered: string[] = [];
  let covered = 0;
  for (const corridor of corridors) {
    const m = resolveUnitEconomics({ corridor }, bundle);
    if (m) covered += 1;
    else uncovered.push(corridor);
  }
  return { covered, total: corridors.length, uncovered };
}
