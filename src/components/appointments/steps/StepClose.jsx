import React from 'react';
import { Input } from '@/components/ui/input';
import { Clock, AlertTriangle, CheckCircle2, PenTool } from 'lucide-react';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>{label}</label>
      {children}
    </div>
  );
}

export default function StepClose({ form, patch, isLocked }) {
  const onEndTime = v => {
    if (form.start_time && v) {
      const [sh, sm] = form.start_time.split(':').map(Number);
      const [eh, em] = v.split(':').map(Number);
      const h = Math.max(0, +((eh * 60 + em - sh * 60 - sm) / 60).toFixed(2));
      patch({ end_time: v, total_hours: h });
    } else {
      patch({ end_time: v });
    }
  };

  const hasBefore  = (form.photos_before || []).length > 0;
  const hasAfter   = (form.photos_after  || []).length > 0;
  const hasReport  = form.report_status === 'filled' || form.report_status === 'approved';
  const hasEndTime = !!form.end_time;

  const checks = [
    { ok: hasBefore,  label: 'Foto "Antes" anexada' },
    { ok: hasAfter,   label: 'Foto "Depois" anexada' },
    { ok: hasReport,  label: 'Reporte diário preenchido' },
    { ok: hasEndTime, label: 'Horário de término informado' },
  ];
  const allOk = checks.every(c => c.ok);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🔒</span>
        <div>
          <h2 className="text-white font-bold text-lg">Encerramento do Apontamento</h2>
          <p className="text-xs" style={{ color: '#718096' }}>Confirme as informações finais e colete assinaturas</p>
        </div>
      </div>

      {/* Checklist de encerramento */}
      <div className="rounded-2xl p-4" style={{ background: allOk ? 'rgba(0,217,154,0.05)' : 'rgba(220,55,55,0.05)', border: `1px solid ${allOk ? 'rgba(0,217,154,0.22)' : 'rgba(220,55,55,0.22)'}` }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: allOk ? '#00D99A' : '#DC3737' }}>
          {allOk ? '✅ Pronto para encerrar' : '⚠️ Pendências antes de encerrar'}
        </p>
        <div className="space-y-2">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {c.ok
                ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
                : <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#DC3737' }} />
              }
              <span style={{ color: c.ok ? '#A0AEC0' : '#DC3737' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horário */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
            <Input type="time" value={form.start_time || ''} readOnly className="pl-9 opacity-50" />
          </div>
        </Field>
        <Field label="Término *">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#14B8D4' }} />
            <Input type="time" value={form.end_time || ''} onChange={e => onEndTime(e.target.value)} className="pl-9" disabled={isLocked} />
          </div>
        </Field>
      </div>
      {form.total_hours > 0 && (
        <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#00D99A' }}>
          <CheckCircle2 className="w-4 h-4" /> {form.total_hours}h registradas
        </p>
      )}

      {/* Produção */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(20,184,212,0.04)', border: '1px solid rgba(20,184,212,0.14)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#14B8D4' }}>📊 Produção Realizada</p>
        <Field label="Descrição da Execução">
          <textarea className="w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
            placeholder="O que foi executado neste apontamento..."
            value={form.final_description || ''} onChange={e => patch({ final_description: e.target.value })} disabled={isLocked} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantidade Realizada">
            <Input type="number" min={0} value={form.production_qty || ''} onChange={e => patch({ production_qty: Number(e.target.value) })} placeholder="0" disabled={isLocked} />
          </Field>
          <Field label="Unidade">
            <Input value={form.production_unit || ''} onChange={e => patch({ production_unit: e.target.value })} placeholder="m², descidas, m..." disabled={isLocked} />
          </Field>
        </div>
        <Field label="Situação Final">
          <Input value={form.final_situation || ''} onChange={e => patch({ final_situation: e.target.value })} placeholder="Ex: Concluído, Em andamento, Aguardando material..." disabled={isLocked} />
        </Field>
        <Field label="Pendências">
          <Input value={form.pending_items || ''} onChange={e => patch({ pending_items: e.target.value })} placeholder="Itens pendentes para continuação..." disabled={isLocked} />
        </Field>
      </div>

      {/* Assinaturas */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(109,86,232,0.04)', border: '1px solid rgba(109,86,232,0.14)' }}>
        <div className="flex items-center gap-2 mb-1">
          <PenTool className="w-4 h-4" style={{ color: '#6D56E8' }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6D56E8' }}>Assinaturas Digitais</p>
        </div>
        {[
          { field: 'signature_worker',      label: 'Assinatura do Colaborador', placeholder: 'Nome completo do colaborador' },
          { field: 'signature_responsible', label: 'Assinatura do Responsável', placeholder: 'Nome do responsável de campo' },
          { field: 'signature_supervisor',  label: 'Assinatura do Supervisor',  placeholder: 'Nome do supervisor' },
          { field: 'signature_client',      label: 'Assinatura do Cliente/Fiscal (opcional)', placeholder: 'Nome do cliente ou fiscal' },
        ].map(s => (
          <div key={s.field} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0`}
              style={{ background: form[s.field] ? 'rgba(0,217,154,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${form[s.field] ? 'rgba(0,217,154,0.45)' : 'rgba(255,255,255,0.15)'}` }}>
              {form[s.field] && <CheckCircle2 className="w-3 h-3" style={{ color: '#00D99A' }} />}
            </div>
            <Input placeholder={`${s.placeholder}...`} value={form[s.field] || ''} onChange={e => {
              const upd = { [s.field]: e.target.value };
              if (!form.signature_at) upd.signature_at = new Date().toISOString();
              patch(upd);
            }} disabled={isLocked} className="flex-1" />
          </div>
        ))}
        {form.signature_worker && (
          <p className="text-[10px]" style={{ color: '#4A5568' }}>
            "Declaro que as informações acima refletem as atividades executadas em campo na data informada."
          </p>
        )}
      </div>
    </div>
  );
}