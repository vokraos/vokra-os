import type { CSSProperties } from "react";
import {
  AGENT_TASK_LINE,
  CONSCIOUSNESS_LABEL_RU,
  MODE_MISSION_LINE,
  agentCognitionPercent,
  agentConsciousnessVisual,
  agentMotion,
  agentTier,
  type AgentPersona,
  type MissionSystemMode,
} from "./mcConstants";

type AgentDef = {
  name: string;
  persona: AgentPersona;
  glyph: string;
  rgb: string;
  glow: string;
};

export type AgentConsciousnessProps = {
  agent: AgentDef;
  index: number;
  systemMode: MissionSystemMode;
  primaryPersona: AgentPersona | null;
  hoveredAgentIndex: number | null;
  spikeAgent: number | null;
  onHoverAgent: (index: number | null) => void;
};

export function AgentConsciousness({
  agent,
  index,
  systemMode,
  primaryPersona,
  hoveredAgentIndex,
  spikeAgent,
  onHoverAgent,
}: AgentConsciousnessProps) {
  const isPrimary = Boolean(primaryPersona && systemMode !== "idle" && agent.persona === primaryPersona);
  const motion = agentMotion(agent.persona, systemMode, isPrimary);
  const tier = agentTier(agent.persona, systemMode);
  const cognition = agentCognitionPercent(tier);
  const consciousness = agentConsciousnessVisual(agent.persona, systemMode, isPrimary, tier);
  const stateRu = CONSCIOUSNESS_LABEL_RU[consciousness];
  const taskLine = isPrimary ? MODE_MISSION_LINE[systemMode] : AGENT_TASK_LINE[agent.persona];
  const isHover = hoveredAgentIndex === index;
  const pressure = Math.round(100 - cognition * 0.85);

  const metaRight =
    consciousness === "syncing"
      ? "ведёт миссию"
      : consciousness === "overloaded"
        ? "пик буфера"
        : consciousness === "analyzing"
          ? "сбор данных"
          : consciousness === "predicting"
            ? "гипотезы"
            : "онлайн";

  return (
    <button
      type="button"
      className={`mc-ent mc-ent--${consciousness}${isPrimary ? " mc-ent--primary" : ""}${spikeAgent === index ? " mc-ent--spike" : ""}${isHover ? " mc-ent--hover" : ""}`}
      data-mc-agent-index={index}
      data-mc-tier={tier}
      data-mc-consciousness={consciousness}
      style={
        {
          "--mc-rgb": agent.rgb,
          "--mc-glow": agent.glow,
          "--mc-pulse-dur": `${motion.pulseSec}s`,
          "--mc-breathe-dur": `${motion.breatheSec}s`,
          "--mc-ent-opacity": String(motion.cardOpacity),
        } as CSSProperties
      }
      onMouseEnter={() => onHoverAgent(index)}
      onMouseLeave={() => onHoverAgent(null)}
    >
      <span className="mc-ent__thread" aria-hidden />
      <span className="mc-ent__glyph" aria-hidden>
        {agent.glyph}
      </span>
      <span className="mc-ent__pulse" aria-hidden />
      <span className="mc-ent__ring" aria-hidden />
      <span className="mc-ent__sweep" aria-hidden />
      <span className="mc-ent__ripple" aria-hidden />
      <div className="mc-ent__body">
        <div className="mc-ent__row1">
          <span className="mc-ent__name">{agent.name}</span>
          <span className="mc-ent__state">{stateRu}</span>
        </div>
        <div className="mc-ent__row2">
          <span className="mc-ent__cog-label">Сходимость</span>
          <span className="mc-ent__cog-val">{cognition}%</span>
          <span className="mc-ent__cog-bar" aria-hidden>
            <span className="mc-ent__cog-fill" style={{ width: `${cognition}%` }} />
          </span>
        </div>
        <div className="mc-ent__meta">
          <span className="mc-ent__meta-i">нагрузка {pressure}%</span>
          <span className="mc-ent__meta-i">{metaRight}</span>
        </div>
        <p className="mc-ent__task">{taskLine}</p>
        <div className="mc-ent__stream" aria-hidden>
          <span className="mc-ent__stream-inner" />
        </div>
      </div>
    </button>
  );
}
