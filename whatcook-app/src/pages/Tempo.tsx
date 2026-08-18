import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import iconLightning from '../assets/tempo-icons/lightning.png';
import iconZen from '../assets/tempo-icons/zen.png';

const PRESETS = [
  { minutes: 15, icon: iconLightning, title: '15 minutos', desc: 'Super rápido' },
  { minutes: 30, icon: '⏱️', title: '30 minutos', desc: 'Equilíbrio perfeito' },
  { minutes: 60, icon: '⏳', title: '1 hora', desc: 'Pratos elaborados' },
  { minutes: 120, icon: iconZen, title: 'Sem pressa', desc: 'Cozinhar com calma' },
];

export default function Tempo() {
  const navigate = useNavigate();
  const { timeMinutes, setTimeMinutes } = useAppState();
  const { user } = useAuth();

  const handleCreateRecipe = () => {
    navigate(user ? '/criar-receita' : '/entrar');
  };

  return (
    <div className="screen">
      <TopBar title="Quanto tempo?" onBack={() => navigate('/tipo-prato')} />
      <p className="helper-text" style={{ textAlign: 'center' }}>
        Ajuste o tempo ideal para sua jornada culinária.
      </p>

      <div className="slider-container" style={{ paddingBottom: 24 }}>
        <div className="slider-labels">
          <span>5m</span>
          <span>30m</span>
          <span>2h+</span>
        </div>
        <input
          type="range"
          min={5}
          max={120}
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(Number(e.target.value))}
        />
      </div>

      <div className="tempo-list">
        {PRESETS.map((p) => {
          const selected = timeMinutes === p.minutes;
          const isImageIcon = p.icon.includes('/');
          return (
            <button
              key={p.minutes}
              type="button"
              className={`tempo-card${selected ? ' selected' : ''}`}
              onClick={() => setTimeMinutes(p.minutes)}
            >
              <div className="tempo-icon">{isImageIcon ? <img src={p.icon} alt="" /> : p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
              <div className="tempo-radio">{selected && <div className="tempo-radio-dot" />}</div>
            </button>
          );
        })}
      </div>

      <div className="cta-fixed" onClick={() => navigate('/categorias')}>
        Continuar
      </div>
      <div className="cta-secondary" onClick={handleCreateRecipe}>
        Criar minha receita ✍️
      </div>
    </div>
  );
}
