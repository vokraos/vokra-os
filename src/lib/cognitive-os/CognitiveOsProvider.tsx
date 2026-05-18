import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NavId } from "../../types";
import type {
  CognitiveOsState,
  CognitivePulseEvent,
  CognitiveSynthesisState,
  DecisionEngineState,
  MarketRegime,
  ModuleCognitiveSnapshot,
} from "./types";
import { defaultSnapshot, initialModules } from "./defaults";
import { randomPulseEvent } from "./eventCatalog";
import { applySynthesisAfterPulse, initialSynthesis, pickMemoryEchoByTick } from "./synthesis";
import { applyDecisionEngineAfterPulse, initialDecisionEngine } from "./decisionEngine";
import type { InitiativeUrgency } from "../initiative-engine/types";
import {
  deriveInitiatives,
  loadInitiativeMemory,
  maxUrgencyFromInitiatives,
  persistInitiativeMemory,
  reinforcePattern,
  suppressInitiative,
} from "../initiative-engine";
import { clamp } from "../math";

function recomputeInitiativesFromState(s: CognitiveOsState): CognitiveOsState["initiatives"] {
  return deriveInitiatives({
    synthesis: s.synthesis,
    decision: s.decision,
    lastEvent: s.lastEvent,
    modules: s.modules,
    pulseGeneration: s.pulseGeneration,
    initiativeScanGeneration: s.initiativeScanGeneration,
    memory: s.initiativeMemory,
  });
}

function initialCognitiveOsState(): CognitiveOsState {
  const modules = initialModules();
  const synthesis = initialSynthesis();
  const decision = initialDecisionEngine();
  const initiativeMemory = loadInitiativeMemory();
  const base: CognitiveOsState = {
    modules,
    synthesis,
    decision,
    lastEvent: null,
    pulseGeneration: 0,
    brandDnaSurfaceActive: false,
    initiativeScanGeneration: 0,
    initiativeMemory,
    initiatives: [],
  };
  return { ...base, initiatives: recomputeInitiativesFromState(base) };
}

function patchModule(
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  id: NavId,
  patch: Partial<ModuleCognitiveSnapshot>,
): void {
  const cur = { ...(modules[id] ?? defaultSnapshot()) };
  modules[id] = {
    ...cur,
    ...patch,
    signalHealth: patch.signalHealth != null ? clamp(patch.signalHealth) : cur.signalHealth,
    pressure: patch.pressure != null ? clamp(patch.pressure) : cur.pressure,
    confidence: patch.confidence != null ? clamp(patch.confidence) : cur.confidence,
  };
}

function applyPulse(prev: CognitiveOsState, ev: CognitivePulseEvent): CognitiveOsState {
  const modules: Partial<Record<NavId, ModuleCognitiveSnapshot>> = { ...prev.modules };
  for (const id of ev.targets) {
    const cur = modules[id] ?? defaultSnapshot();
    const bump = id === ev.source ? 7 : 4;
    patchModule(modules, id, {
      incomingRu: ev.titleRu,
      activity: id === ev.source ? "priority" : cur.activity === "steady" ? "active" : cur.activity,
      pressure: clamp(cur.pressure + bump, 0, 94),
      sync: cur.sync === "synced" && id !== ev.source ? "catchup" : cur.sync,
      signalHealth: clamp(cur.signalHealth + (Math.random() > 0.55 ? 2 : -3)),
    });
  }
  const src = modules[ev.source] ?? defaultSnapshot();
  patchModule(modules, ev.source, {
    outgoingRu: ev.detailRu,
    activity: "priority",
    confidence: clamp(src.confidence + 3),
  });

  if (ev.id === "visual-brand-watch") {
    patchModule(modules, "visual", { brandGate: "watch", pressure: clamp((modules.visual?.pressure ?? 40) + 6) });
    patchModule(modules, "visualStrategy", { brandGate: "watch", pressure: clamp((modules.visualStrategy?.pressure ?? 40) + 5) });
    patchModule(modules, "dna", { activity: "sync" });
    patchModule(modules, "missionControl", { pressure: clamp((modules.missionControl?.pressure ?? 44) + 5) });
    patchModule(modules, "strategicSimulation", { pressure: clamp((modules.strategicSimulation?.pressure ?? 36) + 3), activity: "active" });
  }
  if (ev.id === "dna-governor-tighten") {
    for (const id of ["visual", "visualStrategy", "rich", "reels", "campaign"] as const) {
      patchModule(modules, id, { brandGate: "hold", sync: "catchup" });
    }
  }
  if (ev.id === "trend-oversize-premium") {
    patchModule(modules, "command", { pressure: clamp((modules.command?.pressure ?? 40) + 5), activity: "priority" });
    patchModule(modules, "missionControl", { pressure: clamp((modules.missionControl?.pressure ?? 44) + 6) });
    patchModule(modules, "strategicSimulation", { confidence: clamp((modules.strategicSimulation?.confidence ?? 86) + 2) });
    patchModule(modules, "operations", { sync: "catchup", pressure: clamp((modules.operations?.pressure ?? 40) + 4) });
    patchModule(modules, "seo", { confidence: clamp((modules.seo?.confidence ?? 70) + 2) });
    patchModule(modules, "visual", { activity: "active" });
    patchModule(modules, "visualStrategy", { activity: "active" });
    patchModule(modules, "campaign", { activity: "active" });
  }

  const synthesis = applySynthesisAfterPulse(prev.synthesis, ev, modules, prev.pulseGeneration + 1);
  const decision = applyDecisionEngineAfterPulse(ev, synthesis, modules, prev.pulseGeneration + 1);

  const nextMemory = reinforcePattern(ev.id, prev.initiativeMemory, 1);
  persistInitiativeMemory(nextMemory);
  const pulseGeneration = prev.pulseGeneration + 1;
  const initiatives = deriveInitiatives({
    synthesis,
    decision,
    lastEvent: ev,
    modules,
    pulseGeneration,
    initiativeScanGeneration: prev.initiativeScanGeneration,
    memory: nextMemory,
  });

  return {
    ...prev,
    modules,
    synthesis,
    decision,
    lastEvent: ev,
    pulseGeneration,
    initiativeMemory: nextMemory,
    initiatives,
  };
}

function softDrift(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>, id: NavId): void {
  const cur = modules[id] ?? defaultSnapshot();
  patchModule(modules, id, {
    signalHealth: clamp(cur.signalHealth + (Math.random() - 0.5) * 5),
    pressure: clamp(cur.pressure + (Math.random() - 0.5) * 4),
    confidence: clamp(cur.confidence + (Math.random() - 0.5) * 3),
  });
}

export type CognitiveOsContextValue = {
  getModule: (id: NavId) => ModuleCognitiveSnapshot;
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  regime: MarketRegime;
  lastEvent: CognitivePulseEvent | null;
  pulseGeneration: number;
  brandDnaSurfaceActive: boolean;
  setBrandDnaSurfaceActive: (v: boolean) => void;
  dismissLastEvent: () => void;
  initiatives: CognitiveOsState["initiatives"];
  initiativeUrgency: InitiativeUrgency;
  initiativeScanGeneration: number;
  dismissInitiative: (id: string) => void;
};

const CognitiveOsContext = createContext<CognitiveOsContextValue | null>(null);

export function CognitiveOsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CognitiveOsState>(initialCognitiveOsState);

  const getModule = useCallback(
    (id: NavId): ModuleCognitiveSnapshot => {
      return state.modules[id] ?? defaultSnapshot();
    },
    [state.modules],
  );

  const dismissLastEvent = useCallback(() => {
    setState((s) => ({ ...s, lastEvent: null }));
  }, []);

  const setBrandDnaSurfaceActive = useCallback((v: boolean) => {
    setState((s) => ({ ...s, brandDnaSurfaceActive: v }));
  }, []);

  const dismissInitiative = useCallback((id: string) => {
    setState((s) => {
      const initiativeMemory = suppressInitiative(id, s.pulseGeneration, s.initiativeMemory, 8);
      persistInitiativeMemory(initiativeMemory);
      return { ...s, initiativeMemory, initiatives: recomputeInitiativesFromState({ ...s, initiativeMemory }) };
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => applyPulse(s, randomPulseEvent()));
    }, 82000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        const keys = Object.keys(s.modules) as NavId[];
        if (!keys.length) return s;
        const pick = keys[Math.floor(Math.random() * keys.length)]!;
        const modules = { ...s.modules };
        softDrift(modules, pick);
        const next = { ...s, modules, initiatives: recomputeInitiativesFromState({ ...s, modules }) };
        return next;
      });
    }, 11000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      setState((s) => ({
        ...s,
        synthesis: { ...s.synthesis, memoryEchoRu: pickMemoryEchoByTick(s.pulseGeneration + tick * 13) },
      }));
    }, 68000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        const initiativeScanGeneration = s.initiativeScanGeneration + 1;
        return {
          ...s,
          initiativeScanGeneration,
          initiatives: recomputeInitiativesFromState({ ...s, initiativeScanGeneration }),
        };
      });
    }, 46000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ev = state.lastEvent;
    if (!ev) return;
    const t = window.setTimeout(() => {
      setState((s) => {
        const modules = { ...s.modules };
        for (const id of ev.targets) {
          const cur = modules[id];
          if (cur?.incomingRu === ev.titleRu) {
            patchModule(modules, id, { incomingRu: null });
          }
        }
        return { ...s, modules, initiatives: recomputeInitiativesFromState({ ...s, modules }) };
      });
    }, 30000);
    return () => clearTimeout(t);
  }, [state.lastEvent?.id, state.pulseGeneration]);

  const value = useMemo<CognitiveOsContextValue>(
    () => ({
      getModule,
      synthesis: state.synthesis,
      decision: state.decision,
      regime: state.synthesis.regime,
      lastEvent: state.lastEvent,
      pulseGeneration: state.pulseGeneration,
      brandDnaSurfaceActive: state.brandDnaSurfaceActive,
      setBrandDnaSurfaceActive,
      dismissLastEvent,
      initiatives: state.initiatives,
      initiativeUrgency: maxUrgencyFromInitiatives(state.initiatives),
      initiativeScanGeneration: state.initiativeScanGeneration,
      dismissInitiative,
    }),
    [
      getModule,
      state.synthesis,
      state.decision,
      state.lastEvent,
      state.pulseGeneration,
      state.brandDnaSurfaceActive,
      state.initiatives,
      state.initiativeScanGeneration,
      dismissLastEvent,
      dismissInitiative,
      setBrandDnaSurfaceActive,
    ],
  );

  return <CognitiveOsContext.Provider value={value}>{children}</CognitiveOsContext.Provider>;
}

export function useCognitiveOs(): CognitiveOsContextValue {
  const v = useContext(CognitiveOsContext);
  if (!v) throw new Error("useCognitiveOs must be used within CognitiveOsProvider");
  return v;
}
