import type { MarketplaceLaunchPlan } from "../types";
import type { MarketplaceLaunchReview } from "./types";

function sec(title: string, body: string): string {
  if (!body.trim()) return "";
  return `## ${title}\n\n${body.trim()}\n\n`;
}

export function launchReviewToMarkdown(
  review: MarketplaceLaunchReview,
  plan: MarketplaceLaunchPlan | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const lines: string[] = [
    `# ${t("lrev.export.title", { name: review.collectionName })}`,
    "",
    `**${t("lrev.export.marketplace")}:** ${review.marketplace}`,
    `**${t("lrev.export.launchDate")}:** ${review.launchDate}`,
    `**${t("lrev.export.reviewed")}:** ${new Date(review.reviewedAt).toLocaleString()}`,
    `**${t("lrev.export.outcome")}:** ${t(`lrev.state.${review.outcomeState}`)}`,
    "",
  ];

  if (plan) {
    lines.push(`**${t("lrev.export.planReadiness")}:** ${t(`lops.readiness.${plan.launchReadiness}`)} (${plan.launchReadinessScore}%)`, "");
  }

  lines.push(
    sec(t("lrev.field.launched"), review.launchedItems),
    sec(t("lrev.field.held"), review.heldItems),
    sec(t("lrev.field.blocked"), review.blockedItems),
    sec(t("lrev.field.observation"), review.earlyMarketObservation),
    sec(t("lrev.field.production"), review.productionIssues),
    sec(t("lrev.field.content"), review.contentIssues),
    sec(t("lrev.field.fulfillment"), review.fulfillmentIssues),
    sec(t("lrev.field.competitor"), review.competitorObservation),
    sec(t("lrev.field.suspected"), review.suspectedOutcome),
    sec(t("lrev.field.nextDecision"), review.nextDecision),
    sec(t("lrev.field.followUp"), review.followUpActions),
    sec(t("lrev.field.learning"), review.learningNotes),
  );

  if (review.learningReinforcement.length) {
    lines.push(`## ${t("lrev.export.reinforcement")}`, "");
    for (const r of review.learningReinforcement) lines.push(`- ${r}`);
    lines.push("");
  }

  lines.push(`---\n*${t("lrev.export.footer")}*`);
  return lines.filter(Boolean).join("\n");
}

export function launchReviewToPlainText(
  review: MarketplaceLaunchReview,
  plan: MarketplaceLaunchPlan | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  return launchReviewToMarkdown(review, plan, t).replace(/^#+\s/gm, "").replace(/\*\*/g, "");
}
