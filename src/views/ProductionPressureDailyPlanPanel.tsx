import { useCallback } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { recordGeneration } from "../lib/memory";
import {
  buildProductionDailyPlanMarkdown,
  buildProductionDailyPlanPlain,
  buildProductionDailyPlanMemoryPayload,
  buildProductionPressureMemoryPayload,
  buildProductionPressureReport,
  productionDailyPlanToDisplay,
  type ProductionDailyPlan,
} from "../lib/production-pressure";

type Props = {
  plan: ProductionDailyPlan;
  onToast?: (msg: string) => void;
};

export function ProductionPressureDailyPlanPanel({ plan, onToast }: Props) {
  const { t } = useI18n();
  const display = productionDailyPlanToDisplay(plan, t);

  const copyPlan = useCallback(() => {
    void copyToClipboard(buildProductionDailyPlanPlain(plan, t));
    onToast?.(t("prod.plan.toast.copied"));
  }, [onToast, plan, t]);

  const exportMd = useCallback(() => {
    downloadText(`production-daily-plan-${plan.id}.md`, buildProductionDailyPlanMarkdown(plan, t));
    onToast?.(t("prod.plan.toast.exported"));
  }, [onToast, plan, t]);

  const exportJson = useCallback(() => {
    downloadJson(`production-daily-plan-${plan.id}.json`, plan);
    onToast?.(t("prod.plan.toast.exported"));
  }, [onToast, plan]);

  const savePlanMemory = useCallback(() => {
    const report = buildProductionPressureReport(t);
    const embedded = JSON.stringify(buildProductionPressureMemoryPayload(report));
    const payload = buildProductionDailyPlanMemoryPayload(plan, embedded);
    recordGeneration({
      module: "production_daily_plan",
      title: t("prod.plan.memory.title"),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: display.todayFocus,
    });
    onToast?.(t("prod.plan.toast.saved"));
  }, [display.todayFocus, onToast, plan, t]);

  return (
    <section className="glass-panel ppr-sec ppr-sec--plan">
      <div className="ppr-plan-head">
        <h2>{t("prod.section.dailyPlan")}</h2>
        <div className="ppr-plan-actions">
          <button type="button" className="ghost-btn" onClick={copyPlan}>
            {t("prod.plan.action.copy")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportMd}>
            {t("prod.plan.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={exportJson}>
            {t("prod.plan.action.exportJson")}
          </button>
          <button type="button" className="ghost-btn" onClick={savePlanMemory}>
            {t("prod.plan.action.saveMemory")}
          </button>
        </div>
      </div>

      <p className="ppr-plan-hint">{t("prod.plan.hint")}</p>
      <p className="ppr-plan-focus">{display.todayFocus}</p>
      <p className="ppr-plan-meta">
        {t("prod.plan.meta", {
          active: display.activeScenario,
          required: display.requiredScenario,
          state: t(`prod.state.${plan.productionState}`),
        })}
      </p>
      <p className="ppr-plan-conf">{display.confidenceNote}</p>

      <div className="ppr-plan-grid">
        <div>
          <h3>{t("prod.plan.section.doFirst")}</h3>
          <ul className="ppr-plan-list ppr-plan-list--do">
            {display.doFirst.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t("prod.plan.section.delay")}</h3>
          <ul className="ppr-plan-list">
            {display.delay.length ? (
              display.delay.map((s) => <li key={s}>{s}</li>)
            ) : (
              <li>{t("prod.plan.empty.delay")}</li>
            )}
          </ul>
        </div>
        <div>
          <h3>{t("prod.plan.section.avoid")}</h3>
          <ul className="ppr-plan-list ppr-plan-list--avoid">
            {display.avoid.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {display.capacityNotes.length > 0 ? (
        <div className="ppr-plan-block">
          <h3>{t("prod.plan.section.capacity")}</h3>
          <ul className="ppr-plan-list">
            {display.capacityNotes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ppr-plan-block">
        <h3>{t("prod.plan.section.bottleneck")}</h3>
        <ul className="ppr-plan-list ppr-plan-list--watch">
          {display.bottleneckWatch.length ? (
            display.bottleneckWatch.map((s) => <li key={s}>{s}</li>)
          ) : (
            <li>{t("prod.plan.empty.bottleneck")}</li>
          )}
        </ul>
      </div>

      <div className="ppr-plan-block">
        <h3>{t("prod.plan.section.reportBack")}</h3>
        <ul className="ppr-plan-list">
          {display.reportBackQuestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <style>{`
        .ppr-sec--plan { margin-top: 0; }
        .ppr-plan-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
        .ppr-plan-head h2 { margin: 0; }
        .ppr-plan-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .ppr-plan-hint { font-size: 12px; opacity: 0.7; margin: 0 0 10px; }
        .ppr-plan-focus { font-size: 15px; font-weight: 600; margin: 0 0 8px; }
        .ppr-plan-meta { font-size: 12px; opacity: 0.75; margin: 0 0 4px; }
        .ppr-plan-conf { font-size: 11px; opacity: 0.6; margin: 0 0 14px; }
        .ppr-plan-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        .ppr-plan-grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.75; margin: 0 0 8px; }
        .ppr-plan-list { margin: 0; padding-left: 18px; font-size: 12px; }
        .ppr-plan-list--do li { color: #9fd4b0; }
        .ppr-plan-list--avoid li { color: #f0a0a0; }
        .ppr-plan-list--watch li { color: #e8c46a; }
        .ppr-plan-block { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .ppr-plan-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.75; margin: 0 0 8px; }
      `}</style>
    </section>
  );
}
