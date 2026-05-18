import { lsGet, lsSet } from "./storage";

const KEY_API = "vokra.openai.apiKey";
const KEY_MODEL = "vokra.openai.model";

export type OpenAISettings = {
  apiKey: string;
  model: string;
};

export function getOpenAISettings(): OpenAISettings {
  return {
    apiKey: (lsGet(KEY_API) ?? "").trim(),
    model: (lsGet(KEY_MODEL) ?? "gpt-4.1-mini").trim() || "gpt-4.1-mini",
  };
}

export function setOpenAIApiKey(apiKey: string) {
  lsSet(KEY_API, apiKey);
}

export function setOpenAIModel(model: string) {
  lsSet(KEY_MODEL, model);
}

