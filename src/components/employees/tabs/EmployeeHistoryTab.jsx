import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { Clock, ArrowDownCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EmployeeHistoryTab({ employee, equipments }) {
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();

  const { data: sessions = [] } = useQuery({
    queryKey: ['empSessions', workspaceId, employee.id],
    queryFn: () => db.ActivitySession.filter({ team_id: employee.team_id }, '-date', 50),
    enabled: !!employee.team_id,
  });

  const totalDescents = sessions.reduce((s, sess) => s + (sess.descidas_realizadas || 0), 0);
  const totalMinutes = sessions.reduce((s, sess) => s + (sess.tempo_total_minutos || 0), 0);
  const totalHours = +(totalMinutes / 60).toFixed(1);
  const finalized = sessions.filter(s => s.status === 'finalizado');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white">Histórico Operacional</h3>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sessões', value: sessions.length, color: '#14B8D4' },
          { label: 'Descidas', value: totalDescents, color: '#00D99A' },
          { label: 'Horas', value: `${totalHours}h`, color: '#6D56E8' },
          { label: 'Equipamentos', value: equipments.length, color: '#E87D00' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 text-center"
            style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#718096' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Sessões */}
      {finalized.length === 0 ? (
        <div className="py-12 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-white/30">Nenhuma execução registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {finalized.sort((a, b) => new Date(b.date) - new Date(a.date)).map(sess => (
            <div key={sess.id} className="rounded-xl p-4"
              style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {format(new Date(sess.date + 'T12:00:00'), "dd 'de' MMM yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex gap-3 mt-1 text-[11px]" style={{ color: '#718096' }}>
                    <span className="flex items-center gap-1">
                      <ArrowDownCircle className="w-3 h-3" style={{ color: '#14B8D4' }} />
                      {sess.descidas_realizadas || 0} descidas
                    </span>
                    <span>
                      {Math.floor((sess.tempo_total_minutos || 0) / 60)}h {(sess.tempo_total_minutos || 0) % 60}min
                    </span>
                  </div>
                  {sess.observacoes && (
                    <p className="text-[11px] mt-1 italic" style={{ color: '#718096' }}>{sess.observacoes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(0,217,154,0.10)', color: '#00D99A' }}>
                  <CheckCircle2 className="w-3 h-3" /> Finalizado
                </div>
              </div>
              {/* Materiais utilizados */}
              {(sess.materiais_utilizados || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {sess.materiais_utilizados.map((m, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                      style={{ background: 'rgba(109,86,232,0.10)', color: '#6D56E8' }}>
                      {m.material_name}: {m.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}