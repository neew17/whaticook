import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

const REMOVE_THRESHOLD = 72;

interface SwipeToRemoveProps {
  children: ReactNode;
  onRemove: () => void;
  /** Texto do fundo vermelho revelado no swipe. */
  label?: string;
}

/**
 * Swipe horizontal pra remover um item de uma lista (lista de compras, salvos) —
 * gesto já esperado nesse padrão de UI, diferente do pull-to-refresh que a auditoria
 * descartou (esse sim conflita com o próprio scroll/refresh nativo do navegador).
 * Arrasta só a linha, nunca a página: swipe vertical não é capturado aqui.
 */
export default function SwipeToRemove({ children, onRemove, label = 'Remover' }: SwipeToRemoveProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (removing) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    draggingRef.current = false;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!startRef.current || removing) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!draggingRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        startRef.current = null;
        return;
      }
      draggingRef.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDragX(Math.min(0, dx));
  };

  const endDrag = () => {
    if (!draggingRef.current) {
      startRef.current = null;
      return;
    }
    draggingRef.current = false;
    setDragging(false);
    startRef.current = null;
    if (Math.abs(dragX) > REMOVE_THRESHOLD) {
      setRemoving(true);
      setDragX(-999);
      setTimeout(onRemove, 180);
    } else {
      setDragX(0);
    }
  };

  return (
    <div className="swipe-to-remove">
      <div className="swipe-to-remove-bg">{label}</div>
      <div
        className={`swipe-to-remove-content${removing ? ' removing' : dragging ? ' dragging' : ''}`}
        style={{ transform: `translateX(${dragX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>
    </div>
  );
}
