import { isOsReportWarmupInFlight } from "../os-report-warmup";

const MAX_NEST = 24;
let nest = 0;

function enterNest(): void {
  nest += 1;
  if (nest > MAX_NEST) {
    nest -= 1;
    throw new Error(`Smoke recursion guard: depth exceeded (${MAX_NEST})`);
  }
}

function exitNest(): void {
  nest = Math.max(0, nest - 1);
}

/** Verifies a depth-limited guard trips predictably (does not affect global warmup). */
export function assertSmokeRecursionGuardTrips(): void {
  const start = nest;
  let threw = false;
  try {
    for (let i = 0; i < MAX_NEST + 2; i++) {
      try {
        enterNest();
      } catch {
        threw = true;
        break;
      }
    }
    while (nest > start) exitNest();
  } finally {
    nest = start;
  }
  if (!threw) throw new Error("recursion guard did not trip");
}

/** After warmup finishes, the in-flight latch must be clear. */
export function assertWarmupLatchClear(): void {
  if (isOsReportWarmupInFlight()) {
    throw new Error("warmupInFlight still true after run — possible stuck lock");
  }
}
