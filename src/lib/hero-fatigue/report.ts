import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import { dominantArchetypes } from "../hero-archetypes/classify";
import { compareOurVsFieldFatigue } from "./compare";
import {
  buildOurFatigueEntity,
  computeLifecycleAndUrgency,
  fieldFatigueIndex,
  heroNoteEchoFatigue,
  ourFatigueIndex,
} from "./fatigue";
import { newHeroFatigueIntelligenceId } from "./ids";
import { colorRepetitionSharePct, modelRepetitionSharePct, printLabelRepetitionSharePct, semanticRepetitionScore } from "./repetition";
import { archetypeSaturationPressure, buildArchetypeSharesForFatigue, combinedSaturationFatigue } from "./saturation";
import { fatigueLevelFromIndex } from "./lifecycle";
import { countHeroRefreshJobsInSession } from "./refresh";
import { buildFatigueRecommendations } from "./recommendations";
import type { HeroFatigueIntelligenceReport } from "./types";

export function buildHeroFatigueIntelligenceReport(
  envelope: CompetitorSerpEnvelope,
  ctx: {
    ourCard?: OurCardCompetitiveSnapshot | null;
    gap?: CompetitiveGapAnalysis | null;
    heroPlan?: CompetitiveHeroImprovementPlan | null;
    archetypeIntel?: HeroArchetypeIntelligenceReport | null;
    readabilityIntel?: HeroReadabilityIntelligenceReport | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroFatigueIntelligenceReport {
  const items = envelope.snapshot.items;
  const analysis = envelope.analysis;
  const query = envelope.snapshot.query;
  const shares = buildArchetypeSharesForFatigue(items);
  const ap = archetypeSaturationPressure(shares);
  const satFat = combinedSaturationFatigue(analysis, ap);
  const sem = semanticRepetitionScore(items);
  const echo = heroNoteEchoFatigue(items);
  const fieldIdx = fieldFatigueIndex(items, analysis);
  const domArch = dominantArchetypes(shares, 2);
  const archTop = domArch[0]?.archetype ?? "clean_marketplace";
  const archTopPct = domArch[0]?.sharePct ?? 0;
  const readP = ctx.readabilityIntel?.readabilityPressureIndex ?? Math.round(analysis.saturationSignal * 0.45);

  const { lifecycle, urgency } = computeLifecycleAndUrgency({
    query,
    fatigueIdx: fieldIdx,
    saturationFatigue: satFat,
    semanticRep: sem,
    readabilityPressure: readP,
    archetype: ctx.archetypeIntel ?? null,
  });

  const refreshJobs = countHeroRefreshJobsInSession(query);
  const refreshHistoryHintLine = t("hf.hist.line", { n: String(refreshJobs) });

  const dominantFatigueLines = [
    t("hf.dom.field", { level: t(`hf.level.${fatigueLevelFromIndex(fieldIdx)}`), idx: String(fieldIdx) }),
    t("hf.dom.arch", { arch: t(`ha.arch.${archTop}`), pct: String(archTopPct) }),
    t("hf.dom.semantic", { idx: String(sem) }),
    t("hf.dom.echo", { idx: String(echo) }),
    t("hf.dom.color", { pct: String(colorRepetitionSharePct(items)) }),
    t("hf.dom.model", { pct: String(modelRepetitionSharePct(items)) }),
    t("hf.dom.print", { pct: String(printLabelRepetitionSharePct(items)) }),
  ];

  const saturationPressureLine = t("hf.sat.pressure", { idx: String(satFat), sat: String(analysis.saturationSignal) });

  const refreshOpportunityLines = [
    urgency >= 62 ? t("hf.opp.full_lane") : t("hf.opp.disciplined"),
    sem >= 50 ? t("hf.opp.semantic") : t("hf.opp.semantic_ok"),
    echo >= 42 ? t("hf.opp.notes_repeat") : t("hf.opp.notes_varied"),
    ctx.archetypeIntel?.underrepresentedLines?.[0]
      ? t("hf.opp.arch_window", { line: ctx.archetypeIntel.underrepresentedLines[0]!.slice(0, 100) })
      : t("hf.opp.arch_neutral"),
  ];

  const cmp = compareOurVsFieldFatigue(
    ctx.ourCard ?? null,
    items,
    analysis,
    ctx.archetypeIntel ?? null,
    ctx.readabilityIntel ?? null,
    t,
  );
  const ourIdx = ctx.ourCard ? ourFatigueIndex(ctx.ourCard, items, analysis, ctx.archetypeIntel ?? null, ctx.readabilityIntel ?? null) : null;

  const ourFatigueLines: string[] = [cmp.fieldLine];
  if (cmp.ourLine) ourFatigueLines.push(cmp.ourLine);
  ourFatigueLines.push(cmp.gapLine, cmp.timingLine);

  const ourEntity =
    ctx.ourCard != null && ourIdx != null
      ? buildOurFatigueEntity(
          ctx.ourCard,
          {
            ourIdx,
            fieldIdx,
            lifecycle,
            urgencyIdx: urgency,
            semanticField: sem,
          },
          t,
        )
      : null;

  const lifecycleStageLine = t("hf.lifecycle.line", { stage: t(`hf.stage.${lifecycle}`) });
  const refreshUrgencyLine = t("hf.urgency.line", { idx: String(urgency) });
  const refreshTimingLine = cmp.timingLine;
  const visualBlindnessRiskLine = cmp.blindnessLine;
  const fieldVsOurFatigueLine = cmp.gapLine;
  const refreshOpportunitySummary = refreshOpportunityLines.slice(0, 2).join(" · ");

  const practical = buildFatigueRecommendations(
    fieldIdx,
    ourIdx,
    urgency,
    sem,
    ctx.gap ?? null,
    ctx.heroPlan ?? null,
    ctx.archetypeIntel ?? null,
    ctx.readabilityIntel ?? null,
    t,
  );

  const fatiguePressureIndex = Math.round((fieldIdx + urgency + sem) / 3);

  return {
    id: newHeroFatigueIntelligenceId(),
    sourceSerpSnapshotId: envelope.snapshot.id,
    query,
    marketplace: envelope.snapshot.marketplace,
    createdAt: Date.now(),
    refreshHistoryHintLine,
    dominantFatigueLines,
    saturationPressureLine,
    refreshOpportunityLines,
    ourFatigueLines,
    ourFatigueEntity: ourEntity,
    lifecycleStageLine,
    refreshUrgencyLine,
    refreshTimingLine,
    visualBlindnessRiskLine,
    fieldVsOurFatigueLine,
    refreshOpportunitySummary,
    fatiguePressureIndex,
    practicalRecommendations: practical,
  };
}
