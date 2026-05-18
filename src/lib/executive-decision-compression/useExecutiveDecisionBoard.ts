import { useMemo } from "react";
import { useCognitiveOs } from "../cognitive-os";
import { useExecutionOrchestrator } from "../execution-orchestrator";
import { useI18n } from "../i18n/I18nContext";
import { buildExecutiveDecisionBoard } from "./buildExecutiveDecisionBoard";
import type { ExecutiveDecisionBoard } from "./types";

export function useExecutiveDecisionBoard(): ExecutiveDecisionBoard {
  const { locale } = useI18n();
  const { synthesis, decision, initiatives } = useCognitiveOs();
  const orchestration = useExecutionOrchestrator();

  return useMemo(
    () =>
      buildExecutiveDecisionBoard({
        locale: locale === "en" ? "en" : "ru",
        synthesis,
        decision,
        orchestration,
        initiatives,
      }),
    [decision, initiatives, locale, orchestration, synthesis],
  );
}
