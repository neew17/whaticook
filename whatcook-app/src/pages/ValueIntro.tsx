import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const VALUE_INTRO_KEY = 'whatcook_value_intro_seen';
const AUTO_ADVANCE_MS = 2600;
const ICONS = ['🧅', '🥚', '🍅', '🧀', '🥑', '🍳'];

/**
 * Tela de valor entre Splash e TipoPrato — aparece só uma vez por dispositivo
 * (localStorage, não sessionStorage). Não é cadastro nem passo obrigatório: some
 * no primeiro toque em qualquer lugar da tela, ou sozinha depois de AUTO_ADVANCE_MS.
 * Existe pra comunicar o valor do app antes de jogar o usuário direto em "doce/salgado/drink"
 * sem contexto nenhum do que aquilo resolve.
 */
export default function ValueIntro() {
  const navigate = useNavigate();
  const doneRef = useRef(false);

  useEffect(() => {
    const go = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      try {
        localStorage.setItem(VALUE_INTRO_KEY, '1');
      } catch {
        /* localStorage indisponível — não trava o fluxo, só não lembra que já viu */
      }
      navigate('/tipo-prato');
    };

    const timer = setTimeout(go, AUTO_ADVANCE_MS);
    document.addEventListener('pointerdown', go);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', go);
    };
  }, [navigate]);

  return (
    <div className="screen value-intro">
      <div className="value-intro-body">
        <p className="value-intro-headline">
          Diga o que tem na <b>geladeira</b>.<br />A gente diz o que <b>cozinhar</b>.
        </p>
        <div className="value-intro-icons">
          {ICONS.map((icon, i) => (
            <span key={icon} className="value-intro-icon" style={{ animationDelay: `${220 + i * 90}ms` }}>
              {icon}
            </span>
          ))}
        </div>
        <p className="value-intro-hint">Toque para começar</p>
      </div>
    </div>
  );
}
