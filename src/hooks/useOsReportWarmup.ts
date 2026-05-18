import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  peekOsReportWarmupState,
  scheduleOsReportWarmup,
  subscribeOsReportWarmup,
  warmupOsReports,
  type OsReportWarmupState,
  type WarmupReason,
} from "../lib/os-report-warmup";
import { isSafeModeFeatureDisabled } from "../lib/safe-mode";

export function useOsReportWarmup(autoReason?: WarmupReason): {
  state: OsReportWarmupState | null;
  refresh: (force?: boolean) => void;
  isWarming: boolean;
} {
  const { t, locale } = useI18n();
  const [state, setState] = useState<OsReportWarmupState | null>(() => peekOsReportWarmupState());

  useEffect(() => subscribeOsReportWarmup(() => setState(peekOsReportWarmupState())), []);

  useEffect(() => {
    if (!autoReason) return;
    if (isSafeModeFeatureDisabled("report_warmup")) return;
    scheduleOsReportWarmup({ reason: autoReason, locale, t });
  }, [autoReason, locale, t]);

  const refresh = useCallback(
    (force = true) => {
      if (isSafeModeFeatureDisabled("report_warmup")) return;
      warmupOsReports({ force, reason: "manual", locale, t });
    },
    [locale, t],
  );

  return {
    state,
    refresh,
    isWarming: state?.status === "warming",
  };
}
