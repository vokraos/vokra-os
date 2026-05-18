import type { CollectionEntity } from "../types";
import type { CollectionPipelineBuildInput } from "../pipeline-types";
import { buildCollectionExecutionPipeline } from "../buildCollectionExecutionPipeline";

export type WorkshopComparisonRow = {
  collectionId: string;
  name: string;
  brandFit: number;
  marketplaceFit: number;
  productionFit: number;
  timingFit: number;
  seoOpportunity: number;
  fboRisk: number;
  visualFreshness: number;
  expectedImpactScore: number;
  executionDifficulty: number;
  launchReadiness: number;
  /** weighted total for recommendation */
  score: number;
};

function parseRiskLine(risk: string): number {
  const m = risk.match(/\d+/g);
  if (!m?.length) return 45;
  const xs = m.map(Number).filter((x) => x <= 100);
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 45;
}

export function compareWorkshopCandidates(
  entities: readonly CollectionEntity[],
  pipelineInput: Omit<CollectionPipelineBuildInput, "entity">,
): { rows: WorkshopComparisonRow[]; recommendedId: string } {
  const rows: WorkshopComparisonRow[] = [];
  for (const e of entities) {
    const bundle = buildCollectionExecutionPipeline({ ...pipelineInput, entity: e });
    const r = bundle.readiness;
    const rp = pipelineInput.orchestration.resourcePressure;
    const fboRisk = Math.round(100 - rp.fboReadiness * 0.65 + (e.kind === "fbo_scale_collection" ? 12 : 0));
    const seoOpportunity = r.seoReadiness;
    const impact = Math.min(100, r.marketplaceReadiness + Math.round((100 - parseRiskLine(e.risk)) * 0.25));
    const difficulty = Math.round(100 - r.executionReadiness + pipelineInput.orchestration.operationalDrag * 0.35);

    const brandFit = Math.min(100, r.brandReadiness + (e.kind === "brand_building_capsule" ? 5 : 0));
    const marketplaceFit = r.marketplaceReadiness;
    const productionFit = r.productionReadiness;
    const timingFit = r.timingReadiness;
    const visualFreshness = r.visualReadiness;

    const score =
      brandFit * 0.12 +
      marketplaceFit * 0.14 +
      productionFit * 0.16 +
      timingFit * 0.1 +
      seoOpportunity * 0.12 +
      (100 - fboRisk) * 0.08 +
      visualFreshness * 0.1 +
      impact * 0.1 -
      difficulty * 0.08 +
      r.collectionLaunchReadiness * 0.1;

    rows.push({
      collectionId: e.id,
      name: e.name,
      brandFit: Math.round(brandFit),
      marketplaceFit: Math.round(marketplaceFit),
      productionFit: Math.round(productionFit),
      timingFit: Math.round(timingFit),
      seoOpportunity: Math.round(seoOpportunity),
      fboRisk: Math.round(Math.min(100, fboRisk)),
      visualFreshness: Math.round(visualFreshness),
      expectedImpactScore: Math.round(impact),
      executionDifficulty: Math.round(difficulty),
      launchReadiness: r.collectionLaunchReadiness,
      score: Math.round(score),
    });
  }
  const best = rows.reduce((a, b) => (b.score > a.score ? b : a), rows[0]!);
  return { rows, recommendedId: best.collectionId };
}
