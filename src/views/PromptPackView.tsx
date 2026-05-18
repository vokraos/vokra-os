import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import type { PromptPackEntity, PromptPackSessionSource } from "../lib/prompt-pack";
import {
  PROMPT_PACK_SESSION_KEY,
  clearPromptPackSession,
  consumeRerunPromptPackEntity,
  loadPromptPackSessionState,
  promptPackEntityToJsonString,
  promptPackEntityToMarkdown,
  savePromptPackToSession,
} from "../lib/prompt-pack";
import { buildQueueEnvelopeFromPromptPack, saveVisualProductionQueueToSession } from "../lib/visual-production";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

function PromptListSection({
  title,
  prompts,
  copyLabel,
  onCopied,
}: {
  title: string;
  prompts: string[];
  copyLabel: string;
  onCopied: () => void;
}) {
  if (!prompts.length) return null;
  return (
    <section className="cb-lab__panel glass-panel pp-section">
      <h2 className="cb-lab__h2">{title}</h2>
      <ol className="pp-prompt-list">
        {prompts.map((p, i) => (
          <li key={i} className="pp-prompt-item">
            <pre className="pp-pre">{p}</pre>
            <button
              type="button"
              className="ghost-btn ghost-btn--sm"
              onClick={() => {
                void copyToClipboard(p).then(() => onCopied());
              }}
            >
              {copyLabel}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PromptPackView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const loc = locale === "en" ? "en" : "ru";
  const [entity, setEntity] = useState<PromptPackEntity | null>(null);
  const [source, setSource] = useState<PromptPackSessionSource>("collection_builder");
  const [invalidHydration, setInvalidHydration] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setInvalidHydration(false);
    const st = loadPromptPackSessionState();
    if (st) {
      setEntity(st.entity);
      setSource(st.source);
      return;
    }
    const rerun = consumeRerunPromptPackEntity();
    if (rerun) {
      savePromptPackToSession(rerun, "project_memory");
      setEntity(rerun);
      setSource("project_memory");
      return;
    }
    try {
      const raw = sessionStorage.getItem(PROMPT_PACK_SESSION_KEY);
      if (raw) {
        clearPromptPackSession();
        setInvalidHydration(true);
        setEntity(null);
        return;
      }
    } catch {
      setInvalidHydration(true);
      setEntity(null);
      return;
    }
    setEntity(null);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const md = useMemo(() => (entity ? promptPackEntityToMarkdown(entity, loc) : ""), [entity, loc]);

  const copyFull = useCallback(async () => {
    if (!entity) return;
    await copyToClipboard(md);
    showToast(t("promptPack.toastCopiedFull"));
  }, [entity, md, showToast, t]);

  const exportMd = useCallback(() => {
    if (!entity) return;
    downloadText(`vokra-prompt-pack-${entity.collectionId}.md`, md);
  }, [entity, md]);

  const exportJsonFile = useCallback(() => {
    if (!entity) return;
    downloadJson(`vokra-prompt-pack-${entity.collectionId}.json`, JSON.parse(promptPackEntityToJsonString(entity)) as object);
  }, [entity]);

  const saveMemory = useCallback(() => {
    if (!entity) return;
    recordGeneration({
      module: "prompt_pack",
      title: `${entity.collectionName} · Prompt Pack · ${entity.promptPackKind}`,
      content: promptPackEntityToJsonString(entity),
      mime: "application/json",
      tags: ["prompt_pack", entity.promptPackKind, entity.collectionId],
      meta: { packId: entity.id, collectionId: entity.collectionId },
    });
    showToast(t("promptPack.toastSavedMemory"));
  }, [entity, showToast, t]);

  const createVisualQueue = useCallback(() => {
    if (!entity) return;
    const env = buildQueueEnvelopeFromPromptPack(entity);
    saveVisualProductionQueueToSession(env);
    showToast(t("promptPack.toastVisualQueueCreated"));
    onNavigate("visualProduction");
  }, [entity, onNavigate, showToast, t]);

  const clear = useCallback(() => {
    clearPromptPackSession();
    setEntity(null);
    setInvalidHydration(false);
    showToast(t("promptPack.toastCleared"));
  }, [showToast, t]);

  if (!entity) {
    return (
      <div className="cb-lab pp-empty">
        <header className="cb-lab__head">
          <p className="cb-lab__eyebrow">{t("promptPack.eyebrow")}</p>
          <h1 className="cb-lab__title">{t("nav.promptPack")}</h1>
          <p className="cb-lab__lede">{invalidHydration ? t("promptPack.invalidHydration") : t("promptPack.empty")}</p>
          {invalidHydration ? <p className="cb-lab__prose cb-lab__prose--tight">{t("promptPack.invalidHydrationHint")}</p> : null}
          <div className="pp-empty__actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
              {t("promptPack.openCollection")}
            </button>
            {invalidHydration ? (
              <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
                {t("promptPack.openMemory")}
              </button>
            ) : null}
          </div>
        </header>
      </div>
    );
  }

  const sourceLabel = source === "project_memory" ? t("promptPack.source.memory") : t("promptPack.source.builder");

  return (
    <div className="cb-lab pp-view" data-pp-id={entity.id}>
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("promptPack.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.promptPack")}</h1>
        <p className="pp-source-badge" role="status">
          {sourceLabel}
        </p>
        <p className="cb-lab__lede">{t("promptPack.lede")}</p>
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={copyFull}>
            {t("promptPack.copyFull")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("promptPack.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportJsonFile}>
            {t("promptPack.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("promptPack.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={createVisualQueue}>
            {t("promptPack.createVisualQueue")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("collectionBuilder")}>
            {t("promptPack.backCollection")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("nav.skuIntelligence")}
          </button>
          <button type="button" className="ghost-btn" onClick={clear}>
            {t("promptPack.clearSession")}
          </button>
        </div>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
      </header>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.overview")}</h2>
        <ul className="cb-lab__kv cb-lab__kv--dense">
          <li>
            <span>{t("promptPack.k.collection")}</span> {entity.collectionName}
          </li>
          <li>
            <span>{t("promptPack.k.corridor")}</span> {entity.corridor}
          </li>
          <li>
            <span>{t("promptPack.k.market")}</span> {entity.marketplaceTarget}
          </li>
          <li>
            <span>{t("promptPack.k.packKind")}</span> {t(`promptPack.kind.${entity.promptPackKind}`)}
          </li>
          <li>
            <span>ID</span> <code>{entity.id}</code>
          </li>
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.visualDirection")}</h2>
        <pre className="pp-pre pp-pre--tight">{entity.visualDirection}</pre>
      </section>

      <PromptListSection
        title={t("promptPack.section.hero")}
        prompts={entity.heroPrompts}
        copyLabel={t("promptPack.copyOne")}
        onCopied={() => showToast(t("promptPack.toastCopiedOne"))}
      />
      <PromptListSection
        title={t("promptPack.section.support")}
        prompts={entity.supportPrompts}
        copyLabel={t("promptPack.copyOne")}
        onCopied={() => showToast(t("promptPack.toastCopiedOne"))}
      />
      <PromptListSection
        title={t("promptPack.section.detail")}
        prompts={entity.detailPrompts}
        copyLabel={t("promptPack.copyOne")}
        onCopied={() => showToast(t("promptPack.toastCopiedOne"))}
      />
      <PromptListSection
        title={t("promptPack.section.reels")}
        prompts={entity.reelsPrompts}
        copyLabel={t("promptPack.copyOne")}
        onCopied={() => showToast(t("promptPack.toastCopiedOne"))}
      />
      <PromptListSection
        title={t("promptPack.section.campaign")}
        prompts={entity.campaignPrompts}
        copyLabel={t("promptPack.copyOne")}
        onCopied={() => showToast(t("promptPack.toastCopiedOne"))}
      />

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.negatives")}</h2>
        <ul className="pp-bullets">
          {entity.negativeConstraints.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.production")}</h2>
        <pre className="pp-pre pp-pre--tight">{entity.productionNotes}</pre>
      </section>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.marketplace")}</h2>
        <pre className="pp-pre pp-pre--tight">{entity.marketplaceNotes}</pre>
      </section>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.risk")}</h2>
        <ul className="pp-bullets">
          {entity.riskFlags.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.brandFit")}</h2>
        <p className="cb-lab__prose">{entity.brandFit}</p>
      </section>

      <section className="cb-lab__panel glass-panel pp-section">
        <h2 className="cb-lab__h2">{t("promptPack.section.copyExport")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("promptPack.copyHint")}</p>
      </section>

      <style>{`
        .pp-source-badge {
          margin: 6px 0 0;
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(150, 175, 220, 0.88);
        }
        .pp-view .pp-section { margin-bottom: 14px; }
        .pp-prompt-list { list-style: decimal; padding-left: 1.2rem; margin: 0; }
        .pp-prompt-item {
          margin: 12px 0 16px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }
        .pp-pre {
          margin: 0 0 8px;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 0.78rem;
          line-height: 1.45;
          color: rgba(210, 220, 245, 0.95);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .pp-pre--tight { font-size: 0.76rem; }
        .pp-bullets { margin: 0; padding-left: 1.1rem; font-size: 0.8rem; line-height: 1.45; color: rgba(195, 205, 230, 0.92); }
        .pp-empty { min-height: 40vh; }
        .pp-empty .pp-empty__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}
