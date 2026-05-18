import { loadTodayProductionInput } from "../production-input";

export type ProductionPhaseId =
  | "morning_wb"
  | "ozon"
  | "evening_wb"
  | "recovery"
  | "pre_shift"
  | "off_hours";

export type ProductionPhase = {
  id: ProductionPhaseId;
  label: string;
  goal: string;
  urgency: "normal" | "elevated" | "critical";
  windowLabel: string;
};

function minutesNow(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function queueOverloadRatio(): number {
  const input = loadTodayProductionInput();
  if (!input || input.shiftCapacityUnits <= 0) return 0;
  return input.printQueueDepth / input.shiftCapacityUnits;
}

const PHASES: Record<ProductionPhaseId, ProductionPhase> = {
  recovery: {
    id: "recovery",
    label: "Аварийный режим",
    goal: "Восстановить печать и снизить очередь",
    urgency: "critical",
    windowLabel: "приоритет — устранение сбоя",
  },
  morning_wb: {
    id: "morning_wb",
    label: "Утренняя WB отгрузка",
    goal: "Успеть первую WB отгрузку",
    urgency: "elevated",
    windowLabel: "10:00–12:20",
  },
  ozon: {
    id: "ozon",
    label: "Поток Ozon",
    goal: "Закрыть Ozon до 18:00",
    urgency: "normal",
    windowLabel: "13:00–18:00",
  },
  evening_wb: {
    id: "evening_wb",
    label: "Вечерняя WB сборка",
    goal: "Снизить очередь WB, избежать ночного перегруза",
    urgency: "normal",
    windowLabel: "после 18:00",
  },
  pre_shift: {
    id: "pre_shift",
    label: "Подготовка смены",
    goal: "Заполнить данные смены и подготовить очередь",
    urgency: "normal",
    windowLabel: "до 10:00",
  },
  off_hours: {
    id: "off_hours",
    label: "Нерабочее время",
    goal: "Смена завершена",
    urgency: "normal",
    windowLabel: "",
  },
};

export function deriveProductionPhase(): ProductionPhase {
  const ratio = queueOverloadRatio();
  if (ratio > 1.3) return PHASES.recovery;

  const min = minutesNow();
  const t = (h: number, m = 0) => h * 60 + m;

  if (min < t(10)) return PHASES.pre_shift;
  if (min < t(12, 20)) return PHASES.morning_wb;
  if (min < t(13)) {
    // Transition window 12:20–13:00: treat as tail of morning WB
    return { ...PHASES.morning_wb, windowLabel: "12:20–13:00 · финал WB отгрузки" };
  }
  if (min < t(18)) return PHASES.ozon;
  if (min < t(22)) return PHASES.evening_wb;
  return PHASES.off_hours;
}

export function phaseNextActionLabel(phase: ProductionPhase): string {
  switch (phase.id) {
    case "morning_wb": return "Сдать WB до 12:20";
    case "ozon": return "Закрыть Ozon заказы";
    case "evening_wb": return "Обработать остаток WB";
    case "recovery": return "Устранить причину сбоя";
    case "pre_shift": return "Заполнить готовность смены";
    default: return "";
  }
}
