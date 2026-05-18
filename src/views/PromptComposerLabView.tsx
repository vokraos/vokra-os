import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { getBrandConstitution } from "../lib/brand-dna";
import {
  composeMarketplacePrompts,
  promptBundleToJson,
  promptBundleToMarkdown,
  promptBundleCopyBlock,
} from "../lib/prompt-composer";
import type { HeroPromptArchetype, MarketplacePromptType, MarketplaceTarget, PromptComposerInput, PromptOutputPack } from "../lib/prompt-composer";
import { useVisualStrategySnapshot } from "../lib/visual-intelligence";
import { VISUAL_CORRIDOR_CATALOG } from "../lib/visual-intelligence/corridors";
import type { VisualCorridorId } from "../lib/visual-intelligence/types";
import { useCollectionBuilderEntity } from "../lib/collection-builder";
import { recordGeneration } from "../lib/memory";
import { consumePromptComposerSerpHint } from "../lib/competitor-serp";
import { consumeHeroPlanComposerPayload } from "../lib/hero-improvement-plan";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

const PROMPT_TYPES: { id: MarketplacePromptType; labelKey: string }[] = [
  { id: "wb_hero_card", labelKey: "promptComposer.type.wbHero" },
  { id: "ozon_hero_card", labelKey: "promptComposer.type.ozonHero" },
  { id: "premium_editorial", labelKey: "promptComposer.type.editorial" },
  { id: "reels_visual", labelKey: "promptComposer.type.reels" },
  { id: "campaign_visual", labelKey: "promptComposer.type.campaign" },
  { id: "launch_teaser", labelKey: "promptComposer.type.launch" },
  { id: "detail_shot", labelKey: "promptComposer.type.detail" },
  { id: "size_grid", labelKey: "promptComposer.type.sizeGrid" },
  { id: "lifestyle_visual", labelKey: "promptComposer.type.lifestyle" },
  { id: "corporate_capsule_visual", labelKey: "promptComposer.type.corporate" },
];

function coerceVisualCorridorId(raw: string | null | undefined, fallback: VisualCorridorId): VisualCorridorId {
  const s = raw?.trim();
  if (s && VISUAL_CORRIDOR_CATALOG.some((c) => c.id === s)) return s as VisualCorridorId;
  return fallback;
}

const TARGETS: { id: MarketplaceTarget; labelKey: string }[] = [
  { id: "wb", labelKey: "promptComposer.target.wb" },
  { id: "ozon", labelKey: "promptComposer.target.ozon" },
  { id: "neutral", labelKey: "promptComposer.target.neutral" },
];

const HERO_ARCH: { id: HeroPromptArchetype; labelKey: string }[] = [
  { id: "static_luxury_hero", labelKey: "promptComposer.hero.static" },
  { id: "cinematic_movement_hero", labelKey: "promptComposer.hero.cinematic" },
  { id: "brutalist_studio_hero", labelKey: "promptComposer.hero.brutalist" },
  { id: "architectural_street_hero", labelKey: "promptComposer.hero.arch" },
  { id: "clean_marketplace_hero", labelKey: "promptComposer.hero.clean" },
];

export function PromptComposerLabView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const vs = useVisualStrategySnapshot();
  const collection = useCollectionBuilderEntity();
  const C = useMemo(() => getBrandConstitution(), []);
  const en = locale === "en";

  const [promptType, setPromptType] = useState<MarketplacePromptType>("wb_hero_card");
  const [target, setTarget] = useState<MarketplaceTarget>("wb");
  const [heroArch, setHeroArch] = useState<HeroPromptArchetype>(() => vs.heroVisual.compositionType as HeroPromptArchetype);
  const [outVariant, setOutVariant] = useState<keyof PromptOutputPack>("marketplaceOptimized");
  const [toast, setToast] = useState<string | null>(null);
  const serpBoot = useRef(true);
  const [heroGarmentOverride, setHeroGarmentOverride] = useState<string | null>(null);
  const [heroPrintOverride, setHeroPrintOverride] = useState<string | null>(null);
  const [heroCorridorOverride, setHeroCorridorOverride] = useState<string | null>(null);

  useEffect(() => {
    if (serpBoot.current) {
      serpBoot.current = false;
      const hip = consumeHeroPlanComposerPayload();
      if (hip) {
        setHeroArch(hip.suggestedHeroArch);
        const mp =
          hip.marketplace === "ozon" ? "ozon" : hip.marketplace === "wildberries" || hip.marketplace === "wb" ? "wb" : "neutral";
        setTarget(mp);
        setPromptType(mp === "ozon" ? "ozon_hero_card" : "wb_hero_card");
        setHeroGarmentOverride(hip.garmentFocusLine);
        setHeroPrintOverride(hip.printFocusLine);
        setHeroCorridorOverride(hip.corridor);
        const src = hip.source;
        const toastKey =
          src === "archetype"
            ? "promptComposer.archetypeHintToast"
            : src === "gap"
              ? "promptComposer.gapHintToast"
              : src === "readability"
                ? "promptComposer.readabilityHintToast"
                : src === "fatigue"
                  ? "promptComposer.fatigueHintToast"
                  : src === "battle_plan"
                    ? "promptComposer.battlePlanHintToast"
                    : src === "test_matrix"
                      ? "promptComposer.testMatrixHintToast"
                      : "promptComposer.heroPlanHintToast";
        setToast(t(toastKey));
        window.setTimeout(() => setToast(null), 3600);
        return;
      }
      const hint = consumePromptComposerSerpHint();
      if (hint) {
        setHeroArch(hint.suggestedHeroArch);
        const mp =
          hint.marketplace === "ozon" ? "ozon" : hint.marketplace === "wildberries" || hint.marketplace === "wb" ? "wb" : "neutral";
        setTarget(mp);
        setToast(t("promptComposer.serpHintToast"));
        window.setTimeout(() => setToast(null), 3400);
        return;
      }
    }
    setHeroArch(vs.heroVisual.compositionType as HeroPromptArchetype);
  }, [vs.heroVisual.compositionType, t]);

  const fallbackCorridor = (vs.activeDirections[0]?.corridor ?? "archive_luxury") as VisualCorridorId;
  const corridorId = coerceVisualCorridorId(heroCorridorOverride, fallbackCorridor);

  const composerInput: PromptComposerInput = useMemo(() => {
    const brandLine = `${C.core.enemy} · ${C.core.promise}`.slice(0, 220);
    return {
      corridorId,
      promptType,
      marketplaceTarget: target,
      visualMood: collection.visualDirection.mood,
      garmentFocus: (heroGarmentOverride ?? collection.visualDirection.heroCardDirection).slice(0, 220),
      printFocus: (heroPrintOverride ?? collection.visualDirection.printDirection).slice(0, 220),
      heroArchetype: heroArch,
      brandDnaLine: brandLine,
      physics: vs.physics,
      fatigueScore: vs.fatigue.score,
      premiumPerception: vs.heroVisual.premiumPerception,
      collectionName: collection.name,
    };
  }, [
    C.core.enemy,
    C.core.promise,
    corridorId,
    collection.name,
    collection.visualDirection.heroCardDirection,
    collection.visualDirection.mood,
    collection.visualDirection.printDirection,
    heroCorridorOverride,
    heroGarmentOverride,
    heroPrintOverride,
    heroArch,
    promptType,
    target,
    vs.fatigue.score,
    vs.heroVisual.premiumPerception,
    vs.physics,
    vs.activeDirections[0]?.corridor,
  ]);

  const bundle = useMemo(() => composeMarketplacePrompts(composerInput), [composerInput]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyOut = useCallback(async () => {
    await copyToClipboard(promptBundleCopyBlock(bundle, outVariant));
    showToast(t("promptComposer.toastCopied"));
  }, [bundle, outVariant, showToast, t]);

  const exportMd = useCallback(() => {
    downloadText(`vokra-prompt-composer-${bundle.generatedAt}.md`, promptBundleToMarkdown(bundle, t("promptComposer.title")));
  }, [bundle, t]);

  const exportJson = useCallback(() => {
    downloadJson(`vokra-prompt-composer-${bundle.generatedAt}.json`, JSON.parse(promptBundleToJson(bundle)) as object);
  }, [bundle]);

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "prompt_composer",
      title: `${t("promptComposer.title")} · ${promptType} · ${collection.name}`,
      content: promptBundleToJson(bundle),
      mime: "application/json",
      tags: ["prompt_composer", promptType, corridorId, target],
      meta: { corridor: corridorId, fatigue: vs.fatigue.score, premium: vs.heroVisual.premiumPerception },
    });
    showToast(t("promptComposer.toastSaved"));
  }, [bundle, collection.name, corridorId, promptType, showToast, t, target, vs.fatigue.score, vs.heroVisual.premiumPerception]);

  const activeCorridorLabel =
    vs.corridors.find((c) => c.id === corridorId)?.labelRu ?? corridorId;

  return (
    <div className="pcl">
      <header className="pcl__head">
        <p className="pcl__eyebrow">{t("promptComposer.eyebrow")}</p>
        <h1 className="pcl__title">{t("promptComposer.title")}</h1>
        <p className="pcl__lede">{t("promptComposer.lede")}</p>
        <div className="pcl__actions">
          <button type="button" className="ghost-btn" onClick={copyOut}>
            {t("promptComposer.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("promptComposer.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportJson}>
            {t("promptComposer.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("promptComposer.saveMemory")}
          </button>
        </div>
        {toast ? <p className="pcl__toast">{toast}</p> : null}
      </header>

      <section className="pcl__panel glass-panel">
        <h2 className="pcl__h2">{t("promptComposer.section.links")}</h2>
        <div className="pcl__links">
          <button type="button" className="linkish" onClick={() => onNavigate("visualStrategy")}>
            {t("nav.visualStrategy")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("collectionBuilder")}>
            {t("nav.collectionBuilder")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("memory")}>
            {t("nav.memory")}
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate("prompts")}>
            {t("nav.prompts")}
          </button>
        </div>
      </section>

      <div className="pcl__grid2">
        <section className="pcl__panel glass-panel">
          <h2 className="pcl__h2">{t("promptComposer.section.controls")}</h2>
          <p className="pcl__meta">
            <strong>{t("promptComposer.activeCorridor")}</strong> {activeCorridorLabel} ({corridorId})
          </p>
          <label className="pcl__field">
            <span>{t("promptComposer.promptType")}</span>
            <select className="pcl__select" value={promptType} onChange={(e) => setPromptType(e.target.value as MarketplacePromptType)}>
              {PROMPT_TYPES.map((x) => (
                <option key={x.id} value={x.id}>
                  {t(x.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="pcl__field">
            <span>{t("promptComposer.marketplaceTarget")}</span>
            <select className="pcl__select" value={target} onChange={(e) => setTarget(e.target.value as MarketplaceTarget)}>
              {TARGETS.map((x) => (
                <option key={x.id} value={x.id}>
                  {t(x.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="pcl__field">
            <span>{t("promptComposer.heroArchetype")}</span>
            <select className="pcl__select" value={heroArch} onChange={(e) => setHeroArch(e.target.value as HeroPromptArchetype)}>
              {HERO_ARCH.map((x) => (
                <option key={x.id} value={x.id}>
                  {t(x.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="pcl__field">
            <span>{t("promptComposer.outputVariant")}</span>
            <select className="pcl__select" value={outVariant} onChange={(e) => setOutVariant(e.target.value as typeof outVariant)}>
              <option value="short">short</option>
              <option value="marketplaceOptimized">marketplace_optimized</option>
              <option value="fullCinematic">full_cinematic</option>
              <option value="editorial">editorial</option>
              <option value="reelsDirection">reels_direction</option>
            </select>
          </label>
        </section>

        <section className="pcl__panel glass-panel">
          <h2 className="pcl__h2">{t("promptComposer.section.pressure")}</h2>
          <ul className="pcl__kv">
            <li>
              <span>{t("visualStrategy.phys.thumb")}</span> {vs.physics.thumbnailReadability}
            </li>
            <li>
              <span>{t("visualStrategy.phys.conv")}</span> {vs.physics.conversionClarity}
            </li>
            <li>
              <span>{t("visualStrategy.fatigueScore")}</span> {vs.fatigue.score}
            </li>
            <li>
              <span>{t("promptComposer.premiumPerc")}</span> {vs.heroVisual.premiumPerception}
            </li>
          </ul>
          <h3 className="pcl__h3">{t("promptComposer.negatives")}</h3>
          <ul className="pcl__neg">
            {bundle.negatives.slice(0, 10).map((n) => (
              <li key={n}>no {n}</li>
            ))}
          </ul>
          <h3 className="pcl__h3">{t("promptComposer.refresh")}</h3>
          <ul className="pcl__refresh">
            {bundle.refreshNotes.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="pcl__panel glass-panel">
        <h2 className="pcl__h2">{t("promptComposer.section.output")}</h2>
        <pre className="pcl__pre">{promptBundleCopyBlock(bundle, outVariant)}</pre>
      </section>

      {!en ? (
        <p className="pcl__note">{t("promptComposer.langNote")}</p>
      ) : (
        <p className="pcl__note">{t("promptComposer.langNoteEn")}</p>
      )}

      <style>{`
        .pcl { max-width: 960px; margin: 0 auto; padding: 0 4px 48px; }
        .pcl__head { margin-bottom: 16px; }
        .pcl__eyebrow { font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
        .pcl__title { font-family: var(--font-display); font-size: clamp(1.3rem, 2vw, 1.65rem); margin: 0 0 8px; }
        .pcl__lede { color: var(--muted); max-width: 60ch; line-height: 1.5; font-size: 0.86rem; margin: 0 0 10px; }
        .pcl__actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .pcl__toast { margin: 8px 0 0; font-size: 0.82rem; color: rgba(160, 210, 255, 0.85); }
        .pcl__panel { padding: 14px 16px; margin-bottom: 12px; }
        .pcl__h2 { font-size: 0.66rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(200, 210, 235, 0.75); margin: 0 0 10px; }
        .pcl__h3 { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 12px 0 6px; }
        .pcl__links { display: flex; flex-wrap: wrap; gap: 10px 14px; }
        .linkish { background: none; border: none; padding: 0; font: inherit; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(140, 175, 255, 0.9); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
        .pcl__grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 820px) { .pcl__grid2 { grid-template-columns: 1fr; } }
        .pcl__field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 0.72rem; }
        .pcl__field span { color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .pcl__select { border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.35); color: inherit; padding: 8px 10px; font-size: 0.82rem; }
        .pcl__meta { font-size: 0.8rem; margin: 0 0 10px; line-height: 1.4; }
        .pcl__kv { list-style: none; padding: 0; margin: 0; font-size: 0.78rem; }
        .pcl__kv li { display: grid; grid-template-columns: 140px 1fr; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pcl__kv span { color: var(--muted); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; }
        .pcl__neg, .pcl__refresh { margin: 0; padding-left: 1.05rem; font-size: 0.78rem; line-height: 1.35; color: rgba(255, 200, 180, 0.88); }
        .pcl__pre { margin: 0; padding: 12px; border-radius: 10px; background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.06); font-size: 0.78rem; line-height: 1.45; white-space: pre-wrap; max-height: 360px; overflow-y: auto; }
        .pcl__note { font-size: 0.72rem; color: var(--muted); margin-top: 8px; }
      `}</style>
    </div>
  );
}
