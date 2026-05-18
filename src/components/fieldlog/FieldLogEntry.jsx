import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useFieldLogServiceMutations } from '@/hooks/services/useFieldLogServiceMutations';
import { Button } from '@/components/ui/button';
import StepWorkdayStart from './steps/StepWorkdayStart';
import StepActivities from './steps/StepActivities';
import StepCloseDay from './steps/StepCloseDay';
import { Save, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

const STEPS = [
  { id: 'start',      label: 'Início',      emoji: '🌅' },
  { id: 'activities', label: 'Atividades',  emoji: '⚙️' },
  { id: 'close',      label: 'Encerrar',    emoji: '🔒' },
];

const defaultLog = {
  date: new Date().toISOString().split('T')[0],
  contract_id: '', activity_id: '', team_id: '', supervisor_id: '',
  location: '', status: 'draft', start_time: '', end_time: '',
  weather: '', geolocation: '',
  nr35_completed: false, anchor_verified: false, ppe_inspected: false, supervisor_confirmed: false,
  workers_present: [], sub_activities: [],
  descidas_realizadas: 0, material_consumption: [],
  total_hours_team: 0, productive_hours: 0, idle_hours: 0,
  weather_impact: false, delay_occurred: false, delay_reason: '',
  incident_occurred: false, incident_description: '',
  supervisor_signature: '', client_signature: '',
  audit_trail: [], approval_status: 'pending', locked: false, stock_committed: false,
};

export default function FieldLogEntry({ log, onSaved, onCancel }) {
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const { saveFieldLog, validateClose } = useFieldLogServiceMutations();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(log ? { ...log } : { ...defaultLog });
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', workspaceId],
    queryFn: () => db.Material.list(),
    staleTime: 30000,
    enabled: !!workspaceId,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', workspaceId],
    queryFn: () => db.Contract.list(),
    staleTime: 30000,
    enabled: !!workspaceId,
  });

  const patch = (updates) => setForm(f => ({ ...f, ...updates }));

  // ── Validations before close ──────────────────────────────────
  const handleValidateClose = () => validateClose(form, { materials, contracts });

  const handleSave = (status = form.status) => {
    setError(null);
    saveFieldLog.mutate({ data: { ...form, status }, isClose: false, materials, contracts }, {
      onSuccess: onSaved,
      onError: (_, message) => setError(message),
    });
  };

  const handleClose = () => {
    setError(null);
    const err = handleValidateClose();
    if (err) { setError(err); return; }
    const canClose = form.nr35_completed && form.anchor_verified && form.ppe_inspected && form.supervisor_confirmed;
    saveFieldLog.mutate({ data: { ...form, status: canClose ? 'closed' : 'open' }, isClose: canClose, materials, contracts }, {
      onSuccess: onSaved,
      onError: (_, message) => setError(message),
    });
  };

  const isLocked = form.locked || form.approval_status === 'approved';
  const canClose = form.nr35_completed && form.anchor_verified && form.ppe_inspected && form.supervisor_confirmed;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setStep(i)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={step === i ? {
                background: 'linear-gradient(135deg, rgba(20,184,212,0.18), rgba(109,86,232,0.12))',
                border: '1px solid rgba(20,184,212,0.35)',
                color: '#14B8D4',
                boxShadow: '0 0 14px rgba(20,184,212,0.15)',
              } : i < step ? {
                background: 'rgba(0,217,154,0.08)',
                border: '1px solid rgba(0,217,154,0.22)',
                color: '#00D99A',
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#4A5568',
              }}
            >
              <span>{s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
              {i < step && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1" style={{ background: i < step ? 'rgba(0,217,154,0.35)' : 'rgba(255,255,255,0.06)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold" style={{ background: 'rgba(220,55,55,0.10)', border: '1px solid rgba(220,55,55,0.30)', color: '#DC3737' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Step content */}
      <div
        className="rounded-2xl p-5 sm:p-6 mb-6"
        style={{
          background: 'linear-gradient(145deg, rgba(10,18,36,0.94) 0%, rgba(6,10,22,0.97) 100%)',
          border: '1px solid rgba(20,184,212,0.10)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {step === 0 && <StepWorkdayStart form={form} patch={patch} />}
        {step === 1 && <StepActivities form={form} patch={patch} />}
        {step === 2 && <StepCloseDay form={form} patch={patch} />}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>

        <div className="flex gap-2">
          {!isLocked && (
            <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saveFieldLog.isPending}>
              <Save className="w-4 h-4 mr-1.5" /> Rascunho
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="gap-1.5">
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            !isLocked && (
              <Button
                onClick={handleClose}
                disabled={saveFieldLog.isPending}
                style={canClose ? {
                  background: 'linear-gradient(135deg, #00D99A, #14B8D4)',
                  color: '#020B0F', fontWeight: 700,
                } : {}}
              >
                {saveFieldLog.isPending ? 'Salvando...' : canClose ? '🔒 Encerrar Dia' : '💾 Salvar em Aberto'}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
