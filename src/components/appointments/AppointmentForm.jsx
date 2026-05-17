import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppointmentServiceMutations } from '@/hooks/services/useAppointmentServiceMutations';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import StepStart from './steps/StepStart';
import StepPhotos from './steps/StepPhotos';
import StepReport from './steps/StepReport';
import StepClose from './steps/StepClose';

const STEPS = [
  { id: 'start',  label: 'Início',   emoji: '🌅' },
  { id: 'photos', label: 'Fotos',    emoji: '📷' },
  { id: 'report', label: 'Reporte',  emoji: '📝' },
  { id: 'close',  label: 'Fechar',   emoji: '🔒' },
];

const DEFAULT = {
  date: new Date().toISOString().split('T')[0],
  contract_id: '', activity_id: '', employee_id: '', employee_name: '', employee_role: '',
  team_id: '', area_id: '', location: '',
  start_time: '', end_time: '', total_hours: 0,
  status: 'not_started', progress: 0,
  initial_condition: '', initial_observation: '',
  photos_before: [], photos_after: [], photos_during: [],
  report_what_was_done: '', report_progress: '', report_impediments: '',
  report_risks: '', report_rework: false, report_materials: '', report_equipment: '',
  report_weather: '', report_safety_condition: '', report_incidents: '',
  report_worker_observations: '', report_responsible_observations: '',
  report_next_action: '', report_pending_items: '', report_status: 'not_started',
  final_description: '', production_qty: 0, production_unit: '',
  final_situation: '', pending_items: '', incidents: '',
  signature_worker: '', signature_responsible: '', signature_supervisor: '', signature_client: '',
  approval_status: 'pending', locked: false, audit_trail: [],
};

export default function AppointmentForm({ appointment, onSaved, onCancel }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(appointment ? { ...appointment } : { ...DEFAULT });
  const [error, setError] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), staleTime: Infinity });
  const { saveAppointment } = useAppointmentServiceMutations({ user });

  const patch = updates => setForm(f => ({ ...f, ...updates }));

  const handleSave = (isDraft = true) => {
    setError(null);
    saveAppointment.mutate({ data: form, isDraft }, {
      onSuccess: onSaved,
      onError: (_, message) => setError(message),
    });
  };

  const isLocked = form.locked || form.approval_status === 'approved';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step bar */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button onClick={() => setStep(i)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={step === i
                ? { background: 'linear-gradient(135deg,rgba(20,184,212,0.18),rgba(109,86,232,0.12))', border: '1px solid rgba(20,184,212,0.35)', color: '#14B8D4', boxShadow: '0 0 14px rgba(20,184,212,0.15)' }
                : i < step
                  ? { background: 'rgba(0,217,154,0.08)', border: '1px solid rgba(0,217,154,0.22)', color: '#00D99A' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#4A5568' }
              }
            >
              <span>{s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
              {i < step && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
            {i < STEPS.length - 1 && <div className="flex-1 h-px mx-1" style={{ background: i < step ? 'rgba(0,217,154,0.35)' : 'rgba(255,255,255,0.06)' }} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold" style={{ background: 'rgba(220,55,55,0.10)', border: '1px solid rgba(220,55,55,0.30)', color: '#DC3737' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-2xl p-5 sm:p-6 mb-6"
        style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.94),rgba(6,10,22,0.97))', border: '1px solid rgba(20,184,212,0.10)', boxShadow: '0 8px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        {step === 0 && <StepStart form={form} patch={patch} isLocked={isLocked} />}
        {step === 1 && <StepPhotos form={form} patch={patch} isLocked={isLocked} />}
        {step === 2 && <StepReport form={form} patch={patch} isLocked={isLocked} />}
        {step === 3 && <StepClose form={form} patch={patch} isLocked={isLocked} />}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Anterior</Button>}
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
        <div className="flex gap-2">
          {!isLocked && <Button variant="secondary" onClick={() => handleSave(true)} disabled={saveAppointment.isPending}><Save className="w-4 h-4 mr-1.5" /> Rascunho</Button>}
          {step < STEPS.length - 1
            ? <Button onClick={() => setStep(s => s + 1)} className="gap-1.5">Próximo <ChevronRight className="w-4 h-4" /></Button>
            : !isLocked && <Button onClick={() => handleSave(false)} disabled={saveAppointment.isPending}
                style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B0F', fontWeight: 700 }}>
                {saveAppointment.isPending ? 'Salvando...' : '🔒 Finalizar Apontamento'}
              </Button>
          }
        </div>
      </div>
    </div>
  );
}
