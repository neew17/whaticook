import { useEffect, useRef, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { formatDuration } from '../utils/stepDuration';
import { playTimerDoneSound } from '../utils/sound';

interface CookStepTimerProps {
  recipeId: string;
  stepIndex: number;
  durationSec: number;
}

const RADIUS = 80;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Cronômetro real de um passo ("asse por 12 minutos"). Conta pra baixo de
 * verdade, sobrevive à navegação entre passos (estado no AppState) e apita ao
 * zerar. Um por vez — iniciar em outro passo substitui o anterior.
 */
export default function CookStepTimer({ recipeId, stepIndex, durationSec }: CookStepTimerProps) {
  const { stepTimer, setStepTimer } = useAppState();
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  const mine = stepTimer && stepTimer.recipeId === recipeId && stepTimer.stepIndex === stepIndex;
  const otherRunning =
    stepTimer && !mine && !stepTimer.paused && stepTimer.recipeId === recipeId;

  useEffect(() => {
    if (!mine) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [mine]);

  const remaining = mine
    ? stepTimer!.paused
      ? stepTimer!.remainingSec
      : Math.max(0, Math.round((stepTimer!.endsAt - now) / 1000))
    : durationSec;

  const done = Boolean(mine) && remaining <= 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      playTimerDoneSound();
    }
    if (!done) firedRef.current = false;
  }, [done]);

  const start = () => {
    setStepTimer({
      recipeId,
      stepIndex,
      durationSec,
      endsAt: Date.now() + durationSec * 1000,
      paused: false,
      remainingSec: durationSec,
    });
  };

  const pause = () => {
    if (!mine || stepTimer!.paused) return;
    setStepTimer({ ...stepTimer!, paused: true, remainingSec: remaining });
  };

  const resume = () => {
    if (!mine || !stepTimer!.paused) return;
    setStepTimer({ ...stepTimer!, paused: false, endsAt: Date.now() + stepTimer!.remainingSec * 1000 });
  };

  const reset = () => setStepTimer(null);

  if (!mine) {
    return (
      <div className="cook-timer idle">
        <button type="button" className="cook-timer-start" onClick={start}>
          ▶ Iniciar cronômetro · {formatDuration(durationSec)}
        </button>
        {otherRunning && (
          <p className="cook-timer-other">
            ⏲ {formatDuration(Math.max(0, Math.round((stepTimer!.endsAt - now) / 1000)))} rodando no passo{' '}
            {stepTimer!.stepIndex + 1}
          </p>
        )}
      </div>
    );
  }

  const pct = durationSec > 0 ? remaining / durationSec : 0;
  const offset = CIRC * (1 - Math.min(1, Math.max(0, pct)));

  return (
    <div className={`cook-timer ${done ? 'done' : stepTimer!.paused ? 'paused' : 'running'}`}>
      <div className="timer-ring-card">
        <svg className="timer-ring-svg" viewBox="0 0 180 180">
          <circle className="timer-ring-track" cx="90" cy="90" r={RADIUS} strokeWidth="14" fill="none" />
          <circle
            className="timer-ring-progress"
            cx="90"
            cy="90"
            r={RADIUS}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={done ? 0 : offset}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="timer-ring-center">
          <span className="timer-ring-label">{done ? 'Tempo!' : stepTimer!.paused ? 'Pausado' : 'Cronômetro'}</span>
          <span className="timer-ring-value">{done ? '00:00' : formatDuration(remaining)}</span>
          <span className="timer-ring-total">de {formatDuration(durationSec)}</span>
        </div>
      </div>

      <div className="cook-timer-actions">
        {done ? (
          <button type="button" className="cook-timer-btn primary" onClick={reset}>
            Ok, pronto
          </button>
        ) : (
          <>
            {stepTimer!.paused ? (
              <button type="button" className="cook-timer-btn primary" onClick={resume}>
                Continuar
              </button>
            ) : (
              <button type="button" className="cook-timer-btn" onClick={pause}>
                Pausar
              </button>
            )}
            <button type="button" className="cook-timer-btn ghost" onClick={reset}>
              Zerar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
