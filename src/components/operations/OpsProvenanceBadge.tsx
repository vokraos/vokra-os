import type { DataProvenance } from "../../lib/operations-center";

type Props = {
  provenance: DataProvenance;
  label: string;
  /** Extra class names on the badge element */
  className?: string;
};

const VARIANT: Record<DataProvenance, string> = {
  estimated: "ops-prov--est",
  inferred: "ops-prov--inf",
  "memory-derived": "ops-prov--mem",
  manual: "ops-prov--man",
};

export function OpsProvenanceBadge({ provenance, label, className = "" }: Props) {
  return (
    <span className={`ops-prov ${VARIANT[provenance]} ${className}`.trim()} title={label}>
      {label}
    </span>
  );
}
