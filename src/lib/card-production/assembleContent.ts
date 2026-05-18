import { getBrandConstitution } from "../brand-dna";
import type { PromptPackEntity } from "../prompt-pack/types";
import type { VisualAssetEntity } from "../visual-assets/types";
import type { CardProductionPlan, RichContentBlock } from "./types";

export type AssembleCardContentContext = {
  assets: VisualAssetEntity[];
  promptPack: PromptPackEntity | null;
};

function trimTitle(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function tokenizeSeoCluster(cluster: string): string[] {
  return cluster
    .split(/[\n,;|]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && x.length < 96);
}

function pickPack(plan: CardProductionPlan, pack: PromptPackEntity | null): PromptPackEntity | null {
  if (!pack) return null;
  if (pack.id === plan.sourcePromptPackId) return pack;
  if (pack.collectionId === plan.collectionId) return pack;
  return null;
}

function excerptPrompt(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Deterministic marketplace copy draft from OS context (no APIs).
 * Operator edits fields after assembly.
 */
export function assembleCardContentPatch(plan: CardProductionPlan, ctx: AssembleCardContentContext): Partial<CardProductionPlan> {
  const brand = getBrandConstitution();
  const byId = new Map(ctx.assets.map((a) => [a.id, a] as const));
  const linked = plan.sourceVisualAssetIds.map((id) => byId.get(id)).filter(Boolean) as VisualAssetEntity[];
  const hero = (plan.heroVisualId && byId.get(plan.heroVisualId)) || linked[0];
  const collectionLabel = hero?.collectionName?.trim() || plan.targetSkuFamily || plan.cardTitle;
  const skuLine = plan.targetSkuFamily.trim() || collectionLabel;
  const heroTitle = hero?.title?.trim() || plan.cardTitle;
  const pack = pickPack(plan, ctx.promptPack);

  const corridor = pack?.corridor?.trim() || tokenizeSeoCluster(plan.seoCluster)[0] || skuLine;

  const primaryKeywords = (() => {
    const merged = [...tokenizeSeoCluster(plan.seoCluster)];
    if (corridor && !merged.includes(corridor)) merged.unshift(corridor);
    if (skuLine && !merged.includes(skuLine)) merged.push(skuLine);
    const roleTag = hero?.assetRole?.replace(/_/g, " ");
    if (roleTag && !merged.includes(roleTag)) merged.push(roleTag);
    return [...new Set(merged.map((x) => x.trim()).filter(Boolean))].slice(0, 14);
  })();

  const secondaryKeywords = (() => {
    const out: string[] = [];
    const vd = pack?.visualDirection?.trim();
    if (vd) out.push(vd.slice(0, 72));
    for (const a of linked) {
      const u = (a.approvedUsage || a.usageTarget || "").trim();
      if (u) out.push(u);
    }
    out.push(...(pack?.negativeConstraints ?? []).slice(0, 3).map((x) => `avoid:${x.slice(0, 48)}`));
    return [...new Set(out)].filter(Boolean).slice(0, 12);
  })();

  const wbCore = `${collectionLabel} · ${heroTitle}`;
  const wbTitle = trimTitle(`${wbCore} — ${brand.core.mantra}`.trim(), 60);
  const ozonTitle = trimTitle(`${wbCore} · ${skuLine} · DTF · premium streetwear`.trim(), 200);

  const tone = brand.voice.toneBullets.slice(0, 4).join(" · ");
  const mpRules = brand.marketplace.rules.slice(0, 2).join(" ");
  const descriptionDraft = [
    tone,
    "",
    `${collectionLabel} — ${heroTitle}.`,
    "",
    mpRules,
    "",
    pack?.marketplaceNotes?.trim() ? `Prompt pack / витрина: ${pack.marketplaceNotes.trim()}` : plan.marketplaceNotes.trim() || "—",
    "",
    `Материал / продукт (из Brand DNA): ${brand.product.intro}`,
    "",
    `Принт / визуал: ${hero?.selectedResultNote?.trim() || excerptPrompt(hero?.sourcePrompt ?? "", 320)}`,
    "",
    `SEO-кластер (исходный текст): ${plan.seoCluster.trim() || "— добавьте кластер в поле SEO"}`,
  ].join("\n");

  const richContentBlocks: RichContentBlock[] = [
    {
      id: "benefits",
      role: "benefits",
      headline: "Почему это берут",
      body: `${brand.customer.tension} Акцент: ${brand.core.promise}`,
    },
    {
      id: "fit",
      role: "fit",
      headline: "Силуэт и посадка",
      body: `${brand.product.currentLaunchBase} Проверьте охват и длину по сетке.`,
    },
    {
      id: "material",
      role: "material",
      headline: "Материал",
      body: brand.product.intro,
    },
    {
      id: "print",
      role: "print",
      headline: "Принт и DTF-качество",
      body: brand.production.constraints.slice(0, 3).join(" "),
    },
    {
      id: "care",
      role: "care",
      headline: "Уход",
      body: "Стирка по бирке; бережный режим; не трите принт щёткой; не отбеливать область декора.",
    },
    {
      id: "size",
      role: "size",
      headline: "Размерная сетка",
      body: `Сетка размеров — визуальный слот ${plan.sizeGridVisualId ? `(asset ${plan.sizeGridVisualId})` : "(добавьте size_grid визуал)"}; сверяйте с гайдом коллекции.`,
    },
  ];

  const materialBlock = richContentBlocks.find((b) => b.role === "material")!.body;
  const printQualityBlock = richContentBlocks.find((b) => b.role === "print")!.body;
  const careInstructions = richContentBlocks.find((b) => b.role === "care")!.body;
  const sizeBlock = richContentBlocks.find((b) => b.role === "size")!.body;

  const seoWarnings: string[] = [];
  if (!plan.seoCluster.trim()) seoWarnings.push("seo_cluster_empty");
  if (primaryKeywords.length < 3) seoWarnings.push("keywords_sparse");
  if (descriptionDraft.trim().length < 200) seoWarnings.push("description_thin");
  if (!plan.heroVisualId) seoWarnings.push("hero_slot_unset");
  if (pack?.riskFlags?.length) seoWarnings.push(`pack_risks:${pack.riskFlags.slice(0, 3).join(";")}`);

  return {
    wbTitle,
    ozonTitle,
    primaryKeywords,
    secondaryKeywords,
    descriptionDraft,
    richContentBlocks,
    materialBlock,
    printQualityBlock,
    careInstructions,
    sizeBlock,
    seoWarnings,
    productionNotes: `${plan.productionNotes.trim()}\n\n[assemble ${new Date().toISOString()}] Draft from Brand DNA + visuals${pack ? " + prompt pack" : ""}.`,
  };
}
