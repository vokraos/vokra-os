import { useSignalFabricOptional } from "../../lib/signal-fabric/context";

/** Mission Control overlay: live cascades + core pressure from signal fabric. */
export function McSignalFabricStrip() {
  const fabric = useSignalFabricOptional();
  if (!fabric) return null;

  const head = fabric.cascades[0];
  const incoming = fabric.stream.slice(0, 2);

  return (
    <div className="mc-sf" data-mc-sf-pulse={fabric.pulseGeneration % 500}>
      <div className="mc-sf__inner glass-panel">
        <div className="mc-sf__col">
          <span className="mc-sf__k">Сигнальная сеть</span>
          <span className="mc-sf__core">Ядро · давление {fabric.corePressure}%</span>
        </div>
        <div className="mc-sf__col mc-sf__col--wide">
          <span className="mc-sf__k">Активный каскад</span>
          <p className="mc-sf__cascade">{head?.titleRu ?? "—"}</p>
        </div>
        <div className="mc-sf__col mc-sf__col--routes">
          <span className="mc-sf__k">Входящие импульсы</span>
          <ul className="mc-sf__ul">
            {incoming.map((s) => (
              <li key={s.id}>
                {s.labelRu} · {s.urgency}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`
        .mc-sf {
          position: relative;
          z-index: 4;
          padding: 0 28px 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (max-width: 1024px) {
          .mc-sf {
            padding: 0 16px 12px;
          }
        }
        .mc-sf__inner {
          display: grid;
          grid-template-columns: 1fr 1.4fr 1.2fr;
          gap: 16px;
          padding: 14px 18px;
          border-radius: 16px;
        }
        @media (max-width: 900px) {
          .mc-sf__inner {
            grid-template-columns: 1fr;
          }
        }
        .mc-sf__k {
          display: block;
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(150, 165, 195, 0.55);
          margin-bottom: 6px;
        }
        .mc-sf__core {
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          color: rgba(215, 222, 238, 0.92);
        }
        .mc-sf__cascade {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .mc-sf__ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.72rem;
          line-height: 1.45;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
