import type { ComposedPromptBundle } from "./types";

export function promptBundleToMarkdown(bundle: ComposedPromptBundle, title: string): string {
  const { layers, negatives, outputs, refreshNotes, input } = bundle;
  return [
    `# ${title}`,
    ``,
    `## Meta`,
    `- corridor: ${input.corridorId}`,
    `- type: ${input.promptType}`,
    `- target: ${input.marketplaceTarget}`,
    input.collectionName ? `- collection: ${input.collectionName}` : "",
    ``,
    `## Layers`,
    ...Object.entries(layers).map(([k, v]) => `### ${k}\n${v}`),
    ``,
    `## Negatives`,
    ...negatives.map((n) => `- no ${n}`),
    ``,
    `## Outputs`,
    `### short`,
    outputs.short,
    ``,
    `### marketplace_optimized`,
    outputs.marketplaceOptimized,
    ``,
    `### full_cinematic`,
    outputs.fullCinematic,
    ``,
    `### editorial`,
    outputs.editorial,
    ``,
    `### reels_direction`,
    outputs.reelsDirection,
    ``,
    `## Refresh`,
    ...refreshNotes.map((r) => `- ${r}`),
    ``,
  ]
    .filter((x) => x !== "")
    .join("\n");
}

export function promptBundleToJson(bundle: ComposedPromptBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function promptBundleCopyBlock(bundle: ComposedPromptBundle, variant: keyof ComposedPromptBundle["outputs"]): string {
  return bundle.outputs[variant];
}
