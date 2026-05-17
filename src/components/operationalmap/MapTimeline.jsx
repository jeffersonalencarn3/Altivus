import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';

export default function MapTimeline({ maps = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const sortedMaps = [...maps]
    .filter(m => m.status !== 'archived')
    .sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));

  if (sortedMaps.length === 0) return null;

  const groupedByDay = sortedMaps.reduce((acc, map) => {
    const day = format(new Date(map.captured_at), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(map);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'linear-gradient(145deg,rgba(20,184,212,0.08),rgba(109,86,232,0.04))', border: '1px solid rgba(20,184,212,0.15)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#718096' }}>
        📅 Histórico Operacional
      </p>

      <div className="space-y-3">
        {Object.entries(groupedByDay).map(([day, dayMaps]) => (
          <div key={day}>
            {/* Day Header */}
            <button
              onClick={() => setExpandedId(expandedId === day ? null : day)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: expandedId === day ? 'rgba(20,184,212,0.12)' : 'rgba(255,255,255,0.03)',
                border: expandedId === day ? '1px solid rgba(20,184,212,0.28)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#14B8D4' }} />
              <span className="text-sm font-bold text-white">
                {format(new Date(day + 'T12:00:00'), 'dd MMM yyyy', { locale: ptBR })}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded ml-auto"
                style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4' }}>
                {dayMaps.length} mapa{dayMaps.length > 1 ? 's' : ''}
              </span>
              {expandedId === day ? <ChevronUp className="w-3.5 h-3.5 text-white/40" /> : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
            </button>

            {/* Day Content */}
            {expandedId === day && (
              <div className="mt-2 ml-4 pl-4 space-y-2 border-l-2" style={{ borderColor: 'rgba(20,184,212,0.20)' }}>
                {dayMaps.map((map) => (
                  <div key={map.id} className="rounded-lg p-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                        style={{
                          background: map.type === 'field_photo' ? '#6D56E8' : '#14B8D4',
                          boxShadow: `0 0 8px ${map.type === 'field_photo' ? '#6D56E8' : '#14B8D4'}`,
                        }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{map.file_name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {format(new Date(map.captured_at), 'HH:mm:ss', { locale: ptBR })}
                        </p>
                      </div>
                      {(map.annotations?.length || 0) > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>
                          {map.annotations.length}
                        </span>
                      )}
                    </div>

                    {/* Tipo e observações */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="px-1.5 py-0.5 rounded"
                        style={{
                          background: map.type === 'field_photo' ? 'rgba(109,86,232,0.12)' : 'rgba(20,184,212,0.12)',
                          color: map.type === 'field_photo' ? '#6D56E8' : '#14B8D4',
                        }}>
                        {map.type === 'field_photo' ? '📷 Foto' : map.type === 'blueprint' ? '📐 Planta' : '✏️ Croqui'}
                      </span>
                      {map.progress_percentage !== null && (
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>
                          {map.progress_percentage}% concluído
                        </span>
                      )}
                    </div>

                    {map.observations && (
                      <p className="text-[10px] text-white/40 mt-1 italic">{map.observations}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
