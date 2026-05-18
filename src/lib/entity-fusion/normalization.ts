/** Canonical keys for dedupe / future entity-core joins — pure string ops. */

export function canonicalSkuKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

export function canonicalOfferKey(raw: string): string {
  return raw.replace(/\D/g, "").trim();
}

export function canonicalCorridorSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
