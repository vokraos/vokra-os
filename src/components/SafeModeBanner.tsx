import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { exitSafeMode } from "../lib/safe-mode";

type Props = { onNavigate: (id: NavId) => void };

export function SafeModeBanner({ onNavigate }: Props) {
  const { t } = useI18n();
  return (
    <div className="safe-mode-banner" role="status">
      <span className="safe-mode-banner__txt">{t("safe.banner.message")}</span>
      <button type="button" className="safe-mode-banner__link" onClick={() => onNavigate("safeMode")}>
        {t("safe.banner.open")}
      </button>
      <button type="button" className="safe-mode-banner__exit" onClick={() => exitSafeMode()}>
        {t("safe.banner.exit")}
      </button>
    </div>
  );
}
