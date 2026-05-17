import React, { useMemo, useState } from 'react';
import { useAllActivityMaterials, useMaterials } from '@/lib/useAppData';
import {
  TrendingDown, TrendingUp, Package, Users, Lightbulb, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

function parseD(d) { return d ? new Date(d + 'T00:00:00') : null; }

const TYPE_CFG = {
  warning: { color: '#E87D00', rgb: '232,125,0' },
  success: { color: '#00D99A', rgb: '0,217,154' },
  info:    { color: '#14B8D4', rgb: '20,184,212' },
  danger:  { color: '#FC5252', rgb: '252,82,82' },
};
const PRIORITY_LABEL = { high: 'Crítico', medium: 'Médio', low: 'Info' };

function useInsights(activities, teams) {
  const { data: allActivityMaterials = [] } = useAllActivityMaterials();
  const { data: materials = [] } = useMaterials();

  return useMemo(() => {
    const insights = [];
    const today = new Date();

    const delayed = activities.filter(a =>
      a.status === 'delayed' || (a.end_date && parseD(a.end_date) < today && a.status !== 'completed')
    );
    if (delayed.length > 0) {
      const avgDelay = Math.round(delayed.reduce((sum, a) => {
        return sum + Math.max(0, a.end_date ? differenceInDays(today, parseD(a.end_date)) : 0);
      }, 0) / delayed.length);
      insights.push({
        id: 'delays', type: 'warning', icon: Clock, priority: 'high',
        title: `${delayed.length} atividade${delayed.length > 1 ? 's' : ''} com atraso`,
        description: `Atraso médio de ${avgDelay} dia${avgDelay !== 1 ? 's' : ''}.`,
        list: delayed.sort((a, b) => {
          const da = a.end_date ? differenceInDays(today, parseD(a.end_date)) : 0;
          const db = b.end_date ? differenceInDays(today, parseD(b.end_date)) : 0;
          return db - da;
        }).slice(0, 3).map(a => {
          const days = a.end_date ? Math.max(0, differenceInDays(today, parseD(a.end_date))) : 0;
          return `${a.title} (${days}d)`;
        }),
        suggestion: 'Revisar cronograma e redistribuir recursos.',
      });
    }

    const teamStats = teams.map(team => {
      const acts = activities.filter(a => a.team_id === team.id);
      if (!acts.length) return { team, score: null, completed: 0, total: 0, avgProgress: 0, delayedCount: 0 };
      const completed = acts.filter(a => a.status === 'completed').length;
      const avgProgress = Math.round(acts.reduce((s, a) => s + (a.progress || 0), 0) / acts.length);
      const delayedCount = acts.filter(a => a.status === 'delayed').length;
      return { team, score: avgProgress - delayedCount * 10, completed, total: acts.length, avgProgress, delayedCount };
    }).filter(s => s.score !== null);

    if (teamStats.length >= 2) {
      const sorted = [...teamStats].sort((a, b) => b.score - a.score);
      const best = sorted[0], worst = sorted[sorted.length - 1];
      insights.push({
        id: 'best-team', type: 'success', icon: TrendingUp, priority: 'low',
        title: `Top: ${best.team.name}`,
        description: `${best.avgProgress}% progresso médio, ${best.completed}/${best.total} concluídas.`,
        list: [], suggestion: `Usar ${best.team.name} como referência de processo.`,
      });
      if (worst.delayedCount > 0 || worst.avgProgress < 50) {
        insights.push({
          id: 'worst-team', type: 'warning', icon: TrendingDown, priority: 'medium',
          title: `Atenção: ${worst.team.name}`,
          description: `${worst.avgProgress}% progresso, ${worst.delayedCount} atraso(s).`,
          list: [], suggestion: `Avaliar redistribuição para ${worst.team.name}.`,
        });
      }
    }

    const inProgressByTeam = teams.map(t => ({
      team: t, count: activities.filter(a => a.team_id === t.id && a.status === 'in_progress').length,
    }));
    const avgLoad = inProgressByTeam.length ? inProgressByTeam.reduce((s, t) => s + t.count, 0) / inProgressByTeam.length : 0;
    const overloaded = inProgressByTeam.filter(t => t.count > avgLoad * 1.5 && t.count > 1);
    const idle = inProgressByTeam.filter(t => t.count === 0 && teams.find(tt => tt.id === t.team.id)?.status === 'active');
    if (overloaded.length > 0 && idle.length > 0) {
      insights.push({
        id: 'rebalance', type: 'info', icon: Users, priority: 'medium',
        title: 'Desequilíbrio de carga',
        description: `${overloaded.map(t => t.team.name).join(', ')} sobrecarregadas; ${idle.map(t => t.team.name).join(', ')} ociosas.`,
        list: [], suggestion: 'Redistribuir atividades para equilibrar a carga.',
      });
    }

    const matTotals = {};
    allActivityMaterials.forEach(am => { matTotals[am.material_id] = (matTotals[am.material_id] || 0) + (am.quantity_used || 0); });
    const topMaterials = Object.entries(matTotals).sort(([, a], [, b]) => b - a).slice(0, 3)
      .map(([id, qty]) => { const mat = materials.find(m => m.id === id); return mat ? `${mat.name}: ${qty} ${mat.unit || 'un'}` : null; }).filter(Boolean);
    if (topMaterials.length > 0) {
      insights.push({
        id: 'top-materials', type: 'info', icon: Package, priority: 'low',
        title: 'Materiais mais consumidos', description: 'Itens com maior uso:',
        list: topMaterials, suggestion: 'Garantir estoque adequado para evitar paralisações.',
      });
    }

    const order = { high: 0, medium: 1, low: 2 };
    return insights.sort((a, b) => order[a.priority] - order[b.priority]);
  }, [activities, teams, allActivityMaterials, materials]);
}

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CFG[insight.type] || TYPE_CFG.info;
  const Icon = insight.icon;

  return (
    <div className="rounded-xl px-4 py-3 transition-all duration-200"
      style={{ background: `rgba(${cfg.rgb},0.06)`, border: `1px solid rgba(${cfg.rgb},0.18)` }}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `rgba(${cfg.rgb},0.14)`, border: `1px solid rgba(${cfg.rgb},0.28)` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white">{insight.title}</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
              style={{ background: `rgba(${cfg.rgb},0.14)`, color: cfg.color, border: `1px solid rgba(${cfg.rgb},0.22)` }}>
              {PRIORITY_LABEL[insight.priority]}
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{insight.description}</p>
          {insight.list?.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {insight.list.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        {insight.suggestion && (
          <button onClick={() => setExpanded(e => !e)}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{ color: '#4A5568', background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.color = cfg.color; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4A5568'; }}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {expanded && insight.suggestion && (
        <div className="mt-2.5 ml-10 flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#E8C200' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{insight.suggestion}</p>
        </div>
      )}
    </div>
  );
}

export default function InsightsPanel({ activities = [], teams = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const insights = useInsights(activities, teams);

  if (insights.length === 0) return null;
  const critical = insights.filter(i => i.priority === 'high').length;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.96))',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(232,194,0,0.12)', border: '1px solid rgba(232,194,0,0.25)' }}>
            <Lightbulb className="w-3.5 h-3.5" style={{ color: '#E8C200' }} />
          </div>
          <span className="text-sm font-bold text-white">Insights Operacionais</span>
          {critical > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252', border: '1px solid rgba(252,82,82,0.22)' }}>
              {critical} crítico{critical > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px] font-medium" style={{ color: '#4A5568' }}>{insights.length} análise{insights.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => setCollapsed(c => !c)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#718096' }}>
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
      {!collapsed && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
        </div>
      )}
    </div>
  );
}