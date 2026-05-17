/**
 * AddCollaboratorSheet — Ajuste rápido de efetivo operacional em campo
 * Permite adicionar/remover colaboradores da atividade em tempo real,
 * com histórico de auditoria automático.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useEmployees, useTeams } from '@/lib/useAppData';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  X, Search, UserPlus, UserMinus, AlertTriangle, Shield, Users, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActivityServiceMutations } from '@/hooks/services/useActivityServiceMutations';
import { invalidateGroup } from '@/services/serviceUtils';

/* ── Verifica se certificação está vencida/próx. vencer ── */
function getCertAlert(employee) {
  const certs = employee.certifications || [];
  const today = new Date();
  const alerts = [];
  for (const c of certs) {
    if (!c.expiry_date) continue;
    const exp = new Date(c.expiry_date);
    const diffDays = Math.floor((exp - today) / 86400000);
    if (diffDays < 0)   alerts.push({ name: c.name || c.type, type: 'expired' });
    else if (diffDays <= 30) alerts.push({ name: c.name || c.type, type: 'expiring', days: diffDays });
  }
  return alerts;
}

/* ── Card de colaborador ── */
const EmployeeCard = React.memo(function EmployeeCard({ emp, teamName, isInActivity, onAdd, onRemove, loading }) {
  const certAlerts = useMemo(() => getCertAlert(emp), [emp]);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{
        background: isInActivity ? 'rgba(0,217,154,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isInActivity ? 'rgba(0,217,154,0.20)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Avatar / Foto */}
      <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm"
        style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '2px solid rgba(20,184,212,0.20)' }}>
        {emp.photo_url
          ? <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
          : (emp.name || '?')[0].toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">{emp.name}</span>
          {isInActivity && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,217,154,0.15)', color: '#00D99A' }}>✓ na atividade</span>
          )}
          {emp.status === 'inactive' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(252,82,82,0.15)', color: '#FC5252' }}>inativo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
          {emp.role && <span className="text-[11px]" style={{ color: '#718096' }}>{emp.role}</span>}
          {teamName && <span className="text-[11px]" style={{ color: '#4A5568' }}>· {teamName}</span>}
          {emp.nr35_level && <span className="text-[11px] font-semibold" style={{ color: '#14B8D4' }}>NR35 {emp.nr35_level}</span>}
          {emp.irata_level && <span className="text-[11px] font-semibold" style={{ color: '#6D56E8' }}>IRATA {emp.irata_level}</span>}
        </div>
        {/* Alertas de certificação */}
        {certAlerts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {certAlerts.slice(0, 2).map((a, i) => (
              <span key={i} className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: a.type === 'expired' ? 'rgba(252,82,82,0.15)' : 'rgba(232,125,0,0.15)',
                  color:      a.type === 'expired' ? '#FC5252' : '#E87D00',
                }}>
                <AlertTriangle className="w-2.5 h-2.5" />
                {a.name} {a.type === 'expired' ? 'vencida' : `vence em ${a.days}d`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ação */}
      <div className="shrink-0">
        {isInActivity ? (
          <button
            onClick={() => onRemove(emp)}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(252,82,82,0.10)', border: '1px solid rgba(252,82,82,0.25)', color: '#FC5252' }}
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remover</span>
          </button>
        ) : (
          <button
            onClick={() => onAdd(emp)}
            disabled={loading || emp.status === 'inactive'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(0,217,154,0.10)', border: '1px solid rgba(0,217,154,0.25)', color: '#00D99A' }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        )}
      </div>
    </div>
  );
});

/* ── Sheet principal ── */
export default function AddCollaboratorSheet({ open, onClose, activity }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const qc = useQueryClient();
  const { data: allEmployees = [] } = useEmployees();
  const { data: allTeams = [] } = useTeams();

  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch]           = useState('');
  const [filterTeam, setFilterTeam]   = useState('all');
  const [filterRole, setFilterRole]   = useState('all');
  const [loading, setLoading]         = useState(false);
  const { addCollaborator, removeCollaborator } = useActivityServiceMutations({ activity, user: currentUser });

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  /* Colaboradores já vinculados à atividade (ActivityEmployee) */
  const { data: activityEmployees = [], refetch: refetchAE } = useQuery({
    queryKey: ['activityEmployees', workspaceId, activity?.id],
    queryFn: () => db.ActivityEmployee.filter({ activity_id: activity.id }),
    enabled: !!activity?.id && !!workspaceId && open,
  });

  const inActivityIds = useMemo(() => new Set(activityEmployees.map(ae => ae.employee_id)), [activityEmployees]);

  /* Unique roles for filter */
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(allEmployees.map(e => e.role).filter(Boolean))];
    return roles.sort();
  }, [allEmployees]);

  /* Filtros + busca com debounce simples */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allEmployees.filter(emp => {
      if (filterTeam !== 'all' && emp.team_id !== filterTeam) return false;
      if (filterRole !== 'all' && emp.role !== filterRole)     return false;
      if (q && !emp.name.toLowerCase().includes(q) && !(emp.role || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEmployees, search, filterTeam, filterRole]);

  /* Ordena: em atividade primeiro, depois ativos, depois inativos */
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aIn = inActivityIds.has(a.id) ? 0 : 1;
    const bIn = inActivityIds.has(b.id) ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    const aActive = a.status === 'active' ? 0 : 1;
    const bActive = b.status === 'active' ? 0 : 1;
    return aActive - bActive;
  }), [filtered, inActivityIds]);

  const invalidateAll = useCallback(() => {
    refetchAE();
    invalidateGroup(qc, workspaceId, 'activities');
  }, [qc, workspaceId, activity?.id, refetchAE]);

  /* ── Adicionar colaborador ── */
  const handleAdd = async (emp) => {
    setLoading(true);
    try {
      const team = allTeams.find(t => t.id === activity.team_id);
      const today = new Date().toISOString().split('T')[0];
      await addCollaborator.mutateAsync({
        workspaceId,
        employee: emp,
        team,
        today,
      });
      invalidateAll();
      toast.success(`${emp.name} adicionado à atividade`);
    } catch (e) {
      toast.error('Erro ao adicionar colaborador');
      console.error(e);
    }
    setLoading(false);
  };

  /* ── Remover colaborador ── */
  const handleRemove = async (emp) => {
    setLoading(true);
    try {
      await removeCollaborator.mutateAsync({ activityEmployees, employee: emp });
      invalidateAll();
      toast.success(`${emp.name} removido da atividade`);
    } catch {
      toast.error('Erro ao remover colaborador');
    }
    setLoading(false);
  };

  if (!open) return null;

  const inCount  = sorted.filter(e => inActivityIds.has(e.id)).length;
  const outCount = sorted.filter(e => !inActivityIds.has(e.id)).length;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[130] flex flex-col sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto"
        style={{
          height: '90vh',
          width: 'min(460px, 100vw)',
          background: 'linear-gradient(160deg, rgba(8,14,30,0.99) 0%, rgba(5,10,22,1) 100%)',
          borderTop: '1px solid rgba(20,184,212,0.20)',
          borderLeft: '1px solid rgba(20,184,212,0.12)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.8), 0 -8px 48px rgba(0,0,0,0.8)',
        }}
        // sm: full right-panel style
        onClick={e => e.stopPropagation()}
      >
        {/* ── Handle (mobile) ── */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* ── Header ── */}
        <div className="shrink-0 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,217,154,0.15)', border: '1px solid rgba(0,217,154,0.25)' }}>
                <Users className="w-3.5 h-3.5" style={{ color: '#00D99A' }} />
              </div>
              <h2 className="text-sm font-bold text-white">Ajuste de Efetivo</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px]" style={{ color: '#718096' }}>
            {activity?.title} · <span style={{ color: '#00D99A' }}>{inCount} na atividade</span> · {outCount} disponíveis
          </p>
        </div>

        {/* ── Filtros ── */}
        <div className="shrink-0 px-5 py-3 space-y-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Busca */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: '#718096' }} />
            <input
              placeholder="Buscar colaborador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
              style={{ color: '#E2E8F0', caretColor: '#14B8D4' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros select */}
          <div className="flex gap-2">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="text-xs h-8 flex-1">
                <Filter className="w-3 h-3 mr-1 opacity-50" />
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                {allTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="text-xs h-8 flex-1">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {uniqueRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Lista de colaboradores ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm" style={{ color: '#718096' }}>Nenhum colaborador encontrado</p>
            </div>
          ) : (
            <>
              {/* Seção: Na atividade */}
              {sorted.some(e => inActivityIds.has(e.id)) && (
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#00D99A' }}>
                    ✓ Na Atividade ({inCount})
                  </p>
                  {sorted.filter(e => inActivityIds.has(e.id)).map(emp => (
                    <div key={emp.id} className="mb-2">
                      <EmployeeCard
                        emp={emp}
                        teamName={allTeams.find(t => t.id === emp.team_id)?.name}
                        isInActivity={true}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        loading={loading}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Seção: Disponíveis */}
              {sorted.some(e => !inActivityIds.has(e.id)) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#718096' }}>
                    Disponíveis ({outCount})
                  </p>
                  {sorted.filter(e => !inActivityIds.has(e.id)).map(emp => (
                    <div key={emp.id} className="mb-2">
                      <EmployeeCard
                        emp={emp}
                        teamName={allTeams.find(t => t.id === emp.team_id)?.name}
                        isInActivity={false}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        loading={loading}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,10,22,0.95)' }}>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#4A5568' }} />
            <p className="text-[11px]" style={{ color: '#4A5568' }}>
              Toda alteração gera registro histórico com timestamp e responsável.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
