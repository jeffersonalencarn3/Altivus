import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, PlayCircle, AlertTriangle, ChevronRight, Minus, Plus, Users, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CHECKLIST_ITEMS = [
  { id: 'permissao',    label: 'Permissão de trabalho liberada' },
  { id: 'documentos',  label: 'Documentos operacionais OK' },
  { id: 'equipamentos',label: 'Equipamentos verificados' },
  { id: 'epis',        label: 'EPIs conferidos' },
  { id: 'materiais',   label: 'Materiais disponíveis' },
];

export default function CheckinModal({ open, onClose, onConfirm, activity, team, alreadyStarted, loading }) {
  const [step, setStep] = useState(1); // 1 = checklist, 2 = descidas
  const [checked, setChecked] = useState({});
  const [descidas, setDescidas] = useState(activity?.descents_planned || 10);

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const allChecked = CHECKLIST_ITEMS.every(i => checked[i.id]);
  const now = new Date();

  // Estimativa: cada descida ~7min em média
  const minutosPorDescida = activity?.time_per_descent
    ? activity.time_per_descent * 60
    : 7;
  const totalMinutos = Math.round(descidas * minutosPorDescida);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  const tempoStr = `${horas}h ${minutos.toString().padStart(2, '0')}m`;

  const alpinistas = activity?.num_alpinistas || 1;
  const areaM2 = activity?.area_m2 || 0;

  const handleConfirm = () => {
    onConfirm({ checklist: checked, descidas_planejadas_hoje: descidas });
    setChecked({});
    setStep(1);
    setDescidas(activity?.descents_planned || 10);
  };

  const handleClose = () => {
    setChecked({});
    setStep(1);
    setDescidas(activity?.descents_planned || 10);
    onClose();
  };

  const adjustDescidas = (delta) => {
    setDescidas(prev => Math.max(1, prev + delta));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden" style={{
        background: 'linear-gradient(160deg, rgba(8,14,30,0.99) 0%, rgba(4,8,18,1) 100%)',
        border: '1px solid rgba(20,184,212,0.25)',
        boxShadow: '0 0 60px rgba(20,184,212,0.12), 0 24px 80px rgba(0,0,0,0.9)',
      }}>

        {/* Neon top edge */}
        <div className="h-px w-full" style={{
          background: 'linear-gradient(90deg, transparent, rgba(20,184,212,0.8), rgba(109,86,232,0.5), transparent)'
        }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,217,154,0.12)', border: '1px solid rgba(0,217,154,0.3)' }}>
              <PlayCircle className="w-4 h-4" style={{ color: '#00D99A' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#718096' }}>
                {step === 1 ? 'ETAPA 1 de 2 — Checklist' : 'ETAPA 2 de 2 — Planejamento do Dia'}
              </p>
              <h2 className="text-base font-black text-white leading-tight">
                {step === 1 ? 'Check-in Operacional' : 'Iniciar Execução do Dia'}
              </h2>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%', background: 'linear-gradient(90deg, #00D99A, #14B8D4)' }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: '#14B8D4' }}>{step}/2</span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">

          {alreadyStarted ? (
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(232,125,0,0.10)', border: '1px solid rgba(232,125,0,0.30)' }}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#E87D00' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#E87D00' }}>Atividade já iniciada hoje</p>
                <p className="text-xs mt-1" style={{ color: '#A0AEC0' }}>
                  Não é possível fazer check-in duas vezes no mesmo dia para a mesma equipe e atividade.
                </p>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              {/* Info da atividade */}
              <div className="rounded-xl p-3" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <p className="text-sm font-semibold text-white truncate">{activity?.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>
                  Equipe: <span style={{ color: '#14B8D4' }}>{team?.name || '—'}</span>
                  &nbsp;·&nbsp;
                  {format(now, "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: '#718096' }}>
                  Verificação obrigatória
                </p>
                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map(item => (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                      style={{
                        background: checked[item.id] ? 'rgba(0,217,154,0.07)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${checked[item.id] ? 'rgba(0,217,154,0.28)' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      {checked[item.id]
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
                        : <Circle       className="w-4 h-4 shrink-0" style={{ color: '#2D3748' }} />
                      }
                      <span className="text-sm" style={{ color: checked[item.id] ? '#E2E8F0' : '#718096' }}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {!allChecked && (
                <p className="text-[11px] text-center" style={{ color: '#4A5568' }}>
                  Confirme todos os itens para prosseguir
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!allChecked}
                  className="flex-1 gap-2 font-bold"
                  style={allChecked ? {
                    background: 'linear-gradient(135deg,#14B8D4,#6D56E8)',
                    color: '#fff'
                  } : {}}
                >
                  Próxima etapa <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Info resumo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 flex items-center gap-2"
                  style={{ background: 'rgba(20,184,212,0.07)', border: '1px solid rgba(20,184,212,0.18)' }}>
                  <Users className="w-4 h-4 shrink-0" style={{ color: '#14B8D4' }} />
                  <div>
                    <p className="text-xs font-black text-white">{alpinistas}</p>
                    <p className="text-[10px]" style={{ color: '#718096' }}>alpinistas</p>
                  </div>
                </div>
                <div className="rounded-xl p-3 flex items-center gap-2"
                  style={{ background: 'rgba(109,86,232,0.07)', border: '1px solid rgba(109,86,232,0.18)' }}>
                  <Layers className="w-4 h-4 shrink-0" style={{ color: '#6D56E8' }} />
                  <div>
                    <p className="text-xs font-black text-white">{areaM2 > 0 ? `${areaM2}m²` : '—'}</p>
                    <p className="text-[10px]" style={{ color: '#718096' }}>área planejada</p>
                  </div>
                </div>
              </div>

              {/* Seletor de descidas */}
              <div className="rounded-2xl p-5 text-center"
                style={{
                  background: 'rgba(0,217,154,0.04)',
                  border: '1px solid rgba(0,217,154,0.20)',
                  boxShadow: 'inset 0 0 40px rgba(0,217,154,0.03)',
                }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#718096' }}>
                  Quantas descidas serão executadas hoje?
                </p>

                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={() => adjustDescidas(-1)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                    <Minus className="w-5 h-5 text-white" />
                  </button>

                  <div className="min-w-[80px]">
                    <input
                      type="number"
                      min={1}
                      value={descidas}
                      onChange={e => setDescidas(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center text-4xl font-black bg-transparent border-none outline-none text-white"
                      style={{ caretColor: '#00D99A' }}
                    />
                    <p className="text-[10px] mt-1" style={{ color: '#4A5568' }}>descidas</p>
                  </div>

                  <button
                    onClick={() => adjustDescidas(1)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: 'rgba(0,217,154,0.12)',
                      border: '1px solid rgba(0,217,154,0.30)',
                    }}>
                    <Plus className="w-5 h-5" style={{ color: '#00D99A' }} />
                  </button>
                </div>

                {/* Estimativa */}
                <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-xs font-black" style={{ color: '#14B8D4' }}>{tempoStr}</p>
                    <p className="text-[10px]" style={{ color: '#4A5568' }}>tempo estimado</p>
                  </div>
                  <div>
                    <p className="text-xs font-black" style={{ color: '#6D56E8' }}>
                      {activity?.descents_planned ? `${descidas}/${activity.descents_planned}` : `${descidas}`}
                    </p>
                    <p className="text-[10px]" style={{ color: '#4A5568' }}>meta prevista</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button
                  onClick={handleConfirm}
                  disabled={loading || descidas < 1}
                  className="flex-1 gap-2 font-bold"
                  style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B14' }}
                >
                  <PlayCircle className="w-4 h-4" />
                  {loading ? 'Iniciando...' : 'Iniciar Execução'}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Bottom edge */}
        <div className="h-px w-full" style={{
          background: 'linear-gradient(90deg, transparent, rgba(109,86,232,0.4), transparent)'
        }} />
      </DialogContent>
    </Dialog>
  );
}