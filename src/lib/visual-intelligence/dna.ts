/** VOKRA visual DNA — distinguishes OS visual language from generic marketplace noise */

export const VOKRA_VISUAL_DNA_TRAITS = [
  "dark cinematic tones",
  "quiet luxury",
  "brutal typography",
  "monochrome pressure",
  "architectural silhouettes",
  "restrained aggression",
  "premium darkness",
  "editorial realism",
  "tactical minimalism",
] as const;

export const GENERIC_MARKETPLACE_VISUAL_TRAPS = [
  "stock lifestyle fluff",
  "neon promo clutter",
  "unreadable micro-print thumbnails",
  "moodboard randomness without corridor discipline",
  "over-smiling generic casting",
  "decorative chaos on hero",
] as const;

export function vokraVsGenericDigestRu(): string {
  return (
    "VOKRA: премиальная тьма, кинематографичность, архитектурный силуэт, сдержанная агрессия. " +
    "Не маркетплейс: декоративный шум, stock-счастье, нечитаемый микропринт на миниатюре."
  );
}

export function vokraVsGenericDigestEn(): string {
  return (
    "VOKRA: premium darkness, cinematic discipline, architectural silhouette, restrained aggression. " +
    "Not marketplace: decorative noise, stock cheer, unreadable micro-print at thumbnail scale."
  );
}
