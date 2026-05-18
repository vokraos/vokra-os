import type { NavId } from "../types";
import { useMemo } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { buildSidebarNavLayout, ROLE_MODE_GLOBAL_NAV_IDS, useOperatingRoleMode } from "../lib/operating-role-mode";
import { OperatingModeSwitcher } from "./OperatingModeSwitcher";
import { useCleanDayMode, applyCleanDayToSidebarLayout, setCleanDayModeEnabled } from "../lib/clean-day-mode";
import { SidebarLink } from "./SidebarLink";
import { SidebarSection } from "./SidebarSection";
import "./Sidebar.css";

type Props = {
  active: NavId;
  onNavigate: (id: NavId) => void;
  onHome: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  focusMode?: boolean;
};

export function Sidebar({
  active,
  onNavigate,
  onHome,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapsed,
  focusMode = false,
}: Props) {
  const { t } = useI18n();
  const { mode: roleMode } = useOperatingRoleMode();
  const cleanDay = useCleanDayMode();

  const { primaryIds, moreIds } = useMemo(() => {
    const base = buildSidebarNavLayout(roleMode, active);
    if (!cleanDay.enabled || !cleanDay.hiddenNavIds.length) return base;
    return applyCleanDayToSidebarLayout({
      primaryIds: base.primaryIds,
      moreIds: base.moreIds,
      active,
      hiddenNavIds: cleanDay.hiddenNavIds,
    });
  }, [roleMode, active, cleanDay.enabled, cleanDay.hiddenNavIds]);

  const linkProps = { active, focusMode, onNavigate, onCloseMobile };

  return (
    <aside
      id="app-sidebar"
      className={`sidebar glass-panel ${mobileOpen ? "sidebar--open" : ""} ${collapsed ? "sidebar--collapsed" : ""}`}
    >
      <button
        type="button"
        className={`sidebar__brand ${active === "home" ? "sidebar__brand--home" : ""}`}
        onClick={() => {
          onHome();
          onCloseMobile();
        }}
      >
        <span className="sidebar__logo">VOKRA</span>
        <span className="sidebar__engine">{t("sidebar.engine")}</span>
      </button>
      <button type="button" className="sidebar__collapse-btn" onClick={onToggleCollapsed} aria-pressed={collapsed}>
        {collapsed ? t("shell.sidebarExpand") : t("shell.sidebarCollapse")}
      </button>
      <OperatingModeSwitcher collapsed={collapsed} onQuickNav={onNavigate} />
      <div className="sidebar__clean-day" data-collapsed={collapsed ? "1" : undefined}>
        <label className="sidebar__clean-day-row">
          <input
            type="checkbox"
            checked={cleanDay.enabled}
            onChange={(e) => {
              setCleanDayModeEnabled(e.target.checked);
            }}
          />
          <span>{t("orm.cleanDay.toggle")}</span>
        </label>
        {cleanDay.enabled && cleanDay.hiddenNavIds.length > 0 ? (
          <span className="sidebar__clean-day-count">{t("orm.cleanDay.hiddenCount", { n: String(cleanDay.hiddenNavIds.length) })}</span>
        ) : null}
        <button type="button" className="sidebar__clean-day-link" onClick={() => onNavigate("osSimplification")}>
          {t("orm.cleanDay.manage")}
        </button>
      </div>
      <nav className="sidebar__nav" aria-label={t("shell.navAria")}>
        {collapsed ? (
          [...primaryIds, ...moreIds, ...ROLE_MODE_GLOBAL_NAV_IDS].map((id) => (
            <SidebarLink key={id} id={id} {...linkProps} />
          ))
        ) : (
          <>
            <SidebarSection summary={t("orm.nav.group")} className="sidebar__group--role" open>
              {primaryIds.map((id) => (
                <SidebarLink key={id} id={id} {...linkProps} />
              ))}
            </SidebarSection>
            {moreIds.length ? (
              <SidebarSection summary={t("orm.nav.allModules")}>
                {moreIds.map((id) => (
                  <SidebarLink key={id} id={id} {...linkProps} />
                ))}
              </SidebarSection>
            ) : null}
            <SidebarSection summary={t("nav.group.ops")} open>
              {ROLE_MODE_GLOBAL_NAV_IDS.map((id) => (
                <SidebarLink key={id} id={id} {...linkProps} />
              ))}
            </SidebarSection>
          </>
        )}
      </nav>
      <div className="sidebar__footer">
        <div className="metric-pill">
          <span className="dot-pulse" aria-hidden />
          {t("sidebar.footer")}
        </div>
        <p className="sidebar__version">{t("sidebar.version")}</p>
      </div>
    </aside>
  );
}
