import React from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WEATHER_OPTS = [
  { v: 'sunny', l: '☀️ Ensolarado' }, { v: 'cloudy', l: '☁️ Nublado' },
  { v: 'windy', l: '🌬️ Ventoso' }, { v: 'rain', l: '🌧️ Chuva' }, { v: 'high_risk', l: '⚠️ Alto Risco' },
];

const REPORT_STATUS_CFG = {
  not_started:       { label: 'Não Iniciado',        color: '#718096', bg: 'rgba(113,128,150,0.12)' },
  draft:             { label: 'Rascunho',             color: '#E87D00', bg: 'rgba(232,125,0,0.12)'   },
  filled:            { label: 'Preenchido',           color: '#00D99A', bg: 'rgba(0,217,154,0.12)'   },
  awaiting_approval: { label: 'Ag. Aprovação',        color: '#14B8D4', bg: 'rgba(20,184,212,0.12)'  },
  approved:          { label: 'Aprovado',             color: '#00D99A', bg: 'rgba(0,217,154,0.12)'   },
  rejected:          { label: 'Reprovado',            color: '#DC3737', bg: 'rgba(220,55,55,0.12)'   },
};

function TA({ label, field, form, patch, isLocked, placeholder, rows = 2 }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>{label}</label>
      <textarea className="w-full rounded-xl px-3 py-2 text-sm resize-none"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', minHeight: rows * 28 }}
        placeholder={placeholder} rows={rows}
        value={form[field] || ''} onChange={e => patch({ [field]: e.target.value })} disabled={isLocked} />
    </div>
  );
}

export default function StepReport({ form, patch, isLocked }) {
  const cfg = REPORT_STATUS_CFG[form.report_status] || REPORT_STATUS_CFG.not_started;

  const markFilled = () => patch({ report_status: 'filled' });
  const saveAsDraft = () => patch({ report_status: 'draft' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <div>
            <h2 className="text-white font-bold text-lg">Reporte Diário</h2>
            <p className="text-xs" style={{ color: '#718096' }}>Resumo operacional antes de fechar o apontamento</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
          {cfg.label}
        </span>
      </div>

      {/* Execution */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(20,184,212,0.03)', border: '1px solid rgba(20,184,212,0.12)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#14B8D4' }}>📊 Execução</p>
        <TA label="O que foi realizado hoje?" field="report_what_was_done" form={form} patch={patch} isLocked={isLocked} placeholder="Descreva as atividades executadas..." rows={3} />
        <TA label="Qual foi o avanço da atividade?" field="report_progress" form={form} patch={patch} isLocked={isLocked} placeholder="Ex: 60% concluído — fachada norte finalizada" />

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Progresso (%)</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${form.progress || 0}%`, background: 'linear-gradient(90deg,#14B8D4,#00D99A)' }} />
              <input type="range" min={0} max={100} step={5} value={form.progress || 0}
                onChange={e => patch({ progress: Number(e.target.value) })}
                disabled={isLocked} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
            <span className="text-sm font-bold w-10 text-right" style={{ color: '#14B8D4' }}>{form.progress || 0}%</span>
          </div>
        </div>
      </div>

      {/* Occurrences */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(220,55,55,0.03)', border: '1px solid rgba(220,55,55,0.12)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#DC3737' }}>⚠️ Ocorrências</p>
        <TA label="Impedimentos" field="report_impediments" form={form} patch={patch} isLocked={isLocked} placeholder="Houve algum impedimento?" />
        <TA label="Riscos / Desvios" field="report_risks" form={form} patch={patch} isLocked={isLocked} placeholder="Riscos identificados, desvios, atrasos..." />
        <TA label="Incidentes de Campo" field="report_incidents" form={form} patch={patch} isLocked={isLocked} placeholder="Descreva qualquer incidente..." />

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => !isLocked && patch({ report_rework: !form.report_rework })}
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: form.report_rework ? 'rgba(220,55,55,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.report_rework ? 'rgba(220,55,55,0.45)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
              {form.report_rework && <span className="text-red-400 text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm" style={{ color: form.report_rework ? '#FC5252' : '#718096' }}>
              Houve necessidade de retrabalho
            </span>
          </label>
        </div>
      </div>

      {/* Resources */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(109,86,232,0.03)', border: '1px solid rgba(109,86,232,0.12)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6D56E8' }}>🔧 Recursos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TA label="Materiais Utilizados" field="report_materials" form={form} patch={patch} isLocked={isLocked} placeholder="Liste materiais..." />
          <TA label="Equipamentos Utilizados" field="report_equipment" form={form} patch={patch} isLocked={isLocked} placeholder="Liste equipamentos..." />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A0AEC0' }}>Condição Climática</label>
          <div className="flex gap-2 flex-wrap">
            {WEATHER_OPTS.map(w => (
              <button key={w.v} onClick={() => !isLocked && patch({ report_weather: w.v })}
                disabled={isLocked}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={form.report_weather === w.v
                  ? { background: 'rgba(20,184,212,0.18)', border: '1px solid rgba(20,184,212,0.40)', color: '#14B8D4' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }
                }>{w.l}</button>
            ))}
          </div>
        </div>

        <TA label="Condição de Segurança" field="report_safety_condition" form={form} patch={patch} isLocked={isLocked} placeholder="EPIs, condições gerais..." />
      </div>

      {/* Observations & next steps */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,217,154,0.03)', border: '1px solid rgba(0,217,154,0.12)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00D99A' }}>📋 Próximos Passos</p>
        <TA label="Observações do Colaborador" field="report_worker_observations" form={form} patch={patch} isLocked={isLocked} placeholder="Observações pessoais..." />
        <TA label="Observações do Responsável" field="report_responsible_observations" form={form} patch={patch} isLocked={isLocked} placeholder="Comentários do responsável..." />
        <TA label="Pendências para o Próximo Dia" field="report_pending_items" form={form} patch={patch} isLocked={isLocked} placeholder="O que fica pendente?" />
        <TA label="Próxima Ação Recomendada" field="report_next_action" form={form} patch={patch} isLocked={isLocked} placeholder="Ex: continuar fachada leste, aguardar materiais..." />
      </div>

      {!isLocked && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={saveAsDraft} className="gap-1.5 flex-1">
            <Save className="w-4 h-4" /> Salvar Rascunho
          </Button>
          <Button onClick={markFilled} className="gap-1.5 flex-1"
            style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B0F', fontWeight: 700 }}>
            <CheckCircle2 className="w-4 h-4" /> Reporte Preenchido
          </Button>
        </div>
      )}
    </div>
  );
}