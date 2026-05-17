import React, { useState } from 'react';
import { useContracts } from '@/lib/useAppData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/lib/usePermissions';
import { contractService } from '@/services/contractService';
import { invalidateGroup } from '@/services/serviceUtils';

const emptyContract = { name: '', company: '', status: 'active', start_date: '', end_date: '', sla_days: 0, value: 0, description: '' };

export default function Contracts() {
  const { data: contracts } = useContracts();
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const qc = useQueryClient();
  const { canCreateContract, canEditContract, canDeleteContract } = usePermissions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyContract);
  const [editId, setEditId] = useState(null);

  const createMut = useMutation({
    mutationFn: (d) => contractService.createContract(db, d, { canCreateContract }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'contracts'); close(); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => contractService.updateContract(db, id, d, { canEditContract }),
    onSuccess: () => { invalidateGroup(qc, workspaceId, 'contracts'); close(); }
  });
  const deleteMut = useMutation({
    mutationFn: (id) => contractService.deleteContract(db, id, { canDeleteContract }),
    onSuccess: () => invalidateGroup(qc, workspaceId, 'contracts')
  });

  const close = () => { setOpen(false); setForm(emptyContract); setEditId(null); };
  const edit = (c) => { if (!canEditContract) return; setForm(c); setEditId(c.id); setOpen(true); };
  const save = () => editId ? updateMut.mutate({ id: editId, d: form }) : createMut.mutate(form);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader title="Contratos" subtitle="Gerenciamento de contratos e empresas">
        {canCreateContract && (
          <Button onClick={() => setOpen(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Contrato</Button>
        )}
      </PageHeader>

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Contrato</TableHead>
              <TableHead className="text-xs">Empresa</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Início</TableHead>
              <TableHead className="text-xs">Fim</TableHead>
              <TableHead className="text-xs">SLA (dias)</TableHead>
              <TableHead className="text-xs">Valor</TableHead>
              <TableHead className="text-xs w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum contrato cadastrado</TableCell></TableRow>
            ) : contracts.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium">{c.name}</TableCell>
                <TableCell className="text-sm">{c.company}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.start_date ? format(new Date(c.start_date), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.end_date ? format(new Date(c.end_date), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell className="text-sm">{c.sla_days || '-'}</TableCell>
                <TableCell className="text-sm">{c.value ? `R$ ${Number(c.value).toLocaleString('pt-BR')}` : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {canEditContract && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => edit(c)}><Pencil className="w-3 h-3" /></Button>}
                    {canDeleteContract && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-3 h-3" /></Button>}
                    {!canEditContract && !canDeleteContract && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Contrato</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={e => upd('name', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={e => upd('company', e.target.value)} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => upd('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">SLA (dias)</Label><Input type="number" value={form.sla_days} onChange={e => upd('sla_days', Number(e.target.value))} /></div>
            <div><Label className="text-xs">Início</Label><Input type="date" value={form.start_date} onChange={e => upd('start_date', e.target.value)} /></div>
            <div><Label className="text-xs">Fim</Label><Input type="date" value={form.end_date} onChange={e => upd('end_date', e.target.value)} /></div>
            <div className="col-span-2"><Label className="text-xs">Valor (R$)</Label><Input type="number" value={form.value} onChange={e => upd('value', Number(e.target.value))} /></div>
            <div className="col-span-2"><Label className="text-xs">Descrição</Label><Textarea value={form.description} onChange={e => upd('description', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={save} disabled={!form.name || !form.company}>{editId ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
