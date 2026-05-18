import type { CleanupConfidence } from "./types";

export type TitleInference = {
  corridor?: string;
  productFamily?: string;
  seoCluster?: string;
  stockMode?: string;
  /** Highest signal used */
  confidence: CleanupConfidence;
};

function lc(s: string): string {
  return s.toLowerCase();
}

/**
 * Deterministic hints from title text only (no CTR, no APIs).
 * Low confidence when match is fuzzy or generic.
 */
export function inferFromTitle(title: string): TitleInference | null {
  const t = lc(title);
  if (!t.trim()) return null;

  if (/\boversize\b|оверсайз|over\s*size/i.test(t)) {
    return {
      corridor: "oversize-outpost",
      productFamily: "oversize-core",
      seoCluster: "seo:oversize-fit",
      confidence: /oversize|оверсайз/i.test(t) ? "medium" : "low",
    };
  }

  if (/\banime\b|аниме|манга|manga/i.test(t)) {
    return {
      corridor: "dark-anime-wall",
      productFamily: "anime-capsule",
      seoCluster: "seo:anime-graphic-drop",
      confidence: /аниме|anime/i.test(t) ? "medium" : "low",
    };
  }

  if (/\bdiesel\b|\barchive\b|luxury|люкс|архив|brutal\s*typ|типограф/i.test(t)) {
    return {
      corridor: "archive-luxury-brutal",
      productFamily: "archive-luxury-line",
      seoCluster: "seo:archive-luxury-typography",
      confidence: /diesel|archive|luxury|люкс|архив/i.test(t) ? "medium" : "low",
    };
  }

  if (/\bfbo\b|фбо\b/.test(t)) {
    return { stockMode: "FBO", confidence: "high" };
  }
  if (/\bfbs\b|фбс\b|dropship|кроссдок/i.test(t)) {
    return { stockMode: "FBS", confidence: "high" };
  }

  return null;
}

export function inferSeoClusterFromContext(title: string, corridor: string): { value: string; confidence: CleanupConfidence } | null {
  const fromTitle = inferFromTitle(title);
  if (fromTitle?.seoCluster) {
    return { value: fromTitle.seoCluster, confidence: fromTitle.confidence };
  }
  const c = lc(corridor);
  if (c && c !== "—" && c !== "unknown") {
    const slug = c.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    if (slug.length > 2) {
      return { value: `seo:${slug}`, confidence: "low" };
    }
  }
  return null;
}
