import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createAdminClient } from '@/lib/workspaceClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import WorkspaceDetail from '@/components/admin/WorkspaceDetail';
import { Building2, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock, Search, Eye, Lock, Unlock, Mail } from 'lucide-react';
import { format } from 'date-fns';

const ACCOUNT_STATUS = {
  trial:              { l: 'Teste Ativo',         c: '#14B8D4' },
  awaiting_approval:  { l: 'Ag. Aprovação',        c: '#E87D00' },
  active:             { l: 'Ativo',                c: '#00D99A' },
  blocked:            { l: 'Bloqueado',            c: '#DC3737' },
  expired:            { l: 'Expirado',             c: '#718096' },
  lead:               { l: 'Lead Comercial',       c: '#6D56E8' },
  pilot:              { l: 'Cliente Piloto',       c: '#00D99A' },
  paid:               { l: 'Cliente Pago',         c: '#00D99A' },
};

const COMMERCIAL_STATUS = {
  new_signup:        { l: 'Novo Cadastro',          c: '#14B8D4' },
  in_trial:          { l: 'Em Teste',               c: '#6D56E8' },
  engaged:           { l: 'Engajado',               c: '#00D99A' },
  low_usage:         { l: 'Baixo Uso',              c: '#718096' },
  potential_buyer:   { l: 'Potencial Comprador',    c: '#E87D00' },
  contact_made:      { l: 'Contato Realizado',      c: '#E87D00' },
  demo_scheduled:    { l: 'Demo Agendada',          c: '#14B8D4' },
  proposal_sent:     { l: 'Proposta Enviada',       c: '#6D56E8' },
  converted:         { l: 'Cliente Convertido',     c: '#00D99A' },
  lost:              { l: 'Perdido',                c: '#DC3737' },
  blocked:           { l: 'Bloqueado',              c: '#DC3737' },
};

const SCORE_LABEL = (s) => s <= 30 ? { l: 'Baixo uso', c: '#DC3737' } : s <= 60 ? { l: 'Uso moderado', c: '#E87D00' } : s <= 80 ? { l: 'Bom uso', c: '#14B8D4' } : { l: 'Alto potencial', c: '#00D99A' };

function KPICard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#718096' }}>{label}</p>
          <p className="text-2xl font-black" style={{ color }}>{value}</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function AdminMaster() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const adminDb = createAdminClient();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [filterAcc, setFilterAcc] = useState('all');
  const [filterComm, setFilterComm] = useState('all');
  const [detailWs, setDetailWs] = useState(null);
  const [editNotes, setEditNotes] = useState({});

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => adminDb.Workspace.list('-created_date', 200),
    enabled: isAdmin,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminDb.Workspace.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const sendEmailMut = useMutation({
    mutationFn: ({ ws, subject, body }) => base44.integrations.Core.SendEmail({ to: ws.responsible_email, subject, body }),
  });

  const stats = useMemo(() => ({
    total: workspaces.length,
    active: workspaces.filter(w => w.account_status === 'active' || w.account_status === 'pilot' || w.account_status === 'paid').length,
    trial: workspaces.filter(w => w.account_status === 'trial').length,
    blocked: workspaces.filter(w => w.account_status === 'blocked').length,
    potential: workspaces.filter(w => w.commercial_status === 'potential_buyer' || w.commercial_status === 'proposal_sent').length,
    last7: workspaces.filter(w => { const d = new Date(w.created_date); return (Date.now() - d) < 7 * 86400000; }).length,
    last30: workspaces.filter(w => { const d = new Date(w.created_date); return (Date.now() - d) < 30 * 86400000; }).length,
  }), [workspaces]);

  const filtered = useMemo(() => workspaces.filter(w => {
    if (filterAcc !== 'all' && w.account_status !== filterAcc) return false;
    if (filterComm !== 'all' && w.commercial_status !== filterComm) return false;
    if (search) {
      const q = search.toLowerCase();
      return (w.company_name || '').toLowerCase().includes(q) || (w.responsible_email || '').toLowerCase().includes(q) || (w.responsible_name || '').toLowerCase().includes(q);
    }
    return true;
  }), [workspaces, filterAcc, filterComm, search]);

  if (!isAdmin) return (
    <div className="flex items-center justify-center h-64 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
      <div className="text-center">
        <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: '#4A5568' }} />
        <p className="text-white/50 text-sm">Acesso restrito ao Super Admin ALTIVUS.</p>
      </div>
    </div>
  );

  if (detailWs) return (
    <div>
      <PageHeader title="ALTIVUS Admin Master" subtitle="Análise de Uso do Workspace">
        <Button variant="outline" size="sm" onClick={() => setDetailWs(null)}>← Voltar</Button>
      </PageHeader>
      <WorkspaceDetail workspace={detailWs} onBack={() => setDetailWs(null)} onUpdate={(id, data) => updateMut.mutate({ id, data })} />
    </div>
  );

  return (
    <div>
      <PageHeader title="ALTIVUS Admin Master" subtitle="Gestão Comercial · Workspaces · Possíveis Clientes">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.30)' }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#14B8D4', boxShadow: '0 0 6px #14B8D4' }} />
          <span className="text-xs font-bold" style={{ color: '#14B8D4' }}>Super Admin</span>
        </div>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Workspaces" value={stats.total} color="#14B8D4" icon={Building2} />
        <KPICard label="Workspaces Ativos" value={stats.active} color="#00D99A" icon={CheckCircle2} />
        <KPICard label="Em Teste" value={stats.trial} color="#6D56E8" icon={Clock} />
        <KPICard label="Potenciais Compradores" value={stats.potential} color="#E87D00" icon={TrendingUp} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPICard label="Novos (7 dias)" value={stats.last7} color="#14B8D4" icon={Users} />
        <KPICard label="Novos (30 dias)" value={stats.last30} color="#6D56E8" icon={Users} />
        <KPICard label="Bloqueados" value={stats.blocked} color="#DC3737" icon={AlertTriangle} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
          <Input placeholder="Buscar empresa, e-mail, responsável..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select className="h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
          value={filterAcc} onChange={e => setFilterAcc(e.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(ACCOUNT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
        </select>
        <select className="h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
          value={filterComm} onChange={e => setFilterComm(e.target.value)}>
          <option value="all">Status comercial</option>
          {Object.entries(COMMERCIAL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
          <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#4A5568' }} />
          <p className="text-white/50 text-sm">Nenhum workspace encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(ws => {
            const acc = ACCOUNT_STATUS[ws.account_status] || ACCOUNT_STATUS.trial;
            const comm = COMMERCIAL_STATUS[ws.commercial_status] || COMMERCIAL_STATUS.new_signup;
            const score = ws.adoption_score || 0;
            const sc = SCORE_LABEL(score);
            const trialDays = ws.trial_end ? Math.ceil((new Date(ws.trial_end) - new Date()) / 86400000) : null;

            return (
              <div key={ws.id} className="rounded-2xl p-4" style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.90),rgba(6,10,22,0.96))', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-bold text-sm">{ws.company_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${acc.c}14`, color: acc.c, border: `1px solid ${acc.c}35` }}>{acc.l}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${comm.c}14`, color: comm.c, border: `1px solid ${comm.c}35` }}>{comm.l}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${sc.c}14`, color: sc.c, border: `1px solid ${sc.c}35` }}>Score: {score} — {sc.l}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: '#718096' }}>
                      <span>👤 {ws.responsible_name || '—'}</span>
                      <span>📧 {ws.responsible_email || '—'}</span>
                      {ws.phone && <span>📱 {ws.phone}</span>}
                      {ws.role_title && <span>🏷️ {ws.role_title}</span>}
                      <span>📅 {ws.created_date ? format(new Date(ws.created_date), 'dd/MM/yyyy') : '—'}</span>
                      {trialDays !== null && trialDays > 0 && <span style={{ color: trialDays <= 5 ? '#E87D00' : '#718096' }}>⏱ {trialDays}d restantes</span>}
                      {trialDays !== null && trialDays <= 0 && <span style={{ color: '#DC3737' }}>⚠ Teste expirado</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setDetailWs(ws)} className="gap-1 h-7 text-xs px-2"><Eye className="w-3 h-3" /> Ver</Button>
                    <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: ws.id, data: { account_status: ws.account_status === 'blocked' ? 'trial' : 'blocked' } })}
                      className="gap-1 h-7 text-xs px-2" style={{ color: ws.account_status === 'blocked' ? '#00D99A' : '#E87D00' }}>
                      {ws.account_status === 'blocked' ? <><Unlock className="w-3 h-3" /> Liberar</> : <><Lock className="w-3 h-3" /> Bloquear</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendEmailMut.mutate({ ws, subject: `ALTIVUS — Seu workspace está ativo`, body: `Olá ${ws.responsible_name || ''},\n\nSeu workspace na ALTIVUS está ativo. Acesse a plataforma para continuar.\n\nEquipe ALTIVUS` })}
                      className="gap-1 h-7 text-xs px-2"><Mail className="w-3 h-3" /> E-mail</Button>
                    <select className="h-7 rounded-lg px-2 text-[11px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: comm.c }}
                      value={ws.commercial_status} onChange={e => updateMut.mutate({ id: ws.id, data: { commercial_status: e.target.value } })}>
                      {Object.entries(COMMERCIAL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Internal notes */}
                <div className="mt-3 flex gap-2">
                  <input className="flex-1 h-7 rounded-lg px-3 text-xs"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#A0AEC0' }}
                    placeholder="Observação interna (ex: cliente quente, aguardando proposta)..."
                    value={editNotes[ws.id] !== undefined ? editNotes[ws.id] : (ws.internal_notes || '')}
                    onChange={e => setEditNotes(n => ({ ...n, [ws.id]: e.target.value }))}
                    onBlur={() => {
                      if (editNotes[ws.id] !== undefined) {
                        updateMut.mutate({ id: ws.id, data: { internal_notes: editNotes[ws.id] } });
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
