import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Plus, X, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { employeeService } from '@/services/employeeService';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';

const CHECKLIST_ITEMS_DEF = [
  { key: 'cinto_ok', label: 'Cinto de Segurança inspecionado', icon: '🦺' },
  { key: 'talabarte_ok', label: 'Talabarte sem danos', icon: '🔗' },
  { key: 'capacete_ok', label: 'Capacete em bom estado', icon: '⛑️' },
  { key: 'luvas_ok', label: 'Luvas adequadas', icon: '🧤' },
  { key: 'oculos_ok', label: 'Óculos de proteção', icon: '🥽' },
  { key: 'corda_ok', label: 'Corda inspecionada e sem danos', icon: '🪢' },
  { key: 'conectores_ok', label: 'Conectores funcionando', icon: '🔩' },
  { key: 'descensor_ok', label: 'Descensor testado', icon: '⬇️' },
  { key: 'ponto_ancoragem_ok', label: 'Ponto de ancoragem verificado', icon: '⚓' },
  { key: 'area_isolada_ok', label: 'Área isolada / sinalizada', icon: '🚧' },
  { key: 'condicao_climatica_ok', label: 'Condição climática favorável', icon: '🌤️' },
  { key: 'nr35_briefing_ok', label: 'Briefing NR35 realizado', icon: '📋' },
];

const EMPTY_CL = {
  type: 'pre_uso',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  items: {},
  chemical_products: '',
  observations: '',
  photos: [],
  result: 'aprovado',
};

export default function EmployeeChecklistTab({ employee, checklists, db, workspaceId, onRefresh }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const invalidate = () => {
    invalidateWorkspaceQueries(qc, workspaceId, [['checklists', workspaceId, employee.id]]);
    onRefresh();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...editing, employee_id: employee.id, workspace_id: workspaceId };
      await employeeService.saveChecklist(db, { employeeId: employee.id, workspaceId, data });
      toast.success('Checklist salvo!');
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
  const updItem = (k) => setEditing(prev => ({ ...prev, items: { ...prev.items, [k]: !prev.items?.[k] } }));

  const allChecked = editing ? CHECKLIST_ITEMS_DEF.every(i => editing.items?.[i.key]) : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Checklists Pré-Uso</h3>
          <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{checklists.length} checklist(s) registrado(s)</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8" onClick={() => setEditing({ ...EMPTY_CL, _isNew: true })}>
          <Plus className="w-3.5 h-3.5" /> Novo Checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <div className="py-12 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-white/30 mb-3">Nenhum checklist registrado</p>
          <Button size="sm" variant="outline" onClick={() => setEditing({ ...EMPTY_CL, _isNew: true })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Criar Checklist Pré-Uso
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {checklists.sort((a, b) => new Date(b.date) - new Date(a.date)).map(cl => {
            const totalItems = CHECKLIST_ITEMS_DEF.length;
            const checkedItems = CHECKLIST_ITEMS_DEF.filter(i => cl.items?.[i.key]).length;
            const pct = Math.round((checkedItems / totalItems) * 100);
            return (
              <div key={cl.id} className="rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setEditing({ ...cl })}
                style={{
                  background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))',
                  border: `1px solid ${pct === 100 ? 'rgba(0,217,154,0.2)' : pct >= 75 ? 'rgba(232,125,0,0.2)' : 'rgba(252,82,82,0.2)'}`,
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">
                        {cl.type === 'pre_uso' ? 'Pré-Uso' : cl.type === 'pos_uso' ? 'Pós-Uso' : 'Inspeção Campo'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: pct === 100 ? 'rgba(0,217,154,0.12)' : 'rgba(252,82,82,0.12)',
                          color: pct === 100 ? '#00D99A' : '#FC5252',
                        }}>
                        {checkedItems}/{totalItems} itens
                      </span>
                      {cl.chemical_products && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00' }}>⚗ Química</span>
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: '#718096' }}>
                      {format(new Date(cl.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      {cl.time ? ` às ${cl.time}` : ''}
                    </p>
                    {cl.chemical_products && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#E87D00' }}>Produtos: {cl.chemical_products}</p>
                    )}
                    {cl.observations && (
                      <p className="text-[11px] mt-0.5 italic" style={{ color: '#718096' }}>{cl.observations}</p>
                    )}
                  </div>
                  <div className="text-center ml-3">
                    <span className="text-lg font-black" style={{ color: pct === 100 ? '#00D99A' : pct >= 75 ? '#E87D00' : '#FC5252' }}>{pct}%</span>
                    <p className="text-[8px]" style={{ color: '#4A5568' }}>COMPLETO</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? '#00D99A' : pct >= 75 ? '#E87D00' : '#FC5252',
                    }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
            style={{ background: 'linear-gradient(145deg,rgba(8,14,30,0.99),rgba(5,10,22,1))', border: '1px solid rgba(20,184,212,0.2)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Checklist Pré-Uso</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-white/40" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>Tipo</Label>
                <Select value={editing.type} onValueChange={v => upd('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_uso">Pré-Uso</SelectItem>
                    <SelectItem value="pos_uso">Pós-Uso</SelectItem>
                    <SelectItem value="inspecao_campo">Inspeção de Campo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>Data</Label>
                <Input type="date" value={editing.date} onChange={e => upd('date', e.target.value)} />
              </div>
            </div>

            {/* Itens */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#14B8D4' }}>Itens do Checklist</p>
                <button onClick={() => {
                  const allTrue = CHECKLIST_ITEMS_DEF.every(i => editing.items?.[i.key]);
                  const newItems = {};
                  CHECKLIST_ITEMS_DEF.forEach(i => { newItems[i.key] = !allTrue; });
                  upd('items', newItems);
                }} className="text-[10px] font-bold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(20,184,212,0.1)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.2)' }}>
                  {allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>
              <div className="space-y-2">
                {CHECKLIST_ITEMS_DEF.map(item => (
                  <button key={item.key} onClick={() => updItem(item.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: editing.items?.[item.key] ? 'rgba(0,217,154,0.07)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${editing.items?.[item.key] ? 'rgba(0,217,154,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-xs font-medium" style={{ color: editing.items?.[item.key] ? '#FFFFFF' : '#718096' }}>
                      {item.label}
                    </span>
                    {editing.items?.[item.key]
                      ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
                      : <XCircle className="w-4 h-4 shrink-0 opacity-30" style={{ color: '#FC5252' }} />
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Química */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#E87D00' }}>Produtos Químicos a Utilizar</Label>
              <Input value={editing.chemical_products} onChange={e => upd('chemical_products', e.target.value)}
                placeholder="Ex: Metasil, detergente alcalino, ácido..." />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>Observações</Label>
              <Input value={editing.observations} onChange={e => upd('observations', e.target.value)} placeholder="Observações gerais" />
            </div>

            {/* Fotos */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#718096' }}>Fotos (opcional)</Label>
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
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Checklist'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
