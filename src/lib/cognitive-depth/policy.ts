import type { CognitiveDepthMode } from "./types";
import type { DashboardSlot, MissionSlot, OrchSlot, SectionRole } from "./types";

/** Command depth = cold brief only: no operations floor, topology, memory vault, simulation, or Phase‑8 machinery. */
export function isCommandDepthMode(mode: CognitiveDepthMode): boolean {
  return mode === "command";
}

/** Deep strategic chrome (lanes, mesh, vault, sim, topology bodies) must not render in command mode. */
export function allowsDeepStrategicLayer(mode: CognitiveDepthMode): boolean {
  return mode !== "command";
}

export function isDashboardSlotVisible(mode: CognitiveDepthMode, slot: DashboardSlot): boolean {
  if (mode === "command") return slot === "commandBand";
  if (mode === "memory") return slot === "memoryArchive" || slot === "quickActions";
  if (mode === "operations") {
    if (slot === "commandBand" || slot === "marketTopology" || slot === "memoryArchive" || slot === "simulationLayer")
      return false;
    return true;
  }
  if (mode === "analysis") {
    if (slot === "commandBand" || slot === "operationsFloor" || slot === "memoryArchive" || slot === "simulationLayer")
      return false;
    return true;
  }
  if (mode === "simulation") {
    if (slot === "commandBand" || slot === "operationsFloor" || slot === "marketTopology" || slot === "memoryArchive")
      return false;
    return true;
  }
  return slot !== "commandBand";
}

export function dashboardSlotRole(mode: CognitiveDepthMode, slot: DashboardSlot): SectionRole {
  if (!isDashboardSlotVisible(mode, slot)) return "hidden";
  if (mode === "memory" && slot === "memoryArchive") return "primary";
  if (mode === "memory" && slot === "quickActions") return "secondary";
  if (mode === "operations" && slot === "operationsFloor") return "primary";
  if (mode === "simulation" && slot === "simulationLayer") return "primary";
  if (mode === "analysis" && slot === "marketTopology") return "primary";
  if (mode === "analysis" && (slot === "todayStack" || slot === "executiveSurface")) return "secondary";
  if (mode === "analysis" && slot === "moduleGrid") return "secondary";
  return "primary";
}

export function isMissionSlotVisible(mode: CognitiveDepthMode, slot: MissionSlot): boolean {
  if (mode === "command") return slot === "commandBand";
  if (mode === "memory") return slot === "memoryArchive";
  if (mode === "operations") {
    if (slot === "commandBand" || slot === "marketTopology" || slot === "memoryArchive" || slot === "simulationLayer")
      return false;
    return true;
  }
  if (mode === "analysis") {
    if (slot === "commandBand") return false;
    if (slot === "todayStack" || slot === "leverageBand" || slot === "timePressure" || slot === "followUp") return false;
    if (slot === "operationsFloor" || slot === "memoryArchive" || slot === "simulationLayer") return false;
    return true;
  }
  if (mode === "simulation") {
    if (slot === "commandBand" || slot === "operationsFloor" || slot === "marketTopology" || slot === "memoryArchive")
      return false;
    return true;
  }
  return slot !== "commandBand";
}

export function missionSlotRole(mode: CognitiveDepthMode, slot: MissionSlot): SectionRole {
  if (!isMissionSlotVisible(mode, slot)) return "hidden";
  if (mode === "memory" && slot === "memoryArchive") return "primary";
  if (mode === "operations" && slot === "operationsFloor") return "primary";
  if (mode === "simulation" && slot === "simulationLayer") return "primary";
  if (mode === "analysis" && slot === "marketTopology") return "primary";
  if (mode === "analysis" && (slot === "signalStrip" || slot === "ecosystem")) return "secondary";
  if (mode === "analysis" && slot === "executiveSurface") return "secondary";
  return "primary";
}

export function isOrchSlotVisible(mode: CognitiveDepthMode, slot: OrchSlot): boolean {
  if (mode === "command") return slot === "commandBand";
  if (mode === "memory") {
    return slot === "memoryArchive" || slot === "routes" || slot === "chain";
  }
  if (mode === "operations") {
    if (slot === "commandBand" || slot === "marketTopology" || slot === "memoryArchive" || slot === "simulationLayer")
      return false;
    return true;
  }
  if (mode === "analysis") {
    if (
      slot === "commandBand" ||
      slot === "leverageBand" ||
      slot === "timePressure" ||
      slot === "followUp" ||
      slot === "nbaDetail" ||
      slot === "commandLayer" ||
      slot === "operationsFloor" ||
      slot === "memoryArchive" ||
      slot === "simulationLayer"
    )
      return false;
    return true;
  }
  if (mode === "simulation") {
    if (slot === "commandBand" || slot === "operationsFloor" || slot === "marketTopology" || slot === "memoryArchive")
      return false;
    return true;
  }
  return slot !== "commandBand";
}

export function orchSlotRole(mode: CognitiveDepthMode, slot: OrchSlot): SectionRole {
  if (!isOrchSlotVisible(mode, slot)) return "hidden";
  if (mode === "memory" && slot === "memoryArchive") return "primary";
  if (mode === "operations" && slot === "operationsFloor") return "primary";
  if (mode === "simulation" && slot === "simulationLayer") return "primary";
  if (mode === "analysis" && slot === "marketTopology") return "primary";
  if (mode === "analysis" && slot === "extras") return "secondary";
  if (mode === "analysis" && (slot === "pressure" || slot === "deps" || slot === "blockersGrid" || slot === "chain"))
    return "primary";
  if (mode === "analysis" && (slot === "routes" || slot === "executiveSurface")) return "secondary";
  return "primary";
}
