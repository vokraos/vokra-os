import { useMemo, useRef, useState } from "react";
import { getStoredLocale, translate } from "../i18n/localeStorage";
import { getOpenAISettings } from "../settings";
import { streamOpenAIText } from "./openai";

export type StreamState = {
  text: string;
  loading: boolean;
  error: string | null;
};

export function useAiStream(
  args: { system: string; user: string } | null,
  options?: { onComplete?: (text: string) => void },
) {
  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<StreamState>({ text: "", loading: false, error: null });

  const canRun = useMemo(() => {
    const s = getOpenAISettings();
    return Boolean(s.apiKey && s.model);
  }, []);

  async function run() {
    if (!args) return;
    const s = getOpenAISettings();
    if (!s.apiKey) {
      const loc = getStoredLocale();
      setState({ text: "", loading: false, error: translate(loc, "errors.noApiKey") });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({ text: "", loading: true, error: null });
    try {
      let acc = "";
      for await (const delta of streamOpenAIText({
        apiKey: s.apiKey,
        model: s.model,
        system: args.system,
        user: args.user,
        signal: controller.signal,
      })) {
        acc += delta;
        setState((prev) => ({ ...prev, text: acc }));
      }
      setState((prev) => ({ ...prev, loading: false }));
      onCompleteRef.current?.(acc);
    } catch (e: any) {
      const loc = getStoredLocale();
      const msg = typeof e?.message === "string" ? e.message : translate(loc, "errors.generationFailed");
      setState({ text: "", loading: false, error: msg });
    }
  }

  function stop() {
    controllerRef.current?.abort();
    setState((prev) => ({ ...prev, loading: false }));
  }

  return { ...state, run, stop, canRun };
}

