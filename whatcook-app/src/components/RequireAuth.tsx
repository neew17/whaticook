import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Muro de login. Regra geral do app: sem conta (pelo menos o email), sem acesso
 * a nenhuma funcionalidade. As únicas exceções são as telas públicas em App.tsx
 * (splash, /entrar, recuperação de senha) e os 3 links compartilháveis
 * (/receita/:id, /cooker/:id, /publicacao/:dishId), que mostram uma prévia + CTA
 * "criar conta" para quem chega deslogado.
 */
export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="screen splash">
        <div className="logo">
          what<span className="q">?</span>
          <span className="cook">cook</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
