/**
 * Modal para criar nova atividade com planejamento automático
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calcularPlano } from '@/lib/planningEngine';
import { getBlocosList, getBlockArea } from '@/lib/blockDatabase';
import { Calculator, Zap } from 'lucide-react';

export default function PlanningCalculator({ open, onClose, onSave, contracts = [], teams = [] }) {
  const [form, setForm] = useState({
    tipo_servico: 'fachada',
    bloco_nome: '',
    area_m2: '',
    num_alpinistas: 1,
    contract_id: '',
    team_id: '',
    start_date: '',
    priority: 'medium',
  });
  const [plano, setPlano] = useState(null);

  const blocos = getBlocosList(form.tipo_servico);
  const areaBase = getBlockArea(form.tipo_servico, form.bloco_nome);

  useEffect(() => {
    if (form.bloco_nome) {
      const area = getBlockArea(form.tipo_servico, form.bloco_nome);
      if (area > 0) setForm(f => ({ ...f, area_m2: area }));
    }
  }, [form.bloco_nome, form.tipo_servico]);

  useEffect(() => {
    const area = Number(form.area_m2);
    if (area > 0) {
      setPlano(calcularPlano(area, Number(form.num_alpinistas) || 1));
    } else {
      setPlano(null);
    }
  }, [form.area_m2, form.num_alpinistas]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!plano) return;
    const area = Number(form.area_m2);
    const payload = {
      title: `${form.tipo_servico === 'telhado' ? 'Telhado' : 'Fachada'} — ${form.bloco_nome}`,
      tipo_servico: form.tipo_servico,
      bloco_nome: form.bloco_nome,
      area_m2: area,
      num_alpinistas: Number(form.num_alpinistas),
      contract_id: form.contract_id,
      team_id: form.team_id,
      start_date: form.start_date,
      priority: form.priority,
      status: 'not_started',
      progress: 0,
      descents_planned: plano.descidas_planejadas,
      descents_completed: 0,
      time_per_descent: 1.33,
      hours_planned: plano.tempo_total_horas,
      dias_planejados: plano.dias_planejados,
      tempo_total_horas: plano.tempo_total_horas,
      planning_log: [{ timestamp: new Date().toISOString(), msg: 'Planejamento inicial calculado automaticamente' }],
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Nova Atividade — Planejamento Automático
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Tipo */}
          <div>
            <Label>Tipo de Serviço</Label>
            <Select value={form.tipo_servico} onValueChange={v => { upd('tipo_servico', v); upd('bloco_nome', ''); upd('area_m2', ''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="telhado">Telhado</SelectItem>
                <SelectItem value="fachada">Fachada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bloco */}
          <div>
            <Label>Bloco</Label>
            <Select value={form.bloco_nome} onValueChange={v => upd('bloco_nome', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {blocos.map(b => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name} — {b.area.toLocaleString('pt-BR')} m²
                  </SelectItem>
                ))}
                <SelectItem value="__custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área */}
          <div>
            <Label>Área (m²) {areaBase && <span className="text-primary text-[10px] ml-1">base: {areaBase} m²</span>}</Label>
            <Input type="number" value={form.area_m2} onChange={e => upd('area_m2', e.target.value)} />
          </div>

          {/* Alpinistas */}
          <div>
            <Label>Nº Alpinistas</Label>
            <Input type="number" min={1} value={form.num_alpinistas} onChange={e => upd('num_alpinistas', e.target.value)} />
          </div>

          {/* Contrato */}
          <div>
            <Label>Contrato</Label>
            <Select value={form.contract_id} onValueChange={v => upd('contract_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Equipe */}
          <div>
            <Label>Equipe</Label>
            <Select value={form.team_id} onValueChange={v => upd('team_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Data início */}
          <div>
            <Label>Data Início</Label>
            <Input type="date" value={form.start_date} onChange={e => upd('start_date', e.target.value)} />
          </div>

          {/* Prioridade */}
          <div>
            <Label>Prioridade</Label>
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
        </div>

        {/* Resultado do plano */}
        {plano && (
          <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Plano Calculado Automaticamente</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/50 text-xs">Descidas Planejadas</span>
                <p className="text-white font-bold text-lg">{plano.descidas_planejadas}</p>
              </div>
              <div>
                <span className="text-white/50 text-xs">Dias Planejados</span>
                <p className="text-white font-bold text-lg">{plano.dias_planejados}</p>
              </div>
              <div>
                <span className="text-white/50 text-xs">Horas Totais</span>
                <p className="text-white font-bold">{plano.tempo_total_horas}h</p>
              </div>
              <div>
                <span className="text-white/50 text-xs">Horas / Equipe</span>
                <p className="text-white font-bold">{plano.tempo_por_equipe}h</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!plano || !form.bloco_nome}>
            <Calculator className="w-4 h-4 mr-1" /> Criar Atividade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}