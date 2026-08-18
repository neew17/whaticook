import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AccountBadgeProps {
  onDark?: boolean;
}

export default function AccountBadge({ onDark }: AccountBadgeProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  return (
    <div
      className={`profile-badge${onDark ? ' on-dark' : ''}`}
      onClick={() => navigate(user ? '/perfil' : '/entrar')}
      role="button"
      aria-label={user ? 'Minha conta' : 'Entrar'}
      title={user ? profile?.display_name ?? 'Minha conta' : 'Entrar'}
    >
      {user ? (
        profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Perfil" />
        ) : (
          profile?.display_name?.[0]?.toUpperCase() ?? '?'
        )
      ) : (
        '👤'
      )}
    </div>
  );
}
