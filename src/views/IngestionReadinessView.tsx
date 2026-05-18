import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import {
  INGESTION_ADAPTERS,
  INGESTION_CHANNELS,
  buildIngestionReadinessFromSession,
  type IngestionReadinessSnapshot,
} from "../lib/market-ingestion";

type Props = { onNavigate: (id: NavId) => void };

function pctBar(label: string, pct: number): ReactNode {
  return (
    <div className="ing-bar">
      <div className="ing-bar__head">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="ing-bar__track">
        <div className="ing-bar__fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

export function IngestionReadinessView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const snap = useMemo<IngestionReadinessSnapshot>(() => buildIngestionReadinessFromSession(), []);

  const channelsByPlatform = useMemo(() => {
    const m = new Map<string, (typeof INGESTION_CHANNELS)[number][]>();
    for (const ch of INGESTION_CHANNELS) {
      const arr = m.get(ch.platform) ?? [];
      arr.push(ch);
      m.set(ch.platform, arr);
    }
    return m;
  }, []);

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "market_ingestion",
      title: t("ingest.memoryTitle", { ch: String(INGESTION_CHANNELS.length) }),
      content: JSON.stringify(snap),
      mime: "application/json",
      tags: ["market_ingestion", "ingestion", "architecture"],
      meta: {
        signalReadiness: String(snap.signalReadiness),
        fusionReadiness: String(snap.fusionReadiness),
        channelCount: String(INGESTION_CHANNELS.length),
      },
    });
    showToast(t("ingest.toastSavedMemory"));
  }, [showToast, snap, t]);

  const chLabel = useCallback(
    (labelKey: string) => {
      const msg = t(labelKey);
      return msg === labelKey ? labelKey.replace(/^ingest\.channel\./, "") : msg;
    },
    [t],
  );

  return (
    <div className="cb-lab ing-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("ingest.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.ingestionReadiness")}</h1>
        <p className="cb-lab__lede">{t("ingest.lede")}</p>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("ingest.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("ingest.openCardProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("marketplaceOperations")}>
            {t("ingest.openMarketplaceOps")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("ingest.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("ingest.openVisualAssets")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("ingest.openMemory")}
          </button>
        </div>
      </header>

      <section className="cb-lab__panel glass-panel ing-sec ing-sec--pulse">
        <h2 className="ing-sec__h">{t("ingest.section.readiness")}</h2>
        <div className="ing-pulse-grid">
          {pctBar(t("ingest.metric.signal"), snap.signalReadiness)}
          {pctBar(t("ingest.metric.fusion"), snap.fusionReadiness)}
          {pctBar(t("ingest.metric.operational"), snap.operationalReadiness)}
        </div>
      </section>

      <section className="cb-lab__panel glass-panel ing-sec">
        <h2 className="ing-sec__h">{t("ingest.section.channels")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("ingest.channelsHint")}</p>
        {[...channelsByPlatform.entries()].map(([platform, list]) => (
          <div key={platform} className="ing-plat">
            <h3 className="ing-plat__h">{t(`ingest.platform.${platform}`)}</h3>
            <ul className="ing-ch-list">
              {list.map((ch) => (
                <li key={ch.id} className="ing-ch">
                  <span className="ing-ch__name">{chLabel(ch.labelKey)}</span>
                  <code className="ing-ch__id">{ch.id}</code>
                  <span className="ing-ch__pct">{snap.channelReadiness[ch.id] ?? 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="cb-lab__panel glass-panel ing-sec">
        <h2 className="ing-sec__h">{t("ingest.section.adapters")}</h2>
        <ul className="ing-adapter-list">
          {INGESTION_ADAPTERS.map((a) => (
            <li key={a.id} className="ing-adapter">
              <strong>{t(a.labelKey)}</strong>
              <span className="ing-adapter__meta">
                {a.status} · {a.channelHooks.length} hooks
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ing-sec">
        <h2 className="ing-sec__h">{t("ingest.section.blocked")}</h2>
        <ul className="ing-blocked">
          {snap.blockedIntegrations.map((b) => (
            <li key={b.id}>
              <code>{b.id}</code> — {t(b.reasonKey)}
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ing-sec">
        <h2 className="ing-sec__h">{t("ingest.section.fusion")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("ingest.fusionHint")}</p>
        <ul className="ing-fusion-list">
          {snap.fusionRules.map((r) => (
            <li key={r.id} className="ing-fusion">
              <p className="ing-fusion__title">{t(r.labelKey)}</p>
              <p className="ing-fusion__pri">
                {t("ingest.priorityLabel")}: {t(`ingest.priority.${r.defaultPriority}`)}
              </p>
              <p className="ing-fusion__out">{t(r.outputRecommendationKey)}</p>
              <ul className="ing-fusion-in">
                {r.inputs.map((inp) => (
                  <li key={`${r.id}-${inp.channelId}`}>
                    <code>{inp.channelId}</code> · {inp.signalTypeHint}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ing-sec">
        <h2 className="ing-sec__h">{t("ingest.section.mappings")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("ingest.mapHint")}</p>
        <ul className="ing-map-list">
          {snap.mappings.map((m) => (
            <li key={m.id} className="ing-map">
              <span className="ing-map__lbl">{t(m.labelKey)}</span>
              <span className="ing-map__edge">
                <code>{m.from}</code> → <code>{m.to}</code>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel ing-sec ing-sec--sync">
        <h2 className="ing-sec__h">{t("ingest.section.syncMap")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("ingest.syncMapHint")}</p>
        <p className="cb-lab__prose ing-sync-stats">
          {t("ingest.syncMapStats", {
            ch: String(INGESTION_CHANNELS.length),
            map: String(snap.mappings.length),
            fu: String(snap.fusionRules.length),
            blk: String(snap.blockedIntegrations.length),
          })}
        </p>
      </section>

      <section className="cb-lab__panel glass-panel ing-sec">
        <h2 className="ing-sec__h">{t("ingest.section.signals")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("ingest.signalsHint")}</p>
        {snap.sampleSignals.length === 0 ? <p className="cb-lab__prose">{t("ingest.noSignals")}</p> : null}
        <ul className="ing-sig-list">
          {snap.sampleSignals.map((s, i) => (
            <li key={`${s.corridor}-${i}`} className="ing-sig">
              <p>
                <strong>{s.signalType}</strong> · {s.source} · {s.corridor}
              </p>
              <p className="ing-sig__nums">
                p {s.pressure} · m {s.momentum} · r {s.risk} · L {s.leverage} · I {s.operationalImpact}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        .ing-lab .ing-sec { margin-bottom: 16px; }
        .ing-sec--pulse { border-color: rgba(140, 180, 255, 0.22); }
        .ing-sec--sync { border-color: rgba(180, 220, 200, 0.18); }
        .ing-sync-stats { letter-spacing: 0.06em; font-size: 0.82rem; margin-top: 8px; }
        .ing-sec__h { font-size: 0.82rem; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 12px; color: var(--muted); }
        .ing-pulse-grid { display: grid; gap: 10px; max-width: 520px; }
        .ing-bar__head { display: flex; justify-content: space-between; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .ing-bar__track { height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .ing-bar__fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, rgba(100,160,255,0.45), rgba(180, 230, 255, 0.9)); }
        .ing-plat { margin-top: 14px; }
        .ing-plat__h { font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
        .ing-ch-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .ing-ch { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 0.8rem; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ing-ch__name { flex: 1; min-width: 140px; }
        .ing-ch__id { font-size: 0.72rem; opacity: 0.85; }
        .ing-ch__pct { font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
        .ing-adapter-list, .ing-blocked, .ing-fusion-list, .ing-map-list, .ing-sig-list { list-style: none; padding: 0; margin: 0; }
        .ing-adapter { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ing-adapter__meta { display: block; font-size: 0.72rem; color: var(--muted); margin-top: 4px; }
        .ing-fusion { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ing-fusion__title { margin: 0 0 6px; font-size: 0.88rem; }
        .ing-fusion__pri { margin: 0 0 4px; font-size: 0.72rem; color: var(--muted); }
        .ing-fusion__out { margin: 0 0 6px; font-size: 0.8rem; color: rgba(200, 235, 255, 0.95); }
        .ing-fusion-in { margin: 0; padding-left: 16px; font-size: 0.75rem; color: var(--muted); }
        .ing-map { margin-bottom: 10px; }
        .ing-map__lbl { display: block; font-size: 0.8rem; margin-bottom: 4px; }
        .ing-map__edge { font-size: 0.72rem; color: var(--muted); }
        .ing-sig { margin-bottom: 10px; padding: 10px; border-radius: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); }
        .ing-sig__nums { margin: 6px 0 0; font-size: 0.72rem; color: var(--muted); letter-spacing: 0.04em; }
      `}</style>
    </div>
  );
}
