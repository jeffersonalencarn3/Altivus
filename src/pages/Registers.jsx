/**
 * Página Cadastros — Blocos (Units), Áreas, Tipos de Serviço
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Building2, Map, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/usePermissions';
import AccessDenied from '@/components/shared/AccessDenied';
import { registerService } from '@/services/registerService';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';

function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-3 rounded-full shimmer-line" style={{ width: i === cols ? 48 : '80%' }} />
        </td>
      ))}
    </tr>
  );
}

function CrudTable({ items, columns, onEdit, onDelete, isLoading }) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map(c => (
                <th key={c.key} className="text-left p-3 text-xs font-semibold text-muted-foreground">{c.label}</th>
              ))}
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground w-20">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum registro cadastrado
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                {columns.map(c => (
                  <td key={c.key} className="p-3 text-sm text-muted-foreground">
                    {c.render ? c.render(item) : (item[c.key] ?? '—')}
                  </td>
                ))}
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Registers() {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const qc = useQueryClient();
  const { canManageRegisters } = usePermissions();
  const [tab, setTab] = useState('units');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const qOpts = {
    staleTime: 5 * 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!workspaceId,
    select: d => (Array.isArray(d) ? d : []),
  };

  const { data: units = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['units', workspaceId],
    queryFn: () => db.Unit.list(),
    ...qOpts,
  });

  const { data: areas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ['areas', workspaceId],
    queryFn: () => db.Area.list(),
    ...qOpts,
  });

  const { data: serviceTypes = [], isLoading: loadingST } = useQuery({
    queryKey: ['serviceTypes', workspaceId],
    queryFn: () => db.ServiceType.list(),
    ...qOpts,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', workspaceId],
    queryFn: () => db.Contract.list(),
    ...qOpts,
  });

  const inv = (key) => invalidateWorkspaceQueries(qc, workspaceId, [key]);
  const closeDialog = () => { setDialogOpen(false); setForm({}); setEditId(null); };
  const mutOpts = (key) => ({ onSuccess: () => { inv(key); closeDialog(); toast.success('Salvo com sucesso!'); } });

  const createUnit = useMutation({ mutationFn: d => registerService.create(db, 'units', d, { canManageRegisters }), ...mutOpts('units') });
  const updateUnit = useMutation({ mutationFn: ({ id, d }) => registerService.update(db, 'units', id, d, { canManageRegisters }), ...mutOpts('units') });
  const deleteUnit = useMutation({ mutationFn: id => registerService.delete(db, 'units', id, { canManageRegisters }), onSuccess: () => inv('units') });

  const createArea = useMutation({ mutationFn: d => registerService.create(db, 'areas', d, { canManageRegisters }), ...mutOpts('areas') });
  const updateArea = useMutation({ mutationFn: ({ id, d }) => registerService.update(db, 'areas', id, d, { canManageRegisters }), ...mutOpts('areas') });
  const deleteArea = useMutation({ mutationFn: id => registerService.delete(db, 'areas', id, { canManageRegisters }), onSuccess: () => inv('areas') });

  const createST = useMutation({ mutationFn: d => registerService.create(db, 'serviceTypes', d, { canManageRegisters }), ...mutOpts('serviceTypes') });
  const updateST = useMutation({ mutationFn: ({ id, d }) => registerService.update(db, 'serviceTypes', id, d, { canManageRegisters }), ...mutOpts('serviceTypes') });
  const deleteST = useMutation({ mutationFn: id => registerService.delete(db, 'serviceTypes', id, { canManageRegisters }), onSuccess: () => inv('serviceTypes') });

  const handleSave = () => {
    if (tab === 'units')         { editId ? updateUnit.mutate({ id: editId, d: form }) : createUnit.mutate(form); }
    else if (tab === 'areas')    { editId ? updateArea.mutate({ id: editId, d: form }) : createArea.mutate(form); }
    else                         { editId ? updateST.mutate({ id: editId, d: form }) : createST.mutate(form); }
  };

  const handleEdit = (item) => { setForm({ ...item }); setEditId(item.id); setDialogOpen(true); };
  const getContractName = id => contracts.find(c => c.id === id)?.name || '—';
  const getUnitName = id => units.find(u => u.id === id)?.name || '—';

  const TABS = [
    { id: 'units',        label: 'Blocos / Unidades', icon: Building2, count: units.length },
    { id: 'areas',        label: 'Áreas',             icon: Map,       count: areas.length },
    { id: 'serviceTypes', label: 'Tipos de Serviço',  icon: Wrench,    count: serviceTypes.length },
  ];

  if (!canManageRegisters) {
    return <AccessDenied message="Apenas o administrador do workspace pode gerenciar cadastros." />;
  }

  return (
    <div>
      <PageHeader title="Cadastros" subtitle="Blocos, áreas e tipos de serviço operacional">
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          {tab === 'units' ? 'Novo Bloco' : tab === 'areas' ? 'Nova Área' : 'Novo Tipo'}
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="mb-4">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                <span className="ml-1 text-[10px] opacity-60">({t.count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="units">
          <CrudTable
            isLoading={loadingUnits}
            items={units}
            columns={[
              { key: 'name',        label: 'Nome do Bloco' },
              { key: 'contract_id', label: 'Contrato',     render: i => getContractName(i.contract_id) },
              { key: 'location',    label: 'Localização' },
              { key: 'status',      label: 'Status',       render: i => (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: i.status === 'active' ? 'rgba(0,217,154,0.12)' : 'rgba(252,82,82,0.12)', color: i.status === 'active' ? '#00D99A' : '#FC5252' }}>
                  {i.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              )},
            ]}
            onEdit={handleEdit}
            onDelete={id => deleteUnit.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="areas">
          <CrudTable
            isLoading={loadingAreas}
            items={areas}
            columns={[
              { key: 'name',           label: 'Nome da Área' },
              { key: 'unit_id',        label: 'Bloco/Unidade', render: i => getUnitName(i.unit_id) },
              { key: 'risk_level',     label: 'Risco',         render: i => {
                const c = { low:'#00D99A', medium:'#E87D00', high:'#FC5252', critical:'#9B2C2C' }[i.risk_level] || '#718096';
                const l = { low:'Baixo', medium:'Médio', high:'Alto', critical:'Crítico' }[i.risk_level] || i.risk_level;
                return <span style={{ color: c, fontWeight: 600 }}>{l}</span>;
              }},
              { key: 'total_descents', label: 'Descidas Prev.' },
            ]}
            onEdit={handleEdit}
            onDelete={id => deleteArea.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="serviceTypes">
          <CrudTable
            isLoading={loadingST}
            items={serviceTypes}
            columns={[
              { key: 'name',                 label: 'Nome' },
              { key: 'description',          label: 'Descrição' },
              { key: 'avg_time_per_descent', label: 'Tempo Médio (h)' },
            ]}
            onEdit={handleEdit}
            onDelete={id => deleteST.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Editar' : 'Novo'}{' '}
              {tab === 'units' ? 'Bloco / Unidade' : tab === 'areas' ? 'Área' : 'Tipo de Serviço'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input className="mt-1.5" value={form.name || ''}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            {tab === 'units' && (
              <>
                <div>
                  <Label className="text-xs">Contrato Vinculado</Label>
                  <Select value={form.contract_id || ''} onValueChange={v => setForm(p => ({ ...p, contract_id: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
                    <SelectContent>
                      {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Localização</Label>
                  <Input className="mt-1.5" value={form.location || ''}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status || 'active'} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {tab === 'areas' && (
              <>
                <div>
                  <Label className="text-xs">Bloco / Unidade</Label>
                  <Select value={form.unit_id || ''} onValueChange={v => setForm(p => ({ ...p, unit_id: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o bloco" /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Nível de Risco</Label>
                  <Select value={form.risk_level || 'low'} onValueChange={v => setForm(p => ({ ...p, risk_level: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Total de Descidas Previstas</Label>
                  <Input className="mt-1.5" type="number" value={form.total_descents ?? 0}
                    onChange={e => setForm(p => ({ ...p, total_descents: Number(e.target.value) }))} />
                </div>
              </>
            )}

            {tab === 'serviceTypes' && (
              <>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Input className="mt-1.5" value={form.description || ''}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Tempo Médio por Descida (horas)</Label>
                  <Input className="mt-1.5" type="number" step="0.5" value={form.avg_time_per_descent ?? 0}
                    onChange={e => setForm(p => ({ ...p, avg_time_per_descent: Number(e.target.value) }))} />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editId ? 'Salvar Alterações' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
