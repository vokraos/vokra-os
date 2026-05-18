/** Architectural cause-effect chain — labels only; geometry is conceptual, not a chart. */

export const EXECUTION_GEOMETRY_STEPS = [
  { nodeKey: "depth.geom.node.market", edgeKey: "depth.geom.edge.marketReco" },
  { nodeKey: "depth.geom.node.recoField", edgeKey: "depth.geom.edge.recoCorridor" },
  { nodeKey: "depth.geom.node.corridor", edgeKey: "depth.geom.edge.corridorHero" },
  { nodeKey: "depth.geom.node.hero", edgeKey: "depth.geom.edge.heroWave" },
  { nodeKey: "depth.geom.node.wave", edgeKey: "depth.geom.edge.waveProduction" },
  { nodeKey: "depth.geom.node.prod", edgeKey: "depth.geom.edge.productionFulfillment" },
  { nodeKey: "depth.geom.node.fulfill", edgeKey: "depth.geom.edge.fulfillmentRanking" },
  { nodeKey: "depth.geom.node.rank", edgeKey: "depth.geom.edge.rankingMargin" },
  { nodeKey: "depth.geom.node.margin" },
] as const;
