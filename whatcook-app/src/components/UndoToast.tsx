import { useEffect } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  /** Chamado quando o tempo acaba sem desfazer — dispara o efeito de verdade (ex: o delete). */
  onExpire: () => void;
  durationMs?: number;
}

/**
 * Toast genérico pra qualquer ação reversível (favoritar, remover item, etc.):
 * a ação já parece ter acontecido na tela, mas o efeito real (ex: delete no banco)
 * só roda depois de `durationMs` sem toque em "Desfazer". Um por vez — quem usa
 * decide a key/condição de quando montar/desmontar este componente.
 */
export default function UndoToast({ message, onUndo, onExpire, durationMs = 4000 }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onExpire, durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <button type="button" className="undo-toast-btn" onClick={onUndo}>
        Desfazer
      </button>
    </div>
  );
}
