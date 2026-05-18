import type { HeroTestVariant } from "../../lib/hero-test-matrix/types";
import type { HeroTestFinalUse, HeroTestQualityScores, HeroTestResult, HeroTestResultStatus } from "../../lib/hero-test-results/types";

const STATUS_IDS: HeroTestResultStatus[] = [
  "pending",
  "shortlisted",
  "winner",
  "needs_revision",
  "rejected",
  "archived",
];

const FINAL_USE_IDS: HeroTestFinalUse[] = ["wb_hero", "ozon_hero", "rich_content", "campaign", "reels", "discard"];

type Props = {
  variant: HeroTestVariant;
  result: HeroTestResult;
  isWinner: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  onPatch: (patch: Partial<HeroTestResult>) => void;
  onSave: () => void;
  onRegisterWinner: () => void;
  onCreateCardPlan: () => void;
  registerDisabled: boolean;
  cardPlanDisabled: boolean;
};

export function HeroTestVariantReview({
  variant,
  result,
  isWinner,
  t,
  onPatch,
  onSave,
  onRegisterWinner,
  onCreateCardPlan,
  registerDisabled,
  cardPlanDisabled,
}: Props) {
  const scoreField = (key: keyof HeroTestQualityScores, labelKey: string) => (
    <label className="cmap-htm-review__score" key={key}>
      <span>{t(labelKey)}</span>
      <input
        type="number"
        min={1}
        max={5}
        className="cmap-htm-review__num"
        value={result.qualityScores[key] ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          const v = raw === "" ? null : Math.min(5, Math.max(1, Number.parseInt(raw, 10) || 1));
          onPatch({ qualityScores: { ...result.qualityScores, [key]: v } });
        }}
      />
    </label>
  );

  return (
    <div className={`cmap-htm-review ${isWinner ? "cmap-htm-review--winner" : ""}`}>
      <label className="cmap-htm-review__row">
        <span>{t("htr.field.status")}</span>
        <select
          className="cmap-htm-review__sel"
          value={result.resultStatus}
          onChange={(e) => onPatch({ resultStatus: e.target.value as HeroTestResultStatus })}
        >
          {STATUS_IDS.map((s) => (
            <option key={s} value={s}>
              {t(`htr.status.${s}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="cmap-htm-review__row">
        <span>{t("htr.field.finalUse")}</span>
        <select
          className="cmap-htm-review__sel"
          value={result.finalUse}
          onChange={(e) => onPatch({ finalUse: e.target.value as HeroTestFinalUse })}
        >
          {FINAL_USE_IDS.map((u) => (
            <option key={u} value={u}>
              {t(`htr.finalUse.${u}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="cmap-htm-review__row cmap-htm-review__row--full">
        <span>{t("htr.field.selectedNote")}</span>
        <input
          className="cmap-htm-review__txt"
          value={result.selectedVisualNote}
          onChange={(e) => onPatch({ selectedVisualNote: e.target.value })}
          placeholder={variant.visualDirection.slice(0, 80)}
        />
      </label>
      <label className="cmap-htm-review__row cmap-htm-review__row--full">
        <span>{t("htr.field.whySelected")}</span>
        <input
          className="cmap-htm-review__txt"
          value={result.whySelected}
          onChange={(e) => onPatch({ whySelected: e.target.value })}
        />
      </label>
      <label className="cmap-htm-review__row cmap-htm-review__row--full">
        <span>{t("htr.field.whyRejected")}</span>
        <input
          className="cmap-htm-review__txt"
          value={result.whyRejected}
          onChange={(e) => onPatch({ whyRejected: e.target.value })}
        />
      </label>
      <label className="cmap-htm-review__row cmap-htm-review__row--full">
        <span>{t("htr.field.issue")}</span>
        <input
          className="cmap-htm-review__txt"
          value={result.issueFound}
          onChange={(e) => onPatch({ issueFound: e.target.value })}
        />
      </label>
      <label className="cmap-htm-review__row cmap-htm-review__row--full">
        <span>{t("htr.field.revision")}</span>
        <input
          className="cmap-htm-review__txt"
          value={result.revisionInstruction}
          onChange={(e) => onPatch({ revisionInstruction: e.target.value })}
        />
      </label>
      <label className="cmap-htm-review__row cmap-htm-review__row--full">
        <span>{t("htr.field.confidence")}</span>
        <input
          className="cmap-htm-review__txt"
          value={result.decisionConfidence}
          onChange={(e) => onPatch({ decisionConfidence: e.target.value })}
        />
      </label>
      <div className="cmap-htm-review__scores">
        {scoreField("readability", "htr.score.readability")}
        {scoreField("premiumPerception", "htr.score.premium")}
        {scoreField("printVisibility", "htr.score.print")}
        {scoreField("marketplaceClarity", "htr.score.clarity")}
        {scoreField("brandFit", "htr.score.brand")}
        {scoreField("fatigueResistance", "htr.score.fatigue")}
      </div>
      <div className="cmap-serp__actions cmap-serp__actions--wrap" style={{ marginTop: 8 }}>
        <button type="button" className="ghost-btn" onClick={onSave}>
          {t("htr.action.saveResult")}
        </button>
        {isWinner ? (
          <>
            <button type="button" className="ghost-btn" onClick={onRegisterWinner} disabled={registerDisabled}>
              {t("htr.action.registerWinner")}
            </button>
            <button type="button" className="ghost-btn" onClick={onCreateCardPlan} disabled={cardPlanDisabled}>
              {t("htr.action.createCardPlan")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
