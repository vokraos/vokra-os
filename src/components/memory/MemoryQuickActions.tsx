import { useI18n } from "../../lib/i18n/I18nContext";

type Props = {
  dense?: boolean;
  onOpen?: () => void;
  onDuplicate?: () => void;
  onExportMd?: () => void;
  onExportTxt?: () => void;
  onExportJson?: () => void;
  onDelete?: () => void;
  onRerun?: () => void;
};

export function MemoryQuickActions({
  dense,
  onOpen,
  onDuplicate,
  onExportMd,
  onExportTxt,
  onExportJson,
  onDelete,
  onRerun,
}: Props) {
  const { t } = useI18n();
  return (
    <div className={`mqa ${dense ? "mqa--dense" : ""}`}>
      {onOpen && (
        <button type="button" className="ghost-btn mqa__btn" onClick={onOpen}>
          {t("memory.actionReopen")}
        </button>
      )}
      {onRerun && (
        <button type="button" className="ghost-btn mqa__btn" onClick={onRerun}>
          {t("memory.actionRerun")}
        </button>
      )}
      {onDuplicate && (
        <button type="button" className="ghost-btn mqa__btn" onClick={onDuplicate}>
          {t("memory.actionDuplicate")}
        </button>
      )}
      {onExportMd && (
        <button type="button" className="ghost-btn mqa__btn" onClick={onExportMd}>
          {t("memory.actionExportMd")}
        </button>
      )}
      {onExportTxt && (
        <button type="button" className="ghost-btn mqa__btn" onClick={onExportTxt}>
          {t("memory.actionExportTxt")}
        </button>
      )}
      {onExportJson && (
        <button type="button" className="ghost-btn mqa__btn" onClick={onExportJson}>
          {t("memory.actionExportJson")}
        </button>
      )}
      {onDelete && (
        <button type="button" className="ghost-btn mqa__btn mqa__btn--danger" onClick={onDelete}>
          {t("memory.actionDelete")}
        </button>
      )}
      <style>{`
        .mqa {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .mqa--dense .mqa__btn {
          padding: 6px 10px;
          font-size: 0.65rem;
        }
        .mqa__btn--danger {
          border-color: rgba(255, 90, 90, 0.35);
          color: rgba(255, 170, 170, 0.95);
        }
      `}</style>
    </div>
  );
}
