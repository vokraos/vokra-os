import { useMemo, useState } from "react";
import { copyToClipboard, downloadText } from "../lib/markdown";
import { useI18n } from "../lib/i18n/I18nContext";

type Props = {
  markdown: string;
  filename: string;
};

export function OutputDeck({ markdown, filename }: Props) {
  const { t } = useI18n();
  const sections = useMemo(() => splitByHeadings(markdown), [markdown]);
  const [copied, setCopied] = useState<string | null>(null);

  async function onCopy(text: string, id: string) {
    await copyToClipboard(text);
    setCopied(id);
    window.setTimeout(() => setCopied((x) => (x === id ? null : x)), 900);
  }

  return (
    <div className="deck">
      <div className="deck__actions">
        <button type="button" className="ghost-btn" onClick={() => onCopy(markdown, "all")}>
          {copied === "all" ? t("common.copied") : t("outputdeck.copyAll")}
        </button>
        <button type="button" className="ghost-btn" onClick={() => downloadText(filename, markdown)}>
          {t("outputdeck.exportMd")}
        </button>
      </div>
      <div className="deck__stack">
        {sections.map((s, i) => {
          const id = `${i}`;
          return (
            <article key={id} className="glass-panel glass-panel--hover deck__card">
              <div className="deck__card-head">
                <h4 className="deck__h">{s.title}</h4>
                <button type="button" className="ghost-btn deck__copy" onClick={() => onCopy(`${s.title}\n\n${s.body}`, id)}>
                  {copied === id ? t("common.copied") : t("outputdeck.copySection")}
                </button>
              </div>
              <pre className="deck__pre">{s.body}</pre>
            </article>
          );
        })}
      </div>
      <style>{`
        .deck__actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin: 0 0 12px;
          flex-wrap: wrap;
        }
        .deck__stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .deck__card {
          padding: 18px 20px;
        }
        .deck__card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .deck__h {
          margin: 0;
          font-family: var(--font-display);
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .deck__copy {
          padding: 8px 12px;
          font-size: 0.68rem;
        }
        .deck__pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.82rem;
          line-height: 1.55;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

type Section = { title: string; body: string };

function splitByHeadings(md: string): Section[] {
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  let currentTitle = "Output";
  let current: string[] = [];

  function push() {
    const body = current.join("\n").trim();
    if (body) sections.push({ title: currentTitle, body });
    current = [];
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    const h = h2 || h3;
    if (h) {
      push();
      currentTitle = h[1].trim();
      continue;
    }
    current.push(line);
  }
  push();
  return sections;
}
