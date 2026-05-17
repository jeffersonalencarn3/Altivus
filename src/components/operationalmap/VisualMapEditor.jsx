/**
 * VisualMapEditor — Editor visual operacional mobile-first
 * Suporte touch + mouse, ferramentas de campo, cores padronizadas
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Pencil, Square, Circle, ArrowRight, Highlighter,
  Trash2, RotateCcw, ZoomIn, ZoomOut, X, Save,
  AlertTriangle, Anchor, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Paleta operacional padronizada
const PRESET_COLORS = [
  { label: 'Área Planejada', color: '#14B8D4', desc: 'Check-in — área do dia' },
  { label: 'Área Planejada 2', color: '#F6E05E', desc: 'Check-in alternativo' },
  { label: 'Concluído', color: '#00D99A', desc: 'Check-out — área executada' },
  { label: 'Parcial', color: '#E87D00', desc: 'Check-out — parcialmente feito' },
  { label: 'Pendência', color: '#FC5252', desc: 'Bloqueio / retrabalho' },
  { label: 'Ancoragem', color: '#00FFFF', desc: 'Ponto de ancoragem' },
  { label: 'Risco', color: '#FF0000', desc: 'Risco operacional' },
  { label: 'Acesso', color: '#6D56E8', desc: 'Acesso / caminho' },
];

const TOOLS = [
  { id: 'freehand', icon: Pencil, label: 'Livre' },
  { id: 'rectangle', icon: Square, label: 'Ret.' },
  { id: 'circle', icon: Circle, label: 'Círculo' },
  { id: 'arrow', icon: ArrowRight, label: 'Seta' },
  { id: 'highlight', icon: Highlighter, label: 'Área' },
  { id: 'pin', icon: MapPin, label: 'Pin' },
  { id: 'risk', icon: AlertTriangle, label: 'Risco' },
  { id: 'anchor', icon: Anchor, label: 'Ancora' },
];

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return [
    (src.clientX - rect.left) * scaleX,
    (src.clientY - rect.top) * scaleY,
  ];
}

export default function VisualMapEditor({
  imageUrl,
  initialAnnotations = [],
  onSave,
  onClose,
  mode = 'edit', // 'checkin' | 'checkout' | 'edit'
  title = 'Editor de Mapa Operacional',
  readonlyAnnotations = [], // anotações do check-in (para check-out)
}) {
  const canvasRef = useRef(null);
  const baseImage = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef(null);
  const currentPath = useRef([]);

  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [tool, setTool] = useState('freehand');
  const [color, setColor] = useState(mode === 'checkout' ? '#00D99A' : '#14B8D4');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(mode === 'highlight' ? 0.4 : 0.85);
  const [scale, setScale] = useState(1);
  const [label, setLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [, setPendingPos] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Carrega imagem
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImage.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => setImageLoaded(true); // continua sem imagem
    img.src = imageUrl;
  }, [imageUrl]);

  // Redesenha canvas
  const redraw = useCallback((extraAnnotation = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');

    c.fillStyle = '#050914';
    c.fillRect(0, 0, canvas.width, canvas.height);

    if (baseImage.current) {
      const iw = baseImage.current.width;
      const ih = baseImage.current.height;
      // Ajusta canvas ao aspecto da imagem
      canvas.width = Math.min(1200, iw);
      canvas.height = Math.min(900, ih);
      c.drawImage(baseImage.current, 0, 0, canvas.width, canvas.height);
    }

    // Anotações do check-in (readonly, opacidade reduzida)
    if (readonlyAnnotations.length > 0) {
      c.save();
      c.globalAlpha = 0.45;
      readonlyAnnotations.forEach(ann => drawAnnotation(c, ann));
      c.restore();
    }

    // Anotações atuais
    annotations.forEach(ann => drawAnnotation(c, ann));
    if (extraAnnotation) drawAnnotation(c, extraAnnotation);
  }, [annotations, readonlyAnnotations]);

  useEffect(() => {
    redraw();
  }, [redraw, imageLoaded, scale]);

  const drawAnnotation = (c, ann) => {
    if (!ann || !ann.points || ann.points.length === 0) return;
    c.save();
    c.strokeStyle = ann.color;
    c.fillStyle = ann.color;
    c.globalAlpha = ann.opacity ?? 0.85;
    c.lineWidth = ann.strokeWidth ?? 3;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.shadowBlur = 6;
    c.shadowColor = ann.color;

    switch (ann.type) {
      case 'freehand':
        if (ann.points.length < 2) break;
        c.beginPath();
        c.moveTo(ann.points[0][0], ann.points[0][1]);
        ann.points.forEach(([x, y]) => c.lineTo(x, y));
        c.stroke();
        break;
      case 'rectangle':
        if (ann.points.length === 2) {
          const [x1, y1] = ann.points[0];
          const [x2, y2] = ann.points[1];
          c.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }
        break;
      case 'circle':
        if (ann.points.length === 2) {
          const [x1, y1] = ann.points[0];
          const [x2, y2] = ann.points[1];
          const r = Math.hypot(x2 - x1, y2 - y1);
          c.beginPath();
          c.arc(x1, y1, r, 0, 2 * Math.PI);
          c.stroke();
        }
        break;
      case 'arrow':
        if (ann.points.length === 2) {
          drawArrow(c, ann.points[0], ann.points[1]);
        }
        break;
      case 'highlight':
        if (ann.points.length === 2) {
          c.globalAlpha = (ann.opacity ?? 0.85) * 0.4;
          const [x1, y1] = ann.points[0];
          const [x2, y2] = ann.points[1];
          c.fillRect(x1, y1, x2 - x1, y2 - y1);
          c.globalAlpha = ann.opacity ?? 0.85;
          c.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }
        break;
      case 'pin':
      case 'risk':
      case 'anchor':
        if (ann.points.length >= 1) {
          const [px, py] = ann.points[0];
          const size = (ann.strokeWidth ?? 3) * 4;
          c.shadowBlur = 12;
          c.beginPath();
          c.arc(px, py, size, 0, 2 * Math.PI);
          c.fill();
          c.globalAlpha = 1;
          c.fillStyle = '#fff';
          c.font = `bold ${size * 1.2}px sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(ann.type === 'risk' ? '⚠' : ann.type === 'anchor' ? '⚓' : '📍', px, py);
        }
        break;
    }

    // Label
    if (ann.label) {
      c.shadowBlur = 0;
      c.globalAlpha = 1;
      const [lx, ly] = ann.points[ann.points.length - 1];
      c.font = 'bold 13px Inter, sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      const tw = c.measureText(ann.label).width;
      c.fillStyle = 'rgba(5,9,20,0.82)';
      c.fillRect(lx + 4, ly - 20, tw + 10, 20);
      c.fillStyle = ann.color;
      c.fillText(ann.label, lx + 9, ly - 3);
    }

    c.restore();
  };

  const drawArrow = (c, [x1, y1], [x2, y2]) => {
    const headlen = 18;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    c.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    c.closePath();
    c.fill();
  };

  // === Touch + Mouse handlers ===
  const handleStart = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    isDrawing.current = true;
    startPos.current = pos;
    currentPath.current = [pos];

    if (['pin', 'risk', 'anchor'].includes(tool)) {
      // ponto único — abre label input
      const newAnn = {
        id: Date.now().toString(),
        type: tool,
        points: [pos],
        color,
        strokeWidth,
        opacity,
        timestamp: new Date().toISOString(),
      };
      if (tool === 'pin' || tool === 'risk' || tool === 'anchor') {
        setPendingPos(pos);
        setShowLabelInput(true);
        setAnnotations(prev => [...prev, newAnn]);
        isDrawing.current = false;
      }
    }
  };

  const handleMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);

    if (tool === 'freehand') {
      currentPath.current.push(pos);
      redraw({ type: 'freehand', points: [...currentPath.current], color, strokeWidth, opacity });
    } else {
      redraw({ type: tool, points: [startPos.current, pos], color, strokeWidth, opacity });
    }
  }, [tool, color, strokeWidth, opacity, redraw]);

  const handleEnd = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = e.changedTouches
      ? getPos({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }, canvas)
      : getPos(e, canvas);

    let points;
    if (tool === 'freehand') {
      points = [...currentPath.current, pos];
    } else {
      points = [startPos.current, pos];
    }

    const newAnn = {
      id: Date.now().toString(),
      type: tool,
      points,
      color,
      strokeWidth,
      opacity,
      timestamp: new Date().toISOString(),
    };
    setAnnotations(prev => [...prev, newAnn]);
    isDrawing.current = false;
    startPos.current = null;
    currentPath.current = [];
  }, [tool, color, strokeWidth, opacity]);

  const undo = () => setAnnotations(prev => prev.slice(0, -1));
  const clear = () => { if (window.confirm('Limpar todos os desenhos desta camada?')) setAnnotations([]); };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const canvasData = canvas ? canvas.toDataURL('image/jpeg', 0.75) : null;
    onSave({ annotations, canvasData });
  };

  const addLabel = () => {
    if (!label.trim()) { setShowLabelInput(false); setLabel(''); return; }
    setAnnotations(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) updated[updated.length - 1] = { ...last, label: label.trim() };
      return updated;
    });
    setShowLabelInput(false);
    setLabel('');
    setPendingPos(null);
  };

  // Cor conforme modo (check-in = azul, checkout = verde)
  const modeColor = mode === 'checkout' ? '#00D99A' : '#14B8D4';
  const modeBg = mode === 'checkout'
    ? 'linear-gradient(135deg,rgba(0,217,154,0.12),rgba(20,184,212,0.08))'
    : 'linear-gradient(135deg,rgba(20,184,212,0.12),rgba(109,86,232,0.08))';

  return (
    <div className="fixed inset-0 z-[150] flex flex-col" style={{ background: 'rgba(5,9,20,0.98)' }}>
      {/* Header */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ background: modeBg, borderBottom: `1px solid ${modeColor}25` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: modeColor, boxShadow: `0 0 8px ${modeColor}` }} />
          <p className="text-sm font-bold text-white">{title}</p>
          {readonlyAnnotations.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }}>
              Check-in visível ({readonlyAnnotations.length} marcações)
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg">
          <X className="w-4 h-4 text-white/50 hover:text-white" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 px-3 py-2 flex flex-wrap gap-2 items-center overflow-x-auto"
        style={{ background: 'rgba(5,9,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Ferramentas */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {TOOLS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                className="p-2 rounded-lg transition-all touch-manipulation"
                style={tool === t.id
                  ? { background: `${modeColor}25`, color: modeColor, border: `1px solid ${modeColor}50` }
                  : { color: '#718096', background: 'transparent' }
                }>
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Paleta rápida */}
        <div className="flex gap-1.5 p-1 rounded-xl items-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {PRESET_COLORS.map(pc => (
            <button key={pc.color} onClick={() => setColor(pc.color)} title={pc.label}
              className="w-6 h-6 rounded-full transition-all touch-manipulation"
              style={{
                background: pc.color,
                border: color === pc.color ? `2px solid #fff` : `2px solid transparent`,
                boxShadow: color === pc.color ? `0 0 8px ${pc.color}` : 'none',
                transform: color === pc.color ? 'scale(1.2)' : 'scale(1)',
              }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer" title="Cor personalizada" />
        </div>

        {/* Espessura */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[10px] text-white/40 hidden sm:block">Esp.</span>
          <input type="range" min={2} max={20} value={strokeWidth} onChange={e => setStrokeWidth(+e.target.value)}
            className="w-16 sm:w-20 accent-cyan-400" />
          <span className="text-[10px] text-white/40 w-5">{strokeWidth}</span>
        </div>

        {/* Opacidade */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[10px] text-white/40 hidden sm:block">Opac.</span>
          <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={e => setOpacity(+e.target.value)}
            className="w-16 sm:w-20 accent-cyan-400" />
          <span className="text-[10px] text-white/40 w-7">{Math.round(opacity * 100)}%</span>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => setScale(s => Math.max(0.4, +(s - 0.15).toFixed(2)))} className="p-1 hover:bg-white/10 rounded touch-manipulation">
            <ZoomOut className="w-3.5 h-3.5 text-white/50" />
          </button>
          <span className="text-[10px] text-white/40 w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.15).toFixed(2)))} className="p-1 hover:bg-white/10 rounded touch-manipulation">
            <ZoomIn className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Ações */}
        <div className="ml-auto flex gap-1">
          <button onClick={undo} title="Desfazer" className="p-2 hover:bg-white/10 rounded-lg touch-manipulation">
            <RotateCcw className="w-4 h-4 text-white/40 hover:text-white" />
          </button>
          <button onClick={clear} title="Limpar" className="p-2 hover:bg-red-500/20 rounded-lg touch-manipulation">
            <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Legenda do modo */}
      {mode !== 'edit' && (
        <div className="shrink-0 px-4 py-2 flex flex-wrap gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {mode === 'checkin' ? (
            <>
              <LegendChip color="#14B8D4" label="Área do dia" />
              <LegendChip color="#F6E05E" label="Trecho planejado" />
              <LegendChip color="#00FFFF" label="Ancoragem" />
              <LegendChip color="#FF0000" label="Risco" />
              <LegendChip color="#6D56E8" label="Acesso" />
            </>
          ) : (
            <>
              <LegendChip color="#00D99A" label="Concluído" />
              <LegendChip color="#E87D00" label="Parcial" />
              <LegendChip color="#FC5252" label="Pendência/Retrabalho" />
              {readonlyAnnotations.length > 0 && <LegendChip color="#14B8D4" label="Planejado (check-in)" opacity={0.5} />}
            </>
          )}
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center"
        style={{ background: '#020810', touchAction: 'none' }}>
        {!imageLoaded && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs text-white/30">Carregando imagem...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="shadow-2xl"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            cursor: ['pin', 'risk', 'anchor'].includes(tool) ? 'crosshair' : 'crosshair',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            touchAction: 'none',
            border: `1px solid ${modeColor}15`,
            borderRadius: 8,
          }}
        />
      </div>

      {/* Label input popup */}
      {showLabelInput && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(8,14,30,0.99)', border: '1px solid rgba(20,184,212,0.3)' }}>
            <p className="text-xs font-bold text-white">Adicionar etiqueta (opcional)</p>
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLabel()}
              placeholder="Ex: Ponto de ancoragem principal"
              className="w-full px-3 py-2 rounded-xl text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowLabelInput(false); setLabel(''); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white/50"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                Pular
              </button>
              <button onClick={addLabel}
                className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={{ background: modeColor, color: '#020B14' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{ borderTop: `1px solid ${modeColor}20`, background: 'rgba(5,9,20,0.95)' }}>
        <p className="text-[11px] text-white/30">
          {annotations.length} marcação{annotations.length !== 1 ? 'ões' : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave}
            style={{ background: `linear-gradient(135deg,${modeColor},#6D56E8)`, color: '#020B14', fontWeight: 700 }}>
            <Save className="w-3.5 h-3.5 mr-1" />
            Salvar Mapa
          </Button>
        </div>
      </div>
    </div>
  );
}

function LegendChip({ color, label, opacity = 1 }) {
  return (
    <div className="flex items-center gap-1.5" style={{ opacity }}>
      <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      <span className="text-[10px] text-white/50">{label}</span>
    </div>
  );
}
