import { useCallback, useMemo } from "react";
import type { ActionCommand, ActionCommandLayerSnapshot } from "../../lib/action-command/types";
import { SYSTEM_LABEL_RU } from "../../lib/execution-orchestrator/types";
import type { OrchestratorSystem } from "../../lib/execution-orchestrator/types";
import { useI18n } from "../../lib/i18n/I18nContext";

function ownerLabel(owner: string): string {
  const k = owner as OrchestratorSystem;
  return SYSTEM_LABEL_RU[k] ?? owner;
}

type Props = {
  layer: ActionCommandLayerSnapshot;
  onSaveMemory: () => void;
  onExportJson: () => void;
  onExportMd: () => void;
  onCopyJson: () => void;
};

export function OrchCommandLayer({ layer, onSaveMemory, onExportJson, onExportMd, onCopyJson }: Props) {
  const { t } = useI18n();
  const top = useMemo(() => layer.commands.find((c) => c.id === layer.topCommandId) ?? layer.commands[0] ?? null, [layer]);
  const blocked = useMemo(() => layer.commands.filter((c) => c.status === "blocked"), [layer.commands]);
  const queue = useMemo(() => layer.commands.filter((c) => c.status !== "blocked" && c.status !== "done"), [layer.commands]);
  const byOwner = useMemo(() => {
    const m = new Map<string, ActionCommand[]>();
    for (const c of layer.commands) {
      const arr = m.get(c.owner) ?? [];
      arr.push(c);
      m.set(c.owner, arr);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [layer.commands]);

  const riskBlock = useCallback(() => {
    const lines = layer.commands.slice(0, 5).map((c) => `${c.typeLabelRu}: ${c.riskIfIgnoredRu}`);
    return lines.join("\n");
  }, [layer.commands]);

  return (
    <section className="orch-cmd glass-panel" aria-label={t("orch.cmdAria")}>
      <header className="orch-cmd__head">
        <h2 className="orch-cmd__h2">{t("orch.cmdLayer")}</h2>
        <div className="orch-cmd__actions">
          <button type="button" className="orch-cmd__btn orch-cmd__btn--pri" onClick={onSaveMemory}>
            {t("orch.cmdSave")}
          </button>
          <button type="button" className="orch-cmd__btn" onClick={onExportJson}>
            {t("orch.cmdExportJson")}
          </button>
          <button type="button" className="orch-cmd__btn" onClick={onExportMd}>
            {t("orch.cmdExportMd")}
          </button>
          <button type="button" className="orch-cmd__btn" onClick={onCopyJson}>
            {t("orch.cmdCopyJson")}
          </button>
        </div>
      </header>

      {top ? (
        <div className="orch-cmd__top">
          <p className="orch-cmd__k">{t("orch.cmdTop")}</p>
          <p className="orch-cmd__title">{top.titleRu}</p>
          <div className="orch-cmd__row">
            <span className="orch-cmd__pill">{top.typeLabelRu}</span>
            <span className="orch-cmd__pill">{top.statusLabelRu}</span>
            <span className="orch-cmd__pill">P {top.priority}</span>
            <span className="orch-cmd__pill">{ownerLabel(top.owner)}</span>
          </div>
          <p className="orch-cmd__why">
            <em>{t("orch.cmdWhy")}</em> {top.reasonRu}
          </p>
          <p className="orch-cmd__block">
            <em>{t("orch.cmdBlocks")}</em> {top.dependenciesRu.join(" · ")}
          </p>
          <p className="orch-cmd__step">
            <em>{t("orch.cmdFirst")}</em> {top.firstStepRu}
          </p>
          <p className="orch-cmd__risk">
            <em>{t("orch.cmdRiskIf")}</em> {top.riskIfIgnoredRu}
          </p>
        </div>
      ) : null}

      <div className="orch-cmd__grid">
        <div className="orch-cmd__col">
          <p className="orch-cmd__k">{t("orch.cmdQueue")}</p>
          <ul className="orch-cmd__list">
            {queue.slice(0, 10).map((c) => (
              <li key={c.id} className={`orch-cmd__li${c.id === top?.id ? " orch-cmd__li--top" : ""}`}>
                <span className="orch-cmd__p">{c.priority}</span>
                <div>
                  <p className="orch-cmd__t">{c.titleRu}</p>
                  <p className="orch-cmd__m">{c.typeLabelRu} · {c.statusLabelRu}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="orch-cmd__col">
          <p className="orch-cmd__k">{t("orch.cmdBlocked")}</p>
          {!blocked.length ? <p className="orch-cmd__empty">{t("orch.cmdNoBlocked")}</p> : null}
          <ul className="orch-cmd__list orch-cmd__list--dim">
            {blocked.slice(0, 8).map((c) => (
              <li key={c.id} className="orch-cmd__li">
                <span className="orch-cmd__p">{c.priority}</span>
                <div>
                  <p className="orch-cmd__t">{c.titleRu}</p>
                  <p className="orch-cmd__m">{c.statusLabelRu}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="orch-cmd__owners">
        <p className="orch-cmd__k">{t("orch.cmdByOwner")}</p>
        <div className="orch-cmd__owner-grid">
          {byOwner.map(([owner, cmds]) => (
            <div key={owner} className="orch-cmd__owner-cell">
              <span className="orch-cmd__on">{ownerLabel(owner)}</span>
              <span className="orch-cmd__oc">{cmds.length}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="orch-cmd__riskbox">
        <p className="orch-cmd__k">{t("orch.cmdRiskPanel")}</p>
        <pre className="orch-cmd__pre">{riskBlock()}</pre>
      </div>

      <style>{`
        .orch-cmd {
          padding: 18px 20px 20px;
          margin-bottom: 16px;
          border-radius: var(--radius-xl, 14px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: radial-gradient(100% 80% at 50% 0%, rgba(48, 54, 72, 0.45), rgba(6, 8, 12, 0.94));
        }
        .orch-cmd__head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        .orch-cmd__h2 {
          margin: 0;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(140, 152, 180, 0.55);
        }
        .orch-cmd__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .orch-cmd__btn {
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.3);
          color: rgba(175, 186, 210, 0.85);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 12px;
          cursor: pointer;
        }
        .orch-cmd__btn--pri {
          border-color: rgba(125, 145, 210, 0.4);
          color: rgba(230, 234, 248, 0.95);
        }
        .orch-cmd__top {
          padding: 14px 16px;
          margin-bottom: 16px;
          border-radius: 12px;
          border: 1px solid rgba(125, 145, 210, 0.22);
          background: rgba(0, 0, 0, 0.35);
        }
        .orch-cmd__k {
          margin: 0 0 8px;
          font-size: 0.52rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.55);
        }
        .orch-cmd__title {
          margin: 0 0 10px;
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.3;
          color: rgba(225, 230, 245, 0.96);
        }
        .orch-cmd__row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .orch-cmd__pill {
          font-size: 0.52rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 9px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(170, 182, 210, 0.75);
        }
        .orch-cmd__why,
        .orch-cmd__block,
        .orch-cmd__step,
        .orch-cmd__risk {
          margin: 0 0 8px;
          font-size: 0.74rem;
          line-height: 1.45;
          color: rgba(155, 168, 195, 0.82);
        }
        .orch-cmd__why em,
        .orch-cmd__block em,
        .orch-cmd__step em,
        .orch-cmd__risk em {
          font-style: normal;
          font-size: 0.52rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(120, 132, 160, 0.55);
          margin-right: 6px;
        }
        .orch-cmd__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 720px) {
          .orch-cmd__grid {
            grid-template-columns: 1fr;
          }
        }
        .orch-cmd__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .orch-cmd__list--dim .orch-cmd__t {
          opacity: 0.85;
        }
        .orch-cmd__li {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.22);
        }
        .orch-cmd__li--top {
          border-color: rgba(125, 145, 210, 0.25);
        }
        .orch-cmd__p {
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(160, 175, 210, 0.65);
        }
        .orch-cmd__t {
          margin: 0 0 4px;
          font-size: 0.72rem;
          color: rgba(210, 218, 238, 0.9);
          line-height: 1.3;
        }
        .orch-cmd__m {
          margin: 0;
          font-size: 0.6rem;
          color: rgba(130, 142, 168, 0.6);
        }
        .orch-cmd__owners {
          margin-bottom: 14px;
        }
        .orch-cmd__owner-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .orch-cmd__owner-cell {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }
        .orch-cmd__on {
          font-size: 0.62rem;
          color: rgba(175, 188, 215, 0.8);
        }
        .orch-cmd__oc {
          font-size: 0.58rem;
          color: rgba(130, 145, 175, 0.55);
        }
        .orch-cmd__riskbox {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .orch-cmd__empty {
          margin: 0 0 8px;
          font-size: 0.68rem;
          color: rgba(130, 142, 168, 0.45);
        }
          margin: 0;
          font-family: var(--font-body, system-ui);
          font-size: 0.68rem;
          line-height: 1.45;
          color: rgba(150, 162, 188, 0.72);
          white-space: pre-wrap;
        }
      `}</style>
    </section>
  );
}
