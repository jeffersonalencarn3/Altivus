import React, { useState, useMemo } from 'react';
import { useMaterials, useAllActivityMaterials, useTeams, useActivities } from '@/lib/useAppData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import PageHeader from '@/components/shared/PageHeader';
import StockKPIs from '@/components/materials/StockKPIs';
import ConsumptionCharts from '@/components/materials/ConsumptionCharts';
import StockTable from '@/components/materials/StockTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, AlertTriangle, Filter, X, Lock } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';
import { materialService } from '@/services/materialService';
import { invalidateGroup } from '@/services/serviceUtils';

const EMPTY = { name: '', type: 'epi', quantity_available: 0, unit: 'un', low_stock_threshold: 5 };

export default function Materials() {
  const { canManageMaterials } = usePermissions();
  const { data: materials = [] } = useMaterials();
  const { data: allActivityMaterials = [] } = useAllActivityMaterials();
  const { data: teams = [] } = useTeams();
  const { data: activities = [] } = useActivities();
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [period, setPeriod] = useState('mes');

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const close = () => { setOpen(false); setEditId(null); setForm(EMPTY); };

  const createMut = useMutation({
    mutationFn: d => materialService.createMaterial(db, d, { canManageMaterials }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'materials'); close(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => materialService.updateMaterial(db, id, data, { canManageMaterials }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'materials'); close(); },
  });
  const deleteMut = useMutation({
    mutationFn: id => materialService.deleteMaterial(db, id, { canManageMaterials }),
    onSuccess: () => invalidateGroup(qc, workspaceId, 'materials'),
  });

  const handleSave = () => {
    if (editId) updateMut.mutate({ id: editId, data: form });
    else createMut.mutate(form);
  };

  const openEdit = (m) => {
    setForm({ name: m.name, type: m.type, quantity_available: m.quantity_available, unit: m.unit, low_stock_threshold: m.low_stock_threshold ?? 5 });
    setEditId(m.id);
    setOpen(true);
  };

  // Filter activity materials by team
  const filteredActivityMaterials = useMemo(() => {
    if (teamFilter === 'all') return allActivityMaterials;
    const teamActivityIds = new Set(activities.filter(a => a.team_id === teamFilter).map(a => a.id));
    return allActivityMaterials.filter(am => teamActivityIds.has(am.activity_id));
  }, [allActivityMaterials, activities, teamFilter]);

  // Filter materials by type
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => typeFilter === 'all' || m.type === typeFilter);
  }, [materials, typeFilter]);

  const criticalCount = materials.filter(m => (m.quantity_available || 0) <= (m.low_stock_threshold || 5)).length;
  const hasFilters = typeFilter !== 'all' || teamFilter !== 'all';

  return (
    <div>
      <PageHeader title="Controle de Materiais" subtitle="Estoque, consumo e alertas de reposição">
        {canManageMaterials && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Material
          </Button>
        )}
        {!canManageMaterials && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
            <Lock className="w-3.5 h-3.5" /> Somente visualização
          </div>
        )}
      </PageHeader>

      {/* Alert banner */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{criticalCount} material(is)</strong> atingiram o estoque crítico e precisam de reposição!</span>
        </div>
      )}

      {/* KPIs */}
      <StockKPIs materials={materials} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border border-border/50 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="epi">EPI</SelectItem>
            <SelectItem value="ferramenta">Ferramenta</SelectItem>
            <SelectItem value="consumivel">Consumível</SelectItem>
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Equipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Equipes</SelectItem>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Por Semana</SelectItem>
            <SelectItem value="mes">Por Mês</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={() => { setTypeFilter('all'); setTeamFilter('all'); }}>
            <X className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard de Consumo</TabsTrigger>
          <TabsTrigger value="estoque" className="text-xs">Tabela de Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ConsumptionCharts
            activityMaterials={filteredActivityMaterials}
            materials={filteredMaterials}
            period={period}
          />
        </TabsContent>

        <TabsContent value="estoque">
          <StockTable
            materials={filteredMaterials}
            activityMaterials={filteredActivityMaterials}
            onEdit={canManageMaterials ? openEdit : null}
            onDelete={canManageMaterials ? (id) => deleteMut.mutate(id) : null}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog — apenas admin */}
      <Dialog open={open && canManageMaterials} onOpenChange={close}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome</Label><Input value={form.name} onChange={e => upd('name', e.target.value)} /></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select value={form.type} onValueChange={v => upd('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="epi">EPI</SelectItem>
                  <SelectItem value="ferramenta">Ferramenta</SelectItem>
                  <SelectItem value="consumivel">Consumível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Quantidade Disponível</Label><Input type="number" min="0" step="0.01" value={form.quantity_available} onChange={e => upd('quantity_available', Number(e.target.value))} /></div>
              <div><Label className="text-xs">Unidade</Label>
                <Select value={form.unit} onValueChange={v => upd('unit', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['un', 'm', 'kg', 'l', 'cx', 'par', 'rolo', 'lt'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Qtd Mínima (alerta crítico)</Label><Input type="number" min="0" value={form.low_stock_threshold} onChange={e => upd('low_stock_threshold', Number(e.target.value))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editId ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
