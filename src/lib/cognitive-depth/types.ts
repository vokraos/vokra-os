/** Global cognitive rendering depth — not navigation, not agents. */

export type CognitiveDepthMode = "command" | "operations" | "analysis" | "memory" | "simulation";

export type DepthSurface = "dashboard" | "mission" | "orchestrator";

export type DashboardSlot =
  | "commandBand"
  | "todayStack"
  | "executiveSurface"
  | "quickActions"
  | "moduleGrid"
  | "operationsFloor"
  | "marketTopology"
  | "memoryArchive"
  | "simulationLayer";

export type MissionSlot =
  | "commandBand"
  | "todayStack"
  | "leverageBand"
  | "timePressure"
  | "followUp"
  | "executiveSurface"
  | "signalStrip"
  | "ecosystem"
  | "operationsFloor"
  | "marketTopology"
  | "memoryArchive"
  | "simulationLayer";

export type OrchSlot =
  | "commandBand"
  | "executiveSurface"
  | "leverageBand"
  | "timePressure"
  | "followUp"
  | "nbaDetail"
  | "commandLayer"
  | "routes"
  | "chain"
  | "pressure"
  | "deps"
  | "blockersGrid"
  | "extras"
  | "operationsFloor"
  | "marketTopology"
  | "memoryArchive"
  | "simulationLayer";

export type SectionRole = "primary" | "secondary" | "hidden";
