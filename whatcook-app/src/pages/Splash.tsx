import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playSplashSound } from '../utils/sound';
import whatcookVoice from '../assets/whatcook-voice.mp3';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // toca o quanto antes, no primeiro momento do app
    const voice = new Audio(whatcookVoice);
    voice.volume = 0.2;
    voice.play().catch(() => {
      // navegador bloqueou autoplay sem interação — tenta na primeira interação do usuário
      const retry = () => {
        voice.play().catch(() => {});
        document.removeEventListener('pointerdown', retry);
      };
      document.addEventListener('pointerdown', retry, { once: true });
    });

    const timer = setTimeout(() => setMinTimeElapsed(true), 3000);
    // sincronizado com o início do zoom do logo (55% dos 3s da animação)
    const soundTimer = setTimeout(() => playSplashSound(), 1650);
    return () => {
      clearTimeout(timer);
      clearTimeout(soundTimer);
    };
  }, []);

  useEffect(() => {
    if (minTimeElapsed && !loading) {
      navigate(user ? '/tipo-prato' : '/entrar');
    }
  }, [minTimeElapsed, loading, user, navigate]);

  return (
    <div className="screen splash">
      <div className="logo logo-splash-animate">
        what<span className="q">?</span>
        <span className="cook">cook</span>
      </div>
    </div>
  );
}
