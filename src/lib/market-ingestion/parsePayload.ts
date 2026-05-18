import { MARKET_INGESTION_MEMORY_SCHEMA, type MarketIngestionMemoryPayload } from "./types";

export function parseMarketIngestionMemoryPayload(raw: unknown): MarketIngestionMemoryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== MARKET_INGESTION_MEMORY_SCHEMA) return null;
  if (typeof o.derivedAt !== "number") return null;
  if (!o.channelReadiness || typeof o.channelReadiness !== "object") return null;
  return o as MarketIngestionMemoryPayload;
}
