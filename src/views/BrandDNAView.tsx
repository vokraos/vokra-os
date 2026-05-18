import { useEffect } from "react";
import { getBrandConstitution } from "../lib/brand-dna";
import type { RiskFlagLevel } from "../lib/brand-dna/types";
import { useCognitiveOs } from "../lib/cognitive-os";
import { useSignalFabricOptional } from "../lib/signal-fabric/context";
import { useI18n } from "../lib/i18n/I18nContext";
import type { NavId } from "../types";

const C = getBrandConstitution();

function riskLabel(level: RiskFlagLevel): string {
  switch (level) {
    case "high":
      return "высокий";
    case "med":
      return "средний";
    default:
      return "низкий";
  }
}

export function BrandDNAView({ onNavigate }: { onNavigate?: (id: NavId) => void }) {
  const { t } = useI18n();
  const { setBrandDnaSurfaceActive } = useCognitiveOs();
  const fabric = useSignalFabricOptional();

  useEffect(() => {
    setBrandDnaSurfaceActive(true);
    return () => setBrandDnaSurfaceActive(false);
  }, [setBrandDnaSurfaceActive]);

  return (
    <div className="view bdna">
      <header className="view__header bdna__header">
        <p className="eyebrow">{t("dna.eyebrow")}</p>
        <h2 className="view__title">{t("dna.title")}</h2>
        <p className="view__desc">{t("dna.desc")}</p>
        <div className="bdna__meta">
          <span className="bdna__meta-pill">конституция v{C.version}</span>
          {C.revisionNote ? <span className="bdna__meta-note">{C.revisionNote}</span> : null}
        </div>
      </header>

      {fabric ? (
        <p className="bdna__fabric-hint glass-panel">
          Сигнальная сеть:{" "}
          {fabric.conflicts.find((c) => c.modules.includes("dna"))?.labelRu ??
            "конфликтный периметр в норме — constraint layer активен."}
        </p>
      ) : null}

      {onNavigate ? (
        <p className="bdna__fabric-hint glass-panel bdna__vi-bridge">
          <button type="button" className="bdna__vi-link" onClick={() => onNavigate("visualStrategy")}>
            {t("nav.visualStrategy")}
          </button>
          <span className="bdna__vi-note"> — {t("visualStrategy.lede").slice(0, 120)}…</span>
        </p>
      ) : null}

      <div className="bdna__stack">
        <article className="glass-panel bdna__section" id="bdna-core">
          <div className="bdna__section-head">
            <span className="bdna__section-k">01</span>
            <div>
              <h3 className="bdna__section-title">Ядро бренда</h3>
              <p className="bdna__section-sub">BRAND CORE · источник смысла</p>
            </div>
          </div>
          <p className="bdna__lede">{C.core.whatIs}</p>
          <dl className="bdna__dl">
            <div>
              <dt>Миссия</dt>
              <dd>{C.core.mission}</dd>
            </div>
            <div>
              <dt>Философия</dt>
              <dd>{C.core.philosophy}</dd>
            </div>
            <div>
              <dt>Враг бренда</dt>
              <dd>{C.core.enemy}</dd>
            </div>
            <div>
              <dt>Обещание</dt>
              <dd>{C.core.promise}</dd>
            </div>
            <div>
              <dt>Внутренний мантра</dt>
              <dd className="bdna__mantra">{C.core.mantra}</dd>
            </div>
          </dl>
        </article>

        <article className="glass-panel bdna__section" id="bdna-product">
          <div className="bdna__section-head">
            <span className="bdna__section-k">02</span>
            <div>
              <h3 className="bdna__section-title">Продуктовая ДНК</h3>
              <p className="bdna__section-sub">PRODUCT DNA · масштаб категорий</p>
            </div>
          </div>
          <p className="bdna__p">{C.product.intro}</p>
          <ul className="bdna__bullets">
            <li>
              <strong>Сейчас — производство:</strong> {C.product.currentEngine}
            </li>
            <li>
              <strong>База запуска:</strong> {C.product.currentLaunchBase}
            </li>
          </ul>
          <p className="bdna__label">Расширение линейки</p>
          <ul className="bdna__tags">
            {C.product.futureExpansion.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="bdna__label">Правила</p>
          <ol className="bdna__ol">
            {C.product.rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </article>

        <div className="bdna__grid2">
          <article className="glass-panel bdna__section" id="bdna-visual">
            <div className="bdna__section-head">
              <span className="bdna__section-k">03</span>
              <div>
                <h3 className="bdna__section-title">Визуальная ДНК</h3>
                <p className="bdna__section-sub">VISUAL DNA · кинематограф и контроль</p>
              </div>
            </div>
            <p className="bdna__label">Опоры</p>
            <ul className="bdna__bullets">
              {C.visual.pillars.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="bdna__label">Запрещённые паттерны</p>
            <ul className="bdna__bullets bdna__bullets--warn">
              {C.visual.forbidden.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="bdna__label">Акценты</p>
            <ul className="bdna__bullets">
              {C.visual.accents.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>

          <article className="glass-panel bdna__section" id="bdna-tokens">
            <div className="bdna__section-head">
              <span className="bdna__section-k">·</span>
              <div>
                <h3 className="bdna__section-title">Токены интерфейса</h3>
                <p className="bdna__section-sub">связь продукта и OS</p>
              </div>
            </div>
            <div className="bdna__swatches">
              {C.designTokens.colors.map((c) => (
                <div key={c.hex} className="bdna__swatch">
                  <span className="bdna__swatch-chip" style={{ background: c.hex }} />
                  <div>
                    <p className="bdna__swatch-name">{c.name}</p>
                    <p className="bdna__swatch-meta">
                      {c.hex} · {c.usage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <ul className="bdna__type-list">
              {C.designTokens.typography.map((row) => (
                <li key={row.role}>
                  <strong>{row.role}</strong>
                  <span>{row.font}</span>
                  <p>{row.note}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <article className="glass-panel bdna__section" id="bdna-voice">
          <div className="bdna__section-head">
            <span className="bdna__section-k">04</span>
            <div>
              <h3 className="bdna__section-title">Голос бренда</h3>
              <p className="bdna__section-sub">BRAND VOICE · русский первично</p>
            </div>
          </div>
          <ul className="bdna__tags bdna__tags--inline">
            {C.voice.toneBullets.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className="bdna__voice-cols">
            <div>
              <p className="bdna__label bdna__label--ok">Хорошо</p>
              <ul className="bdna__examples bdna__examples--ok">
                {C.voice.goodExamples.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="bdna__label bdna__label--bad">Плохо</p>
              <ul className="bdna__examples bdna__examples--bad">
                {C.voice.badExamples.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="glass-panel bdna__section" id="bdna-customer">
          <div className="bdna__section-head">
            <span className="bdna__section-k">05</span>
            <div>
              <h3 className="bdna__section-title">Психология покупателя</h3>
              <p className="bdna__section-sub">CUSTOMER PSYCHOLOGY</p>
            </div>
          </div>
          <ul className="bdna__bullets">
            {C.customer.audienceBullets.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className="bdna__callout">
            <span className="bdna__callout-k">напряжение</span>
            <p>{C.customer.tension}</p>
          </div>
        </article>

        <article className="glass-panel bdna__section" id="bdna-mp">
          <div className="bdna__section-head">
            <span className="bdna__section-k">06</span>
            <div>
              <h3 className="bdna__section-title">Адаптация под WB / Ozon</h3>
              <p className="bdna__section-sub">MARKETPLACE ADAPTATION</p>
            </div>
          </div>
          <ol className="bdna__ol">
            {C.marketplace.rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </article>

        <article className="glass-panel bdna__section" id="bdna-production">
          <div className="bdna__section-head">
            <span className="bdna__section-k">07</span>
            <div>
              <h3 className="bdna__section-title">Производственный контур</h3>
              <p className="bdna__section-sub">PRODUCTION CONSTRAINTS</p>
            </div>
          </div>
          <ul className="bdna__bullets">
            {C.production.constraints.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="bdna__label">Оценка идеи (измерения)</p>
          <ul className="bdna__checklist">
            {C.production.scoringDimensions.map((x) => (
              <li key={x}>
                <span className="bdna__check" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-panel bdna__section" id="bdna-genome">
          <div className="bdna__section-head">
            <span className="bdna__section-k">08</span>
            <div>
              <h3 className="bdna__section-title">Геном VOKRA</h3>
              <p className="bdna__section-sub">FASHION GENOME · 0–100 для модулей AI</p>
            </div>
          </div>
          <div className="bdna__genome">
            {C.genome.map((g) => (
              <div key={g.id} className="bdna__genome-row">
                <div className="bdna__genome-top">
                  <span className="bdna__genome-label">{g.label}</span>
                  <span className="bdna__genome-val">{g.value}</span>
                </div>
                <div className="bdna__meter" aria-hidden>
                  <span className="bdna__meter-fill" style={{ width: `${g.value}%` }} />
                </div>
                {g.hint ? <p className="bdna__genome-hint">{g.hint}</p> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel bdna__section" id="bdna-laws">
          <div className="bdna__section-head">
            <span className="bdna__section-k">09</span>
            <div>
              <h3 className="bdna__section-title">Законы VOKRA</h3>
              <p className="bdna__section-sub">BRAND LAWS · строго</p>
            </div>
          </div>
          <ol className="bdna__laws">
            {C.laws.map((law) => (
              <li key={law.id}>
                <span className="bdna__law-id">{law.id}</span>
                {law.text}
              </li>
            ))}
          </ol>
        </article>

        <article className="glass-panel bdna__section" id="bdna-ai">
          <div className="bdna__section-head">
            <span className="bdna__section-k">10</span>
            <div>
              <h3 className="bdna__section-title">AI-правила</h3>
              <p className="bdna__section-sub">AI GOVERNANCE · инъекция в промпты</p>
            </div>
          </div>
          <ul className="bdna__bullets">
            {C.aiGovernance.map((g) => (
              <li key={g.id}>{g.text}</li>
            ))}
          </ul>
        </article>

        <article className="glass-panel bdna__section bdna__section--fit" id="bdna-fit">
          <div className="bdna__section-head">
            <span className="bdna__section-k">11</span>
            <div>
              <h3 className="bdna__section-title">Проверка соответствия VOKRA</h3>
              <p className="bdna__section-sub">DNA FIT CHECKER · демо-значения</p>
            </div>
          </div>
          <div className="bdna__fit-grid">
            <div className="bdna__fit-card">
              <span className="bdna__fit-k">Brand Fit</span>
              <span className="bdna__fit-v">{C.fitChecker.brandFit}</span>
              <div className="bdna__meter">
                <span className="bdna__meter-fill" style={{ width: `${C.fitChecker.brandFit}%` }} />
              </div>
            </div>
            <div className="bdna__fit-card">
              <span className="bdna__fit-k">Marketplace Fit</span>
              <span className="bdna__fit-v">{C.fitChecker.marketplaceFit}</span>
              <div className="bdna__meter">
                <span className="bdna__meter-fill" style={{ width: `${C.fitChecker.marketplaceFit}%` }} />
              </div>
            </div>
            <div className="bdna__fit-card">
              <span className="bdna__fit-k">Production Fit</span>
              <span className="bdna__fit-v">{C.fitChecker.productionFit}</span>
              <div className="bdna__meter">
                <span className="bdna__meter-fill" style={{ width: `${C.fitChecker.productionFit}%` }} />
              </div>
            </div>
            <div className="bdna__fit-card">
              <span className="bdna__fit-k">Premium Signal</span>
              <span className="bdna__fit-v">{C.fitChecker.premiumSignal}</span>
              <div className="bdna__meter">
                <span className="bdna__meter-fill" style={{ width: `${C.fitChecker.premiumSignal}%` }} />
              </div>
            </div>
          </div>
          <p className="bdna__label">флаги риска</p>
          <ul className="bdna__flags">
            {C.fitChecker.riskFlags.map((f) => (
              <li key={f.label}>
                <span className={`bdna__flag-lvl bdna__flag-lvl--${f.level}`}>{riskLabel(f.level)}</span>
                {f.label}
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-panel bdna__section bdna__section--flow" id="bdna-flow">
          <div className="bdna__section-head">
            <span className="bdna__section-k">12</span>
            <div>
              <h3 className="bdna__section-title">{C.systemFlow.title}</h3>
              <p className="bdna__section-sub">Brand DNA — не страница, а конституция VOKRA OS</p>
            </div>
          </div>
          <div className="bdna__flow" role="list">
            {C.systemFlow.steps.map((step, i) => (
              <div key={`${step}-${i}`} className="bdna__flow-step" role="listitem">
                <span className="bdna__flow-node">{step}</span>
                {i < C.systemFlow.steps.length - 1 ? <span className="bdna__flow-arrow" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </article>
      </div>

      <style>{`
        .bdna__header {
          margin-bottom: 28px;
        }
        .bdna__fabric-hint {
          margin: 0 0 20px;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .bdna__vi-bridge {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
        }
        .bdna__vi-link {
          border: none;
          background: none;
          padding: 0;
          font: inherit;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(140, 175, 255, 0.95);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .bdna__vi-note {
          font-size: 0.72rem;
          color: rgba(160, 170, 200, 0.88);
        }
        .bdna__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 16px;
          margin-top: 16px;
        }
        .bdna__meta-pill {
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid var(--stroke);
          color: var(--muted);
          background: rgba(0, 0, 0, 0.28);
        }
        .bdna__meta-note {
          font-size: 0.78rem;
          color: var(--muted);
          max-width: 520px;
          line-height: 1.45;
        }
        .bdna__stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bdna__section {
          padding: 22px 24px;
        }
        .bdna__section--fit {
          border-color: rgba(107, 140, 255, 0.12);
        }
        .bdna__section--flow {
          border-color: rgba(255, 255, 255, 0.06);
        }
        .bdna__section-head {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .bdna__section-k {
          flex: 0 0 auto;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(107, 140, 255, 0.45);
          padding-top: 4px;
        }
        .bdna__section-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text);
        }
        .bdna__section-sub {
          margin: 6px 0 0;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .bdna__lede {
          margin: 0 0 18px;
          font-size: 1.02rem;
          line-height: 1.65;
          color: var(--text);
        }
        .bdna__p {
          margin: 0 0 14px;
          font-size: 0.94rem;
          line-height: 1.6;
          color: var(--muted);
        }
        .bdna__label {
          margin: 16px 0 8px;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .bdna__label--ok {
          color: rgba(130, 175, 150, 0.75);
        }
        .bdna__label--bad {
          color: rgba(200, 130, 130, 0.75);
        }
        .bdna__dl {
          margin: 0;
          display: grid;
          gap: 14px;
        }
        .bdna__dl dt {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 4px;
        }
        .bdna__dl dd {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .bdna__mantra {
          font-family: var(--font-display);
          font-size: 1.1rem !important;
          letter-spacing: 0.06em;
          color: var(--text) !important;
        }
        .bdna__bullets {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .bdna__bullets li {
          margin-bottom: 6px;
        }
        .bdna__bullets--warn {
          color: rgba(210, 190, 190, 0.82);
        }
        .bdna__ol {
          margin: 0;
          padding-left: 20px;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .bdna__ol li {
          margin-bottom: 8px;
        }
        .bdna__tags {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bdna__tags li {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--stroke);
          font-size: 0.86rem;
          color: var(--muted);
          background: rgba(0, 0, 0, 0.22);
        }
        .bdna__tags--inline {
          flex-direction: row;
          flex-wrap: wrap;
        }
        .bdna__tags--inline li {
          font-size: 0.78rem;
        }
        .bdna__grid2 {
          display: grid;
          gap: 16px;
          grid-template-columns: 1.4fr 1fr;
        }
        .bdna__swatches {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }
        .bdna__swatch {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .bdna__swatch-chip {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--stroke-strong);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
        }
        .bdna__swatch-name {
          margin: 0;
          font-weight: 600;
          font-size: 0.86rem;
          color: var(--text);
        }
        .bdna__swatch-meta {
          margin: 4px 0 0;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .bdna__type-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bdna__type-list strong {
          display: block;
          font-size: 0.82rem;
          color: var(--text);
        }
        .bdna__type-list span {
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(107, 140, 255, 0.65);
        }
        .bdna__type-list p {
          margin: 6px 0 0;
          font-size: 0.84rem;
          color: var(--muted);
        }
        .bdna__voice-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 8px;
        }
        .bdna__examples {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bdna__examples li {
          font-size: 0.9rem;
          line-height: 1.45;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--stroke);
        }
        .bdna__examples--ok li {
          color: rgba(210, 220, 230, 0.88);
          border-color: rgba(120, 155, 135, 0.25);
          background: rgba(0, 0, 0, 0.2);
        }
        .bdna__examples--bad li {
          color: rgba(200, 185, 185, 0.85);
          border-color: rgba(160, 100, 100, 0.22);
          background: rgba(0, 0, 0, 0.2);
        }
        .bdna__callout {
          margin-top: 16px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(107, 140, 255, 0.12);
          background: rgba(107, 140, 255, 0.04);
        }
        .bdna__callout-k {
          display: block;
          font-size: 0.65rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(107, 140, 255, 0.55);
          margin-bottom: 8px;
        }
        .bdna__callout p {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .bdna__checklist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bdna__checklist li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.88rem;
          color: var(--muted);
        }
        .bdna__check {
          flex: 0 0 6px;
          width: 6px;
          height: 6px;
          margin-top: 7px;
          border-radius: 50%;
          background: rgba(107, 140, 255, 0.45);
        }
        .bdna__genome {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .bdna__genome-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .bdna__genome-label {
          font-size: 0.82rem;
          color: var(--text);
        }
        .bdna__genome-val {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(107, 140, 255, 0.75);
        }
        .bdna__genome-hint {
          margin: 4px 0 0;
          font-size: 0.76rem;
          color: var(--faint);
        }
        .bdna__meter {
          height: 3px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
          margin-top: 6px;
        }
        .bdna__meter-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(80, 100, 150, 0.35), rgba(107, 140, 255, 0.45));
        }
        .bdna__laws {
          margin: 0;
          padding: 0;
          list-style: none;
          counter-reset: law;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bdna__laws li {
          position: relative;
          padding-left: 36px;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .bdna__law-id {
          position: absolute;
          left: 0;
          top: 0;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(107, 140, 255, 0.5);
        }
        .bdna__fit-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }
        .bdna__fit-card {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.22);
        }
        .bdna__fit-k {
          display: block;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 6px;
        }
        .bdna__fit-v {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 10px;
        }
        .bdna__flags {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bdna__flags li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.86rem;
          color: var(--muted);
        }
        .bdna__flag-lvl {
          flex: 0 0 auto;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid var(--stroke);
          color: var(--faint);
        }
        .bdna__flag-lvl--low {
          border-color: rgba(120, 155, 130, 0.35);
          color: rgba(160, 195, 170, 0.85);
        }
        .bdna__flag-lvl--med {
          border-color: rgba(180, 155, 110, 0.35);
          color: rgba(210, 190, 155, 0.88);
        }
        .bdna__flag-lvl--high {
          border-color: rgba(180, 110, 110, 0.4);
          color: rgba(220, 160, 160, 0.9);
        }
        .bdna__flow {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          gap: 0;
          margin-top: 8px;
        }
        .bdna__flow-step {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
        }
        .bdna__flow-node {
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          color: var(--muted);
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.28);
          max-width: 160px;
          line-height: 1.35;
          text-align: center;
        }
        .bdna__flow-arrow {
          width: 22px;
          height: 1px;
          margin: 0 4px;
          background: linear-gradient(90deg, rgba(107, 140, 255, 0.15), rgba(107, 140, 255, 0.45), rgba(107, 140, 255, 0.15));
          position: relative;
        }
        .bdna__flow-arrow::after {
          content: "";
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          border: 4px solid transparent;
          border-left: 5px solid rgba(107, 140, 255, 0.35);
        }
        @media (max-width: 960px) {
          .bdna__grid2 {
            grid-template-columns: 1fr;
          }
          .bdna__voice-cols {
            grid-template-columns: 1fr;
          }
          .bdna__fit-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 520px) {
          .bdna__fit-grid {
            grid-template-columns: 1fr;
          }
          .bdna__flow {
            flex-direction: column;
            align-items: flex-start;
          }
          .bdna__flow-step {
            flex-direction: column;
            align-items: flex-start;
          }
          .bdna__flow-arrow {
            width: 1px;
            height: 16px;
            margin: 4px 0 4px 18px;
            background: linear-gradient(180deg, rgba(107, 140, 255, 0.15), rgba(107, 140, 255, 0.45));
          }
          .bdna__flow-arrow::after {
            right: auto;
            left: 50%;
            top: 100%;
            transform: translate(-50%, 0) rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}
