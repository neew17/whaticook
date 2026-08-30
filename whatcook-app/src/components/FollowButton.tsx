import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface FollowButtonProps {
  targetUserId: string;
  onChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, onChange }: FollowButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) {
      setLoaded(true);
      return;
    }
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(!!data);
        setLoaded(true);
      });
  }, [user, targetUserId]);

  // Nunca renderiza no próprio perfil — não faz sentido seguir a si mesmo.
  if (user?.id === targetUserId) return null;

  const toggleFollow = async () => {
    if (!user) {
      navigate('/entrar', { state: { intent: 'follow', from: location.pathname } });
      return;
    }
    setBusy(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
      setIsFollowing(false);
      onChange?.(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      setIsFollowing(true);
      onChange?.(true);
    }
    setBusy(false);
  };

  return (
    <div
      className={`follow-btn${isFollowing ? ' following' : ''}`}
      onClick={busy || !loaded ? undefined : toggleFollow}
      role="button"
    >
      {isFollowing ? 'Seguindo ✓' : 'Seguir'}
    </div>
  );
}
