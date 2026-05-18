import { useCallback, useMemo, useState } from "react";
import { getOpenAISettings } from "../lib/settings";
import { orchestrateStrategicCommand } from "../lib/command-center/orchestrator";
import type {
  StrategicCommandInput,
  StrategicCommandResult,
  StrategicMarketplace,
  StrategicMode,
  StrategicPriceSegment,
} from "../lib/command-center/types";
import { strategicCommandToMarkdown } from "../lib/command-center/toMarkdown";
import { buildCommandCenterMemoryBundle } from "../lib/command-center/memoryBundle";
import { copyToClipboard, downloadJson, downloadText } from "../lib/markdown";
import { recordGeneration, getActiveProjectId } from "../lib/memory";
import { getStoredLocale, translate } from "../lib/i18n/localeStorage";
import { useI18n } from "../lib/i18n/I18nContext";
import { CommandCenterAtmosphere } from "../components/command/CommandCenterAtmosphere";
import { CommandResultPanels } from "../components/command/CommandResultPanels";
import { readFileAsImageData, validateImageFile } from "../lib/visual/imageUtils";

const MAX_IMAGES = 6;

function newShotId() {
  return `scc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

type StagedShot = { id: string; fileName: string; dataUrl: string };

export function StrategicCommandCenterView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("");
  const [marketplace, setMarketplace] = useState<StrategicMarketplace>("wildberries");
  const [mode, setMode] = useState<StrategicMode>("premium");
  const [priceSegment, setPriceSegment] = useState<StrategicPriceSegment>("premium");
  const [includeMemory, setIncludeMemory] = useState(true);
  const [shots, setShots] = useState<StagedShot[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StrategicCommandResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const memoryHint = useMemo(() => {
    if (!includeMemory) return t("command.memoryToggle");
    const { projectTitle } = buildCommandCenterMemoryBundle(getActiveProjectId(), locale);
    return projectTitle
      ? `${t("command.memoryToggle")} · ${projectTitle}`
      : `${t("command.memoryToggle")} · —`;
  }, [includeMemory, locale, t]);

  const canRun = useMemo(() => query.trim().length > 0 && goal.trim().length > 0, [query, goal]);

  const addShots = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setError(null);
    for (const file of list) {
      const v = validateImageFile(file);
      if (v) {
        setError(v);
        continue;
      }
      const r = await readFileAsImageData(file);
      if (!r.ok) {
        setError(r.error);
        continue;
      }
      setShots((prev) => {
        if (prev.length >= MAX_IMAGES) return prev;
        return [...prev, { id: newShotId(), fileName: file.name, dataUrl: r.dataUrl }];
      });
    }
  }, []);

  const removeShot = (id: string) => setShots((prev) => prev.filter((x) => x.id !== id));

  async function runFull() {
    setError(null);
    setToast(null);
    const s = getOpenAISettings();
    const loc = getStoredLocale();
    if (!s.apiKey) {
      setError(translate(loc, "errors.noApiKey"));
      return;
    }
    if (!canRun) {
      setError(t("command.needMission"));
      return;
    }

    const input: StrategicCommandInput = {
      query: query.trim(),
      goal: goal.trim(),
      marketplace,
      mode,
      priceSegment,
      locale,
      includeProjectMemory: includeMemory,
      projectId: getActiveProjectId(),
    };

    setRunning(true);
    try {
      const parsed = await orchestrateStrategicCommand({
        apiKey: s.apiKey,
        model: s.model,
        input,
        screenshotDataUrls: shots.map((x) => x.dataUrl),
      });
      setResult(parsed);

      recordGeneration({
        module: "strategic_command",
        title: `${t("nav.command")} · ${query.trim().slice(0, 36)}`,
        content: JSON.stringify(parsed),
        mime: "application/json",
        previewText: (parsed.executiveVerdict.verdict || t("command.pageTitle")).slice(0, 400),
        tags: [marketplace, mode, priceSegment, ...query.split(/\s+/).filter(Boolean).slice(0, 5)],
        meta: {
          query: query.trim(),
          goal: goal.trim(),
          marketplace,
          mode,
          priceSegment,
          schemaVersion: parsed.schemaVersion,
          includeProjectMemory: includeMemory,
          screenshotCount: shots.length,
          dominationScore: parsed.executiveVerdict.dominationScore,
          projectId: getActiveProjectId(),
        },
      });

      setToast(t("memory.autoSaved"));
      window.setTimeout(() => setToast(null), 2600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : translate(loc, "errors.analysisFailed"));
    } finally {
      setRunning(false);
    }
  }

  async function onCopyJson() {
    if (!result) return;
    await copyToClipboard(JSON.stringify(result, null, 2));
    setToast(t("common.copied"));
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="view scc scc--cinema">
      <div className="scc__ambient" aria-hidden />
      <header className="view__header scc__head scc__head--lux">
        <p className="eyebrow scc__eyebrow">{t("command.eyebrow")}</p>
        <h2 className="view__title scc__title">{t("command.pageTitle")}</h2>
        <p className="view__desc scc__sub">{t("command.subtitle")}</p>
      </header>

      {toast && <p className="scc__toast">{toast}</p>}
      {error && (
        <div className="glass-panel scc__err" role="alert">
          {error}
        </div>
      )}

      <div className="scc__grid">
        <div className="glass-panel scc__form scc__form--lux">
          <header className="scc__mission-deck">
            <span className="scc__mission-deck__sig" aria-hidden />
            <div className="scc__mission-deck__text">
              <p className="scc__mission-deck__kicker">{t("command.missionDeckKicker")}</p>
              <p className="scc__mission-deck__title">{t("command.missionDeckTitle")}</p>
            </div>
          </header>

          <section className="scc__mission-block">
            <div className="scc__mission-block__rail" aria-hidden />
            <div className="scc__mission-block__main">
              <header className="scc__mission-block__head">
                <span className="scc__mission-idx">01</span>
                <h3 className="scc__mission-h">{t("command.missionObjectives")}</h3>
              </header>
              <label className="field-label">{t("command.queryLabel")}</label>
              <textarea
                className="input scc__field"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("command.queryPh")}
              />

              <label className="field-label">{t("command.goalLabel")}</label>
              <textarea
                className="input scc__field"
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t("command.goalPh")}
              />
            </div>
          </section>

          <section className="scc__mission-block scc__mission-block--intel">
            <div className="scc__mission-block__rail" aria-hidden />
            <div className="scc__mission-block__main">
              <header className="scc__mission-block__head">
                <span className="scc__mission-idx">02</span>
                <h3 className="scc__mission-h">{t("command.missionIntel")}</h3>
              </header>
              <label className="scc__check">
                <input type="checkbox" checked={includeMemory} onChange={(e) => setIncludeMemory(e.target.checked)} />
                <span>{memoryHint}</span>
              </label>

              <p className="scc__seg-label">{t("command.shotsLabel")}</p>
              <p className="scc__shots-hint">{t("command.shotsHelp")}</p>
              <label className="scc__file">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="scc__file-input"
                  onChange={(e) => void addShots(e.target.files)}
                />
                <span className="ghost-btn">{t("competitors.addImage")}</span>
              </label>
              {shots.length > 0 && (
                <ul className="scc__shots">
                  {shots.map((s) => (
                    <li key={s.id} className="scc__shot">
                      <img src={s.dataUrl} alt="" className="scc__shot-thumb" />
                      <span className="scc__shot-name">{s.fileName}</span>
                      <button type="button" className="ghost-btn scc__shot-x" onClick={() => removeShot(s.id)}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="scc__mission-block scc__mission-block--ops">
            <div className="scc__mission-block__rail" aria-hidden />
            <div className="scc__mission-block__main">
              <header className="scc__mission-block__head">
                <span className="scc__mission-idx">03</span>
                <h3 className="scc__mission-h">{t("command.missionOpsTitle")}</h3>
              </header>
              <p className="scc__mission-ops-caption">{t("command.missionOpsCaption")}</p>

              <div className="scc__op-row">
                <span className="scc__op-label">{t("command.missionLayerMp")}</span>
                <div className="seg scc__seg--mission">
                  <button
                    type="button"
                    className={`seg__btn ${marketplace === "wildberries" ? "seg__btn--on" : ""}`}
                    aria-pressed={marketplace === "wildberries"}
                    onClick={() => setMarketplace("wildberries")}
                  >
                    WB
                  </button>
                  <button
                    type="button"
                    className={`seg__btn ${marketplace === "ozon" ? "seg__btn--on" : ""}`}
                    aria-pressed={marketplace === "ozon"}
                    onClick={() => setMarketplace("ozon")}
                  >
                    Ozon
                  </button>
                  <button
                    type="button"
                    className={`seg__btn ${marketplace === "both" ? "seg__btn--on" : ""}`}
                    aria-pressed={marketplace === "both"}
                    onClick={() => setMarketplace("both")}
                  >
                    {t("command.both")}
                  </button>
                </div>
              </div>

              <div className="scc__op-row">
                <span className="scc__op-label">{t("command.missionLayerMode")}</span>
                <div className="seg scc__seg--mission">
                  <button
                    type="button"
                    className={`seg__btn ${mode === "aggressive" ? "seg__btn--on" : ""}`}
                    aria-pressed={mode === "aggressive"}
                    onClick={() => setMode("aggressive")}
                  >
                    {t("command.modeAggressive")}
                  </button>
                  <button
                    type="button"
                    className={`seg__btn ${mode === "premium" ? "seg__btn--on" : ""}`}
                    aria-pressed={mode === "premium"}
                    onClick={() => setMode("premium")}
                  >
                    {t("command.modePremium")}
                  </button>
                  <button
                    type="button"
                    className={`seg__btn ${mode === "scalable" ? "seg__btn--on" : ""}`}
                    aria-pressed={mode === "scalable"}
                    onClick={() => setMode("scalable")}
                  >
                    {t("command.modeScalable")}
                  </button>
                </div>
              </div>

              <div className="scc__op-row">
                <span className="scc__op-label">{t("command.missionLayerPrice")}</span>
                <div className="seg scc__seg--mission">
                  <button
                    type="button"
                    className={`seg__btn ${priceSegment === "low" ? "seg__btn--on" : ""}`}
                    aria-pressed={priceSegment === "low"}
                    onClick={() => setPriceSegment("low")}
                  >
                    {t("command.priceLow")}
                  </button>
                  <button
                    type="button"
                    className={`seg__btn ${priceSegment === "middle" ? "seg__btn--on" : ""}`}
                    aria-pressed={priceSegment === "middle"}
                    onClick={() => setPriceSegment("middle")}
                  >
                    {t("command.priceMid")}
                  </button>
                  <button
                    type="button"
                    className={`seg__btn ${priceSegment === "premium" ? "seg__btn--on" : ""}`}
                    aria-pressed={priceSegment === "premium"}
                    onClick={() => setPriceSegment("premium")}
                  >
                    {t("command.pricePrem")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="scc__launch-stand">
            <button
              type="button"
              className={`scc__launch ${canRun && !running ? "scc__launch--armed" : ""} ${running ? "scc__launch--busy" : ""}`}
              disabled={running || !canRun}
              aria-busy={running || undefined}
              onClick={() => void runFull()}
            >
              <span className="scc__launch-bezel" aria-hidden />
              <span className="scc__launch-rail" aria-hidden />
              <span className="scc__launch-sheen" aria-hidden />
              <span className="scc__launch-body">
                <span className="scc__launch-pass" aria-hidden />
                <span className="scc__launch-spec" aria-hidden />
                {running ? (
                  <>
                    <span className="scc__launch-orb" aria-hidden />
                    <span className="scc__launch-primary scc__launch-primary--solo">{t("command.running")}</span>
                  </>
                ) : (
                  <span className="scc__launch-stack">
                    <span className="scc__launch-primary">{t("command.run")}</span>
                    <span className="scc__launch-secondary">{t("command.launchSub")}</span>
                  </span>
                )}
              </span>
            </button>
          </div>

          <p className="scc__hint">{t("command.hint")}</p>

          <div className="scc__actions">
            {result && (
              <>
                <button type="button" className="ghost-btn" onClick={() => void onCopyJson()}>
                  {t("command.copyJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => downloadJson("vokra-strategic-command-center", result)}>
                  {t("command.exportJson")}
                </button>
                <button type="button" className="ghost-btn" onClick={() => downloadText("vokra-strategic-command-center.md", strategicCommandToMarkdown(result))}>
                  {t("command.exportMd")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="scc__out">
          {!result && !running && <CommandCenterAtmosphere phase="idle" t={t} />}
          {running && (
            <div className="glass-panel scc__loading scc__loading--cinema shimmer">
              <CommandCenterAtmosphere phase="running" t={t} />
            </div>
          )}
          {result && <CommandResultPanels r={result} t={t} />}
        </div>
      </div>

      <style>{`
        .scc--cinema {
          position: relative;
          overflow: hidden;
        }
        .scc__ambient {
          pointer-events: none;
          position: absolute;
          inset: -45% -25% auto;
          height: 75%;
          background:
            radial-gradient(55% 50% at 20% 0%, rgba(123, 143, 255, 0.1), transparent 60%),
            radial-gradient(45% 40% at 85% 15%, rgba(255, 255, 255, 0.05), transparent 55%),
            radial-gradient(50% 60% at 50% 0%, rgba(123, 143, 255, 0.08), transparent 70%);
          opacity: 0.85;
        }
        .scc__head {
          position: relative;
          margin-bottom: 22px;
        }
        .scc__head--lux .scc__eyebrow {
          letter-spacing: 0.12em;
          text-transform: none;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(244, 243, 239, 0.45);
          margin-bottom: 10px;
        }
        .scc__head--lux .scc__title {
          font-size: clamp(1.65rem, 3.2vw, 2.25rem);
          letter-spacing: -0.03em;
          line-height: 1.12;
          margin-bottom: 12px;
        }
        .scc__head--lux .scc__sub {
          max-width: 52ch;
          font-size: 0.95rem;
          line-height: 1.55;
          color: rgba(244, 243, 239, 0.48);
        }
        .scc__toast {
          position: relative;
          color: var(--accent);
          font-size: 0.85rem;
          margin-bottom: 12px;
        }
        .scc__err {
          position: relative;
          padding: 14px 18px;
          margin-bottom: 16px;
          color: rgba(255, 180, 180, 0.95);
          border-color: rgba(255, 100, 100, 0.35);
        }
        .scc__grid {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 0.38fr) minmax(0, 1fr);
          gap: 32px 36px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .scc__grid {
            grid-template-columns: 1fr;
          }
        }
        .scc__form {
          padding: 28px 26px 26px;
          position: sticky;
          top: 18px;
        }
        .scc__form--lux {
          background:
            linear-gradient(168deg, rgba(255, 255, 255, 0.06) 0%, transparent 40%),
            linear-gradient(0deg, rgba(8, 9, 14, 0.92), rgba(14, 15, 22, 0.55));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.08),
            inset 0 -24px 56px rgba(0, 0, 0, 0.32),
            0 28px 56px rgba(0, 0, 0, 0.38),
            0 0 0 1px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
        }
        .scc__mission-deck {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 4px 0 22px;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .scc__mission-deck__sig {
          width: 10px;
          height: 10px;
          margin-top: 5px;
          border-radius: 50%;
          background: rgba(130, 150, 230, 0.9);
          box-shadow: 0 0 0 3px rgba(120, 140, 220, 0.12), 0 0 20px rgba(120, 140, 220, 0.28);
          flex-shrink: 0;
        }
        .scc__mission-deck__kicker {
          margin: 0 0 4px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.38);
        }
        .scc__mission-deck__title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: rgba(244, 243, 239, 0.88);
        }
        .scc__mission-block {
          position: relative;
          display: flex;
          gap: 0;
          margin-top: 20px;
          padding-top: 4px;
        }
        .scc__mission-block__rail {
          width: 3px;
          flex-shrink: 0;
          margin-right: 16px;
          border-radius: 99px;
          background: linear-gradient(180deg, rgba(130, 150, 230, 0.55), rgba(130, 150, 230, 0.08), transparent);
          opacity: 0.85;
        }
        .scc__mission-block__main {
          flex: 1;
          min-width: 0;
        }
        .scc__mission-block__head {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 14px;
        }
        .scc__mission-idx {
          font-family: var(--font-display);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(130, 150, 230, 0.55);
        }
        .scc__mission-h {
          margin: 0;
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.72);
        }
        .scc__mission-block--intel .scc__check {
          margin: 4px 0 14px;
        }
        .scc__mission-ops-caption {
          margin: -6px 0 16px;
          font-size: 0.76rem;
          line-height: 1.45;
          color: rgba(244, 243, 239, 0.32);
        }
        .scc__op-row {
          margin-bottom: 16px;
        }
        .scc__op-row:last-child {
          margin-bottom: 0;
        }
        .scc__op-label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.36);
        }
        .scc .scc__seg--mission {
          width: 100%;
        }
        .scc .scc__seg--mission .seg__btn {
          flex: 1;
          min-width: 0;
          justify-content: center;
          padding-top: 11px;
          padding-bottom: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
        }
        .scc .field-label {
          font-size: 0.8rem;
          letter-spacing: 0.02em;
          text-transform: none;
          font-weight: 500;
          color: rgba(244, 243, 239, 0.42);
          margin-bottom: 10px;
        }
        .scc .seg__btn {
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          text-transform: none;
        }
        @media (max-width: 1024px) {
          .scc__form {
            position: static;
          }
        }
        .scc__field {
          min-height: 72px;
          resize: vertical;
          font-size: 0.95rem;
          line-height: 1.55;
          margin-bottom: 16px;
          border-radius: 16px;
          border-color: rgba(255, 255, 255, 0.09);
          background: rgba(0, 0, 0, 0.32);
        }
        .scc__check {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.8rem;
          color: rgba(244, 243, 239, 0.45);
          margin: 12px 0 8px;
          cursor: pointer;
          line-height: 1.45;
        }
        .scc__check input {
          margin-top: 3px;
        }
        .scc__shots-hint {
          margin: 0 0 10px;
          font-size: 0.76rem;
          color: rgba(244, 243, 239, 0.32);
          line-height: 1.45;
        }
        .scc__file {
          display: inline-block;
          margin-bottom: 10px;
        }
        .scc__file-input {
          display: none;
        }
        .scc__shots {
          list-style: none;
          margin: 0 0 12px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .scc__shot {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.35);
        }
        .scc__shot-thumb {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 8px;
        }
        .scc__shot-name {
          flex: 1;
          min-width: 0;
          font-size: 0.78rem;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .scc__shot-x {
          padding: 4px 10px;
        }
        .scc__seg-label {
          margin: 22px 0 10px;
          font-size: 0.76rem;
          letter-spacing: 0.04em;
          text-transform: none;
          font-weight: 500;
          color: rgba(244, 243, 239, 0.34);
        }
        .scc__hint {
          margin: 14px 0 0;
          font-size: 0.74rem;
          color: rgba(244, 243, 239, 0.28);
          line-height: 1.5;
        }
        .scc__launch-stand {
          margin-top: 26px;
          padding: 16px 14px 18px;
          border-radius: 17px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background:
            radial-gradient(90% 120% at 50% 0%, rgba(130, 150, 230, 0.05), transparent 52%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.038), rgba(0, 0, 0, 0.34));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            inset 0 -14px 36px rgba(0, 0, 0, 0.42),
            0 26px 56px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(0, 0, 0, 0.48);
        }
        .scc__launch {
          position: relative;
          display: block;
          width: 100%;
          border: none;
          cursor: pointer;
          text-align: center;
          padding: 0;
          border-radius: 13px;
          min-height: 52px;
          background: transparent;
          color: rgba(244, 243, 239, 0.94);
          transition:
            transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
            filter 0.38s ease;
        }
        .scc__launch-bezel {
          position: absolute;
          inset: 0;
          border-radius: 13px;
          pointer-events: none;
          z-index: 0;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 0 2px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          opacity: 0.85;
        }
        .scc__launch-rail {
          position: absolute;
          left: 2px;
          top: 14%;
          bottom: 14%;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, transparent, rgba(145, 160, 225, 0.5), transparent);
          opacity: 0.4;
          z-index: 5;
          pointer-events: none;
        }
        .scc__launch--armed .scc__launch-rail {
          animation: scc-launch-rail 2.8s ease-in-out infinite;
        }
        .scc__launch-sheen {
          position: absolute;
          inset: 1px;
          border-radius: 12px;
          pointer-events: none;
          z-index: 2;
          background: linear-gradient(
            118deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 44%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.04) 56%,
            transparent 100%
          );
          background-size: 220% 100%;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .scc__launch--armed .scc__launch-sheen {
          opacity: 1;
          animation: scc-launch-sheen 12s ease-in-out infinite;
        }
        .scc__launch-body {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 15px 24px 16px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background:
            radial-gradient(ellipse 92% 78% at 50% 14%, rgba(255, 255, 255, 0.2), transparent 58%),
            linear-gradient(168deg, rgba(255, 255, 255, 0.12) 0%, transparent 44%),
            linear-gradient(0deg, #0e1018, #1c1e2c 36%, #282a38 100%);
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.18),
            inset 0 -24px 48px rgba(0, 0, 0, 0.62),
            inset 0 0 36px rgba(0, 0, 0, 0.22),
            0 2px 0 rgba(0, 0, 0, 0.55),
            0 20px 50px rgba(0, 0, 0, 0.52);
          transition:
            transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
            box-shadow 0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
            border-color 0.35s ease,
            filter 0.35s ease;
        }
        .scc__launch-pass {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          opacity: 0;
          background: linear-gradient(
            102deg,
            transparent 28%,
            rgba(255, 255, 255, 0.06) 46%,
            rgba(255, 255, 255, 0.14) 50%,
            rgba(255, 255, 255, 0.05) 54%,
            transparent 74%
          );
          background-size: 200% 100%;
          background-position: 0% 0;
          mix-blend-mode: soft-light;
          transition: opacity 0.5s ease;
        }
        .scc__launch:hover:not(:disabled) .scc__launch-pass {
          opacity: 1;
          animation: scc-launch-pass 3.2s ease-in-out infinite;
        }
        .scc__launch-spec {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: linear-gradient(
            185deg,
            rgba(255, 255, 255, 0.16) 0%,
            rgba(255, 255, 255, 0.03) 24%,
            transparent 46%,
            transparent 56%,
            rgba(0, 0, 0, 0.16) 100%
          ),
            linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.1) 100%);
          mix-blend-mode: soft-light;
          opacity: 0.88;
        }
        .scc__launch--armed .scc__launch-spec {
          animation: scc-launch-spec 9s ease-in-out infinite;
        }
        .scc__launch-body > :not(.scc__launch-spec):not(.scc__launch-pass) {
          position: relative;
          z-index: 3;
        }
        .scc__launch-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .scc__launch-primary {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(0.74rem, 1.45vw, 0.92rem);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          line-height: 1.25;
        }
        .scc__launch-primary--solo {
          letter-spacing: 0.16em;
        }
        .scc__launch-secondary {
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: none;
          color: rgba(244, 243, 239, 0.4);
          line-height: 1.35;
        }
        .scc__launch-orb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top-color: rgba(200, 210, 245, 0.88);
          animation: scc-launch-spin 0.72s linear infinite;
        }
        .scc__launch--armed .scc__launch-body {
          animation: scc-launch-breathe 3.6s ease-in-out infinite;
        }
        .scc__launch:hover:not(:disabled) {
          filter: brightness(1.04);
        }
        .scc__launch:hover:not(:disabled) .scc__launch-body {
          transform: translateY(-3px) scale(1.008);
          border-color: rgba(165, 178, 228, 0.38);
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.19),
            inset 0 -20px 42px rgba(0, 0, 0, 0.52),
            inset 0 0 30px rgba(95, 110, 175, 0.06),
            0 3px 0 rgba(0, 0, 0, 0.45),
            0 22px 52px rgba(0, 0, 0, 0.42),
            0 0 32px rgba(75, 90, 155, 0.07);
        }
        .scc__launch:hover:not(:disabled) .scc__launch-sheen {
          opacity: 1;
        }
        .scc__launch:active:not(:disabled) .scc__launch-body {
          transform: translateY(4px) scale(0.988);
          filter: brightness(0.96);
          box-shadow:
            inset 0 10px 32px rgba(0, 0, 0, 0.72),
            inset 0 3px 10px rgba(0, 0, 0, 0.45),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.03),
            0 4px 14px rgba(0, 0, 0, 0.55);
          transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
        }
        .scc__launch:disabled:not(.scc__launch--busy) {
          cursor: not-allowed;
        }
        .scc__launch:disabled:not(.scc__launch--busy) .scc__launch-body {
          opacity: 0.4;
          filter: saturate(0.88) brightness(0.92);
        }
        .scc__launch:disabled:not(.scc__launch--busy) .scc__launch-rail {
          opacity: 0.12;
          animation: none;
        }
        .scc__launch--busy .scc__launch-body {
          cursor: wait;
          opacity: 1;
          filter: none;
          animation: scc-launch-busy 2.1s ease-in-out infinite;
          border-color: rgba(135, 155, 220, 0.38);
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.1),
            inset 0 -18px 36px rgba(0, 0, 0, 0.58),
            0 0 0 1px rgba(105, 120, 195, 0.22),
            0 16px 40px rgba(0, 0, 0, 0.48),
            0 0 48px rgba(80, 95, 165, 0.12);
        }
        @keyframes scc-launch-rail {
          0%,
          100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.72;
          }
        }
        @keyframes scc-launch-sheen {
          0% {
            background-position: -40% 0;
          }
          100% {
            background-position: 140% 0;
          }
        }
        @keyframes scc-launch-pass {
          0% {
            background-position: -30% 0;
          }
          100% {
            background-position: 130% 0;
          }
        }
        @keyframes scc-launch-spec {
          0%,
          100% {
            opacity: 0.75;
            transform: translateY(0);
          }
          50% {
            opacity: 0.95;
            transform: translateY(1px);
          }
        }
        @keyframes scc-launch-breathe {
          0%,
          100% {
            box-shadow:
              inset 0 2px 0 rgba(255, 255, 255, 0.14),
              inset 0 -18px 36px rgba(0, 0, 0, 0.62),
              inset 0 0 24px rgba(0, 0, 0, 0.25),
              0 2px 0 rgba(0, 0, 0, 0.55),
              0 18px 44px rgba(0, 0, 0, 0.48),
              0 0 36px rgba(70, 85, 150, 0.06);
          }
          50% {
            box-shadow:
              inset 0 2px 0 rgba(255, 255, 255, 0.15),
              inset 0 -18px 36px rgba(0, 0, 0, 0.58),
              inset 0 0 28px rgba(80, 95, 160, 0.06),
              0 2px 0 rgba(0, 0, 0, 0.52),
              0 18px 44px rgba(0, 0, 0, 0.44),
              0 0 52px rgba(90, 105, 170, 0.1);
          }
        }
        @keyframes scc-launch-busy {
          0%,
          100% {
            box-shadow:
              inset 0 2px 0 rgba(255, 255, 255, 0.1),
              inset 0 -18px 36px rgba(0, 0, 0, 0.58),
              0 0 0 1px rgba(105, 120, 195, 0.22),
              0 16px 40px rgba(0, 0, 0, 0.48),
              0 0 48px rgba(80, 95, 165, 0.12);
          }
          50% {
            box-shadow:
              inset 0 2px 0 rgba(255, 255, 255, 0.1),
              inset 0 -18px 36px rgba(0, 0, 0, 0.55),
              0 0 0 1px rgba(130, 150, 215, 0.3),
              0 16px 40px rgba(0, 0, 0, 0.45),
              0 0 60px rgba(90, 105, 170, 0.14);
          }
        }
        @keyframes scc-launch-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .scc__actions {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        @media (prefers-reduced-motion: reduce) {
          .scc__launch--armed .scc__launch-body,
          .scc__launch--armed .scc__launch-rail,
          .scc__launch--armed .scc__launch-sheen,
          .scc__launch--armed .scc__launch-spec,
          .scc__launch--busy .scc__launch-body {
            animation: none !important;
          }
          .scc__launch:hover:not(:disabled) .scc__launch-pass {
            animation: none !important;
            opacity: 0.35;
          }
          .scc__launch-orb {
            animation: none !important;
          }
        }
        .scc__out {
          min-height: min(320px, 52vh);
          position: relative;
        }
        .scc__loading--cinema {
          padding: 0;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 28px 56px rgba(0, 0, 0, 0.4);
        }
        .scc__loading--cinema.shimmer::after {
          z-index: 4;
          mix-blend-mode: screen;
          opacity: 0.55;
        }
      `}</style>
    </div>
  );
}
