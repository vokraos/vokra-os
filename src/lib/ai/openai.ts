import { readSseEvents } from "./sse";

export type OpenAIStreamOptions = {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  signal?: AbortSignal;
};

/** Responses API: text parts in `input` must use `input_text`, not `text`. */
function inputText(text: string) {
  return { type: "input_text" as const, text };
}

function responsesInput(system: string, user: string) {
  return [
    { role: "system" as const, content: [inputText(system)] },
    { role: "user" as const, content: [inputText(user)] },
  ];
}

function inputImage(imageUrl: string) {
  return { type: "input_image" as const, image_url: imageUrl };
}

export type VisionUserContentPart =
  | ReturnType<typeof inputText>
  | ReturnType<typeof inputImage>;

/** Use with `runOpenAIVision` user content array. */
export function visionUserText(text: string): VisionUserContentPart {
  return inputText(text);
}

/** `imageUrl` may be `data:image/...;base64,...` or HTTPS URL. */
export function visionUserImage(imageUrl: string): VisionUserContentPart {
  return inputImage(imageUrl);
}

function responsesInputVision(system: string, userContent: VisionUserContentPart[]) {
  return [
    { role: "system" as const, content: [inputText(system)] },
    { role: "user" as const, content: userContent },
  ];
}

function extractDelta(evt: any): string {
  // Responses API style
  if (evt && typeof evt === "object") {
    if (typeof evt.delta === "string") return evt.delta;
    if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") return evt.delta;
    if (evt.type === "response.output_text.delta" && typeof evt.text === "string") return evt.text;

    // Chat Completions style (fallback)
    const cc = evt.choices?.[0]?.delta?.content;
    if (typeof cc === "string") return cc;
  }
  return "";
}

function extractFinalText(json: any): string | null {
  if (typeof json?.output_text === "string" && json.output_text.length > 0) return json.output_text;
  const out = json?.output;
  if (!Array.isArray(out)) return null;
  const chunks: string[] = [];
  for (const item of out) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c?.type === "output_text" && typeof c.text === "string") chunks.push(c.text);
      }
    } else if (item?.type === "output_text" && typeof item.text === "string") {
      chunks.push(item.text);
    }
  }
  if (chunks.length) return chunks.join("");
  return null;
}

export async function* streamOpenAIText(opts: OpenAIStreamOptions) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      stream: true,
      input: responsesInput(opts.system, opts.user),
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text || res.statusText}`);
  }

  const body = res.body;
  if (!body) throw new Error("No response body (streaming unavailable).");

  for await (const ev of readSseEvents(body)) {
    if (ev.data === "[DONE]") return;
    let parsed: any = null;
    try {
      parsed = JSON.parse(ev.data);
    } catch {
      continue;
    }

    const delta = extractDelta(parsed);
    if (delta) yield delta;
  }
}

export async function runOpenAIText(opts: Omit<OpenAIStreamOptions, "signal">) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      input: responsesInput(opts.system, opts.user),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text || res.statusText}`);
  }

  const json: any = await res.json();
  const text = extractFinalText(json);
  if (typeof text === "string" && text.length > 0) return text;
  return JSON.stringify(json, null, 2);
}

export type OpenAIVisionOptions = {
  apiKey: string;
  model: string;
  system: string;
  /** First parts should usually be `input_text` instructions; append `input_image` with data URLs or HTTPS URLs. */
  userContent: VisionUserContentPart[];
};

/** Non-streaming multimodal call (vision + text). */
export async function runOpenAIVision(opts: OpenAIVisionOptions): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      input: responsesInputVision(opts.system, opts.userContent),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text || res.statusText}`);
  }

  const json: any = await res.json();
  const text = extractFinalText(json);
  if (typeof text === "string" && text.length > 0) return text;
  return JSON.stringify(json, null, 2);
}

