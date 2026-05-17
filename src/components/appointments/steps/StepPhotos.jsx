import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X } from 'lucide-react';

function PhotoType({ title, color, bgColor, photos, onAdd, onRemove, onCaption, isLocked, badge }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onAdd({ url: file_url, caption: '', timestamp: new Date().toISOString() });
    setUploading(false);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}28` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{badge}</span>
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: bgColor, color, border: `1px solid ${color}35` }}>
            {photos.length} foto(s)
          </span>
        </div>
      </div>

      {!isLocked && (
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-sm font-medium mb-3 w-full justify-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px dashed ${color}40`, color }}>
          {uploading ? <span className="animate-spin text-xs">⟳</span> : <><Upload className="w-4 h-4" /> Adicionar foto / câmera</>}
          <input type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading || isLocked}
            onChange={e => handleFile(e.target.files[0])} />
        </label>
      )}

      {photos.length === 0 ? (
        <div className="flex items-center justify-center py-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.07)' }}>
          <p className="text-xs" style={{ color: '#4A5568' }}>Nenhuma foto adicionada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden" style={{ border: `1px solid ${color}25` }}>
              <img src={p.url} alt={p.caption} className="w-full h-28 object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <input
                  className="w-full text-[10px] rounded px-1.5 py-0.5 mb-1"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                  placeholder="Legenda..."
                  value={p.caption || ''}
                  onChange={e => onCaption(i, e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                {!isLocked && (
                  <button onClick={() => onRemove(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'rgba(220,55,55,0.85)' }}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {p.caption && <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[9px] text-white font-semibold" style={{ background: 'linear-gradient(transparent,rgba(0,0,0,0.8))' }}>{p.caption}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StepPhotos({ form, patch, isLocked }) {
  const updatePhotos = (type, updater) => patch({ [type]: updater(form[type] || []) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">📷</span>
        <div>
          <h2 className="text-white font-bold text-lg">Evidências Fotográficas</h2>
          <p className="text-xs" style={{ color: '#718096' }}>Registre fotos antes, durante e depois da atividade</p>
        </div>
      </div>

      {/* Comparativo visual quando tem antes e depois */}
      {(form.photos_before || []).length > 0 && (form.photos_after || []).length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.20)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#14B8D4' }}>🔍 Comparativo Antes × Depois</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#E87D00' }}>ANTES</p>
              <img src={form.photos_before[0].url} className="w-full h-32 object-cover rounded-xl" style={{ border: '1px solid rgba(232,125,0,0.35)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#00D99A' }}>DEPOIS</p>
              <img src={form.photos_after[0].url} className="w-full h-32 object-cover rounded-xl" style={{ border: '1px solid rgba(0,217,154,0.35)' }} />
            </div>
          </div>
        </div>
      )}

      <PhotoType
        title="Fotos Antes" badge="🔴" color="#E87D00" bgColor="rgba(232,125,0,0.10)"
        photos={form.photos_before || []}
        onAdd={p => updatePhotos('photos_before', prev => [...prev, p])}
        onRemove={i => updatePhotos('photos_before', prev => prev.filter((_, j) => j !== i))}
        onCaption={(i, v) => updatePhotos('photos_before', prev => prev.map((p, j) => j === i ? { ...p, caption: v } : p))}
        isLocked={isLocked}
      />
      <PhotoType
        title="Fotos Durante" badge="🟡" color="#6D56E8" bgColor="rgba(109,86,232,0.10)"
        photos={form.photos_during || []}
        onAdd={p => updatePhotos('photos_during', prev => [...prev, p])}
        onRemove={i => updatePhotos('photos_during', prev => prev.filter((_, j) => j !== i))}
        onCaption={(i, v) => updatePhotos('photos_during', prev => prev.map((p, j) => j === i ? { ...p, caption: v } : p))}
        isLocked={isLocked}
      />
      <PhotoType
        title="Fotos Depois" badge="🟢" color="#00D99A" bgColor="rgba(0,217,154,0.10)"
        photos={form.photos_after || []}
        onAdd={p => updatePhotos('photos_after', prev => [...prev, p])}
        onRemove={i => updatePhotos('photos_after', prev => prev.filter((_, j) => j !== i))}
        onCaption={(i, v) => updatePhotos('photos_after', prev => prev.map((p, j) => j === i ? { ...p, caption: v } : p))}
        isLocked={isLocked}
      />
    </div>
  );
}