import { useEffect, useRef, useState } from 'react';

const SIZE = 64;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Clímax do loop de hábito (ver auditoria de motion) — o único momento "generoso"
 * do sistema: ring de progresso preenchendo + número em count-up, 400ms ease-in-out.
 * O ring marca o progresso dentro da semana atual (streak % 7), não o streak absoluto.
 */
export default function StreakBadge({ streak }: { streak: number }) {
  const [displayed, setDisplayed] = useState(0);
  const [fillFraction, setFillFraction] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const durationMs = 400;
    const start = performance.now();
    const targetFraction = ((streak - 1) % 7) + 1 === 0 ? 1 : (((streak - 1) % 7) + 1) / 7;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeInOutQuad(t);
      setDisplayed(Math.round(eased * streak));
      setFillFraction(eased * targetFraction);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [streak]);

  const offset = CIRCUMFERENCE * (1 - fillFraction);

  return (
    <div className="streak-badge">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="streak-badge-num">
          {displayed}
        </text>
      </svg>
      <span className="streak-badge-label">
        {streak === 1 ? 'dia seguido' : 'dias seguidos'}
      </span>
    </div>
  );
}
