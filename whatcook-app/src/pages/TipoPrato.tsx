import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { SearchIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import type { TipoPrato as TipoPratoValue } from '../data/recipes';
import imgDoces from '../assets/tipo-prato/doces.jpg';
import imgSalgados from '../assets/tipo-prato/salgados.jpg';
import imgDrinks from '../assets/tipo-prato/drinks.jpg';

export default function TipoPrato() {
  const navigate = useNavigate();
  const { setTipoPrato, searchByName } = useAppState();
  const [selected, setSelected] = useState<TipoPratoValue | null>(null);
  const [nameQuery, setNameQuery] = useState('');

  const choose = (tipo: TipoPratoValue) => {
    if (selected) return;
    setSelected(tipo);
    setTipoPrato(tipo);
    setTimeout(() => navigate('/tempo'), 260);
  };

  const runNameSearch = () => {
    if (!nameQuery.trim()) return;
    setTipoPrato(null);
    searchByName(nameQuery);
    navigate('/resultados');
  };

  const stateClass = (tipo: TipoPratoValue) => {
    if (!selected) return '';
    return selected === tipo ? ' is-chosen' : ' is-dismissed';
  };

  return (
    <div className="screen">
      <TopBar title="O que fazer hoje?" hideBack hideAccountIcon />
      <div className="tipo-prato-body">
        <div className="search" style={{ margin: '0 0 4px' }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Já sabe? Buscar receita pelo nome..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runNameSearch();
            }}
          />
        </div>

        <div className="tipo-prato-stack">
          <div className={`tipo-prato-card doce${stateClass('doce')}`} onClick={() => choose('doce')}>
            <img className="tipo-prato-photo" src={imgDoces} alt="Doces" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Doces</p>
              <p className="tipo-prato-card-subtitle">Receitas doces e sobremesas</p>
            </div>
          </div>
          <div className={`tipo-prato-card salgado${stateClass('salgado')}`} onClick={() => choose('salgado')}>
            <img className="tipo-prato-photo" src={imgSalgados} alt="Salgados" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Salgados</p>
              <p className="tipo-prato-card-subtitle">Pratos principais, temperos e guarnições</p>
            </div>
          </div>
          <div className={`tipo-prato-card drink${stateClass('drink')}`} onClick={() => choose('drink')}>
            <img className="tipo-prato-photo" src={imgDrinks} alt="Drinks" />
            <div className="tipo-prato-photo-overlay" />
            <div className="tipo-prato-accent-bar" />
            <div className="tipo-prato-card-content">
              <p className="tipo-prato-card-title">Drinks</p>
              <p className="tipo-prato-card-subtitle">Coquetéis, mocktails, vitaminas e sucos</p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
