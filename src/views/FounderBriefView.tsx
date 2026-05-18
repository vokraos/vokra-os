import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import {
  buildFounderBriefMemoryPayload,
  buildFounderCommandBrief,
  founderBriefToMarkdown,
  founderBriefToPlainText,
  gatherFounderBriefContext,
  notifyFounderBriefUpdated,
  saveLastFounderBrief,
  FOUNDER_BRIEF_EVENT,
  type BriefField,
  type FounderCommandBrief,
} from "../lib/founder-brief";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import {
  buildGuidedSetupPlan,
  formatGuidedSetupDailyLine,
  GUIDED_SETUP_EVENT,
} from "../lib/guided-setup";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { ReportWarmupStrip } from "../components/ReportWarmupStrip";

type Props = { onNavigate: (id: NavId) => void };

const ROWS: { key: keyof FounderCommandBrief; labelKey: string }[] = [
  { key: "topTodayAction", labelKey: "fbrief.row.today" },
  { key: "topBlockedItem", labelKey: "fbrief.row.blocked" },
  { key: "highestLeverageMove", labelKey: "fbrief.row.leverage" },
  { key: "heroStatus", labelKey: "fbrief.row.hero" },
  { key: "launchStatus", labelKey: "fbrief.row.launch" },
  { key: "collectionStatus", labelKey: "fbrief.row.collection" },
  { key: "dataStatus", labelKey: "fbrief.row.data" },
  { key: "executionStatus", labelKey: "fbrief.row.execution" },
  { key: "memorySignal", labelKey: "fbrief.row.memory" },
  { key: "doNotTouch", labelKey: "fbrief.row.dnt" },
  { key: "nextBestRoute", labelKey: "fbrief.row.route" },
];

function BriefRow({
  label,
  field,
  onGo,
}: {
  label: string;
  field: BriefField;
  onGo: () => void;
}) {
  return (
    <button type="button" className="fbrief-row" onClick={onGo}>
      <span className="fbrief-row__lab">{label}</span>
      <span className="fbrief-row__txt">{field.text}</span>
    </button>
  );
}

export function FounderBriefView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(FOUNDER_BRIEF_EVENT, bump);
    window.addEventListener(GUIDED_SETUP_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(FOUNDER_BRIEF_EVENT, bump);
      window.removeEventListener(GUIDED_SETUP_EVENT, bump);
    };
  }, []);

  const brief = useMemo(() => buildFounderCommandBrief(gatherFounderBriefContext(), t), [tick, t]);
  const guidedSetupLine = useMemo(
    () => formatGuidedSetupDailyLine(buildGuidedSetupPlan(undefined, t, locale), t),
    [tick, t, locale],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveMemory = useCallback(() => {
    saveLastFounderBrief(brief);
    const payload = buildFounderBriefMemoryPayload(brief);
    recordGeneration({
      module: "founder_brief",
      title: t("fbrief.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: brief.topTodayAction.text,
    });
    notifyFounderBriefUpdated();
    showToast(t("fbrief.toast.saved"));
  }, [brief, showToast, t]);

  return (
    <div className="fbrief-page">
      <header className="glass-panel fbrief-head">
        <p className="fbrief-eyebrow">{t("fbrief.eyebrow")}</p>
        <h1>{t("nav.founderBrief")}</h1>
        <p className="fbrief-lede">{t("fbrief.lede")}</p>
        <ReportWarmupStrip className="fbrief-warmup-strip" />
        <p className="fbrief-snap">{brief.activeSnapshotSummary}</p>
        <p className="fbrief-change">{brief.sinceLastReview}</p>
        <p className="fbrief-conf">{brief.confidenceNote}</p>
        {guidedSetupLine ? (
          <p className="fbrief-setup" role="status">
            <button type="button" className="fbrief-setup-link" onClick={() => onNavigate("guidedSetup")}>
              {guidedSetupLine}
            </button>
          </p>
        ) : null}
        <div className="fbrief-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("fbrief.action.save")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(founderBriefToPlainText(brief, t))}
          >
            {t("fbrief.action.copy")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadText(`founder-brief-${brief.id}.md`, founderBriefToMarkdown(brief, t))}
          >
            {t("fbrief.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`founder-brief-${brief.id}.json`, brief)}>
            {t("fbrief.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="fbrief-toast">{toast}</p> : null}

      <section className="glass-panel fbrief-grid">
        {ROWS.map(({ key, labelKey }) => (
          <BriefRow
            key={key}
            label={t(labelKey)}
            field={brief[key] as BriefField}
            onGo={() => onNavigate((brief[key] as BriefField).navId)}
          />
        ))}
      </section>

      <style>{`
        .fbrief-page { max-width: 720px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .fbrief-head { padding: 14px 16px; }
        .fbrief-eyebrow { margin: 0 0 4px; opacity: 0.65; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .fbrief-lede { margin: 6px 0 10px; opacity: 0.85; line-height: 1.45; font-size: 0.92rem; }
        .fbrief-snap { margin: 0 0 6px; font-size: 0.88rem; opacity: 0.9; }
        .fbrief-change { margin: 0 0 6px; font-size: 0.85rem; color: #a8c4e8; }
        .fbrief-conf { margin: 0 0 12px; font-size: 0.85rem; opacity: 0.8; font-style: italic; }
        .fbrief-setup { margin: 0 0 10px; }
        .fbrief-setup-link { background: none; border: none; padding: 0; color: #a8c8e8; font: inherit; font-size: 0.85rem; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
        .fbrief-head__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .fbrief-grid { padding: 8px; display: grid; gap: 6px; }
        .fbrief-row { display: grid; grid-template-columns: 108px 1fr; gap: 10px; text-align: left; width: 100%; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; background: rgba(0,0,0,0.15); color: inherit; font: inherit; cursor: pointer; transition: border-color 0.15s; }
        .fbrief-row:hover { border-color: rgba(120,180,255,0.35); }
        .fbrief-row__lab { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.7; }
        .fbrief-row__txt { font-size: 0.9rem; line-height: 1.4; }
        .fbrief-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
        @media (max-width: 520px) { .fbrief-row { grid-template-columns: 1fr; gap: 4px; } }
      `}</style>
    </div>
  );
}
