import { buildMarketplaceEntitySnapshot } from "../../entity-core/snapshot";
import { selectHeroSkus } from "../../entity-core/selectors";
import type { CollectionEntity } from "../types";

export type WorkshopSkuSlot = {
  slotId: string;
  /** Stable demo reference for future real SKU binding */
  entityRef: string;
  skuId: string;
  wbStyleId: string;
  corridorId: string;
  noteRu: string;
};

export type WorkshopSkuStructure = {
  heroes: WorkshopSkuSlot[];
  support: WorkshopSkuSlot[];
  amplifiers: WorkshopSkuSlot[];
  holdArchive: WorkshopSkuSlot[];
};

function noteRuHero(i: number): string {
  return `Hero ${i + 1}: якорь витрины в коридоре; обновлять главное фото первым.`;
}

function noteRuSupport(i: number): string {
  return `Support ${i + 1}: кластер цвет/размер; без нового принта без согласования DTF.`;
}

export function buildWorkshopSkuStructure(
  entity: CollectionEntity,
  heroSlots: number,
  supportSlots: number,
  ampSlots: number,
  holdSlots: number,
): WorkshopSkuStructure {
  const snap = buildMarketplaceEntitySnapshot(entity.pulseSeed, 0.5, 0.5);
  const allHero = selectHeroSkus(snap);
  const heroesPick = allHero.filter((h) => h.corridorId === entity.corridorId);
  const pool = heroesPick.length ? heroesPick : allHero;
  const heroes: WorkshopSkuSlot[] = [];
  for (let i = 0; i < heroSlots; i++) {
    const h = pool[i];
    const skuId = h?.skuId ?? `sku-hero-${entity.id}-${i}`;
    const wb = h?.wbStyleId ?? `WB-${(entity.pulseSeed + i * 17) % 800000 + 100000}`;
    heroes.push({
      slotId: `h-${i}`,
      entityRef: `entity-core:corridor:${entity.corridorId}:hero:${i}`,
      skuId,
      wbStyleId: wb,
      corridorId: entity.corridorId,
      noteRu: noteRuHero(i),
    });
  }
  const support: WorkshopSkuSlot[] = [];
  for (let i = 0; i < supportSlots; i++) {
    support.push({
      slotId: `s-${i}`,
      entityRef: `entity-core:corridor:${entity.corridorId}:support:${i}`,
      skuId: `sku-sup-${entity.id}-${i}`,
      wbStyleId: `WB-${(entity.pulseSeed + i * 31 + 3) % 800000 + 100000}`,
      corridorId: entity.corridorId,
      noteRu: noteRuSupport(i),
    });
  }
  const amplifiers: WorkshopSkuSlot[] = [];
  for (let i = 0; i < ampSlots; i++) {
    amplifiers.push({
      slotId: `a-${i}`,
      entityRef: `entity-core:corridor:${entity.corridorId}:amp:${i}`,
      skuId: `sku-amp-${entity.id}-${i}`,
      wbStyleId: `WB-${(entity.pulseSeed + i * 41 + 5) % 800000 + 100000}`,
      corridorId: entity.corridorId,
      noteRu: `Amplifier ${i + 1}: промо-полка рядом с hero, не конкурирует по семантике.`,
    });
  }
  const holdArchive: WorkshopSkuSlot[] = [];
  for (let i = 0; i < holdSlots; i++) {
    holdArchive.push({
      slotId: `x-${i}`,
      entityRef: `entity-core:corridor:${entity.corridorId}:hold:${i}`,
      skuId: `sku-hold-${entity.id}-${i}`,
      wbStyleId: `WB-${(entity.pulseSeed + i * 53 + 7) % 800000 + 100000}`,
      corridorId: entity.corridorId,
      noteRu: `Hold/archive ${i + 1}: без визуала и промо до стабилизации волны.`,
    });
  }
  return { heroes, support, amplifiers, holdArchive };
}
