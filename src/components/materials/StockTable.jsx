import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, AlertTriangle, Package } from 'lucide-react';

const TYPE_LABELS = { epi: 'EPI', ferramenta: 'Ferramenta', consumivel: 'Consumível' };
const TYPE_COLORS = {
  epi: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  ferramenta: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  consumivel: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
};

function getStatus(m) {
  const qty = m.quantity_available || 0;
  const min = m.low_stock_threshold || 5;
  if (qty <= min) return 'critical';
  if (qty <= min * 2) return 'low';
  return 'ok';
}

const STATUS_CONFIG = {
  ok: { label: 'OK', className: 'bg-green-500/10 text-green-500 border-green-500/30' },
  low: { label: 'Baixo', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  critical: { label: 'Crítico', className: 'bg-red-500/10 text-red-500 border-red-500/30', icon: true },
};

export default function StockTable({ materials, activityMaterials, onEdit, onDelete }) {
  // Calculate total consumed per material
  const consumedMap = activityMaterials.reduce((acc, am) => {
    acc[am.material_id] = (acc[am.material_id] || 0) + (am.quantity_used || 0);
    return acc;
  }, {});

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Material</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Disponível</TableHead>
              <TableHead className="text-xs">Mínimo</TableHead>
              <TableHead className="text-xs">Total Consumido</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-6 h-6 opacity-40" />
                    Nenhum material encontrado
                  </div>
                </TableCell>
              </TableRow>
            ) : materials.map(m => {
              const status = getStatus(m);
              const cfg = STATUS_CONFIG[status];
              const consumed = consumedMap[m.id] || 0;
              const pct = Math.min(100, Math.round(((m.quantity_available || 0) / Math.max(1, (m.quantity_available || 0) + consumed)) * 100));

              return (
                <TableRow key={m.id} className={`hover:bg-muted/30 ${status === 'critical' ? 'bg-red-500/5' : status === 'low' ? 'bg-yellow-500/5' : ''}`}>
                  <TableCell className="text-sm font-medium">{m.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[m.type]}`}>
                      {TYPE_LABELS[m.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 min-w-[80px]">
                      <span className={`text-sm font-semibold ${status === 'critical' ? 'text-red-500' : status === 'low' ? 'text-yellow-500' : ''}`}>
                        {m.quantity_available} {m.unit}
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.low_stock_threshold ?? 5} {m.unit}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{consumed > 0 ? `${consumed} ${m.unit}` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] flex items-center gap-1 w-fit ${cfg.className}`}>
                      {cfg.icon && <AlertTriangle className="w-2.5 h-2.5" />}
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(onEdit || onDelete) ? (
                      <div className="flex gap-1">
                        {onEdit && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(m)}><Pencil className="w-3 h-3" /></Button>}
                        {onDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(m.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}