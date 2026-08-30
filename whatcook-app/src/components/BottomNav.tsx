import { useNavigate, useLocation } from 'react-router-dom';
import { PotIcon, BookmarkIcon, CommunityIcon, UserIcon } from './icons';

const TABS = [
  { to: '/tipo-prato', label: 'Cozinhar', Icon: PotIcon, match: ['/tipo-prato', '/tempo', '/categorias', '/resultados'] },
  { to: '/salvas', label: 'Salvas', Icon: BookmarkIcon, match: ['/salvas'] },
  { to: '/comunidade', label: 'Comunidade', Icon: CommunityIcon, match: ['/comunidade', '/publicacao', '/cooker', '/rede', '/stories', '/buscar'] },
  { to: '/perfil', label: 'Perfil', Icon: UserIcon, match: ['/perfil'] },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {TABS.map(({ to, label, Icon, match }) => {
        const active = match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
        return (
          <button
            key={to}
            type="button"
            className={`bottom-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(to)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
