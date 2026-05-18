import type { TrendAgentRecommendations, TrendAgentRole } from "../../lib/trends/types";
import { TREND_AGENT_IDS } from "../../lib/trends/agents";

type T = (key: string) => string;

export function AgentRecommendations({ agents, t }: { agents: TrendAgentRecommendations; t: T }) {
  return (
    <section className="tr-ag">
      <h3 className="tr-ag__h">{t("trends.agentsTitle")}</h3>
      <p className="tr-ag__sub">{t("trends.agentsSub")}</p>
      <div className="tr-ag__grid">
        {TREND_AGENT_IDS.map((id) => (
          <AgentCard key={id} id={id} card={agents[id]} t={t} />
        ))}
      </div>
      <style>{`
        .tr-ag__h {
          margin: 0 0 6px;
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tr-ag__sub {
          margin: 0 0 16px;
          font-size: 0.78rem;
          color: var(--faint);
        }
        .tr-ag__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }
      `}</style>
    </section>
  );
}

function AgentCard({ id, card, t }: { id: TrendAgentRole; card: TrendAgentRecommendations[TrendAgentRole]; t: T }) {
  return (
    <article className="tr-agc glass-panel">
      <span className="tr-agc__pill">{t(`trends.agent.${id}`)}</span>
      {card.signals.length > 0 && (
        <div className="tr-agc__sig">
          {card.signals.map((s, i) => (
            <span key={i} className="tr-agc__chip">
              {s}
            </span>
          ))}
        </div>
      )}
      {card.headline ? <h4 className="tr-agc__hl">{card.headline}</h4> : null}
      {card.body ? <p className="tr-agc__body">{card.body}</p> : null}
      {card.moves.length > 0 && (
        <ul className="tr-agc__moves">
          {card.moves.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      <style>{`
        .tr-agc {
          padding: 18px 20px;
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.38));
        }
        .tr-agc__pill {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(180, 195, 255, 0.95);
        }
        .tr-agc__sig {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 10px 0 12px;
        }
        .tr-agc__chip {
          font-size: 0.6rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--muted);
        }
        .tr-agc__hl {
          margin: 0 0 8px;
          font-size: 0.92rem;
          line-height: 1.35;
        }
        .tr-agc__body {
          margin: 0 0 10px;
          font-size: 0.82rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .tr-agc__moves {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.78rem;
          line-height: 1.45;
        }
        .tr-agc__moves li {
          margin-bottom: 4px;
        }
      `}</style>
    </article>
  );
}
