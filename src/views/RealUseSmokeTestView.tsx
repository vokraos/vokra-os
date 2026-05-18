import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import {
  SMOKE_SCENARIO_TYPES,
  addSmokeFriction,
  addSmokeMissingData,
  buildRealUseSmokeTest,
  buildRealUseTestMarkdown,
  buildRealUseTestMemoryPayload,
  buildRealUseTestPlain,
  getSmokeTestStateForMemory,
  markSmokeStepBlocked,
  markSmokeStepDone,
  notifyRealUseTestUpdated,
  resetSmokeStep,
  saveRealUseTestSession,
  selectSmokeScenario,
  setSmokeVerdict,
  toggleSmokeStepConfusing,
  toggleSmokeStepUseful,
  REAL_USE_TEST_EVENT,
  type SmokeScenarioType,
  type SmokeTestStepId,
  type SmokeTestVerdict,
} from "../lib/real-use-smoke-test";

type Props = { onNavigate: (id: NavId) => void };

export function RealUseSmokeTestView({ onNavigate }: Props) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [frictionInput, setFrictionInput] = useState("");
  const [missingInput, setMissingInput] = useState("");

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(REAL_USE_TEST_EVENT, bump);
    return () => window.removeEventListener(REAL_USE_TEST_EVENT, bump);
  }, []);

  const test = useMemo(() => buildRealUseSmokeTest(t, locale), [tick, t, locale]);
  const current = test.steps.find((s) => s.id === test.currentStep) ?? test.steps[0];

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  const onSelectScenario = useCallback(
    (scenario: SmokeScenarioType) => {
      selectSmokeScenario(scenario, t, locale);
      refresh();
      showToast(t("rtest.toast.scenario"));
    },
    [locale, refresh, showToast, t],
  );

  const onDone = useCallback(
    (stepId: SmokeTestStepId) => {
      markSmokeStepDone(stepId, t, locale);
      refresh();
    },
    [locale, refresh, t],
  );

  const onBlocked = useCallback(
    (stepId: SmokeTestStepId) => {
      markSmokeStepBlocked(stepId, t, locale);
      refresh();
    },
    [locale, refresh, t],
  );

  const onReset = useCallback(
    (stepId: SmokeTestStepId) => {
      resetSmokeStep(stepId, t, locale);
      refresh();
    },
    [locale, refresh, t],
  );

  const saveMemory = useCallback(() => {
    const state = getSmokeTestStateForMemory();
    if (!state) return;
    const payload = buildRealUseTestMemoryPayload(test, state);
    saveRealUseTestSession(payload);
    recordGeneration({
      module: "real_use_test",
      title: t("rtest.memory.title", { scenario: t(`rtest.scenario.${test.scenarioType}`) }),
      content: JSON.stringify(payload),
      mime: "application/json",
      previewText: t(`rtest.verdict.${test.finalVerdict}`),
    });
    notifyRealUseTestUpdated();
    showToast(t("rtest.toast.saved"));
  }, [showToast, t, test]);

  const total = test.steps.length;
  const done = test.completedSteps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const verdicts: SmokeTestVerdict[] = ["works", "partial", "confusing", "blocked"];

  return (
    <div className="rtest-page">
      <header className="glass-panel rtest-head">
        <p className="rtest-eyebrow">{t("rtest.eyebrow")}</p>
        <h1>{t("nav.realUseTest")}</h1>
        <p className="rtest-lede">{t("rtest.lede")}</p>
        <div className="rtest-progress" aria-label={t("rtest.progressAria")}>
          <div className="rtest-progress__bar" style={{ width: `${pct}%` }} />
          <span className="rtest-progress__txt">
            {t("rtest.progress", { done: String(done), total: String(total) })}
          </span>
        </div>
        <p className="rtest-conf">{t(test.confidenceNote)}</p>
        <div className="rtest-head__actions">
          <button type="button" className="primary-btn" onClick={saveMemory}>
            {t("rtest.action.save")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void copyToClipboard(buildRealUseTestPlain(test, t))}
          >
            {t("rtest.action.copy")}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadText(`real-use-test-${test.id}.md`, buildRealUseTestMarkdown(test, t))}
          >
            {t("rtest.action.exportMd")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadJson(`real-use-test-${test.id}.json`, test)}>
            {t("rtest.action.exportJson")}
          </button>
        </div>
      </header>

      {toast ? <p className="rtest-toast">{toast}</p> : null}

      <section className="glass-panel rtest-sec">
        <h2>{t("rtest.section.scenario")}</h2>
        <div className="rtest-scenarios">
          {SMOKE_SCENARIO_TYPES.map((sc) => (
            <button
              key={sc}
              type="button"
              className={`rtest-scenario${test.scenarioType === sc ? " rtest-scenario--active" : ""}`}
              onClick={() => onSelectScenario(sc)}
            >
              <span className="rtest-scenario__title">{t(`rtest.scenario.${sc}`)}</span>
              <span className="rtest-scenario__desc">{t(`rtest.scenario.desc.${sc}`)}</span>
            </button>
          ))}
        </div>
      </section>

      {current ? (
        <section className="glass-panel rtest-sec rtest-sec--current">
          <h2>{t("rtest.section.current")}</h2>
          <p className="rtest-step-title">{t(current.titleKey)}</p>
          <p className="rtest-step-why">{t(current.whyKey)}</p>
          <div className="rtest-step-actions">
            <button type="button" className="primary-btn" onClick={() => onNavigate(current.navId)}>
              {t("rtest.action.openModule")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onDone(current.id)}>
              {t("rtest.action.done")}
            </button>
            <button type="button" className="ghost-btn rtest-btn--warn" onClick={() => onBlocked(current.id)}>
              {t("rtest.action.blocked")}
            </button>
            <button
              type="button"
              className={`ghost-btn${test.usefulScreens.includes(current.id) ? " rtest-btn--on" : ""}`}
              onClick={() => {
                toggleSmokeStepUseful(current.id, t, locale);
                refresh();
              }}
            >
              {t("rtest.action.useful")}
            </button>
            <button
              type="button"
              className={`ghost-btn${test.confusingScreens.includes(current.id) ? " rtest-btn--on" : ""}`}
              onClick={() => {
                toggleSmokeStepConfusing(current.id, t, locale);
                refresh();
              }}
            >
              {t("rtest.action.confusing")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="glass-panel rtest-sec">
        <h2>{t("rtest.section.steps")}</h2>
        <ul className="rtest-steps">
          {test.steps.map((step) => (
            <li key={step.id} className={`rtest-steps__item rtest-steps__item--${step.status}`}>
              <span className="rtest-steps__title">{t(step.titleKey)}</span>
              <span className="rtest-steps__status">{t(`rtest.status.${step.status}`)}</span>
              <div className="rtest-steps__btns">
                <button type="button" className="ghost-btn rtest-steps__btn" onClick={() => onNavigate(step.navId)}>
                  {t("rtest.action.open")}
                </button>
                {step.status === "pending" ? (
                  <>
                    <button type="button" className="ghost-btn rtest-steps__btn" onClick={() => onDone(step.id)}>
                      {t("rtest.action.done")}
                    </button>
                    <button type="button" className="ghost-btn rtest-steps__btn" onClick={() => onBlocked(step.id)}>
                      {t("rtest.action.blocked")}
                    </button>
                  </>
                ) : (
                  <button type="button" className="ghost-btn rtest-steps__btn" onClick={() => onReset(step.id)}>
                    {t("rtest.action.reset")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel rtest-sec">
        <h2>{t("rtest.section.feedback")}</h2>
        <label className="rtest-label">{t("rtest.field.friction")}</label>
        <div className="rtest-input-row">
          <input
            className="rtest-input"
            value={frictionInput}
            onChange={(e) => setFrictionInput(e.target.value)}
            placeholder={t("rtest.placeholder.friction")}
          />
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              addSmokeFriction(frictionInput, t, locale);
              setFrictionInput("");
              refresh();
            }}
          >
            {t("rtest.action.add")}
          </button>
        </div>
        {test.observedFriction.length ? (
          <ul className="rtest-notes">
            {test.observedFriction.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        <label className="rtest-label">{t("rtest.field.missing")}</label>
        <div className="rtest-input-row">
          <input
            className="rtest-input"
            value={missingInput}
            onChange={(e) => setMissingInput(e.target.value)}
            placeholder={t("rtest.placeholder.missing")}
          />
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              addSmokeMissingData(missingInput, t, locale);
              setMissingInput("");
              refresh();
            }}
          >
            {t("rtest.action.add")}
          </button>
        </div>
        {test.missingData.length ? (
          <ul className="rtest-notes">
            {test.missingData.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="glass-panel rtest-sec">
        <h2>{t("rtest.section.verdict")}</h2>
        <div className="rtest-verdicts">
          {verdicts.map((v) => (
            <button
              key={v}
              type="button"
              className={`rtest-verdict${test.finalVerdict === v ? " rtest-verdict--active" : ""}`}
              onClick={() => {
                setSmokeVerdict(v, t, locale);
                refresh();
              }}
            >
              {t(`rtest.verdict.${v}`)}
            </button>
          ))}
        </div>
      </section>

      {test.isComplete && test.simplification ? (
        <section className="glass-panel rtest-sec rtest-sec--outcome">
          <h2>{t("rtest.section.outcome")}</h2>
          <OutcomeBlock title={t("rtest.section.used")} items={test.simplification.screensUsed} />
          <OutcomeBlock title={t("rtest.section.ignored")} items={test.simplification.screensIgnored} />
          <OutcomeBlock title={t("rtest.section.confusingAreas")} items={test.simplification.confusingAreas} />
          <OutcomeBlock title={t("rtest.section.missing")} items={test.simplification.missingData} />
          <OutcomeBlock title={t("rtest.section.simplify")} items={test.recommendedSimplifications} />
          <OutcomeBlock title={t("rtest.section.fixes")} items={test.simplification.recommendedNextBuildFixes} />
        </section>
      ) : null}

      <style>{`
        .rtest-page { max-width: 820px; margin: 0 auto; padding: 8px 0 32px; display: grid; gap: 12px; }
        .rtest-head { padding: 20px; }
        .rtest-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin: 0 0 6px; }
        .rtest-lede { margin: 8px 0; opacity: 0.85; font-size: 14px; }
        .rtest-progress { position: relative; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; margin: 12px 0; }
        .rtest-progress__bar { height: 100%; background: linear-gradient(90deg, #6fd89a, #9ec8ff); border-radius: 4px; transition: width 0.2s; }
        .rtest-progress__txt { display: block; font-size: 12px; margin-top: 6px; opacity: 0.7; }
        .rtest-conf { font-size: 12px; opacity: 0.65; margin: 8px 0 0; }
        .rtest-head__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .rtest-sec { padding: 16px 18px; }
        .rtest-sec h2 { margin: 0 0 12px; font-size: 14px; }
        .rtest-scenarios { display: grid; gap: 8px; }
        .rtest-scenario { text-align: left; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--stroke); background: rgba(0,0,0,0.2); cursor: pointer; }
        .rtest-scenario--active { border-color: rgba(140, 100, 220, 0.5); background: rgba(140, 100, 220, 0.12); }
        .rtest-scenario__title { display: block; font-weight: 600; font-size: 13px; }
        .rtest-scenario__desc { display: block; font-size: 12px; opacity: 0.7; margin-top: 4px; }
        .rtest-sec--current { border-color: rgba(120, 180, 255, 0.3); }
        .rtest-step-title { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
        .rtest-step-why { font-size: 13px; opacity: 0.8; margin: 0 0 12px; }
        .rtest-step-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .rtest-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .rtest-steps__item { display: grid; gap: 6px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--stroke); }
        .rtest-steps__item--done { border-color: rgba(80, 200, 120, 0.35); }
        .rtest-steps__item--blocked { border-color: rgba(255, 90, 90, 0.35); }
        .rtest-steps__title { font-size: 13px; font-weight: 600; }
        .rtest-steps__status { font-size: 11px; opacity: 0.65; text-transform: uppercase; }
        .rtest-steps__btns { display: flex; flex-wrap: wrap; gap: 6px; }
        .rtest-steps__btn { font-size: 11px; padding: 4px 8px; }
        .rtest-label { display: block; font-size: 12px; margin: 12px 0 6px; opacity: 0.75; }
        .rtest-input-row { display: flex; gap: 8px; }
        .rtest-input { flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--stroke); background: rgba(0,0,0,0.25); color: inherit; font-size: 13px; }
        .rtest-notes { margin: 8px 0 0; padding-left: 18px; font-size: 13px; }
        .rtest-verdicts { display: flex; flex-wrap: wrap; gap: 8px; }
        .rtest-verdict { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--stroke); background: transparent; color: inherit; cursor: pointer; font-size: 12px; }
        .rtest-verdict--active { border-color: rgba(140, 100, 220, 0.6); background: rgba(140, 100, 220, 0.15); }
        .rtest-sec--outcome { border-color: rgba(80, 200, 120, 0.25); }
        .rtest-outcome { margin-bottom: 14px; }
        .rtest-outcome h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; margin: 0 0 6px; }
        .rtest-outcome ul { margin: 0; padding-left: 18px; font-size: 13px; }
        .rtest-btn--warn { color: #ff8a8a; }
        .rtest-btn--on { border-color: rgba(140, 100, 220, 0.6); }
        .rtest-toast { text-align: center; font-size: 13px; opacity: 0.85; }
      `}</style>
    </div>
  );
}

function OutcomeBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rtest-outcome">
      <h3>{title}</h3>
      <ul>
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
