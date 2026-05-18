import type { CSSProperties } from "react";
import type { SignalFabricSnapshot } from "../../lib/signal-fabric/types";

type Props = { fabric: SignalFabricSnapshot };

const ROWS: { key: keyof SignalFabricSnapshot["pressures"]; label: string }[] = [
  { key: "market", label: "Рынок" },
  { key: "brand", label: "Бренд" },
  { key: "production", label: "Производство" },
  { key: "seo", label: "SEO" },
  { key: "visual", label: "Визуал" },
  { key: "execution", label: "Исполнение" },
  { key: "memory", label: "Память" },
];

export function PressureMap({ fabric }: Props) {
  return (
    <div className="sf-pressure glass-panel">
      <h2 className="sf-pressure__h2">Поле давления</h2>
      <ul className="sf-pressure__list">
        {ROWS.map(({ key, label }) => {
          const v = fabric.pressures[key];
          return (
            <li key={key} className="sf-pressure__row">
              <span className="sf-pressure__k">{label}</span>
              <span className="sf-pressure__track">
                <span className="sf-pressure__fill" style={{ "--sf-v": v } as CSSProperties} />
              </span>
              <span className="sf-pressure__v">{v}%</span>
            </li>
          );
        })}
      </ul>
      <p className="sf-pressure__core">
        Ядро Mission Control · тепловая нагрузка <strong>{fabric.corePressure}%</strong>
      </p>
      <style>{`
        .sf-pressure {
          padding: 18px 20px;
          border-radius: var(--radius-xl);
        }
        .sf-pressure__h2 {
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 12px;
        }
        .sf-pressure__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sf-pressure__row {
          display: grid;
          grid-template-columns: 110px 1fr 36px;
          gap: 8px;
          align-items: center;
        }
        .sf-pressure__k {
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--faint);
        }
        .sf-pressure__track {
          height: 4px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .sf-pressure__fill {
          display: block;
          height: 100%;
          width: calc(var(--sf-v, 40) * 1%);
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(95, 110, 155, 0.2), rgba(145, 160, 205, 0.45));
        }
        .sf-pressure__v {
          font-size: 0.65rem;
          color: rgba(150, 165, 195, 0.5);
          text-align: right;
        }
        .sf-pressure__core {
          margin: 16px 0 0;
          font-size: 0.76rem;
          color: var(--muted);
        }
        .sf-pressure__core strong {
          font-weight: 600;
          color: rgba(210, 218, 235, 0.9);
        }
      `}</style>
    </div>
  );
}
