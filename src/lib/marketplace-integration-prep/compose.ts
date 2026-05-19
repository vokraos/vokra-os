import type { AppLocale } from "../i18n/messages";
import { API_CAPABILITY_MAP } from "./capabilities";
import { buildConnectionProfiles } from "./connections";
import { SYNC_CONFLICT_RULES } from "./conflicts";
import { MARKETPLACE_DATA_DOMAINS } from "./domains";
import { IMPORT_SOURCE_REGISTRY } from "./importRegistry";
import { deriveSyncReadinessLevel, runIntegrationReadinessChecks } from "./readinessChecks";
import { buildIntegrationRoadmap } from "./roadmap";
import { patchWbConnectionProfile, isWbApiConnected } from "./wbConnection";
import type { IntegrationReadinessReport, SyncRiskLevel } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function newReportId(): string {
  return `iready-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateLabel(locale: AppLocale): string {
  return new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function collectRisks(
  t: TFn,
  checks: ReturnType<typeof runIntegrationReadinessChecks>,
  level: ReturnType<typeof deriveSyncReadinessLevel>,
): { syncRisks: string[]; operationalRisks: string[]; blockers: string[] } {
  const blockers = checks.filter((c) => !c.passed).map((c) => t(c.detailKey));
  const syncRisks: string[] = [];
  if (!isWbApiConnected()) {
    syncRisks.push(t("iready.risk.noLiveApi"));
  }
  const operationalRisks: string[] = [];

  for (const d of MARKETPLACE_DATA_DOMAINS) {
    if (d.syncRisk === "critical" || d.syncRisk === "high") {
      syncRisks.push(t("iready.risk.domain", { domain: t(`iready.domain.${d.id}`), risk: t(`iready.syncRisk.${d.syncRisk}`) }));
    }
  }

  if (level === "not_ready" || level === "risky") {
    operationalRisks.push(t("iready.opRisk.manualFirst"));
  }
  if (!checks.find((c) => c.id === "snapshot_discipline")?.passed) {
    operationalRisks.push(t("iready.opRisk.snapshot"));
  }
  if (!checks.find((c) => c.id === "launch_workflows")?.passed) {
    operationalRisks.push(t("iready.opRisk.launch"));
  }

  return {
    syncRisks: [...new Set(syncRisks)].slice(0, 10),
    operationalRisks: [...new Set(operationalRisks)].slice(0, 8),
    blockers,
  };
}

function confidenceKey(level: ReturnType<typeof deriveSyncReadinessLevel>): string {
  if (level === "ready_for_api_phase") return "iready.confidence.ready";
  if (level === "stable_for_partial_sync") return "iready.confidence.partial";
  if (level === "risky") return "iready.confidence.risky";
  return "iready.confidence.notReady";
}

export function buildIntegrationReadinessReport(t: TFn, locale: AppLocale = "en"): IntegrationReadinessReport {
  const checks = runIntegrationReadinessChecks(t);
  const readinessLevel = deriveSyncReadinessLevel(checks);
  const { syncRisks, operationalRisks, blockers } = collectRisks(t, checks, readinessLevel);
  const roadmap = buildIntegrationRoadmap(checks, readinessLevel);

  const connections = buildConnectionProfiles(
    readinessLevel,
    t("iready.notes.wb"),
    t("iready.notes.ozon"),
  ).map((c) => patchWbConnectionProfile(c, t));

  return {
    id: newReportId(),
    createdAt: Date.now(),
    dateLabel: dateLabel(locale),
    connections,
    domains: [...MARKETPLACE_DATA_DOMAINS],
    importSources: [...IMPORT_SOURCE_REGISTRY],
    capabilities: [...API_CAPABILITY_MAP],
    conflictRules: [...SYNC_CONFLICT_RULES],
    readinessLevel,
    readinessChecks: checks,
    readinessBlockers: blockers,
    syncRisks,
    operationalRisks,
    roadmap,
    confidenceNote: confidenceKey(readinessLevel),
  };
}

export function formatDomainRisk(risk: SyncRiskLevel, t: TFn): string {
  return t(`iready.syncRisk.${risk}`);
}
