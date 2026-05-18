type T = (key: string) => string;

type Phase = "idle" | "running";

export function CommandCenterAtmosphere({ phase, t }: { phase: Phase; t: T }) {
  const isRun = phase === "running";
  const sweep = isRun ? "18s" : "42s";
  const drift = isRun ? "32s" : "64s";
  const pulse = isRun ? "0.95s" : "1.65s";

  return (
    <div className={`scc-atmo scc-atmo--${phase}`} role="region" aria-label={isRun ? t("command.running") : t("command.idleAria")}>
      <div className="scc-atmo__bgflow" aria-hidden />
      <div className="scc-atmo__bgflow scc-atmo__bgflow--slow" aria-hidden />
      <div className="scc-atmo__ambient-pulse" aria-hidden />
      <div className="scc-atmo__grain" aria-hidden />
      <div className="scc-atmo__vignette" aria-hidden />
      <div className="scc-atmo__glass-edge" aria-hidden />
      <div className="scc-atmo__lift-shadow" aria-hidden />

      <div className="scc-atmo__inner">
        {/* Primary: domination monolith */}
        <section className="scc-atmo__monolith" aria-labelledby="scc-atmo-dom-heading">
          <div className="scc-atmo__monolith-glow" aria-hidden />
          <div className="scc-atmo__monolith-sheen" aria-hidden />
          <div className="scc-atmo__monolith-glass-sweep" aria-hidden />

          <div className="scc-atmo__state-row">
            <span className="scc-atmo__live" aria-hidden />
            <span className="scc-atmo__state-mini">{isRun ? t("command.atmoStateRun") : t("command.atmoStateIdle")}</span>
          </div>

          <h3 id="scc-atmo-dom-heading" className="scc-atmo__dom-wordmark">
            <span className="scc-atmo__dom-line1">{t("command.atmoDomLine1")}</span>
            <span className="scc-atmo__dom-line2">{t("command.atmoDomLine2")}</span>
          </h3>

          <div className="scc-atmo__dom-stage">
            <div className="scc-atmo__dom-stack">
              <div className="scc-atmo__dom-halo" aria-hidden />
              <div className="scc-atmo__dom-outer" aria-hidden>
                <div className="scc-atmo__dom-ticks">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i} className="scc-atmo__dom-tick" style={{ transform: `rotate(${i * 15}deg)` }} />
                  ))}
                </div>
                <span className="scc-atmo__dom-arc-outer" />
              </div>
              <div className="scc-atmo__dom-bezel" aria-hidden />
              <div className="scc-atmo__dom-ring">
                <span className="scc-atmo__dom-orbit" aria-hidden />
                <span className="scc-atmo__dom-spin" aria-hidden />
                <span className="scc-atmo__dom-arc-inner" aria-hidden />
                <span className="scc-atmo__dom-face" aria-hidden />
                <div className="scc-atmo__dom-particles" aria-hidden>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className={`scc-atmo__dom-particle scc-atmo__dom-particle--p${i}`} />
                  ))}
                </div>
                <span className="scc-atmo__dom-reflect" aria-hidden />
                <span className="scc-atmo__dom-ghost" aria-hidden>
                  —
                </span>
              </div>
            </div>
            <p className="scc-atmo__dom-meta">{t("command.atmoDomMeta")}</p>
          </div>
        </section>

        {/* Secondary: telemetry + traces (computational presence, sparse) */}
        <div className="scc-atmo__telemetry" role="group" aria-label={t("command.atmoTelemetryCap")}>
          <span className="scc-atmo__tel-cap">{t("command.atmoTelemetryCap")}</span>
          <div className="scc-atmo__tel-rail">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="scc-atmo__tel-ch">
                <span className="scc-atmo__tel-fill" style={{ animationDelay: `${i * 0.19}s` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="scc-atmo__traces" aria-hidden>
          <span className="scc-atmo__trace-line scc-atmo__trace-line--a" />
          <span className="scc-atmo__trace-line scc-atmo__trace-line--b" />
          <span className="scc-atmo__trace-line scc-atmo__trace-line--c" />
          <span className="scc-atmo__trace-line scc-atmo__trace-line--d" />
        </div>

        <section className="scc-atmo__secondary" aria-label={t("command.atmoSecondaryMp")}>
          <div className="scc-atmo__secondary-grid">
            <div className="scc-atmo__mp-wrap">
              <p className="scc-atmo__sec-label">{t("command.atmoSecondaryMp")}</p>
              <div className="scc-atmo__mp">
                <div className="scc-atmo__mp-flow" aria-hidden />
                <div className="scc-atmo__mp-row">
                  <div className="scc-atmo__mp-ch">
                    <span className="scc-atmo__mp-tag">WB</span>
                    <div className="scc-atmo__mp-bars">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <i key={i} style={{ animationDelay: `${i * 0.06}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="scc-atmo__mp-ch">
                    <span className="scc-atmo__mp-tag">Ozon</span>
                    <div className="scc-atmo__mp-bars scc-atmo__mp-bars--oz">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <i key={i} style={{ animationDelay: `${0.28 + i * 0.06}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="scc-atmo__radar-wrap">
              <p className="scc-atmo__sec-label scc-atmo__sec-label--radar">{t("command.atmoRadarCap")}</p>
              <div className="scc-atmo__radar">
                <div className="scc-atmo__radar-mesh" aria-hidden />
                <div className="scc-atmo__radar-sweep" aria-hidden />
                <div className="scc-atmo__radar-sweep scc-atmo__radar-sweep--echo" aria-hidden />
                <div className="scc-atmo__radar-core" aria-hidden />
              </div>
            </div>
          </div>
        </section>

        <footer className="scc-atmo__tertiary">
          <p className="scc-atmo__dept-cap">{t("command.atmoDeptsCaption")}</p>
          <ul className="scc-atmo__dept-list">
            <li>
              <span className="scc-atmo__dept-dot" aria-hidden />
              {t("command.deptTagTrend")}
            </li>
            <li>
              <span className="scc-atmo__dept-dot" aria-hidden />
              {t("command.deptTagVisual")}
            </li>
            <li>
              <span className="scc-atmo__dept-dot" aria-hidden />
              {t("command.deptTagComp")}
            </li>
            <li>
              <span className="scc-atmo__dept-dot" aria-hidden />
              {t("command.deptTagMem")}
            </li>
          </ul>
        </footer>
      </div>

      <div className="scc-atmo__intel-feed" aria-hidden="true">
        <span className="scc-atmo__intel-feed__mark">{t("command.atmoIntelMark")}</span>
        <div className="scc-atmo__intel-feed__viewport">
          <span className="scc-atmo__intel-feed__line scc-atmo__intel-feed__line--0">{t("command.atmoIntel1")}</span>
          <span className="scc-atmo__intel-feed__line scc-atmo__intel-feed__line--1">{t("command.atmoIntel2")}</span>
          <span className="scc-atmo__intel-feed__line scc-atmo__intel-feed__line--2">{t("command.atmoIntel3")}</span>
          <span className="scc-atmo__intel-feed__line scc-atmo__intel-feed__line--3">{t("command.atmoIntel4")}</span>
        </div>
      </div>

      <style>{`
        .scc-atmo {
          --sweep: ${sweep};
          --drift: ${drift};
          --mpulse: ${pulse};
          position: relative;
          min-height: min(640px, 78vh);
          border-radius: 24px;
          overflow: hidden;
          background: #06070b;
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            inset 0 -32px 64px rgba(0, 0, 0, 0.55),
            0 3px 0 rgba(0, 0, 0, 0.45),
            0 40px 80px rgba(0, 0, 0, 0.55),
            0 0 1px rgba(0, 0, 0, 0.8);
        }
        .scc-atmo--running {
          border-color: rgba(105, 120, 195, 0.32);
          box-shadow:
            inset 0 1px 0 rgba(125, 140, 210, 0.12),
            inset 0 -32px 64px rgba(0, 0, 0, 0.58),
            0 0 0 1px rgba(85, 98, 165, 0.14),
            0 44px 88px rgba(0, 0, 0, 0.58),
            0 0 100px rgba(65, 78, 145, 0.07);
        }
        .scc-atmo__lift-shadow {
          pointer-events: none;
          position: absolute;
          inset: 10px;
          border-radius: 18px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          opacity: 0.5;
        }
        .scc-atmo__bgflow {
          position: absolute;
          inset: -3px;
          background:
            linear-gradient(118deg, rgba(32, 34, 48, 0.95) 0%, transparent 45%),
            linear-gradient(305deg, rgba(110, 128, 200, 0.08) 0%, transparent 40%),
            radial-gradient(90% 55% at 50% -5%, rgba(115, 135, 210, 0.11), transparent 55%),
            linear-gradient(185deg, #0e0f16, #040508);
          background-size: 220% 220%;
          animation: scc-atmo-drift var(--drift) ease-in-out infinite alternate;
        }
        .scc-atmo__bgflow--slow {
          opacity: 0.55;
          mix-blend-mode: soft-light;
          animation-duration: calc(var(--drift) * 1.6);
          animation-direction: alternate-reverse;
        }
        .scc-atmo__ambient-pulse {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 100% 80% at 50% 30%, rgba(95, 115, 195, 0.07), transparent 55%);
          animation: scc-atmo-ambientpulse 11s ease-in-out infinite;
          opacity: 0.85;
        }
        .scc-atmo__grain {
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }
        .scc-atmo__vignette {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 88% 72% at 50% 42%, transparent 35%, rgba(0, 0, 0, 0.62) 100%);
          mix-blend-mode: multiply;
        }
        .scc-atmo__glass-edge {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 -18px 40px rgba(0, 0, 0, 0.22);
        }
        .scc-atmo__inner {
          position: relative;
          z-index: 1;
          padding: 26px 26px 22px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .scc-atmo__monolith {
          position: relative;
          text-align: center;
          padding: 30px 18px 34px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background:
            linear-gradient(168deg, rgba(255, 255, 255, 0.1) 0%, transparent 48%),
            linear-gradient(0deg, rgba(0, 0, 0, 0.48), rgba(12, 13, 20, 0.86));
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.14),
            inset 0 -36px 72px rgba(0, 0, 0, 0.58),
            0 28px 60px rgba(0, 0, 0, 0.48),
            0 0 0 1px rgba(0, 0, 0, 0.42);
        }
        .scc-atmo__monolith-glow {
          pointer-events: none;
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: radial-gradient(65% 55% at 50% 0%, rgba(120, 138, 215, 0.2), transparent 62%);
          opacity: 0.55;
          animation: scc-atmo-monobreathe 6s ease-in-out infinite;
        }
        .scc-atmo__monolith-sheen {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(125deg, rgba(255, 255, 255, 0.06) 0%, transparent 38%, transparent 62%, rgba(255, 255, 255, 0.02) 100%);
          opacity: 0.45;
          animation: scc-atmo-monosheen 22s ease-in-out infinite;
        }
        .scc-atmo__monolith-glass-sweep {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            108deg,
            transparent 0%,
            transparent 42%,
            rgba(255, 255, 255, 0.055) 50.5%,
            transparent 59%,
            transparent 100%
          );
          background-size: 220% 100%;
          mix-blend-mode: soft-light;
          opacity: 0.32;
          animation: scc-atmo-glasssweep ${isRun ? "11s" : "19s"} ease-in-out infinite;
        }
        .scc-atmo__state-row {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 6px 14px 6px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.28);
        }
        .scc-atmo__live {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(130, 150, 230, 0.9);
          box-shadow: 0 0 0 3px rgba(120, 140, 220, 0.1), 0 0 14px rgba(120, 140, 220, 0.35);
          animation: scc-atmo-livepulse 2.6s ease-in-out infinite;
        }
        .scc-atmo__state-mini {
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: rgba(244, 243, 239, 0.48);
        }
        .scc-atmo__dom-wordmark {
          position: relative;
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: rgba(244, 243, 239, 0.97);
        }
        .scc-atmo__dom-line1 {
          display: block;
          font-size: clamp(2.15rem, 6.2vw, 3.75rem);
          letter-spacing: -0.035em;
          text-shadow:
            0 2px 32px rgba(0, 0, 0, 0.55),
            0 0 60px rgba(90, 110, 185, 0.12);
        }
        .scc-atmo__dom-line2 {
          display: block;
          margin-top: 4px;
          font-size: clamp(1.65rem, 4.6vw, 2.85rem);
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(195, 205, 248, 0.62);
        }
        .scc-atmo__dom-stage {
          position: relative;
          margin-top: 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .scc-atmo__dom-stack {
          --dom-outer: clamp(220px, 44vw, 312px);
          --dom-ring: clamp(168px, 34vw, 238px);
          position: relative;
          width: var(--dom-outer);
          height: var(--dom-outer);
          margin: 10px auto 0;
        }
        .scc-atmo__dom-halo {
          position: absolute;
          inset: -6%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 45%, rgba(120, 140, 215, 0.14), transparent 62%);
          filter: blur(12px);
          opacity: 0.75;
          animation: scc-atmo-halopulse 7.5s ease-in-out infinite;
        }
        .scc-atmo__dom-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: radial-gradient(circle at 50% 50%, transparent 58%, rgba(0, 0, 0, 0.25) 100%);
          box-shadow:
            inset 0 0 0 1px rgba(0, 0, 0, 0.35),
            0 0 40px rgba(0, 0, 0, 0.35);
          animation: scc-atmo-outerpulse 9s ease-in-out infinite;
        }
        .scc-atmo__dom-ticks {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          pointer-events: none;
        }
        .scc-atmo__dom-tick {
          position: absolute;
          left: 50%;
          bottom: 50%;
          width: 1px;
          height: 11%;
          margin-left: -0.5px;
          transform-origin: 50% 100%;
          background: linear-gradient(180deg, rgba(230, 232, 250, 0.35), transparent);
          opacity: 0.55;
        }
        .scc-atmo__dom-arc-outer {
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 268deg,
            rgba(175, 190, 245, 0.22) 292deg,
            rgba(220, 225, 255, 0.28) 302deg,
            rgba(140, 158, 220, 0.12) 312deg,
            transparent 360deg
          );
          opacity: 0.55;
          animation: scc-atmo-spin ${isRun ? "26s" : "56s"} linear infinite;
        }
        .scc-atmo__dom-bezel {
          position: absolute;
          width: var(--dom-ring);
          height: var(--dom-ring);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.09),
            0 32px 64px rgba(0, 0, 0, 0.5),
            inset 0 0 56px rgba(0, 0, 0, 0.42);
          pointer-events: none;
        }
        .scc-atmo__dom-ring {
          position: absolute;
          width: var(--dom-ring);
          height: var(--dom-ring);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          display: grid;
          place-items: center;
        }
        .scc-atmo__dom-orbit {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.07);
          opacity: 0.85;
          animation: scc-atmo-spin ${isRun ? "92s" : "168s"} linear infinite;
        }
        .scc-atmo__dom-spin {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from -90deg,
            rgba(135, 155, 235, 0.55),
            rgba(130, 150, 230, 0.06),
            rgba(255, 255, 255, 0.05),
            rgba(130, 150, 230, 0.06),
            rgba(135, 155, 235, 0.48)
          );
          animation: scc-atmo-spin var(--sweep) linear infinite;
        }
        .scc-atmo__dom-arc-inner {
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            transparent 0deg,
            transparent 270deg,
            rgba(255, 255, 255, 0.06) 292deg,
            rgba(200, 210, 250, 0.12) 305deg,
            transparent 318deg
          );
          opacity: 0.45;
          animation: scc-atmo-spin ${isRun ? "44s" : "88s"} linear infinite reverse;
        }
        .scc-atmo__dom-face {
          position: absolute;
          inset: 16px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 32% 18%, rgba(255, 255, 255, 0.16), transparent 38%),
            radial-gradient(circle at 70% 85%, rgba(80, 95, 160, 0.08), transparent 45%),
            radial-gradient(circle at 50% 100%, rgba(0, 0, 0, 0.58), rgba(5, 6, 11, 0.97));
          border: 1px solid rgba(255, 255, 255, 0.11);
          box-shadow:
            inset 0 16px 48px rgba(0, 0, 0, 0.7),
            inset 0 -3px 0 rgba(255, 255, 255, 0.05);
          z-index: 1;
          animation: scc-atmo-facedepth ${isRun ? "9s" : "14s"} ease-in-out infinite;
        }
        .scc-atmo__dom-particles {
          position: absolute;
          inset: 14px;
          border-radius: 50%;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
        }
        .scc-atmo__dom-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(210, 218, 252, 0.55);
          box-shadow: 0 0 5px rgba(130, 150, 220, 0.25);
          opacity: 0;
          animation: scc-atmo-partpulse 6.8s ease-in-out infinite;
        }
        .scc-atmo__dom-particle--p0 {
          left: 22%;
          top: 18%;
          animation-delay: 0s;
        }
        .scc-atmo__dom-particle--p1 {
          left: 78%;
          top: 24%;
          animation-delay: 0.9s;
        }
        .scc-atmo__dom-particle--p2 {
          left: 14%;
          top: 52%;
          animation-delay: 1.8s;
        }
        .scc-atmo__dom-particle--p3 {
          left: 86%;
          top: 48%;
          animation-delay: 2.4s;
        }
        .scc-atmo__dom-particle--p4 {
          left: 48%;
          top: 12%;
          animation-delay: 3.1s;
        }
        .scc-atmo__dom-particle--p5 {
          left: 34%;
          top: 72%;
          animation-delay: 4.2s;
        }
        .scc-atmo__dom-particle--p6 {
          left: 62%;
          top: 78%;
          animation-delay: 5.1s;
        }
        .scc-atmo__dom-reflect {
          position: absolute;
          inset: 16px;
          border-radius: 50%;
          background: linear-gradient(
            165deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.02) 22%,
            transparent 45%,
            transparent 100%
          );
          mix-blend-mode: soft-light;
          z-index: 3;
          pointer-events: none;
          opacity: 0.85;
          animation: scc-atmo-reflectshift 14s ease-in-out infinite;
        }
        .scc-atmo__dom-ghost {
          position: relative;
          z-index: 4;
          font-family: var(--font-display);
          font-size: clamp(2.85rem, 7.2vw, 4.1rem);
          font-weight: 800;
          letter-spacing: 0.07em;
          color: rgba(244, 243, 239, 0.14);
          text-shadow:
            0 0 48px rgba(110, 130, 200, 0.1),
            0 4px 24px rgba(0, 0, 0, 0.45);
        }
        .scc-atmo__dom-meta {
          margin: 22px 0 0;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(175, 190, 235, 0.48);
        }
        .scc-atmo__telemetry {
          position: relative;
          padding: 14px 16px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent),
            rgba(5, 6, 10, 0.55);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -16px 32px rgba(0, 0, 0, 0.35);
        }
        .scc-atmo__tel-cap {
          display: block;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.28);
          margin-bottom: 12px;
        }
        .scc-atmo__tel-rail {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 6px;
          height: 36px;
        }
        .scc-atmo__tel-ch {
          flex: 1;
          height: 100%;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.04);
          position: relative;
          overflow: hidden;
        }
        .scc-atmo__tel-fill {
          position: absolute;
          left: 1px;
          right: 1px;
          bottom: 1px;
          height: 22%;
          border-radius: 2px;
          background: linear-gradient(180deg, rgba(165, 180, 235, 0.55), rgba(110, 128, 200, 0.12));
          transform-origin: bottom;
          animation: scc-atmo-telwave var(--mpulse) ease-in-out infinite;
        }
        .scc-atmo__tel-ch:nth-child(3n + 2) .scc-atmo__tel-fill {
          animation-name: scc-atmo-telwave-b;
        }
        .scc-atmo__tel-ch:nth-child(5n + 3) .scc-atmo__tel-fill {
          animation-name: scc-atmo-telwave-c;
        }
        .scc-atmo__tel-ch:nth-child(4n + 1) .scc-atmo__tel-fill {
          animation-duration: calc(var(--mpulse) * 1.1);
        }
        .scc-atmo__tel-ch:nth-child(4n + 3) .scc-atmo__tel-fill {
          animation-duration: calc(var(--mpulse) * 0.86);
        }
        .scc-atmo__tel-ch:nth-child(7n + 5) .scc-atmo__tel-fill {
          animation-delay: 0.35s;
        }
        .scc-atmo__traces {
          position: relative;
          height: 28px;
          margin: 2px 0;
          overflow: hidden;
          border-radius: 8px;
          opacity: 0.55;
        }
        .scc-atmo__trace-line {
          position: absolute;
          height: 1px;
          width: 140%;
          left: -20%;
          top: 50%;
          background: linear-gradient(90deg, transparent, rgba(150, 165, 220, 0.35), transparent);
          transform-origin: center;
        }
        .scc-atmo__trace-line--a {
          animation: scc-atmo-tracea 11s ease-in-out infinite;
        }
        .scc-atmo__trace-line--b {
          top: 38%;
          opacity: 0.65;
          animation: scc-atmo-traceb 14s ease-in-out infinite reverse;
        }
        .scc-atmo__trace-line--c {
          top: 62%;
          opacity: 0.45;
          animation: scc-atmo-tracec 9s ease-in-out infinite;
        }
        .scc-atmo__trace-line--d {
          top: 50%;
          opacity: 0.35;
          animation: scc-atmo-traced 16s linear infinite;
        }
        .scc-atmo__secondary {
          padding: 0;
          border: none;
          background: transparent;
        }
        .scc-atmo__secondary-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: end;
        }
        @media (max-width: 720px) {
          .scc-atmo__secondary-grid {
            grid-template-columns: 1fr;
          }
          .scc-atmo__radar-wrap {
            justify-self: center;
          }
        }
        .scc-atmo__mp-wrap {
          min-width: 0;
          padding: 16px 16px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(6, 7, 11, 0.58);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -20px 40px rgba(0, 0, 0, 0.35);
        }
        .scc-atmo__sec-label {
          margin: 0 0 12px;
          font-size: 0.76rem;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: rgba(244, 243, 239, 0.36);
        }
        .scc-atmo__sec-label--radar {
          text-align: center;
          margin-bottom: 10px;
        }
        .scc-atmo__mp {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }
        .scc-atmo__mp-flow {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(120, 138, 210, 0.07) 46%,
            rgba(120, 138, 210, 0.11) 50%,
            rgba(120, 138, 210, 0.07) 54%,
            transparent
          );
          background-size: 35% 100%;
          animation: scc-atmo-mpflow 12s linear infinite;
          opacity: 0.55;
          pointer-events: none;
        }
        .scc-atmo__mp-row {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 2px 0 0;
        }
        .scc-atmo__mp-tag {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(244, 243, 239, 0.32);
          margin-bottom: 8px;
        }
        .scc-atmo__mp-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 36px;
        }
        .scc-atmo__mp-bars i {
          flex: 1;
          min-width: 2px;
          border-radius: 2px;
          background: linear-gradient(180deg, rgba(155, 170, 225, 0.5), rgba(100, 118, 190, 0.08));
          transform-origin: bottom;
          animation: scc-atmo-mpbar-wave var(--mpulse) ease-in-out infinite;
        }
        .scc-atmo__mp-bars i:nth-child(5n + 2) {
          animation-name: scc-atmo-mpbar-drift;
        }
        .scc-atmo__mp-bars i:nth-child(5n + 4) {
          animation-name: scc-atmo-mpbar-lull;
        }
        .scc-atmo__mp-bars i:nth-child(7n + 1) {
          animation-name: scc-atmo-mpbar-spike;
        }
        .scc-atmo__mp-bars i:nth-child(odd) {
          animation-duration: calc(var(--mpulse) * 1.14);
        }
        .scc-atmo__mp-bars--oz i {
          animation-delay: 0.12s;
        }
        .scc-atmo__radar-wrap {
          padding: 12px 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(4, 5, 9, 0.65);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          width: 132px;
        }
        .scc-atmo__radar {
          position: relative;
          width: 108px;
          height: 108px;
          margin: 0 auto;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, rgba(24, 26, 36, 0.98), rgba(4, 5, 9, 0.99));
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: inset 0 0 28px rgba(0, 0, 0, 0.55), 0 0 28px rgba(80, 95, 170, 0.06);
        }
        .scc-atmo__radar-mesh {
          position: absolute;
          inset: 7px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background:
            radial-gradient(circle, transparent 46%, rgba(255, 255, 255, 0.03) 47%, transparent 48%),
            repeating-conic-gradient(from 0deg, transparent 0deg 12deg, rgba(255, 255, 255, 0.015) 12deg 13deg);
        }
        .scc-atmo__radar-sweep {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 252deg,
            rgba(120, 138, 210, 0.1) 280deg,
            rgba(185, 198, 245, 0.16) 296deg,
            rgba(120, 138, 210, 0.07) 312deg,
            transparent 360deg
          );
          animation: scc-atmo-spin var(--sweep) linear infinite;
        }
        .scc-atmo__radar-sweep--echo {
          opacity: 0.3;
          animation: scc-atmo-spin ${isRun ? "27s" : "63s"} linear infinite reverse;
          filter: blur(1px);
        }
        .scc-atmo__radar-core {
          position: absolute;
          inset: 34%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(120, 138, 210, 0.16), transparent 70%);
          filter: blur(4px);
          animation: scc-atmo-coresoft 3.8s ease-in-out infinite;
        }
        .scc-atmo__tertiary {
          padding: 16px 4px 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .scc-atmo__dept-cap {
          margin: 0 0 10px;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(244, 243, 239, 0.26);
        }
        .scc-atmo__dept-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
        }
        .scc-atmo__dept-list li {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.76rem;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: rgba(244, 243, 239, 0.38);
        }
        .scc-atmo__dept-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(120, 138, 210, 0.4);
          box-shadow: 0 0 8px rgba(120, 138, 210, 0.22);
          animation: scc-atmo-standby 2.8s ease-in-out infinite;
        }
        .scc-atmo__dept-list li:nth-child(2) .scc-atmo__dept-dot {
          animation-delay: 0.35s;
        }
        .scc-atmo__dept-list li:nth-child(3) .scc-atmo__dept-dot {
          animation-delay: 0.7s;
        }
        .scc-atmo__dept-list li:nth-child(4) .scc-atmo__dept-dot {
          animation-delay: 1.05s;
        }
        .scc-atmo__intel-feed {
          pointer-events: none;
          position: absolute;
          z-index: 2;
          right: 22px;
          bottom: 20px;
          max-width: min(268px, 44vw);
          text-align: right;
        }
        .scc-atmo__intel-feed__mark {
          display: block;
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          color: rgba(190, 200, 235, 0.26);
          margin-bottom: 7px;
        }
        .scc-atmo__intel-feed__viewport {
          position: relative;
          min-height: 2.75em;
        }
        .scc-atmo__intel-feed__line {
          position: absolute;
          right: 0;
          top: 0;
          max-width: 100%;
          font-size: 0.67rem;
          font-weight: 500;
          letter-spacing: 0.015em;
          line-height: 1.38;
          color: rgba(218, 224, 248, 0.36);
          opacity: 0;
          text-shadow: 0 1px 18px rgba(0, 0, 0, 0.55);
          animation: scc-atmo-intelbeat 16s ease-in-out infinite;
        }
        .scc-atmo__intel-feed__line--0 {
          animation-delay: 0s;
        }
        .scc-atmo__intel-feed__line--1 {
          animation-delay: 4s;
        }
        .scc-atmo__intel-feed__line--2 {
          animation-delay: 8s;
        }
        .scc-atmo__intel-feed__line--3 {
          animation-delay: 12s;
        }
        @media (max-width: 520px) {
          .scc-atmo__intel-feed {
            right: 16px;
            bottom: 14px;
            max-width: 56vw;
          }
          .scc-atmo__intel-feed__line {
            font-size: 0.62rem;
          }
        }
        @keyframes scc-atmo-ambientpulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }
        @keyframes scc-atmo-halopulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(0.98);
          }
          50% {
            opacity: 0.88;
            transform: scale(1.03);
          }
        }
        @keyframes scc-atmo-outerpulse {
          0%,
          100% {
            opacity: 0.88;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes scc-atmo-reflectshift {
          0%,
          100% {
            opacity: 0.75;
            transform: translateY(0);
          }
          50% {
            opacity: 0.95;
            transform: translateY(1px);
          }
        }
        @keyframes scc-atmo-drift {
          0% {
            background-position: 0% 35%;
          }
          100% {
            background-position: 100% 65%;
          }
        }
        @keyframes scc-atmo-monobreathe {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.72;
          }
        }
        @keyframes scc-atmo-livepulse {
          0%,
          100% {
            opacity: 0.72;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }
        @keyframes scc-atmo-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes scc-atmo-monosheen {
          0%,
          100% {
            opacity: 0.38;
            transform: translateX(-0.5%) skewX(-1deg);
          }
          50% {
            opacity: 0.52;
            transform: translateX(0.5%) skewX(0.5deg);
          }
        }
        @keyframes scc-atmo-glasssweep {
          0% {
            background-position: 0% 50%;
            opacity: 0.22;
          }
          50% {
            opacity: 0.38;
          }
          100% {
            background-position: 100% 50%;
            opacity: 0.22;
          }
        }
        @keyframes scc-atmo-partpulse {
          0%,
          38% {
            opacity: 0;
            transform: scale(0.5);
          }
          52% {
            opacity: 0.48;
            transform: scale(1);
          }
          68% {
            opacity: 0.12;
            transform: scale(0.85);
          }
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
        }
        @keyframes scc-atmo-facedepth {
          0%,
          100% {
            border-color: rgba(255, 255, 255, 0.1);
            filter: brightness(1);
          }
          50% {
            border-color: rgba(255, 255, 255, 0.14);
            filter: brightness(1.035);
          }
        }
        @keyframes scc-atmo-intelbeat {
          0%,
          5% {
            opacity: 0;
            transform: translateY(4px);
          }
          12%,
          24% {
            opacity: 0.62;
            transform: translateY(0);
          }
          30%,
          100% {
            opacity: 0;
            transform: translateY(-2px);
          }
        }
        @keyframes scc-atmo-telwave {
          0%,
          100% {
            height: 20%;
            opacity: 0.42;
          }
          26% {
            height: 52%;
            opacity: 0.68;
          }
          48% {
            height: 30%;
            opacity: 0.5;
          }
          71% {
            height: 92%;
            opacity: 0.86;
          }
          82% {
            height: 34%;
            opacity: 0.52;
          }
        }
        @keyframes scc-atmo-telwave-b {
          0%,
          100% {
            height: 26%;
            opacity: 0.38;
          }
          35% {
            height: 68%;
            opacity: 0.78;
          }
          58% {
            height: 24%;
            opacity: 0.44;
          }
          86% {
            height: 58%;
            opacity: 0.72;
          }
        }
        @keyframes scc-atmo-telwave-c {
          0%,
          100% {
            height: 32%;
            opacity: 0.48;
          }
          20% {
            height: 40%;
            opacity: 0.58;
          }
          58% {
            height: 88%;
            opacity: 0.9;
          }
          76% {
            height: 22%;
            opacity: 0.4;
          }
        }
        @keyframes scc-atmo-tracea {
          0%,
          100% {
            transform: translateY(-3px) rotate(-6deg);
            opacity: 0.25;
          }
          50% {
            transform: translateY(2px) rotate(-5deg);
            opacity: 0.55;
          }
        }
        @keyframes scc-atmo-traceb {
          0%,
          100% {
            transform: translateX(-4%) rotate(-3deg);
            opacity: 0.2;
          }
          50% {
            transform: translateX(4%) rotate(-4deg);
            opacity: 0.5;
          }
        }
        @keyframes scc-atmo-tracec {
          0%,
          100% {
            transform: translateX(2%) scaleX(0.85);
          }
          50% {
            transform: translateX(-3%) scaleX(1);
          }
        }
        @keyframes scc-atmo-traced {
          0% {
            transform: translateX(-15%) rotate(-2deg);
            opacity: 0.15;
          }
          100% {
            transform: translateX(15%) rotate(-2deg);
            opacity: 0.35;
          }
        }
        @keyframes scc-atmo-mpflow {
          0% {
            background-position: -15% 0;
          }
          100% {
            background-position: 115% 0;
          }
        }
        @keyframes scc-atmo-mpbar-wave {
          0%,
          100% {
            transform: scaleY(0.2);
            opacity: 0.36;
          }
          32% {
            transform: scaleY(0.78);
            opacity: 0.72;
          }
          54% {
            transform: scaleY(0.34);
            opacity: 0.48;
          }
          79% {
            transform: scaleY(1);
            opacity: 0.88;
          }
        }
        @keyframes scc-atmo-mpbar-drift {
          0%,
          100% {
            transform: scaleY(0.28);
            opacity: 0.42;
          }
          40% {
            transform: scaleY(0.62);
            opacity: 0.68;
          }
          72% {
            transform: scaleY(0.36);
            opacity: 0.52;
          }
        }
        @keyframes scc-atmo-mpbar-lull {
          0%,
          100% {
            transform: scaleY(0.16);
            opacity: 0.32;
          }
          45% {
            transform: scaleY(0.52);
            opacity: 0.58;
          }
          68% {
            transform: scaleY(0.88);
            opacity: 0.78;
          }
        }
        @keyframes scc-atmo-mpbar-spike {
          0%,
          100% {
            transform: scaleY(0.24);
            opacity: 0.38;
          }
          18% {
            transform: scaleY(0.42);
            opacity: 0.55;
          }
          63% {
            transform: scaleY(1);
            opacity: 0.9;
          }
          82% {
            transform: scaleY(0.3);
            opacity: 0.45;
          }
        }
        @keyframes scc-atmo-coresoft {
          0%,
          100% {
            opacity: 0.42;
          }
          50% {
            opacity: 0.82;
          }
        }
        @keyframes scc-atmo-standby {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.95;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .scc-atmo__bgflow,
          .scc-atmo__bgflow--slow,
          .scc-atmo__ambient-pulse,
          .scc-atmo__monolith-glow,
          .scc-atmo__monolith-sheen,
          .scc-atmo__monolith-glass-sweep,
          .scc-atmo__live,
          .scc-atmo__dom-arc-outer,
          .scc-atmo__dom-spin,
          .scc-atmo__dom-arc-inner,
          .scc-atmo__dom-orbit,
          .scc-atmo__dom-particle,
          .scc-atmo__dom-face,
          .scc-atmo__dom-reflect,
          .scc-atmo__dom-halo,
          .scc-atmo__radar-sweep,
          .scc-atmo__radar-core,
          .scc-atmo__tel-fill,
          .scc-atmo__trace-line,
          .scc-atmo__mp-flow,
          .scc-atmo__mp-bars i,
          .scc-atmo__dept-dot,
          .scc-atmo__intel-feed__line {
            animation: none !important;
          }
          .scc-atmo__monolith-sheen {
            opacity: 0.44;
            transform: none;
          }
          .scc-atmo__monolith-glass-sweep {
            opacity: 0.18;
          }
          .scc-atmo__dom-particle {
            opacity: 0.2;
          }
          .scc-atmo__intel-feed__line:not(:first-of-type) {
            display: none;
          }
          .scc-atmo__intel-feed__line:first-of-type {
            opacity: 0.44;
            transform: none;
          }
          .scc-atmo__tel-fill {
            height: 55%;
            opacity: 0.65;
          }
          .scc-atmo__mp-bars i {
            transform: scaleY(0.62);
            opacity: 0.65;
          }
        }
      `}</style>
    </div>
  );
}
