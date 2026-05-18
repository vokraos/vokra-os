import type { MarketplaceConnectionProfile, SyncReadinessLevel } from "./types";

const WB_DOMAINS = [
  "products",
  "skus",
  "stocks",
  "warehouses",
  "ads",
  "reviews",
  "prices",
  "launches",
  "fulfillment",
] as const;

const OZON_DOMAINS = [...WB_DOMAINS, "supply", "seo"] as const;

export function buildConnectionProfiles(
  syncReadiness: SyncReadinessLevel,
  notesWb: string,
  notesOzon: string,
): MarketplaceConnectionProfile[] {
  const now = Date.now();
  const base = {
    connectionState: "architecture_ready" as const,
    syncReadiness,
    createdAt: now,
    updatedAt: now,
  };

  return [
    {
      ...base,
      id: "conn-wb",
      marketplace: "wildberries",
      connectionPurpose: "full_os_sync",
      supportedDomains: [...WB_DOMAINS],
      plannedCapabilities: [
        "iready.cap.products.read",
        "iready.cap.skus.read",
        "iready.cap.stocks.read",
        "iready.cap.launches.read",
      ],
      notes: notesWb,
    },
    {
      ...base,
      id: "conn-ozon",
      marketplace: "ozon",
      connectionPurpose: "full_os_sync",
      supportedDomains: [...OZON_DOMAINS],
      plannedCapabilities: [
        "iready.cap.products.read",
        "iready.cap.skus.read",
        "iready.cap.stocks.read",
        "iready.cap.supply.read",
      ],
      notes: notesOzon,
    },
  ];
}
