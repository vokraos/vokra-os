import { Fragment, type ReactNode } from "react";
import type { NavId } from "../../types";
import {
  sortDailyOperatingLineKeys,
  type DailyOperatingLineKey,
  type OperatingRoleMode,
} from "../../lib/operating-role-mode";
import { navForDailyOperatingLineKey } from "../../lib/clean-day-mode/dailyLineNav";

export type EntitySnapInputs = {
  warRoomLine: string | null;
  executionFeedbackLine: string | null;
  controlTowerLine: string | null;
  operatorModeLine: string | null;
  guidedSetupLine: string | null;
  osHealthAuditLine: string | null;
  founderBriefSummary: { headline: string; sub: string } | null;
  economicPressureLine: string | null;
  unitEconomicsLine: string | null;
  guardrailLine: string | null;
  pricePressureLine: string | null;
  adPressureLine: string | null;
  scalingSafetyLine: string | null;
  productionPressureLine: string | null;
  fboFbsDecisionLine: string | null;
  corridorStrategyLine: string | null;
  marketTimingLine: string | null;
  snapshotActionLine: string | null;
  entitySnapBanner: { sku: number; cards: number; corridors: number } | null;
  entitySnapBannerT: (key: string, vars: Record<string, string>) => string;
  launchExecutionLine: string | null;
  collectionExecutionLine: string | null;
  heroExecutionLine: string | null;
  heroCommandLine: string | null;
  assortmentLine: string | null;
  assortmentChecklistLine: string | null;
  assortmentReviewCarryLine: string | null;
  assortmentRepeatedBlockerLine: string | null;
  assortmentLearningLine: string | null;
  assortmentExecutiveReportLine: string | null;
  onNavigate: (id: NavId) => void;
  /** When set, drops snap rows whose primary nav is in this set (Clean Day). */
  cleanDayHiddenNavIds?: ReadonlySet<NavId>;
};

export function buildEntitySnapBlocks(
  roleMode: OperatingRoleMode,
  input: EntitySnapInputs,
): ReactNode[] {
  const snap = (className: string, navId: NavId, line: string) => (
    <p key={className} className={className} role="status">
      <button type="button" className="dom__aa-link" onClick={() => input.onNavigate(navId)}>
        {line}
      </button>
    </p>
  );

  const warSnap = (className: string, line: string) => (
    <p key={className} className={className} role="status">
      <button type="button" className="dom__aa-link dom__aa-link--war" onClick={() => input.onNavigate("warRoom")}>
        {line}
      </button>
    </p>
  );

  const blocks: Partial<Record<DailyOperatingLineKey, ReactNode>> = {};

  if (input.warRoomLine) blocks.warRoom = warSnap("dom__entity-snap dom__entity-snap--dwr", input.warRoomLine);
  if (input.executionFeedbackLine) {
    blocks.executionFeedback = snap(
      "dom__entity-snap dom__entity-snap--efb",
      "operatorMode",
      input.executionFeedbackLine,
    );
  }
  if (input.controlTowerLine) {
    blocks.controlTower = snap("dom__entity-snap dom__entity-snap--sct", "controlTower", input.controlTowerLine);
  }
  if (input.operatorModeLine) {
    blocks.operatorMode = snap("dom__entity-snap dom__entity-snap--opm", "operatorMode", input.operatorModeLine);
  }
  if (input.guidedSetupLine) {
    blocks.guidedSetup = snap("dom__entity-snap dom__entity-snap--gsp", "guidedSetup", input.guidedSetupLine);
  }
  if (input.osHealthAuditLine) {
    blocks.osHealthAudit = snap("dom__entity-snap dom__entity-snap--oha", "osHealthAudit", input.osHealthAuditLine);
  }
  if (input.founderBriefSummary) {
    blocks.founderBrief = (
      <div key="founderBrief" className="dom__fbrief" role="status">
        <button type="button" className="dom__fbrief-link" onClick={() => input.onNavigate("founderBrief")}>
          <span className="dom__fbrief-head">{input.founderBriefSummary.headline}</span>
          <span className="dom__fbrief-sub">{input.founderBriefSummary.sub}</span>
        </button>
      </div>
    );
  }
  if (input.economicPressureLine) {
    blocks.economic = snap("dom__entity-snap dom__entity-snap--econ", "economicPressure", input.economicPressureLine);
  }
  if (input.unitEconomicsLine) {
    blocks.unitEconomics = snap("dom__entity-snap dom__entity-snap--ue", "unitEconomics", input.unitEconomicsLine);
  }
  if (input.guardrailLine) {
    blocks.guardrail = snap("dom__entity-snap dom__entity-snap--egr", "unitEconomics", input.guardrailLine);
  }
  if (input.pricePressureLine) {
    blocks.pricePressure = snap("dom__entity-snap dom__entity-snap--ppr", "unitEconomics", input.pricePressureLine);
  }
  if (input.adPressureLine) {
    blocks.adPressure = snap("dom__entity-snap dom__entity-snap--adp", "advertisingPressure", input.adPressureLine);
  }
  if (input.scalingSafetyLine) {
    blocks.scalingSafety = snap("dom__entity-snap dom__entity-snap--ssf", "scalingSafety", input.scalingSafetyLine);
  }
  if (input.productionPressureLine) {
    blocks.productionPressure = snap(
      "dom__entity-snap dom__entity-snap--prod",
      "productionPressure",
      input.productionPressureLine,
    );
  }
  if (input.fboFbsDecisionLine) {
    blocks.fboFbs = snap("dom__entity-snap dom__entity-snap--ffd", "fboFbsDecision", input.fboFbsDecisionLine);
  }
  if (input.corridorStrategyLine) {
    blocks.corridorStrategy = snap(
      "dom__entity-snap dom__entity-snap--cst",
      "corridorStrategy",
      input.corridorStrategyLine,
    );
  }
  if (input.marketTimingLine) {
    blocks.marketTiming = snap("dom__entity-snap dom__entity-snap--mtm", "marketTiming", input.marketTimingLine);
  }
  if (input.snapshotActionLine) {
    blocks.entitySnapshot = (
      <p key="entitySnapshot" className="dom__entity-snap" role="status">
        {input.snapshotActionLine}
      </p>
    );
  } else if (input.entitySnapBanner) {
    blocks.entitySnapshot = (
      <p key="entitySnapshot" className="dom__entity-snap" role="status">
        {input.entitySnapBannerT("entitySnap.daily.banner", {
          sku: String(input.entitySnapBanner.sku),
          cards: String(input.entitySnapBanner.cards),
          corridors: String(input.entitySnapBanner.corridors),
        })}
      </p>
    );
  }
  if (input.launchExecutionLine) {
    blocks.launchExecution = snap(
      "dom__entity-snap dom__entity-snap--launch",
      "assortmentActions",
      input.launchExecutionLine,
    );
  } else if (input.collectionExecutionLine) {
    blocks.collectionExecution = snap(
      "dom__entity-snap dom__entity-snap--col",
      "assortmentActions",
      input.collectionExecutionLine,
    );
  } else if (input.heroExecutionLine) {
    blocks.heroExecution = snap(
      "dom__entity-snap dom__entity-snap--hc",
      "assortmentActions",
      input.heroExecutionLine,
    );
  } else if (input.heroCommandLine) {
    blocks.heroCommand = snap("dom__entity-snap dom__entity-snap--hc", "heroCommand", input.heroCommandLine);
  }
  if (input.assortmentLine) {
    blocks.assortment = snap("dom__entity-snap dom__entity-snap--aa", "assortmentActions", input.assortmentLine);
  }
  if (input.assortmentChecklistLine) {
    blocks.assortmentChecklist = snap(
      "dom__entity-snap dom__entity-snap--aa dom__entity-snap--aa-chk",
      "assortmentActions",
      input.assortmentChecklistLine,
    );
  }
  if (input.assortmentReviewCarryLine) {
    blocks.assortmentReview = snap(
      "dom__entity-snap dom__entity-snap--aa dom__entity-snap--aa-rev",
      "assortmentActions",
      input.assortmentReviewCarryLine,
    );
  }
  if (input.assortmentRepeatedBlockerLine) {
    blocks.assortmentRepeated = snap(
      "dom__entity-snap dom__entity-snap--aa dom__entity-snap--aa-rb",
      "assortmentActions",
      input.assortmentRepeatedBlockerLine,
    );
  }
  if (input.assortmentLearningLine) {
    blocks.assortmentLearning = snap(
      "dom__entity-snap dom__entity-snap--aa dom__entity-snap--aa-learn",
      "assortmentActions",
      input.assortmentLearningLine,
    );
  }
  if (input.assortmentExecutiveReportLine) {
    blocks.assortmentExecutive = snap(
      "dom__entity-snap dom__entity-snap--aa dom__entity-snap--aa-rep",
      "assortmentActions",
      input.assortmentExecutiveReportLine,
    );
  }

  let present = Object.keys(blocks) as DailyOperatingLineKey[];
  const hide = input.cleanDayHiddenNavIds;
  if (hide?.size) {
    present = present.filter((k) => {
      const nav = navForDailyOperatingLineKey(k);
      if (!nav) return true;
      return !hide.has(nav);
    });
  }
  return sortDailyOperatingLineKeys(present, roleMode).map((k) => (
    <Fragment key={k}>{blocks[k]}</Fragment>
  ));
}
