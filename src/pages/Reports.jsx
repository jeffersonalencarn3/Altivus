/**
 * Central Operacional de Relatórios — ALTIVUS
 * Listagem, filtros, visualização e exportação de relatórios operacionais
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useActivities, useContracts, useTeams } from '@/lib/useAppData';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OperationalReportViewer from '@/components/reports/OperationalReportViewer';
import { FileText, Search, Eye, CheckCircle2, Clock, Archive, RefreshCw, FileX } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { reportService } from '@/services/reportService';
import { invalidateGroup } from '@/services/serviceUtils';

const TAB_CFG = [
  { id: 'all',      l: 'Todos',              icon: FileText },
  { id: 'generated',l: 'Gerados',            icon: CheckCircle2 },
  { id: 'approved', l: 'Aprovados',          icon: CheckCircle2 },
  { id: 'draft',    l: 'Pendentes',          icon: Clock },
  { id: 'archived', l: 'Arquivados',         icon: Archive },
];

const STATUS_CFG = {
  draft:     { l: 'Rascunho',   c: '#718096' },
  generated: { l: 'Gerado',     c: '#14B8D4' },
  approved:  { l: 'Aprovado',   c: '#00D99A' },
  archived:  { l: 'Arquivado',  c: '#4A5568' },
};

export default function Reports() {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const qc = useQueryClient();
  const { data: activities = [] } = useActivities();
  const { data: contracts  = [] } = useContracts();
  const { data: teams      = [] } = useTeams();

  const [tab, setTab]             = useState('all');
  const [search, setSearch]       = useState('');
  const [filterContract, setFC]   = useState('all');
  const [filterTeam, setFT]       = useState('all');
  const [viewingReport, setViewing] = useState(null);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['operationalReports', workspaceId],
    queryFn: () => db.ActivityOperationalReport.list('-generated_at', 200),
    enabled: !!workspaceId,
    staleTime: 2 * 60_000,
  });

  const approveMut = useMutation({
    mutationFn: ({ id }) => reportService.approveOperationalReport(db, id),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'operationalReports'); toast.success('Relatório aprovado!'); },
  });

  const archiveMut = useMutation({
    mutationFn: ({ id }) => reportService.archiveOperationalReport(db, id),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'operationalReports'); toast.success('Relatório arquivado.'); },
  });

  const filtered = useMemo(() => {
    let r = reports;
    if (tab !== 'all') r = r.filter(x => x.status === tab);
    if (search) r = r.filter(x =>
      x.title?.toLowerCase().includes(search.toLowerCase()) ||
      x.report_number?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterContract !== 'all') r = r.filter(x => x.contract_id === filterContract);
    if (filterTeam !== 'all') {
      const teamActivityIds = activities.filter(a => a.team_id === filterTeam).map(a => a.id);
      r = r.filter(x => teamActivityIds.includes(x.activity_id));
    }
    return r;
  }, [reports, tab, search, filterContract, filterTeam, activities]);

  const kpis = useMemo(() => ({
    total:    reports.length,
    gerados:  reports.filter(r => r.status === 'generated').length,
    aprovados:reports.filter(r => r.status === 'approved').length,
    pendentes:reports.filter(r => r.status === 'draft').length,
  }), [reports]);

  return (
    <div className="space-y-5">
      <PageHeader title="Central de Relatórios" subtitle="Relatórios operacionais consolidados por atividade">
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Total',     v: kpis.total,     c: '#14B8D4' },
          { l: 'Gerados',   v: kpis.gerados,   c: '#6D56E8' },
          { l: 'Aprovados', v: kpis.aprovados, c: '#00D99A' },
          { l: 'Pendentes', v: kpis.pendentes, c: '#E87D00' },
        ].map(k => (
          <div key={k.l} className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: `${k.c}09`, border: `1px solid ${k.c}22` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${k.c}14`, border: `1px solid ${k.c}25`, color: k.c }}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{k.l}</p>
              <p className="text-xl font-black text-white">{k.v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TAB_CFG.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={tab === t.id
                ? { background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.35)', color: '#14B8D4' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }}>
              <Icon className="w-3 h-3" /> {t.l}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input className="pl-9 h-9 text-xs" placeholder="Buscar por título, número..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterContract} onValueChange={setFC}>
          <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Contrato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os contratos</SelectItem>
            {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTeam} onValueChange={setFT}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Equipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as equipes</SelectItem>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: '#718096' }}>Carregando relatórios...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <FileX className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold" style={{ color: '#718096' }}>Nenhum relatório encontrado</p>
          <p className="text-xs mt-1" style={{ color: '#4A5568' }}>Os relatórios são gerados ao finalizar uma atividade.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const st = STATUS_CFG[r.status] || STATUS_CFG.draft;
            const act = activities.find(a => a.id === r.activity_id);
            const contract = contracts.find(c => c.id === r.contract_id);
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl p-4 flex-wrap"
                style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(255,255,255,0.07)' }}>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.20)' }}>
                    <FileText className="w-5 h-5" style={{ color: '#14B8D4' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-bold text-white">{r.report_number}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${st.c}15`, color: st.c, border: `1px solid ${st.c}35` }}>{st.l}</span>
                    </div>
                    <p className="text-xs text-white/70 truncate max-w-xs">{r.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>
                      {contract?.name && `${contract.name} · `}
                      {act?.tipo_servico && `${act.tipo_servico === 'telhado' ? '🏗 Telhado' : '🏢 Fachada'} · `}
                      {r.generated_at && format(new Date(r.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      {r.efficiency_pct !== undefined && ` · ${r.efficiency_pct}% eficiência`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {r.status === 'generated' && (
                    <Button size="sm" variant="outline" onClick={() => approveMut.mutate({ id: r.id })}
                      className="text-xs gap-1 h-7" style={{ color: '#00D99A', borderColor: 'rgba(0,217,154,0.25)' }}>
                      <CheckCircle2 className="w-3 h-3" /> Aprovar
                    </Button>
                  )}
                  {r.status !== 'archived' && (
                    <Button size="sm" variant="outline" onClick={() => archiveMut.mutate({ id: r.id })}
                      className="text-xs gap-1 h-7" style={{ color: '#718096' }}>
                      <Archive className="w-3 h-3" /> Arquivar
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setViewing(r)} className="text-xs gap-1 h-7"
                    style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff' }}>
                    <Eye className="w-3 h-3" /> Ver Relatório
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer modal */}
      {viewingReport && (
        <OperationalReportViewer report={viewingReport} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
