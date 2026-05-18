/** Visual crowding / sticker noise from hero + pattern notes (not pixel analysis). */
export function scoreVisualNoise(blob: string): number {
  const s = blob.toLowerCase();
  let n = 24;
  if (/busy|clutter|шум|noise|collage|мозаик|sticker|badge|иконк|banner|лент|ribbon|flash/i.test(s)) n += 30;
  if (/many\s*elements|много\s*объект|перегружен|overload/i.test(s)) n += 18;
  if (/clean|спокойн|calm\s*frame|negative\s*space|воздух/i.test(s)) n -= 16;
  return Math.max(0, Math.min(100, n));
}
