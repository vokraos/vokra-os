import type { SignalRow } from "./mcConstants";

export type SignalMatrixProps = {
  signalRows: SignalRow[];
  signalHighlightIdx: number;
};

export function SignalMatrix({ signalRows, signalHighlightIdx }: SignalMatrixProps) {
  return (
      <div className="mc-ego__signals">
      <div className="mc-ego__signals-hdr">Контур сигналов</div>
      <ul className="mc-ego__signal-list">
        {signalRows.map((row, i) => (
          <li key={row.id} className={`mc-ego__signal${i === signalHighlightIdx ? " mc-ego__signal--hot" : ""}`}>
            <span className="mc-ego__signal-idx">{String(i + 1).padStart(2, "0")}</span>
            <span className="mc-ego__signal-txt">{row.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
