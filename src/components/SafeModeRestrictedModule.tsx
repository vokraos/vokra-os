import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = {
  moduleLabelKey: string;
  onNavigate: (id: NavId) => void;
};

export function SafeModeRestrictedModule({ moduleLabelKey, onNavigate }: Props) {
  const { t } = useI18n();
  return (
    <div className="safe-mode-restricted glass-panel">
      <h1>{t(moduleLabelKey)}</h1>
      <p className="safe-mode-restricted__msg">{t("safe.restricted.body")}</p>
      <div className="safe-mode-restricted__actions">
        <button type="button" className="primary-btn" onClick={() => onNavigate("safeMode")}>
          {t("nav.safeMode")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => onNavigate("osHealthAudit")}>
          {t("nav.osHealthAudit")}
        </button>
      </div>
    </div>
  );
}
