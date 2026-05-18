import { useMemo } from "react";
import { WARFARE_ROW_META, type ThoughtBlock, type WarfarePressure } from "./mcConstants";

export type StrategicOutputProps = {
  thought: ThoughtBlock;
  warfarePressure: WarfarePressure;
};

export function StrategicOutput({ thought, warfarePressure }: StrategicOutputProps) {
  const tension = useMemo(() => {
    return WARFARE_ROW_META.map((r) => ({ label: r.label, key: r.key, v: warfarePressure[r.key] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 2);
  }, [warfarePressure]);

  return (
    <div className="mc-ego__intel mc-strategic">
      <div className="mc-ego__intel-hdr">
        <span className="mc-ego__intel-title">Синтез для руководства</span>
        <div className="mc-strategic__rhythm" aria-hidden>
          {["a", "b", "c", "d", "e", "f"].map((k, i) => (
            <span key={k} className="mc-strategic__rhythm-bar" style={{ animationDelay: `${-i * 1.1}s` }} />
          ))}
        </div>
      </div>
      <div className="mc-strategic__tension">
        <span className="mc-strategic__tension-k">Приоритет давления</span>
        <div className="mc-strategic__tension-chips">
          {tension.map((t) => (
            <span key={t.key} className="mc-strategic__chip">
              {t.label} · {Math.round(t.v)}
            </span>
          ))}
        </div>
      </div>
      <div className="mc-strategic__blocks">
        <div className="mc-strategic__block">
          <span className="mc-strategic__block-k">Обнаружено</span>
          <p className="mc-strategic__block-t">{thought.detected}</p>
        </div>
        {thought.confidence != null ? (
          <div className="mc-strategic__block mc-strategic__block--narrow">
            <span className="mc-strategic__block-k">Уверенность</span>
            <p className="mc-strategic__block-t">{thought.confidence}%</p>
          </div>
        ) : null}
        {thought.recommendation ? (
          <div className="mc-strategic__block">
            <span className="mc-strategic__block-k">Рекомендация</span>
            <p className="mc-strategic__block-t">{thought.recommendation}</p>
          </div>
        ) : null}
        {thought.risk ? (
          <div className="mc-strategic__block mc-strategic__block--risk">
            <span className="mc-strategic__block-k">Риск</span>
            <p className="mc-strategic__block-t">{thought.risk}</p>
          </div>
        ) : null}
        {thought.action ? (
          <div className="mc-strategic__block">
            <span className="mc-strategic__block-k">Маршрут</span>
            <p className="mc-strategic__block-t">{thought.action}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
