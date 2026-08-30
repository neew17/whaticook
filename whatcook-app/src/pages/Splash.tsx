import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import whatcookVoice from '../assets/whatcook-voice.mp3';

// Tempo mínimo só para a marca aparecer — não é uma barreira. Toque pula na hora,
// e quem já viu a splash nesta sessão vai direto pro próximo destino.
const MIN_SPLASH_MS = 1200;
const SESSION_KEY = 'whatcook_splash_seen';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const doneRef = useRef(false);

  // Timer da marca + tap-to-skip. Roda uma vez.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* storage indisponível — trata como primeira vez */
    }
    if (seen) {
      setMinElapsed(true);
      return;
    }

    const voice = new Audio(whatcookVoice);
    voice.volume = 0.2;
    voice.play().catch(() => {
      /* navegador bloqueou autoplay sem interação — sem áudio, sem drama */
    });

    const done = () => {
      voice.pause();
      setMinElapsed(true);
    };
    const timer = setTimeout(done, MIN_SPLASH_MS);
    document.addEventListener('pointerdown', done);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', done);
      voice.pause();
    };
  }, []);

  // Destino depende da sessão: com conta cai no funil, sem conta vai pro muro de
  // login. Espera o Supabase restaurar a sessão (!loading) e a marca aparecer.
  useEffect(() => {
    if (doneRef.current || loading || !minElapsed) return;
    doneRef.current = true;
    navigate(user ? '/tipo-prato' : '/entrar', { replace: true });
  }, [navigate, user, loading, minElapsed]);

  return (
    <div className="screen splash">
      <div className="logo logo-splash-animate">
        what<span className="q">?</span>
        <span className="cook">cook</span>
      </div>
    </div>
  );
}
