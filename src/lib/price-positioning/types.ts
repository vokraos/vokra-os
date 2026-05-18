export type PricePressureLevel = "safe" | "watch" | "tight" | "dangerous" | "negative";

export type PositioningRisk =
  | "none"
  | "below_target_margin"
  | "near_break_even"
  | "ads_unsafe"
  | "premium_without_proof"
  | "low_price_positioning"
  | "fbo_price_pressure"
  | "corridor_price_mismatch";

export type PricePositioningReport = {
  id: string;
  createdAt: number;
  sourceEconomicsProfileId: string | null;
  sourceTemplateId: string | null;
  sourceAssignmentId: string | null;
  targetLabel: string;
  marketplace: string;
  stockMode: string;
  salePrice: number;
  breakEvenPrice: number;
  targetPrice: number;
  estimatedMarginPercent: number;
  marginGap: number;
  adSafetyGap: number;
  pricePressureLevel: PricePressureLevel;
  positioningRisk: PositioningRisk;
  /** i18n key */
  recommendedPriceActionKey: string;
  recommendedPriceActionVars: Record<string, string>;
  premiumProofRequired: boolean;
  /** i18n keys */
  warningKeys: string[];
  confidenceNoteKey: string;
};

export type PricePositioningContext = {
  corridor?: string;
  productFamily?: string;
  /** Notes field checked for premium proof keywords */
  economicsNotes?: string;
};
