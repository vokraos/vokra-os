import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { MicroSig } from "../../lib/cognitive-depth/sku-empire";

export function SkuEmpireTicker({ signals, variant }: { signals: readonly MicroSig[]; variant: string }) {
  const { t } = useI18n();
  const line = useMemo(
    () =>
      signals
        .map((s) => t(s.key, s.vars))
        .filter(Boolean)
        .join(" · "),
    [signals, t],
  );

  return (
    <>
      <p className={`sku-tick sku-tick--${variant}`} role="status">
        {line}
      </p>
      <style>{`
        .sku-tick {
          margin: 0;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.28);
          font-size: 0.62rem;
          line-height: 1.35;
          color: rgba(155, 168, 195, 0.78);
          letter-spacing: 0.02em;
        }
      `}</style>
    </>
  );
}
