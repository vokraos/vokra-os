import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import type { NavId } from "./types";
import { SafeModeBanner } from "./components/SafeModeBanner";
import { VIEW_REGISTRY } from "./views/viewRegistry";
import { useI18n } from "./lib/i18n/I18nContext";
import { navMessageKey } from "./lib/i18n/navLabels";
import { CognitiveAtmosphere } from "./components/CognitiveAtmosphere";
import { CognitiveSpine } from "./components/CognitiveSpine";
import { CognitiveModuleRibbon } from "./components/CognitiveModuleRibbon";
import { GlobalSignalNetwork } from "./components/GlobalSignalNetwork";
import { SignalFabricAmbient } from "./components/SignalFabricAmbient";
import { ExecutiveInitiativeStream } from "./components/ExecutiveInitiativeStream";
import { ExecutiveDecisionDeck } from "./components/ExecutiveDecisionDeck";
import type { CSSProperties } from "react";
import { useCognitiveOs } from "./lib/cognitive-os";
import { useLiveState } from "./lib/live-state";
import { SystemStrip } from "./components/shell/SystemStrip";
import { DepthSwitcher } from "./components/cognitive-depth/DepthSwitcher";
import { DailyOperatingConsole } from "./components/daily-operating/DailyOperatingConsole";
import { useDailyOperating } from "./lib/daily-operating";
import { useCognitiveDepth, executivePulseFromSeed, dominantSignalTier, executiveSignalPriorityFromTier, marketSeasonId } from "./lib/cognitive-depth";
import { lsGet, lsSet } from "./lib/storage";
import { alignRoleModeForNav } from "./lib/operating-role-mode";
import { useOsReportWarmup } from "./hooks/useOsReportWarmup";
import { useSafeMode } from "./hooks/useSafeMode";
import { applyCleanDayModeRestorePayload, consumeCleanDayModeRestore } from "./lib/clean-day-mode";
import { STORAGE_KEYS } from "./lib/storage-keys";

const SIDEBAR_COLLAPSED_KEY = STORAGE_KEYS.sidebarCollapsed;

export default function App() {
  const { t } = useI18n();
  const { regime, pulseGeneration, initiativeUrgency } = useCognitiveOs();
  const { live, cssVars } = useLiveState();
  const { mode: cognitiveDepth } = useCognitiveDepth();
  const [active, setActive] = useState<NavId>("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => lsGet(SIDEBAR_COLLAPSED_KEY) === "1");
  const { pushRecent, focusMode } = useDailyOperating();
  const safe = useSafeMode();
  useOsReportWarmup("app_start");

  useEffect(() => {
    const raw = consumeCleanDayModeRestore();
    if (raw) applyCleanDayModeRestorePayload(raw);
  }, []);

  const goNav = useCallback(
    (id: NavId) => {
      alignRoleModeForNav(id);
      if (id !== active) pushRecent(active);
      setActive(id);
    },
    [active, pushRecent],
  );

  useEffect(() => {
    lsSet(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    document.title =
      active === "home" ? `VOKRA · ${t("app.productName")}` : `VOKRA · ${t(navMessageKey(active))}`;
  }, [active, t]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenu(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onNavigateRequest(e: Event) {
      const ce = e as CustomEvent<{ id?: NavId }>;
      const id = ce.detail?.id;
      if (id) goNav(id);
    }
    window.addEventListener("vokra:navigate-request", onNavigateRequest as EventListener);
    return () => window.removeEventListener("vokra:navigate-request", onNavigateRequest as EventListener);
  }, [goNav]);

  return (
    <div
      className="app-shell"
      style={cssVars as CSSProperties}
      data-cog-regime={regime}
      data-cog-pulse-gen={String(pulseGeneration % 10000)}
      data-init-urgency={initiativeUrgency}
      data-live-profile={live.regimeTransition.profile}
      data-live-tension={live.strategicTension.index01.toFixed(2)}
      data-sidebar={sidebarCollapsed ? "collapsed" : undefined}
      data-focus-mode={focusMode ? "1" : undefined}
      data-cognitive-depth={cognitiveDepth}
      data-exec-pulse={executivePulseFromSeed(pulseGeneration, live.strategicTension.index01)}
      data-signal-tier={dominantSignalTier(live.strategicTension.index01, pulseGeneration)}
      data-sig-priority={executiveSignalPriorityFromTier(
        dominantSignalTier(live.strategicTension.index01, pulseGeneration),
      )}
      data-market-season={marketSeasonId(pulseGeneration)}
      data-market-weather={live.strategicOrganism.weatherId}
      data-market-weather-3={live.strategicOrganism.weather3Id}
      data-executive-silence-band={
        live.executiveSilence01 >= 0.58 ? "deep" : live.executiveSilence01 >= 0.38 ? "mid" : "low"
      }
    >
      <CognitiveAtmosphere active={active} />
      <CognitiveSpine active={active} />
      {mobileMenu && (
        <button
          type="button"
          className="nav-overlay"
          aria-label={t("shell.closeMenu")}
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="layout-grid">
        <Sidebar
          active={active}
          onNavigate={goNav}
          onHome={() => {
            pushRecent(active);
            setActive("home");
          }}
          mobileOpen={mobileMenu}
          onCloseMobile={() => setMobileMenu(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          focusMode={focusMode}
        />
        <div className="main-wrap">
          <SignalFabricAmbient active={active} />
          <GlobalSignalNetwork active={active} />
          <header className="top-bar">
            <button
              type="button"
              className="top-bar__menu"
              aria-expanded={mobileMenu}
              aria-controls="app-sidebar"
              onClick={() => setMobileMenu((v) => !v)}
            >
              <span className="top-bar__burger" aria-hidden />
              {t("shell.menu")}
            </button>
            <div className="top-bar__crumb">
              <span className="top-bar__brand">VOKRA</span>
              <span className="top-bar__sep">/</span>
              <span>{active === "home" ? t("nav.home") : t(navMessageKey(active))}</span>
            </div>
            <div className="top-bar__pill">
              <span className="dot-pulse" aria-hidden />
              {t("shell.live")}
            </div>
          </header>
          <SystemStrip active={active} />
          {safe.enabled ? <SafeModeBanner onNavigate={goNav} /> : null}
          {active !== "home" && (
            <div className="os-depth-strip workspace">
              <DepthSwitcher />
            </div>
          )}
          {active !== "home" && (
            <div className="workspace">
              <DailyOperatingConsole active={active} onNavigate={goNav} />
            </div>
          )}
          {active !== "home" ? (
            <div className="workspace os-shell-details">
              <details className="os-details">
                <summary>{t("shell.detailsContext")}</summary>
                <div className="os-details__body">
                  <CognitiveModuleRibbon moduleId={active} variant="signalsOnly" />
                </div>
              </details>
              <details className="os-details">
                <summary>{t("shell.detailsInitiatives")}</summary>
                <div className="os-details__body">
                  <ExecutiveInitiativeStream active={active} onNavigate={goNav} />
                </div>
              </details>
              <details className="os-details">
                <summary>{t("shell.detailsDecision")}</summary>
                <div className="os-details__body">
                  <ExecutiveDecisionDeck active={active} />
                </div>
              </details>
            </div>
          ) : null}
          <main className="main-stage">
            <div className="workspace">
              {(VIEW_REGISTRY[active] ?? VIEW_REGISTRY.home!)(goNav)}
            </div>
          </main>
        </div>
      </div>
      <style>{`
        .main-wrap {
          min-width: 0;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 3;
        }
        .os-shell-details {
          padding-bottom: 2px;
        }
        .os-depth-strip {
          padding: 6px 0 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .nav-overlay {
          display: none;
        }
        .top-bar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px 0;
          gap: 12px;
        }
        .top-bar__menu {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 99px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.35);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 14px;
          cursor: pointer;
        }
        .top-bar__burger {
          width: 16px;
          height: 2px;
          background: var(--text);
          border-radius: 99px;
          box-shadow: 0 -6px 0 var(--text), 0 6px 0 var(--text);
        }
        .top-bar__crumb {
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .top-bar__brand {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--text);
        }
        .top-bar__sep {
          opacity: 0.35;
        }
        .top-bar__pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 99px;
          border: 1px solid var(--stroke);
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          background: rgba(0, 0, 0, 0.28);
          white-space: nowrap;
        }
        .app-shell[data-focus-mode="1"] .os-shell-details {
          opacity: 0.36;
        }
        @media (max-width: 1024px) {
          .top-bar {
            display: flex;
          }
          .nav-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 30;
            background: rgba(0, 0, 0, 0.55);
            border: none;
            cursor: pointer;
          }
        }
      `}</style>
    </div>
  );
}
