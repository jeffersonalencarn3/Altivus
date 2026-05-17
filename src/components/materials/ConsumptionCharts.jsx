import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts';
import { format, subWeeks, subMonths, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function ConsumptionCharts({ activityMaterials, materials, period }) {
  // Build consumption over time (by week or month)
  const timeData = useMemo(() => {
    const now = new Date();
    if (period === 'semana') {
      const intervals = eachWeekOfInterval({ start: subWeeks(now, 7), end: now });
      return intervals.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const total = activityMaterials
          .filter(am => {
            const d = new Date(am.created_date);
            return d >= weekStart && d <= weekEnd;
          })
          .reduce((sum, am) => sum + (am.quantity_used || 0), 0);
        return { label: format(weekStart, 'dd/MM', { locale: ptBR }), total };
      });
    } else {
      const intervals = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
      return intervals.map(monthStart => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        const total = activityMaterials
          .filter(am => {
            const d = new Date(am.created_date);
            return d >= monthStart && d <= monthEnd;
          })
          .reduce((sum, am) => sum + (am.quantity_used || 0), 0);
        return { label: format(monthStart, 'MMM/yy', { locale: ptBR }), total };
      });
    }
  }, [activityMaterials, period]);

  // Ranking: most used materials
  const ranking = useMemo(() => {
    const map = {};
    activityMaterials.forEach(am => {
      if (!map[am.material_id]) map[am.material_id] = 0;
      map[am.material_id] += am.quantity_used || 0;
    });
    return Object.entries(map)
      .map(([id, total]) => {
        const mat = materials.find(m => m.id === id);
        return { name: mat?.name || id, total, unit: mat?.unit || '' };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [activityMaterials, materials]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Consumo por {period === 'semana' ? 'Semana' : 'Mês'}</CardTitle>
        </CardHeader>
        <CardContent>
          {timeData.every(d => d.total === 0) ? (
            <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Sem dados de consumo no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [v, 'Consumo (un)']}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ranking — Mais Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Sem dados de consumo registrados</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, _, props) => [`${v} ${props.payload.unit}`, 'Total consumido']}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {ranking.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}