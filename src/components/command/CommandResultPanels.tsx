import type { CSSProperties, ReactNode } from "react";
import type { CommandCenterReport, SkuLaunchMapRow } from "../../lib/command-center/types";

type T = (key: string) => string;

export function CommandResultPanels({ r, t }: { r: CommandCenterReport; t: T }) {
  const ev = r.executiveVerdict;
  const dash = r.executiveDashboard;
  const sc = r.unifiedScores;
  const score = ev.dominationScore;
  const week = r.launchPlanWeek;

  return (
    <div className="cc-panels">
      <section className="cc-hero glass-panel">
        <div className="cc-hero__grid">
          <div className="cc-hero__ring-wrap">
            <div className="cc-hero__ring" style={{ "--p": `${score}%` } as CSSProperties}>
              <span className="cc-hero__score">{score}</span>
            </div>
            <p className="cc-hero__score-label">{t("command.dominationScore")}</p>
            <p className="cc-hero__schema">schema v{r.schemaVersion}</p>
          </div>
          <div className="cc-hero__copy">
            <p className="cc-hero__eyebrow">{t("command.verdictEyebrow")}</p>
            <h3 className="cc-hero__verdict">{ev.verdict || "—"}</h3>
            <div className="cc-hero__meta">
              <span>
                <strong>{t("command.confidence")}</strong> {ev.confidence}
              </span>
              <span>
                <strong>{t("command.marketWindow")}</strong> {ev.marketWindow}
              </span>
            </div>
            <p className="cc-hero__why">{ev.whyNow}</p>
            <p className="cc-hero__risk">
              <strong>{t("command.primaryRisk")}</strong> {ev.primaryRisk}
            </p>
          </div>
        </div>
        <style>{`
          .cc-hero {
            padding: 32px 34px;
            border-radius: 24px;
            background: radial-gradient(80% 70% at 0% 0%, rgba(123, 143, 255, 0.18), transparent),
              linear-gradient(165deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.55));
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .cc-hero__grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 28px 36px;
            align-items: start;
          }
          @media (max-width: 720px) {
            .cc-hero__grid {
              grid-template-columns: 1fr;
            }
          }
          .cc-hero__ring-wrap {
            text-align: center;
          }
          .cc-hero__ring {
            --p: 0%;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            margin: 0 auto 12px;
            display: grid;
            place-items: center;
            background: conic-gradient(rgba(123, 143, 255, 0.95) var(--p), rgba(255, 255, 255, 0.06) 0);
            position: relative;
          }
          .cc-hero__ring::after {
            content: "";
            position: absolute;
            inset: 14px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.65));
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .cc-hero__score {
            position: relative;
            z-index: 1;
            font-family: var(--font-display);
            font-size: 2.75rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            line-height: 1;
          }
          .cc-hero__score-label {
            margin: 0;
            font-size: 0.62rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--faint);
          }
          .cc-hero__schema {
            margin: 8px 0 0;
            font-size: 0.58rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(160, 175, 255, 0.75);
          }
          .cc-hero__eyebrow {
            margin: 0 0 10px;
            font-size: 0.62rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--accent);
          }
          .cc-hero__verdict {
            margin: 0 0 16px;
            font-family: var(--font-display);
            font-size: clamp(1.25rem, 2.5vw, 1.65rem);
            line-height: 1.35;
            letter-spacing: 0.04em;
          }
          .cc-hero__meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 0.82rem;
            color: var(--muted);
            margin-bottom: 14px;
          }
          .cc-hero__why {
            margin: 0 0 12px;
            font-size: 0.88rem;
            line-height: 1.55;
            color: var(--muted);
          }
          .cc-hero__risk {
            margin: 0;
            font-size: 0.82rem;
            line-height: 1.5;
            color: rgba(255, 200, 180, 0.9);
          }
        `}</style>
      </section>

      <section className="cc-scores glass-panel">
        <h3 className="cc-sec-h">{t("command.secSignals")}</h3>
        <div className="cc-scores__grid">
          <ScoreBar label={t("command.scoreOpp")} v={sc.opportunity} />
          <ScoreBar label={t("command.scoreLaunch")} v={sc.launchReadiness} />
          <ScoreBar label={t("command.scoreProfit")} v={sc.profitability} />
          <ScoreBar label={t("command.scoreVisual")} v={sc.visualCohesion} />
          <ScoreBar label={t("command.scoreSeo")} v={sc.seoLeverage} />
          <ScoreBar label={t("command.scoreProdRisk")} v={sc.productionRisk} warn />
        </div>
        <style>{`
          .cc-scores {
            padding: 22px 24px;
            border-radius: 20px;
          }
          .cc-scores__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 14px;
          }
        `}</style>
      </section>

      <Section title={t("command.secDashboard")}>
        <div className="cc-dash">
          <DashCell k={t("command.cmdSummary")} v={dash.commandSummary} />
          <DashCell k={t("command.marketPressure")} v={dash.marketPressure} />
          <DashCell k={t("command.launchPriority")} v={dash.launchPriority} />
          <DashCell k={t("command.profitPot")} v={dash.profitabilityPotential} />
        </div>
        <ListBlock label={t("command.recActions")} items={dash.recommendedActions} />
        <style>{`
          .cc-dash {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 8px;
          }
          @media (max-width: 640px) {
            .cc-dash {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Section>

      <Section title={t("command.secTrend")} sub={t("command.trendBriefSub")}>
        <h4 className="cc-h4">{r.trendSignalBrief.headline}</h4>
        <p className="cc-p">{r.trendSignalBrief.synthesis}</p>
        <ChipRow items={r.trendSignalBrief.emotionalDrivers} />
        <div className="cc-two">
          <div>
            <span className="cc-k">{t("command.saturation")}</span>
            <p>{r.trendSignalBrief.saturation}</p>
          </div>
          <div>
            <span className="cc-k">{t("command.velocity")}</span>
            <p>{r.trendSignalBrief.velocity}</p>
          </div>
        </div>
      </Section>

      <Section title={t("command.secCompetitor")}>
        <p className="cc-p">{r.competitorSynthesis.narrative}</p>
        <QuadList
          a={t("command.qWeak")}
          itemsA={r.competitorSynthesis.marketWeaknesses}
          b={t("command.qVisual")}
          itemsB={r.competitorSynthesis.visualPatterns}
          c={t("command.qSeo")}
          itemsC={r.competitorSynthesis.seoPatterns}
          d={t("command.qPrice")}
          itemsD={r.competitorSynthesis.pricingPatterns}
        />
      </Section>

      <Section title={t("command.secSkuMap")}>
        <div className="cc-sku-grid">
          {r.skuLaunchMap.map((row, i) => (
            <SkuCard key={`${row.skuName}-${i}`} row={row} t={t} />
          ))}
        </div>
        <style>{`
          .cc-sku-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 12px;
          }
        `}</style>
      </Section>

      <Section title={t("command.secPricing")}>
        <p className="cc-k">{t("command.priceSeg")}</p>
        <p className="cc-p">{r.pricingStrategy.anchorBand}</p>
        <p className="cc-k">{t("command.wbOzon")}</p>
        <p className="cc-p">{r.pricingStrategy.wbOzonTactics}</p>
        <ListBlock label={t("command.priceLadder")} items={r.pricingStrategy.ladder} />
        <ListBlock label={t("command.marginPot")} items={r.pricingStrategy.marginGuardrails} />
      </Section>

      <Section title={t("command.secVisual")}>
        <dl className="cc-dl">
          <div>
            <dt>{t("command.heroStyle")}</dt>
            <dd>{r.visualDirection.heroStyle}</dd>
          </div>
          <div>
            <dt>{t("command.colorDir")}</dt>
            <dd>{r.visualDirection.colorDirection}</dd>
          </div>
          <div>
            <dt>{t("command.compDir")}</dt>
            <dd>{r.visualDirection.compositionDirection}</dd>
          </div>
          <div>
            <dt>{t("command.photoDir")}</dt>
            <dd>{r.visualDirection.photographyDirection}</dd>
          </div>
          <div>
            <dt>{t("command.fitOversize")}</dt>
            <dd>{r.visualDirection.oversizeNotes}</dd>
          </div>
          <div>
            <dt>{t("command.fitStandard")}</dt>
            <dd>{r.visualDirection.standardFitNotes}</dd>
          </div>
        </dl>
        <ListBlock label={t("command.ctrAdvice")} items={r.visualDirection.marketplaceCtrAdvice} />
      </Section>

      <Section title={t("command.secContent")}>
        <ListBlock label={t("command.pillars")} items={r.contentStrategy.pillars} />
        <ListBlock label={t("command.reels")} items={r.contentStrategy.reelsIdeas} />
        <ListBlock label={t("command.campaigns")} items={r.contentStrategy.campaignAngles} />
        <ListBlock label={t("command.ugc")} items={r.contentStrategy.ugcHooks} />
        <ListBlock label={t("command.story")} items={r.contentStrategy.storytellingAngles} />
      </Section>

      <Section title={t("command.secProduction")}>
        <p className="cc-k">{t("command.dtfPipeline")}</p>
        <p className="cc-p">{r.productionRiskAnalysis.dtfPipeline}</p>
        <div className="cc-four">
          <div>
            <span className="cc-k">{t("command.complexity")}</span>
            <p>{r.productionRiskAnalysis.complexity}</p>
          </div>
          <div>
            <span className="cc-k">{t("command.scalability")}</span>
            <p>{r.productionRiskAnalysis.scalability}</p>
          </div>
          <div>
            <span className="cc-k">{t("command.riskLevel")}</span>
            <p>{r.productionRiskAnalysis.riskLevel}</p>
          </div>
          <div>
            <span className="cc-k">{t("command.marginPot")}</span>
            <p>{r.productionRiskAnalysis.marginPotential}</p>
          </div>
        </div>
        <ListBlock label={t("command.secBottlenecks")} items={r.productionRiskAnalysis.bottlenecks} />
        <ListBlock label={t("command.mitigations")} items={r.productionRiskAnalysis.mitigations} />
        <ListBlock label={t("command.mfgAdvice")} items={r.productionRiskAnalysis.manufacturingAdvice} />
      </Section>

      <Section title={t("command.secSeoMap")}>
        {r.seoPriorityMap.map((tier, i) => (
          <div key={`${tier.tier}-${i}`} className="cc-seo-tier">
            <h4 className="cc-h4">{tier.tier}</h4>
            <ul>
              {tier.items.map((it, j) => (
                <li key={j}>
                  <strong>{it.focus}</strong> ({it.priority}) — {it.action}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <style>{`
          .cc-seo-tier ul {
            margin: 0;
            padding-left: 1.1rem;
            font-size: 0.84rem;
            line-height: 1.45;
            color: var(--muted);
          }
        `}</style>
      </Section>

      <Section title={t("command.secHorizons")}>
        <ListBlock label={t("command.secLaunch")} items={r.actionHorizons.days7} />
        <ListBlock label={t("command.day30")} items={r.actionHorizons.days30} />
        <ListBlock label={t("command.day90")} items={r.actionHorizons.days90} />
      </Section>

      <section className="cc-launch glass-panel">
        <h3 className="cc-sec-h">{t("command.secLaunch")}</h3>
        <div className="cc-timeline">
          {(["day1", "day2", "day3", "day4", "day5", "day6", "day7"] as const).map((key) => (
            <article key={key} className="cc-day">
              <span className="cc-day__n">{t(`command.${key}`)}</span>
              <p className="cc-day__t">{week[key]}</p>
            </article>
          ))}
        </div>
        <style>{`
          .cc-launch {
            padding: 24px 26px;
            border-radius: 20px;
          }
          .cc-timeline {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }
          .cc-day {
            padding: 14px 14px 16px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(0, 0, 0, 0.35);
          }
          .cc-day__n {
            display: block;
            font-size: 0.58rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(180, 195, 255, 0.95);
            margin-bottom: 8px;
          }
          .cc-day__t {
            margin: 0;
            font-size: 0.78rem;
            line-height: 1.45;
            color: var(--muted);
          }
        `}</style>
      </section>

      {r.launchRecommendations.length > 0 && (
        <section className="cc-sec glass-panel">
          <h3 className="cc-sec__h">{t("command.launchRec")}</h3>
          <ul className="cc-ul">
            {r.launchRecommendations.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <style>{`
            .cc-sec__h {
              margin: 0 0 12px;
              font-family: var(--font-display);
              font-size: 0.88rem;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }
          `}</style>
        </section>
      )}

      <Section title={t("command.secBottlenecks")}>
        <ul className="cc-ul">
          {r.bottleneckDetection.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("command.secScaling")}>
        <ListBlock label={t("command.scalingOps")} items={r.scalingOpportunities} />
        <ListBlock label={t("command.experiments")} items={r.recommendedExperiments} />
      </Section>

      <Section title={t("command.secForecast")}>
        <p className="cc-p">{r.growthForecast}</p>
      </Section>

      <Section title={t("command.secRoadmap")}>
        <p className="cc-p">{r.tacticalRoadmap}</p>
      </Section>

      <section className="cc-agents glass-panel">
        <h3 className="cc-agents__h">{t("command.secDepts")}</h3>
        <div className="cc-agents__grid">
          {r.aiDepartments.map((a, i) => (
            <article key={`${a.role}-${i}`} className="cc-agent">
              <span className="cc-agent__dept">{a.department}</span>
              <span className="cc-agent__role">{a.role}</span>
              <span className={`cc-agent__st cc-agent__st--${a.status}`}>{a.status}</span>
              <p className="cc-agent__mission">{a.mission}</p>
              <p className="cc-agent__coord">{a.coordination}</p>
              <p className="cc-agent__out">{a.output}</p>
            </article>
          ))}
        </div>
        <style>{`
          .cc-agents {
            padding: 24px 26px;
            border-radius: 20px;
          }
          .cc-agents__h {
            margin: 0 0 16px;
            font-family: var(--font-display);
            font-size: 1rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .cc-agents__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 14px;
          }
          .cc-agent {
            padding: 16px 18px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: linear-gradient(160deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.4));
          }
          .cc-agent__dept {
            font-size: 0.58rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--accent);
          }
          .cc-agent__role {
            display: block;
            margin-top: 6px;
            font-size: 0.72rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }
          .cc-agent__st {
            display: inline-block;
            margin-top: 8px;
            font-size: 0.55rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding: 4px 8px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.12);
          }
          .cc-agent__st--active {
            color: rgba(160, 255, 200, 0.95);
          }
          .cc-agent__st--blocked {
            color: rgba(255, 160, 160, 0.95);
          }
          .cc-agent__st--standby {
            color: var(--faint);
          }
          .cc-agent__mission {
            margin: 10px 0 6px;
            font-size: 0.78rem;
            color: var(--faint);
            line-height: 1.4;
          }
          .cc-agent__coord {
            margin: 0 0 8px;
            font-size: 0.72rem;
            color: rgba(180, 195, 255, 0.85);
          }
          .cc-agent__out {
            margin: 0;
            font-size: 0.84rem;
            line-height: 1.5;
            color: var(--muted);
          }
        `}</style>
      </section>

      <section className="cc-final glass-panel">
        <p className="cc-final__eyebrow">{t("command.finalEyebrow")}</p>
        <p className="cc-final__text">{r.finalCommand}</p>
        <style>{`
          .cc-final {
            padding: 28px 32px;
            border-radius: 22px;
            background: linear-gradient(120deg, rgba(123, 143, 255, 0.12), rgba(0, 0, 0, 0.55));
            border: 1px solid rgba(123, 143, 255, 0.25);
          }
          .cc-final__eyebrow {
            margin: 0 0 12px;
            font-size: 0.62rem;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: rgba(200, 210, 255, 0.95);
          }
          .cc-final__text {
            margin: 0;
            font-family: var(--font-display);
            font-size: clamp(1.05rem, 2vw, 1.35rem);
            line-height: 1.5;
            letter-spacing: 0.03em;
          }
        `}</style>
      </section>

      <style>{`
        .cc-panels {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .cc-sec-h {
          margin: 0 0 14px;
          font-family: var(--font-display);
          font-size: 0.88rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .cc-h4 {
          margin: 0 0 10px;
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 0.06em;
        }
        .cc-p {
          margin: 0 0 12px;
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--muted);
        }
        .cc-k {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 4px;
        }
        .cc-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
          font-size: 0.84rem;
          color: var(--muted);
        }
        @media (max-width: 600px) {
          .cc-two {
            grid-template-columns: 1fr;
          }
        }
        .cc-four {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
          font-size: 0.84rem;
          color: var(--muted);
        }
        .cc-dl {
          margin: 0 0 14px;
          display: grid;
          gap: 12px;
        }
        .cc-dl dt {
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .cc-dl dd {
          margin: 4px 0 0;
          font-size: 0.86rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .cc-ul {
          margin: 0;
          padding-left: 1.1rem;
          font-size: 0.86rem;
          line-height: 1.5;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

function ScoreBar({ label, v, warn }: { label: string; v: number; warn?: boolean }) {
  return (
    <div className="cc-sb">
      <div className="cc-sb__top">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className={`cc-sb__bar ${warn ? "cc-sb__bar--warn" : ""}`}>
        <div className="cc-sb__fill" style={{ width: `${v}%` }} />
      </div>
      <style>{`
        .cc-sb__top {
          display: flex;
          justify-content: space-between;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 6px;
        }
        .cc-sb__bar {
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .cc-sb__fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(123, 143, 255, 0.85), rgba(180, 120, 255, 0.75));
        }
        .cc-sb__bar--warn .cc-sb__fill {
          background: linear-gradient(90deg, rgba(255, 160, 120, 0.9), rgba(255, 100, 140, 0.75));
        }
      `}</style>
    </div>
  );
}

function DashCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="cc-dcell">
      <span className="cc-dcell__k">{k}</span>
      <p className="cc-dcell__v">{v || "—"}</p>
      <style>{`
        .cc-dcell {
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.32);
        }
        .cc-dcell__k {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .cc-dcell__v {
          margin: 8px 0 0;
          font-size: 0.84rem;
          line-height: 1.45;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

function SkuCard({ row, t }: { row: SkuLaunchMapRow; t: T }) {
  const fit =
    row.fitLine === "oversize"
      ? t("command.fitOversize")
      : row.fitLine === "standard"
        ? t("command.fitStandard")
        : t("command.fitBoth");
  return (
    <article className="cc-sku">
      <div className="cc-sku__top">
        <span className="cc-sku__name">{row.skuName}</span>
        <span className="cc-sku__pri">
          {t("command.skuPriority")} {row.priority}
        </span>
      </div>
      <p className="cc-sku__fit">
        {t("command.fitLine")}: {fit}
      </p>
      <p className="cc-sku__txt">{row.rationale}</p>
      <p className="cc-sku__mp">{row.marketplaceAngle}</p>
      <style>{`
        .cc-sku {
          padding: 16px 18px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(165deg, rgba(123, 143, 255, 0.08), rgba(0, 0, 0, 0.45));
        }
        .cc-sku__top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
        }
        .cc-sku__name {
          font-family: var(--font-display);
          font-size: 0.95rem;
          letter-spacing: 0.06em;
        }
        .cc-sku__pri {
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          white-space: nowrap;
        }
        .cc-sku__fit {
          margin: 8px 0 6px;
          font-size: 0.68rem;
          color: var(--faint);
        }
        .cc-sku__txt {
          margin: 0 0 8px;
          font-size: 0.82rem;
          line-height: 1.45;
          color: var(--muted);
        }
        .cc-sku__mp {
          margin: 0;
          font-size: 0.78rem;
          color: rgba(180, 195, 255, 0.9);
        }
      `}</style>
    </article>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="cc-sec glass-panel">
      <h3 className="cc-sec__h">{title}</h3>
      {sub && <p className="cc-sec__sub">{sub}</p>}
      {children}
      <style>{`
        .cc-sec {
          padding: 22px 24px;
          border-radius: 18px;
        }
        .cc-sec__h {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 0.88rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .cc-sec__sub {
          margin: 0 0 14px;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: rgba(160, 175, 255, 0.85);
        }
      `}</style>
    </section>
  );
}

function ChipRow({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="cc-chips">
      {items.map((x, i) => (
        <span key={i} className="cc-chip">
          {x}
        </span>
      ))}
      <style>{`
        .cc-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        .cc-chip {
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.35);
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="cc-lb">
      <span className="cc-lb__lab">{label}</span>
      <ul>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <style>{`
        .cc-lb {
          margin-top: 12px;
        }
        .cc-lb__lab {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(180, 195, 255, 0.85);
          margin-bottom: 6px;
        }
        .cc-lb ul {
          margin: 0;
          padding-left: 1.1rem;
          font-size: 0.82rem;
          line-height: 1.45;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

function QuadList({
  a,
  itemsA,
  b,
  itemsB,
  c,
  itemsC,
  d,
  itemsD,
}: {
  a: string;
  itemsA: string[];
  b: string;
  itemsB: string[];
  c: string;
  itemsC: string[];
  d: string;
  itemsD: string[];
}) {
  const cols: [string, string[]][] = [
    [a, itemsA],
    [b, itemsB],
    [c, itemsC],
    [d, itemsD],
  ];
  return (
    <div className="cc-quad">
      {cols.map(([label, items], i) => (
        <div key={i} className="cc-quad__col">
          <span className="cc-quad__lab">{label}</span>
          <ul>
            {items.slice(0, 8).map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ul>
        </div>
      ))}
      <style>{`
        .cc-quad {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 700px) {
          .cc-quad {
            grid-template-columns: 1fr;
          }
        }
        .cc-quad__lab {
          display: block;
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .cc-quad ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.8rem;
          line-height: 1.45;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
