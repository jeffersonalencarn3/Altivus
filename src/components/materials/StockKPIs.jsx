import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function StockKPIs({ materials }) {
  const total = materials.length;
  const critical = materials.filter(m => (m.quantity_available || 0) <= (m.low_stock_threshold || 5)).length;
  const low = materials.filter(m => {
    const qty = m.quantity_available || 0;
    const min = m.low_stock_threshold || 5;
    return qty > min && qty <= min * 2;
  }).length;
  const ok = total - critical - low;

  const cards = [
    { label: 'Total de Materiais', value: total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Estoque OK', value: ok, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Estoque Baixo', value: low, icon: TrendingDown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Estoque Crítico', value: critical, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg shrink-0 ${c.bg}`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}