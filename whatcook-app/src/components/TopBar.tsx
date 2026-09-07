import { useNavigate } from 'react-router-dom';
import { BackIcon } from './icons';
import AccountBadge from './AccountBadge';
import type { ReactNode } from 'react';

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  hideAccountIcon?: boolean;
  hideBack?: boolean;
}

export default function TopBar({ title, onBack, rightSlot, hideAccountIcon, hideBack }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="topbar">
      {hideBack ? (
        <div style={{ width: 36 }} />
      ) : (
        <div className="icon-btn" onClick={() => (onBack ? onBack() : navigate(-1))} role="button" aria-label="Voltar">
          <BackIcon />
        </div>
      )}
      {title ? <h1>{title}</h1> : <div />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightSlot}
        {!hideAccountIcon && <AccountBadge />}
      </div>
    </div>
  );
}
