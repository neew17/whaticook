import { useLocation, useNavigate } from 'react-router-dom';
import type { AuthIntent } from '../utils/authIntent';

/**
 * Faixa "crie sua conta" mostrada nas telas de link compartilhado (receita,
 * prato, perfil) quando o visitante está deslogado. É a única porta de entrada
 * anônima no app — a prévia atrai, o botão converte.
 */
export default function JoinBanner({
  text = 'Crie sua conta grátis pra cozinhar, salvar e interagir com a comunidade.',
  intent,
}: {
  text?: string;
  intent?: AuthIntent;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="join-banner">
      <p>{text}</p>
      <button
        type="button"
        className="join-banner-btn"
        onClick={() => navigate('/entrar', { state: { from: location.pathname, intent } })}
      >
        Criar conta
      </button>
    </div>
  );
}
