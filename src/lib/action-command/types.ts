/**
 * Action Command Layer — concrete operational commands derived from routes and contour.
 * Russian-first labels; technical terms (SEO, FBO, SKU, DTF, WB, Ozon) allowed in copy.
 */

export type ActionCommandType =
  | "create_sku"
  | "prepare_print"
  | "update_hero_visual"
  | "expand_seo"
  | "assemble_rich"
  | "launch_reels"
  | "verify_brand_dna"
  | "prepare_fbo"
  | "reduce_sku_entropy"
  | "check_production"
  | "update_card"
  | "test_price";

export const ACTION_COMMAND_TYPE_LABEL_RU: Record<ActionCommandType, string> = {
  create_sku: "создать SKU",
  prepare_print: "подготовить принт",
  update_hero_visual: "обновить hero visual",
  expand_seo: "расширить SEO",
  assemble_rich: "собрать rich content",
  launch_reels: "запустить reels",
  verify_brand_dna: "проверить Brand DNA",
  prepare_fbo: "подготовить FBO",
  reduce_sku_entropy: "снизить SKU entropy",
  check_production: "проверить производство",
  update_card: "обновить карточку",
  test_price: "протестировать цену",
};

export type ActionCommandStatus =
  | "new"
  | "in_progress"
  | "waiting_dependency"
  | "blocked"
  | "ready"
  | "done"
  | "deferred";

export const ACTION_COMMAND_STATUS_RU: Record<ActionCommandStatus, string> = {
  new: "новая",
  in_progress: "в работе",
  waiting_dependency: "ждёт зависимость",
  blocked: "заблокирована",
  ready: "готова к запуску",
  done: "выполнена",
  deferred: "отложена",
};

export type ActionCommand = {
  id: string;
  titleRu: string;
  commandType: ActionCommandType;
  /** Russian label for command type (duplicate of map for stable export) */
  typeLabelRu: string;
  /** Aligns with OrchestratorSystem keys from execution orchestrator */
  owner: string;
  /** 0–100, higher = more urgent */
  priority: number;
  status: ActionCommandStatus;
  statusLabelRu: string;
  reasonRu: string;
  firstStepRu: string;
  expectedOutcomeRu: string;
  deadlineWindowRu: string;
  dependenciesRu: readonly string[];
  riskIfIgnoredRu: string;
  linkedRouteId: string;
  linkedStageIndex: number;
};

export type ActionCommandLayerSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  commands: readonly ActionCommand[];
  topCommandId: string | null;
};
