import { useEffect, useMemo, useState } from "react";
import { runOpenAIText } from "../lib/ai/openai";
import { CONNECTION_TEST_SYSTEM } from "../lib/ai/prompts";
import { useLocalStorageState } from "../lib/hooks/useLocalStorageState";
import { useI18n } from "../lib/i18n/I18nContext";
import type { AiOutputMode } from "../lib/i18n/localeStorage";
import { getOpenAISettings, setOpenAIApiKey, setOpenAIModel } from "../lib/settings";
import {
  MEMORY_CHANGED_EVENT,
  createProject,
  deleteProject,
  getActiveProjectId,
  listProjectSummaries,
  setActiveProjectId,
} from "../lib/memory";

export function SettingsView() {
  const { t, locale, setLocale, outputMode, setOutputMode } = useI18n();
  const [apiKey, setApiKeyState] = useLocalStorageState("vokra.openai.apiKey", "");
  const [model, setModelState] = useLocalStorageState("vokra.openai.model", "gpt-4.1-mini");
  const [notify, setNotify] = useState(true);
  const [strictDna, setStrictDna] = useState(true);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [projects, setProjects] = useState(() => listProjectSummaries());
  const [activeId, setActiveIdState] = useState<string | null>(() => getActiveProjectId());
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    const sync = () => {
      setProjects(listProjectSummaries());
      setActiveIdState(getActiveProjectId());
    };
    window.addEventListener(MEMORY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(MEMORY_CHANGED_EVENT, sync);
  }, []);

  const masked = useMemo(() => {
    const k = apiKey.trim();
    if (!k) return "";
    if (k.length <= 10) return "••••••••••";
    return `${k.slice(0, 3)}••••••${k.slice(-4)}`;
  }, [apiKey]);

  function refreshProjects() {
    setProjects(listProjectSummaries());
    setActiveIdState(getActiveProjectId());
  }

  function setApiKey(v: string) {
    setApiKeyState(v);
    setOpenAIApiKey(v);
  }

  function setModel(v: string) {
    setModelState(v);
    setOpenAIModel(v);
  }

  async function testConnection() {
    setStatus(null);
    const s = getOpenAISettings();
    if (!s.apiKey) {
      setStatus({ ok: false, text: t("settings.missingKey") });
      return;
    }
    setTesting(true);
    try {
      const out = await runOpenAIText({
        apiKey: s.apiKey,
        model: s.model,
        system: CONNECTION_TEST_SYSTEM,
        user: "Return exactly: OK",
      });
      const ok = out.trim().toUpperCase().includes("OK");
      setStatus({
        ok,
        text: ok ? t("settings.connected") : t("settings.testUnexpected", { text: out.slice(0, 200) }),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("settings.testFailed");
      setStatus({ ok: false, text: msg });
    } finally {
      setTesting(false);
    }
  }

  function onCreateProject() {
    createProject(newProjectName.trim() || "Project");
    setNewProjectName("");
    refreshProjects();
  }

  function onSelectProject(id: string) {
    setActiveProjectId(id);
    refreshProjects();
  }

  function onDeleteProject(id: string) {
    deleteProject(id);
    refreshProjects();
  }

  return (
    <div className="view">
      <header className="view__header">
        <p className="eyebrow">{t("settings.eyebrow")}</p>
        <h2 className="view__title">{t("settings.title")}</h2>
        <p className="view__desc">{t("settings.desc")}</p>
      </header>
      <div className="settings-grid">
        <article className="glass-panel settings-card">
          <h3 className="settings-h">{t("settings.language")}</h3>
          <div className="seg">
            <button
              type="button"
              className={`seg__btn ${locale === "ru" ? "seg__btn--on" : ""}`}
              aria-pressed={locale === "ru"}
              onClick={() => setLocale("ru")}
            >
              {t("settings.langRu")}
            </button>
            <button
              type="button"
              className={`seg__btn ${locale === "en" ? "seg__btn--on" : ""}`}
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              {t("settings.langEn")}
            </button>
          </div>
          <h3 className="settings-h" style={{ marginTop: 22 }}>
            {t("settings.outputMode")}
          </h3>
          <p className="settings-note">{t("settings.outputHint")}</p>
          <div className="seg seg--3">
            {(["ru", "en", "hybrid"] as AiOutputMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`seg__btn ${outputMode === m ? "seg__btn--on" : ""}`}
                aria-pressed={outputMode === m}
                onClick={() => setOutputMode(m)}
              >
                {m === "ru" ? t("settings.outputRu") : m === "en" ? t("settings.outputEn") : t("settings.outputHybrid")}
              </button>
            ))}
          </div>
        </article>

        <article className="glass-panel settings-card">
          <h3 className="settings-h">{t("settings.openai")}</h3>
          <label className="field-label" htmlFor="api-key">
            {t("settings.apiKey")}
          </label>
          <input
            id="api-key"
            className="input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
          />
          <p className="settings-note">{t("settings.apiNote", { masked: masked || t("settings.notSet") })}</p>
          <label className="field-label" htmlFor="model" style={{ marginTop: 14 }}>
            {t("settings.model")}
          </label>
          <input id="model" className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4.1-mini" />
          <p className="settings-note" style={{ marginTop: 10 }}>
            {t("settings.visionHint")}
          </p>
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="ghost-btn" onClick={() => void testConnection()} disabled={testing}>
              {testing ? t("settings.testing") : t("settings.test")}
            </button>
            {status && <span className={`status ${status.ok ? "status--ok" : "status--bad"}`}>{status.text}</span>}
          </div>
        </article>

        <article className="glass-panel settings-card settings-card--wide">
          <h3 className="settings-h">{t("settings.projects")}</h3>
          <p className="settings-note" style={{ marginTop: 0 }}>
            {t("settings.projectsDesc")}
          </p>
          <div className="proj-create">
            <input
              className="input"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder={t("settings.projectName")}
            />
            <button type="button" className="ghost-btn" onClick={onCreateProject}>
              {t("settings.createProject")}
            </button>
          </div>
          <p className="settings-note" style={{ marginTop: 12 }}>
            {t("settings.activeProject")}: <span className="mono">{activeId ? projects.find((p) => p.id === activeId)?.title ?? "—" : "—"}</span>
          </p>
          <ul className="proj-list">
            {projects.length === 0 ? (
              <li className="proj-empty">{t("settings.noProjects")}</li>
            ) : (
              projects.map((p) => (
                <li key={p.id} className="proj-row">
                  <div>
                    <p className="proj-name">{p.title}</p>
                    <p className="proj-meta">
                      {p.generationCount + p.visualCount} {t("settings.items")}
                    </p>
                  </div>
                  <div className="proj-actions">
                    <button
                      type="button"
                      className={`ghost-btn ${activeId === p.id ? "ghost-btn--on" : ""}`}
                      aria-pressed={activeId === p.id}
                      onClick={() => onSelectProject(p.id)}
                    >
                      {t("settings.load")}
                    </button>
                    <button type="button" className="ghost-btn ghost-btn--danger" onClick={() => onDeleteProject(p.id)}>
                      {t("settings.delete")}
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="glass-panel settings-card">
          <h3 className="settings-h">{t("settings.governance")}</h3>
          <label className="toggle">
            <input type="checkbox" checked={strictDna} onChange={(e) => setStrictDna(e.target.checked)} />
            <span>{t("settings.strictDna")}</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <span>{t("settings.notify")}</span>
          </label>
        </article>

        <article className="glass-panel settings-card settings-card--wide">
          <h3 className="settings-h">{t("settings.exportProfiles")}</h3>
          <div className="profiles">
            <button type="button" className="ghost-btn">
              {t("settings.exportWildberries")}
            </button>
            <button type="button" className="ghost-btn">
              {t("settings.exportOzon")}
            </button>
            <button type="button" className="ghost-btn">
              {t("settings.exportSocial")}
            </button>
          </div>
        </article>
      </div>
      <style>{`
        .view__header {
          margin-bottom: 22px;
        }
        .view__title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          margin-bottom: 8px;
        }
        .view__desc {
          max-width: 560px;
          margin: 0;
        }
        .settings-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .settings-card {
          padding: 22px;
        }
        .settings-card--wide {
          grid-column: span 2;
        }
        .settings-h {
          font-family: var(--font-display);
          margin: 0 0 16px;
          font-size: 1rem;
        }
        .settings-note {
          margin: 12px 0 0;
          font-size: 0.82rem;
          color: var(--faint);
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          letter-spacing: 0.08em;
        }
        .row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .status {
          font-size: 0.82rem;
          color: var(--muted);
        }
        .status--ok {
          color: rgba(120, 255, 186, 0.85);
        }
        .status--bad {
          color: rgba(255, 130, 130, 0.92);
        }
        .toggle {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
          font-size: 0.9rem;
          color: var(--muted);
          cursor: pointer;
        }
        .toggle input {
          margin-top: 4px;
          accent-color: var(--accent);
        }
        .profiles {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .proj-create {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .proj-list {
          list-style: none;
          margin: 16px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .proj-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.2);
        }
        .proj-name {
          margin: 0;
          font-size: 0.92rem;
          color: var(--text);
        }
        .proj-meta {
          margin: 4px 0 0;
          font-size: 0.75rem;
          color: var(--faint);
        }
        .proj-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .proj-empty {
          margin: 0;
          color: var(--muted);
          font-size: 0.88rem;
        }
        .ghost-btn--danger {
          border-color: rgba(255, 90, 90, 0.35);
          color: rgba(255, 200, 200, 0.95);
        }
        @media (max-width: 720px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .settings-card--wide {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
