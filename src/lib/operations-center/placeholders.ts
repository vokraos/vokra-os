import type { ExternalFeedPlaceholder } from "./types";

/** Future WB/Ozon/API — explicit placeholder rows, never implied as connected. */
export function defaultExternalFeeds(): ExternalFeedPlaceholder[] {
  return [
    {
      channel: "wildberries",
      labelKey: "operations.feed.wb",
      status: "placeholder",
      provenance: "estimated",
    },
    {
      channel: "ozon",
      labelKey: "operations.feed.ozon",
      status: "placeholder",
      provenance: "estimated",
    },
  ];
}
