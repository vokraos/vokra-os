import type { SignalFabricSnapshot } from "../../lib/signal-fabric/types";

type Props = { fabric: SignalFabricSnapshot };

export function SignalStream({ fabric }: Props) {
  return (
    <div className="sf-stream glass-panel">
      <h2 className="sf-stream__h2">Поток сигналов</h2>
      <p className="sf-stream__hint">Нервный лог контура · причина и следствие</p>
      <ul className="sf-stream__list">
        {fabric.stream.map((s) => (
          <li key={s.id} className="sf-stream__row">
            <div className="sf-stream__meta">
              <span className="sf-stream__type">{s.type.replace(/_/g, " · ")}</span>
              <span className="sf-stream__urg">{s.urgency}</span>
              <span className="sf-stream__conf">уверенность {s.confidence}%</span>
            </div>
            <p className="sf-stream__label">{s.labelRu}</p>
            <p className="sf-stream__ce">
              <span className="sf-stream__k">Причина</span> {s.causeRu}
            </p>
            <p className="sf-stream__ce">
              <span className="sf-stream__k">Следствие</span> {s.effectRu}
            </p>
            <p className="sf-stream__route">
              {s.source} → {s.targets.slice(0, 5).join(" → ")}
            </p>
          </li>
        ))}
      </ul>
      <style>{`
        .sf-stream {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
        }
        .sf-stream__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 6px;
        }
        .sf-stream__hint {
          margin: 0 0 12px;
          font-size: 0.7rem;
          color: rgba(150, 165, 195, 0.5);
        }
        .sf-stream__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 420px;
          overflow-y: auto;
        }
        .sf-stream__row {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
        }
        .sf-stream__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(140, 155, 185, 0.55);
          margin-bottom: 6px;
        }
        .sf-stream__label {
          margin: 0 0 6px;
          font-size: 0.85rem;
          color: rgba(215, 222, 238, 0.9);
        }
        .sf-stream__ce {
          margin: 0 0 4px;
          font-size: 0.74rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .sf-stream__k {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
          margin-right: 6px;
        }
        .sf-stream__route {
          margin: 6px 0 0;
          font-size: 0.68rem;
          color: rgba(130, 145, 175, 0.55);
        }
      `}</style>
    </div>
  );
}
