import type { VisualProductionJobStatus, VisualReviewStatus } from "./types";

/** When review status is set, optionally align pipeline status for section routing. */
export function pipelinePatchForReviewStatus(
  reviewStatus: VisualReviewStatus,
): Partial<{ status: VisualProductionJobStatus }> | null {
  switch (reviewStatus) {
    case "approved_marketplace":
    case "approved_campaign":
      return { status: "approved" };
    case "rejected_brand_fit":
    case "rejected_marketplace_clarity":
      return { status: "rejected" };
    case "needs_prompt_rewrite":
      return { status: "needs_revision" };
    case "shortlisted":
      return { status: "selected" };
    case "generated":
      return { status: "generated_externally" };
    default:
      return null;
  }
}
