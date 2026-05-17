/**
 * CheckoutVisualStep — Passo visual opcional no check-out
 * Reutiliza imagem do check-in e permite pintar área executada
 */
import React, { useState } from 'react';
import { MapPin, Eye } from 'lucide-react';
import VisualMapEditor from './VisualMapEditor';

export default function CheckoutVisualStep({ checkinMap, onMapSaved, onSkip }) {
  const [phase, setPhase] = useState('prompt'); // 'prompt' | 'editor' | 'done'
  const [savedMap, setSavedMap] = useState(null);

  const handleSave = (mapData) => {
    setSavedMap(mapData);
    onMapSaved({ imageUrl: checkinMap?.imageUrl, ...mapData, phase: 'checkout' });
    setPhase('done');
  };

  if (phase === 'editor') {
    return (
      <VisualMapEditor
        imageUrl={checkinMap?.imageUrl}
        mode="checkout"
        title="Check-out Visual — Pinte a área executada"
        initialAnnotations={[]}
        readonlyAnnotations={checkinMap?.annotations || []}
        onSave={handleSave}
        onClose={() => setPhase('prompt')}
      />
    );
  }

  if (phase === 'done') {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.2)' }}>
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid rgba(0,217,154,0.3)' }}>
          {checkinMap?.imageUrl && <img src={checkinMap.imageUrl} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: '#00D99A' }}>✓ Área executada registrada</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>
            {savedMap?.annotations?.length || 0} marcação(ões) de check-out
          </p>
        </div>
        <button onClick={() => setPhase('editor')} className="p-1.5 hover:bg-white/10 rounded-lg">
          <Eye className="w-4 h-4" style={{ color: '#14B8D4' }} />
        </button>
      </div>
    );
  }

  // Fase 'prompt' — só aparece se há um check-in com imagem
  if (!checkinMap?.imageUrl) return null;

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(0,217,154,0.04)', border: '1px solid rgba(0,217,154,0.15)' }}>
      <div className="flex items-center gap-3">
        {/* Preview do mapa de check-in */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
          style={{ border: '1px solid rgba(20,184,212,0.3)' }}>
          <img src={checkinMap.imageUrl} alt="" className="w-full h-full object-cover opacity-70" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: '#00D99A' }}>📍 Área executada</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>
            Pinte a área que foi concluída hoje sobre o mapa do check-in
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setPhase('editor')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all touch-manipulation"
          style={{ background: 'linear-gradient(135deg,rgba(0,217,154,0.15),rgba(20,184,212,0.10))', border: '1px solid rgba(0,217,154,0.3)', color: '#00D99A' }}>
          <MapPin className="w-4 h-4" />
          Marcar Área
        </button>
        <button onClick={onSkip}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all touch-manipulation"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }}>
          Pular
        </button>
      </div>
    </div>
  );
}