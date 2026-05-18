import { useOsReportWarmup } from "../hooks/useOsReportWarmup";
import { useI18n } from "../lib/i18n/I18nContext";
import { formatWarmupFailedHint, formatWarmupStripMessage, warmupStripTone } from "../lib/os-report-warmup";
import { isSafeModeFeatureDisabled } from "../lib/safe-mode";

type Props = {
  className?: string;
};

export function ReportWarmupStrip({ className = "" }: Props) {
  const { t } = useI18n();
  const { state, refresh, isWarming } = useOsReportWarmup();

  if (isSafeModeFeatureDisabled("report_warmup")) return null;

  const tone = warmupStripTone(state);
  const message = formatWarmupStripMessage(state, t);
  const hint = formatWarmupFailedHint(state, t);

  return (
    <div
      className={`report-warmup-strip report-warmup-strip--${tone} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="report-warmup-strip__msg">{message}</span>
      {hint ? <span className="report-warmup-strip__hint">{hint}</span> : null}
      <button
        type="button"
        className="report-warmup-strip__btn"
        disabled={isWarming}
        onClick={() => refresh(true)}
      >
        {isWarming ? t("warmup.action.refreshing") : t("warmup.action.refresh")}
      </button>
    </div>
  );
}
