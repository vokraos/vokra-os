export type {
  FabricModuleKey,
  SignalCategory,
  SignalUrgency,
  SignalNode,
  SignalEdge,
  SignalEvent,
  SignalPropagation,
  SignalPressureMap,
  SignalConflict,
  SignalCascade,
  ModuleInfluence,
  CausalChain,
  SignalStreamEntry,
  SignalFabricSnapshot,
} from "./types";
export { FABRIC_KEY_TO_NAV } from "./types";
export { buildFabricMemoryHints } from "./memoryHints";
export type { FabricMemoryHints } from "./memoryHints";
export { buildSignalFabric } from "./derive";
export type { BuildSignalFabricInput } from "./derive";
export { SignalFabricProvider } from "./SignalFabricProvider";
export { useSignalFabric, useSignalFabricOptional, SignalFabricContext } from "./context";
