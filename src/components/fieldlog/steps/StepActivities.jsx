import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertTriangle, Upload, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const EQUIPMENT_OPTIONS = [
  'Cadeira suspensa', 'Balancim', 'Cinto paraquedista', 'Capacete', 'Talabarte',
  'Corda de segurança', 'Trava-quedas', 'Roldana', 'Luva de raspa', 'Óculos de proteção',
];

function SubActivityCard({ sub, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className="rounded-xl overflow-hidden mb-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${sub.risk_flagged ? 'rgba(220,55,55,0.30)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: sub.risk_flagged ? 'rgba(220,55,55,0.06)' : 'rgba(255,255,255,0.02)' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          {sub.risk_flagged && <AlertTriangle className="w-4 h-4 text-red-400" />}
          <span className="text-sm font-semibold text-white">{sub.description || 'Nova Sub-atividade'}</span>
          {sub.completion_pct > 0 && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.22)' }}>
              {sub.completion_pct}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="p-1 rounded text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A0AEC0' }}>Descrição</label>
              <Input
                placeholder="Descrição da sub-atividade"
                value={sub.description}
                onChange={e => onChange({ ...sub, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A0AEC0' }}>Seção de Fachada</label>
              <Input
                placeholder="Ex: Fachada Leste – 5º ao 10º"
                value={sub.facade_section}
                onChange={e => onChange({ ...sub, facade_section: e.target.value })}
              />
            </div>
          </div>

          {/* Completion */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A0AEC0' }}>
              Conclusão Parcial: <span style={{ color: '#14B8D4' }}>{sub.completion_pct || 0}%</span>
            </label>
            <div className="relative h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{ width: `${sub.completion_pct || 0}%`, background: 'linear-gradient(90deg, #14B8D4, #00D99A)' }}
              />
              <input
                type="range" min={0} max={100} step={5}
                value={sub.completion_pct || 0}
                onChange={e => onChange({ ...sub, completion_pct: Number(e.target.value) })}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A0AEC0' }}>Observações</label>
            <textarea
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#FFFFFF', minHeight: 64 }}
              placeholder="Notas técnicas, ocorrências..."
              value={sub.notes}
              onChange={e => onChange({ ...sub, notes: e.target.value })}
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A0AEC0' }}>Equipamentos Utilizados</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map(eq => {
                const sel = (sub.equipment || []).includes(eq);
                return (
                  <button
                    key={eq}
                    onClick={() => {
                      const list = sel
                        ? (sub.equipment || []).filter(e => e !== eq)
                        : [...(sub.equipment || []), eq];
                      onChange({ ...sub, equipment: list });
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-150"
                    style={{
                      background: sel ? 'rgba(109,86,232,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${sel ? 'rgba(109,86,232,0.40)' : 'rgba(255,255,255,0.08)'}`,
                      color: sel ? '#A78BFA' : '#718096',
                    }}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk flag */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => onChange({ ...sub, risk_flagged: !sub.risk_flagged })}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                background: sub.risk_flagged ? 'rgba(220,55,55,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${sub.risk_flagged ? 'rgba(220,55,55,0.45)' : 'rgba(255,255,255,0.12)'}`,
                cursor: 'pointer',
              }}
            >
              {sub.risk_flagged && <AlertTriangle className="w-4 h-4 text-red-400" />}
            </div>
            <span className="text-sm" style={{ color: sub.risk_flagged ? '#FC5252' : '#718096' }}>
              ⚠️ Sinalizar ocorrência de risco nesta atividade
            </span>
          </label>

          {/* Photo upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A0AEC0' }}>Fotos</label>
            <label
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.14)', color: '#A0AEC0' }}
            >
              <Upload className="w-4 h-4" />
              Adicionar foto
              <input
                type="file" accept="image/*" capture="environment" className="hidden"
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                  onChange({ ...sub, photos: [...(sub.photos || []), file_url] });
                }}
              />
            </label>
            {(sub.photos || []).length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {sub.photos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.10)' }} />
                    <button
                      onClick={() => onChange({ ...sub, photos: sub.photos.filter((_, j) => j !== i) })}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: '#DC3737', color: '#fff' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StepActivities({ form, patch }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', workspaceId],
    queryFn: () => db.Employee.list(),
    enabled: !!workspaceId,
  });

  const addSubActivity = () => {
    const newSub = {
      id: Date.now().toString(),
      description: '',
      facade_section: '',
      completion_pct: 0,
      notes: '',
      risk_flagged: false,
      equipment: [],
      photos: [],
      timestamp: new Date().toISOString(),
    };
    patch({ sub_activities: [...(form.sub_activities || []), newSub] });
  };

  const updateSub = (id, updated) => {
    patch({ sub_activities: (form.sub_activities || []).map(s => s.id === id ? updated : s) });
  };

  const removeSub = (id) => {
    patch({ sub_activities: (form.sub_activities || []).filter(s => s.id !== id) });
  };

  const toggleWorker = (empId) => {
    const current = form.workers_present || [];
    if (current.includes(empId)) {
      patch({ workers_present: current.filter(id => id !== empId) });
    } else {
      patch({ workers_present: [...current, empId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⚙️</span>
        <div>
          <h2 className="text-white font-bold text-lg">Registro de Atividades</h2>
          <p className="text-xs" style={{ color: '#718096' }}>Documente cada sub-atividade realizada durante o dia</p>
        </div>
      </div>

      {/* Workers present */}
      <div>
        <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>
          Colaboradores Presentes ({(form.workers_present || []).length} selecionados)
        </label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          {employees.filter(e => e.status === 'active').map(emp => {
            const sel = (form.workers_present || []).includes(emp.id);
            return (
              <button
                key={emp.id}
                onClick={() => toggleWorker(emp.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: sel ? 'rgba(0,217,154,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${sel ? 'rgba(0,217,154,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: sel ? '#00D99A' : '#718096',
                }}
              >
                {sel && <CheckCircle2 className="w-3.5 h-3.5" />}
                {emp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-activities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A0AEC0' }}>
            Sub-Atividades ({(form.sub_activities || []).length})
          </label>
          <Button size="sm" onClick={addSubActivity} className="gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </Button>
        </div>

        {(form.sub_activities || []).length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
            onClick={addSubActivity}
          >
            <span className="text-3xl mb-2">⚙️</span>
            <p className="text-sm" style={{ color: '#4A5568' }}>Clique para adicionar a primeira sub-atividade</p>
          </div>
        ) : (
          (form.sub_activities || []).map(sub => (
            <SubActivityCard
              key={sub.id}
              sub={sub}
              onChange={updated => updateSub(sub.id, updated)}
              onRemove={() => removeSub(sub.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
