import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { empireHeroTriad, type HeroRole } from "../../lib/cognitive-depth/sku-empire";
import { skuLifecycleLineKey, skuLifecycleState } from "../../lib/cognitive-depth/market-war-os";
import { heroSkuDramaMessageKey } from "../../lib/cognitive-depth/strategic-organism";

const ROLE_KEYS: Record<HeroRole, string> = {
  hero: "depth.hero.role.hero",
  support: "depth.hero.role.support",
  amplifier: "depth.hero.role.amplifier",
  anchor: "depth.hero.role.anchor",
  saturation: "depth.hero.role.saturation",
  refresh: "depth.hero.role.refresh",
};

export function HeroSkuTriad({ seed, variant }: { seed: number; variant: "dashboard" | "mission" | "orchestrator" }) {
  const { t } = useI18n();
  const cards = useMemo(() => empireHeroTriad(seed), [seed]);

  return (
    <>
      <div className={`hero-triad hero-triad--${variant}`} aria-label={t("depth.hero.aria")}>
        {cards.map((c, hi) => {
          const life = skuLifecycleState(seed, hi);
          return (
            <div key={c.id} className="hero-triad__card" data-sku-life={life}>
              <span className="hero-triad__id">{c.id}</span>
              <span className="hero-triad__print">{c.print}</span>
              <span className="hero-triad__corridor">{c.corridor}</span>
              <span className="hero-triad__role">{t(ROLE_KEYS[c.role])}</span>
              <span className="hero-triad__life">{t(skuLifecycleLineKey(life))}</span>
              <span className="hero-triad__drama">{t(heroSkuDramaMessageKey(seed, hi), { corridor: c.corridor })}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .hero-triad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 0 0 12px;
        }
        @media (max-width: 720px) {
          .hero-triad {
            grid-template-columns: 1fr;
          }
        }
        .hero-triad__card {
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 8px 10px;
          background: rgba(0, 0, 0, 0.42);
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.25);
        }
        .hero-triad__id {
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: rgba(200, 210, 235, 0.9);
          font-weight: 600;
        }
        .hero-triad__print {
          font-size: 0.68rem;
          color: rgba(165, 175, 198, 0.82);
          line-height: 1.25;
        }
        .hero-triad__corridor {
          font-size: 0.58rem;
          color: rgba(130, 145, 175, 0.65);
        }
        .hero-triad__role {
          margin-top: 4px;
          font-size: 0.48rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(123, 143, 255, 0.75);
        }
        .hero-triad__life {
          margin-top: 4px;
          font-size: 0.58rem;
          line-height: 1.3;
          color: rgba(150, 160, 185, 0.72);
        }
        .hero-triad__drama {
          margin-top: 3px;
          font-size: 0.54rem;
          line-height: 1.3;
          color: rgba(195, 175, 165, 0.68);
          font-style: italic;
        }
      `}</style>
    </>
  );
}
