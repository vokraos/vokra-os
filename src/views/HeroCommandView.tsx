import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { recordGeneration } from "../lib/memory";
import { getActiveEntitySnapshot } from "../lib/entity-snapshot";
import { setAssortmentActionStatus } from "../lib/assortment-actions";
import { addHeroExecutionActionToAssortmentPlan } from "../lib/hero-assortment-bridge";
import {
  HERO_COMMAND_EVENT,
  buildHeroCommandMemoryPayload,
  buildHeroCommandSnapshot,
  gatherHeroWorkflowArtifacts,
  heroCommandToMarkdown,
  heroCommandToPlainText,
  notifyHeroCommandUpdated,
  primeHeroWorkflowToMapSessions,
  saveHeroCommandMapSession,
  type HeroStageStatus,
} from "../lib/hero-command";

type Props = { onNavigate: (id: NavId) => void };

function statusClass(status: HeroStageStatus): string {
  return `hc-pipe__node hc-pipe__node--${status}`;
}

export function HeroCommandView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener(HERO_COMMAND_EVENT, fn);
    return () => window.removeEventListener(HERO_COMMAND_EVENT, fn);
  }, []);

  const artifacts = useMemo(() => gatherHeroWorkflowArtifacts(), [tick]);
  const snapshot = useMemo(() => buildHeroCommandSnapshot(artifacts), [artifacts]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const openCompetitiveMap = useCallback(() => {
    primeHeroWorkflowToMapSessions(artifacts);
    onNavigate("competitiveMap");
  }, [artifacts, onNavigate]);

  const onAddToAssortmentPlan = useCallback(() => {
    const entitySnap = getActiveEntitySnapshot();
    if (!entitySnap) {
      showToast(t("hab.needSnapshot"));
      return;
    }
    if (snapshot.nextStepKey === "hc.next.complete") {
      showToast(t("hab.noAction"));
      return;
    }
    const row = addHeroExecutionActionToAssortmentPlan(entitySnap.id, snapshot, t);
    if (!row) {
      showToast(t("hab.noAction"));
      return;
    }
    setAssortmentActionStatus(entitySnap.id, row.id, "new");
    showToast(t("hab.added"));
    onNavigate("assortmentActions");
  }, [onNavigate, showToast, snapshot, t]);

  const saveSnapshot = useCallback(() => {
    const payload = buildHeroCommandMemoryPayload(snapshot, artifacts);
    saveHeroCommandMapSession(payload);
    recordGeneration({
      module: "hero_command",
      title: t("hc.memory.title", { query: snapshot.query || "—" }),
      content: JSON.stringify(payload),
      previewText: t(snapshot.nextStepKey),
      mime: "application/json",
    });
    notifyHeroCommandUpdated();
    showToast(t("hc.toast.saved"));
  }, [artifacts, showToast, snapshot, t]);

  const onCopy = useCallback(async () => {
    await copyToClipboard(heroCommandToPlainText(snapshot, t));
    showToast(t("hc.toast.copied"));
  }, [showToast, snapshot, t]);

  const onExportMd = useCallback(() => {
    downloadText(`hero-command-${snapshot.id}.md`, heroCommandToMarkdown(snapshot, t));
  }, [snapshot, t]);

  const onExportJson = useCallback(() => {
    downloadJson(`hero-command-${snapshot.id}.json`, buildHeroCommandMemoryPayload(snapshot, artifacts));
  }, [artifacts, snapshot]);

  if (!snapshot.hasActiveWorkflow && !snapshot.query) {
    return (
      <div className="hc-page">
        <header className="hc-page__head glass-panel">
          <h1 className="hc-page__title">{t("hc.title")}</h1>
          <p className="hc-page__lede">{t("hc.lede")}</p>
        </header>
        <section className="hc-empty glass-panel">
          <p>{t("hc.empty")}</p>
          <button type="button" className="primary-btn" onClick={() => onNavigate("competitiveMap")}>
            {t("hc.action.openMap")}
          </button>
        </section>
        {toast ? <p className="hc-toast">{toast}</p> : null}
        <HcStyles />
      </div>
    );
  }

  return (
    <div className="hc-page">
      <header className="hc-page__head glass-panel">
        <h1 className="hc-page__title">{t("hc.title")}</h1>
        <p className="hc-page__lede">{t("hc.lede")}</p>
      </header>

      <section className="hc-next glass-panel" aria-live="polite">
        <p className="hc-next__label">{t("hc.next.label")}</p>
        <p className="hc-next__step">{t(snapshot.nextStepKey)}</p>
      </section>

      <section className="hc-pipe glass-panel" aria-label={t("hc.pipeline.aria")}>
        <h2 className="hc-sec__h">{t("hc.pipeline.title")}</h2>
        <ol className="hc-pipe__list">
          {snapshot.stages.map((stage) => (
            <li key={stage.id} className={statusClass(stage.status)}>
              <span className="hc-pipe__name">{t(`hc.stage.${stage.id}`)}</span>
              <span className="hc-pipe__status">{t(`hc.status.${stage.status}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="hc-objects glass-panel">
        <h2 className="hc-sec__h">{t("hc.objects.title")}</h2>
        <dl className="hc-dl">
          <div>
            <dt>{t("hc.field.query")}</dt>
            <dd>{snapshot.query || "—"}</dd>
          </div>
          <div>
            <dt>{t("hc.field.marketplace")}</dt>
            <dd>{snapshot.marketplace || "—"}</dd>
          </div>
          <div>
            <dt>{t("hc.field.direction")}</dt>
            <dd>{snapshot.currentDirection || "—"}</dd>
          </div>
          <div>
            <dt>{t("hc.field.winner")}</dt>
            <dd>{snapshot.winnerVariantLabel || "—"}</dd>
          </div>
          <div>
            <dt>{t("hc.field.launchReadiness")}</dt>
            <dd>
              {snapshot.launchReadiness ? t(`hc.readiness.${snapshot.launchReadiness}`) : "—"}
            </dd>
          </div>
          <div>
            <dt>{t("hc.field.postLaunch")}</dt>
            <dd>
              {snapshot.postLaunchStatus ? t(`hc.postLaunch.${snapshot.postLaunchStatus}`) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="hc-actions glass-panel">
        <h2 className="hc-sec__h">{t("hc.actions.title")}</h2>
        <div className="hc-actions__grid">
          <button type="button" className="primary-btn" onClick={openCompetitiveMap}>
            {t("hc.action.openMap")}
          </button>
          <button type="button" className="ghost-btn" onClick={onAddToAssortmentPlan}>
            {t("hc.action.addAssortment")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("promptComposer")}>
            {t("hc.action.composer")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualProduction")}>
            {t("hc.action.visualProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("hc.action.visualAssets")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("hc.action.cardProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveSnapshot}>
            {t("hc.action.saveSnapshot")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => void onCopy()}>
            {t("hc.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={onExportMd}>
            {t("hc.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={onExportJson}>
            {t("hc.action.exportJson")}
          </button>
        </div>
      </section>

      {toast ? <p className="hc-toast">{toast}</p> : null}
      <HcStyles />
    </div>
  );
}

function HcStyles() {
  return (
    <style>{`
      .hc-page { display: grid; gap: 14px; max-width: 920px; margin: 0 auto; padding: 8px 0 32px; }
      .hc-page__title { margin: 0 0 6px; font-size: 1.35rem; }
      .hc-page__lede { margin: 0; opacity: 0.82; font-size: 0.92rem; line-height: 1.45; }
      .hc-page__head, .hc-empty, .hc-next, .hc-pipe, .hc-objects, .hc-actions { padding: 14px 16px; }
      .hc-sec__h { margin: 0 0 10px; font-size: 1rem; }
      .hc-next__label { margin: 0; font-size: 0.8rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.04em; }
      .hc-next__step { margin: 6px 0 0; font-size: 1.05rem; font-weight: 600; }
      .hc-pipe__list {
        list-style: none; margin: 0; padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }
      .hc-pipe__node {
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.08);
        display: flex; flex-direction: column; gap: 4px;
        font-size: 0.82rem;
      }
      .hc-pipe__node--completed { border-color: rgba(120, 200, 140, 0.35); }
      .hc-pipe__node--active { border-color: rgba(120, 180, 255, 0.45); outline: 1px solid rgba(120, 180, 255, 0.2); }
      .hc-pipe__node--needs_review { border-color: rgba(230, 180, 80, 0.45); }
      .hc-pipe__node--ready { border-color: rgba(180, 200, 255, 0.25); }
      .hc-pipe__node--missing { opacity: 0.55; }
      .hc-pipe__name { font-weight: 600; }
      .hc-pipe__status { opacity: 0.75; font-size: 0.78rem; }
      .hc-dl { display: grid; gap: 8px; margin: 0; }
      .hc-dl > div { display: grid; grid-template-columns: minmax(120px, 34%) 1fr; gap: 8px; font-size: 0.9rem; }
      .hc-dl dt { opacity: 0.72; margin: 0; }
      .hc-dl dd { margin: 0; }
      .hc-actions__grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .hc-empty { text-align: center; }
      .hc-empty p { margin: 0 0 12px; opacity: 0.85; }
      .hc-toast {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        padding: 8px 14px; border-radius: 8px;
        background: rgba(20, 28, 40, 0.92); border: 1px solid rgba(255,255,255,0.12);
        font-size: 0.88rem; z-index: 40;
      }
    `}</style>
  );
}
