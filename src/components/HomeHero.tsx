import type { NavId } from "../types";
import { TeeMockup } from "./TeeMockup";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = {
  onNavigate: (id: NavId) => void;
};

export function HomeHero({ onNavigate }: Props) {
  const { t } = useI18n();
  return (
    <section className="home-hero">
      <div className="home-hero__grid">
        <div className="home-hero__copy">
          <p className="eyebrow">{t("onboarding.heroEyebrow")}</p>
          <p className="home-hero__logotype">VOKRA</p>
          <h1 className="home-hero__title">
            {t("home.contentWord")}
            <span className="home-hero__title-sub">{t("home.engineWord")}</span>
          </h1>
          <p className="home-hero__subtitle">{t("onboarding.heroSubtitle")}</p>
          <p className="home-hero__lede">{t("onboarding.heroLede")}</p>
          <div className="home-hero__cta">
            <button type="button" className="generate-btn" onClick={() => onNavigate("visual")}>
              {t("onboarding.ctaVisual")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("rich")}>
              {t("onboarding.ctaRich")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("dashboard")}>
              {t("onboarding.ctaDash")}
            </button>
          </div>
          <div className="home-hero__metrics">
            <div className="glass-panel home-hero__mini glass-panel--hover">
              <span className="home-hero__mini-label">{t("onboarding.metricLatency")}</span>
              <span className="home-hero__mini-value">~1.1s</span>
            </div>
            <div className="glass-panel home-hero__mini glass-panel--hover">
              <span className="home-hero__mini-label">{t("onboarding.metricModules")}</span>
              <span className="home-hero__mini-value">10</span>
            </div>
            <div className="glass-panel home-hero__mini glass-panel--hover">
              <span className="home-hero__mini-label">{t("onboarding.metricBrand")}</span>
              <span className="home-hero__mini-value">DNA</span>
            </div>
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="home-hero__orbit glass-panel">
            <div className="home-hero__film-grain" aria-hidden />
            <TeeMockup />
          </div>
        </div>
      </div>
      <style>{`
        .home-hero {
          padding-bottom: 12px;
        }
        .home-hero__grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: clamp(28px, 4vw, 56px);
          align-items: center;
        }
        .home-hero__logotype {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(2rem, 4vw, 2.75rem);
          letter-spacing: 0.42em;
          margin: 0 0 10px;
          color: rgba(244, 243, 239, 0.92);
        }
        .home-hero__title {
          font-size: clamp(2.8rem, 6.5vw, 4.8rem);
          line-height: 0.95;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .home-hero__title-sub {
          display: block;
          font-weight: 800;
          background: linear-gradient(120deg, #fff 0%, rgba(123, 143, 255, 0.95) 45%, rgba(255, 255, 255, 0.75) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 40px rgba(123, 143, 255, 0.35);
        }
        .home-hero__subtitle {
          margin-top: 18px;
          font-size: 0.78rem;
          letter-spacing: 0.38em;
          color: var(--muted);
        }
        .home-hero__lede {
          margin-top: 22px;
          max-width: 520px;
          font-size: 1rem;
        }
        .home-hero__cta {
          margin-top: 32px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .home-hero__metrics {
          margin-top: 36px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .home-hero__mini {
          padding: 14px 18px;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .home-hero__mini-label {
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .home-hero__mini-value {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
        }
        .home-hero__visual {
          position: relative;
        }
        .home-hero__orbit {
          position: relative;
          padding: clamp(20px, 3vw, 36px);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .home-hero__film-grain {
          position: absolute;
          inset: 0;
          opacity: 0.12;
          pointer-events: none;
          background-image: repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.03) 0,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: soft-light;
        }
        @media (max-width: 960px) {
          .home-hero__grid {
            grid-template-columns: 1fr;
          }
          .home-hero__copy {
            text-align: center;
          }
          .home-hero__lede {
            margin-left: auto;
            margin-right: auto;
          }
          .home-hero__cta,
          .home-hero__metrics {
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
