type Props = { signalHealth: number };

export function SidebarSignalBar({ signalHealth }: Props) {
  return (
    <span className="sidebar__link-cog" aria-hidden>
      <span
        className="sidebar__link-cog-fill"
        style={{ transform: `scaleX(${signalHealth / 100})` }}
      />
    </span>
  );
}
