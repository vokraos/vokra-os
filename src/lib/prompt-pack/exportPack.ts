import type { PromptPackEntity } from "./types";
import { PROMPT_PACK_ENTITY_SCHEMA } from "./types";

function packKindHeading(kind: PromptPackEntity["promptPackKind"], locale: "ru" | "en"): string {
  const m: Record<PromptPackEntity["promptPackKind"], { ru: string; en: string }> = {
    marketplace_launch: { ru: "Маркетплейс (WB / Ozon)", en: "Marketplace launch (WB / Ozon)" },
    campaign: { ru: "Кампания", en: "Campaign" },
    reels: { ru: "Reels", en: "Reels" },
    exhibition_capsule: { ru: "Выставочная капсула", en: "Exhibition capsule" },
    corporate_merch: { ru: "Корпоративный мерч", en: "Corporate merch" },
  };
  return locale === "ru" ? m[kind].ru : m[kind].en;
}

function section(title: string, body: string): string {
  return [`## ${title}`, "", body.trim(), ""].join("\n");
}

function listPrompts(title: string, prompts: string[]): string {
  if (!prompts.length) return section(title, "_—_");
  return section(
    title,
    prompts.map((p, i) => `### ${i + 1}\n\n${p}`).join("\n\n"),
  );
}

export function promptPackEntityToMarkdown(entity: PromptPackEntity, locale: "ru" | "en"): string {
  const overview =
    locale === "ru"
      ? [
          `- Коллекция: **${entity.collectionName}**`,
          `- ID коллекции: \`${entity.collectionId}\``,
          `- Коридор: ${entity.corridor}`,
          `- Витрина / цель: ${entity.marketplaceTarget}`,
          `- Тип пакета: ${packKindHeading(entity.promptPackKind, locale)}`,
          `- Создан: ${new Date(entity.createdAt).toISOString()}`,
        ].join("\n")
      : [
          `- Collection: **${entity.collectionName}**`,
          `- Collection ID: \`${entity.collectionId}\``,
          `- Corridor: ${entity.corridor}`,
          `- Marketplace / target: ${entity.marketplaceTarget}`,
          `- Pack type: ${packKindHeading(entity.promptPackKind, locale)}`,
          `- Created: ${new Date(entity.createdAt).toISOString()}`,
        ].join("\n");

  return [
    `# VOKRA · Prompt Pack`,
    "",
    section(locale === "ru" ? "Обзор пакета" : "Pack overview", overview),
    section(locale === "ru" ? "Визуальное направление" : "Visual direction", entity.visualDirection),
    listPrompts(locale === "ru" ? "Hero visual prompts" : "Hero visual prompts", entity.heroPrompts),
    listPrompts(locale === "ru" ? "Support visual prompts" : "Support visual prompts", entity.supportPrompts),
    listPrompts(locale === "ru" ? "Detail shot prompts" : "Detail shot prompts", entity.detailPrompts),
    listPrompts(locale === "ru" ? "Reels prompts" : "Reels prompts", entity.reelsPrompts),
    listPrompts(locale === "ru" ? "Campaign prompts" : "Campaign prompts", entity.campaignPrompts),
    section(
      locale === "ru" ? "Негативные ограничения" : "Negative constraints",
      entity.negativeConstraints.map((n) => `- ${n}`).join("\n"),
    ),
    section(locale === "ru" ? "Производственные заметки" : "Production notes", entity.productionNotes),
    section(locale === "ru" ? "Заметки для маркетплейса" : "Marketplace notes", entity.marketplaceNotes),
    section("Brand fit", entity.brandFit),
    section(
      locale === "ru" ? "Флаги риска" : "Risk flags",
      entity.riskFlags.length ? entity.riskFlags.map((r) => `- ${r}`).join("\n") : "—",
    ),
  ].join("\n");
}

export function promptPackEntityToJsonObject(entity: PromptPackEntity): Record<string, unknown> {
  return { schema: PROMPT_PACK_ENTITY_SCHEMA, ...entity };
}

export function promptPackEntityToJsonString(entity: PromptPackEntity): string {
  return JSON.stringify(promptPackEntityToJsonObject(entity), null, 2);
}

export function promptPackEntityFullPlainText(entity: PromptPackEntity): string {
  const md = promptPackEntityToMarkdown(entity, "en");
  return md.replace(/^### /gm, "\n---\n").replace(/^## /gm, "\n\n");
}
