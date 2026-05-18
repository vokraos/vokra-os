import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function OpsSurfaceCard({ title, subtitle, meta, children, className = "" }: Props) {
  return (
    <article className={`glass-panel ops-card ${className}`.trim()}>
      <header className="ops-card__head">
        <div>
          <h3 className="ops-card__title">{title}</h3>
          {subtitle && <p className="ops-card__sub">{subtitle}</p>}
        </div>
        {meta && <div className="ops-card__meta">{meta}</div>}
      </header>
      <div className="ops-card__body">{children}</div>
    </article>
  );
}
