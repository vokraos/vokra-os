import { useCallback, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import { recordGeneration } from "../lib/memory";
import {
  IMPORT_SCHEMAS,
  IMPORT_FEED_TARGETS,
  buildSampleImportPreview,
  sampleNormalizedFieldsFromPreview,
  buildManualIntakePreview,
  isManualMvpKind,
  parseDelimitedText,
  miniTableToTsv,
  MANUAL_SKU_HEADERS,
  MANUAL_CARD_HEADERS,
  normalizedRowsFromParse,
  saveManualImportForFusion,
  computeRequiredMissing,
  type MarketplaceImportKind,
  type ImportPreview,
} from "../lib/import-core";

type Props = { onNavigate: (id: NavId) => void };

const IMPORT_KINDS = Object.keys(IMPORT_SCHEMAS) as MarketplaceImportKind[];

const MANUAL_FILE_MAX_BYTES = 280_000;

const SKU_TEMPLATE_ROW: Record<string, string> = {
  skuCode: "VOK-001",
  article: "ART-88",
  barcode: "4600000000001",
  marketplace: "WB",
  title: "Футболка база",
  size: "M",
  color: "чёрный",
  stockMode: "FBS",
  warehouse: "Коледино",
  corridor: "premium_dtf",
  productFamily: "DTF Base",
};

const CARD_TEMPLATE_ROW: Record<string, string> = {
  ...SKU_TEMPLATE_ROW,
  cardTitle: "Футболка база — чёрный M",
  seoCluster: "футболки_dtf",
};

function formatDelimiter(d: "," | "\t" | ";"): string {
  if (d === "\t") return "TAB";
  return d;
}

function pctBar(label: string, pct: number): ReactNode {
  return (
    <div className="di-bar">
      <div className="di-bar__head">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="di-bar__track">
        <div className="di-bar__fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

function emptyPasteWarningPreview(kind: "manual_sku_list" | "manual_card_list"): ImportPreview {
  const arch = buildSampleImportPreview(kind);
  return {
    ...arch,
    rowCount: 0,
    detectedColumns: [],
    mappedColumns: [],
    unmappedColumns: [],
    requiredMissing: computeRequiredMissing(kind, []),
    sampleRows: [],
    warnings: [{ id: "paste_needed", labelKey: "import.manual.pasteToPreview" }],
    readiness: 0,
  };
}

export function DataImportView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [kind, setKind] = useState<MarketplaceImportKind>("wb_sales_report");
  const [manualPaste, setManualPaste] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const isManual = isManualMvpKind(kind);
  const archPreview = useMemo(() => buildSampleImportPreview(kind), [kind]);
  const manualIntakePreview = useMemo(() => {
    if (!isManualMvpKind(kind)) return null;
    const text = manualPaste.trim();
    if (!text) return null;
    return buildManualIntakePreview(kind, text);
  }, [kind, manualPaste]);

  const activePreview: ImportPreview = useMemo(() => {
    if (isManualMvpKind(kind)) {
      if (manualIntakePreview) return manualIntakePreview;
      return emptyPasteWarningPreview(kind);
    }
    return archPreview;
  }, [kind, manualIntakePreview, archPreview]);

  const parsedMeta = useMemo(() => {
    if (!isManualMvpKind(kind)) return null;
    return parseDelimitedText(manualPaste.trim());
  }, [kind, manualPaste]);

  const schema = IMPORT_SCHEMAS[kind];
  const normalizedSample = useMemo(
    () => sampleNormalizedFieldsFromPreview(isManualMvpKind(kind) && manualIntakePreview ? manualIntakePreview : archPreview),
    [archPreview, kind, manualIntakePreview],
  );

  const saveMemory = useCallback(() => {
    recordGeneration({
      module: "data_import",
      title: t("import.memoryTitle", { type: t(schema.labelKey) }),
      content: JSON.stringify({
        schema: archPreview.schema,
        savedAt: Date.now(),
        snapshotKind: "architecture",
        importType: archPreview.importType,
        mappingTemplate: archPreview.mappedColumns,
        readiness: archPreview.readiness,
        warnings: archPreview.warnings,
        sampleNormalizedFields: sampleNormalizedFieldsFromPreview(archPreview),
      }),
      mime: "application/json",
      tags: ["data_import", "csv", "mapping"],
      meta: {
        importType: archPreview.importType,
        readiness: String(archPreview.readiness),
        mapped: String(archPreview.mappedColumns.length),
      },
    });
    showToast(t("import.toastSavedMemory"));
  }, [archPreview, schema.labelKey, showToast, t]);

  const saveManualSnapshot = useCallback(() => {
    if (!isManualMvpKind(kind) || !manualIntakePreview) return;
    const delimiter = parsedMeta?.delimiter ?? "\t";
    recordGeneration({
      module: "data_import",
      title: t("import.memoryTitle", { type: t(schema.labelKey) }),
      content: JSON.stringify({
        schema: manualIntakePreview.schema,
        savedAt: Date.now(),
        snapshotKind: "manual_import",
        importType: manualIntakePreview.importType,
        readiness: manualIntakePreview.readiness,
        warnings: manualIntakePreview.warnings,
        mappedFields: manualIntakePreview.mappedColumns,
        detectedColumns: manualIntakePreview.detectedColumns,
        normalizedSampleRows: manualIntakePreview.sampleRows.slice(0, 12),
        rowCount: manualIntakePreview.rowCount,
        delimiter,
      }),
      mime: "application/json",
      tags: ["data_import", "manual_import", "csv"],
      meta: {
        importType: manualIntakePreview.importType,
        readiness: String(manualIntakePreview.readiness),
        mapped: String(manualIntakePreview.mappedColumns.length),
        rows: String(manualIntakePreview.rowCount),
      },
    });
    showToast(t("import.toastSavedMemory"));
  }, [kind, manualIntakePreview, parsedMeta?.delimiter, schema.labelKey, showToast, t]);

  const sendToFusion = useCallback(() => {
    if (!isManualMvpKind(kind) || !manualIntakePreview) return;
    const parsed = parseDelimitedText(manualPaste.trim());
    if (!parsed) return;
    const normalizedRows = normalizedRowsFromParse(parsed, manualIntakePreview.mappedColumns);
    saveManualImportForFusion({
      storedAt: Date.now(),
      importType: kind,
      rowCount: manualIntakePreview.rowCount,
      detectedColumns: manualIntakePreview.detectedColumns,
      mappedFields: manualIntakePreview.mappedColumns,
      normalizedRows,
      warnings: [...manualIntakePreview.warnings],
      readiness: manualIntakePreview.readiness,
      delimiter: parsed.delimiter,
    });
    showToast(t("import.toastSentFusion"));
    onNavigate("entityFusion");
  }, [kind, manualIntakePreview, manualPaste, onNavigate, showToast, t]);

  const insertSkuTemplate = useCallback(() => {
    setManualPaste(miniTableToTsv(MANUAL_SKU_HEADERS, [SKU_TEMPLATE_ROW]));
  }, []);

  const insertCardTemplate = useCallback(() => {
    setManualPaste(miniTableToTsv(MANUAL_CARD_HEADERS, [CARD_TEMPLATE_ROW]));
  }, []);

  const onPickFile = useCallback(() => fileRef.current?.click(), []);

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      if (f.size > MANUAL_FILE_MAX_BYTES) {
        showToast(t("import.manual.fileTooBig"));
        return;
      }
      try {
        const text = await f.text();
        setManualPaste(text);
        showToast(t("import.manual.fileLoaded"));
      } catch {
        showToast(t("import.manual.fileReadFail"));
      }
    },
    [showToast, t],
  );

  return (
    <div className="cb-lab di-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("import.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.dataImport")}</h1>
        <p className="cb-lab__lede">{t("import.lede")}</p>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
        <div className="cb-lab__actions">
          {isManual ? (
            <>
              <button type="button" className="ghost-btn" disabled={!manualIntakePreview} onClick={saveManualSnapshot}>
                {t("import.saveImportSnapshot")}
              </button>
              <button type="button" className="ghost-btn" disabled={!manualIntakePreview} onClick={sendToFusion}>
                {t("import.sendToFusion")}
              </button>
            </>
          ) : (
            <button type="button" className="ghost-btn" onClick={saveMemory}>
              {t("import.saveMemory")}
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={() => onNavigate("ingestionReadiness")}>
            {t("import.openIngestion")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("skuIntelligence")}>
            {t("import.openSkuIntel")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("cardProduction")}>
            {t("import.openCardProduction")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("entityFusion")}>
            {t("import.openEntityFusion")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
            {t("import.openMemory")}
          </button>
        </div>
      </header>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.chooseType")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("import.chooseHint")}</p>
        <div className="di-type-grid">
          {IMPORT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className={`di-type ${kind === k ? "di-type--on" : ""}`}
              onClick={() => setKind(k)}
            >
              <span className="di-type__id">{k}</span>
              <span className="di-type__lbl">{t(IMPORT_SCHEMAS[k].labelKey)}</span>
            </button>
          ))}
        </div>
      </section>

      {isManual ? (
        <section className="cb-lab__panel glass-panel di-sec">
          <h2 className="di-sec__h">{t("import.section.manualMvp")}</h2>
          <p className="cb-lab__prose cb-lab__prose--tight">{t("import.manual.pasteHint")}</p>
          <textarea
            className="di-textarea"
            value={manualPaste}
            onChange={(e) => setManualPaste(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={t("import.manual.placeholder")}
          />
          <div className="di-manual-actions">
            <button type="button" className="ghost-btn" onClick={insertSkuTemplate}>
              {t("import.manual.insertSkuTemplate")}
            </button>
            <button type="button" className="ghost-btn" onClick={insertCardTemplate}>
              {t("import.manual.insertCardTemplate")}
            </button>
            <button type="button" className="ghost-btn" onClick={onPickFile}>
              {t("import.manual.pickFile")}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="di-file-input" onChange={onFileChange} />
          </div>
          <p className="cb-lab__prose di-meta">{t("import.manual.fileHint")}</p>
        </section>
      ) : null}

      <section className="cb-lab__panel glass-panel di-sec di-sec--pulse">
        <h2 className="di-sec__h">{t("import.section.readiness")}</h2>
        {pctBar(t("import.readinessLabel"), activePreview.readiness)}
        <p className="cb-lab__prose di-meta">
          {isManual && manualIntakePreview
            ? t("import.rowCountParsed", { n: String(activePreview.rowCount) })
            : isManual
              ? t("import.manual.rowCountZero")
              : t("import.rowCountHint", { n: String(activePreview.rowCount) })}
        </p>
        {isManual && parsedMeta ? (
          <p className="cb-lab__prose di-meta">
            {t("import.manual.delimiter", { d: formatDelimiter(parsedMeta.delimiter) })}
          </p>
        ) : null}
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.expected")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("import.expectedHint")}</p>
        <ul className="di-chip-list">
          {schema.expectedTargets.map((f) => (
            <li key={f}>
              <code>{f}</code>
              {schema.requiredTargets.includes(f) ? <span className="di-req">{t("import.requiredBadge")}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.detected")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">
          {isManual ? t("import.manual.detectedHint") : t("import.detectedHint")}
        </p>
        {activePreview.detectedColumns.length === 0 ? (
          <p className="cb-lab__prose di-meta">{t("import.manual.noColumns")}</p>
        ) : (
          <ul className="di-col-list">
            {activePreview.detectedColumns.map((c) => (
              <li key={c}>
                <code>{c}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{isManual ? t("import.manual.mappingTitle") : t("import.section.mapping")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">
          {isManual ? t("import.manual.mappingHint") : t("import.mappingHint")}
        </p>
        {isManual ? (
          <ul className="di-map-compact">
            {activePreview.mappedColumns.map((m) => (
              <li key={`${m.sourceColumn}-${m.targetField}`}>
                <code>{m.sourceColumn}</code>
                <span className="di-map-arrow"> → </span>
                <code>{m.targetField}</code>
                <span className={`di-st di-st--${m.validationStatus}`}>{m.validationStatus}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="di-table-wrap">
            <table className="di-table">
              <thead>
                <tr>
                  <th>{t("import.th.source")}</th>
                  <th>{t("import.th.target")}</th>
                  <th>{t("import.th.confidence")}</th>
                  <th>{t("import.th.req")}</th>
                  <th>{t("import.th.status")}</th>
                </tr>
              </thead>
              <tbody>
                {activePreview.mappedColumns.map((m) => (
                  <tr key={`${m.sourceColumn}-${m.targetField}`}>
                    <td>
                      <code>{m.sourceColumn}</code>
                    </td>
                    <td>
                      <code>{m.targetField}</code>
                      <p className="di-hint">{t(m.transformHint)}</p>
                    </td>
                    <td>{m.confidence}%</td>
                    <td>{m.requirement === "required" ? t("import.requiredBadge") : t("import.optionalBadge")}</td>
                    <td>
                      <span className={`di-st di-st--${m.validationStatus}`}>{m.validationStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activePreview.unmappedColumns.length > 0 ? (
          <div className="di-unmapped">
            <h3 className="di-subh">{t("import.unmappedTitle")}</h3>
            <ul className="di-col-list">
              {activePreview.unmappedColumns.map((c) => (
                <li key={c}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.missing")}</h2>
        {activePreview.requiredMissing.length === 0 ? (
          <p className="cb-lab__prose">{t("import.missingNone")}</p>
        ) : (
          <ul className="di-miss">
            {activePreview.requiredMissing.map((f) => (
              <li key={f}>
                <code>{f}</code> — {t("import.missingLine")}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.sampleOut")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("import.sampleOutHint")}</p>
        <pre className="di-pre">
          {isManual && manualIntakePreview
            ? JSON.stringify(manualIntakePreview.sampleRows.slice(0, 4), null, 2)
            : JSON.stringify(normalizedSample, null, 2)}
        </pre>
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.warnings")}</h2>
        <ul className="di-warn">
          {activePreview.warnings.map((w) => (
            <li key={w.id}>{t(w.labelKey)}</li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel di-sec">
        <h2 className="di-sec__h">{t("import.section.feeds")}</h2>
        <p className="cb-lab__prose cb-lab__prose--tight">{t("import.feedsHint")}</p>
        <ul className="di-feeds">
          {IMPORT_FEED_TARGETS.map((f) => (
            <li key={f.id} className="di-feed">
              <strong>{t(f.labelKey)}</strong>
              <p className="di-feed__lede">{t(f.ledeKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-lab__panel glass-panel di-sec di-sec--foot">
        <h2 className="di-sec__h">{t("import.section.future")}</h2>
        <p className="cb-lab__prose">{t("import.futureBody")}</p>
      </section>

      <style>{`
        .di-lab .di-sec { margin-bottom: 16px; }
        .di-sec__h { font-size: 0.82rem; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 12px; color: var(--muted); }
        .di-sec--pulse { border-color: rgba(160, 200, 255, 0.2); max-width: 520px; }
        .di-sec--foot { border-color: rgba(200, 220, 200, 0.18); }
        .di-bar__head { display: flex; justify-content: space-between; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .di-bar__track { height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .di-bar__fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, rgba(90, 140, 255, 0.45), rgba(200, 230, 255, 0.92)); }
        .di-meta { margin-top: 10px; font-size: 0.78rem; color: var(--muted); }
        .di-type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 12px; }
        .di-type { text-align: left; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); color: inherit; cursor: pointer; font: inherit; }
        .di-type--on { border-color: rgba(140, 190, 255, 0.45); background: rgba(40, 70, 120, 0.25); }
        .di-type__id { display: block; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
        .di-type__lbl { font-size: 0.85rem; }
        .di-chip-list, .di-col-list, .di-miss, .di-warn { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .di-chip-list li { padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); font-size: 0.78rem; }
        .di-req { margin-left: 8px; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255, 200, 160, 0.95); }
        .di-col-list { flex-direction: column; flex-wrap: nowrap; }
        .di-col-list li { border: none; padding: 2px 0; }
        .di-table-wrap { overflow-x: auto; margin-top: 10px; }
        .di-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
        .di-table th, .di-table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; vertical-align: top; }
        .di-table th { color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.65rem; }
        .di-hint { margin: 4px 0 0; font-size: 0.68rem; color: var(--muted); }
        .di-st { font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; margin-left: 8px; }
        .di-st--ok { color: rgba(160, 240, 200, 0.95); }
        .di-st--warn { color: rgba(255, 220, 160, 0.95); }
        .di-st--error { color: rgba(255, 160, 160, 0.95); }
        .di-st--pending { color: var(--muted); }
        .di-unmapped { margin-top: 14px; }
        .di-subh { font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
        .di-pre { margin: 10px 0 0; padding: 14px; border-radius: 10px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); font-size: 0.72rem; overflow: auto; max-height: 220px; }
        .di-feeds { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .di-feed { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .di-feed__lede { margin: 6px 0 0; font-size: 0.78rem; color: var(--muted); line-height: 1.45; }
        .di-textarea { width: 100%; min-height: 132px; margin-top: 10px; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.35); color: inherit; font: inherit; font-size: 0.78rem; resize: vertical; box-sizing: border-box; }
        .di-manual-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
        .di-file-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
        .di-map-compact { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem; }
        .di-map-compact li { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .di-map-arrow { opacity: 0.55; }
      `}</style>
    </div>
  );
}
