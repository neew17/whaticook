import { useState } from 'react';
import type { MissingIngredient } from '../context/AppStateContext';

interface ShoppingListSheetProps {
  items: MissingIngredient[];
  recipeCount: number;
  onClose: () => void;
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://whatcook.app';

function buildListText(items: MissingIngredient[], recipeCount: number): string {
  const header = `Lista de compras — what?cook (pra ${recipeCount} receita${recipeCount === 1 ? '' : 's'})`;
  const lines = items.map((i) => `- ${i.label}`);
  return [header, ...lines].join('\n');
}

export default function ShoppingListSheet({ items, recipeCount, onClose }: ShoppingListSheetProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (query: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(query)) next.delete(query);
      else next.add(query);
      return next;
    });
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const text = buildListText(items, recipeCount);
      if (typeof navigator.share === 'function') {
        await navigator.share({ text, url: APP_URL });
      } else {
        await navigator.clipboard.writeText(`${text}\n${APP_URL}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelado */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">Lista de compras</p>
        <p className="shopping-list-subtitle">
          Pra completar {recipeCount} receita{recipeCount === 1 ? '' : 's'} · {items.length} item
          {items.length === 1 ? '' : 's'}
        </p>

        <div className="shopping-list-items">
          {items.map((i) => (
            <button
              type="button"
              key={i.query}
              className={`shopping-list-item${checked.has(i.query) ? ' checked' : ''}`}
              onClick={() => toggle(i.query)}
            >
              <span className="shopping-list-item-check">{checked.has(i.query) ? '✓' : ''}</span>
              <span>{i.label}</span>
            </button>
          ))}
        </div>

        <button type="button" className="fab" style={{ width: '100%' }} onClick={handleShare} disabled={busy}>
          {busy ? 'Preparando...' : copied ? 'Copiado ✓' : '📤 Compartilhar lista'}
        </button>
        <button type="button" className="sheet-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
