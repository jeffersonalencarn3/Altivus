/**
 * Botão para recalcular todas as atividades não concluídas
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { toast } from 'sonner';
import { activityService } from '@/services/activityService';

export default function RecalcButton({ activities = [], onDone }) {
  const [loading, setLoading] = useState(false);
  const db = useWorkspaceEntities();

  const recalc = async () => {
    const targets = activities.filter(a => a.status !== 'completed' && a.area_m2 > 0);
    if (targets.length === 0) { toast.info('Nenhuma atividade ativa para recalcular'); return; }

    setLoading(true);
    try {
      await activityService.recalculatePlans(db, targets);
      toast.success(`${targets.length} atividade(s) recalculadas`);
      onDone?.();
    } catch (e) {
      toast.error('Erro ao recalcular: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" onClick={recalc} disabled={loading} className="gap-1.5 text-xs">
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      Recalcular Planos
    </Button>
  );
}
