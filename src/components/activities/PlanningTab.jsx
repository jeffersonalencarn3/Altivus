/**
 * PlanningTab — Aba de Planejamento do painel de atividade
 * Exibe métricas automáticas baseadas no BLOCK_DATABASE e planningEngine
 */
import React, { useState } from 'react';
import { calcularPrevisao, PARAMS } from '@/lib/planningEngine';
import { getBlockArea } from '@/lib/blockDatabase';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/useWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, Users, Clock, Calendar, AlertTriangle,
  Layers, RefreshCw, Zap, BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addBusinessDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { activityService } from '@/services/activityService';
import { invalidateGroup } from '@/services/serviceUtils';

export default function PlanningTab({ activity, sessions = [], teams = [], onRefresh }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const qc = useQueryClient();

  const [editAlpinistas, setEditAlpinistas] = useState(false);
  const [newAlpinistas, setNewAlpinistas]   = useState(activity?.num_alpinistas || 1);
  const [saving, setSaving]                 = useState(false);

  const previsao = calcularPrevisao(activity, sessions);
  const team     = teams.find(t => t.id === activity.team_id);

  // m² do bloco — da base canônica OU do que foi salvo
  const areaCanonica = getBlockArea(activity.tipo_servico, activity.bloco_nome);
  const area = areaCanonica || activity.area_m2 || 0;

  // Produtividade de referência: 1 / 1.33 ≈ 0.75 desc/h
  const prodRef = 1 / PARAMS.tempo_por_descida_horas;
  const prodReal = previsao.produtividade_real;
  const prodPct  = prodReal !== null ? Math.round((prodReal / prodRef) * 100) : null;

  // Previsão de conclusão
  const diasRestantes = previsao.dias_restantes_calc;
  const dataPrevisao  = activity.start_date
    ? addBusinessDays(new Date(activity.start_date), (activity.dias_planejados || 0))
    : null;

  // Alertas automáticos de replanejamento
  const eventos = [];
  if (previsao.atrasado && activity.status !== 'completed')
    eventos.push({ tipo: 'atraso', msg: 'Atividade com previsão de atraso baseada na produtividade real.' });
  if (prodReal !== null && prodReal < prodRef * 0.7)
    eventos.push({ tipo: 'produtividade', msg: 'Produtividade real abaixo de 70% da referência — possível retrabalho ou baixa equipe.' });
  if (previsao.alpinistas_necessarios !== null && (activity.num_alpinistas || 1) < previsao.alpinistas_necessarios)
    eventos.push({ tipo: 'equipe', msg: `Equipe insuficiente — recomendado ${previsao.alpinistas_necessarios} alpinista(s) para cumprir o prazo.` });

  /* ── Ajuste de alpinistas com recálculo automático ── */
  const handleUpdateAlpinistas = async () => {
    const n = Number(newAlpinistas);
    if (n < 1) return;
    setSaving(true);
    try {
      await activityService.updatePlanningTeam(db, { activity, area, numAlpinistas: n });
      invalidateGroup(qc, workspaceId, 'activities');
      toast.success('Equipe e prazo recalculados automaticamente');
      setEditAlpinistas(false);
      onRefresh?.();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">

      {/* ── Área Total — card hero ── */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,184,212,0.10) 0%, rgba(8,14,30,0.95) 60%)',
          border: '1px solid rgba(20,184,212,0.28)',
          boxShadow: '0 4px 24px rgba(20,184,212,0.08), 0 0 0 1px rgba(20,184,212,0.04)',
        }}
      >
        {/* ambient */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(20,184,212,0.15) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,212,0.45), transparent)' }} />

        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4" style={{ color: '#14B8D4' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#14B8D4' }}>
            {activity.tipo_servico === 'telhado' ? '🏗 Telhado' : '🏢 Fachada'} — {activity.bloco_nome || '—'}
          </span>
          {areaCanonica > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(0,217,154,0.10)', color: '#00D99A', border: '1px solid rgba(0,217,154,0.22)' }}>
              Banco de dados ALTIVUS
            </span>
          )}
        </div>
        <p className="text-[10px] font-medium mb-2" style={{ color: '#718096' }}>ÁREA TOTAL</p>
        <p className="text-4xl font-black text-white leading-none">
          {area ? area.toLocaleString('pt-BR') : '—'}
          <span className="text-xl font-semibold ml-2" style={{ color: '#718096' }}>m²</span>
        </p>
      </div>

      {/* ── Grid de métricas principais ── */}
      <div className="grid grid-cols-2 gap-3">
        <PlanCard
          icon={<BarChart2 className="w-4 h-4" />}
          label="Descidas Planejadas"
          value={activity.descents_planned || 0}
          sub={`${previsao.descidas_realizadas} realizadas`}
          color="#14B8D4"
        />
        <PlanCard
          icon={<Clock className="w-4 h-4" />}
          label="Horas Totais"
          value={activity.tempo_total_horas ? `${activity.tempo_total_horas}h` : '—'}
          sub={`${previsao.horas_trabalhadas}h trabalhadas`}
          color="#6D56E8"
        />
        <PlanCard
          icon={<Calendar className="w-4 h-4" />}
          label="Dias Planejados"
          value={activity.dias_planejados || '—'}
          sub={dataPrevisao ? `Previsão: ${format(dataPrevisao, 'dd/MM/yyyy', { locale: ptBR })}` : ''}
          color="#E87D00"
        />
        <PlanCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Produtividade Ref."
          value={`${prodRef.toFixed(2)} desc/h`}
          sub="padrão contratual"
          color="#00D99A"
        />
      </div>

      {/* ── Previsão Inteligente (só aparece após execução real) ── */}
      {prodReal !== null && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'rgba(0,217,154,0.04)',
            border: `1px solid ${previsao.atrasado ? 'rgba(252,82,82,0.25)' : 'rgba(0,217,154,0.20)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: previsao.atrasado ? '#FC5252' : '#00D99A' }} />
            <span className="text-xs font-bold uppercase tracking-wider"
              style={{ color: previsao.atrasado ? '#FC5252' : '#00D99A' }}>
              Previsão Inteligente
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <IntelCard
              label="Produtividade Real"
              value={`${prodReal.toFixed(2)} desc/h`}
              sub={prodPct !== null ? `${prodPct}% do padrão` : ''}
              color={prodPct !== null && prodPct < 70 ? '#FC5252' : '#00D99A'}
            />
            <IntelCard
              label="Dias Restantes"
              value={`~${diasRestantes} dias`}
              sub={previsao.atrasado ? 'ATRASO PREVISTO' : 'no prazo'}
              color={previsao.atrasado ? '#FC5252' : '#00D99A'}
            />
            <IntelCard
              label="Horas Trabalhadas"
              value={`${previsao.horas_trabalhadas}h`}
              color="#14B8D4"
            />
            <IntelCard
              label="Progresso"
              value={`${previsao.progresso_pct}%`}
              sub={`${previsao.descidas_realizadas}/${activity.descents_planned || 0} descidas`}
              color={previsao.progresso_pct >= 100 ? '#00D99A' : '#14B8D4'}
            />
          </div>

          {/* Barra de progresso animada */}
          <div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${previsao.progresso_pct}%`,
                  background: previsao.atrasado
                    ? 'linear-gradient(90deg, #FC5252, #E87D00)'
                    : 'linear-gradient(90deg, #14B8D4, #00D99A)',
                  boxShadow: previsao.atrasado ? '0 0 6px rgba(252,82,82,0.5)' : '0 0 6px rgba(0,217,154,0.5)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Equipe / alpinistas ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(109,86,232,0.05)', border: '1px solid rgba(109,86,232,0.18)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: '#6D56E8' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6D56E8' }}>Equipe</span>
        </div>

        {team && (
          <p className="text-[11px] mb-2 font-medium" style={{ color: '#A0AEC0' }}>
            {team.name}
          </p>
        )}

        {editAlpinistas ? (
          <div className="flex items-center gap-2">
            <Input
              type="number" min={1} value={newAlpinistas}
              onChange={e => setNewAlpinistas(e.target.value)}
              className="w-20 h-8 text-sm"
            />
            <Button size="sm" onClick={handleUpdateAlpinistas} disabled={saving} className="h-8 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditAlpinistas(false)} className="h-8 text-xs">
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-black text-white">{activity.num_alpinistas || 1}</span>
              <span className="text-xs ml-1.5 font-medium" style={{ color: '#718096' }}>alpinista(s)</span>
            </div>
            {activity.status !== 'completed' && (
              <Button
                size="sm" variant="ghost"
                onClick={() => { setEditAlpinistas(true); setNewAlpinistas(activity.num_alpinistas || 1); }}
                className="h-7 text-[11px] text-primary gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Ajustar equipe
              </Button>
            )}
          </div>
        )}

        {previsao.alpinistas_necessarios !== null &&
          previsao.alpinistas_necessarios > (activity.num_alpinistas || 1) && (
          <p className="text-xs mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
            style={{ color: '#14B8D4', background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.15)' }}>
            <Users className="w-3 h-3 shrink-0" />
            Recomendado: aumentar para {previsao.alpinistas_necessarios} alpinista(s) para cumprir o prazo
          </p>
        )}
      </div>

      {/* ── Alertas de replanejamento ── */}
      {eventos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#718096' }}>
            Alertas de Replanejamento
          </p>
          {eventos.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{
                background: ev.tipo === 'atraso' || ev.tipo === 'produtividade'
                  ? 'rgba(252,82,82,0.07)' : 'rgba(20,184,212,0.07)',
                border: `1px solid ${ev.tipo === 'atraso' || ev.tipo === 'produtividade'
                  ? 'rgba(252,82,82,0.22)' : 'rgba(20,184,212,0.22)'}`,
                color: ev.tipo === 'atraso' || ev.tipo === 'produtividade' ? '#FC5252' : '#14B8D4',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {ev.msg}
            </div>
          ))}
        </div>
      )}

      {/* ── Log de planejamento ── */}
      {(activity.planning_log || []).length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#718096' }}>
            Histórico de Planejamento
          </p>
          <div
            className="space-y-1.5 max-h-36 overflow-y-auto rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {[...activity.planning_log].reverse().map((l, i) => (
              <div key={i} className="flex gap-2 text-[10px]">
                <span className="shrink-0 font-mono" style={{ color: '#4A5568' }}>
                  {new Date(l.timestamp).toLocaleDateString('pt-BR')}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-componentes ── */
function PlanCard({ icon, label, value, sub, color }) {
  return (
    <div
      className="rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: `rgba(${hexToRgb(color)},0.06)`,
        border: `1px solid rgba(${hexToRgb(color)},0.18)`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color }}>{icon}</span>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
      </div>
      <p className="text-xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: '#4A5568' }}>{sub}</p>}
    </div>
  );
}

function IntelCard({ label, value, sub, color = '#FFFFFF' }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
      <p className="text-base font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
    </div>
  );
}

function hexToRgb(hex) {
  const map = {
    '#14B8D4': '20,184,212',
    '#6D56E8': '109,86,232',
    '#00D99A': '0,217,154',
    '#E87D00': '232,125,0',
    '#FC5252': '252,82,82',
  };
  return map[hex] || '255,255,255';
}
