import { useEffect, useRef, useState } from 'react';

interface ShareSheetProps {
  title: string;
  emoji: string;
  /** Foto do prato (data URL) ou URL pública da receita. */
  imageSrc: string | null;
  onClose: () => void;
}

const CARD_W = 1080;
const CARD_H = 1350;
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://whatcook.app';

/** Desenha o card de compartilhamento (foto + nome + marca) num canvas 4:5. */
async function drawCard(canvas: HTMLCanvasElement, title: string, emoji: string, imageSrc: string | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = CARD_W;
  canvas.height = CARD_H;

  // fundo
  ctx.fillStyle = '#151211';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  if (imageSrc) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.max(CARD_W / img.width, CARD_H / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = imageSrc;
    });
  } else {
    ctx.fillStyle = '#EA1D2C';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    ctx.font = '360px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, CARD_W / 2, CARD_H / 2 - 60);
  }

  // gradiente inferior
  const grad = ctx.createLinearGradient(0, CARD_H * 0.45, 0, CARD_H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, CARD_H * 0.45, CARD_W, CARD_H * 0.55);

  // título (quebra em até 3 linhas)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "800 76px 'Unbounded', system-ui, sans-serif";
  const words = title.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > CARD_W - 160 && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 3);
  let y = CARD_H - 200 - (shown.length - 1) * 90;
  for (const line of shown) {
    ctx.fillText(line, 80, y);
    y += 90;
  }

  // marca
  ctx.font = "700 44px 'Unbounded', system-ui, sans-serif";
  ctx.fillStyle = '#FFC72C';
  ctx.fillText('what', 80, CARD_H - 90);
  const wWidth = ctx.measureText('what').width;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('?cook', 80 + wWidth, CARD_H - 90);
}

export default function ShareSheet({ title, emoji, imageSrc, onClose }: ShareSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
      } catch {
        /* ok */
      }
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      await drawCard(canvas, title, emoji, imageSrc);
      if (!cancelled) setCardUrl(canvas.toDataURL('image/jpeg', 0.92));
    })();
    return () => {
      cancelled = true;
    };
  }, [title, emoji, imageSrc]);

  const shareText = `Fiz "${title}" no what?cook 🍳`;

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let file: File | null = null;
      if (cardUrl) {
        const blob = await (await fetch(cardUrl)).blob();
        file = new File([blob], 'whatcook.jpg', { type: 'image/jpeg' });
      }
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (file && typeof navigator.share === 'function' && nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else if (typeof navigator.share === 'function') {
        await navigator.share({ text: shareText, url: APP_URL });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${APP_URL}`);
        setCopied(true);
      }
    } catch {
      /* cancelado */
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem clipboard */
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <p className="sheet-title">Compartilhar</p>

        <div className="sheet-card-preview">
          {cardUrl ? <img src={cardUrl} alt="Prévia do card" /> : <div className="sheet-card-skeleton" />}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <button type="button" className="fab" style={{ width: '100%' }} onClick={handleShare} disabled={busy}>
          {busy ? 'Preparando...' : '📤 Compartilhar'}
        </button>
        <button type="button" className="cta-secondary" style={{ width: '100%', margin: '8px 0 0' }} onClick={handleCopy}>
          {copied ? 'Link copiado ✓' : '🔗 Copiar link do app'}
        </button>
        <button type="button" className="sheet-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
