import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import { useLiveState } from "../../lib/live-state";
import { useExecutionOrchestrator } from "../../lib/execution-orchestrator";
import { useCognitiveDepth } from "../../lib/cognitive-depth";
import { empireCorridorWarfareSig, empireScaleNumbers } from "../../lib/cognitive-depth/sku-empire";
import {
  buildTopologyCorridors,
  executiveSignalPriorityFromTier,
  signalTierForIndex,
  topologyRelations,
  type TopologyCorridor,
} from "../../lib/cognitive-depth/market-war-os";
import { corridorGravityNarratives, marketFieldTheoryLines, marketTerrainNarratives } from "../../lib/cognitive-depth/strategic-organism";
import { ecosystemHierarchyLines, strategicWarRoomLines } from "../../lib/cognitive-depth/entity-consciousness";
import { MarketTopologyMap } from "./MarketTopologyMap";

const CORRIDOR_KEYS = [
  "depth.topo.c1",
  "depth.topo.c2",
  "depth.topo.c3",
  "depth.topo.c4",
  "depth.topo.c5",
  "depth.topo.c6",
  "depth.topo.c7",
  "depth.topo.c8",
] as const;

type Props = { variant: "dashboard" | "mission" | "orchestrator" };

export function MarketTopologyPanel({ variant }: Props) {
  const { t } = useI18n();
  const { live } = useLiveState();
  const orch = useExecutionOrchestrator();
  const { mode } = useCognitiveDepth();
  const seed = orch.pulseGeneration;
  const tension = live.strategicTension.index01;
  const pressure = live.pressureWave.amplitude01;

  const rows = useMemo<TopologyCorridor[]>(
    () => buildTopologyCorridors(seed, tension, pressure),
    [seed, tension, pressure],
  );

  const relations = useMemo(() => topologyRelations(seed, 5), [seed]);
  const scale = useMemo(() => empireScaleNumbers(seed), [seed]);
  const warRooms = useMemo(() => strategicWarRoomLines(seed), [seed]);
  const ecoLines = useMemo(() => ecosystemHierarchyLines(seed, 2), [seed]);
  const corridorLabels = useMemo(() => rows.map((r) => t(r.nameKey)), [rows, t]);
  const gravityLines = useMemo(() => corridorGravityNarratives(seed, 2), [seed]);
  const fieldLines = useMemo(() => marketFieldTheoryLines(seed, 1), [seed]);
  const terrainLines = useMemo(() => marketTerrainNarratives(seed, 1), [seed]);

  if (mode === "command") {
    return null;
  }

  return (
    <>
      <div className={`topo-panel topo-panel--${variant}`} aria-label={t("depth.topo.aria")}>
        <header className="topo-panel__head">
          <span className="topo-panel__title">{t("depth.topo.title")}</span>
          <span className="topo-panel__sub">{t("depth.topo.sub")}</span>
          <span className="topo-panel__layer">{t("depth.topo.layer")}</span>
        </header>

        <MarketTopologyMap
          seed={seed}
          rows={rows}
          relations={relations}
          corridorLabels={corridorLabels}
          waves={scale.launchWaves}
          ariaLabel={t("depth.map.aria")}
          title={t("depth.map.title")}
          subtitle={t("depth.map.sub")}
        />

        <div className="topo-panel__void" aria-label={t("depth.topo.quietAria")} />

        <section className="topo-panel__gravity" aria-label={t("depth.gravity2.aria")}>
          <h3 className="topo-panel__h">{t("depth.gravity2.title")}</h3>
          <ul className="topo-panel__rel-ul">
            {gravityLines.map((g, gi) => (
              <li key={`${g.key}-${gi}`} className="topo-panel__rel-li">
                {t(g.key, g.vars)}
              </li>
            ))}
          </ul>
        </section>

        <section className="topo-panel__field" aria-label={t("depth.field5.aria")}>
          <h3 className="topo-panel__h">{t("depth.field5.title")}</h3>
          <ul className="topo-panel__rel-ul">
            {fieldLines.map((f, fi) => (
              <li key={`${f.key}-f-${fi}`} className="topo-panel__rel-li">
                {t(f.key, f.vars)}
              </li>
            ))}
            {terrainLines.map((tr, ti) => (
              <li key={`${tr.key}-t-${ti}`} className="topo-panel__rel-li topo-panel__rel-li--terrain">
                {t(tr.key, tr.vars)}
              </li>
            ))}
          </ul>
        </section>

        <section className="topo-panel__relations" aria-label={t("depth.topo.relationsAria")}>
          <h3 className="topo-panel__h">{t("depth.topo.relationsTitle")}</h3>
          <ul className="topo-panel__rel-ul">
            {relations.map((rel, i) => (
              <li key={`${rel.key}-${i}`} className="topo-panel__rel-li">
                {t(rel.key, { predator: t(CORRIDOR_KEYS[rel.from]!), prey: t(CORRIDOR_KEYS[rel.to]!) })}
              </li>
            ))}
          </ul>
        </section>

        {mode === "analysis" ? (
          <section className="topo-panel__map-rooms" aria-label={t("depth.room.aria")}>
            <h3 className="topo-panel__h">{t("depth.room.sectionTitle")}</h3>
            <div className="topo-panel__eco">
              <span className="topo-panel__eco-k">{t("depth.entity.ecosystemTitle")}</span>
              <ul className="topo-panel__eco-ul">
                {ecoLines.map((e, ei) => (
                  <li key={`${e.key}-${ei}`} className="topo-panel__eco-li">
                    {t(e.key, e.vars)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="topo-panel__war-grid">
              {warRooms.map((room) => (
                <div key={room.id} className="topo-war-room" data-war-room={room.id}>
                  <span className="topo-war-room__title">{t(room.titleKey)}</span>
                  <p className="topo-war-room__line">{t(room.sig.key, room.sig.vars)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="topo-panel__cards">
          {rows.map((r, i) => {
            const war = empireCorridorWarfareSig(i, r.pressure, r.saturation, seed);
            const tier = signalTierForIndex(tension, seed, i);
            const priority = executiveSignalPriorityFromTier(tier);
            return (
              <article
                key={r.id}
                className="topo-card"
                data-topo-pulse={r.pulse}
                data-sig-tier={tier}
                data-sig-priority={priority}
              >
                <div className="topo-card__row">
                  <h3 className="topo-card__name">{t(r.nameKey)}</h3>
                  <span className="topo-card__pulse" title={t(`depth.pulse.${r.pulse}`)}>
                    {t(`depth.pulse.${r.pulse}`)}
                  </span>
                </div>
                <span className="topo-card__war">{t(war.key, war.vars)}</span>
                <p className="topo-card__meta">
                  {t("depth.topo.cardMeta", {
                    sku: String(r.skuCount),
                    heroes: String(r.heroDensity),
                    growth: String(r.momentum),
                    fatigue: String(r.fatigue),
                    expand: String(r.expansion),
                    conflict: String(r.overlapRisk),
                  })}
                </p>
                <p className="topo-card__meta2">
                  {t("depth.topo.cardMeta2", {
                    margin: String(r.marginStability),
                    overlap: String(r.overlapRisk),
                    prod: String(r.productionCompat),
                    sat: String(r.saturation),
                    press: String(r.pressure),
                  })}
                </p>
                <div className="topo-card__pills">
                  <span className="topo-pill">{t("depth.topo.pill.pressure", { v: String(r.pressure) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.sat", { v: String(r.saturation) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.momentum", { v: String(r.momentum) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.expand", { v: String(r.expansion) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.marginStab", { v: String(r.marginStability) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.heroDensity", { v: String(r.heroDensity) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.overlap", { v: String(r.overlapRisk) })}</span>
                  <span className="topo-pill">{t("depth.topo.pill.prodCompat", { v: String(r.productionCompat) })}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <style>{`
        .topo-panel {
          margin: 0 0 16px;
          padding: 14px 16px 16px;
          border-radius: 14px 22px 18px 12px;
          border: 1px solid rgba(255, 255, 255, 0.055);
          background: radial-gradient(140% 80% at 12% 0%, rgba(32, 40, 72, 0.35) 0%, transparent 45%),
            linear-gradient(168deg, rgba(6, 8, 16, 0.92) 0%, rgba(2, 3, 8, 0.96) 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 -24px 48px rgba(0, 0, 0, 0.35),
            0 12px 40px rgba(0, 0, 0, 0.4);
        }
        .topo-panel__void {
          min-height: 10px;
          margin: 0 0 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.35);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
        }
        .topo-panel__gravity {
          margin-bottom: 12px;
          padding: 8px 10px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(0, 0, 0, 0.2);
        }
        .topo-panel__field {
          margin-bottom: 12px;
          padding: 8px 10px 10px;
          border-radius: 8px;
          border: 1px solid rgba(90, 110, 160, 0.12);
          background: rgba(4, 8, 22, 0.35);
          box-shadow: inset 0 0 32px rgba(30, 50, 90, 0.12);
        }
        .topo-panel__rel-li--terrain {
          color: rgba(165, 185, 210, 0.68);
        }
        .topo-panel--mission {
          max-width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }
        .topo-panel__head {
          margin-bottom: 10px;
        }
        .topo-panel__title {
          display: block;
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(185, 198, 235, 0.92);
        }
        .topo-panel__sub {
          display: block;
          margin-top: 4px;
          font-size: 0.74rem;
          color: rgba(130, 145, 175, 0.72);
        }
        .topo-panel__layer {
          display: block;
          margin-top: 6px;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(110, 128, 165, 0.65);
        }
        .topo-panel__relations {
          margin-bottom: 12px;
          padding: 8px 10px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.22);
        }
        .topo-panel__map-rooms {
          margin-bottom: 14px;
          padding: 10px 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(90, 100, 140, 0.14);
          background: linear-gradient(165deg, rgba(8, 10, 22, 0.55) 0%, rgba(2, 3, 10, 0.75) 100%);
          box-shadow: inset 0 0 40px rgba(20, 30, 60, 0.2);
        }
        .topo-panel__eco {
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .topo-panel__eco-k {
          display: block;
          font-size: 0.48rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(120, 135, 165, 0.72);
          margin-bottom: 6px;
        }
        .topo-panel__eco-ul {
          margin: 0;
          padding: 0 0 0 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .topo-panel__eco-li {
          font-size: 0.64rem;
          line-height: 1.35;
          color: rgba(165, 175, 205, 0.78);
        }
        .topo-panel__war-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
          gap: 10px 12px;
        }
        .topo-war-room {
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.045);
          padding: 8px 10px 10px;
          background: rgba(0, 0, 0, 0.35);
          min-height: 72px;
        }
        .topo-war-room__title {
          display: block;
          font-size: 0.48rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(140, 155, 185, 0.85);
          margin-bottom: 6px;
        }
        .topo-war-room__line {
          margin: 0;
          font-size: 0.62rem;
          line-height: 1.4;
          color: rgba(175, 165, 195, 0.82);
        }
        .topo-panel__h {
          margin: 0 0 6px;
          font-size: 0.5rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(125, 138, 165, 0.72);
        }
        .topo-panel__rel-ul {
          margin: 0;
          padding: 0 0 0 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .topo-panel__rel-li {
          font-size: 0.66rem;
          line-height: 1.35;
          color: rgba(175, 160, 195, 0.82);
        }
        .topo-panel__cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .topo-card {
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.045);
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.38);
          box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.25);
        }
        .topo-card__row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .topo-card__name {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 700;
          color: rgba(222, 228, 248, 0.96);
        }
        .topo-card__pulse {
          font-size: 0.48rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(160, 175, 210, 0.72);
          white-space: nowrap;
        }
        .topo-card__war {
          display: block;
          font-size: 0.66rem;
          line-height: 1.35;
          color: rgba(175, 155, 195, 0.82);
          margin-bottom: 6px;
        }
        .topo-card__meta,
        .topo-card__meta2 {
          margin: 0 0 6px;
          font-size: 0.6rem;
          line-height: 1.4;
          color: rgba(130, 145, 170, 0.72);
        }
        .topo-card__pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .topo-pill {
          font-size: 0.52rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(165, 180, 210, 0.78);
          background: rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
}