import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { ASSORTMENT_ACTIONS_EVENT } from "../lib/assortment-actions";
import { ENTITY_SNAPSHOT_EVENT } from "../lib/entity-snapshot";
import {
  buildFounderBriefMemoryPayload,
  buildFounderCommandBrief,
  buildConstraintDisplay,
  founderBriefToMarkdown,
  founderBriefToPlainText,
  gatherFounderBriefContext,
  hasBriefShift,
  isNominalBlocked,
  notifyFounderBriefUpdated,
  saveLastFounderBrief,
  FOUNDER_BRIEF_EVENT,
  type BriefField,
  type FounderCommandBrief,
} from "../lib/founder-brief";
import { HERO_COMMAND_EVENT } from "../lib/hero-command";
import { LAUNCH_OPS_EVENT } from "../lib/launch-ops";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadText } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function CommandTier({
  label,
  text,
  variant,
  onGo,
}: {
  label: string;
  text: string;
  variant: "blocked" | "action" | "leverage" | "constraint";
  onGo: () => void;
}) {
  return (
    <button type="button" className={`fbrief-tier fbrief-tier--${variant}`} onClick={onGo}>
      <span className="fbrief-tier__lab">{label}</span>
      <span className="fbrief-tier__txt">{text}</span>
      <span className="fbrief-tier__go" aria-hidden>
        →
      </span>
    </button>
  );
}

function isIdleStatus(text: string, idleKeys: string[], t: (k: string) => string): boolean {
  return idleKeys.some((k) => text === t(k));
}

function buildContextLines(brief: FounderCommandBrief, t: (k: string) => string): { label: string; field: BriefField }[] {
  const lines: { label: string; field: BriefField }[] = [];

  const heroIdle = isIdleStatus(brief.heroStatus.text, ["fbrief.hero.idle"], t);
  const launchIdle = isIdleStatus(brief.launchStatus.text, ["fbrief.launch.none"], t);
  if (!heroIdle || !launchIdle) {
    const merged = !heroIdle && !launchIdle
      ? `${brief.heroStatus.text} · ${brief.launchStatus.text}`
      : !heroIdle
        ? brief.heroStatus.text
        : brief.launchStatus.text;
    lines.push({
      label: t("fbrief.context.activeThreads"),
      field: { text: merged, navId: !heroIdle ? brief.heroStatus.navId : brief.launchStatus.navId },
    });
  }

  const dataIdle = isIdleStatus(brief.dataStatus.text, ["fbrief.data.ok", "fbrief.data.ready"], t);
  if (!dataIdle) {
    lines.push({ label: t("fbrief.row.data"), field: brief.dataStatus });
  }

  const execIdle = brief.executionStatus.text === t("fbrief.exec.none");
  if (!execIdle) {
    lines.push({ label: t("fbrief.row.execution"), field: brief.executionStatus });
  }

  if (hasBriefShift(brief.sinceLastReview, t)) {
    lines.push({
      label: t("fbrief.row.change"),
      field: { text: brief.sinceLastReview, navId: "founderBrief" },
    });
  }

  if (brief.activeSnapshotSummary === t("fbrief.snap.none")) {
    lines.push({
      label: t("fbrief.row.snapshot"),
      field: { text: brief.activeSnapshotSummary, navId: "dataImport" },
    });
  }

  return lines;
}

export function FounderBriefView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(ENTITY_SNAPSHOT_EVENT, bump);
    window.addEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
    window.addEventListener(HERO_COMMAND_EVENT, bump);
    window.addEventListener(LAUNCH_OPS_EVENT, bump);
    window.addEventListener(FOUNDER_BRIEF_EVENT, bump);
    return () => {
      window.removeEventListener(ENTITY_SNAPSHOT_EVENT, bump);
      window.removeEventListener(ASSORTMENT_ACTIONS_EVENT, bump);
      window.removeEventListener(HERO_COMMAND_EVENT, bump);
      window.removeEventListener(LAUNCH_OPS_EVENT, bump);
      window.removeEventListener(FOUNDER_BRIEF_EVENT, bump);
    };
  }, []);

  const brief = useMemo(() => buildFounderCommandBrief(gatherFounderBriefContext(), t), [tick, t]);
  const constraint = useMemo(() => buildConstraintDisplay(brief, t), [brief, t]);
  const showBlocked = useMemo(
    () => !isNominalBlocked(brief.topBlockedItem.text, t),
    [brief.topBlockedItem.text, t],
  );
  const contextLines = useMemo(() => buildContextLines(brief, t), [brief, t]);

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
    <div className="fbrief-page fbrief-page--field">
      <header className="fbrief-head">
        <h1>{t("nav.founderBrief")}</h1>
        <button type="button" className="ghost-btn fbrief-head__save" onClick={saveMemory}>
          {t("fbrief.action.save")}
        </button>
      </header>

      {toast ? <p className="fbrief-toast">{toast}</p> : null}

      <div className="fbrief-hero">
        <section className="fbrief-command" aria-label={t("nav.founderBrief")}>
        {showBlocked ? (
          <CommandTier
            label={t("fbrief.primary.blocked")}
            text={brief.topBlockedItem.text}
            variant="blocked"
            onGo={() => onNavigate(brief.topBlockedItem.navId)}
          />
        ) : null}

        <CommandTier
          label={t("fbrief.primary.action")}
          text={brief.topTodayAction.text}
          variant="action"
          onGo={() => onNavigate(brief.topTodayAction.navId)}
        />

        <CommandTier
          label={t("fbrief.primary.leverage")}
          text={brief.highestLeverageMove.text}
          variant="leverage"
          onGo={() => onNavigate(brief.highestLeverageMove.navId)}
        />

        {constraint ? (
          <CommandTier
            label={t("fbrief.primary.constraint")}
            text={constraint.text}
            variant="constraint"
            onGo={() => onNavigate(constraint.navId)}
          />
        ) : null}
        </section>
        <div className="fbrief-ambient" aria-hidden />
      </div>

      <details className="fbrief-context">
        <summary>{t("fbrief.context.title")}</summary>
        <div className="fbrief-context__body">
          {contextLines.map(({ label, field }) => (
            <button
              key={label}
              type="button"
              className="fbrief-context__row"
              onClick={() => onNavigate(field.navId)}
            >
              <span className="fbrief-context__lab">{label}</span>
              <span className="fbrief-context__txt">{field.text}</span>
            </button>
          ))}
          <div className="fbrief-context__actions">
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
          </div>
        </div>
      </details>

      <style>{`
        .fbrief-page { max-width: 640px; margin: 0 auto; padding: 0 0 12px; display: grid; gap: 8px; }
        .fbrief-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
        .fbrief-head h1 { margin: 0; font-size: 1.28rem; font-weight: 600; letter-spacing: -0.02em; }
        .fbrief-head__save {
          flex-shrink: 0;
          padding: 4px 0;
          border: none;
          background: none;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: lowercase;
          opacity: 0.48;
          color: rgba(180, 195, 220, 0.85);
        }
        .fbrief-head__save:hover { opacity: 0.82; background: none; border: none; }
        .fbrief-hero { position: relative; z-index: 1; }
        .fbrief-command { display: grid; gap: 8px; position: relative; z-index: 1; }
        .fbrief-tier {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          gap: 4px 12px;
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.2);
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .fbrief-tier:hover { border-color: rgba(120,180,255,0.4); background: rgba(20,30,50,0.35); }
        .fbrief-tier__lab {
          grid-column: 1;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.65;
        }
        .fbrief-tier__txt {
          grid-column: 1;
          line-height: 1.45;
        }
        .fbrief-tier__go {
          grid-column: 2;
          grid-row: 1 / span 2;
          align-self: center;
          opacity: 0;
          font-size: 1.1rem;
          transition: opacity 0.15s;
        }
        .fbrief-tier:hover .fbrief-tier__go { opacity: 0.45; }
        .fbrief-tier--blocked {
          border-color: rgba(255, 170, 80, 0.35);
          background: rgba(60, 40, 10, 0.25);
        }
        .fbrief-tier--blocked .fbrief-tier__lab { color: #e8b060; opacity: 0.9; }
        .fbrief-tier--action {
          padding: 18px 16px;
          border-color: rgba(120, 180, 255, 0.3);
          background: rgba(30, 50, 80, 0.35);
        }
        .fbrief-tier--action .fbrief-tier__txt { font-size: 1.05rem; font-weight: 500; }
        .fbrief-tier--leverage .fbrief-tier__txt { font-size: 0.95rem; }
        .fbrief-tier--constraint {
          border-color: rgba(200, 120, 120, 0.25);
          background: rgba(50, 25, 25, 0.2);
        }
        .fbrief-tier--constraint .fbrief-tier__txt { font-size: 0.88rem; opacity: 0.9; }
        .fbrief-context {
          padding: 0;
          overflow: hidden;
          border: none;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
        }
        .fbrief-context summary {
          padding: 6px 2px;
          cursor: pointer;
          font-size: 0.72rem;
          opacity: 0.45;
          list-style: none;
          user-select: none;
        }
        .fbrief-context summary::-webkit-details-marker { display: none; }
        .fbrief-context summary::before { content: "▸ "; }
        .fbrief-context[open] summary::before { content: "▾ "; }
        .fbrief-context__body { padding: 0 10px 10px; display: grid; gap: 4px; }
        .fbrief-context__row {
          display: grid;
          grid-template-columns: 96px 1fr;
          gap: 8px;
          text-align: left;
          width: 100%;
          padding: 8px 10px;
          border: none;
          border-radius: 6px;
          background: rgba(0,0,0,0.12);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }
        .fbrief-context__row:hover { background: rgba(0,0,0,0.22); }
        .fbrief-context__lab { font-size: 0.72rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.04em; }
        .fbrief-context__txt { font-size: 0.82rem; line-height: 1.35; opacity: 0.85; }
        .fbrief-context__actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; padding: 0 2px; }
        .fbrief-context__actions .ghost-btn { opacity: 0.45; font-size: 0.68rem; padding: 4px 8px; }
        .fbrief-context__actions .ghost-btn:hover { opacity: 0.75; }
        .fbrief-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 14px; background: rgba(20,28,40,0.92); border-radius: 8px; z-index: 40; }
        @media (max-width: 520px) {
          .fbrief-context__row { grid-template-columns: 1fr; gap: 2px; }
        }
      `}</style>
    </div>
  );
}
