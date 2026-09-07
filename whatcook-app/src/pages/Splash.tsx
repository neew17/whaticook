import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import whatcookVoice from '../assets/whatcook-voice.mp3';

// Tempo mínimo só para a marca aparecer — não é uma barreira. Toque pula na hora,
// e quem já viu a splash nesta sessão vai direto pro funil.
const MIN_SPLASH_MS = 1200;
const SESSION_KEY = 'whatcook_splash_seen';

export default function Splash() {
  const navigate = useNavigate();
  const doneRef = useRef(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* storage indisponível — trata como primeira vez */
    }

    const voice = new Audio(whatcookVoice);
    voice.volume = 0.2;

    const go = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      voice.pause();
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      navigate('/tipo-prato');
    };

    if (seen) {
      go();
      return;
    }

    voice.play().catch(() => {
      /* navegador bloqueou autoplay sem interação — sem áudio, sem drama */
    });

    const timer = setTimeout(go, MIN_SPLASH_MS);
    document.addEventListener('pointerdown', go);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', go);
      voice.pause();
    };
  }, [navigate]);

  return (
    <div className="screen splash">
      <div className="logo logo-splash-animate">
        what<span className="q">?</span>
        <span className="cook">cook</span>
      </div>
    </div>
  );
}
