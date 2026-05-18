import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { navMessageKey } from "../lib/i18n/navLabels";
import { useCognitiveOs } from "../lib/cognitive-os";
import { useLiveState } from "../lib/live-state";
import { FOCUS_BRIGHT_NAV_IDS } from "../lib/daily-operating";
import { SidebarSignalBar } from "./SidebarSignalBar";

const SIDEBAR_ABBR: Partial<Record<NavId, string>> = {
  dashboard: "НС",
  missionControl: "УК",
  executiveIntelligence: "АН",
  executiveMemory: "ПМ",
  strategyEvolution: "СТ",
  organismModel: "МО",
  strategicSimulation: "СМ",
  temporalStrategy: "ВС",
  executionPlanner: "ПЛ",
  executionOrchestrator: "ОР",
  signalFabric: "СН",
  feedbackLoop: "ОС",
  command: "ЦУ",
  operations: "ОП",
  seo: "СО",
  rich: "КО",
  prompts: "ПР",
  promptComposer: "КП",
  promptPack: "НП",
  visualProduction: "ВП",
  visualAssets: "АС",
  cardProduction: "КЦ",
  marketplaceOperations: "МП",
  skuIntelligence: "СК",
  competitiveMap: "КН",
  ingestionReadiness: "ГД",
  dataImport: "ИД",
  entityFusion: "ЭФ",
  dataCleanup: "ОЧ",
  assortmentActions: "АС",
  reels: "РЛ",
  campaign: "КМ",
  collectionBuilder: "КБ",
  dna: "ДН",
  brandEvolution: "БЭ",
  visualStrategy: "ВС",
  visual: "ВИ",
  competitors: "КМ",
  trends: "ТН",
  memory: "ПМ",
  analytics: "АЛ",
  settings: "НС",
};

function navAbbr(id: NavId): string {
  return SIDEBAR_ABBR[id] ?? id.slice(0, 2).toUpperCase();
}

type Props = {
  id: NavId;
  active: NavId;
  focusMode: boolean;
  onNavigate: (id: NavId) => void;
  onCloseMobile: () => void;
};

export function SidebarLink({ id, active, focusMode, onNavigate, onCloseMobile }: Props) {
  const { t } = useI18n();
  const { getModule, lastEvent } = useCognitiveOs();
  const { moduleActivity } = useLiveState();

  const inNet = Boolean(lastEvent && (lastEvent.source === id || lastEvent.targets.includes(id)));
  const fullLabel = t(navMessageKey(id));
  const isCurrent =
    active !== "home" && (active === id || (id === "operations" && active === "operationsBrief"));
  const dimFocus = focusMode && !FOCUS_BRIGHT_NAV_IDS.has(id) && !isCurrent;

  return (
    <button
      type="button"
      className={`sidebar__link ${isCurrent ? "sidebar__link--active" : ""}${dimFocus ? " sidebar__link--dim" : ""}`}
      aria-current={isCurrent ? "page" : undefined}
      data-cog-net-sync={inNet ? "1" : undefined}
      data-live-activity={moduleActivity(id)}
      title={fullLabel}
      onClick={() => {
        onNavigate(id);
        onCloseMobile();
      }}
    >
      <span className="sidebar__link-glow" aria-hidden />
      <span className="sidebar__link-row">
        <span className="sidebar__link-label">{fullLabel}</span>
        <span className="sidebar__link-abbr" aria-hidden>
          {navAbbr(id)}
        </span>
        <SidebarSignalBar signalHealth={getModule(id).signalHealth} />
      </span>
    </button>
  );
}
