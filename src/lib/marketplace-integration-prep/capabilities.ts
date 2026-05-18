import type { ApiCapabilityEntry, DataDomainId, MarketplaceId } from "./types";

const BASE_DOMAINS: DataDomainId[] = [
  "products",
  "skus",
  "stocks",
  "launches",
  "reviews",
  "ads",
  "supply",
  "fulfillment",
];

function capsFor(marketplace: MarketplaceId): ApiCapabilityEntry[] {
  return BASE_DOMAINS.flatMap((domain) => [
    {
      id: `${marketplace}-${domain}-read`,
      marketplace,
      domain,
      capabilityKey: `iready.cap.${domain}.read`,
      phase: "architecture" as const,
    },
    {
      id: `${marketplace}-${domain}-write`,
      marketplace,
      domain,
      capabilityKey: `iready.cap.${domain}.write`,
      phase: domain === "stocks" || domain === "prices" ? ("blocked" as const) : ("architecture" as const),
    },
  ]);
}

export const API_CAPABILITY_MAP: readonly ApiCapabilityEntry[] = [
  ...capsFor("wildberries"),
  ...capsFor("ozon"),
];
