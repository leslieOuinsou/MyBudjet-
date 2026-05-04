import React, { useEffect, useState } from 'react';

const MESSAGES = [
  'Chargement de vos données',
  'Analyse des dépenses',
  'Calcul des soldes',
  'Presque prêt…',
];

/** Couleurs charte MyBudget+ (tailwind + pages login/dashboard) */
const COLORS = {
  bg: '#F5F7FA',
  bgRadial: 'rgba(30, 58, 138, 0.06)',
  text: '#343A40',
  textMuted: '#6C757D',
  textSoft: '#ADB5BD',
  line: '#DEE2E6',
  track: '#E9ECEF',
  accent: '#1E3A8A',
  accentLight: '#1E73BE',
};

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 1;
      });
    }, 28);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setFade(true);
      }, 300);
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .lb-root {
          background: ${COLORS.bg};
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .lb-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 45%, ${COLORS.bgRadial}, transparent 72%);
          pointer-events: none;
        }

        .lb-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${COLORS.text};
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 52px;
          animation: lbFadeUp 0.8s ease forwards;
          opacity: 0;
        }

        .lb-logo-plus {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentLight} 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          box-shadow: 0 10px 25px -5px rgba(30, 58, 138, 0.35);
        }

        .lb-ring-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          animation: lbFadeIn 0.6s ease forwards 0.6s;
          opacity: 0;
        }

        .lb-counter {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 22px;
          font-weight: 300;
          color: ${COLORS.text};
          letter-spacing: -0.04em;
          display: flex;
          align-items: baseline;
          gap: 1px;
        }

        .lb-pct {
          font-size: 11px;
          color: ${COLORS.textMuted};
        }

        .lb-status {
          margin-top: 36px;
          font-size: 11px;
          color: ${COLORS.textSoft};
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          height: 16px;
          animation: lbFadeIn 0.6s ease forwards 1.4s;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .lb-status.lb-hidden { opacity: 0 !important; }
        .lb-status.lb-visible { opacity: 1; }

        .lb-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px 24px;
          margin-top: 48px;
          animation: lbFadeUp 0.8s ease forwards 2s;
          opacity: 0;
        }

        .lb-tag {
          font-size: 10px;
          color: ${COLORS.textSoft};
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lb-tag::before {
          content: '';
          width: 16px;
          height: 1px;
          background: ${COLORS.line};
          display: inline-block;
        }

        .lb-sep {
          position: absolute;
          bottom: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(to right, transparent, ${COLORS.line} 30%, ${COLORS.line} 70%, transparent);
          animation: lbFadeIn 1s ease forwards 1.8s;
          opacity: 0;
        }

        @keyframes lbFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="lb-root">
        <div className="lb-logo">
          <span className="lb-logo-plus">M+</span>
          <span>MyBudget+</span>
        </div>

        <div className="lb-ring-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={COLORS.track}
              strokeWidth="1.5"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '60px 60px',
                transition: 'stroke-dashoffset 0.03s linear',
              }}
            />
          </svg>

          <div className="lb-counter">
            <span>{progress}</span>
            <span className="lb-pct">%</span>
          </div>
        </div>

        <div className={`lb-status ${fade ? 'lb-visible' : 'lb-hidden'}`} role="status">
          {MESSAGES[msgIndex]}
        </div>

        <div className="lb-tags">
          {['Budgets', 'Transactions', 'Statistiques'].map((t) => (
            <span key={t} className="lb-tag">
              {t}
            </span>
          ))}
        </div>

        <div className="lb-sep" />
      </div>
    </>
  );
}
