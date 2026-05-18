import type { ReactNode } from "react";

type Props = {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
};

/** Archive / secondary intelligence — collapsed by default */
export function CollapsibleSection({ id, title, children, className = "" }: Props) {
  return (
    <details id={id} className={`os-collapsible ${className}`.trim()}>
      <summary className="os-collapsible__summary">{title}</summary>
      <div className="os-collapsible__body">{children}</div>
    </details>
  );
}
