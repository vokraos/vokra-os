import type { NavId } from "../../types";
import type { DailyOperatingLineKey } from "../operating-role-mode/dailyOperatingOrder";

/** Primary nav target for a Daily Operating line (entitySnapshot has no single nav). */
export function navForDailyOperatingLineKey(key: DailyOperatingLineKey): NavId | null {
  switch (key) {
    case "warRoom":
      return "warRoom";
    case "executionFeedback":
    case "operatorMode":
      return "operatorMode";
    case "controlTower":
      return "controlTower";
    case "guidedSetup":
      return "guidedSetup";
    case "osHealthAudit":
      return "osHealthAudit";
    case "founderBrief":
      return "founderBrief";
    case "economic":
      return "economicPressure";
    case "unitEconomics":
    case "guardrail":
    case "pricePressure":
      return "unitEconomics";
    case "adPressure":
      return "advertisingPressure";
    case "scalingSafety":
      return "scalingSafety";
    case "productionPressure":
      return "productionPressure";
    case "fboFbs":
      return "fboFbsDecision";
    case "corridorStrategy":
      return "corridorStrategy";
    case "marketTiming":
      return "marketTiming";
    case "entitySnapshot":
      return null;
    case "launchExecution":
    case "collectionExecution":
    case "heroExecution":
    case "assortment":
    case "assortmentChecklist":
    case "assortmentExecutive":
    case "assortmentLearning":
    case "assortmentRepeated":
    case "assortmentReview":
      return "assortmentActions";
    case "heroCommand":
      return "heroCommand";
    default:
      return null;
  }
}
