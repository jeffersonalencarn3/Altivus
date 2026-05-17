/**
 * CheckinVisualStep — Passo visual opcional no check-in
 * Integra ao CheckinModal existente sem substituí-lo
 */
import React, { useState, useRef } from 'react';
import { Camera, Upload, MapPin, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import VisualMapEditor from './VisualMapEditor';

export default function CheckinVisualStep({ activity: _activity, onMapSaved, onSkip }) {
  const [phase, setPhase] = useState('capture'); // 'capture' | 'editor' | 'done'
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savedMap, setSavedMap] = useState(null);
  const fileRef = useRef();
  const cameraRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      setPhase('editor');
    } catch { toast.error('Erro ao enviar arquivo'); }
    setUploading(false);
  };

  const handleSave = (mapData) => {
    setSavedMap(mapData);
    onMapSaved({ imageUrl, ...mapData, phase: 'checkin' });
    setPhase('done');
  };

  if (phase === 'editor') {
    return (
      <VisualMapEditor
        imageUrl={imageUrl}
        mode="checkin"
        title="Check-in Visual — Marque a área de atuação"
        onSave={handleSave}
        onClose={() => setPhase('capture')}
      />
    );
  }

  if (phase === 'done') {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.2)' }}>
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid rgba(0,217,154,0.3)' }}>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: '#00D99A' }}>✓ Mapa de check-in registrado</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>
            {savedMap?.annotations?.length || 0} marcação(ões) · área de atuação definida
          </p>
        </div>
        <button onClick={() => setPhase('editor')} className="p-1.5 hover:bg-white/10 rounded-lg">
          <MapPin className="w-4 h-4" style={{ color: '#14B8D4' }} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(20,184,212,0.04)', border: '1px solid rgba(20,184,212,0.15)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold" style={{ color: '#14B8D4' }}>📍 Mapa Visual (opcional)</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>Tire foto do local ou carregue a planta</p>
        </div>
        <button onClick={onSkip} className="text-[10px] px-2 py-1 rounded-lg"
          style={{ color: '#718096', background: 'rgba(255,255,255,0.04)' }}>
          Pular
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Câmera */}
        <label>
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-4 rounded-xl transition-all touch-manipulation"
            style={{ background: 'rgba(109,86,232,0.08)', border: '1px dashed rgba(109,86,232,0.3)' }}>
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6D56E8' }} />
              : <Camera className="w-5 h-5" style={{ color: '#6D56E8' }} />}
            <span className="text-xs font-semibold" style={{ color: '#6D56E8' }}>Câmera</span>
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFile} disabled={uploading} />
        </label>

        {/* Upload */}
        <label>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-4 rounded-xl transition-all touch-manipulation"
            style={{ background: 'rgba(20,184,212,0.08)', border: '1px dashed rgba(20,184,212,0.3)' }}>
            <Upload className="w-5 h-5" style={{ color: '#14B8D4' }} />
            <span className="text-xs font-semibold" style={{ color: '#14B8D4' }}>Planta / Foto</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf"
            className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}
