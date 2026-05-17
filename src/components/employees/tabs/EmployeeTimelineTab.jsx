import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { BarChart2, Clock, Shield, ClipboardCheck, FlaskConical, Award, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EVENT_CFG = {
  session: { label: 'Execução Operacional', color: '#14B8D4', icon: Clock, bg: 'rgba(20,184,212,0.10)' },
  inspection: { label: 'Inspeção', color: '#00D99A', icon: Shield, bg: 'rgba(0,217,154,0.10)' },
  checklist: { label: 'Checklist Pré-Uso', color: '#6D56E8', icon: ClipboardCheck, bg: 'rgba(109,86,232,0.10)' },
  chemical: { label: 'Exposição Química', color: '#E87D00', icon: FlaskConical, bg: 'rgba(232,125,0,0.10)' },
  certification: { label: 'Certificação', color: '#00D99A', icon: Award, bg: 'rgba(0,217,154,0.10)' },
  equipment: { label: 'Equipamento', color: '#14B8D4', icon: Package, bg: 'rgba(20,184,212,0.10)' },
};

export default function EmployeeTimelineTab({ employee, equipments: _equipments, inspections, checklists }) {
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();

  const { data: sessions = [] } = useQuery({
    queryKey: ['empSessions', workspaceId, employee.id],
    queryFn: () => db.ActivitySession.filter({ team_id: employee.team_id }, '-date', 50),
    enabled: !!employee.team_id,
  });

  const events = useMemo(() => {
    const list = [];

    sessions.filter(s => s.status === 'finalizado').forEach(s => {
      list.push({
        date: s.date, type: 'session',
        title: 'Execução operacional',
        desc: `${s.descidas_realizadas || 0} descidas · ${Math.round((s.tempo_total_minutos || 0) / 60 * 10) / 10}h`,
        severity: 'normal',
      });
    });

    inspections.forEach(i => {
      list.push({
        date: i.date, type: 'inspection',
        title: `Inspeção ${i.type === 'pre_uso' ? 'pré-uso' : i.type === 'periodica' ? 'periódica' : i.type}`,
        desc: `Resultado: ${i.result} · ${i.inspector_name || 'Inspetor não informado'}`,
        severity: i.result === 'reprovado' ? 'danger' : i.result === 'revisao_n3' ? 'warning' : 'normal',
        extra: i.chemical_exposure ? `⚗ Produtos: ${i.chemical_products}` : null,
      });
      if (i.chemical_exposure && i.chemical_products) {
        list.push({
          date: i.date, type: 'chemical',
          title: 'Exposição química registrada',
          desc: i.chemical_products,
          severity: 'warning',
        });
      }
    });

    checklists.forEach(cl => {
      const totalItems = 12;
      const checkedItems = Object.values(cl.items || {}).filter(Boolean).length;
      list.push({
        date: cl.date, type: 'checklist',
        title: `Checklist ${cl.type === 'pre_uso' ? 'pré-uso' : 'pós-uso'}`,
        desc: `${checkedItems}/${totalItems} itens verificados${cl.chemical_products ? ` · ⚗ ${cl.chemical_products}` : ''}`,
        severity: checkedItems === totalItems ? 'normal' : 'warning',
      });
    });

    (employee.certifications || []).forEach(cert => {
      if (cert.issued_date) {
        list.push({
          date: cert.issued_date, type: 'certification',
          title: `Certificação: ${cert.name || cert.type}`,
          desc: `Validade: ${cert.expiry_date || 'Indefinida'} · ${cert.issuer || ''}`,
          severity: 'normal',
        });
      }
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessions, inspections, checklists, employee]);

  // Agrupar por mês
  const grouped = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const key = ev.date ? format(new Date(ev.date + 'T12:00:00'), 'MMMM yyyy', { locale: ptBR }) : 'Data indefinida';
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return Object.entries(map);
  }, [events]);

  const SEVERITY_COLOR = { normal: null, warning: '#E87D00', danger: '#FC5252' };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">Timeline Operacional</h3>
        <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{events.length} evento(s) registrado(s)</p>
      </div>

      {events.length === 0 ? (
        <div className="py-12 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-white/30">Nenhum evento registrado ainda</p>
          <p className="text-xs mt-1" style={{ color: '#718096' }}>Eventos são gerados automaticamente conforme atividades, inspeções e checklists</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, evs]) => (
            <div key={month}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 capitalize"
                style={{ color: '#14B8D4' }}>{month}</p>
              <div className="space-y-0 relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-2 bottom-2 w-px"
                  style={{ background: 'linear-gradient(180deg, rgba(20,184,212,0.3), transparent)' }} />
                {evs.map((ev, i) => {
                  const cfg = EVENT_CFG[ev.type] || EVENT_CFG.session;
                  const Icon = cfg.icon;
                  const sc = SEVERITY_COLOR[ev.severity];
                  return (
                    <div key={i} className="flex gap-4 pl-2 pb-4">
                      {/* Dot */}
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 relative z-10"
                        style={{
                          background: sc ? `${sc}20` : cfg.bg,
                          border: `2px solid ${sc || cfg.color}`,
                          boxShadow: `0 0 8px ${sc || cfg.color}30`,
                        }}>
                        <Icon className="w-2.5 h-2.5" style={{ color: sc || cfg.color }} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 rounded-xl p-3"
                        style={{
                          background: 'linear-gradient(145deg,rgba(10,16,32,0.90),rgba(6,10,22,0.95))',
                          border: `1px solid ${sc ? sc + '25' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white">{ev.title}</p>
                          <p className="text-[10px] shrink-0" style={{ color: '#4A5568' }}>
                            {ev.date ? format(new Date(ev.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }) : '—'}
                          </p>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>{ev.desc}</p>
                        {ev.extra && <p className="text-[10px] mt-0.5 font-semibold" style={{ color: '#E87D00' }}>{ev.extra}</p>}
                        {ev.severity !== 'normal' && (
                          <p className="text-[10px] mt-1 font-semibold" style={{ color: sc }}>
                            {ev.severity === 'danger' ? '⚠ Requer atenção — consultar Supervisor N3' : '• Monitorar em próximas inspeções'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
