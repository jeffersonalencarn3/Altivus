import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MaterialsPanel from '@/components/materials/MaterialsPanel';
import ActivityTeamPanel from '@/components/activities/ActivityTeamPanel';

const emptyForm = {
  title: '', contract_id: '', unit_id: '', area_id: '', team_id: '', service_type_id: '',
  start_date: '', end_date: '', status: 'not_started', progress: 0,
  descents_planned: 0, descents_completed: 0, time_per_descent: 0,
  hours_planned: 0, hours_actual: 0, observations: '', risks: '', priority: 'medium',
};

export default function ActivityDialog({ open, onClose, editData, onSave, teams = [], areas = [], contracts = [], units = [], serviceTypes = [] }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(editData || emptyForm);
  }, [editData, open]);

  const upd = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      // Auto-calculate hours planned
      if (k === 'descents_planned' || k === 'time_per_descent') {
        next.hours_planned = (next.descents_planned || 0) * (next.time_per_descent || 0);
      }
      // Auto-calculate progress from hours
      if (k === 'hours_actual' || k === 'hours_planned' || k === 'descents_planned' || k === 'time_per_descent') {
        const planned = k === 'hours_planned'
          ? next.hours_planned
          : (k === 'descents_planned' || k === 'time_per_descent')
            ? next.hours_planned
            : next.hours_planned;
        const actual = next.hours_actual || 0;
        if (planned > 0) {
          next.progress = Math.min(100, Math.round((actual / planned) * 100));
        } else {
          next.progress = 0;
        }
        // Auto status
        if (next.progress === 0) next.status = 'not_started';
        else if (next.progress >= 100) next.status = 'completed';
        else next.status = 'in_progress';
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editData ? 'Editar' : 'Nova'} Atividade</DialogTitle></DialogHeader>
        <Tabs defaultValue="dados">
          <TabsList className="mb-4">
            <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="equipe" className="text-xs" disabled={!editData}>Equipe{!editData && ' (salve primeiro)'}</TabsTrigger>
            <TabsTrigger value="materiais" className="text-xs" disabled={!editData}>Materiais{!editData && ' (salve primeiro)'}</TabsTrigger>
          </TabsList>
          <TabsContent value="equipe">
            {editData && <ActivityTeamPanel activityId={editData.id} hoursPlanned={editData.hours_planned || 0} />}
          </TabsContent>
          <TabsContent value="materiais">
            {editData && <MaterialsPanel activityId={editData.id} />}
          </TabsContent>
          <TabsContent value="dados">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label className="text-xs">Título</Label><Input value={form.title} onChange={e => upd('title', e.target.value)} /></div>

          <div><Label className="text-xs">Contrato</Label>
            <Select value={form.contract_id || ''} onValueChange={v => upd('contract_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Unidade</Label>
            <Select value={form.unit_id || ''} onValueChange={v => upd('unit_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Área</Label>
            <Select value={form.area_id || ''} onValueChange={v => upd('area_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Equipe</Label>
            <Select value={form.team_id || ''} onValueChange={v => upd('team_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Tipo de Serviço</Label>
            <Select value={form.service_type_id || ''} onValueChange={v => upd('service_type_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{serviceTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Prioridade</Label>
            <Select value={form.priority} onValueChange={v => upd('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div><Label className="text-xs">Data Início</Label><Input type="date" value={form.start_date} onChange={e => upd('start_date', e.target.value)} /></div>
          <div><Label className="text-xs">Data Fim</Label><Input type="date" value={form.end_date} onChange={e => upd('end_date', e.target.value)} /></div>

          <div><Label className="text-xs">Status <span className="text-muted-foreground">(auto)</span></Label>
            <Select value={form.status} onValueChange={v => upd('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Não Iniciado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Progresso <span className="text-muted-foreground">(auto)</span></Label>
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${form.progress >= 100 ? 'text-green-500' : form.progress > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {form.progress}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${form.progress >= 100 ? 'bg-green-500' : form.progress > 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  style={{ width: `${form.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div><Label className="text-xs">Descidas Planejadas</Label><Input type="number" value={form.descents_planned} onChange={e => upd('descents_planned', Number(e.target.value))} /></div>
          <div><Label className="text-xs">Descidas Realizadas</Label><Input type="number" value={form.descents_completed} onChange={e => upd('descents_completed', Number(e.target.value))} /></div>

          <div><Label className="text-xs">Tempo por Descida (h)</Label><Input type="number" step="0.5" value={form.time_per_descent} onChange={e => upd('time_per_descent', Number(e.target.value))} /></div>
          <div><Label className="text-xs">Horas Previstas (auto)</Label><Input type="number" value={form.hours_planned} readOnly className="bg-muted" /></div>

          <div><Label className="text-xs">Horas Realizadas</Label><Input type="number" value={form.hours_actual} onChange={e => upd('hours_actual', Number(e.target.value))} /></div>
          <div />

          <div className="col-span-2"><Label className="text-xs">Observações Técnicas</Label><Textarea value={form.observations} onChange={e => upd('observations', e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Riscos Identificados</Label><Textarea value={form.risks} onChange={e => upd('risks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title}>{editData ? 'Salvar' : 'Criar'}</Button>
        </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}