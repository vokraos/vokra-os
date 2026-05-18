import { useI18n } from "../../lib/i18n/I18nContext";
import { useCognitiveDepth } from "../../lib/cognitive-depth/CognitiveDepthProvider";
import type { CognitiveDepthMode } from "../../lib/cognitive-depth/types";

const MODES: CognitiveDepthMode[] = ["command", "operations", "analysis", "memory", "simulation"];

export function DepthSwitcher() {
  const { t } = useI18n();
  const { mode, setMode } = useCognitiveDepth();

  return (
    <>
      <div className="depth-sw" role="group" aria-label={t("depth.switcherAria")}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`depth-sw__btn${mode === m ? " depth-sw__btn--on" : ""}`}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
          >
            {t(`depth.mode.${m}`)}
          </button>
        ))}
      </div>
      <style>{`
        .depth-sw {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .depth-sw__btn {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.35);
          color: rgba(165, 178, 208, 0.82);
          font-size: 0.52rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 6px 12px;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .depth-sw__btn:hover {
          border-color: rgba(200, 210, 235, 0.35);
          color: rgba(220, 228, 245, 0.95);
        }
        .depth-sw__btn--on {
          border-color: rgba(130, 150, 220, 0.45);
          color: rgba(230, 235, 255, 0.98);
          background: rgba(80, 100, 180, 0.12);
        }
      `}</style>
    </>
  );
}
