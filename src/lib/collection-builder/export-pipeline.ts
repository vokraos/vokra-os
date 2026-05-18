import type { CollectionPipelineBundle } from "./pipeline-types";

function bullets(title: string, items: readonly string[]): string {
  if (!items.length) return "";
  return `${title}\n${items.map((x) => `- ${x}`).join("\n")}\n\n`;
}

function stageStatusLabel(status: string): string {
  return status;
}

export function collectionPipelineBundleToMarkdown(bundle: CollectionPipelineBundle, t?: (k: string) => string): string {
  const title = (key: string) => (t ? t(key) : key);
  const e = bundle.executionRoute;
  const r = bundle.readiness;
  const vw = bundle.visualWorkflow;
  const sw = bundle.seoWorkflow;
  const pw = bundle.productionWorkflow;

  const stageLines = bundle.stages.map(
    (s) =>
      `### ${s.index + 1}. ${title(s.messageKey)}\n- **status:** ${stageStatusLabel(s.status)} · **owner:** ${s.owner}\n- **dependency:** ${s.dependency}\n- **risk:** ${s.risk}\n- **output:** ${s.output}\n`,
  );

  const cmdLines = bundle.collectionCommands.map(
    (c) =>
      `- **${c.titleRu}** (${c.typeLabelRu}) · pri ${c.priority} · ${c.statusLabelRu}\n  - ${c.firstStepRu}\n  - ${c.expectedOutcomeRu}\n  - risk if ignored: ${c.riskIfIgnoredRu}\n`,
  );

  const orchTop = bundle.orchestratorCommandLayer.commands.slice(0, 6).map((c) => `- ${c.titleRu} · ${c.statusLabelRu}`);

  const stops = bundle.structuredStops.filter((x) => x.active).map((x) => `- **ACTIVE:** ${x.label}`);
  const stopsPassive = bundle.structuredStops.filter((x) => !x.active).map((x) => `- (watch) ${x.label}`);

  return [
    `## Launch readiness`,
    `**Collection Launch Readiness:** ${r.collectionLaunchReadiness}%`,
    `- brand: ${r.brandReadiness}% · visual: ${r.visualReadiness}% · seo: ${r.seoReadiness}%`,
    `- production: ${r.productionReadiness}% · marketplace: ${r.marketplaceReadiness}%`,
    `- timing: ${r.timingReadiness}% · execution: ${r.executionReadiness}%`,
    ``,
    `## Execution route (collection-linked)`,
    `- **collectionId:** ${e.collectionId}`,
    `- **routeId:** ${e.routeId}`,
    `- **readiness:** ${e.readiness}%`,
    `- **current stage:** ${e.currentStageIndex + 1} · ${title(e.currentStageKey)}`,
    `- **next action:** ${e.nextAction}`,
    bullets("Blockers", e.blockers),
    bullets("Involved systems", e.involvedSystems),
    `- **production pressure:** ${e.productionPressure}`,
    `- **launch risk:** ${e.launchRisk}`,
    `- **expected impact:** ${e.expectedImpact}`,
    bullets("Stop conditions (from collection)", e.stopConditions),
    ``,
    `## Stage pipeline`,
    ...stageLines,
    ``,
    `## Action commands (collection-scoped)`,
    ...cmdLines,
    ``,
    `## Orchestrator command layer (live snapshot, top)`,
    ...orchTop.map((x) => `${x}\n`),
    ``,
    `## Stop conditions (structured)`,
    stops.length ? stops.join("\n") + "\n\n" : "_No active hard stops._\n\n",
    stopsPassive.length ? `Watch:\n${stopsPassive.join("\n")}\n\n` : "",
    `## Visual workflow`,
    `- **hero photo brief:** ${vw.heroPhotoBrief}`,
    `- **supporting photo direction:** ${vw.supportingPhotoDirection}`,
    `- **model style:** ${vw.modelStyle}`,
    `- **background style:** ${vw.backgroundStyle}`,
    `- **main card logic:** ${vw.marketplaceMainCardLogic}`,
    `- **reels concept:** ${vw.reelsConcept}`,
    `- **visual refresh rule:** ${vw.visualRefreshRule}`,
    ``,
    `## SEO workflow`,
    `- **WB title logic:** ${sw.wbTitleLogic}`,
    `- **Ozon title logic:** ${sw.ozonTitleLogic}`,
    bullets("Primary keywords", sw.primaryKeywords),
    bullets("Secondary keywords", sw.secondaryKeywords),
    `- **rich content angle:** ${sw.richContentAngle}`,
    bullets("Forbidden semantic drift", sw.forbiddenSemanticDrift),
    ``,
    `## Production workflow`,
    `- **DTF suitability:** ${pw.dtfSuitability}`,
    `- **print complexity:** ${pw.printComplexity}`,
    `- **blank availability risk:** ${pw.blankAvailabilityRisk}`,
    `- **packaging impact:** ${pw.packagingImpact}`,
    `- **FBO prep impact:** ${pw.fboPrepImpact}`,
    `- **bottleneck warning:** ${pw.productionBottleneckWarning}`,
    ``,
  ].join("\n");
}

export function collectionPipelineBundleToJson(bundle: CollectionPipelineBundle): string {
  return JSON.stringify(bundle, null, 2);
}
