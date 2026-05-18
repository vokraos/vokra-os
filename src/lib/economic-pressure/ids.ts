export function newEconomicPressureReportId(): string {
  return `econ_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
