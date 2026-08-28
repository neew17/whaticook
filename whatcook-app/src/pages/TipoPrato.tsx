import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAppState } from '../context/AppStateContext';
import type { TipoPrato as TipoPratoValue } from '../data/recipes';
import imgDoces from '../assets/tipo-prato/doces.jpg';
import imgSalgados from '../assets/tipo-prato/salgados.jpg';
import imgDrinks from '../assets/tipo-prato/drinks.jpg';

export default function TipoPrato() {
  const navigate = useNavigate();
  const { setTipoPrato } = useAppState();
  const [selected, setSelected] = useState<TipoPratoValue | null>(null);

  const choose = (tipo: TipoPratoValue) => {
    if (selected) return;
    setSelected(tipo);
    setTipoPrato(tipo);
    setTimeout(() => navigate('/tempo'), 2000);
  };

  const stateClass = (tipo: TipoPratoValue) => {
    if (!selected) return '';
    return selected === tipo ? ' is-chosen' : ' is-dismissed';
  };

  return (
    <div className="screen">
      <TopBar title="O que fazer hoje?" onBack={() => navigate(-1)} />
      <div className="tipo-prato-body">
        <p className="tipo-prato-subtitle">Escolha o tipo de prato que você quer preparar</p>
        <div className="tipo-prato-stack">
          <div
            className={`tipo-prato-card doce${stateClass('doce')}`}
            onClick={() => choose('doce')}
          >
            <img className="tipo-prato-photo" src={imgDoces} alt="Doces" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Doces</p>
              <p className="tipo-prato-card-subtitle">Receitas doces e sobremesas</p>
            </div>
          </div>
          <div
            className={`tipo-prato-card salgado${stateClass('salgado')}`}
            onClick={() => choose('salgado')}
          >
            <img className="tipo-prato-photo" src={imgSalgados} alt="Salgados" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Salgados</p>
              <p className="tipo-prato-card-subtitle">Pratos principais, temperos e guarnições</p>
            </div>
          </div>
          <div
            className={`tipo-prato-card drink${stateClass('drink')}`}
            onClick={() => choose('drink')}
          >
            <img className="tipo-prato-photo" src={imgDrinks} alt="Drinks" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Drinks</p>
              <p className="tipo-prato-card-subtitle">Coquetéis, mocktails, vitaminas e sucos</p>
            </div>
          </div>
        </div>
        <div className="pillar-decoration">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
