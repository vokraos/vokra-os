import type { NavId } from "../types";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { navMessageKey } from "../lib/i18n/navLabels";
import {
  OPERATING_ROLE_MODES,
  ROLE_MODE_DEFAULT_LANDING,
  ROLE_MODE_PRIORITY_NAV,
  OPERATING_ROLE_MODE_EVENT,
  useOperatingRoleMode,
} from "../lib/operating-role-mode";
import {
  loadSimplificationBacklogState,
  navIdsAcceptedHideFromDaily,
  SIMPLIFICATION_BACKLOG_CHANGED_EVENT,
} from "../lib/simplification-backlog";

type Props = {
  collapsed?: boolean;
  onQuickNav?: (id: NavId) => void;
};

export function OperatingModeSwitcher({ collapsed = false, onQuickNav }: Props) {
  const { t } = useI18n();
  const { mode, setMode } = useOperatingRoleMode();
  const [simTick, setSimTick] = useState(0);

  useEffect(() => {
    const bump = () => setSimTick((x) => x + 1);
    window.addEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
    window.addEventListener(OPERATING_ROLE_MODE_EVENT, bump);
    return () => {
      window.removeEventListener(SIMPLIFICATION_BACKLOG_CHANGED_EVENT, bump);
      window.removeEventListener(OPERATING_ROLE_MODE_EVENT, bump);
    };
  }, []);

  const compressHints = useMemo(() => {
    void simTick;
    return navIdsAcceptedHideFromDaily(loadSimplificationBacklogState());
  }, [simTick, mode]);

  return (
    <div className="orm-switcher" data-collapsed={collapsed ? "1" : undefined}>
      <p className="orm-switcher__label">{t("orm.label")}</p>
      <div className="orm-switcher__seg" role="group" aria-label={t("orm.label")}>
        {OPERATING_ROLE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`orm-switcher__btn${mode === m ? " orm-switcher__btn--on" : ""}`}
            aria-pressed={mode === m}
            title={t(`orm.mode.${m}`)}
            onClick={() => setMode(m)}
          >
            <span className="orm-switcher__btn-full">{t(`orm.mode.${m}`)}</span>
            <span className="orm-switcher__btn-short" aria-hidden>
              {t(`orm.modeAbbr.${m}`)}
            </span>
          </button>
        ))}
      </div>
      {onQuickNav && !collapsed ? (
        <div className="orm-quick">
          {ROLE_MODE_PRIORITY_NAV[mode].map((id) => (
            <button key={id} type="button" className="orm-quick__link" onClick={() => onQuickNav(id)}>
              {t(navMessageKey(id))}
            </button>
          ))}
          <button
            type="button"
            className="orm-quick__link orm-quick__link--land"
            onClick={() => onQuickNav(ROLE_MODE_DEFAULT_LANDING[mode])}
          >
            {t("orm.openDay")}
          </button>
        </div>
      ) : null}
      {onQuickNav && !collapsed && mode === "founder" && compressHints.length ? (
        <p className="orm-compress-hint">
          {t("orm.compressNav.hint", { modules: compressHints.map((id) => t(navMessageKey(id))).join(", ") })}{" "}
          <button type="button" className="orm-quick__link" onClick={() => onQuickNav("osSimplification")}>
            {t("nav.osSimplification")}
          </button>
        </p>
      ) : null}
      <style>{`
        .orm-switcher {
          margin-bottom: 14px;
          padding: 0 0 14px;
          border-bottom: 1px solid var(--line-faint);
        }
        .orm-switcher__label {
          margin: 0 0 8px;
          font-size: 0.52rem;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: rgba(148, 165, 210, 0.60);
          font-weight: 600;
        }
        .orm-switcher__seg {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          background: rgba(0, 0, 0, 0.32);
          border-radius: 9px;
          border: 1px solid var(--line-faint);
          padding: 3px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.48);
        }
        .orm-switcher__btn {
          border: none;
          background: transparent;
          color: rgba(180, 178, 220, 0.58);
          font-family: var(--font-ui);
          font-size: 0.60rem;
          font-weight: 500;
          padding: 6px 3px;
          border-radius: 6px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.14s var(--ease-out), color 0.14s var(--ease-out),
                      box-shadow 0.14s var(--ease-out);
        }
        .orm-switcher__btn-short { display: none; }
        .orm-switcher__btn:hover:not(.orm-switcher__btn--on) {
          color: rgba(225, 220, 255, 0.88);
          background: rgba(255, 255, 255, 0.06);
        }
        .orm-switcher__btn--on {
          color: rgba(230, 226, 255, 0.97);
          background: rgba(255, 255, 255, 0.10);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            0 1px 3px rgba(0, 0, 0, 0.42);
        }
        .orm-switcher[data-collapsed="1"] .orm-switcher__label { display: none; }
        .orm-switcher[data-collapsed="1"] .orm-switcher__seg {
          grid-template-columns: 1fr;
        }
        .orm-switcher[data-collapsed="1"] .orm-switcher__btn-full { display: none; }
        .orm-switcher[data-collapsed="1"] .orm-switcher__btn-short { display: inline; }
        .orm-quick {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }
        .orm-quick__link {
          border: none;
          background: rgba(123, 143, 255, 0.12);
          color: rgba(168, 200, 255, 0.90);
          font-size: 0.66rem;
          padding: 4px 9px;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-body);
          transition: background 0.18s, color 0.18s;
        }
        .orm-quick__link:hover {
          background: rgba(123, 143, 255, 0.24);
          color: rgba(195, 218, 255, 0.98);
        }
        .orm-quick__link--land {
          background: rgba(138, 98, 218, 0.16);
          color: rgba(202, 160, 255, 0.90);
        }
        .orm-quick__link--land:hover {
          background: rgba(138, 98, 218, 0.28);
          color: rgba(220, 185, 255, 0.98);
        }
        .orm-compress-hint {
          margin: 10px 0 0;
          font-size: 0.68rem;
          line-height: 1.48;
          color: rgba(200, 212, 235, 0.80);
        }
        @media (max-width: 1200px) {
          .orm-switcher__btn-full { display: none; }
          .orm-switcher__btn-short { display: inline; }
        }
      `}</style>
    </div>
  );
}