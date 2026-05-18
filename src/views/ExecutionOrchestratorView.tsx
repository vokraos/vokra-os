import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { NavId } from "../types";
import {
  ROUTE_STATE_RU,
  ROUTE_URGENCY_RU,
  ROUTE_KIND_LABEL_RU,
  SYSTEM_LABEL_RU,
  orchestrationToJson,
  orchestrationToMarkdown,
  useExecutionOrchestrator,
} from "../lib/execution-orchestrator";
import type { ExecutionRoute } from "../lib/execution-orchestrator/types";
import {
  ExecutionChain,
  OrchCommandLayer,
  OrchExecutiveNba,
  OrchLogisticsMap,
  OrchPressureBoard,
  OrchSequenceRoute,
} from "../components/execution-orchestrator";
import { FollowUpContinuity } from "../components/follow-up/FollowUpContinuity";
import { TimePressurePanel } from "../components/time-pressure/TimePressurePanel";
import { ExecutiveSurface } from "../components/executive-surface/ExecutiveSurface";
import { LeverageDragCostBand } from "../components/business-impact/LeverageDragCostBand";
import { actionCommandsToJson, actionCommandsToMarkdown } from "../lib/action-command";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";
import { useCognitiveDepth, orchSlotRole } from "../lib/cognitive-depth";
import { DepthGate } from "../components/cognitive-depth/DepthGate";
import { DepthSection } from "../components/cognitive-depth/DepthSection";
import { CommandSurface } from "../components/cognitive-depth/CommandSurface";
import { FounderFocusSurface } from "../components/cognitive-depth/FounderFocusSurface";
import { OperationsFloor } from "../components/cognitive-depth/OperationsFloor";
import { MarketTopologyPanel } from "../components/cognitive-depth/MarketTopologyPanel";
import { MemoryArchivePanel } from "../components/cognitive-depth/MemoryArchivePanel";
import { SimulationDepthPanel } from "../components/cognitive-depth/SimulationDepthPanel";
import { routeBusinessConsequenceKey } from "../lib/business-impact";

type Props = { onNavigate: (id: NavId) => void };

export function ExecutionOrchestratorView({ onNavigate }: Props) {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();
  const snap = useExecutionOrchestrator();
  const [focusRouteId, setFocusRouteId] = useState(snap.primaryRouteId);

  useEffect(() => {
    if (!snap.routes.some((r) => r.id === focusRouteId)) {
      setFocusRouteId(snap.primaryRouteId);
    }
  }, [snap.routes, snap.primaryRouteId, focusRouteId]);
  const [toast, setToast] = useState<string | null>(null);

  const primary = useMemo(
    () => snap.routes.find((r) => r.id === focusRouteId) ?? snap.routes[0]!,
    [snap.routes, focusRouteId],
  );

  const saveToMemory = useCallback(() => {
    const json = orchestrationToJson(snap);
    const r0 = snap.routes[0]!;
    recordGeneration({
      module: "execution_orchestrator",
      title: `Оркестратор · ${ROUTE_KIND_LABEL_RU[r0.kind]} · пульс ${snap.pulseGeneration}`,
      content: json,
      mime: "application/json",
      tags: [
        "orchestrator",
        r0.kind,
        r0.routeState,
        String(Math.round(r0.confidence)),
        ...r0.systems.slice(0, 4),
      ],
    });
    setToast(t("orch.toastSaved"));
    window.setTimeout(() => setToast(null), 3200);
  }, [snap, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-execution-orchestrator-${snap.pulseGeneration}.json`, snap);
  }, [snap]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-execution-orchestrator-${snap.pulseGeneration}.md`, orchestrationToMarkdown(snap));
  }, [snap]);

  const copyJson = useCallback(async () => {
    await copyToClipboard(orchestrationToJson(snap));
    setToast(t("orch.toastCopiedJson"));
    window.setTimeout(() => setToast(null), 2200);
  }, [snap, t]);

  const saveCommandsMemory = useCallback(() => {
    const top = snap.actionCommandLayer.topCommandId;
    recordGeneration({
      module: "action_command",
      title: `Командный слой · пульс ${snap.pulseGeneration}`,
      content: actionCommandsToJson(snap.actionCommandLayer),
      mime: "application/json",
      tags: ["action_command", String(snap.actionCommandLayer.commands.length), top ?? "none"],
    });
    setToast(t("orch.cmdToastSaved"));
    window.setTimeout(() => setToast(null), 2800);
  }, [snap, t]);

  const exportCommandsJson = useCallback(() => {
    downloadJson(`vokra-action-commands-${snap.pulseGeneration}.json`, snap.actionCommandLayer);
  }, [snap]);

  const exportCommandsMd = useCallback(() => {
    downloadText(`vokra-action-commands-${snap.pulseGeneration}.md`, actionCommandsToMarkdown(snap.actionCommandLayer));
  }, [snap]);

  const copyCommandsJson = useCallback(async () => {
    await copyToClipboard(actionCommandsToJson(snap.actionCommandLayer));
    setToast(t("orch.cmdToastCopied"));
    window.setTimeout(() => setToast(null), 2200);
  }, [snap, t]);

  const rp = snap.resourcePressure;

  return (
    <div className="orch-lab" data-orch-pulse={snap.pulseGeneration % 1000}>
      <header className="orch-lab__head">
        <p className="orch-lab__eyebrow">{t("orch.eyebrow")}</p>
        <h1 className="orch-lab__title">{t("orch.title")}</h1>
        <p className="orch-lab__lede">{t("orch.subtitle")}</p>
      </header>

      <DepthGate surface="orchestrator" slot="operationsFloor">
        <DepthSection role={orchSlotRole(mode, "operationsFloor")}>
          <OperationsFloor variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="marketTopology">
        <DepthSection role={orchSlotRole(mode, "marketTopology")}>
          <MarketTopologyPanel variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="memoryArchive">
        <DepthSection role={orchSlotRole(mode, "memoryArchive")}>
          <MemoryArchivePanel variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="simulationLayer">
        <DepthSection role={orchSlotRole(mode, "simulationLayer")}>
          <SimulationDepthPanel variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="commandBand">
        {mode === "command" ? <FounderFocusSurface variant="orchestrator" /> : <CommandSurface variant="orchestrator" />}
      </DepthGate>

      <DepthGate surface="orchestrator" slot="executiveSurface">
        <DepthSection role={orchSlotRole(mode, "executiveSurface")}>
          <ExecutiveSurface tone="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="timePressure">
        <DepthSection role={orchSlotRole(mode, "timePressure")}>
          <TimePressurePanel variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="followUp">
        <DepthSection role={orchSlotRole(mode, "followUp")}>
          <FollowUpContinuity variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="leverageBand">
        <DepthSection role={orchSlotRole(mode, "leverageBand")}>
          <LeverageDragCostBand variant="orchestrator" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="nbaDetail">
        <DepthSection role={orchSlotRole(mode, "nbaDetail")}>
          <details className="orch-lab__exec-detail">
            <summary className="orch-lab__exec-detail-sum">{t("orch.directiveDetail")}</summary>
            <OrchExecutiveNba primary={primary} nextGlobalRu={snap.nextBestActionRu} blockers={snap.blockers} />
          </details>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="commandLayer">
        <DepthSection role={orchSlotRole(mode, "commandLayer")}>
          <OrchCommandLayer
            layer={snap.actionCommandLayer}
            onSaveMemory={saveCommandsMemory}
            onExportJson={exportCommandsJson}
            onExportMd={exportCommandsMd}
            onCopyJson={() => void copyCommandsJson()}
          />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="routes">
        <DepthSection role={orchSlotRole(mode, "routes")}>
          <section className="orch-lab__panel glass-panel">
            <h2 className="orch-lab__h2">{t("orch.routes")}</h2>
            <div className="orch-lab__route-tabs">
              {snap.routes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`orch-lab__tab orch-lab__tab--${r.routeState}${r.id === focusRouteId ? " orch-lab__tab--on" : ""}`}
                  onClick={() => setFocusRouteId(r.id)}
                >
                  <span className="orch-lab__tab-t">{ROUTE_KIND_LABEL_RU[r.kind]}</span>
                  <span className="orch-lab__tab-s">{ROUTE_STATE_RU[r.routeState]}</span>
                </button>
              ))}
            </div>
            <RouteDetail route={primary} />
          </section>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="chain">
        <DepthSection role={orchSlotRole(mode, "chain")}>
          <section className="orch-lab__panel glass-panel orch-lab__panel--chain">
            <h2 className="orch-lab__h2">{t("orch.executionChain")}</h2>
            <ExecutionChain
              stages={primary.sequence.stages}
              expectedImpactRu={primary.expectedImpactRu}
              risksRu={primary.risksRu}
              consequenceKey={routeBusinessConsequenceKey(primary)}
            />
            <details className="orch-lab__seq-detail">
              <summary className="orch-lab__seq-detail-sum">{t("orch.detailSequence")}</summary>
              <OrchSequenceRoute stages={primary.sequence.stages} />
            </details>
          </section>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="pressure">
        <DepthSection role={orchSlotRole(mode, "pressure")}>
          <section className="orch-lab__panel glass-panel orch-lab__panel--pressure">
            <h2 className="orch-lab__h2">{t("orch.pressure")}</h2>
            <OrchPressureBoard rp={rp} />
          </section>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="deps">
        <DepthSection role={orchSlotRole(mode, "deps")}>
          <section className="orch-lab__panel glass-panel orch-lab__panel--flush">
            <h2 className="orch-lab__h2">{t("orch.deps")}</h2>
            <p className="orch-lab__graph-sum">{snap.dependencyGraph.summaryRu}</p>
            <OrchLogisticsMap
              routes={snap.routes}
              focusRouteId={focusRouteId}
              edges={snap.dependencyGraph.edges}
              pulseGeneration={snap.pulseGeneration}
              hintRu={t("orch.graphHint")}
            />
          </section>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="blockersGrid">
        <DepthSection role={orchSlotRole(mode, "blockersGrid")}>
          <div className="orch-lab__grid2">
            <section className="orch-lab__panel glass-panel">
              <h2 className="orch-lab__h2">{t("orch.blockers")}</h2>
              <ul className="orch-lab__blockers orch-lab__blockers--compact">
                {snap.blockers.map((b) => (
                  <li key={b.id}>
                    <div className="orch-lab__bn-bar" style={{ "--orch-v": b.severity } as CSSProperties} />
                    <div>
                      <p className="orch-lab__bn-title">{b.labelRu}</p>
                      <p className="orch-lab__bn-meta">{b.severity}%</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="orch-lab__panel glass-panel">
              <details className="orch-lab__sys-detail">
                <summary className="orch-lab__sys-detail-sum">
                  {t("orch.systemsExpand")} · {snap.systemsInvolvedRu.length}
                </summary>
                <div className="orch-lab__chips">
                  {snap.systemsInvolvedRu.map((s, i) => (
                    <span key={i} className="orch-lab__chip">
                      {s}
                    </span>
                  ))}
                </div>
                <h3 className="orch-lab__h3">{t("orch.integration")}</h3>
                <p className="orch-lab__int-line">{clip(snap.integrationRu.join(" "), 320)}</p>
              </details>
            </section>
          </div>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="orchestrator" slot="extras">
        <DepthSection role={orchSlotRole(mode, "extras")}>
          <div className="orch-lab__actions">
            <button type="button" className="orch-lab__btn orch-lab__btn--primary" onClick={saveToMemory}>
              {t("orch.saveMemory")}
            </button>
            <button type="button" className="orch-lab__btn" onClick={exportJson}>
              {t("orch.exportJson")}
            </button>
            <button type="button" className="orch-lab__btn" onClick={exportMd}>
              {t("orch.exportMd")}
            </button>
            <button type="button" className="orch-lab__btn" onClick={() => void copyJson()}>
              {t("orch.copyJson")}
            </button>
          </div>

          <div className="orch-lab__links">
            <span className="orch-lab__links-k">{t("orch.links")}</span>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("signalFabric")}>
              {t("nav.signalFabric")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("temporalStrategy")}>
              {t("nav.temporalStrategy")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("strategicSimulation")}>
              {t("nav.strategicSimulation")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("missionControl")}>
              {t("nav.missionControl")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("command")}>
              {t("nav.command")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("marketplaceOperations")}>
              {t("nav.marketplaceOperations")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("skuIntelligence")}>
              {t("nav.skuIntelligence")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("memory")}>
              {t("nav.memory")}
            </button>
            <button type="button" className="orch-lab__link" onClick={() => onNavigate("dna")}>
              {t("nav.dna")}
            </button>
          </div>
        </DepthSection>
      </DepthGate>

      {toast ? <p className="orch-lab__toast">{toast}</p> : null}

      <style>{`
        .orch-lab {
          max-width: 1120px;
          margin: 0 auto;
          padding: 8px 4px 48px;
        }
        .orch-lab__head {
          margin-bottom: 18px;
        }
        .orch-lab__eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 10px;
        }
        .orch-lab__title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.45rem, 2.8vw, 2.05rem);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .orch-lab__lede {
          margin: 0;
          max-width: 42rem;
          color: var(--muted);
          font-size: 0.86rem;
          line-height: 1.45;
        }
        .orch-lab__exec-detail {
          margin-bottom: 16px;
          border-radius: var(--radius-xl);
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
          padding: 0 14px 12px;
        }
        .orch-lab__exec-detail-sum {
          list-style: none;
          cursor: pointer;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(145, 158, 188, 0.72);
          padding: 12px 0 10px;
        }
        .orch-lab__exec-detail-sum::-webkit-details-marker {
          display: none;
        }
        .orch-lab__exec-detail[open] .orch-lab__exec-detail-sum {
          margin-bottom: 4px;
          color: rgba(175, 190, 220, 0.88);
        }
        .orch-lab__sys-detail {
          margin: 0;
        }
        .orch-lab__sys-detail-sum {
          list-style: none;
          cursor: pointer;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(145, 158, 188, 0.72);
          padding: 2px 0 10px;
        }
        .orch-lab__sys-detail-sum::-webkit-details-marker {
          display: none;
        }
        .orch-lab__sys-detail[open] .orch-lab__sys-detail-sum {
          margin-bottom: 10px;
          color: rgba(175, 190, 220, 0.88);
        }
        .orch-lab__panel {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
          margin-bottom: 16px;
        }
        .orch-lab__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 12px;
        }
        .orch-lab__h3 {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 18px 0 8px;
        }
        .orch-lab__grid2 {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px) {
          .orch-lab__grid2 {
            grid-template-columns: 1fr;
          }
        }
        .orch-lab__route-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }
        .orch-lab__tab {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
          color: var(--muted);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 12px;
          cursor: pointer;
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          text-align: left;
        }
        .orch-lab__tab-t {
          color: rgba(210, 218, 235, 0.88);
        }
        .orch-lab__tab-s {
          font-size: 0.52rem;
          letter-spacing: 0.12em;
          color: rgba(140, 152, 178, 0.55);
        }
        .orch-lab__tab--on {
          border-color: rgba(123, 143, 255, 0.42);
          box-shadow: 0 0 0 1px rgba(123, 143, 255, 0.08);
        }
        .orch-lab__tab--blocked {
          border-color: rgba(160, 100, 100, 0.28);
        }
        .orch-lab__tab--active .orch-lab__tab-s,
        .orch-lab__tab--scaling .orch-lab__tab-s {
          color: rgba(170, 188, 230, 0.75);
        }
        .orch-lab__graph-sum {
          margin: 0 0 10px;
          font-size: 0.7rem;
          color: rgba(150, 162, 188, 0.62);
          line-height: 1.35;
        }
        .orch-lab__panel--flush {
          padding-bottom: 14px;
        }
        .orch-lab__panel--chain {
          padding-bottom: 16px;
        }
        .orch-lab__seq-detail {
          margin: 12px 0 0;
        }
        .orch-lab__seq-detail-sum {
          list-style: none;
          cursor: pointer;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(145, 158, 188, 0.72);
          padding: 4px 0 8px;
        }
        .orch-lab__seq-detail-sum::-webkit-details-marker {
          display: none;
        }
        .orch-lab__seq-detail[open] .orch-lab__seq-detail-sum {
          margin-bottom: 6px;
          color: rgba(175, 190, 220, 0.88);
        }
        .orch-lab__panel--pressure {
          min-width: 0;
        }
        .orch-lab__panel--seq {
          min-width: 0;
        }
        .orch-lab__blockers {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .orch-lab__blockers li {
          display: grid;
          grid-template-columns: 5px 1fr;
          gap: 12px;
        }
        .orch-lab__bn-bar {
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          min-height: 40px;
          overflow: hidden;
        }
        .orch-lab__bn-bar::after {
          content: "";
          display: block;
          width: 100%;
          height: calc(var(--orch-v, 40) * 1%);
          max-height: 100%;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(180, 140, 140, 0.15), rgba(190, 130, 130, 0.5));
        }
        .orch-lab__bn-title {
          margin: 0 0 4px;
          font-size: 0.8rem;
          color: rgba(220, 225, 238, 0.9);
        }
        .orch-lab__bn-meta {
          margin: 0;
          font-size: 0.7rem;
          color: var(--muted);
        }
        .orch-lab__blockers--compact li {
          gap: 10px;
        }
        .orch-lab__blockers--compact .orch-lab__bn-bar {
          min-height: 32px;
        }
        .orch-lab__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0 0 4px;
        }
        .orch-lab__chip {
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: rgba(165, 178, 208, 0.72);
          background: rgba(0, 0, 0, 0.22);
        }
        .orch-lab__int-line {
          margin: 0;
          font-size: 0.68rem;
          line-height: 1.45;
          color: rgba(140, 152, 178, 0.62);
        }
        .orch-lab__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 18px 0;
        }
        .orch-lab__btn {
          border-radius: 99px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.3);
          color: var(--muted);
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 16px;
          cursor: pointer;
        }
        .orch-lab__btn--primary {
          border-color: rgba(123, 143, 255, 0.45);
          color: var(--text);
          background: rgba(123, 143, 255, 0.08);
        }
        .orch-lab__links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .orch-lab__links-k {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 8px;
        }
        .orch-lab__link {
          border: none;
          background: none;
          color: rgba(160, 175, 215, 0.75);
          font-size: 0.78rem;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .orch-lab__toast {
          margin: 10px 0 0;
          font-size: 0.78rem;
          color: rgba(160, 200, 160, 0.85);
        }
      `}</style>
    </div>
  );
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

function RouteDetail({ route }: { route: ExecutionRoute }) {
  const { t } = useI18n();
  const consKey = routeBusinessConsequenceKey(route);
  return (
    <div className="orch-detail">
      <div className="orch-detail__row">
        <span className="orch-detail__pill">{ROUTE_STATE_RU[route.routeState]}</span>
        <span className="orch-detail__pill">срочность · {ROUTE_URGENCY_RU[route.urgency]}</span>
        <span className="orch-detail__pill">уверенность {route.confidence}%</span>
      </div>
      <h3 className="orch-detail__h">{route.objectiveRu}</h3>
      <p className="orch-detail__line">
        <span className="orch-detail__k">{t("orch.detailOpConsequence")}</span>
        {clip(t(consKey), 130)}
      </p>
      <p className="orch-detail__line">
        <span className="orch-detail__k">{t("orch.detailBizEffect")}</span>
        {clip(route.expectedImpactRu, 110)}
      </p>
      <p className="orch-detail__line">
        <span className="orch-detail__k">{t("orch.detailRiskIf")}</span>
        {clip(route.risksRu, 100)}
      </p>
      {route.blockersRu.length ? (
        <div className="orch-detail__chips">
          {route.blockersRu.map((b) => (
            <span key={b} className="orch-detail__chip">
              {clip(b, 42)}
            </span>
          ))}
        </div>
      ) : null}
      <p className="orch-detail__sys">Системы · {route.systems.map((s) => SYSTEM_LABEL_RU[s]).join(" · ")}</p>
      <style>{`
        .orch-detail__row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        .orch-detail__pill {
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(175, 190, 220, 0.75);
        }
        .orch-detail__h {
          margin: 0 0 8px;
          font-size: 0.88rem;
          line-height: 1.3;
          color: rgba(218, 224, 238, 0.95);
        }
        .orch-detail__line {
          margin: 0 0 6px;
          font-size: 0.72rem;
          line-height: 1.4;
          color: rgba(155, 166, 192, 0.78);
        }
        .orch-detail__k {
          font-size: 0.5rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 6px;
        }
        .orch-detail__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 4px 0 8px;
        }
        .orch-detail__chip {
          font-size: 0.6rem;
          padding: 3px 8px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(165, 175, 200, 0.7);
          background: rgba(0, 0, 0, 0.2);
        }
        .orch-detail__sys {
          margin: 0;
          font-size: 0.65rem;
          color: rgba(130, 142, 168, 0.55);
        }
      `}</style>
    </div>
  );
}
