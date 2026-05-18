/** Single focal, clean stack reads better at thumbnail scale (text cues only). */
export function scoreHierarchyClarity(blob: string): number {
  const s = blob.toLowerCase();
  if (/collage|коллаж|grid\s*overload|много\s*сл|многослой|layer\s*cake|перегружен|busy\s*grid/i.test(s)) return 34;
  if (/dual\s*focal|два\s*фокуса|split\s*hero|делён|split\s*frame/i.test(s)) return 46;
  if (/clean\s*hierarchy|один\s*фокус|single\s*focal|clear\s*stack|чистая\s*иерарх/i.test(s)) return 88;
  if (/flat\s*lay|flatlay|лоток|tray/i.test(s)) return 72;
  if (/simple|миним|minimal\s*stack/i.test(s)) return 78;
  return 58;
}
