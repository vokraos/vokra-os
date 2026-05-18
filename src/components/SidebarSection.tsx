type Props = {
  summary: string;
  open?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function SidebarSection({ summary, open = false, className = "", children }: Props) {
  return (
    <details className={`sidebar__group${className ? ` ${className}` : ""}`} open={open}>
      <summary className="sidebar__group-sum">{summary}</summary>
      <div className="sidebar__group-body">{children}</div>
    </details>
  );
}
