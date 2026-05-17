import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Package, Clock } from 'lucide-react';

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ emoji, title, color = '#14B8D4', children }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}28` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Material row ──────────────────────────────────────────────────────────────
function MaterialRow({ mat, item, onToggle, onQty, disabled }) {
  const selected = !!item;
  const qty = item?.quantity_used ?? 1;
  const available = mat.quantity_available ?? 0;
  const overStock = selected && qty > available;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
      style={{
        background: selected ? 'rgba(109,86,232,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${overStock ? 'rgba(220,55,55,0.45)' : selected ? 'rgba(109,86,232,0.30)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Toggle */}
      <div
        onClick={() => !disabled && onToggle(mat)}
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={{
          background: selected ? 'rgba(109,86,232,0.30)' : 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${selected ? '#6D56E8' : 'rgba(255,255,255,0.12)'}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {selected && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#6D56E8' }} />}
      </div>

      {/* Name + stock */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{mat.name}</p>
        <p className="text-[10px]" style={{ color: overStock ? '#DC3737' : '#4A5568' }}>
          Estoque: {available} {mat.unit || 'un'}{overStock ? ' ⚠ insuficiente' : ''}
        </p>
      </div>

      {/* Qty stepper */}
      {selected && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => !disabled && onQty(mat.id, qty - 1, available)}
            disabled={disabled || qty <= 1}
            className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >−</button>
          <input
            type="number"
            min={1}
            max={available}
            value={qty}
            onChange={e => !disabled && onQty(mat.id, Number(e.target.value), available)}
            disabled={disabled}
            className="w-14 text-center text-sm font-bold rounded-lg h-8"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${overStock ? 'rgba(220,55,55,0.55)' : 'rgba(255,255,255,0.12)'}`,
              color: overStock ? '#DC3737' : '#fff',
            }}
          />
          <button
            onClick={() => !disabled && onQty(mat.id, qty + 1, available)}
            disabled={disabled || qty >= available}
            className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >+</button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function StepCloseDay({ form, patch }) {
  const isLocked = form.locked || form.approval_status === 'approved';
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const enabled = !!workspaceId;

  // ── Contracts ──
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', workspaceId],
    queryFn: () => db.Contract.list(),
    staleTime: 30000,
    enabled,
  });
  const contract = contracts.find(c => c.id === form.contract_id);
  const previstas = contract?.total_descidas_previstas ?? 0;
  const executadas = contract?.total_descidas_executadas ?? 0;
  const saldo = Math.max(0, previstas - executadas);
  const descidas = form.descidas_realizadas ?? 0;
  const descidasError = previstas > 0 && descidas > saldo;

  // ── Materials ──
  const { data: materials = [] } = useQuery({
    queryKey: ['materials', workspaceId],
    queryFn: () => db.Material.list(),
    staleTime: 30000,
    enabled,
  });
  const consumables = useMemo(() => materials.filter(m => m.type === 'consumivel'), [materials]);
  const consumption = form.material_consumption ?? [];

  const getItem = (id) => consumption.find(c => c.material_id === id) ?? null;

  const toggleMat = (mat) => {
    const existing = getItem(mat.id);
    if (existing) {
      patch({ material_consumption: consumption.filter(c => c.material_id !== mat.id) });
    } else {
      patch({
        material_consumption: [...consumption, { material_id: mat.id, material_name: mat.name, quantity_used: 1 }],
      });
    }
  };

  const updateQty = (matId, qty, available) => {
    const safe = Math.min(Math.max(1, Math.floor(qty) || 1), available);
    patch({ material_consumption: consumption.map(c => c.material_id === matId ? { ...c, quantity_used: safe } : c) });
  };

  const stockError = consumption.some(c => {
    const mat = materials.find(m => m.id === c.material_id);
    return mat && c.quantity_used > (mat.quantity_available ?? 0);
  });

  // ── End time + hours ──
  const calcHours = (end) => {
    const s = form.start_time; if (!s || !end) return 0;
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, +((eh * 60 + em - sh * 60 - sm) / 60).toFixed(2));
  };
  const onEndTime = (val) => {
    const h = calcHours(val);
    const w = (form.workers_present ?? []).length || 1;
    patch({ end_time: val, total_hours_team: +(h * w).toFixed(2) });
  };

  const safetyOk = form.nr35_completed && form.anchor_verified && form.ppe_inspected && form.supervisor_confirmed;

  // ── Progress preview ──
  const newExec = executadas + descidas;
  const progressPct = previstas > 0 ? Math.min(100, Math.round((newExec / previstas) * 100)) : 0;
  const currentPct = previstas > 0 ? Math.min(100, Math.round((executadas / previstas) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔒</span>
        <div>
          <h2 className="text-white font-bold text-lg">Encerrar Jornada</h2>
          <p className="text-xs" style={{ color: '#718096' }}>Registre produção e consumíveis — processo leva &lt;30s</p>
        </div>
      </div>

      {isLocked && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ background: 'rgba(220,55,55,0.08)', border: '1px solid rgba(220,55,55,0.30)' }}>
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm font-bold text-red-400">Diário aprovado — edição bloqueada</p>
        </div>
      )}

      {/* ── Horário de saída ── */}
      <Section emoji="⏱" title="Horário de Encerramento" color="#14B8D4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: '#718096' }}>Entrada</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
              <Input type="time" value={form.start_time ?? ''} readOnly className="pl-9 opacity-50" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Saída *</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#14B8D4' }} />
              <Input type="time" value={form.end_time ?? ''} onChange={e => onEndTime(e.target.value)} className="pl-9" disabled={isLocked} />
            </div>
          </div>
        </div>
        {form.total_hours_team > 0 && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#00D99A' }}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">{form.total_hours_team}h</span>
            <span style={{ color: '#718096' }}>registradas para {(form.workers_present ?? []).length || 1} colaborador(es)</span>
          </div>
        )}
      </Section>

      {/* ── PRODUÇÃO: Descidas ── */}
      <Section emoji="📉" title="Produção do Dia — Descidas Realizadas" color="#14B8D4">
        {contract ? (
          <div className="flex items-center gap-4 text-xs flex-wrap mb-1">
            <span style={{ color: '#718096' }}>Previstas: <strong className="text-white">{previstas}</strong></span>
            <span style={{ color: '#718096' }}>Já exec.: <strong style={{ color: '#00D99A' }}>{executadas}</strong></span>
            <span style={{ color: '#718096' }}>Saldo: <strong style={{ color: saldo > 0 ? '#14B8D4' : '#DC3737' }}>{saldo}</strong></span>
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#4A5568' }}>Selecione um contrato no Passo 1 para ver saldo.</p>
        )}

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={saldo > 0 ? saldo : undefined}
            value={descidas || ''}
            onChange={e => patch({ descidas_realizadas: Math.max(0, Math.floor(Number(e.target.value)) || 0) })}
            disabled={isLocked}
            placeholder="0"
            className="flex-1 h-14 rounded-2xl text-center text-3xl font-black"
            style={{
              background: 'rgba(20,184,212,0.06)',
              border: `2px solid ${descidasError ? 'rgba(220,55,55,0.60)' : 'rgba(20,184,212,0.30)'}`,
              color: descidasError ? '#DC3737' : '#14B8D4',
              outline: 'none',
            }}
          />
          <div className="text-xs text-center" style={{ color: '#718096' }}>
            <div className="text-lg font-black" style={{ color: '#14B8D4' }}>descidas</div>
            <div>hoje</div>
          </div>
        </div>

        {descidasError && (
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: 'rgba(220,55,55,0.10)', color: '#DC3737', border: '1px solid rgba(220,55,55,0.25)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" /> Excede saldo disponível ({saldo} restantes). Reduzir valor.
          </div>
        )}

        {/* Progress preview */}
        {descidas > 0 && previstas > 0 && !descidasError && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.14)' }}>
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: '#718096' }}>Progresso do contrato após salvar</span>
              <span className="font-bold" style={{ color: '#14B8D4' }}>{currentPct}% → {progressPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #14B8D4, #00D99A)' }} />
            </div>
          </div>
        )}
      </Section>

      {/* ── CONSUMÍVEIS ── */}
      <Section emoji="🧰" title="Consumíveis Utilizados" color="#6D56E8">
        {stockError && (
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: 'rgba(220,55,55,0.10)', color: '#DC3737', border: '1px solid rgba(220,55,55,0.25)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0" /> Quantidade excede estoque disponível — corrija antes de encerrar.
          </div>
        )}

        {consumables.length === 0 ? (
          <p className="text-xs" style={{ color: '#4A5568' }}>
            <Package className="inline w-4 h-4 mr-1" />
            Nenhum consumível cadastrado. Acesse Materiais → tipo "consumivel".
          </p>
        ) : (
          <div className="space-y-2">
            {consumables.map(mat => (
              <MaterialRow
                key={mat.id}
                mat={mat}
                item={getItem(mat.id)}
                onToggle={toggleMat}
                onQty={updateQty}
                disabled={isLocked}
              />
            ))}
          </div>
        )}

        {consumption.length > 0 && (
          <p className="text-[11px] text-right" style={{ color: '#6D56E8' }}>
            {consumption.length} item(ns) selecionado(s)
          </p>
        )}
      </Section>

      {/* ── Ocorrências (rápido) ── */}
      <Section emoji="⚠️" title="Ocorrências" color="#E87D00">
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'delay_occurred', label: 'Houve atraso?', color: '#E87D00' },
            { key: 'incident_occurred', label: 'Houve incidente?', color: '#DC3737' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => !isLocked && patch({ [key]: !form[key] })}
              disabled={isLocked}
              className="rounded-xl py-3 text-sm font-semibold transition-all"
              style={{
                background: form[key] ? `${color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${form[key] ? `${color}50` : 'rgba(255,255,255,0.08)'}`,
                color: form[key] ? color : '#718096',
              }}
            >
              {form[key] ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
        {form.delay_occurred && (
          <textarea
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,125,0,0.25)', color: '#fff', minHeight: 52 }}
            placeholder="Motivo do atraso..."
            value={form.delay_reason ?? ''}
            onChange={e => patch({ delay_reason: e.target.value })}
            disabled={isLocked}
          />
        )}
        {form.incident_occurred && (
          <textarea
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(220,55,55,0.25)', color: '#fff', minHeight: 52 }}
            placeholder="Descrição do incidente..."
            value={form.incident_description ?? ''}
            onChange={e => patch({ incident_description: e.target.value })}
            disabled={isLocked}
          />
        )}
      </Section>

      {/* ── Assinatura supervisor ── */}
      <Section emoji="✍️" title="Assinatura do Supervisor" color="#6D56E8">
        <Input
          placeholder="Nome completo do supervisor"
          value={form.supervisor_signature ?? ''}
          onChange={e => patch({ supervisor_signature: e.target.value })}
          disabled={isLocked}
          style={{ borderColor: form.supervisor_signature ? 'rgba(0,217,154,0.45)' : undefined }}
        />
        {form.supervisor_signature && (
          <p className="text-[11px] flex items-center gap-1" style={{ color: '#00D99A' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
          </p>
        )}
      </Section>

      {/* ── Status segurança ── */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          background: safetyOk ? 'rgba(0,217,154,0.07)' : 'rgba(220,55,55,0.07)',
          border: `1px solid ${safetyOk ? 'rgba(0,217,154,0.22)' : 'rgba(220,55,55,0.22)'}`,
        }}
      >
        {safetyOk
          ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#00D99A' }} />
          : <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#DC3737' }} />
        }
        <p className="text-sm font-semibold" style={{ color: safetyOk ? '#00D99A' : '#DC3737' }}>
          {safetyOk ? 'Segurança OK — pronto para encerrar.' : 'Checkpoints de segurança incompletos. Volte ao Passo 1.'}
        </p>
      </div>
    </div>
  );
}
