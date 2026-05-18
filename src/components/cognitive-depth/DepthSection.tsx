import type { ReactNode } from "react";
import type { SectionRole } from "../../lib/cognitive-depth/types";

type Props = { role: SectionRole; children: ReactNode };

export function DepthSection({ role, children }: Props) {
  if (role === "hidden") return null;
  return (
    <div className={`dsec dsec--${role}`} data-depth-section={role}>
      {children}
      <style>{`
        .dsec {
          position: relative;
        }
        .dsec--secondary {
          opacity: 0.88;
          margin-top: 4px;
        }
        .dsec--secondary::before {
          content: "";
          display: block;
          height: 1px;
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
