import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { MenuIcon } from '../components/icons';
import { useAppState } from '../context/AppStateContext';
import { RECIPE_IMAGES } from '../data/recipe-images';

export default function Resultados() {
  const navigate = useNavigate();
  const { results, isSearching, searchError } = useAppState();

  return (
    <div className="screen">
      <TopBar
        title={results ? `${results.length} receitas` : 'Receitas'}
        onBack={() => navigate('/categorias')}
        rightSlot={
          <div
            className="icon-btn"
            onClick={() => navigate('/categorias')}
            role="button"
            aria-label="Ajustar ingredientes"
          >
            <MenuIcon />
          </div>
        }
      />

      {isSearching && (
        <div className="state-block">
          <div className="spinner" />
          <p>Buscando as melhores receitas para você...</p>
        </div>
      )}

      {!isSearching && searchError && (
        <div className="state-block">
          <p>{searchError}</p>
          <div className="fab" style={{ marginTop: 12 }} onClick={() => navigate('/categorias')}>
            Ajustar ingredientes
          </div>
        </div>
      )}

      {!isSearching && !searchError && results && results.length === 0 && (
        <div className="state-block">
          <p>Nenhuma receita encontrada com esses ingredientes e tempo. Tente ajustar as escolhas.</p>
          <div className="fab" style={{ marginTop: 12 }} onClick={() => navigate('/categorias')}>
            Ajustar ingredientes
          </div>
        </div>
      )}

      {!isSearching && !searchError && results && results.length > 0 && (
        <>
          <p className="helper-text" style={{ textAlign: 'center', padding: '4px 20px 0' }}>
            Receitas que combinam com o que você tem
          </p>
          <div className="result-list">
            {results.map((r, index) => {
              const hasFeatured = !results[0].viaSearch;
              const featured = index === 0 && hasFeatured;
              if (featured) {
                return (
                  <div key={r.id} className="result-card featured" onClick={() => navigate(`/receita/${r.id}`)}>
                    <div className="result-badge-row">
                      <div className="top-badge">⭐ Top escolha</div>
                      {!r.viaSearch && <span className="badge">{r.matchPercent}% match</span>}
                    </div>
                    <div className="result-thumb">
                      {RECIPE_IMAGES[r.id] ? <img src={RECIPE_IMAGES[r.id].url} alt={r.title} /> : r.emoji}
                    </div>
                    <div className="result-info">
                      <h4>{r.title}</h4>
                      <p>
                        {r.readyInMinutes} min · {r.difficulty}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={r.id}>
                  {index === 1 && hasFeatured && (
                    <p className="result-list-label" style={{ marginBottom: 12 }}>
                      Outras opções compatíveis
                    </p>
                  )}
                  <div className="result-card" onClick={() => navigate(`/receita/${r.id}`)}>
                    <div className="result-thumb">
                      {RECIPE_IMAGES[r.id] ? <img src={RECIPE_IMAGES[r.id].url} alt={r.title} /> : r.emoji}
                    </div>
                    <div className="result-info">
                      <h4>{r.title}</h4>
                      <p>
                        {r.readyInMinutes} min · {r.difficulty}
                      </p>
                      {!r.viaSearch && <span className="badge">{r.matchPercent}% match</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pillar-decoration">
            <span />
            <span />
            <span />
          </div>
        </>
      )}
    </div>
  );
}
