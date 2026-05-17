import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Download, CheckCircle2, Camera, FileText, PenTool, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppointmentPDFExport from './AppointmentPDFExport';

const TABS = [
  { id: 'summary',    label: '📋 Resumo',    icon: FileText },
  { id: 'photos',     label: '📷 Fotos',     icon: Camera },
  { id: 'report',     label: '📝 Reporte',   icon: FileText },
  { id: 'signatures', label: '✍️ Assinaturas', icon: PenTool },
  { id: 'history',    label: '🕐 Histórico', icon: History },
];

const STATUS_CFG = {
  not_started: { label: 'Não Iniciado', color: '#718096' },
  in_progress: { label: 'Em Andamento', color: '#14B8D4' },
  photo_pending: { label: 'Foto Pendente', color: '#E87D00' },
  executing: { label: 'Em Execução', color: '#6D56E8' },
  report_pending: { label: 'Reporte Pendente', color: '#E87D00' },
  awaiting_approval: { label: 'Ag. Aprovação', color: '#14B8D4' },
  approved: { label: 'Aprovado', color: '#00D99A' },
  rejected: { label: 'Reprovado', color: '#DC3737' },
};

function Chip({ label, value, color }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-lg font-black" style={{ color: color || '#fff' }}>{value || '—'}</div>
      <div className="text-[10px] mt-0.5" style={{ color: '#718096' }}>{label}</div>
    </div>
  );
}

function PhotoCompare({ before, after }) {
  if (!before && !after) return null;
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl overflow-hidden p-3" style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.18)' }}>
      <div>
        <p className="text-[10px] font-bold mb-1.5" style={{ color: '#E87D00' }}>ANTES</p>
        {before ? <img src={before.url} className="w-full h-40 object-cover rounded-xl" style={{ border: '2px solid rgba(232,125,0,0.4)' }} /> : <div className="h-40 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.10)' }}><span style={{ color: '#4A5568' }}>Sem foto</span></div>}
        {before?.caption && <p className="text-[10px] mt-1" style={{ color: '#718096' }}>{before.caption}</p>}
      </div>
      <div>
        <p className="text-[10px] font-bold mb-1.5" style={{ color: '#00D99A' }}>DEPOIS</p>
        {after ? <img src={after.url} className="w-full h-40 object-cover rounded-xl" style={{ border: '2px solid rgba(0,217,154,0.4)' }} /> : <div className="h-40 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.10)' }}><span style={{ color: '#4A5568' }}>Sem foto</span></div>}
        {after?.caption && <p className="text-[10px] mt-1" style={{ color: '#718096' }}>{after.caption}</p>}
      </div>
    </div>
  );
}

export default function AppointmentDetail({ appointment: a, onBack: _onBack, onEdit }) {
  const [tab, setTab] = useState('summary');
  const [showPDF, setShowPDF] = useState(false);

  const st = STATUS_CFG[a.status] || STATUS_CFG.not_started;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header card */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.94),rgba(6,10,22,0.97))', border: '1px solid rgba(20,184,212,0.15)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-white font-bold text-lg">{a.employee_name || '—'}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#A0AEC0' }}>{a.employee_role || '—'}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}40` }}>{st.label}</span>
            </div>
            <p className="text-sm" style={{ color: '#718096' }}>
              {a.date ? format(new Date(a.date), "dd 'de' MMMM yyyy", { locale: ptBR }) : '—'} {a.start_time ? `· ${a.start_time}` : ''}{a.end_time ? ` – ${a.end_time}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {!a.locked && <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5"><Edit2 className="w-4 h-4" /> Editar</Button>}
            <Button size="sm" onClick={() => setShowPDF(true)} className="gap-1.5"><Download className="w-4 h-4" /> PDF</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Chip label="Horas" value={`${a.total_hours || 0}h`} color="#14B8D4" />
          <Chip label="Progresso" value={`${a.progress || 0}%`} color="#00D99A" />
          <Chip label="Fotos Antes" value={(a.photos_before || []).length} color="#E87D00" />
          <Chip label="Fotos Depois" value={(a.photos_after || []).length} color="#6D56E8" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={tab === t.id
              ? { background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.35)', color: '#14B8D4' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }
            }>{t.label}</button>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(255,255,255,0.07)' }}>

        {/* SUMMARY */}
        {tab === 'summary' && (
          <div className="space-y-4">
            {[
              { label: 'Contrato', value: a.contract_id },
              { label: 'Atividade', value: a.activity_id },
              { label: 'Local', value: a.location },
              { label: 'Condição Inicial', value: a.initial_condition },
              { label: 'Observação Inicial', value: a.initial_observation },
              { label: 'Situação Final', value: a.final_situation },
              { label: 'Descrição Final', value: a.final_description },
              { label: 'Produção', value: a.production_qty ? `${a.production_qty} ${a.production_unit || ''}` : null },
              { label: 'Pendências', value: a.pending_items },
            ].map(f => f.value ? (
              <div key={f.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#718096' }}>{f.label}</p>
                <p className="text-sm text-white">{f.value}</p>
              </div>
            ) : null)}
          </div>
        )}

        {/* PHOTOS */}
        {tab === 'photos' && (
          <div className="space-y-4">
            <PhotoCompare before={(a.photos_before || [])[0]} after={(a.photos_after || [])[0]} />
            {['photos_before', 'photos_during', 'photos_after'].map(type => {
              const photos = a[type] || [];
              const labels = { photos_before: '🔴 Antes', photos_during: '🟡 Durante', photos_after: '🟢 Depois' };
              if (!photos.length) return null;
              return (
                <div key={type}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A0AEC0' }}>{labels[type]}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <img src={p.url} className="w-full h-32 object-cover" />
                        {p.caption && <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[9px] text-white" style={{ background: 'linear-gradient(transparent,rgba(0,0,0,0.8))' }}>{p.caption}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REPORT */}
        {tab === 'report' && (
          <div className="space-y-3">
            {[
              { label: 'O que foi realizado', value: a.report_what_was_done },
              { label: 'Avanço', value: a.report_progress },
              { label: 'Impedimentos', value: a.report_impediments },
              { label: 'Riscos', value: a.report_risks },
              { label: 'Incidentes', value: a.report_incidents },
              { label: 'Materiais', value: a.report_materials },
              { label: 'Equipamentos', value: a.report_equipment },
              { label: 'Condição de Segurança', value: a.report_safety_condition },
              { label: 'Obs. Colaborador', value: a.report_worker_observations },
              { label: 'Obs. Responsável', value: a.report_responsible_observations },
              { label: 'Pendências', value: a.report_pending_items },
              { label: 'Próxima Ação', value: a.report_next_action },
            ].map(f => f.value ? (
              <div key={f.label} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#718096' }}>{f.label}</p>
                <p className="text-sm text-white whitespace-pre-wrap">{f.value}</p>
              </div>
            ) : null)}
            {a.report_rework && <div className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: 'rgba(220,55,55,0.10)', color: '#DC3737' }}>⚠️ Houve retrabalho</div>}
          </div>
        )}

        {/* SIGNATURES */}
        {tab === 'signatures' && (
          <div className="space-y-3">
            {[
              { label: 'Colaborador', value: a.signature_worker },
              { label: 'Responsável de Campo', value: a.signature_responsible },
              { label: 'Supervisor', value: a.signature_supervisor },
              { label: 'Cliente / Fiscal', value: a.signature_client },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.value ? 'rgba(0,217,154,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.value ? 'rgba(0,217,154,0.12)' : 'rgba(255,255,255,0.05)' }}>
                  {s.value ? <CheckCircle2 className="w-4 h-4" style={{ color: '#00D99A' }} /> : <PenTool className="w-4 h-4" style={{ color: '#4A5568' }} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>{s.label}</p>
                  <p className="text-sm font-semibold" style={{ color: s.value ? '#fff' : '#4A5568' }}>{s.value || 'Não assinado'}</p>
                </div>
              </div>
            ))}
            {a.signature_at && <p className="text-xs text-center" style={{ color: '#4A5568' }}>Assinado em {format(new Date(a.signature_at), "dd/MM/yyyy HH:mm")}</p>}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="space-y-2">
            {(a.audit_trail || []).length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: '#4A5568' }}>Nenhum histórico registrado</p>
            ) : (
              [...(a.audit_trail || [])].reverse().map((t, i) => (
                <div key={i} className="flex gap-3 items-start rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#14B8D4', boxShadow: '0 0 6px rgba(20,184,212,0.6)' }} />
                  <div>
                    <p className="text-xs font-semibold text-white capitalize">{t.action}</p>
                    <p className="text-[10px]" style={{ color: '#718096' }}>{t.user} · {t.timestamp ? format(new Date(t.timestamp), "dd/MM/yyyy HH:mm") : '—'}</p>
                    {t.details && <p className="text-[10px] mt-0.5" style={{ color: '#4A5568' }}>{t.details}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showPDF && <AppointmentPDFExport appointment={a} onClose={() => setShowPDF(false)} />}
    </div>
  );
}
