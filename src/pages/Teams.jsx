import React, { useState, useMemo } from 'react';
import { useTeams, useEmployees, useAllActivityEmployees, useActivities } from '@/lib/useAppData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import TeamAllocationView from '@/components/teams/TeamAllocationView';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users, Clock, FileText, Trash, AlertTriangle, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePermissions } from '@/lib/usePermissions';
import { toast } from 'sonner';
import { teamService } from '@/services/teamService';
import { invalidateGroup } from '@/services/serviceUtils';

const emptyTeam = { name: '', leader: '', specialty: '', color: '#3b82f6', status: 'active' };
const emptyEmployee = { name: '', team_id: '', role: '', status: 'active', phone: '', certifications: [] };

export default function Teams() {
  const { data: teams = [] } = useTeams();
  const { data: employees = [] } = useEmployees();
  const { data: allAE = [] } = useAllActivityEmployees();
  const { data: activities = [] } = useActivities();
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const qc = useQueryClient();
  const { canManageTeams, canDeleteTeam, canEditEmployee, canDeleteEmployee, isWorkspaceAdmin, isSupervisor } = usePermissions();
  const { user } = useAuth();
  const canClearHistory = isWorkspaceAdmin || isSupervisor;

  // Soft-clear: guarda o timestamp da última limpeza por aba (localStorage para persistir na sessão)
  const STORAGE_KEY_HIST = `altivus_cleared_historico_${workspaceId}`;
  const STORAGE_KEY_EMP  = `altivus_cleared_employees_${workspaceId}`;
  const [clearedHistoricoAt, setClearedHistoricoAt] = useState(() => localStorage.getItem(STORAGE_KEY_HIST) || null);
  const [clearedEmployeesAt, setClearedEmployeesAt] = useState(() => localStorage.getItem(STORAGE_KEY_EMP) || null);

  // Filtro de visibilidade por aba
  const [histFilter, setHistFilter] = useState('active');   // 'active' | 'archived' | 'all'
  const [empFilter,  setEmpFilter]  = useState('active');

  // Confirm modals
  const [confirmClear, setConfirmClear] = useState(null); // 'historico' | 'employees'
  const [clearLoading, setClearLoading] = useState(false);

  const [tab, setTab] = useState('teams');
  const [openTeam, setOpenTeam] = useState(false);
  const [openEmp, setOpenEmp] = useState(false);
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [empForm, setEmpForm] = useState(emptyEmployee);
  const [editTeamId, setEditTeamId] = useState(null);
  const [editEmpId, setEditEmpId] = useState(null);

  const createTeam = useMutation({
    mutationFn: d => teamService.createTeam(db, d, { canManageTeams }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'teams'); closeTeam(); }
  });
  const updateTeam = useMutation({
    mutationFn: ({ id, d }) => teamService.updateTeam(db, id, d, { canManageTeams }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'teams'); closeTeam(); }
  });
  const deleteTeam = useMutation({
    mutationFn: id => teamService.deleteTeam(db, id, { canDeleteTeam }),
    onSuccess: () => invalidateGroup(qc, workspaceId, 'teams')
  });

  const createEmp = useMutation({
    mutationFn: d => teamService.createEmployee(db, d, { canEditEmployee }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'employees'); closeEmp(); }
  });
  const updateEmp = useMutation({
    mutationFn: ({ id, d }) => teamService.updateEmployee(db, id, d, { canEditEmployee }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'employees'); closeEmp(); }
  });
  const deleteEmp = useMutation({
    mutationFn: id => teamService.deleteEmployee(db, id, { canDeleteEmployee }),
    onSuccess: () => invalidateGroup(qc, workspaceId, 'employees')
  });

  const closeTeam = () => { setOpenTeam(false); setTeamForm(emptyTeam); setEditTeamId(null); };
  const closeEmp = () => { setOpenEmp(false); setEmpForm(emptyEmployee); setEditEmpId(null); };

  // ── Soft-clear handlers ─────────────────────────────────────────────────
  const handleClearHistory = async (target) => {
    setClearLoading(true);
    const now = new Date().toISOString();
    await new Promise(r => setTimeout(r, 400)); // simula processamento

    if (target === 'historico') {
      localStorage.setItem(STORAGE_KEY_HIST, now);
      setClearedHistoricoAt(now);
      setHistFilter('active');
      toast.success(`Histórico arquivado com sucesso. (${allAE.filter(ae => ae.created_date < now).length} registros ocultados)`);
    } else {
      localStorage.setItem(STORAGE_KEY_EMP, now);
      setClearedEmployeesAt(now);
      setEmpFilter('active');
      toast.success(`Histórico de colaboradores arquivado com sucesso.`);
    }
    // Auditoria no console (rastreabilidade)
    console.info('[ALTIVUS AUDIT] soft-clear', {
      action: 'history_cleared',
      target,
      user: user?.email,
      user_role: user?.role,
      workspace_id: workspaceId,
      timestamp: now,
    });
    setClearLoading(false);
    setConfirmClear(null);
  };

  // ── Filtros de visibilidade ─────────────────────────────────────────────
  const visibleAE = useMemo(() => {
    if (!clearedHistoricoAt || histFilter === 'all') return allAE;
    if (histFilter === 'archived') return allAE.filter(ae => ae.created_date && ae.created_date < clearedHistoricoAt);
    // 'active' — mostra apenas registros criados APÓS a limpeza
    return allAE.filter(ae => !ae.created_date || ae.created_date >= clearedHistoricoAt);
  }, [allAE, clearedHistoricoAt, histFilter]);

  const visibleEmployees = useMemo(() => {
    if (!clearedEmployeesAt || empFilter === 'all') return employees;
    if (empFilter === 'archived') return employees.filter(e => e.created_date && e.created_date < clearedEmployeesAt);
    return employees.filter(e => !e.created_date || e.created_date >= clearedEmployeesAt);
  }, [employees, clearedEmployeesAt, empFilter]);

  const archivedAECount    = clearedHistoricoAt ? allAE.filter(ae => ae.created_date && ae.created_date < clearedHistoricoAt).length : 0;
  const archivedEmpCount   = clearedEmployeesAt ? employees.filter(e => e.created_date && e.created_date < clearedEmployeesAt).length : 0;

  return (
    <div>
      <PageHeader title="Equipes & Colaboradores" subtitle="Gestão de equipes e membros">
        {((tab === 'teams' && canManageTeams) || (tab === 'employees' && canEditEmployee)) && (
          <Button onClick={() => tab === 'teams' ? setOpenTeam(true) : setOpenEmp(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> {tab === 'teams' ? 'Nova Equipe' : 'Novo Colaborador'}
          </Button>
        )}
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
          <TabsTrigger value="employees">Colaboradores</TabsTrigger>
          <TabsTrigger value="alocacao">Alocação em Tempo Real</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Participação</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-12">Nenhuma equipe cadastrada</p>
            ) : teams.map(team => {
              const members = employees.filter(e => e.team_id === team.id);
              return (
                <Card key={team.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: team.color || '#3b82f6' }} />
                        <div>
                          <CardTitle className="text-sm">{team.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{team.specialty || 'Sem especialidade'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {canManageTeams && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setTeamForm(team); setEditTeamId(team.id); setOpenTeam(true); }}><Pencil className="w-3 h-3" /></Button>}
                        {canDeleteTeam && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTeam.mutate(team.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Líder: {team.leader || '-'}</span>
                      <StatusBadge status={team.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" /> {members.length} membro(s)
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="employees">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" style={{ color: '#718096' }} />
              {(['active','archived','all']).map(f => (
                <button key={f} onClick={() => setEmpFilter(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={empFilter === f
                    ? { background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#718096', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {f === 'active' ? 'Ativos' : f === 'archived' ? `Arquivados${archivedEmpCount > 0 ? ` (${archivedEmpCount})` : ''}` : 'Todos'}
                </button>
              ))}
            </div>
            {canClearHistory && (
              <button onClick={() => setConfirmClear('employees')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(252,82,82,0.07)', border: '1px solid rgba(252,82,82,0.18)', color: '#FC5252' }}>
                <Trash className="w-3.5 h-3.5" /> Limpar Histórico
              </button>
            )}
          </div>
          <Card className="border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Nome</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Equipe</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Função</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">NR35/IRATA</th>
                   <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-28">Ações</th>
                </tr></thead>
                <tbody>
                  {visibleEmployees.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {empFilter === 'active' && archivedEmpCount > 0
                        ? `Histórico limpo — ${archivedEmpCount} registro(s) arquivado(s). Use o filtro "Arquivados" para visualizar.`
                        : 'Nenhum colaborador'}
                    </td></tr>
                  ) : visibleEmployees.map(emp => (
                    <tr key={emp.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-3 font-medium">{emp.name}</td>
                      <td className="p-3 text-muted-foreground">{teams.find(t => t.id === emp.team_id)?.name || '-'}</td>
                      <td className="p-3 text-muted-foreground">{emp.role || '-'}</td>
                      <td className="p-3"><StatusBadge status={emp.status} /></td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {emp.nr35_level ? <span className="font-semibold text-primary">NR35 {emp.nr35_level}</span> : '—'}
                        {emp.irata_level ? <span className="ml-2 text-purple-400">IRATA {emp.irata_level}</span> : ''}
                      </td>
                       <td className="p-3">
                         <div className="flex gap-1">
                           <Link to={`/employees/${emp.id}`}>
                             <Button variant="ghost" size="icon" className="h-7 w-7" title="Prontuário"><FileText className="w-3 h-3" style={{ color: '#14B8D4' }} /></Button>
                           </Link>
                           {canEditEmployee && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEmpForm(emp); setEditEmpId(emp.id); setOpenEmp(true); }}><Pencil className="w-3 h-3" /></Button>}
                           {canDeleteEmployee && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEmp.mutate(emp.id)}><Trash2 className="w-3 h-3" /></Button>}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alocacao">
          <TeamAllocationView employees={employees} teams={teams} />
        </TabsContent>

        <TabsContent value="historico">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" style={{ color: '#718096' }} />
              {(['active','archived','all']).map(f => (
                <button key={f} onClick={() => setHistFilter(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={histFilter === f
                    ? { background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#718096', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {f === 'active' ? 'Ativos' : f === 'archived' ? `Arquivados${archivedAECount > 0 ? ` (${archivedAECount})` : ''}` : 'Todos'}
                </button>
              ))}
            </div>
            {canClearHistory && (
              <button onClick={() => setConfirmClear('historico')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(252,82,82,0.07)', border: '1px solid rgba(252,82,82,0.18)', color: '#FC5252' }}>
                <Trash className="w-3.5 h-3.5" /> Limpar Histórico
              </button>
            )}
          </div>
          <Card className="border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Colaborador</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Equipe</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Atividade</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Função</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Horas</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Status Atividade</th>
                </tr></thead>
                <tbody>
                  {visibleAE.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      {histFilter === 'active' && archivedAECount > 0
                        ? `Histórico limpo — ${archivedAECount} registro(s) arquivado(s). Use o filtro "Arquivados" para visualizar.`
                        : 'Nenhuma participação registrada'}
                    </td></tr>
                  ) : visibleAE.map(ae => {
                    const emp = employees.find(e => e.id === ae.employee_id);
                    const act = activities.find(a => a.id === ae.activity_id);
                    const team = teams.find(t => t.id === emp?.team_id);
                    const ROLE_LABELS = { lider: 'Líder', executor: 'Executor', apoio: 'Apoio' };
                    return (
                      <tr key={ae.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="p-3 font-medium">{emp?.name || '-'}</td>
                        <td className="p-3 text-muted-foreground">{team?.name || '-'}</td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{act?.title || '-'}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[ae.role_in_activity] || ae.role_in_activity}</Badge>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {ae.hours_worked || 0}h
                          </span>
                        </td>
                        <td className="p-3"><StatusBadge status={act?.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Dialog */}
      <Dialog open={openTeam} onOpenChange={closeTeam}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTeamId ? 'Editar' : 'Nova'} Equipe</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label className="text-xs">Nome</Label><Input value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label className="text-xs">Líder</Label><Input value={teamForm.leader} onChange={e => setTeamForm(p => ({ ...p, leader: e.target.value }))} /></div>
            <div><Label className="text-xs">Especialidade</Label><Input value={teamForm.specialty} onChange={e => setTeamForm(p => ({ ...p, specialty: e.target.value }))} /></div>
            <div><Label className="text-xs">Cor</Label><Input type="color" value={teamForm.color} onChange={e => setTeamForm(p => ({ ...p, color: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={teamForm.status} onValueChange={v => setTeamForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeTeam}>Cancelar</Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (editTeamId) {
                  updateTeam.mutate({ id: editTeamId, d: teamForm });
                } else {
                  createTeam.mutate(teamForm);
                }
              }}
              disabled={!teamForm.name || createTeam.isPending || updateTeam.isPending}
            >
              {createTeam.isPending || updateTeam.isPending ? 'Salvando...' : editTeamId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Limpar Histórico */}
      {confirmClear && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.98),rgba(6,10,22,0.99))', border: '1px solid rgba(252,82,82,0.28)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(252,82,82,0.12)', border: '1px solid rgba(252,82,82,0.28)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#FC5252' }} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Tem certeza?</h3>
                <p className="text-xs" style={{ color: '#718096' }}>Ação reversível apenas por filtro</p>
              </div>
            </div>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#A0AEC0' }}>
              Essa ação removerá o histórico antigo da visualização atual, mas manterá auditoria e rastreabilidade operacional. Os dados podem ser visualizados usando o filtro <strong style={{ color: '#14B8D4' }}>"Arquivados"</strong>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(null)}
                disabled={clearLoading}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#A0AEC0' }}>
                Cancelar
              </button>
              <button onClick={() => handleClearHistory(confirmClear)}
                disabled={clearLoading}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'rgba(252,82,82,0.15)', border: '1px solid rgba(252,82,82,0.35)', color: '#FC5252' }}>
                {clearLoading ? <><span className="w-3.5 h-3.5 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" />Limpando...</> : <><Trash className="w-3.5 h-3.5" />Limpar Histórico</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Dialog */}
      <Dialog open={openEmp} onOpenChange={closeEmp}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editEmpId ? 'Editar' : 'Novo'} Colaborador</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label className="text-xs">Nome</Label><Input value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label className="text-xs">Equipe</Label>
              <Select value={empForm.team_id} onValueChange={v => setEmpForm(p => ({ ...p, team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Função</Label><Input value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={empForm.phone} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={empForm.status} onValueChange={v => setEmpForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Certificações (separadas por vírgula)</Label><Input value={Array.isArray(empForm.certifications) ? empForm.certifications.map(c => c.name || c).join(', ') : ''} onChange={e => setEmpForm(p => ({ ...p, certifications: e.target.value ? e.target.value.split(',').map(s => ({ name: s.trim(), type: 'outro' })) : [] }))} placeholder="NR-35, IRATA, etc." /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeEmp}>Cancelar</Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (editEmpId) {
                  updateEmp.mutate({ id: editEmpId, d: empForm });
                } else {
                  createEmp.mutate(empForm);
                }
              }}
              disabled={!empForm.name || createEmp.isPending || updateEmp.isPending}
            >
              {createEmp.isPending || updateEmp.isPending ? 'Salvando...' : editEmpId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
