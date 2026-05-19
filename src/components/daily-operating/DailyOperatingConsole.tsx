import { useMemo, useEffect, useState } from "react";
import { buildEntitySnapBlocks } from "./buildEntitySnapBlocks";
import { useOperatingRoleMode } from "../../lib/operating-role-mode";
import type { NavId } from "../../types";
import { useI18n } from "../../lib/i18n/I18nContext";
import { navMessageKey } from "../../lib/i18n/navLabels";
import { useCognitiveOs } from "../../lib/cognitive-os";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useLiveState } from "../../lib/live-state";
import { DAILY_FLOW_STEPS, useDailyOperating, useDailyConsoleLines } from "../../lib/daily-operating";
import { useExecutiveDecisionBoard } from "../../lib/executive-decision-compression";
import { ENTITY_SNAPSHOT_EVENT } from "../../lib/entity-snapshot";
import { ASSORTMENT_ACTIONS_EVENT } from "../../lib/assortment-actions";
import { HERO_COMMAND_EVENT } from "../../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../../lib/launch-ops";
import { FOUNDER_BRIEF_EVENT } from "../../lib/founder-brief";
import { ECONOMIC_PRESSURE_EVENT } from "../../lib/economic-pressure";
import { AD_PRESSURE_EVENT } from "../../lib/ad-pressure";
import { OS_HEALTH_AUDIT_EVENT } from "../../lib/os-health-audit";
import { GUIDED_SETUP_EVENT } from "../../lib/guided-setup";
import { OPERATOR_BRIEF_EVENT } from "../../lib/operator-brief";
import { EXECUTION_FEEDBACK_EVENT } from "../../lib/execution-feedback";
import { CONTROL_TOWER_EVENT } from "../../lib/strategic-control-tower";
import { MARKET_TIMING_EVENT } from "../../lib/market-timing";
import { CORRIDOR_STRATEGY_EVENT } from "../../lib/corridor-strategy";
import { FBO_FBS_DECISION_EVENT } from "../../lib/fbo-fbs-decision";
import { SCALING_SAFETY_EVENT } from "../../lib/scaling-safety";
import { PRODUCTION_PRESSURE_EVENT } from "../../lib/production-pressure";
import { DAILY_WAR_ROOM_EVENT } from "../../lib/daily-war-room";
import { MORNING_FLOW_EVENT } from "../../lib/morning-operating-flow";
import { EVENING_CLOSE_EVENT } from "../../lib/evening-close";
import { PRICE_POSITIONING_EVENT } from "../../lib/price-positioning";
import { UNIT_ECONOMICS_EVENT } from "../../lib/unit-economics";
import { useSafeMode } from "../../hooks/useSafeMode";
import { useCleanDayMode, cleanDayHiddenSet } from "../../lib/clean-day-mode";

type Props = { active: NavId; onNavigate: (id: NavId) => void };

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function DailyOperatingConsole({ active, onNavigate }: Props) {
  const { t, locale } = useI18n();
  const safe = useSafeMode();
  const safeEnabled = safe.enabled;
  const safeDisabledKey = safe.disabledFeatures.join(",");
  const { synthesis, decision, initiativeUrgency, pulseGeneration } = useCognitiveOs();
  const orch = useExecutionOrchestrator();
  const { live } = useLiveState();
  const { focusMode, toggleFocusMode, recentNav } = useDailyOperating();
  const { mode: roleMode } = useOperatingRoleMode();
  const cleanDay = useCleanDayMode();
  const cleanHide = useMemo(
    () => (cleanDay.enabled ? cleanDayHiddenSet(cleanDay.hiddenNavIds) : new Set<NavId>()),
    [cleanDay.enabled, cleanDay.hiddenNavIds],
  );
  const edc = useExecutiveDecisionBoard();
  const [esTick, setEsTick] = useState(0);
  const [aaTick, setAaTick] = useState(0);
  const [hcTick, setHcTick] = useState(0);
  const [fbTick, setFbTick] = useState(0);
  const [adpTick, setAdpTick] = useState(0);
  const [ssfTick, setSsfTick] = useState(0);
  const [pprTick, setPprTick] = useState(0);
  const [ffdTick, setFfdTick] = useState(0);
  const [cstTick, setCstTick] = useState(0);
  const [mtmTick, setMtmTick] = useState(0);
  const [sctTick, setSctTick] = useState(0);
  const [ohaTick, setOhaTick] = useState(0);
  const [gspTick, setGspTick] = useState(0);
  const [opmTick, setOpmTick] = useState(0);
  const [efbTick, setEfbTick] = useState(0);
  const [dwrTick, setDwrTick] = useState(0);
  const [mflowTick, setMflowTick] = useState(0);
  const [ecloseTick, setEcloseTick] = useState(0);

  useEffect(() => {
    const fn = () => setAaTick((x) => x + 1);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, fn);
    return () => window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, fn);
  }, []);

  useEffect(() => {
    const fn = () => setEsTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, fn);
    return () => window.removeEventListener(ENTITY_SNAPSHOT_EVENT, fn);
  }, []);

  useEffect(() => {
    const fn = () => setHcTick((x) => x + 1);
    window.addEventListener(HERO_COMMAND_EVENT, fn);
    window.addEventListener(LAUNCH_OPS_EVENT, fn);
    return () => {
      window.removeEventListener(HERO_COMMAND_EVENT, fn);
      window.removeEventListener(LAUNCH_OPS_EVENT, fn);
    };
  }, []);

  useEffect(() => {
    const fn = () => setFbTick((x) => x + 1);
    const adpFn = () => setAdpTick((x) => x + 1);
    window.addEventListener(FOUNDER_BRIEF_EVENT, fn);
    window.addEventListener(ECONOMIC_PRESSURE_EVENT, fn);
    window.addEventListener(UNIT_ECONOMICS_EVENT, fn);
    window.addEventListener(PRICE_POSITIONING_EVENT, fn);
    window.addEventListener(AD_PRESSURE_EVENT, adpFn);
    const ssfFn = () => setSsfTick((x) => x + 1);
    window.addEventListener(SCALING_SAFETY_EVENT, ssfFn);
    const pprFn = () => setPprTick((x) => x + 1);
    window.addEventListener(PRODUCTION_PRESSURE_EVENT, pprFn);
    const ffdFn = () => setFfdTick((x) => x + 1);
    window.addEventListener(FBO_FBS_DECISION_EVENT, ffdFn);
    const cstFn = () => setCstTick((x) => x + 1);
    window.addEventListener(CORRIDOR_STRATEGY_EVENT, cstFn);
    const mtmFn = () => setMtmTick((x) => x + 1);
    window.addEventListener(MARKET_TIMING_EVENT, mtmFn);
    const sctFn = () => setSctTick((x) => x + 1);
    window.addEventListener(CONTROL_TOWER_EVENT, sctFn);
    const ohaFn = () => setOhaTick((x) => x + 1);
    const gspFn = () => setGspTick((x) => x + 1);
    window.addEventListener(OS_HEALTH_AUDIT_EVENT, ohaFn);
    window.addEventListener(GUIDED_SETUP_EVENT, gspFn);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, gspFn);
    const opmFn = () => setOpmTick((x) => x + 1);
    window.addEventListener(OPERATOR_BRIEF_EVENT, opmFn);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, opmFn);
    const efbFn = () => setEfbTick((x) => x + 1);
    window.addEventListener(EXECUTION_FEEDBACK_EVENT, efbFn);
    const dwrFn = () => setDwrTick((x) => x + 1);
    window.addEventListener(DAILY_WAR_ROOM_EVENT, dwrFn);
    const mflowFn = () => setMflowTick((x) => x + 1);
    window.addEventListener(MORNING_FLOW_EVENT, mflowFn);
    const ecloseFn = () => setEcloseTick((x) => x + 1);
    window.addEventListener(EVENING_CLOSE_EVENT, ecloseFn);
    return () => {
      window.removeEventListener(FOUNDER_BRIEF_EVENT, fn);
      window.removeEventListener(ECONOMIC_PRESSURE_EVENT, fn);
      window.removeEventListener(UNIT_ECONOMICS_EVENT, fn);
      window.removeEventListener(PRICE_POSITIONING_EVENT, fn);
      window.removeEventListener(AD_PRESSURE_EVENT, adpFn);
      window.removeEventListener(SCALING_SAFETY_EVENT, ssfFn);
      window.removeEventListener(PRODUCTION_PRESSURE_EVENT, pprFn);
      window.removeEventListener(FBO_FBS_DECISION_EVENT, ffdFn);
      window.removeEventListener(CORRIDOR_STRATEGY_EVENT, cstFn);
      window.removeEventListener(MARKET_TIMING_EVENT, mtmFn);
      window.removeEventListener(CONTROL_TOWER_EVENT, sctFn);
      window.removeEventListener(OS_HEALTH_AUDIT_EVENT, ohaFn);
      window.removeEventListener(GUIDED_SETUP_EVENT, gspFn);
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, gspFn);
      window.removeEventListener(OPERATOR_BRIEF_EVENT, opmFn);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, opmFn);
      window.removeEventListener(EXECUTION_FEEDBACK_EVENT, efbFn);
      window.removeEventListener(DAILY_WAR_ROOM_EVENT, dwrFn);
      window.removeEventListener(MORNING_FLOW_EVENT, mflowFn);
      window.removeEventListener(EVENING_CLOSE_EVENT, ecloseFn);
    };
  }, []);

  const consoleTicks = useMemo(
    () => ({
      es: esTick,
      aa: aaTick,
      hc: hcTick,
      fb: fbTick,
      adp: adpTick,
      ssf: ssfTick,
      ppr: pprTick,
      ffd: ffdTick,
      cst: cstTick,
      mtm: mtmTick,
      sct: sctTick,
      oha: ohaTick,
      gsp: gspTick,
      opm: opmTick,
      efb: efbTick,
      dwr: dwrTick,
      mflow: mflowTick,
      eclose: ecloseTick,
    }),
    [
      esTick,
      aaTick,
      hcTick,
      fbTick,
      adpTick,
      ssfTick,
      pprTick,
      ffdTick,
      cstTick,
      mtmTick,
      sctTick,
      ohaTick,
      gspTick,
      opmTick,
      efbTick,
      dwrTick,
      mflowTick,
      ecloseTick,
    ],
  );

  const { merged: consoleLines, deferred: deferredLines } = useDailyConsoleLines(
    consoleTicks,
    t,
    locale,
    safeEnabled,
    safeDisabledKey,
  );

  const rp = orch.resourcePressure;
  const primary = orch.routes.find((r) => r.id === orch.primaryRouteId) ?? orch.routes[0];
  const primaryRouteState = primary?.routeState;
  const primaryConfidence = primary?.confidence ?? 55;

  const pressure = useMemo(
    () => ({
      production: Math.min(100, Math.round((rp.dtfQueue + rp.packagingBottleneck) / 2)),
      seo: Math.min(100, Math.round(rp.seoBandwidth)),
      launch: Math.min(100, Math.round(100 - synthesis.launchReadiness)),
      premium: Math.min(100, Math.round(100 - primaryConfidence)),
      content: Math.min(100, Math.round(rp.contentLoad)),
      execution: Math.min(100, Math.round(orch.operationalDrag)),
      fatigue: Math.min(100, Math.round(100 * (1 - live.confidenceDrift.settling01))),
      overload: Math.min(100, Math.round(synthesis.pressureIndex)),
    }),
    [
      live.confidenceDrift.settling01,
      orch.operationalDrag,
      primaryConfidence,
      rp.contentLoad,
      rp.dtfQueue,
      rp.packagingBottleneck,
      rp.seoBandwidth,
      synthesis.launchReadiness,
      synthesis.pressureIndex,
    ],
  );

  const digest = useMemo(() => {
    const items: { id: string; text: string }[] = [];
    if (orch.blockers.length > 0) {
      items.push({
        id: "blk",
        text: clip(t("daily.digest.blockers").replace("{n}", String(orch.blockers.length)), 96),
      });
    }
    if (primaryRouteState === "blocked") {
      items.push({ id: "route", text: clip(t("daily.digest.routeBlocked"), 96) });
    }
    items.push({ id: "opp", text: clip(synthesis.topOpportunityRu, 100) });
    return items.slice(0, 3);
  }, [orch.blockers.length, primaryRouteState, synthesis.topOpportunityRu, t]);

  const readiness = useMemo(() => {
    const blocked = primaryRouteState === "blocked";
    const launchOk = synthesis.launchReadiness >= 52 && !blocked && orch.executionConfidence >= 48;
    return {
      launch: launchOk ? t("daily.ready.launchYes") : t("daily.ready.launchNo"),
      pressure: clip(edc.leakLine, 140),
      wait: clip(decision.priorityDensityRu, 120),
      fragile: orch.executionConfidence < 46 ? t("daily.ready.fragileYes") : t("daily.ready.fragileNo"),
      accelerate:
        initiativeUrgency === "critical" || initiativeUrgency === "elevated"
          ? t("daily.ready.accelerateYes")
          : t("daily.ready.accelerateNo"),
    };
  }, [
    decision.priorityDensityRu,
    initiativeUrgency,
    orch.executionConfidence,
    primaryRouteState,
    edc.leakLine,
    synthesis.launchReadiness,
    t,
  ]);

  const flowSteps = useMemo(() => {
    if (!cleanDay.enabled || !cleanHide.size) return [...DAILY_FLOW_STEPS];
    return DAILY_FLOW_STEPS.filter((s) => !cleanHide.has(s.id));
  }, [cleanDay.enabled, cleanHide]);

  const entitySnapBlocks = useMemo(
    () =>
      buildEntitySnapBlocks(roleMode, {
        ...consoleLines,
        entitySnapBannerT: t,
        onNavigate,
        cleanDayHiddenNavIds: cleanDay.enabled && cleanHide.size ? cleanHide : undefined,
      }),
    [roleMode, consoleLines, onNavigate, t, cleanDay.enabled, cleanHide],
  );

  return (
    <div className="dom" data-dom-pulse={pulseGeneration % 1000} data-dom-focus={focusMode ? "1" : "0"}>
      <div className="dom__toolbar">
        <div className="dom__toolbar-left">
          <span className="dom__title">{t("daily.title")}</span>
          <span className="dom__subtitle">{t("daily.subtitle")}</span>
        </div>
        <button type="button" className={`dom__focus${focusMode ? " dom__focus--on" : ""}`} onClick={toggleFocusMode}>
          {focusMode ? t("daily.focusOn") : t("daily.focusOff")}
        </button>
      </div>

      {cleanDay.enabled ? (
        <p className="dom__clean-banner" role="note">
          {t("daily.cleanDay.banner")}
        </p>
      ) : null}

      {deferredLines.morningFlowLine ? (
        <p className="dom__entity-snap dom__entity-snap--mflow" role="status">
          <button type="button" className="dom__aa-link dom__aa-link--mflow" onClick={() => onNavigate("morningStart")}>
            {deferredLines.morningFlowLine}
          </button>
        </p>
      ) : null}

      {deferredLines.eveningCloseLine ? (
        <p className="dom__entity-snap dom__entity-snap--eclose" role="status">
          <button type="button" className="dom__aa-link dom__aa-link--eclose" onClick={() => onNavigate("eveningClose")}>
            {deferredLines.eveningCloseLine}
          </button>
        </p>
      ) : null}

      {entitySnapBlocks}

      <section className="dom__edc" aria-label={t("edc.aria")}>
        <h2 className="dom__h2">{t("edc.title")}</h2>
        <p className="dom__lede">
          <span className="dom__lede-k">{t("edc.ledeLeak")}</span>
          {edc.leakLine}
        </p>
        <div className="dom__edc-top">
          <div className="dom__edc-col">
            <h3 className="dom__h3">{t("edc.actions")}</h3>
            <ol className="dom__edc-ol">
              {edc.actions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
          <div className="dom__edc-col">
            <h3 className="dom__h3">{t("edc.risks")}</h3>
            <ol className="dom__edc-ol">
              {edc.risks.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
          <div className="dom__edc-col">
            <h3 className="dom__h3">{t("edc.forbidden")}</h3>
            <ol className="dom__edc-ol dom__edc-ol--forbid">
              {edc.forbidden.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="dom__edc-next">
          <h3 className="dom__h3">{t("edc.bestNext")}</h3>
          <p className="dom__edc-next-body">{edc.bestNext}</p>
        </div>
        <div className="dom__edc-meta">
          <div className="dom__edc-meta-cell">
            <span className="dom__meta-k">{t("edc.whyNow")}</span>
            <p className="dom__meta-p">{edc.whyNow}</p>
          </div>
          <div className="dom__edc-meta-cell">
            <span className="dom__meta-k">{t("edc.impact")}</span>
            <p className="dom__meta-p">{edc.expectedImpact}</p>
          </div>
          <div className="dom__edc-meta-cell">
            <span className="dom__meta-k">{t("edc.window")}</span>
            <p className="dom__meta-p">{edc.timeWindow}</p>
          </div>
        </div>
      </section>

      <nav className="dom__flow" aria-label={t("daily.flowAria")}>
        {flowSteps.map((step, i) => {
          const isActive = active === step.id || (step.id === "dashboard" && active === "dashboard");
          return (
            <button
              key={step.id}
              type="button"
              className={`dom__flow-step${isActive ? " dom__flow-step--active" : ""}`}
              onClick={() => onNavigate(step.id)}
            >
              <span className="dom__flow-idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="dom__flow-label">{t(step.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="dom__speed">
        <span className="dom__speed-k">{t("daily.speedJump")}</span>
        {(
          [
            ["missionControl", "nav.missionControl"],
            ["executionOrchestrator", "nav.executionOrchestrator"],
            ["command", "nav.command"],
            ["executiveIntelligence", "nav.executiveIntelligence"],
          ] as const
        )
          .filter(([id]) => !cleanHide.has(id))
          .map(([id, key]) => (
            <button key={id} type="button" className="dom__chip" onClick={() => onNavigate(id)}>
              {t(key)}
            </button>
          ))}
        {recentNav.length > 0 ? (
          <>
            <span className="dom__speed-k dom__speed-k--gap">{t("daily.speedRecent")}</span>
            {recentNav
              .filter((id) => id !== active && !cleanHide.has(id))
              .slice(0, 4)
              .map((id) => (
                <button key={id} type="button" className="dom__chip dom__chip--ghost" onClick={() => onNavigate(id)}>
                  {t(navMessageKey(id))}
                </button>
              ))}
          </>
        ) : null}
      </div>

      {cleanDay.enabled ? null : (
        <div className="dom__coord">
          <span className="dom__speed-k">{t("edc.coord")}</span>
          <button type="button" className="dom__chip dom__chip--ghost" onClick={() => onNavigate("seo")}>
            {t("nav.seo")}
          </button>
          <button type="button" className="dom__chip dom__chip--ghost" onClick={() => onNavigate("rich")}>
            {t("nav.rich")}
          </button>
          <button type="button" className="dom__chip dom__chip--ghost" onClick={() => onNavigate("operations")}>
            {t("nav.operations")}
          </button>
          <button type="button" className="dom__chip dom__chip--ghost" onClick={() => onNavigate("executionPlanner")}>
            {t("nav.executionPlanner")}
          </button>
        </div>
      )}

      <div className="dom__digest" role="list" aria-label={t("daily.digestAria")}>
        {digest.map((d) => (
          <span key={d.id} className="dom__digest-pill" role="listitem">
            {d.text}
          </span>
        ))}
      </div>

      <div className="dom__pressure" aria-label={t("daily.pressureAria")}>
        <span className="dom__pressure-title">{t("daily.pressureTitle")}</span>
        <div className="dom__pressure-grid">
          {(
            [
              ["production", pressure.production],
              ["seo", pressure.seo],
              ["launch", pressure.launch],
              ["premium", pressure.premium],
              ["content", pressure.content],
              ["execution", pressure.execution],
              ["fatigue", pressure.fatigue],
              ["overload", pressure.overload],
            ] as const
          ).map(([key, v]) => (
            <div key={key} className="dom__pressure-cell">
              <span className="dom__pressure-k">{t(`daily.pressure.${key}`)}</span>
              <div className="dom__pressure-bar" aria-hidden>
                <span style={{ width: `${v}%` }} />
              </div>
              <span className="dom__pressure-v">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="dom__ready" aria-label={t("daily.readyAria")}>
        <h3 className="dom__h3">{t("daily.readyTitle")}</h3>
        <ul className="dom__ready-list">
          <li>
            <span className="dom__ready-q">{t("daily.ready.q1")}</span>
            <span className="dom__ready-a">{readiness.launch}</span>
          </li>
          <li>
            <span className="dom__ready-q">{t("daily.ready.q2")}</span>
            <span className="dom__ready-a">{readiness.pressure}</span>
          </li>
          <li>
            <span className="dom__ready-q">{t("daily.ready.q3")}</span>
            <span className="dom__ready-a">{readiness.wait}</span>
          </li>
          <li>
            <span className="dom__ready-q">{t("daily.ready.q4")}</span>
            <span className="dom__ready-a">{readiness.fragile}</span>
          </li>
          <li>
            <span className="dom__ready-q">{t("daily.ready.q5")}</span>
            <span className="dom__ready-a">{readiness.accelerate}</span>
          </li>
        </ul>
      </section>

      <style>{`
        .dom {
          margin: 0 0 10px;
          padding: 12px 14px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
        }
        .dom[data-dom-focus="1"] {
          background: rgba(0, 0, 0, 0.38);
        }
        .dom__toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .dom__clean-banner {
          margin: 0 0 12px;
          padding: 8px 10px;
          font-size: 0.72rem;
          line-height: 1.4;
          border-radius: 8px;
          background: rgba(123, 143, 255, 0.08);
          border: 1px solid rgba(123, 143, 255, 0.2);
          color: rgba(210, 220, 255, 0.9);
        }
        .dom__toolbar-left {
          min-width: 0;
        }
        .dom__fbrief {
          margin: 0 0 14px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(120, 180, 255, 0.28);
          background: rgba(40, 60, 90, 0.22);
        }
        .dom__fbrief-link {
          display: block;
          width: 100%;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: inherit;
          cursor: pointer;
          text-align: left;
        }
        .dom__fbrief-head {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.35;
          color: rgba(220, 235, 255, 0.95);
        }
        .dom__fbrief-sub {
          display: block;
          margin-top: 4px;
          font-size: 0.68rem;
          opacity: 0.82;
          line-height: 1.35;
        }
        .dom__entity-snap {
          margin: -4px 0 12px;
          font-size: 0.68rem;
          letter-spacing: 0.06em;
          color: rgba(160, 200, 255, 0.88);
        }
        .dom__entity-snap--aa {
          margin-top: -8px;
        }
        .dom__aa-link {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: inherit;
          letter-spacing: inherit;
          cursor: pointer;
          text-align: left;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .dom__title {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(140, 150, 175, 0.75);
        }
        .dom__subtitle {
          display: block;
          margin-top: 4px;
          font-size: 0.72rem;
          color: rgba(165, 175, 200, 0.65);
          letter-spacing: 0.06em;
        }
        .dom__focus {
          flex-shrink: 0;
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(200, 208, 228, 0.85);
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 8px 12px;
          cursor: pointer;
        }
        .dom__focus--on {
          border-color: rgba(130, 160, 255, 0.45);
          color: rgba(220, 228, 255, 0.95);
        }
        .dom__h2 {
          margin: 0 0 8px;
          font-size: 0.62rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(150, 160, 185, 0.7);
        }
        .dom__h3 {
          margin: 0 0 8px;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(140, 150, 175, 0.65);
        }
        .dom__edc {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dom__lede {
          margin: 0 0 12px;
          font-size: 0.8rem;
          line-height: 1.5;
          color: rgba(195, 205, 228, 0.92);
        }
        .dom__lede-k {
          display: block;
          margin-bottom: 4px;
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(130, 140, 165, 0.7);
        }
        .dom__edc-top {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px 16px;
          margin-bottom: 12px;
        }
        .dom__edc-col {
          min-width: 0;
        }
        .dom__edc-ol {
          margin: 0;
          padding-left: 1.1rem;
          font-size: 0.78rem;
          line-height: 1.45;
          color: rgba(200, 210, 232, 0.92);
        }
        .dom__edc-ol--forbid {
          color: rgba(255, 200, 185, 0.88);
        }
        .dom__edc-ol li {
          margin-bottom: 4px;
        }
        .dom__edc-next {
          margin-bottom: 12px;
        }
        .dom__edc-next-body {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          line-height: 1.45;
          color: rgba(232, 236, 248, 0.98);
          max-width: 72ch;
        }
        .dom__edc-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px 18px;
        }
        .dom__edc-meta-cell {
          min-width: 0;
        }
        .dom__meta-k {
          display: block;
          margin-bottom: 4px;
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(125, 135, 160, 0.7);
        }
        .dom__meta-p {
          margin: 0;
          font-size: 0.76rem;
          line-height: 1.5;
          color: rgba(175, 185, 210, 0.9);
        }
        .dom__coord {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .dom__flow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        .dom__flow-step {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(175, 185, 208, 0.88);
          padding: 6px 10px;
          cursor: pointer;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .dom__flow-step--active {
          border-color: rgba(130, 155, 220, 0.45);
          color: rgba(230, 234, 248, 0.98);
        }
        .dom__flow-idx {
          font-size: 0.58rem;
          opacity: 0.45;
          letter-spacing: 0.12em;
        }
        .dom__flow-label {
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dom__speed {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .dom__speed-k {
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(120, 130, 155, 0.65);
        }
        .dom__speed-k--gap {
          margin-left: 8px;
        }
        .dom__chip {
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
          color: rgba(195, 205, 228, 0.9);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 10px;
          cursor: pointer;
        }
        .dom__chip:hover {
          border-color: rgba(150, 170, 220, 0.35);
        }
        .dom__chip--ghost {
          opacity: 0.85;
        }
        .dom__digest {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .dom__digest-pill {
          font-size: 0.68rem;
          line-height: 1.35;
          padding: 5px 9px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.28);
          color: rgba(175, 185, 210, 0.9);
          max-width: 100%;
        }
        .dom__pressure {
          margin-bottom: 10px;
        }
        .dom__pressure-title {
          display: block;
          font-size: 0.55rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(125, 135, 160, 0.65);
          margin-bottom: 8px;
        }
        .dom__pressure-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
          gap: 8px 10px;
        }
        .dom__pressure-cell {
          display: grid;
          gap: 4px;
        }
        .dom__pressure-k {
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(130, 140, 165, 0.7);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dom__pressure-bar {
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .dom__pressure-bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, rgba(100, 120, 200, 0.35), rgba(190, 200, 255, 0.85));
        }
        .dom__pressure-v {
          font-size: 0.62rem;
          font-variant-numeric: tabular-nums;
          color: rgba(155, 165, 190, 0.75);
        }
        .dom__ready-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.76rem;
        }
        .dom__ready li {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          gap: 10px;
          align-items: start;
        }
        .dom__ready-q {
          color: rgba(125, 135, 160, 0.8);
          font-size: 0.68rem;
        }
        .dom__ready-a {
          color: rgba(200, 210, 232, 0.9);
          line-height: 1.45;
        }
        @media (max-width: 720px) {
          .dom__edc-top {
            grid-template-columns: 1fr;
          }
          .dom__edc-meta {
            grid-template-columns: 1fr;
          }
          .dom__ready li {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
