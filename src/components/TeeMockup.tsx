type Props = {
  printName?: string;
};

export function TeeMockup({ printName = "VOKRA" }: Props) {
  return (
    <div className="tee-wrap">
      <div className="tee-halo" aria-hidden />
      <svg className="tee-svg" viewBox="0 0 400 480" role="img" aria-label="Oversized t-shirt mockup">
        <defs>
          <linearGradient id="teeFabric" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15161c" />
            <stop offset="45%" stopColor="#0b0c10" />
            <stop offset="100%" stopColor="#1a1b22" />
          </linearGradient>
          <linearGradient id="teeRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <filter id="teeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="18" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0"
              result="b2"
            />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          fill="url(#teeFabric)"
          stroke="url(#teeRim)"
          strokeWidth="1.2"
          filter="url(#teeGlow)"
          d="M128 96c24-18 52-28 72-28s48 10 72 28l52 20c12 4 20 16 20 28v8l-28 160c-2 12-12 22-24 22H108c-12 0-22-10-24-22L56 152v-8c0-12 8-24 20-28l52-20z"
        />
        <path
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          d="M118 118c40-26 124-26 164 0"
        />
        <rect x="145" y="168" width="110" height="72" rx="10" fill="rgba(0,0,0,0.45)" />
        <text
          x="200"
          y="212"
          textAnchor="middle"
          fill="rgba(244,243,239,0.92)"
          fontFamily="var(--font-display), Syne, sans-serif"
          fontSize="22"
          fontWeight="700"
          letterSpacing="0.35em"
        >
          {printName.slice(0, 8).toUpperCase()}
        </text>
        <text
          x="200"
          y="232"
          textAnchor="middle"
          fill="rgba(123,143,255,0.85)"
          fontFamily="var(--font-body), DM Sans, sans-serif"
          fontSize="8"
          letterSpacing="0.42em"
        >
          OVERSIZED
        </text>
      </svg>
      <span className="tee-badge">Drop-ready mock</span>
      <style>{`
        .tee-wrap {
          position: relative;
          width: min(420px, 100%);
          margin: 0 auto;
        }
        .tee-halo {
          position: absolute;
          inset: 8% 10% 18%;
          background: radial-gradient(circle, rgba(123, 143, 255, 0.2), transparent 62%);
          filter: blur(26px);
          opacity: 0.55;
          pointer-events: none;
        }
        .tee-svg {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 28px 48px rgba(0, 0, 0, 0.75));
          animation: tee-float 7s ease-in-out infinite;
        }
        @keyframes tee-float {
          0%,
          100% {
            transform: translateY(0) rotate(-0.6deg);
          }
          50% {
            transform: translateY(-10px) rotate(0.6deg);
          }
        }
        .tee-badge {
          position: absolute;
          left: 50%;
          bottom: 4%;
          transform: translateX(-50%);
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid var(--stroke);
          background: rgba(5, 5, 7, 0.65);
          backdrop-filter: blur(10px);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        @media (prefers-reduced-motion: reduce) {
          .tee-svg {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
