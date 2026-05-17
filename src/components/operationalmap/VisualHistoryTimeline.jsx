/**
 * VisualHistoryTimeline — Timeline visual acumulada por sessão
 * Mostra evolução check-in → check-out por data
 */
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, CheckCircle2, Camera, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import VisualMapEditor from './VisualMapEditor';

export default function VisualHistoryTimeline({ sessions = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const [viewing, setViewing] = useState(null); // { imageUrl, annotations, readonlyAnnotations, title }

  // Filtra sessões com mapa visual
  const sessionsWithMaps = sessions
    .filter(s => s.visual_checkin_map?.imageUrl || s.visual_checkout_map?.imageUrl)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sessionsWithMaps.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm text-white/30">Nenhum mapa visual registrado ainda</p>
        <p className="text-xs mt-1" style={{ color: '#4A5568' }}>Os mapas aparecerão aqui após o primeiro check-in visual</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#14B8D4' }}>
        Histórico Visual — {sessionsWithMaps.length} dia(s) com mapa
      </p>

      {/* Progress acumulado visual */}
      <div className="rounded-xl p-3"
        style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.12)' }}>
        <p className="text-[10px] text-white/40 mb-2">Evolução acumulada</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {sessionsWithMaps.slice().reverse().map((s, i) => (
            <div key={s.id || i} className="shrink-0 flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden relative"
                style={{ border: s.visual_checkout_map ? '1px solid rgba(0,217,154,0.4)' : '1px solid rgba(20,184,212,0.3)' }}>
                {(s.visual_checkout_map?.imageUrl || s.visual_checkin_map?.imageUrl) && (
                  <img
                    src={s.visual_checkout_map?.imageUrl || s.visual_checkin_map?.imageUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-70"
                  />
                )}
                <div className="absolute bottom-0.5 right-0.5">
                  {s.visual_checkout_map
                    ? <CheckCircle2 className="w-2.5 h-2.5" style={{ color: '#00D99A' }} />
                    : <MapPin className="w-2.5 h-2.5" style={{ color: '#14B8D4' }} />
                  }
                </div>
              </div>
              <p className="text-[8px] text-white/30">
                {format(new Date(s.date + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de sessões */}
      {sessionsWithMaps.map(s => {
        const isExp = expandedId === s.id;
        const checkin = s.visual_checkin_map;
        const checkout = s.visual_checkout_map;
        const dateStr = format(new Date(s.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR });

        return (
          <div key={s.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header da sessão */}
            <button
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => setExpandedId(isExp ? null : s.id)}>
              <div className="flex gap-1.5 shrink-0">
                {checkin?.imageUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden"
                    style={{ border: '1px solid rgba(20,184,212,0.3)' }}>
                    <img src={checkin.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {checkout?.imageUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden"
                    style={{ border: '1px solid rgba(0,217,154,0.3)' }}>
                    <img src={checkout.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{dateStr}</p>
                <div className="flex gap-2 mt-0.5">
                  {checkin && (
                    <span className="text-[10px] font-semibold" style={{ color: '#14B8D4' }}>
                      ✓ Check-in ({checkin.annotations?.length || 0} marcações)
                    </span>
                  )}
                  {checkout && (
                    <span className="text-[10px] font-semibold" style={{ color: '#00D99A' }}>
                      ✓ Check-out ({checkout.annotations?.length || 0} marcações)
                    </span>
                  )}
                </div>
              </div>
              {isExp ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>

            {/* Detalhes expandidos */}
            {isExp && (
              <div className="px-4 pb-4 space-y-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

                {/* Check-in */}
                {checkin && (
                  <MapCard
                    title="Check-in Visual"
                    color="#14B8D4"
                    map={checkin}
                    time={s.hora_inicio}
                    onView={() => setViewing({
                      imageUrl: checkin.imageUrl,
                      annotations: checkin.annotations || [],
                      title: `Check-in — ${dateStr}`,
                    })}
                  />
                )}

                {/* Comparação */}
                {checkin && checkout && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(20,184,212,0.2)' }} />
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(20,184,212,0.08)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.2)' }}>
                      Comparar Check-in ↔ Check-out
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,217,154,0.2)' }} />
                  </div>
                )}

                {/* Check-out */}
                {checkout && (
                  <MapCard
                    title="Check-out Visual — Área Executada"
                    color="#00D99A"
                    map={checkout}
                    time={s.hora_fim}
                    onView={() => setViewing({
                      imageUrl: checkout.imageUrl,
                      annotations: checkout.annotations || [],
                      readonlyAnnotations: checkin?.annotations || [],
                      title: `Check-out — ${dateStr}`,
                    })}
                  />
                )}

                {/* Fotos da sessão */}
                {[...(s.fotos_antes || []), ...(s.fotos_durante || []), ...(s.fotos_depois || [])].length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/30 mb-1.5 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Fotos da sessão
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...(s.fotos_antes || []), ...(s.fotos_durante || []), ...(s.fotos_depois || [])].map((url, i) => (
                        <img key={i} src={url} alt="" className="w-12 h-12 rounded-lg object-cover"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Viewer readonly */}
      {viewing && (
        <VisualMapEditor
          imageUrl={viewing.imageUrl}
          initialAnnotations={viewing.annotations}
          readonlyAnnotations={viewing.readonlyAnnotations || []}
          mode="edit"
          title={viewing.title}
          onSave={() => setViewing(null)}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function MapCard({ title, color, map, time, onView }) {
  return (
    <div className="rounded-xl p-3"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0"
          style={{ border: `1px solid ${color}30` }}>
          {map.imageUrl && (
            <img src={map.imageUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>
            {title}
          </p>
          {time && (
            <p className="text-[10px] text-white/30 mb-1">
              {new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {(map.annotations?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {map.annotations.slice(0, 4).map((ann, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: ann.color + '20', color: ann.color }}>
                  {ann.type}{ann.label ? `: ${ann.label}` : ''}
                </span>
              ))}
              {map.annotations.length > 4 && (
                <span className="text-[9px] text-white/30">+{map.annotations.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <button onClick={onView} className="p-1.5 rounded-lg hover:bg-white/10 shrink-0">
          <Eye className="w-4 h-4" style={{ color }} />
        </button>
      </div>
    </div>
  );
}