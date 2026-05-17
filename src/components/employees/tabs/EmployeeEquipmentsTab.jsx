import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, X, Camera, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { differenceInDays } from 'date-fns';
import { employeeService } from '@/services/employeeService';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';

const EQ_TYPES = [
  { value: 'cinto', label: 'Cinto de Segurança' },
  { value: 'talabarte', label: 'Talabarte' },
  { value: 'descensor', label: 'Descensor / Freio' },
  { value: 'ascensor', label: 'Ascensor / Bloqueador' },
  { value: 'travaQuedas', label: 'Trava Quedas' },
  { value: 'capacete', label: 'Capacete' },
  { value: 'conector', label: 'Conector / Mosquetão' },
  { value: 'polia', label: 'Polia' },
  { value: 'corda', label: 'Corda' },
  { value: 'absorvedorEnergia', label: 'Absorvedor de Energia' },
  { value: 'mosquetao', label: 'Mosquetão' },
  { value: 'epi_outro', label: 'Outro EPI' },
];

const STATUS_CFG = {
  normal: { label: 'Normal', color: '#00D99A', bg: 'rgba(0,217,154,0.10)' },
  observacao: { label: 'Observação', color: '#E87D00', bg: 'rgba(232,125,0,0.10)' },
  revisao_n3: { label: 'Revisão N3', color: '#6D56E8', bg: 'rgba(109,86,232,0.10)' },
  bloqueado: { label: 'Bloqueado', color: '#FC5252', bg: 'rgba(252,82,82,0.10)' },
  descartado: { label: 'Descartado', color: '#4A5568', bg: 'rgba(74,85,104,0.10)' },
};

const EMPTY_EQ = {
  tag: '', type: 'cinto', name: '', manufacturer: '', model: '', batch: '',
  ca_number: '', serial_number: '', manufacture_date: '', delivery_date: '',
  expiry_date: '', status: 'normal', observations: '', inspection_interval_days: 90,
};

export default function EmployeeEquipmentsTab({ employee, equipments, db, workspaceId, onRefresh }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const invalidate = () => {
    invalidateWorkspaceQueries(qc, workspaceId, [
      ['equipments', workspaceId, employee.id],
      ['equipments', workspaceId, 'all'],
    ]);
    onRefresh();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...editing,
        employee_id: employee.id,
        workspace_id: workspaceId,
      };
      await employeeService.saveEquipment(db, { employeeId: employee.id, workspaceId, data });
      toast.success('Equipamento salvo!');
      setEditing(null);
      invalidate();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditing(prev => ({ ...prev, photos: [...(prev.photos || []), file_url] }));
    } catch { toast.error('Erro ao enviar foto'); }
    setUploadingPhoto(false);
  };

  const upd = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));

  const filtered = filterStatus === 'all' ? equipments : equipments.filter(e => e.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Equipamentos Vinculados</h3>
          <p className="text-xs mt-0.5" style={{ color: '#718096' }}>{equipments.length} equipamento(s)</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setEditing({ ...EMPTY_EQ, _isNew: true })}>
            <Plus className="w-3.5 h-3.5" /> Novo
          </Button>
        </div>
      </div>

      {/* Resumo status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(STATUS_CFG).slice(0, 4).map(([k, v]) => {
          const count = equipments.filter(e => e.status === k).length;
          return (
            <div key={k} className="rounded-xl p-3 text-center cursor-pointer"
              onClick={() => setFilterStatus(k === filterStatus ? 'all' : k)}
              style={{ background: filterStatus === k ? v.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${filterStatus === k ? v.color + '40' : 'rgba(255,255,255,0.06)'}` }}>
              <p className="text-lg font-black" style={{ color: v.color }}>{count}</p>
              <p className="text-[10px] font-semibold" style={{ color: '#718096' }}>{v.label}</p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-white/30 mb-3">Nenhum equipamento encontrado</p>
          <Button size="sm" variant="outline" onClick={() => setEditing({ ...EMPTY_EQ, _isNew: true })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Equipamento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(eq => {
            const cfg = STATUS_CFG[eq.status] || STATUS_CFG.normal;
            const daysToExpiry = eq.expiry_date ? differenceInDays(new Date(eq.expiry_date), new Date()) : null;
            const daysToInsp = eq.next_inspection_date ? differenceInDays(new Date(eq.next_inspection_date), new Date()) : null;
            return (
              <div key={eq.id} className="rounded-xl p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setEditing({ ...eq })}
                style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: `1px solid ${cfg.color}25` }}>
                <div className="flex items-start gap-3">
                  {eq.photos?.[0] ? (
                    <img src={eq.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                      <Package className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(20,184,212,0.1)', color: '#14B8D4' }}>{eq.tag}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{eq.name}</p>
                    <p className="text-[11px]" style={{ color: '#718096' }}>
                      {EQ_TYPES.find(t => t.value === eq.type)?.label || eq.type}
                      {eq.manufacturer ? ` · ${eq.manufacturer}` : ''}
                    </p>
                    {daysToExpiry !== null && (
                      <p className="text-[10px] mt-1 font-semibold"
                        style={{ color: daysToExpiry < 0 ? '#FC5252' : daysToExpiry < 30 ? '#E87D00' : '#00D99A' }}>
                        {daysToExpiry < 0 ? `Vencido há ${Math.abs(daysToExpiry)}d` : `Vence em ${daysToExpiry}d`}
                      </p>
                    )}
                    {daysToInsp !== null && daysToInsp <= 7 && (
                      <p className="text-[10px] mt-0.5 font-semibold" style={{ color: '#E87D00' }}>
                        Inspeção: {daysToInsp <= 0 ? 'PENDENTE' : `em ${daysToInsp}d`}
                      </p>
                    )}
                  </div>
                  <div className="text-center shrink-0">
                    <span className="text-lg font-black" style={{ color: eq.operational_score >= 80 ? '#00D99A' : eq.operational_score >= 60 ? '#E87D00' : '#FC5252' }}>
                      {eq.operational_score ?? 100}
                    </span>
                    <p className="text-[8px]" style={{ color: '#4A5568' }}>SCORE</p>
                  </div>
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
              <h3 className="text-sm font-bold text-white">{editing._isNew ? 'Novo Equipamento' : 'Editar Equipamento'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-white/40" /></button>
            </div>

            {/* Status Alert */}
            {editing.status === 'revisao_n3' && (
              <div className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(109,86,232,0.08)', border: '1px solid rgba(109,86,232,0.25)' }}>
                <Shield className="w-4 h-4 mt-0.5" style={{ color: '#6D56E8' }} />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Status <strong style={{ color: '#6D56E8' }}>Revisão N3</strong>: Este equipamento requer avaliação do Supervisor N3 antes de uso.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Fld label="TAG"><Input value={editing.tag} onChange={e => upd('tag', e.target.value)} placeholder="TAG-001" /></Fld>
              <Fld label="Tipo">
                <Select value={editing.type} onValueChange={v => upd('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EQ_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </Fld>
              <Fld label="Nome / Descrição"><Input value={editing.name} onChange={e => upd('name', e.target.value)} /></Fld>
              <Fld label="Fabricante"><Input value={editing.manufacturer} onChange={e => upd('manufacturer', e.target.value)} /></Fld>
              <Fld label="Modelo"><Input value={editing.model} onChange={e => upd('model', e.target.value)} /></Fld>
              <Fld label="Nº Série"><Input value={editing.serial_number} onChange={e => upd('serial_number', e.target.value)} /></Fld>
              <Fld label="Lote"><Input value={editing.batch} onChange={e => upd('batch', e.target.value)} /></Fld>
              <Fld label="CA (Cert. Aprovação)"><Input value={editing.ca_number} onChange={e => upd('ca_number', e.target.value)} /></Fld>
              <Fld label="Data Fabricação"><Input type="date" value={editing.manufacture_date} onChange={e => upd('manufacture_date', e.target.value)} /></Fld>
              <Fld label="Data Entrega"><Input type="date" value={editing.delivery_date} onChange={e => upd('delivery_date', e.target.value)} /></Fld>
              <Fld label="Validade"><Input type="date" value={editing.expiry_date} onChange={e => upd('expiry_date', e.target.value)} /></Fld>
              <Fld label="Próxima Inspeção"><Input type="date" value={editing.next_inspection_date || ''} onChange={e => upd('next_inspection_date', e.target.value)} /></Fld>
              <Fld label="Status Operacional">
                <Select value={editing.status} onValueChange={v => upd('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Fld>
              <Fld label="Score (0-100)"><Input type="number" min={0} max={100} value={editing.operational_score ?? 100} onChange={e => upd('operational_score', +e.target.value)} /></Fld>
              <Fld label="Observações" className="col-span-2">
                <Input value={editing.observations || ''} onChange={e => upd('observations', e.target.value)} />
              </Fld>
            </div>

            {/* Fotos */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: '#718096' }}>Fotos</Label>
              <div className="flex flex-wrap gap-2">
                {(editing.photos || []).map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <button onClick={() => upd('photos', (editing.photos || []).filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(20,184,212,0.08)', border: '1px dashed rgba(20,184,212,0.3)' }}>
                  <Camera className="w-5 h-5" style={{ color: '#14B8D4' }} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Equipamento'}</Button>
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
