import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, X, Camera, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { employeeService } from '@/services/employeeService';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';

const CHECKLIST_ITEMS = [
  { key: 'costuras', label: 'Costuras' },
  { key: 'conectores', label: 'Conectores' },
  { key: 'deformacoes', label: 'Deformações' },
  { key: 'oxidacao', label: 'Oxidação / Ferrugem' },
  { key: 'travas', label: 'Travas / Gatilhos' },
  { key: 'abrasao', label: 'Abrasão / Desgaste' },
  { key: 'funcionamento', label: 'Funcionamento Geral' },
  { key: 'limpeza', label: 'Limpeza' },
  { key: 'marcacao_ca', label: 'Marcação / CA' },
  { key: 'costuras_internas', label: 'Costuras Internas' },
];

const INSP_TYPE_LABELS = {
  pre_uso: 'Pré-Uso',
  periodica: 'Periódica',
  extraordinaria: 'Extraordinária',
  operacional: 'Operacional',
  entrega: 'Entrega',
};

const RESULT_CFG = {
  aprovado: { label: 'Aprovado', color: '#00D99A', bg: 'rgba(0,217,154,0.10)' },
  observacao: { label: 'Observação', color: '#E87D00', bg: 'rgba(232,125,0,0.10)' },
  revisao_n3: { label: 'Requer N3', color: '#6D56E8', bg: 'rgba(109,86,232,0.10)' },
  reprovado: { label: 'Reprovado N3', color: '#FC5252', bg: 'rgba(252,82,82,0.10)' },
};

const ITEM_STATUS = {
  ok: { label: 'OK', color: '#00D99A' },
  atencao: { label: 'Atenção', color: '#E87D00' },
  reprovado: { label: 'Reprovado', color: '#FC5252' },
  na: { label: 'N/A', color: '#4A5568' },
};

const EMPTY_INSP = {
  type: 'pre_uso', date: new Date().toISOString().slice(0, 10), inspector_name: '',
  checklist: {}, result: 'aprovado', observations: '', photos: [], chemical_exposure: false, chemical_products: '',
};

export default function EmployeeInspectionsTab({ employee, equipments, inspections, db, workspaceId, onRefresh }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState('');

  const invalidate = () => {
    invalidateWorkspaceQueries(qc, workspaceId, [
      ['inspections', workspaceId, employee.id],
      ['inspections', workspaceId, 'all'],
    ]);
    onRefresh();
  };

  const handleSave = async () => {
    if (!editing.equipment_id) { toast.error('Selecione um equipamento'); return; }
    setSaving(true);
    try {
      const data = { ...editing, employee_id: employee.id, workspace_id: workspaceId };
      await employeeService.saveInspection(db, {
        employee,
        workspaceId,
        data,
        inspectionTypeLabel: INSP_TYPE_LABELS[editing.type],
      });
      toast.success('Inspeção registrada!');
      setEditing(null);
      invalidate();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditing(prev => ({ ...prev, photos: [...(prev.photos || []), file_url] }));
    } catch { toast.error('Erro ao enviar foto'); }
    setUploadingPhoto(false);
  };

  const upd = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));
  const updCL = (k, v) => setEditing(prev => ({ ...prev, checklist: { ...prev.checklist, [k]: v } }));

  const filteredInspections = selectedEqId && selectedEqId !== ''
    ? inspections.filter(i => i.equipment_id === selectedEqId)
    : inspections;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Inspeções Registradas</h3>
          <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{inspections.length} inspeção(ões)</p>
        </div>
        <div className="flex gap-2">
          {equipments.length > 0 && (
            <Select value={selectedEqId} onValueChange={setSelectedEqId}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Filtrar equip." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos</SelectItem>
                {equipments.map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.tag} — {eq.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" className="gap-1.5 h-8"
            onClick={() => setEditing({ ...EMPTY_INSP, _isNew: true, equipment_id: selectedEqId || '' })}>
            <Plus className="w-3.5 h-3.5" /> Nova Inspeção
          </Button>
        </div>
      </div>

      {/* NR35 Legal Notice */}
      <div className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: 'rgba(109,86,232,0.06)', border: '1px solid rgba(109,86,232,0.15)' }}>
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#6D56E8' }} />
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Somente <strong style={{ color: '#6D56E8' }}>Supervisor N3 ou inspetor autorizado</strong> pode reprovar, condenar ou bloquear equipamentos. A IA apenas auxilia tecnicamente.
        </p>
      </div>

      {filteredInspections.length === 0 ? (
        <div className="py-12 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-white/30 mb-3">Nenhuma inspeção registrada</p>
          <Button size="sm" variant="outline" onClick={() => setEditing({ ...EMPTY_INSP, _isNew: true })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Registrar Inspeção
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInspections
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(insp => {
              const eq = equipments.find(e => e.id === insp.equipment_id);
              const rcfg = RESULT_CFG[insp.result] || RESULT_CFG.aprovado;
              const checkCount = Object.keys(insp.checklist || {}).length;
              const failCount = Object.values(insp.checklist || {}).filter(v => v === 'reprovado').length;
              const warnCount = Object.values(insp.checklist || {}).filter(v => v === 'atencao').length;
              return (
                <div key={insp.id} className="rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setEditing({ ...insp })}
                  style={{
                    background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))',
                    border: `1px solid ${rcfg.color}25`,
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">
                          {INSP_TYPE_LABELS[insp.type] || insp.type}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: rcfg.bg, color: rcfg.color }}>{rcfg.label}</span>
                        {insp.chemical_exposure && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00' }}>⚗ Química</span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: '#718096' }}>
                        {format(new Date(insp.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })} ·{' '}
                        {eq ? `${eq.tag} — ${eq.name}` : 'Equipamento não encontrado'} ·{' '}
                        {insp.inspector_name || 'Inspetor não informado'}
                      </p>
                      {checkCount > 0 && (
                        <div className="flex gap-2 mt-1 text-[10px]">
                          <span style={{ color: '#00D99A' }}>{checkCount - failCount - warnCount} OK</span>
                          {warnCount > 0 && <span style={{ color: '#E87D00' }}>{warnCount} atenção</span>}
                          {failCount > 0 && <span style={{ color: '#FC5252' }}>{failCount} reprovado</span>}
                        </div>
                      )}
                      {insp.observations && <p className="text-[11px] mt-1 italic" style={{ color: '#718096' }}>{insp.observations}</p>}
                    </div>
                    {(insp.photos || []).length > 0 && (
                      <img src={insp.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
            style={{ background: 'linear-gradient(145deg,rgba(8,14,30,0.99),rgba(5,10,22,1))', border: '1px solid rgba(20,184,212,0.2)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Registro de Inspeção</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-white/40" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Fld label="Equipamento" className="col-span-2">
                <Select value={editing.equipment_id} onValueChange={v => upd('equipment_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar equipamento" /></SelectTrigger>
                  <SelectContent>
                    {equipments.map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.tag} — {eq.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label="Tipo de Inspeção">
                <Select value={editing.type} onValueChange={v => upd('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSP_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label="Data"><Input type="date" value={editing.date} onChange={e => upd('date', e.target.value)} /></Fld>
              <Fld label="Inspetor Responsável" className="col-span-2">
                <Input value={editing.inspector_name} onChange={e => upd('inspector_name', e.target.value)} placeholder="Nome do inspetor" />
              </Fld>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#14B8D4' }}>Checklist de Inspeção</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHECKLIST_ITEMS.map(item => (
                  <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs text-white/70">{item.label}</span>
                    <div className="flex gap-1">
                      {Object.entries(ITEM_STATUS).map(([k, v]) => (
                        <button key={k} onClick={() => updCL(item.key, k)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                          style={{
                            background: editing.checklist?.[item.key] === k ? v.color + '25' : 'rgba(255,255,255,0.04)',
                            color: editing.checklist?.[item.key] === k ? v.color : '#4A5568',
                            border: `1px solid ${editing.checklist?.[item.key] === k ? v.color + '50' : 'transparent'}`,
                          }}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado */}
            <Fld label="Resultado (somente Supervisor N3 pode reprovar)">
              <Select value={editing.result} onValueChange={v => upd('result', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RESULT_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Fld>

            {/* Exposição química */}
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(232,125,0,0.06)', border: '1px solid rgba(232,125,0,0.15)' }}>
              <button onClick={() => upd('chemical_exposure', !editing.chemical_exposure)}
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: editing.chemical_exposure ? '#E87D00' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(232,125,0,0.4)' }}>
                {editing.chemical_exposure && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <span className="text-xs font-semibold" style={{ color: '#E87D00' }}>Houve exposição química</span>
            </div>
            {editing.chemical_exposure && (
              <Fld label="Produtos Químicos">
                <Input value={editing.chemical_products || ''} onChange={e => upd('chemical_products', e.target.value)} placeholder="Ex: Metasil, detergente alcalino..." />
              </Fld>
            )}

            <Fld label="Observações">
              <Input value={editing.observations} onChange={e => upd('observations', e.target.value)} placeholder="Observações técnicas..." />
            </Fld>

            {/* Fotos */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#718096' }}>Fotos da Inspeção</Label>
              <div className="flex flex-wrap gap-2">
                {(editing.photos || []).map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <button onClick={() => upd('photos', editing.photos.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(20,184,212,0.08)', border: '1px dashed rgba(20,184,212,0.3)' }}>
                  <Camera className="w-4 h-4" style={{ color: '#14B8D4' }} />
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Registrar Inspeção'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fld({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>{label}</Label>
      {children}
    </div>
  );
}
