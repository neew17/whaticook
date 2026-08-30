import { useEffect, useRef } from 'react';

interface Sentinel {
  release: () => Promise<void>;
}

/**
 * Mantém a tela do celular acesa enquanto `active` for true — essencial na tela
 * de preparo, onde a pessoa está com as mãos ocupadas e não toca no aparelho.
 * Silencioso quando o navegador não suporta ou nega. Re-adquire ao voltar o foco
 * (o sistema solta o wake lock sozinho quando a aba fica em segundo plano).
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<Sentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const request = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
        if (!wl || cancelled) return;
        sentinelRef.current = await wl.request('screen');
      } catch {
        /* negado ou não suportado — segue sem */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
}
