import type { NavId } from "../../types";
import type { DailyPilotScreenKey } from "../daily-operations-pilot/types";

export function dailyPilotScreenToNav(key: DailyPilotScreenKey): NavId {
  const m: Record<DailyPilotScreenKey, NavId> = {
    release_check: "releaseCheck",
    morning_start: "morningStart",
    war_room: "warRoom",
    operator_mode: "operatorMode",
    production_pressure: "productionPressure",
    evening_close: "eveningClose",
    daily_pilot: "dailyPilot",
  };
  return m[key];
}
