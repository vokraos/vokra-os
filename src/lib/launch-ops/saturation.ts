import type { LaunchOpsGatherContext } from "./types";

export function deriveSaturationRisk(
  ctx: LaunchOpsGatherContext,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const seo = ctx.pipeline?.readiness.seoReadiness ?? 100 - ctx.seoSaturation;
  const visual = ctx.pipeline?.readiness.visualReadiness ?? 100 - ctx.visualFatigue;
  if (ctx.seoSaturation > 58 && ctx.visualFatigue > 52) {
    return t("lops.saturation.high", { seo: String(Math.round(100 - seo)), visual: String(Math.round(100 - visual)) });
  }
  if (ctx.seoSaturation > 48) return t("lops.saturation.seo");
  if (ctx.visualFatigue > 48) return t("lops.saturation.visual");
  return t("lops.saturation.low");
}
