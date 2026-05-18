import type { SignalFabricSnapshot } from "../../lib/signal-fabric/types";

type Props = { fabric: SignalFabricSnapshot };

export function SignalCascadePanel({ fabric }: Props) {
  return (
    <div className="sf-cascade glass-panel">
      <h2 className="sf-cascade__h2">Каскады</h2>
      <div className="sf-cascade__list">
        {fabric.cascades.map((c) => (
          <article key={c.id} className="sf-cascade__card">
            <header className="sf-cascade__head">
              <h3 className="sf-cascade__title">{c.titleRu}</h3>
              <span className="sf-cascade__int">{c.headIntensity}%</span>
            </header>
            <ol className="sf-cascade__steps">
              {c.stepsRu.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      <style>{`
        .sf-cascade {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
        }
        .sf-cascade__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 12px;
        }
        .sf-cascade__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sf-cascade__card {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
        }
        .sf-cascade__head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 8px;
        }
        .sf-cascade__title {
          margin: 0;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(218, 224, 238, 0.92);
        }
        .sf-cascade__int {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          color: rgba(150, 165, 195, 0.55);
        }
        .sf-cascade__steps {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.74rem;
          line-height: 1.45;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
