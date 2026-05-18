export type MdSection = { title: string; body: string };

export function splitMarkdownByHeadings(md: string): MdSection[] {
  const lines = md.split(/\r?\n/);
  const sections: MdSection[] = [];
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

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

