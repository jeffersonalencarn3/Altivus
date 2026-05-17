import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, Eye, Camera, FileText, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentServiceMutations } from '@/hooks/services/useAppointmentServiceMutations';

const STATUS_CFG = {
  not_started:        { label: 'Não Iniciado',        color: '#718096', bg: 'rgba(113,128,150,0.12)' },
  in_progress:        { label: 'Em Andamento',         color: '#14B8D4', bg: 'rgba(20,184,212,0.12)'  },
  photo_pending:      { label: 'Foto Pendente',        color: '#E87D00', bg: 'rgba(232,125,0,0.12)'   },
  executing:          { label: 'Em Execução',          color: '#6D56E8', bg: 'rgba(109,86,232,0.12)'  },
  report_pending:     { label: 'Reporte Pendente',     color: '#E87D00', bg: 'rgba(232,125,0,0.12)'   },
  awaiting_approval:  { label: 'Ag. Aprovação',        color: '#14B8D4', bg: 'rgba(20,184,212,0.12)'  },
  approved:           { label: 'Aprovado',             color: '#00D99A', bg: 'rgba(0,217,154,0.12)'   },
  rejected:           { label: 'Reprovado',            color: '#DC3737', bg: 'rgba(220,55,55,0.12)'   },
};

const FILTER_STATUSES = ['all', 'not_started', 'in_progress', 'photo_pending', 'executing', 'report_pending', 'awaiting_approval', 'approved', 'rejected'];

export default function AppointmentList({ onNew, onEdit, onDetail }) {
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const { deleteAppointment } = useAppointmentServiceMutations();
  const [search, setSearch]         = useState('');
  const [filterStatus, setStatus]   = useState('all');
  const [filterDate, setDate]       = useState('');
  const [filterContract, setContract] = useState('');
  const [filterEmployee, setEmployee] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ['appointments', workspaceId],
    queryFn: () => db.Appointment.list('-date', 100),
    enabled: !!workspaceId,
  });
  const { data: contracts = [] } = useQuery({ queryKey: ['contracts', workspaceId], queryFn: () => db.Contract.list(), enabled: !!workspaceId });
  const { data: activities = [] } = useQuery({ queryKey: ['activities', workspaceId], queryFn: () => db.Activity.list(), enabled: !!workspaceId });
  const { data: employees = [] } = useQuery({ queryKey: ['employees', workspaceId], queryFn: () => db.Employee.list(), enabled: !!workspaceId });

  const contractMap  = Object.fromEntries(contracts.map(c => [c.id, c.name]));
  const activityMap  = Object.fromEntries(activities.map(a => [a.id, a.title]));

  const filtered = useMemo(() => appts.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterDate && a.date !== filterDate) return false;
    if (filterContract && a.contract_id !== filterContract) return false;
    if (filterEmployee && a.employee_id !== filterEmployee) return false;
    if (search) {
      const q = search.toLowerCase();
      return (a.employee_name || '').toLowerCase().includes(q) ||
        (contractMap[a.contract_id] || '').toLowerCase().includes(q) ||
        (activityMap[a.activity_id] || '').toLowerCase().includes(q);
    }
    return true;
  }), [appts, filterStatus, filterDate, filterContract, filterEmployee, search]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
          <Input placeholder="Buscar colaborador, contrato, atividade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filtros
        </Button>
        <Button size="sm" onClick={onNew} className="gap-1.5">+ Novo</Button>
      </div>

      {/* Status pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTER_STATUSES.map(s => {
          const cfg = STATUS_CFG[s];
          const count = s === 'all' ? appts.length : appts.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setStatus(s)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={filterStatus === s
                ? { background: cfg ? cfg.bg : 'rgba(20,184,212,0.15)', color: cfg ? cfg.color : '#14B8D4', border: `1px solid ${cfg ? cfg.color + '50' : 'rgba(20,184,212,0.35)'}` }
                : { background: 'rgba(255,255,255,0.04)', color: '#718096', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {s === 'all' ? 'Todos' : cfg?.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#718096' }}>Data</label>
            <Input type="date" value={filterDate} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#718096' }}>Contrato</label>
            <select className="w-full h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
              value={filterContract} onChange={e => setContract(e.target.value)}>
              <option value="">Todos</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#718096' }}>Colaborador</label>
            <select className="w-full h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
              value={filterEmployee} onChange={e => setEmployee(e.target.value)}>
              <option value="">Todos</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
          <div className="text-5xl mb-4">📋</div>
          <p className="text-white/50 text-sm">Nenhum apontamento encontrado</p>
          <Button size="sm" className="mt-4" onClick={onNew}>Criar Primeiro Apontamento</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(a => {
            const st = STATUS_CFG[a.status] || STATUS_CFG.not_started;
            const hasBefore = (a.photos_before || []).length > 0;
            const hasAfter  = (a.photos_after  || []).length > 0;
            const hasReport = a.report_status === 'filled' || a.report_status === 'approved';
            return (
              <div key={a.id} className="rounded-2xl p-4 transition-all duration-200 hover:border-white/15 cursor-pointer"
                style={{ background: 'linear-gradient(145deg,rgba(12,18,36,.90),rgba(6,10,22,.96))', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                onClick={() => onDetail(a)}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    {/* Date */}
                    <div className="w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: 'rgba(20,184,212,0.08)', border: '1px solid rgba(20,184,212,0.18)' }}>
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#14B8D4' }}>
                        {a.date ? format(new Date(a.date), 'MMM', { locale: ptBR }) : '—'}
                      </span>
                      <span className="text-xl font-black text-white leading-tight">
                        {a.date ? format(new Date(a.date), 'dd') : '—'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold text-sm">{a.employee_name || '—'}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#718096', background: 'rgba(255,255,255,0.05)' }}>{a.employee_role || '—'}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs mb-1.5" style={{ color: '#718096' }}>
                        📋 {contractMap[a.contract_id] || '—'}{a.activity_id ? ` · ${activityMap[a.activity_id] || ''}` : ''}
                        {a.location ? ` · 📍 ${a.location}` : ''}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.start_time && <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(109,86,232,0.10)', color: '#6D56E8', border: '1px solid rgba(109,86,232,0.22)' }}>⏱ {a.start_time}{a.end_time ? ` – ${a.end_time}` : ''}{a.total_hours ? ` (${a.total_hours}h)` : ''}</span>}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${hasBefore ? '' : 'opacity-50'}`} style={{ background: hasBefore ? 'rgba(0,217,154,0.10)' : 'rgba(255,255,255,0.04)', color: hasBefore ? '#00D99A' : '#4A5568', border: `1px solid ${hasBefore ? 'rgba(0,217,154,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                          <Camera className="inline w-3 h-3 mr-0.5" />Antes{hasBefore ? ` (${a.photos_before.length})` : ' —'}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${hasAfter ? '' : 'opacity-50'}`} style={{ background: hasAfter ? 'rgba(20,184,212,0.10)' : 'rgba(255,255,255,0.04)', color: hasAfter ? '#14B8D4' : '#4A5568', border: `1px solid ${hasAfter ? 'rgba(20,184,212,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                          <Camera className="inline w-3 h-3 mr-0.5" />Depois{hasAfter ? ` (${a.photos_after.length})` : ' —'}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${hasReport ? '' : 'opacity-50'}`} style={{ background: hasReport ? 'rgba(232,125,0,0.10)' : 'rgba(255,255,255,0.04)', color: hasReport ? '#E87D00' : '#4A5568', border: `1px solid ${hasReport ? 'rgba(232,125,0,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                          <FileText className="inline w-3 h-3 mr-0.5" />{hasReport ? 'Reporte OK' : 'Sem Reporte'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => onDetail(a)} className="w-8 h-8"><Eye className="w-3.5 h-3.5" /></Button>
                    {!a.locked && <Button size="icon" variant="ghost" onClick={() => onEdit(a)} className="w-8 h-8"><Edit2 className="w-3.5 h-3.5" /></Button>}
                    {!a.locked && <Button size="icon" variant="ghost" onClick={() => { if (confirm('Excluir?')) deleteAppointment.mutate({ id: a.id }); }} className="w-8 h-8 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
