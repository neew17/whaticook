import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAppState } from '../context/AppStateContext';
import { LightningIcon, ClockIcon, HourglassIcon, LeafIcon } from '../components/icons';

const PRESETS = [
  { minutes: 15, icon: LightningIcon, title: '15 minutos', desc: 'Super rápido' },
  { minutes: 30, icon: ClockIcon, title: '30 minutos', desc: 'Equilíbrio perfeito' },
  { minutes: 60, icon: HourglassIcon, title: '1 hora', desc: 'Pratos elaborados' },
  { minutes: 120, icon: LeafIcon, title: 'Sem pressa', desc: 'Cozinhar com calma' },
];

export default function Tempo() {
  const navigate = useNavigate();
  const { timeMinutes, setTimeMinutes } = useAppState();
  const [chosen, setChosen] = useState<number | null>(null);

  const choose = (minutes: number) => {
    if (chosen) return;
    setChosen(minutes);
    setTimeMinutes(minutes);
    setTimeout(() => navigate('/categorias'), 240);
  };

  return (
    <div className="screen">
      <TopBar title="Quanto tempo você tem?" onBack={() => navigate("/tipo-prato")} hideAccountIcon />

      <div className="tempo-list" style={{ paddingTop: 12 }}>
        {PRESETS.map((p) => {
          const active = chosen === p.minutes || (chosen === null && timeMinutes === p.minutes);
          const Icon = p.icon;
          return (
            <button
              key={p.minutes}
              type="button"
              className={`tempo-card${active ? ' selected' : ''}${chosen && chosen !== p.minutes ? ' dimmed' : ''}`}
              onClick={() => choose(p.minutes)}
            >
              <div className="tempo-icon">
                <Icon color={active ? 'var(--primary)' : 'var(--text-main)'} size={26} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
              <span className="tempo-card-arrow">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
