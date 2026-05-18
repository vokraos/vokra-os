import type { VisualFatigueState } from "./types";

export function buildVisualFatigueState(input: {
  visualFatigue01: number;
  overlap01: number;
  corridorPressure01: number;
  ctrFatigueRisk: number;
  saturation01: number;
}): VisualFatigueState {
  const vf = input.visualFatigue01;
  const ov = input.overlap01;
  const cp = input.corridorPressure01;
  const ctr = input.ctrFatigueRisk;
  const sat = input.saturation01;

  const overlapPressure = Math.round(ov * 100);
  const compositionRepetition = Math.round(vf * 55 + sat * 30);
  const corridorDuplication = Math.round(ov * 45 + cp * 40);
  const heroFatigue = Math.round(vf * 100);
  const visualSaturation = Math.round(sat * 100);
  const refreshAge = Math.round(vf * 80 + ctr * 0.25);
  const score = Math.round(Math.min(100, heroFatigue * 0.45 + overlapPressure * 0.25 + visualSaturation * 0.2 + corridorDuplication * 0.1));

  const signalsRu: string[] = [];
  if (heroFatigue > 62) signalsRu.push("Текущий hero-визуал входит в цикл fatigue.");
  if (overlapPressure > 58) signalsRu.push("Растёт визуальное пересечение коридоров.");
  if (visualSaturation > 64) signalsRu.push("Плотность композиции на маркетплейсе вне безопасной зоны.");
  if (corridorDuplication > 60) signalsRu.push("Давление дублирования визуальной грамматики коридора.");
  if (signalsRu.length === 0) signalsRu.push("Контур fatigue стабилен — держать дисциплину refresh.");
  const signalsEn: string[] = [];
  if (heroFatigue > 62) signalsEn.push("Current hero visual entering fatigue cycle.");
  if (overlapPressure > 58) signalsEn.push("Corridor visual overlap increasing.");
  if (visualSaturation > 64) signalsEn.push("Marketplace composition density unsafe.");
  if (corridorDuplication > 60) signalsEn.push("Corridor duplication pressure on visual grammar.");
  if (signalsEn.length === 0) signalsEn.push("Fatigue contour stable — maintain refresh cadence discipline.");

  return {
    score,
    refreshAge,
    overlapPressure,
    compositionRepetition,
    corridorDuplication,
    heroFatigue,
    visualSaturation,
    signalsRu,
    signalsEn,
  };
}
