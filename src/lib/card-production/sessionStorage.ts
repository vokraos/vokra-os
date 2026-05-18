import { parseCardProductionBoardEnvelope } from "./parseBoard";
import type { CardProductionBoardEnvelope, CardProductionPlan, MarketplaceUploadBrief } from "./types";
import { CARD_PRODUCTION_BOARD_SCHEMA, CARD_PRODUCTION_SESSION_KEY } from "./types";
import { upsertUploadBriefInList } from "./uploadBrief";

export function emptyCardProductionBoard(): CardProductionBoardEnvelope {
  return { schema: CARD_PRODUCTION_BOARD_SCHEMA, plans: [], uploadBriefs: [], updatedAt: Date.now() };
}

export function loadCardProductionBoardFromSession(): CardProductionBoardEnvelope | null {
  try {
    const raw = sessionStorage.getItem(CARD_PRODUCTION_SESSION_KEY);
    if (!raw) return null;
    return parseCardProductionBoardEnvelope(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveCardProductionBoardToSession(env: CardProductionBoardEnvelope): void {
  const next: CardProductionBoardEnvelope = { ...env, updatedAt: Date.now() };
  try {
    sessionStorage.setItem(CARD_PRODUCTION_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function clearCardProductionSession(): void {
  try {
    sessionStorage.removeItem(CARD_PRODUCTION_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function boardToJsonString(env: CardProductionBoardEnvelope): string {
  return JSON.stringify(env, null, 2);
}

export function appendCardPlan(plan: CardProductionPlan): CardProductionBoardEnvelope {
  const cur = loadCardProductionBoardFromSession() ?? emptyCardProductionBoard();
  const next: CardProductionBoardEnvelope = {
    ...cur,
    plans: [...cur.plans, plan],
    uploadBriefs: cur.uploadBriefs ?? [],
    updatedAt: Date.now(),
  };
  saveCardProductionBoardToSession(next);
  return next;
}

export function patchCardPlanInSession(planId: string, patch: Partial<CardProductionPlan>): CardProductionBoardEnvelope | null {
  const cur = loadCardProductionBoardFromSession();
  if (!cur) return null;
  const idx = cur.plans.findIndex((p) => p.id === planId);
  if (idx < 0) return null;
  const prev = cur.plans[idx]!;
  const nextPlan: CardProductionPlan = { ...prev, ...patch, updatedAt: Date.now() };
  const plans = cur.plans.slice();
  plans[idx] = nextPlan;
  const next: CardProductionBoardEnvelope = {
    ...cur,
    plans,
    uploadBriefs: cur.uploadBriefs ?? [],
    updatedAt: Date.now(),
  };
  saveCardProductionBoardToSession(next);
  return next;
}

export function upsertUploadBriefToSession(brief: MarketplaceUploadBrief): CardProductionBoardEnvelope | null {
  const cur = loadCardProductionBoardFromSession();
  if (!cur) return null;
  const uploadBriefs = upsertUploadBriefInList(cur.uploadBriefs ?? [], brief);
  const next: CardProductionBoardEnvelope = { ...cur, uploadBriefs, updatedAt: Date.now() };
  saveCardProductionBoardToSession(next);
  return next;
}

export function patchUploadBriefByPlanId(cardPlanId: string, patch: Partial<MarketplaceUploadBrief>): CardProductionBoardEnvelope | null {
  const cur = loadCardProductionBoardFromSession();
  if (!cur) return null;
  const existing = (cur.uploadBriefs ?? []).find((b) => b.cardPlanId === cardPlanId);
  if (!existing) return null;
  const merged: MarketplaceUploadBrief = { ...existing, ...patch, updatedAt: Date.now() };
  return upsertUploadBriefToSession(merged);
}

export function replaceCardProductionBoard(env: CardProductionBoardEnvelope): void {
  const normalized: CardProductionBoardEnvelope = {
    ...env,
    uploadBriefs: env.uploadBriefs ?? [],
    plans: env.plans,
  };
  saveCardProductionBoardToSession(normalized);
}
