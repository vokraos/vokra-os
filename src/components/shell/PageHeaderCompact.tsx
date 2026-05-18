import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  purpose?: string;
  actions?: ReactNode;
  /** Optional secondary row (e.g. compact links) */
  meta?: ReactNode;
};

/** Disciplined module header — slim, no giant hero chrome */
export function PageHeaderCompact({ eyebrow, title, purpose, actions, meta }: Props) {
  return (
    <header className="page-header-compact">
      <div className="page-header-compact__row">
        <div className="page-header-compact__text">
          <p className="page-header-compact__eyebrow">{eyebrow}</p>
          <h1 className="page-header-compact__title">{title}</h1>
          {purpose ? <p className="page-header-compact__purpose">{purpose}</p> : null}
        </div>
        {actions ? <div className="page-header-compact__actions">{actions}</div> : null}
      </div>
      {meta ? <div className="page-header-compact__meta">{meta}</div> : null}
    </header>
  );
}
