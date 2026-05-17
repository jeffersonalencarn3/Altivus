import React, { useRef, useEffect, useState } from 'react';
import {
  Pencil, Circle, Square, ArrowRight, Highlighter, Trash2, ZoomIn, ZoomOut, RotateCcw, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CanvasEditor({ imageUrl, onAnnotate, onClose, initialAnnotations = [] }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('freehand');
  const [color, setColor] = useState('#14B8D4');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [startPos, setStartPos] = useState(null);
  const [previewAnnotation, setPreviewAnnotation] = useState(null);

  const ctx = useRef(null);
  const baseImage = useRef(null);

  // Carrega imagem de base
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImage.current = img;
      redraw();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redesenha canvas com anotações
  const redraw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const c = canvas.getContext('2d');
    ctx.current = c;

    // Limpa
    c.fillStyle = '#050914';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha imagem de base
    if (baseImage.current) {
      const scaledWidth = baseImage.current.width * scale;
      const scaledHeight = baseImage.current.height * scale;
      c.drawImage(baseImage.current, 0, 0, scaledWidth, scaledHeight);
    }

    // Desenha anotações salvas
    annotations.forEach(ann => drawAnnotation(c, ann));

    // Desenha preview
    if (previewAnnotation) {
      drawAnnotation(c, previewAnnotation);
    }
  };

  const drawAnnotation = (c, ann) => {
    if (!ann.points || ann.points.length === 0) return;

    c.strokeStyle = ann.color;
    c.fillStyle = ann.color;
    c.globalAlpha = ann.opacity || 1;
    c.lineWidth = ann.strokeWidth || 2;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    switch (ann.type) {
      case 'freehand':
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
          drawArrow(c, ann.points[0][0], ann.points[0][1], ann.points[1][0], ann.points[1][1]);
        }
        break;
      case 'highlight':
        if (ann.points.length === 2) {
          const [x1, y1] = ann.points[0];
          const [x2, y2] = ann.points[1];
          c.fillRect(x1, y1, x2 - x1, y2 - y1);
        }
        break;
      case 'polygon':
        if (ann.points.length > 2) {
          c.beginPath();
          c.moveTo(ann.points[0][0], ann.points[0][1]);
          ann.points.forEach(([x, y]) => c.lineTo(x, y));
          c.closePath();
          c.stroke();
        }
        break;
    }
    c.globalAlpha = 1;
  };

  const drawArrow = (c, x1, y1, x2, y2) => {
    const headlen = 15;
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

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setStartPos([x, y]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (['freehand', 'polygon'].includes(tool)) {
      setPreviewAnnotation({
        type: tool,
        points: [[x, y]],
        color, strokeWidth, opacity
      });
    } else {
      setPreviewAnnotation({
        type: tool,
        points: [startPos, [x, y]],
        color, strokeWidth, opacity
      });
    }
    redraw();
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !startPos) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newAnnotation = {
      id: Date.now().toString(),
      type: tool,
      points: ['freehand'].includes(tool) ? [[x, y]] : [startPos, [x, y]],
      color, strokeWidth, opacity,
      timestamp: new Date().toISOString()
    };

    setAnnotations([...annotations, newAnnotation]);
    setIsDrawing(false);
    setStartPos(null);
    setPreviewAnnotation(null);
    redraw();
  };

  const undo = () => {
    setAnnotations(annotations.slice(0, -1));
    redraw();
  };

  const clear = () => {
    if (confirm('Limpar todos os desenhos?')) {
      setAnnotations([]);
      redraw();
    }
  };

  const save = () => {
    const canvasData = canvasRef.current.toDataURL('image/png');
    onAnnotate({ annotations, canvasData });
  };

  useEffect(() => {
    redraw();
  }, [scale]);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Header */}
      <div className="shrink-0 p-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(20,184,212,0.15)', background: 'rgba(5,10,22,0.95)' }}>
        <p className="text-sm font-bold text-white">Editor de Mapa Operacional</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4 text-white/50 hover:text-white" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 p-3 flex flex-wrap gap-2"
        style={{ background: 'rgba(5,10,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Tools */}
        <div className="flex gap-1 items-center px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {[
            { id: 'freehand', icon: Pencil, label: 'Desenho Livre' },
            { id: 'rectangle', icon: Square, label: 'Retângulo' },
            { id: 'circle', icon: Circle, label: 'Círculo' },
            { id: 'arrow', icon: ArrowRight, label: 'Seta' },
            { id: 'highlight', icon: Highlighter, label: 'Destaque' },
          ].map(t => (
            <button key={t.id} onClick={() => setTool(t.id)}
              className="p-1.5 rounded transition-all"
              title={t.label}
              style={tool === t.id
                ? { background: 'rgba(20,184,212,0.20)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.4)' }
                : { color: '#718096', background: 'transparent' }
              }>
              <t.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Color */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer" />
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <input type="range" min={1} max={20} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))}
            className="w-20" />
          <span className="text-xs text-white/40">{strokeWidth}px</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <input type="range" min={0} max={1} step={0.1} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
            className="w-20" />
          <span className="text-xs text-white/40">{Math.round(opacity * 100)}%</span>
        </div>

        {/* Zoom */}
        <div className="flex gap-1 items-center px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-white/10 rounded">
            <ZoomOut className="w-4 h-4 text-white/50" />
          </button>
          <span className="text-xs text-white/40 w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1 hover:bg-white/10 rounded">
            <ZoomIn className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex gap-1">
          <button onClick={undo} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white" title="Desfazer">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={clear} className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white" title="Limpar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <canvas ref={canvasRef} width={1200} height={800}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border border-white/10 rounded-lg cursor-crosshair shadow-2xl"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        />
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 flex gap-2 justify-end"
        style={{ borderTop: '1px solid rgba(20,184,212,0.15)', background: 'rgba(5,10,22,0.95)' }}>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff', fontWeight: 700 }}>
          Salvar Anotações ({annotations.length})
        </Button>
      </div>
    </div>
  );
}