/**
 * Modal que pergunta ao usuário se deseja gerar o Relatório Operacional Final
 * após concluir o check-out final de uma atividade.
 */
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, X, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { reportService } from '@/services/reportService';
import { invalidateGroup } from '@/services/serviceUtils';

export default function GenerateReportModal({ open, onClose, activity, sessions = [], team: _team, employees = [], attendanceRecords = [] }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const user = await base44.auth.me();
      await reportService.generateOperationalReport(db, {
        workspaceId,
        activity,
        sessions,
        employees,
        attendanceRecords,
        user,
      });
      invalidateGroup(qc, workspaceId, 'operationalReports');
      setDone(true);
      toast.success('Relatório gerado com sucesso!');
    } catch (e) {
      toast.error('Erro ao gerar relatório: ' + e.message);
    }
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.99),rgba(6,10,22,1))', border: '1px solid rgba(20,184,212,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70">
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#00D99A' }} />
            <p className="text-white font-bold text-lg">Relatório Gerado!</p>
            <p className="text-xs mt-1.5 mb-5" style={{ color: '#718096' }}>
              O relatório operacional foi criado e está disponível na Central de Relatórios.
            </p>
            <Button onClick={onClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,212,0.12)', border: '1px solid rgba(20,184,212,0.25)' }}>
                <FileText className="w-5 h-5" style={{ color: '#14B8D4' }} />
              </div>
              <div>
                <p className="text-white font-bold">Gerar Relatório Operacional</p>
                <p className="text-xs" style={{ color: '#718096' }}>Relatório final da atividade concluída</p>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold text-white truncate">{activity?.title}</p>
              <p className="text-[11px]" style={{ color: '#718096' }}>
                {sessions.filter(s => s.status === 'finalizado').length} sessão(ões) · {activity?.progress || 0}% progresso
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {[
                  '✓ Dados da atividade',
                  '✓ Equipe executora',
                  '✓ Fotos',
                  '✓ Métricas operacionais',
                  '✓ Sessões de execução',
                ].map(item => (
                  <span key={item} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,217,154,0.08)', color: '#00D99A' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 text-sm" disabled={generating}>
                Gerar depois
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="flex-1 text-sm gap-1.5"
                style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff', fontWeight: 700 }}>
                {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar agora</>}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
