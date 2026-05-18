import { newOurCardSnapshotId } from "./ids";
import type { OurCardCompetitiveSnapshot } from "./types";

export type OurCardFormFields = {
  cardTitle: string;
  skuCode: string;
  priceRaw: string;
  heroImageNote: string;
  visualPattern: string;
  colorDominance: string;
  modelPresence: string;
  printReadability: string;
  perceivedPremiumLevel: string;
  brandFit: string;
  differentiationNote: string;
};

export function buildOurCardSnapshot(fields: OurCardFormFields, query: string, marketplace: string): OurCardCompetitiveSnapshot {
  const priceStr = fields.priceRaw.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(priceStr);
  const price = Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  const now = Date.now();
  return {
    id: newOurCardSnapshotId(),
    query: query.trim(),
    marketplace: marketplace.trim() || "unknown",
    cardTitle: fields.cardTitle.trim(),
    skuCode: fields.skuCode.trim(),
    price,
    heroImageNote: fields.heroImageNote.trim(),
    visualPattern: fields.visualPattern.trim(),
    colorDominance: fields.colorDominance.trim(),
    modelPresence: fields.modelPresence.trim(),
    printReadability: fields.printReadability.trim(),
    perceivedPremiumLevel: fields.perceivedPremiumLevel.trim(),
    brandFit: fields.brandFit.trim(),
    differentiationNote: fields.differentiationNote.trim(),
    createdAt: now,
  };
}

export function snapshotToFormFields(s: OurCardCompetitiveSnapshot): OurCardFormFields {
  return {
    cardTitle: s.cardTitle,
    skuCode: s.skuCode,
    priceRaw: s.price != null ? String(s.price) : "",
    heroImageNote: s.heroImageNote,
    visualPattern: s.visualPattern,
    colorDominance: s.colorDominance,
    modelPresence: s.modelPresence,
    printReadability: s.printReadability,
    perceivedPremiumLevel: s.perceivedPremiumLevel,
    brandFit: s.brandFit,
    differentiationNote: s.differentiationNote,
  };
}
