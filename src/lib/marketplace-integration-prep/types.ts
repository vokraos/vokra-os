import type { NavId } from "../../types";

export const INTEGRATION_READINESS_MEMORY_SCHEMA = "vokra.integrationReadiness.v1" as const;
export const INTEGRATION_READINESS_EVENT = "vokra:integration-readiness-updated" as const;

export const MARKETPLACES = ["wildberries", "ozon"] as const;
export type MarketplaceId = (typeof MARKETPLACES)[number];

export const CONNECTION_STATES = [
  "planned",
  "architecture_ready",
  "awaiting_credentials",
  "connected_readonly",
  "disabled",
] as const;
export type ConnectionState = (typeof CONNECTION_STATES)[number];

export const CONNECTION_PURPOSES = [
  "analytics_only",
  "launch_ops",
  "inventory",
  "ads",
  "full_os_sync",
] as const;
export type ConnectionPurpose = (typeof CONNECTION_PURPOSES)[number];

export const DATA_DOMAINS = [
  "products",
  "skus",
  "orders",
  "stocks",
  "warehouses",
  "ads",
  "reviews",
  "seo",
  "prices",
  "launches",
  "supply",
  "fulfillment",
] as const;
export type DataDomainId = (typeof DATA_DOMAINS)[number];

export const SYNC_DIRECTIONS = ["os_to_marketplace", "marketplace_to_os", "bidirectional", "manual_only"] as const;
export type SyncDirection = (typeof SYNC_DIRECTIONS)[number];

export const SYNC_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type SyncRiskLevel = (typeof SYNC_RISK_LEVELS)[number];

export const SYNC_READINESS_LEVELS = [
  "not_ready",
  "risky",
  "stable_for_partial_sync",
  "ready_for_api_phase",
] as const;
export type SyncReadinessLevel = (typeof SYNC_READINESS_LEVELS)[number];

export type MarketplaceConnectionProfile = {
  id: string;
  marketplace: MarketplaceId;
  connectionState: ConnectionState;
  connectionPurpose: ConnectionPurpose;
  supportedDomains: DataDomainId[];
  plannedCapabilities: string[];
  syncReadiness: SyncReadinessLevel;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type MarketplaceDataDomain = {
  id: DataDomainId;
  sourceOfTruth: "os_manual" | "marketplace_api" | "shared" | "undecided";
  syncDirection: SyncDirection;
  syncRisk: SyncRiskLevel;
  operationalImportance: "critical" | "high" | "medium" | "low";
  overwriteRulesKey: string;
  navHint?: NavId;
};

export type ImportSourceEntry = {
  id: string;
  marketplace: MarketplaceId | "internal";
  importTypeKey: string;
  targetModuleKey: string;
  status: "active_manual" | "planned_api";
};

export type ApiCapabilityEntry = {
  id: string;
  marketplace: MarketplaceId;
  domain: DataDomainId;
  capabilityKey: string;
  phase: "blocked" | "architecture" | "credentials" | "future_live";
};

export type SyncConflictRule = {
  id: string;
  domain: DataDomainId;
  conflictKey: string;
  resolutionKey: string;
  risk: SyncRiskLevel;
};

export type ReadinessCheck = {
  id: string;
  labelKey: string;
  passed: boolean;
  detailKey: string;
  navId?: NavId;
};

export type RoadmapPhase = {
  order: number;
  domain: DataDomainId;
  titleKey: string;
  whyKey: string;
  blocked: boolean;
};

export type IntegrationReadinessReport = {
  id: string;
  createdAt: number;
  dateLabel: string;
  connections: MarketplaceConnectionProfile[];
  domains: MarketplaceDataDomain[];
  importSources: ImportSourceEntry[];
  capabilities: ApiCapabilityEntry[];
  conflictRules: SyncConflictRule[];
  readinessLevel: SyncReadinessLevel;
  readinessChecks: ReadinessCheck[];
  readinessBlockers: string[];
  syncRisks: string[];
  operationalRisks: string[];
  roadmap: RoadmapPhase[];
  confidenceNote: string;
};

export type IntegrationReadinessMemoryPayload = {
  schema: typeof INTEGRATION_READINESS_MEMORY_SCHEMA;
  savedAt: number;
  report: IntegrationReadinessReport;
};
