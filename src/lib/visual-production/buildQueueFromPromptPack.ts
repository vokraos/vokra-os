import type { PromptPackEntity, PromptPackKind } from "../prompt-pack/types";
import { qualityCriteriaForJob } from "./qualityCriteria";
import type { VisualProductionJob, VisualProductionJobType, VisualProductionQueueEnvelope, VisualProductionTargetTool } from "./types";
import {
  EMPTY_VISUAL_DECISION_SCORES,
  EMPTY_VISUAL_REVIEW_NOTES,
  VISUAL_PRODUCTION_QUEUE_SCHEMA,
} from "./types";

function newJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `vpj-${crypto.randomUUID()}`;
  return `vpj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function expectedOutputLine(jobType: VisualProductionJobType): string {
  switch (jobType) {
    case "hero_visual":
      return "Primary marketplace hero still — garment-led, print legible, premium shelf presence.";
    case "support_visual":
      return "Secondary lifestyle or context shot supporting the hero narrative.";
    case "detail_shot":
      return "Macro / close PDP detail — fabric, neckline, print edge, construction.";
    case "size_grid_visual":
      return "Flat or worn size comparison grid — consistent scale and lighting.";
    case "reels_concept":
      return "Short vertical motion brief — hooks, beats, and cut points for external editor.";
    case "campaign_visual":
      return "Paid social / campaign still — headline-safe negative space, brand discipline.";
    case "exhibition_visual":
      return "B2B exhibition or booth visual — premium dark luxury, supplier-grade realism.";
    case "corporate_merch_visual":
      return "Corporate uniform / merch still — subtle branding, production-ready clarity.";
    default:
      return "Controlled commercial visual output.";
  }
}

function mapJobTypeForPack(
  packKind: PromptPackKind,
  lane: "hero" | "support" | "detail" | "reels" | "campaign",
  detailIndex: number,
  detailCount: number,
): VisualProductionJobType {
  if (packKind === "exhibition_capsule") return "exhibition_visual";
  if (packKind === "corporate_merch") return "corporate_merch_visual";
  if (lane === "hero") return "hero_visual";
  if (lane === "support") return "support_visual";
  if (lane === "reels") return "reels_concept";
  if (lane === "campaign") return "campaign_visual";
  if (lane === "detail") {
    if (packKind === "marketplace_launch" && detailCount >= 2 && detailIndex === 1) return "size_grid_visual";
    return "detail_shot";
  }
  return "support_visual";
}

function visualRoleLabel(jobType: VisualProductionJobType): string {
  switch (jobType) {
    case "hero_visual":
      return "Hero";
    case "support_visual":
      return "Support";
    case "detail_shot":
      return "Detail";
    case "size_grid_visual":
      return "Size grid";
    case "reels_concept":
      return "Reels / motion";
    case "campaign_visual":
      return "Campaign";
    case "exhibition_visual":
      return "Exhibition";
    case "corporate_merch_visual":
      return "Corporate merch";
    default:
      return "Visual";
  }
}

function basePriority(lane: "hero" | "support" | "detail" | "reels" | "campaign", index: number): number {
  const tier: Record<typeof lane, number> = {
    hero: 1,
    campaign: 2,
    support: 3,
    detail: 4,
    reels: 5,
  };
  return Math.min(10, tier[lane] + index);
}

const DEFAULT_TOOL: VisualProductionTargetTool = "midjourney";

function negStringFromPack(pack: PromptPackEntity): string {
  return pack.negativeConstraints.join("; ");
}

export function buildQueueFromPromptPack(pack: PromptPackEntity): VisualProductionJob[] {
  const now = Date.now();
  const neg = negStringFromPack(pack);
  const jobs: VisualProductionJob[] = [];

  const pushLane = (
    lane: "hero" | "support" | "detail" | "reels" | "campaign",
    prompts: readonly string[],
    titlePrefix: string,
  ) => {
    prompts.forEach((prompt, i) => {
      const jobType =
        lane === "detail"
          ? mapJobTypeForPack(pack.promptPackKind, lane, i, prompts.length)
          : mapJobTypeForPack(pack.promptPackKind, lane, 0, prompts.length);
      const title = `${pack.collectionName} · ${titlePrefix} ${i + 1}`;
      jobs.push({
        id: newJobId(),
        promptPackId: pack.id,
        collectionId: pack.collectionId,
        jobType,
        title,
        prompt,
        negativeConstraints: neg,
        targetTool: DEFAULT_TOOL,
        marketplaceTarget: pack.marketplaceTarget,
        status: "queued",
        priority: basePriority(lane, i),
        visualRole: visualRoleLabel(jobType),
        expectedOutput: expectedOutputLine(jobType),
        qualityCriteria: qualityCriteriaForJob(jobType, pack.promptPackKind),
        riskFlags: pack.riskFlags,
        createdAt: now,
        updatedAt: now,
        visualReviewNotes: { ...EMPTY_VISUAL_REVIEW_NOTES },
        reviewStatus: "pending",
        decisionScores: { ...EMPTY_VISUAL_DECISION_SCORES },
        approvedUsages: [],
        promptRewriteSuggested: "",
      });
    });
  };

  pushLane("hero", pack.heroPrompts, "Hero");
  pushLane("support", pack.supportPrompts, "Support");
  pushLane("detail", pack.detailPrompts, "Detail");
  pushLane("reels", pack.reelsPrompts, "Reels");
  pushLane("campaign", pack.campaignPrompts, "Campaign");

  jobs.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
  return jobs;
}

export function buildQueueEnvelopeFromPromptPack(pack: PromptPackEntity): VisualProductionQueueEnvelope {
  const jobs = buildQueueFromPromptPack(pack);
  return {
    schema: VISUAL_PRODUCTION_QUEUE_SCHEMA,
    sourcePromptPackId: pack.id,
    sourceCollectionId: pack.collectionId,
    collectionName: pack.collectionName,
    jobs,
    updatedAt: Date.now(),
  };
}
