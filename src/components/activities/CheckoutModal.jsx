import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, StopCircle, Camera, X, Plus, Minus, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CheckoutVisualStep from '@/components/operationalmap/CheckoutVisualStep';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHECKLIST_FIM = [
  { id: 'area_limpa', label: 'Área limpa e organizada' },
  { id: 'epi_recolhido', label: 'EPIs recolhidos e armazenados' },
  { id: 'equipamentos_guardados', label: 'Equipamentos guardados' },
];

export default function CheckoutModal({ open, onClose, onConfirm, session, activity, materials = [], loading, checkinMap }) {
  const [descidas, setDescidas] = useState(session?.descidas_realizadas || 0);
  const [observacoes, setObservacoes] = useState(session?.observacoes || '');
  const [checked, setChecked] = useState({});
  const [mats, setMats] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [visualMap, setVisualMap] = useState(null);
  // Novos campos de check-out
  const [executedArea, setExecutedArea] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [checkoutPhotos, setCheckoutPhotos] = useState([]);
  const [uploadingCheckoutPhoto, setUploadingCheckoutPhoto] = useState(false);
  const checkoutPhotoRef = useRef();
  const fileRef = useRef();

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const allChecked = CHECKLIST_FIM.every(i => checked[i.id]);

  const addMat = () => setMats(prev => [...prev, { material_id: '', material_name: '', quantity: 1 }]);
  const removeMat = (idx) => setMats(prev => prev.filter((_, i) => i !== idx));
  const updMat = (idx, field, val) => setMats(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFotos(prev => [...prev, file_url]);
    setUploadingFoto(false);
  };

  const handleCheckoutPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCheckoutPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCheckoutPhotos(prev => [...prev, file_url]);
    setUploadingCheckoutPhoto(false);
  };

  const needsJustificativa = executionStatus === 'partial' || executionStatus === 'not_completed';
  const canConfirm = allChecked && fotos.length > 0 && executionStatus !== '' && (!needsJustificativa || justificativa.trim() !== '');

  const handleConfirm = () => {
    onConfirm({
      descidas_realizadas: descidas,
      observacoes,
      checklist_fim: checked,
      materiais_utilizados: mats,
      fotos_depois: fotos,
      visual_checkout_map: visualMap,
      // Novos campos — adicionais, não sobrescrevem nada existente
      executed_area: executedArea,
      execution_status: executionStatus,
      execution_justificativa: needsJustificativa ? justificativa : null,
      checkout_photos: checkoutPhotos,
    });
  };

  const handleClose = () => {
    setChecked({});
    setMats([]);
    setFotos([]);
    setObservacoes('');
    setVisualMap(null);
    setExecutedArea(null);
    setExecutionStatus('');
    setJustificativa('');
    setCheckoutPhotos([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StopCircle className="w-5 h-5" style={{ color: '#14B8D4' }} />
            Check-out — Finalizar Atividade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Descidas */}
          <div>
            <Label className="text-xs">Quantidade de Descidas Realizadas</Label>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => setDescidas(d => Math.max(0, d - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Minus className="w-3.5 h-3.5" style={{ color: '#A0AEC0' }} />
              </button>
              <span className="text-2xl font-bold w-12 text-center text-white">{descidas}</span>
              <button onClick={() => setDescidas(d => d + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(20,184,212,0.12)', border: '1px solid rgba(20,184,212,0.30)' }}>
                <Plus className="w-3.5 h-3.5" style={{ color: '#14B8D4' }} />
              </button>
              {activity?.descents_planned > 0 && (
                <span className="text-xs ml-1" style={{ color: '#718096' }}>
                  de {activity.descents_planned} previstas
                </span>
              )}
            </div>
          </div>

          {/* Materiais */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Materiais Utilizados</Label>
              <button onClick={addMat} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                style={{ color: '#14B8D4', background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.22)' }}>
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            {mats.length === 0 && <p className="text-xs py-2" style={{ color: '#4A5568' }}>Nenhum material registrado</p>}
            <div className="space-y-2">
              {mats.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="flex-1 h-8 rounded-lg px-2 text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
                    value={m.material_id}
                    onChange={e => {
                      const mat = materials.find(x => x.id === e.target.value);
                      updMat(idx, 'material_id', e.target.value);
                      updMat(idx, 'material_name', mat?.name || '');
                    }}
                  >
                    <option value="">Selecione</option>
                    {materials.map(mat => <option key={mat.id} value={mat.id}>{mat.name}</option>)}
                  </select>
                  <Input
                    type="number" min={1} value={m.quantity} className="w-20 h-8 text-xs"
                    onChange={e => updMat(idx, 'quantity', Number(e.target.value))}
                  />
                  <button onClick={() => removeMat(idx)} className="p-1.5 rounded-lg" style={{ color: '#DC3737' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Fotos */}
          <div>
            <Label className="text-xs">Fotos Finais <span style={{ color: '#DC3737' }}>*</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {fotos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(220,55,55,0.90)' }}>
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                className="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                <Camera className="w-4 h-4" style={{ color: '#718096' }} />
                <span className="text-[9px]" style={{ color: '#4A5568' }}>{uploadingFoto ? '...' : 'Foto'}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea className="mt-1.5 resize-none" rows={2} placeholder="Observações gerais da execução..."
              value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          </div>

          {/* Mapa visual check-out (opcional) — existente, sem alteração */}
          <CheckoutVisualStep
            checkinMap={checkinMap}
            onMapSaved={(map) => setVisualMap(map)}
            onSkip={() => setVisualMap(null)}
          />

          {/* ── NOVOS CAMPOS DE CHECK-OUT ── */}

          {/* Demarcação de área executada */}
          <div>
            <Label className="text-xs">Área Executada (opcional)</Label>
            <p className="text-[11px] mt-0.5 mb-2" style={{ color: '#4A5568' }}>
              Descreva ou registre a área que foi efetivamente executada nesta sessão.
            </p>
            <Textarea
              className="resize-none"
              rows={2}
              placeholder="Ex: Fachada norte, blocos 3 e 4, andares 5 a 8..."
              value={executedArea || ''}
              onChange={e => setExecutedArea(e.target.value || null)}
            />
          </div>

          {/* Status de execução */}
          <div>
            <Label className="text-xs">Status de Execução <span style={{ color: '#DC3737' }}>*</span></Label>
            <Select value={executionStatus} onValueChange={setExecutionStatus}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione o grau de conclusão..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">✅ Concluído (100%)</SelectItem>
                <SelectItem value="partial">⚠️ Parcial</SelectItem>
                <SelectItem value="not_completed">❌ Não executado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Justificativa — condicional */}
          {needsJustificativa && (
            <div>
              <Label className="text-xs">
                Justificativa <span style={{ color: '#DC3737' }}>*</span>
              </Label>
              <p className="text-[11px] mt-0.5 mb-1.5" style={{ color: '#718096' }}>
                Obrigatório para execução parcial ou não executada.
              </p>
              <Textarea
                className="resize-none"
                rows={3}
                placeholder="Descreva o motivo da execução incompleta..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
              />
            </div>
          )}

          {/* Fotos de evidência do check-out */}
          <div>
            <Label className="text-xs">Fotos de Evidência do Check-out (opcional)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {checkoutPhotos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(109,86,232,0.30)' }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setCheckoutPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(220,55,55,0.90)' }}>
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              <button onClick={() => checkoutPhotoRef.current?.click()}
                disabled={uploadingCheckoutPhoto}
                className="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all"
                style={{ background: 'rgba(109,86,232,0.06)', border: '1px dashed rgba(109,86,232,0.30)' }}>
                <MapPin className="w-4 h-4" style={{ color: '#6D56E8' }} />
                <span className="text-[9px]" style={{ color: '#6D56E8' }}>{uploadingCheckoutPhoto ? '...' : 'Foto'}</span>
              </button>
              <input ref={checkoutPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleCheckoutPhoto} />
            </div>
          </div>

          {/* Checklist final */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#718096' }}>
              Checklist de encerramento
            </p>
            <div className="space-y-2">
              {CHECKLIST_FIM.map(item => (
                <button key={item.id} onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: checked[item.id] ? 'rgba(0,217,154,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${checked[item.id] ? 'rgba(0,217,154,0.30)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  {checked[item.id]
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
                    : <Circle className="w-4 h-4 shrink-0" style={{ color: '#4A5568' }} />
                  }
                  <span className="text-sm" style={{ color: checked[item.id] ? '#E2E8F0' : '#A0AEC0' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
              className="flex-1 gap-2 font-bold"
              style={{ background: canConfirm ? 'linear-gradient(135deg,#14B8D4,#6D56E8)' : undefined, color: '#020B14' }}
            >
              <StopCircle className="w-4 h-4" />
              {loading ? 'Finalizando...' : 'Finalizar'}
            </Button>
          </div>
          {!canConfirm && (
            <p className="text-[11px] text-center" style={{ color: '#4A5568' }}>
              {fotos.length === 0 ? 'Adicione ao menos uma foto final · ' : ''}
              {!allChecked ? 'Complete o checklist · ' : ''}
              {executionStatus === '' ? 'Selecione o status de execução' : ''}
              {needsJustificativa && justificativa.trim() === '' ? ' · Informe a justificativa' : ''}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}