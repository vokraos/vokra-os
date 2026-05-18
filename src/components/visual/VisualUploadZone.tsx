import { useId, useRef, useState } from "react";
import type { VisualStagedAsset } from "../../lib/visual/types";
import { readFileAsImageData, validateImageFile } from "../../lib/visual/imageUtils";

export type VisualIncomingAsset = Omit<VisualStagedAsset, "kind">;

type Props = {
  title: string;
  subtitle: string;
  asset: VisualStagedAsset | null;
  disabled?: boolean;
  busy?: boolean;
  dropCta?: string;
  replaceLabel?: string;
  clearLabel?: string;
  noFileError?: string;
  onAsset: (payload: VisualIncomingAsset) => void;
  onClear: () => void;
  onError: (msg: string) => void;
};

export function VisualUploadZone({
  title,
  subtitle,
  asset,
  disabled,
  busy,
  dropCta = "Drop or browse",
  replaceLabel = "Replace",
  clearLabel = "Clear",
  noFileError = "Drop an image file.",
  onAsset,
  onClear,
  onError,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localProgress, setLocalProgress] = useState(false);

  async function ingestFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      onError(noFileError);
      return;
    }
    const file = list[0];
    const v = validateImageFile(file);
    if (v) {
      onError(v);
      return;
    }
    setLocalProgress(true);
    try {
      const r = await readFileAsImageData(file);
      if (!r.ok) {
        onError(r.error);
        return;
      }
      onAsset({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        mime: r.mime,
        dataUrl: r.dataUrl,
        base64: r.base64,
        addedAt: Date.now(),
      });
    } finally {
      setLocalProgress(false);
    }
  }

  const showProgress = busy || localProgress;

  return (
    <div
      className={`vuz glass-panel ${drag ? "vuz--drag" : ""} ${asset ? "vuz--filled" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!disabled && !busy) void ingestFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="vuz__input"
        disabled={disabled || busy}
        onChange={(e) => {
          const f = e.target.files;
          if (f?.length) void ingestFiles(f);
          e.target.value = "";
        }}
      />
      {!asset ? (
        <label htmlFor={inputId} className={`vuz__drop ${disabled ? "vuz__drop--disabled" : ""}`}>
          <span className="vuz__glow" aria-hidden />
          <span className="vuz__icon" aria-hidden />
          <span className="vuz__title">{title}</span>
          <span className="vuz__sub">{subtitle}</span>
          <span className="vuz__cta">{dropCta}</span>
          {showProgress && (
            <span className="vuz__progress">
              <span className="vuz__progress-bar" />
            </span>
          )}
        </label>
      ) : (
        <div className="vuz__card">
          <div className="vuz__preview-wrap">
            <img src={asset.dataUrl} alt="" className="vuz__img" />
            <div className="vuz__preview-scan" aria-hidden />
          </div>
          <div className="vuz__meta">
            <p className="vuz__fname">{asset.fileName}</p>
            <p className="vuz__mime">{asset.mime}</p>
          </div>
          <div className="vuz__actions">
            <button type="button" className="ghost-btn vuz__btn" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
              {replaceLabel}
            </button>
            <button type="button" className="ghost-btn vuz__btn vuz__btn--danger" disabled={disabled || busy} onClick={onClear}>
              {clearLabel}
            </button>
          </div>
        </div>
      )}
      <style>{`
        .vuz {
          position: relative;
          overflow: hidden;
          min-height: 168px;
          transition: border-color 0.35s var(--ease-out), box-shadow 0.45s var(--ease-out), transform 0.4s var(--ease-out);
        }
        .vuz--drag {
          border-color: rgba(123, 143, 255, 0.55) !important;
          box-shadow: 0 0 0 1px rgba(123, 143, 255, 0.35), 0 28px 100px rgba(0, 0, 0, 0.55) !important;
          transform: translateY(-3px);
        }
        .vuz--filled {
          border-color: rgba(123, 143, 255, 0.22);
        }
        .vuz__input {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
        }
        .vuz__drop {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 8px;
          padding: 22px 20px;
          min-height: 168px;
          cursor: pointer;
          position: relative;
        }
        .vuz__drop--disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .vuz__glow {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle at 30% 20%, rgba(123, 143, 255, 0.14), transparent 45%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }
        .vuz:hover .vuz__glow,
        .vuz--drag .vuz__glow {
          opacity: 1;
        }
        .vuz__icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.35);
          margin-bottom: 4px;
          position: relative;
        }
        .vuz__icon::before,
        .vuz__icon::after {
          content: "";
          position: absolute;
          border-radius: 4px;
          background: rgba(244, 243, 239, 0.35);
        }
        .vuz__icon::before {
          inset: 9px 8px 14px;
        }
        .vuz__icon::after {
          inset: 14px 8px 8px;
          background: rgba(123, 143, 255, 0.45);
        }
        .vuz__title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text);
        }
        .vuz__sub {
          font-size: 0.82rem;
          color: var(--muted);
          max-width: 280px;
          line-height: 1.45;
        }
        .vuz__cta {
          margin-top: 8px;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .vuz__progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .vuz__progress-bar {
          display: block;
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(123, 143, 255, 0.9), transparent);
          animation: vuz-scan 1.1s ease-in-out infinite;
        }
        @keyframes vuz-scan {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }
        .vuz__card {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 16px;
          padding: 16px;
          align-items: center;
        }
        .vuz__preview-wrap {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--stroke);
          aspect-ratio: 1;
          background: #000;
        }
        .vuz__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vuz__preview-scan {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 40%, rgba(123, 143, 255, 0.12), transparent 60%);
          animation: vuz-shine 2.8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes vuz-shine {
          0% {
            transform: translateX(-100%);
          }
          55% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .vuz__meta {
          min-width: 0;
        }
        .vuz__fname {
          margin: 0 0 6px;
          font-size: 0.88rem;
          color: var(--text);
          word-break: break-word;
        }
        .vuz__mime {
          margin: 0;
          font-size: 0.72rem;
          color: var(--faint);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .vuz__actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .vuz__btn {
          font-size: 0.72rem;
          padding: 8px 14px;
        }
        .vuz__btn--danger {
          border-color: rgba(255, 90, 90, 0.35);
          color: rgba(255, 170, 170, 0.95);
        }
      `}</style>
    </div>
  );
}
