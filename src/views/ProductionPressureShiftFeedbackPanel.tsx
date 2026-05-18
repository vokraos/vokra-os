import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { recordGeneration } from "../lib/memory";
import {
  appendProductionShiftFeedback,
  buildProductionPressureMemoryPayload,
  buildProductionPressureReport,
  buildProductionShiftFeedbackMarkdown,
  buildProductionShiftFeedbackMemoryPayload,
  buildProductionShiftFeedbackPlain,
  buildShiftFeedbackDraft,
  CAPACITY_MISMATCH_TYPES,
  clearProductionShiftFeedbackOperatorNote,
  composeProductionShiftFeedback,
  getProductionShiftLearning,
  inferMismatchFromOverload,
  suggestAdjustmentKeys,
  OVERLOAD_AREA_OPTIONS,
  productionDailyPlanToDisplay,
  type CapacityMismatchType,
  type ProductionPressureReport,
  type ShiftFeedbackDraft,
} from "../lib/production-pressure";

type Props = {
  report: ProductionPressureReport;
  onToast?: (msg: string) => void;
  onSaved?: () => void;
};

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinLines(items: string[]): string {
  return items.join("\n");
}

export function ProductionPressureShiftFeedbackPanel({ report, onToast, onSaved }: Props) {
  const { t, locale } = useI18n();
  const planDisplay = useMemo(() => productionDailyPlanToDisplay(report.dailyPlan, t), [report.dailyPlan, t]);
  const learning = report.shiftLearning ?? getProductionShiftLearning();

  const [draft, setDraft] = useState<ShiftFeedbackDraft>(() => buildShiftFeedbackDraft(report));
  const [completedText, setCompletedText] = useState("");
  const [delayedText, setDelayedText] = useState("");
  const [bottleneckText, setBottleneckText] = useState("");

  useEffect(() => {
    const d = buildShiftFeedbackDraft(report);
    setDraft(d);
    setCompletedText("");
    setDelayedText(joinLines(d.delayedItems.map((k) => t(k))));
    setBottleneckText(joinLines(d.bottlenecksFound.map((k) => t(k, report.dailyPlan.todayFocusVars))));
  }, [locale, report, t]);

  const toggleOverload = useCallback((area: string) => {
    setDraft((d) => {
      const has = d.overloadAreas.includes(area);
      const overloadAreas = has ? d.overloadAreas.filter((x) => x !== area) : [...d.overloadAreas, area];
      const capacityMismatch = inferMismatchFromOverload(overloadAreas);
      const { adjustmentKey, nextShiftKey } = suggestAdjustmentKeys(capacityMismatch);
      return {
        ...d,
        overloadAreas,
        capacityMismatch,
        recommendedCapacityAdjustment: adjustmentKey,
        nextShiftRecommendation: nextShiftKey,
      };
    });
  }, []);

  const toggleCompleted = useCallback((key: string) => {
    setDraft((d) => {
      const has = d.completedFocus.includes(key);
      return {
        ...d,
        completedFocus: has ? d.completedFocus.filter((x) => x !== key) : [...d.completedFocus, key],
      };
    });
  }, []);

  const saveFeedback = useCallback(() => {
    const merged: ShiftFeedbackDraft = {
      ...draft,
      completedFocus: [
        ...draft.completedFocus,
        ...splitLines(completedText).filter((x) => !draft.completedFocus.includes(x)),
      ],
      delayedItems: splitLines(delayedText),
      bottlenecksFound: splitLines(bottleneckText),
    };
    const feedback = composeProductionShiftFeedback(report, merged, locale);
    appendProductionShiftFeedback(feedback);
    clearProductionShiftFeedbackOperatorNote();

    const pressurePayload = buildProductionPressureMemoryPayload(buildProductionPressureReport(t));
    const mem = buildProductionShiftFeedbackMemoryPayload(feedback, {
      dailyPlanId: report.dailyPlan.id,
      embeddedPressureJson: JSON.stringify(pressurePayload),
    });
    recordGeneration({
      module: "production_shift_feedback",
      title: t("prod.feedback.memory.title"),
      content: JSON.stringify(mem),
      mime: "application/json",
      previewText: t(`prod.feedback.mismatch.${feedback.capacityMismatch}`),
    });

    onSaved?.();
    onToast?.(t("prod.feedback.toast.saved"));
  }, [bottleneckText, completedText, delayedText, draft, locale, onSaved, onToast, report, t]);

  const exportMd = useCallback(() => {
    const fb = composeProductionShiftFeedback(
      report,
      {
        ...draft,
        completedFocus: [...draft.completedFocus, ...splitLines(completedText)],
        delayedItems: splitLines(delayedText),
        bottlenecksFound: splitLines(bottleneckText),
      },
      locale,
    );
    downloadText(`production-shift-feedback-${fb.id}.md`, buildProductionShiftFeedbackMarkdown(fb, t));
    onToast?.(t("prod.feedback.toast.exported"));
  }, [bottleneckText, completedText, delayedText, draft, locale, onToast, report, t]);

  const copyFeedback = useCallback(() => {
    const fb = composeProductionShiftFeedback(
      report,
      {
        ...draft,
        completedFocus: [...draft.completedFocus, ...splitLines(completedText)],
        delayedItems: splitLines(delayedText),
        bottlenecksFound: splitLines(bottleneckText),
      },
      locale,
    );
    void copyToClipboard(buildProductionShiftFeedbackPlain(fb, t));
    onToast?.(t("prod.feedback.toast.copied"));
  }, [bottleneckText, completedText, delayedText, draft, locale, onToast, report, t]);

  const planDoFirst = planDisplay.doFirst;

  return (
    <section className="glass-panel ppr-sec ppr-sec--feedback">
      <div className="ppr-fb-head">
        <h2>{t("prod.section.shiftFeedback")}</h2>
        <div className="ppr-fb-actions">
          <button type="button" className="primary-btn" onClick={saveFeedback}>
            {t("prod.feedback.action.save")}
          </button>
          <button type="button" className="ghost-btn" onClick={copyFeedback}>
            {t("prod.feedback.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("prod.feedback.action.exportMd")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              const fb = composeProductionShiftFeedback(
                report,
                {
                  ...draft,
                  completedFocus: [...draft.completedFocus, ...splitLines(completedText)],
                  delayedItems: splitLines(delayedText),
                  bottlenecksFound: splitLines(bottleneckText),
                },
                locale,
              );
              downloadJson(`production-shift-feedback-${fb.id}.json`, fb);
              onToast?.(t("prod.feedback.toast.exported"));
            }}
          >
            {t("prod.feedback.action.exportJson")}
          </button>
        </div>
      </div>

      <p className="ppr-fb-hint">{t("prod.feedback.hint")}</p>

      {learning.digestLineKey ? (
        <p className="ppr-fb-learn">{t(learning.digestLineKey, learning.digestLineVars)}</p>
      ) : null}

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.completed")}</span>
        <div className="ppr-fb-chips">
          {planDoFirst.map((label) => (
            <button
              key={label}
              type="button"
              className={`ppr-fb-chip${draft.completedFocus.includes(label) ? " ppr-fb-chip--on" : ""}`}
              onClick={() => toggleCompleted(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          className="ppr-fb-text"
          rows={2}
          placeholder={t("prod.feedback.placeholder.completed")}
          value={completedText}
          onChange={(e) => setCompletedText(e.target.value)}
        />
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.delayed")}</span>
        <textarea
          className="ppr-fb-text"
          rows={3}
          value={delayedText}
          onChange={(e) => setDelayedText(e.target.value)}
        />
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.bottlenecks")}</span>
        <textarea
          className="ppr-fb-text"
          rows={2}
          value={bottleneckText}
          onChange={(e) => setBottleneckText(e.target.value)}
        />
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.overload")}</span>
        <div className="ppr-fb-chips">
          {OVERLOAD_AREA_OPTIONS.map((area) => (
            <button
              key={area}
              type="button"
              className={`ppr-fb-chip${draft.overloadAreas.includes(area) ? " ppr-fb-chip--on" : ""}`}
              onClick={() => toggleOverload(area)}
            >
              {t(`prod.feedback.overload.${area}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="ppr-fb-row">
        <label className="ppr-fb-field ppr-fb-field--grow">
          <span className="ppr-fb-label">{t("prod.feedback.field.mismatch")}</span>
          <select
            className="ppr-fb-select"
            value={draft.capacityMismatch}
            onChange={(e) => {
              const capacityMismatch = e.target.value as CapacityMismatchType;
              const { adjustmentKey, nextShiftKey } = suggestAdjustmentKeys(capacityMismatch);
              setDraft((d) => ({
                ...d,
                capacityMismatch,
                recommendedCapacityAdjustment: adjustmentKey,
                nextShiftRecommendation: nextShiftKey,
              }));
            }}
          >
            {CAPACITY_MISMATCH_TYPES.map((m) => (
              <option key={m} value={m}>
                {t(`prod.feedback.mismatch.${m}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.capacityAdj")}</span>
        <input
          className="ppr-fb-input"
          value={draft.recommendedCapacityAdjustment.startsWith("prod.") ? t(draft.recommendedCapacityAdjustment) : draft.recommendedCapacityAdjustment}
          onChange={(e) => setDraft((d) => ({ ...d, recommendedCapacityAdjustment: e.target.value }))}
        />
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.nextShift")}</span>
        <input
          className="ppr-fb-input"
          value={draft.nextShiftRecommendation.startsWith("prod.") ? t(draft.nextShiftRecommendation) : draft.nextShiftRecommendation}
          onChange={(e) => setDraft((d) => ({ ...d, nextShiftRecommendation: e.target.value }))}
        />
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.operator")}</span>
        <textarea
          className="ppr-fb-text"
          rows={2}
          value={draft.operatorNotes}
          onChange={(e) => setDraft((d) => ({ ...d, operatorNotes: e.target.value }))}
        />
      </div>

      <div className="ppr-fb-field">
        <span className="ppr-fb-label">{t("prod.feedback.field.founder")}</span>
        <textarea
          className="ppr-fb-text"
          rows={2}
          value={draft.founderNotes}
          onChange={(e) => setDraft((d) => ({ ...d, founderNotes: e.target.value }))}
        />
      </div>

      <style>{`
        .ppr-sec--feedback { margin-top: 0; }
        .ppr-fb-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .ppr-fb-head h2 { margin: 0; }
        .ppr-fb-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .ppr-fb-hint { font-size: 12px; opacity: 0.7; margin: 0 0 10px; }
        .ppr-fb-learn { font-size: 12px; color: #e8c46a; margin: 0 0 12px; }
        .ppr-fb-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .ppr-fb-label { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.04em; }
        .ppr-fb-text, .ppr-fb-input, .ppr-fb-select {
          font-size: 13px; padding: 8px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: inherit;
        }
        .ppr-fb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .ppr-fb-chip {
          font-size: 11px; padding: 4px 10px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12); background: transparent; color: inherit; cursor: pointer;
        }
        .ppr-fb-chip--on { border-color: rgba(120, 180, 255, 0.5); background: rgba(80, 140, 220, 0.15); }
        .ppr-fb-row { display: flex; gap: 10px; }
        .ppr-fb-field--grow { flex: 1; }
      `}</style>
    </section>
  );
}
