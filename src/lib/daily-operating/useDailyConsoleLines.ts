import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "../i18n/messages";
import {
  buildDailyConsoleCacheKey,
  EMPTY_DEFERRED_LINES,
  getCachedDeferredConsoleLines,
  getCachedImmediateConsoleLines,
  mergeConsoleLineTiers,
  peekCachedDeferredConsoleLines,
  type DailyConsoleBuildInput,
  type DailyConsoleDeferredLines,
  type DailyConsoleImmediateLines,
  type DailyConsoleTickState,
} from "./consoleContext";
import { scheduleIdleWork } from "./scheduleIdleWork";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function useDailyConsoleLines(
  ticks: DailyConsoleTickState,
  t: TFn,
  locale: AppLocale,
  safeEnabled: boolean,
  safeDisabledKey: string,
): {
  immediate: DailyConsoleImmediateLines;
  deferred: DailyConsoleDeferredLines;
  merged: ReturnType<typeof mergeConsoleLineTiers>;
  deferredReady: boolean;
} {
  const buildInput = useMemo(
    (): DailyConsoleBuildInput => ({ t, locale, safeEnabled, safeDisabledKey }),
    [t, locale, safeEnabled, safeDisabledKey],
  );

  const cacheKey = useMemo(
    () => buildDailyConsoleCacheKey(ticks, locale, safeEnabled, safeDisabledKey),
    [ticks, locale, safeEnabled, safeDisabledKey],
  );

  const immediate = useMemo(
    () => getCachedImmediateConsoleLines(cacheKey, buildInput),
    [cacheKey, buildInput],
  );

  const [deferred, setDeferred] = useState<DailyConsoleDeferredLines>(() => {
    return peekCachedDeferredConsoleLines(cacheKey) ?? EMPTY_DEFERRED_LINES;
  });

  const [deferredReady, setDeferredReady] = useState(() => peekCachedDeferredConsoleLines(cacheKey) != null);

  useEffect(() => {
    const cached = peekCachedDeferredConsoleLines(cacheKey);
    if (cached) {
      setDeferred(cached);
      setDeferredReady(true);
      return;
    }

    setDeferredReady(false);
    setDeferred(EMPTY_DEFERRED_LINES);

    let cancelled = false;
    const cancelIdle = scheduleIdleWork(() => {
      if (cancelled) return;
      const lines = getCachedDeferredConsoleLines(cacheKey, buildInput);
      setDeferred(lines);
      setDeferredReady(true);
    });

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [cacheKey, buildInput]);

  const merged = useMemo(() => mergeConsoleLineTiers(immediate, deferred), [immediate, deferred]);

  return { immediate, deferred, merged, deferredReady };
}
