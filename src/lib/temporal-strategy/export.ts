import type { TemporalStrategySnapshot } from "./types";
import { TEMPORAL_PHASE_RU, TIMING_RECOMMENDATION_RU } from "./types";

export function temporalStrategyToJson(snapshot: TemporalStrategySnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function temporalStrategyToMarkdown(snapshot: TemporalStrategySnapshot): string {
  const ph = TEMPORAL_PHASE_RU[snapshot.phase];
  const tm = TIMING_RECOMMENDATION_RU[snapshot.recommendedTiming];
  const lines: string[] = [
    `# Временная стратегия · VOKRA OS`,
    ``,
    `- **Фаза:** ${ph} (${Math.round(snapshot.phaseConfidence)}% уверенность контура)`,
    `- **Следующее окно риска:** ${snapshot.nextRiskWindowRu}`,
    `- **Лучшее окно запуска:** ${snapshot.bestLaunchWindowRu}`,
    `- **Прогноз усталости:** ${snapshot.fatigueForecastRu}`,
    `- **Рекомендуемый такт:** ${tm}`,
    `- **Стратегическое терпение:** ${snapshot.patienceScore}/100`,
    ``,
    `## Декей во времени`,
    ``,
    `| Сигнал | Уровень |`,
    `|--------|---------|`,
    `| CTR fatigue | ${snapshot.decay.ctrFatigue} |`,
    `| Визуальная усталость | ${snapshot.decay.visualFatigue} |`,
    `| Эмоциональная новизна (декей) | ${snapshot.decay.emotionalNoveltyDecay} |`,
    `| SEO saturation | ${snapshot.decay.seoSaturation} |`,
    `| Имитация конкурентов | ${snapshot.decay.competitorImitation} |`,
    `| Production overload | ${snapshot.decay.productionOverload} |`,
    ``,
    `## Горизонты`,
    ``,
  ];

  for (const h of snapshot.horizons) {
    lines.push(`### ${h.horizon} · интенсивность ${h.intensity}`);
    lines.push(h.trajectoryRu);
    lines.push(`- Риск: ${h.riskHintRu}`);
    lines.push(`- Возможность: ${h.opportunityRu}`);
    lines.push("");
  }

  lines.push(`## Нарративная преемственность`, "", snapshot.narrative.themeEvolutionRu, "", snapshot.narrative.visualLanguageChangeRu, "", snapshot.narrative.consistencyAnchorRu, "", snapshot.narrative.nextDropTimingRu, "");

  lines.push(`## Интеграция контуров`, "", snapshot.integration.initiativeSummaryRu, "", snapshot.integration.memorySummaryRu, "", snapshot.integration.missionControlRu, "", snapshot.integration.trendRadarRu, "", snapshot.integration.strategicCommandRu, "");

  lines.push(`## Карточки таймлайна`, "");
  for (const c of snapshot.timelineCards) {
    lines.push(`- **${c.titleRu}** (${c.horizon})`, `  ${c.bodyRu}`, "");
  }

  lines.push(`---`, `Пульс контура: #${snapshot.pulseGeneration} · сгенерировано ${new Date(snapshot.generatedAt).toISOString()}`);

  return lines.join("\n");
}
