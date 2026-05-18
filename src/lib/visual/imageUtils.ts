const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type ReadImageResult =
  | { ok: true; mime: string; base64: string; dataUrl: string }
  | { ok: false; error: string };

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) return "Use JPEG, PNG, WebP, or GIF.";
  if (file.size > MAX_BYTES) return "Max file size is 4 MB.";
  return null;
}

export function readFileAsImageData(file: File): Promise<ReadImageResult> {
  const err = validateImageFile(file);
  if (err) return Promise.resolve({ ok: false, error: err });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl.startsWith("data:")) {
        resolve({ ok: false, error: "Could not read image." });
        return;
      }
      const comma = dataUrl.indexOf(",");
      if (comma === -1) {
        resolve({ ok: false, error: "Invalid image data." });
        return;
      }
      const header = dataUrl.slice(0, comma);
      const mimeMatch = header.match(/^data:([^;]+)/);
      const mime = mimeMatch?.[1] ?? file.type;
      const base64 = dataUrl.slice(comma + 1);
      resolve({ ok: true, mime, base64, dataUrl });
    };
    reader.onerror = () => resolve({ ok: false, error: "Read failed." });
    reader.readAsDataURL(file);
  });
}

export function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
