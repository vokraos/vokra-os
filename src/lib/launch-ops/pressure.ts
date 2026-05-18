import type { LaunchOpsGatherContext, LaunchPressureProfile } from "./types";

export function computeLaunchPressure(ctx: LaunchOpsGatherContext): LaunchPressureProfile {
  const rp = ctx.orchestration?.resourcePressure;
  const r = ctx.pipeline?.readiness;

  const productionPressure = Math.round(
    ((rp?.dtfQueue ?? 0) + (rp?.skuComplexity ?? 0) + (ctx.pipeline ? 100 - r!.productionReadiness : 50)) / 3,
  );
  const packagingPressure = Math.round(rp?.packagingBottleneck ?? 40);
  const fboPressure = Math.round(100 - (rp?.fboReadiness ?? 55));
  const fbsPressure = Math.round(Math.min(100, (rp?.seoBandwidth ?? 50) * 0.4 + productionPressure * 0.3));

  const launchPressure = Math.round(
    productionPressure * 0.35 +
      packagingPressure * 0.25 +
      fboPressure * 0.2 +
      (100 - (r?.marketplaceReadiness ?? 50)) * 0.2,
  );

  return {
    launchPressure: Math.min(100, launchPressure),
    fboPressure: Math.min(100, fboPressure),
    fbsPressure: Math.min(100, fbsPressure),
    productionPressure: Math.min(100, productionPressure),
    packagingPressure: Math.min(100, packagingPressure),
  };
}
