import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postStory } from '../utils/stories';

const TEXT_COLORS = ['#ffffff', '#000000', '#FFC72C', '#EA1D2C'];
const MAX_OUTPUT_DIMENSION = 1280;

interface TextLayer {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  isLocation: boolean;
  color: string;
}

interface StoryEditorState {
  imageSrc: string;
  sourceDishId?: string;
}

function computeOutputSize(naturalWidth: number, naturalHeight: number) {
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(naturalWidth, naturalHeight));
  return { width: Math.round(naturalWidth * scale), height: Math.round(naturalHeight * scale) };
}

async function flattenToBlob(img: HTMLImageElement, layers: TextLayer[]): Promise<Blob> {
  const { width, height } = computeOutputSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  layers.forEach((layer) => {
    const label = layer.isLocation ? `📍 ${layer.text}` : layer.text;
    const color = layer.isLocation ? '#ffffff' : layer.color;
    const isDark = color.toLowerCase() === '#000000';
    const fontSize = Math.round(canvas.width * (layer.isLocation ? 0.04 : 0.055));
    ctx.font = `800 ${fontSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = fontSize * 0.18;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)';
    ctx.fillStyle = color;
    const x = (layer.xPct / 100) * canvas.width;
    const y = (layer.yPct / 100) * canvas.height;
    ctx.strokeText(label, x, y);
    ctx.fillText(label, x, y);
  });

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92));
}

export default function StoryEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const state = location.state as StoryEditorState | null;

  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; moved: boolean; overTrash: boolean } | null>(
    null
  );

  const [aspect, setAspect] = useState<number | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<'text' | 'location' | null>(null);
  const [composerValue, setComposerValue] = useState('');
  const [composerColor, setComposerColor] = useState(TEXT_COLORS[0]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kbInset, setKbInset] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/entrar', { replace: true, state: { intent: 'post' } });
      return;
    }
    if (!state?.imageSrc) {
      navigate('/perfil', { replace: true });
    }
  }, [loading, user, state?.imageSrc, navigate]);

  // Empurra o composer pra cima quando o teclado abre (iOS não redimensiona a viewport).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKbInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  if (loading || !user || !state?.imageSrc) {
    return <div className="story-editor" />;
  }

  const openComposer = (mode: 'text' | 'location') => {
    setSelectedId(null);
    setComposerValue('');
    setComposerColor(TEXT_COLORS[0]);
    setComposerMode(mode);
  };

  const confirmComposer = () => {
    const text = composerValue.trim();
    if (!text) {
      setComposerMode(null);
      setSelectedId(null);
      return;
    }
    if (selectedId) {
      setLayers((prev) => prev.map((l) => (l.id === selectedId ? { ...l, text, color: composerColor } : l)));
    } else {
      setLayers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text,
          xPct: 50,
          yPct: composerMode === 'location' ? 85 : 50,
          isLocation: composerMode === 'location',
          color: composerColor,
        },
      ]);
    }
    setComposerMode(null);
    setComposerValue('');
    setSelectedId(null);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setComposerMode(null);
    setSelectedId(null);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>, layer: TextLayer) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id: layer.id, startX: e.clientX, startY: e.clientY, moved: false, overTrash: false };
    setDraggingId(layer.id);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>, layer: TextLayer) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== layer.id || !stageRef.current) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = Math.min(96, Math.max(4, layer.xPct + (dx / rect.width) * 100));
    const yPct = Math.min(96, Math.max(4, layer.yPct + (dy / rect.height) * 100));
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    setLayers((prev) => prev.map((l) => (l.id === layer.id ? { ...l, xPct, yPct } : l)));

    if (trashRef.current) {
      const t = trashRef.current.getBoundingClientRect();
      const inside =
        e.clientX >= t.left - 16 && e.clientX <= t.right + 16 && e.clientY >= t.top - 16 && e.clientY <= t.bottom + 16;
      drag.overTrash = inside;
      setOverTrash(inside);
    }
  };

  const handlePointerUp = (layer: TextLayer) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    setOverTrash(false);
    if (drag?.moved && drag.overTrash) {
      setLayers((prev) => prev.filter((l) => l.id !== layer.id));
      return;
    }
    if (drag && !drag.moved) {
      setSelectedId(layer.id);
      setComposerValue(layer.text);
      setComposerColor(layer.color);
      setComposerMode(layer.isLocation ? 'location' : 'text');
    }
  };

  const handleClose = () => {
    if (layers.length > 0 && !window.confirm('Descartar as edições feitas nesse story?')) return;
    navigate(-1);
  };

  const handlePublish = async () => {
    if (!imgRef.current || publishing) return;
    setPublishing(true);
    setError(null);
    const blob = await flattenToBlob(imgRef.current, layers);
    const { error: postError } = await postStory(user.id, blob, state.sourceDishId);
    setPublishing(false);
    if (postError) {
      setError(postError);
      return;
    }
    navigate('/perfil');
  };

  return (
    <div className="story-editor">
      <div className="story-editor-canvas-wrap">
        <div
          ref={stageRef}
          className="story-editor-stage"
          style={aspect ? { aspectRatio: String(aspect) } : undefined}
        >
          <img
            ref={imgRef}
            src={state.imageSrc}
            alt=""
            className="story-editor-photo"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setAspect(el.naturalWidth / el.naturalHeight);
              setImgReady(true);
            }}
          />
          {layers.map((layer) => {
            const textColor = layer.isLocation ? '#ffffff' : layer.color;
            const isDark = !layer.isLocation && textColor.toLowerCase() === '#000000';
            return (
              <div
                key={layer.id}
                className={`story-editor-layer${layer.isLocation ? ' location' : ''}${draggingId === layer.id ? ' dragging' : ''}`}
                style={{
                  left: `${layer.xPct}%`,
                  top: `${layer.yPct}%`,
                  color: textColor,
                  textShadow: layer.isLocation
                    ? undefined
                    : isDark
                      ? '0 1px 6px rgba(255,255,255,0.75), 0 0 2px rgba(255,255,255,0.9)'
                      : '0 1px 6px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.9)',
                }}
                onPointerDown={(e) => handlePointerDown(e, layer)}
                onPointerMove={(e) => handlePointerMove(e, layer)}
                onPointerUp={() => handlePointerUp(layer)}
              >
                {layer.isLocation ? `📍 ${layer.text}` : layer.text}
              </div>
            );
          })}
        </div>

        {imgReady && layers.length === 0 && !composerMode && (
          <p className="story-editor-hint">Toque em Aa para adicionar um texto</p>
        )}
      </div>

      <div className="story-editor-header">
        <button type="button" className="story-editor-icon-btn" onClick={handleClose} aria-label="Fechar">
          ✕
        </button>
        <div className="story-editor-tools">
          <button type="button" className="story-editor-icon-btn" onClick={() => openComposer('text')} aria-label="Adicionar texto">
            Aa
          </button>
          <button type="button" className="story-editor-icon-btn" onClick={() => openComposer('location')} aria-label="Adicionar localização">
            📍
          </button>
        </div>
        <button
          type="button"
          className="story-editor-publish-btn"
          onClick={publishing ? undefined : handlePublish}
          disabled={publishing}
        >
          {publishing ? 'Enviando...' : 'Publicar'}
        </button>
      </div>

      {draggingId && (
        <div ref={trashRef} className={`story-editor-trash${overTrash ? ' active' : ''}`}>
          🗑️
        </div>
      )}

      {error && <p className="story-editor-error">{error}</p>}

      {composerMode && (
        <div className="story-editor-composer" style={{ bottom: kbInset }}>
          {composerMode === 'text' && (
            <div className="story-editor-color-row">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`story-editor-color-swatch${composerColor === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setComposerColor(c)}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          )}
          <div className="story-editor-composer-row">
            <input
              type="text"
              autoFocus
              placeholder={composerMode === 'location' ? 'Digite a localização...' : 'Digite o texto...'}
              value={composerValue}
              onChange={(e) => setComposerValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmComposer();
              }}
            />
            {selectedId && (
              <button type="button" className="story-editor-composer-action danger" onClick={deleteSelected}>
                Excluir
              </button>
            )}
            <button type="button" className="story-editor-composer-action" onClick={confirmComposer}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
