import { runOpenAIText, runOpenAIVision, visionUserImage, visionUserText } from "../ai/openai";
import { buildCommandCenterMemoryBundle } from "./memoryBundle";
import {
  buildStrategicCommandPrompt,
  buildStrategicCommandSystemPrompt,
  buildStrategicCommandUserMessage,
  buildStrategicCommandVisionPreamble,
} from "./prompts";
import { parseStrategicCommandJson } from "./parse";
import type { CommandCenterReport, StrategicCommandInput, StrategicOrchestrationParams } from "./types";

const MAX_SHOTS = 6;

function buildMemoryBlock(input: StrategicCommandInput): string {
  if (!input.includeProjectMemory) {
    return input.locale === "ru"
      ? "## Project memory\n(Отключено пользователем.)"
      : "## Project memory\n(Disabled by user.)";
  }
  return buildCommandCenterMemoryBundle(input.projectId ?? null, input.locale).text;
}

/**
 * Meta orchestration: single fused model call + optional vision + Project Memory bundle.
 */
export async function orchestrateStrategicCommand(params: StrategicOrchestrationParams): Promise<CommandCenterReport> {
  const memoryBlock = buildMemoryBlock(params.input);
  const system = buildStrategicCommandSystemPrompt(params.input.locale);
  const userText = buildStrategicCommandUserMessage(params.input, memoryBlock);
  const shots = params.screenshotDataUrls.slice(0, MAX_SHOTS);

  let raw: string;
  if (shots.length > 0) {
    const preamble = buildStrategicCommandVisionPreamble(params.input);
    raw = await runOpenAIVision({
      apiKey: params.apiKey,
      model: params.model,
      system,
      userContent: [visionUserText(preamble), ...shots.map((u) => visionUserImage(u)), visionUserText(userText)],
    });
  } else {
    raw = await runOpenAIText({
      apiKey: params.apiKey,
      model: params.model,
      system,
      user: userText,
    });
  }

  return parseStrategicCommandJson(raw);
}

export async function orchestrateStrategicCommandRaw(params: StrategicOrchestrationParams): Promise<string> {
  const memoryBlock = buildMemoryBlock(params.input);
  const { system, user } = buildStrategicCommandPrompt(params.input, memoryBlock);
  const shots = params.screenshotDataUrls.slice(0, MAX_SHOTS);
  if (shots.length > 0) {
    const preamble = buildStrategicCommandVisionPreamble(params.input);
    return runOpenAIVision({
      apiKey: params.apiKey,
      model: params.model,
      system,
      userContent: [visionUserText(preamble), ...shots.map((u) => visionUserImage(u)), visionUserText(user)],
    });
  }
  return runOpenAIText({
    apiKey: params.apiKey,
    model: params.model,
    system,
    user,
  });
}
