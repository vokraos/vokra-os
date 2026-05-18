import { lsGet, lsSet } from "../storage";

export const PRODUCTION_INPUT_KEY = "vokra.morningProductionInput.v1" as const;
export const PRODUCTION_INPUT_EVENT = "vokra:production-input-updated" as const;

export type MorningProductionInput = {
  date: string; // "YYYY-MM-DD"
  printQueueDepth: number;     // jobs waiting to print today
  shiftCapacityUnits: number;  // units the shift can produce
  shiftStaffConfirmed: boolean;
  packagingUnitsOnHand: number;
};

export type ProductionSignalSeverity = "info" | "warn" | "critical";

export type ProductionSignal = {
  id: string;
  severity: ProductionSignalSeverity;
  labelKey: string;
  labelVars: Record<string, string>;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function saveMorningProductionInput(input: MorningProductionInput): void {
  lsSet(PRODUCTION_INPUT_KEY, JSON.stringify(input));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRODUCTION_INPUT_EVENT));
  }
}

export function loadTodayProductionInput(): MorningProductionInput | null {
  try {
    const raw = lsGet(PRODUCTION_INPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MorningProductionInput;
    if (parsed.date !== todayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasTodayProductionInput(): boolean {
  return loadTodayProductionInput() !== null;
}

export function deriveMorningProductionSignals(input: MorningProductionInput): ProductionSignal[] {
  const signals: ProductionSignal[] = [];

  if (!input.shiftStaffConfirmed) {
    signals.push({
      id: "shift_unconfirmed",
      severity: "warn",
      labelKey: "prod.input.signal.shiftUnconfirmed",
      labelVars: {},
    });
  }

  const overloadRatio = input.shiftCapacityUnits > 0
    ? input.printQueueDepth / input.shiftCapacityUnits
    : input.printQueueDepth > 0 ? 999 : 0;

  if (overloadRatio > 1.15) {
    signals.push({
      id: "queue_overload",
      severity: overloadRatio > 1.5 ? "critical" : "warn",
      labelKey: "prod.input.signal.queueOverload",
      labelVars: {
        queue: String(input.printQueueDepth),
        capacity: String(input.shiftCapacityUnits),
      },
    });
  } else if (overloadRatio > 0.85) {
    signals.push({
      id: "queue_near_limit",
      severity: "info",
      labelKey: "prod.input.signal.queueNearLimit",
      labelVars: {
        queue: String(input.printQueueDepth),
        capacity: String(input.shiftCapacityUnits),
      },
    });
  }

  const packagingRatio = input.printQueueDepth > 0
    ? input.packagingUnitsOnHand / input.printQueueDepth
    : 1;

  if (packagingRatio < 0.7) {
    signals.push({
      id: "packaging_risk",
      severity: packagingRatio < 0.4 ? "critical" : "warn",
      labelKey: "prod.input.signal.packagingRisk",
      labelVars: {
        onHand: String(input.packagingUnitsOnHand),
        needed: String(input.printQueueDepth),
      },
    });
  }

  signals.sort((a, b) => {
    const order: Record<ProductionSignalSeverity, number> = { critical: 0, warn: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return signals;
}

export function getTopProductionSignal(): ProductionSignal | null {
  const input = loadTodayProductionInput();
  if (!input) return null;
  const signals = deriveMorningProductionSignals(input);
  return signals[0] ?? null;
}

export function applyProductionInputToContext(ctx: {
  visualQueueCount: number;
  orchestrationDtf: number;
  orchestrationPackaging: number;
}): {
  visualQueueCount: number;
  orchestrationDtf: number;
  orchestrationPackaging: number;
} {
  const input = loadTodayProductionInput();
  if (!input) return ctx;

  const realQueueCount = input.printQueueDepth;
  const capacityRatio = input.shiftCapacityUnits > 0
    ? input.printQueueDepth / input.shiftCapacityUnits
    : 1;

  const dtfPressure = Math.min(100, Math.round(
    capacityRatio * 55 +
    (input.shiftStaffConfirmed ? 0 : 18) +
    Math.min(25, realQueueCount * 2.5)
  ));

  const packagingRatio = input.printQueueDepth > 0
    ? input.packagingUnitsOnHand / input.printQueueDepth
    : 1;
  const packagingPressure = Math.min(100, Math.round(
    (1 - Math.min(1, packagingRatio)) * 70 +
    (capacityRatio > 1.1 ? 15 : 0)
  ));

  return {
    visualQueueCount: Math.max(ctx.visualQueueCount, realQueueCount),
    orchestrationDtf: dtfPressure,
    orchestrationPackaging: packagingPressure,
  };
}
