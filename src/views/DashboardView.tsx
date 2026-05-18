import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { useCognitiveDepth, dashboardSlotRole } from "../lib/cognitive-depth";
import { DepthGate } from "../components/cognitive-depth/DepthGate";
import { DepthSection } from "../components/cognitive-depth/DepthSection";
import { CommandSurface } from "../components/cognitive-depth/CommandSurface";
import { FounderFocusSurface } from "../components/cognitive-depth/FounderFocusSurface";
import { OperationsFloor } from "../components/cognitive-depth/OperationsFloor";
import { MarketTopologyPanel } from "../components/cognitive-depth/MarketTopologyPanel";
import { MemoryArchivePanel } from "../components/cognitive-depth/MemoryArchivePanel";
import { SimulationDepthPanel } from "../components/cognitive-depth/SimulationDepthPanel";
import { ExecutiveSurface } from "../components/executive-surface/ExecutiveSurface";
import { TodayStack } from "../components/today-stack/TodayStack";

type Props = { onNavigate: (id: NavId) => void };

export function DashboardView({ onNavigate }: Props) {
  const { t } = useI18n();
  const { mode } = useCognitiveDepth();

  return (
    <div className="view">
      <header className="view__header">
        <p className="eyebrow">{t("dashboard.eyebrow")}</p>
        <h2 className="view__title">{t("dashboard.title")}</h2>
        <p className="view__desc">{t("dashboard.desc")}</p>
      </header>

      <DepthGate surface="dashboard" slot="commandBand">
        {mode === "command" ? <FounderFocusSurface variant="dashboard" /> : <CommandSurface variant="dashboard" />}
      </DepthGate>

      <DepthGate surface="dashboard" slot="operationsFloor">
        <DepthSection role={dashboardSlotRole(mode, "operationsFloor")}>
          <OperationsFloor variant="dashboard" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="marketTopology">
        <DepthSection role={dashboardSlotRole(mode, "marketTopology")}>
          <MarketTopologyPanel variant="dashboard" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="memoryArchive">
        <DepthSection role={dashboardSlotRole(mode, "memoryArchive")}>
          <MemoryArchivePanel variant="dashboard" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="simulationLayer">
        <DepthSection role={dashboardSlotRole(mode, "simulationLayer")}>
          <SimulationDepthPanel variant="dashboard" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="todayStack">
        <DepthSection role={dashboardSlotRole(mode, "todayStack")}>
          <TodayStack tone="dashboard" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="executiveSurface">
        <DepthSection role={dashboardSlotRole(mode, "executiveSurface")}>
          <ExecutiveSurface tone="dashboard" />
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="quickActions">
        <DepthSection role={dashboardSlotRole(mode, "quickActions")}>
          <div className="dash-exec-actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("missionControl")}>
              {t("dashboard.openMission")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("executionOrchestrator")}>
              {t("dashboard.openOrch")}
            </button>
          </div>
        </DepthSection>
      </DepthGate>

      <DepthGate surface="dashboard" slot="moduleGrid">
        <DepthSection role={dashboardSlotRole(mode, "moduleGrid")}>
          <div className="dash-grid">
            <article className="glass-panel glass-panel--hover dash-card">
              <div className="dash-card__top">
                <span className="dash-card__label">{t("dashboard.modules")}</span>
              </div>
              <p className="dash-card__value">{t("dashboard.seoCard")}</p>
              <p className="dash-card__hint">{t("dashboard.seoHint")}</p>
              <button type="button" className="ghost-btn dash-card__btn" onClick={() => onNavigate("seo")}>
                {t("dashboard.openSeo")}
              </button>
            </article>
            <article className="glass-panel glass-panel--hover dash-card">
              <div className="dash-card__top">
                <span className="dash-card__label">{t("dashboard.flagship")}</span>
              </div>
              <p className="dash-card__value">{t("dashboard.richCard")}</p>
              <p className="dash-card__hint">{t("dashboard.richHint")}</p>
              <button type="button" className="ghost-btn dash-card__btn" onClick={() => onNavigate("rich")}>
                {t("dashboard.openRich")}
              </button>
            </article>
            <article className="glass-panel glass-panel--hover dash-card">
              <div className="dash-card__top">
                <span className="dash-card__label">{t("dashboard.vision")}</span>
              </div>
              <p className="dash-card__value">{t("dashboard.visionCard")}</p>
              <p className="dash-card__hint">{t("dashboard.visionHint")}</p>
              <button type="button" className="ghost-btn dash-card__btn" onClick={() => onNavigate("visual")}>
                {t("dashboard.visionBtn")}
              </button>
            </article>
            <article className="glass-panel glass-panel--hover dash-card dash-card--cta">
              <p className="dash-card__label">{t("dashboard.quick")}</p>
              <h3 className="dash-card__cta-title">{t("dashboard.quickTitle")}</h3>
              <p className="dash-card__hint">{t("dashboard.quickHint")}</p>
              <button type="button" className="ghost-btn dash-card__btn" onClick={() => onNavigate("rich")}>
                {t("dashboard.quickBtn")}
              </button>
            </article>
          </div>
        </DepthSection>
      </DepthGate>

      <style>{`
        .view__header {
          margin-bottom: 22px;
        }
        .view__title {
          font-size: clamp(1.65rem, 2.8vw, 2.1rem);
          margin-bottom: 6px;
        }
        .view__desc {
          max-width: 560px;
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .dash-exec-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 0 0 22px;
        }
        .dash-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(2, 1fr);
        }
        .dash-card {
          padding: 20px;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .dash-card--cta {
          grid-column: span 2;
          justify-content: flex-end;
        }
        .dash-card__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dash-card__label {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .dash-card__value {
          font-family: var(--font-display);
          font-size: 1.65rem;
          font-weight: 800;
          margin: 0;
          color: var(--text);
        }
        .dash-card__hint {
          font-size: 0.84rem;
          margin: 0;
          color: var(--muted);
          line-height: 1.45;
        }
        .dash-card__cta-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          margin: 6px 0 0;
        }
        .dash-card__btn {
          align-self: flex-start;
          margin-top: 10px;
        }
        @media (max-width: 1100px) {
          .dash-grid {
            grid-template-columns: 1fr;
          }
          .dash-card--cta {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
