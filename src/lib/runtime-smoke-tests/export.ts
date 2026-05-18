import type { RuntimeSmokeTestReport } from "./types";

export function stringifySmokeReport(report: RuntimeSmokeTestReport): string {
  return JSON.stringify(report, null, 2);
}

/** Plain text for clipboard / quick share. */
export function formatSmokeReportPlain(report: RuntimeSmokeTestReport, t: (k: string, v?: Record<string, string>) => string): string {
  const lines: string[] = [
    `VOKRA Runtime Smoke Test`,
    `id: ${report.id}`,
    `createdAt: ${new Date(report.createdAt).toISOString()}`,
    `status: ${report.status}`,
    `durationMs: ${report.durationMs}`,
    t(report.confidenceNoteKey),
    ``,
    `--- checks ---`,
  ];
  for (const c of report.checks) {
    lines.push(`[${c.status}] ${c.id} (${c.durationMs}ms)${c.detail ? ` — ${c.detail}` : ""}`);
  }
  return lines.join("\n");
}
